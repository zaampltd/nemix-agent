import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const DB_PATH = 'C:/:/Users/shahi/.gemini/antigravity/scratch/nemix-agent/db.json';
const CLEAN_PATH = 'C:/Users/shahi/.gemini/antigravity/scratch/nemix-agent/db.json';

const readDB = () => {
  if (!existsSync(CLEAN_PATH)) {
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
  return JSON.parse(readFileSync(CLEAN_PATH, 'utf-8'));
};

const writeDB = (state: any) => {
  writeFileSync(CLEAN_PATH, JSON.stringify(state, null, 2), 'utf-8');
};

export async function POST(request: Request) {
  try {
    const { ticketId, decision } = await request.json();

    if (!ticketId || !decision) {
      return NextResponse.json({ error: 'Ticket ID and Decision are required' }, { status: 400 });
    }

    const db = readDB();
    const updatedTickets = [...db.tickets];
    const updatedLogs = [...db.logs];
    const updatedAgents = [...db.agents];

    const ticketIdx = updatedTickets.findIndex((t: any) => t.id === ticketId);

    if (ticketIdx === -1) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = updatedTickets[ticketIdx];

    if (decision === 'approved') {
      ticket.status = 'done';
      ticket.thought = 'Merged and deployed successfully. Verified by Board of Directors and static compilers.';
      updatedLogs.push(`[Board of Directors] Approved deployment merge for ticket: "${ticket.title}".`);
      updatedLogs.push(`[CEO] Ticket "${ticket.title}" successfully closed as DONE.`);
      
      // Sleep CEO, wake up the next sleeping agent if there are pending todo tickets
      updatedAgents.forEach((a: any) => {
        if (a.id === 'agent_ceo') a.status = 'sleeping';
      });

    } else {
      ticket.status = 'todo'; // reject moves it back to todo backlog
      ticket.thought = 'Board rejected change. Restructuring project architecture files and parameters.';
      updatedLogs.push(`[Board of Directors] REJECTED ticket: "${ticket.title}". Moving back to backlog.`);
      
      updatedAgents.forEach((a: any) => {
        if (a.id === 'agent_ceo') a.status = 'sleeping';
      });
    }

    const nextState = {
      ...db,
      tickets: updatedTickets,
      agents: updatedAgents,
      logs: updatedLogs
    };

    writeDB(nextState);

    return NextResponse.json({
      success: true,
      state: nextState
    });

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Approval processing error' }, { status: 500 });
  }
}
