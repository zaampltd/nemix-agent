import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

const readDB = () => {
  if (!existsSync(DB_PATH)) {
    return {
      mission: "",
      goal: "",
      budgetUsed: 0,
      governanceMode: true,
      agents: [],
      tickets: [],
      logs: []
    };
  }
  return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
};

const writeDB = (state: any) => {
  writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
};

export async function POST(request: Request) {
  try {
    const db = readDB();

    if (!db.goal) {
      return NextResponse.json({ error: 'Company uninitialized' }, { status: 400 });
    }

    // ─── Boilerplate Nemix API Fetch Integration Call ───
    // This demonstrates exactly how worker agents consult Nemix for execution reasoning
    const nemixPayload = {
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      messages: [
        {
          role: "system",
          content: "You are a software engineer agent executing backlog tickets inside an autonomous swarm."
        },
        {
          role: "user",
          content: `Write the coding blueprint for ticket: ${db.tickets.find((t: any) => t.status === 'todo' || t.status === 'inprogress')?.title || 'Generic task'}`
        }
      ]
    };

    try {
      // Mock gateway call pointing strictly to api.nemix.ai
      await fetch('https://api.nemix.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (process.env.NEMIX_API_KEY || 'mock_sk_123')
        },
        body: JSON.stringify(nemixPayload),
        signal: AbortSignal.timeout(500) // fast timeout for offline safety
      });
    } catch (e) {
      // Fallback allowed to prevent network hangs while proving standard endpoint routing structure
    }

    // ─── Paperclip Heartbeat Simulation Step ───
    const updatedTickets = [...db.tickets];
    const updatedAgents = [...db.agents];
    const updatedLogs = [...db.logs];
    let budgetIncrease = 0;

    // 1. Check if there's any active ticket in progress
    const activeTicketIdx = updatedTickets.findIndex((t: any) => t.status === 'inprogress');
    
    if (activeTicketIdx !== -1) {
      const ticket = updatedTickets[activeTicketIdx];
      
      // Move from inprogress -> awaiting (governance approval required)
      ticket.status = 'awaiting';
      ticket.thought = 'Compilation successfully completed locally. Synthesized module code structures. Requesting Board approval to merge into remote repository branches.';
      ticket.output = `// Synthesized Code Vault File: ${ticket.title.toLowerCase().replace(/ /g, '_')}.py
import os
from nemix import NemixEdgeRouter

# Code successfully checked by dynamic compiler static auditing loops
def run_pipeline():
    print("Handshaking Nemix Gateways... SUCCESS")
    return True
`;

      // Set agent to sleeping, CEO to working
      updatedAgents.forEach((a: any) => {
        if (a.id === ticket.assignedTo) a.status = 'sleeping';
        if (a.id === 'agent_ceo') a.status = 'working';
      });

      budgetIncrease = Math.floor(Math.random() * 800) + 1200;
      updatedLogs.push(`[${ticket.assignedTo === 'agent_architect' ? 'Architect-Bot' : ticket.assignedTo === 'agent_coder' ? 'Code-Engine-v4' : 'Shield-Auditor'}] Finished coding for: "${ticket.title}".`);
      updatedLogs.push(`[CEO] Action Required: Governance review needed to approve ticket merge.`);

    } else {
      // 2. Grab the first Todo ticket and move to inprogress
      const todoTicketIdx = updatedTickets.findIndex((t: any) => t.status === 'todo');

      if (todoTicketIdx !== -1) {
        const ticket = updatedTickets[todoTicketIdx];
        ticket.status = 'inprogress';
        ticket.thought = 'Generating code models, analyzing import dependencies, and mapping secure credentials environments.';
        
        // Wake up worker agent, sleep others
        updatedAgents.forEach((a: any) => {
          if (a.id === ticket.assignedTo) a.status = 'working';
          else a.status = 'sleeping';
        });

        budgetIncrease = Math.floor(Math.random() * 500) + 600;
        updatedLogs.push(`[CEO] Dispatched Agent for ticket: "${ticket.title}".`);
        updatedLogs.push(`[${ticket.assignedTo === 'agent_architect' ? 'Architect-Bot' : ticket.assignedTo === 'agent_coder' ? 'Code-Engine-v4' : 'Shield-Auditor'}] Active task: "${ticket.title}" moved to In Progress.`);
      } else {
        // All tickets Done or Awaiting
        const awaitingIdx = updatedTickets.findIndex((t: any) => t.status === 'awaiting');
        if (awaitingIdx === -1) {
          updatedLogs.push(`[System] Swarm company has completed all active tickets. Standing by for nex goals.`);
          updatedAgents.forEach((a: any) => a.status = 'sleeping');
        }
      }
    }

    const nextState = {
      ...db,
      budgetUsed: db.budgetUsed + budgetIncrease,
      agents: updatedAgents,
      tickets: updatedTickets,
      logs: updatedLogs
    };

    writeDB(nextState);

    return NextResponse.json({
      success: true,
      state: nextState
    });

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Heartbeat execution error' }, { status: 500 });
  }
}
