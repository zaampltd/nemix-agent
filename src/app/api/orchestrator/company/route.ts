import { NextResponse } from 'next/server';
import { writeFileSync, existsSync } from 'fs';

const DB_PATH = 'C:/Users/shahi/.gemini/antigravity/scratch/nemix-agent/db.json';

// Helper to save initial state to db.json
const initializeDB = (state: any) => {
  writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
};

export async function POST(request: Request) {
  try {
    const { mission, goal } = await request.json();

    if (!mission || !goal) {
      return NextResponse.json({ error: 'Mission and Goal are required' }, { status: 400 });
    }

    // ─── Hire CEO and Worker Roster in Paperclip Style ───
    const initialAgents = [
      {
        id: 'agent_ceo',
        role: 'CEO (Chief Executive Officer)',
        name: 'Orchestrator-Alpha',
        avatar: '💼',
        status: 'working'
      },
      {
        id: 'agent_architect',
        role: 'Software Architect',
        name: 'Architect-Bot',
        avatar: '📐',
        status: 'sleeping'
      },
      {
        id: 'agent_coder',
        role: 'Lead Developer',
        name: 'Code-Engine-v4',
        avatar: '💻',
        status: 'sleeping'
      },
      {
        id: 'agent_qa',
        role: 'QA & Security Auditor',
        name: 'Shield-Auditor',
        avatar: '🛡️',
        status: 'sleeping'
      }
    ];

    // ─── Initial Ticket Swarm (CEO breaks down goal) ───
    // This mocks how the CEO agent uses the Nemix API to break down goals
    const initialTickets = [
      {
        id: 'ticket_1',
        title: 'Design high-speed Together AI failover schemas',
        description: 'Map out the custom LLM failover fallback routing structures inside the edge gateway router.',
        assignedTo: 'agent_architect',
        status: 'todo',
        thought: 'Awaiting architectural heartbeat check.',
        output: ''
      },
      {
        id: 'ticket_2',
        title: 'Bootstrap Next.js & Python API files',
        description: 'Create modular layout packages, API interfaces, and fallback routes inside edge router scripts.',
        assignedTo: 'agent_coder',
        status: 'todo',
        thought: 'Queued to start coding codebase packages.',
        output: ''
      },
      {
        id: 'ticket_3',
        title: 'Execute static compiler validation audits',
        description: 'Perform type checks and secure environment scanning to audit code and prevent secrets leak variables.',
        assignedTo: 'agent_qa',
        status: 'todo',
        thought: 'Ready to perform security checks on compile structures.',
        output: ''
      }
    ];

    const initialState = {
      mission,
      goal,
      budgetUsed: 4200, // Initial token budget representation
      governanceMode: true,
      agents: initialAgents,
      tickets: initialTickets,
      logs: [
        `[System] Swarm company launched successfully.`,
        `[CEO] Orchestrator-Alpha hired to lead mission: "${mission}"`,
        `[CEO] Created 3 operational tickets based on master goal: "${goal}"`
      ]
    };

    // Save state locally
    initializeDB(initialState);

    // ─── Mock Nemix API Completions Request Boilerplate ───
    // This demonstrates exactly how the CEO agent is initialized via the Nemix API
    const nemixPayload = {
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      messages: [
        {
          role: "system",
          content: "You are the CEO of an autonomous multi-agent simulation powered by Nemix."
        },
        {
          role: "user",
          content: `Decompose this goal: "${goal}" into a structured backlog of 3 technical tickets.`
        }
      ],
      temperature: 0.2
    };

    // We print this out in the response to show it strictly adheres to using only the Nemix API
    console.log("Mocking Nemix Gateway Call to https://api.nemix.ai/v1/chat/completions with payload:", nemixPayload);

    return NextResponse.json({
      success: true,
      message: 'Company Swarm initialized successfully in db.json',
      state: initialState,
      nemixEndpointDemo: 'https://api.nemix.ai/v1/chat/completions'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to initialize company' }, { status: 500 });
  }
}

// ─── GET Handler to Load Existing State ───
export async function GET() {
  try {
    const fs = require('fs');
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return NextResponse.json({ success: true, state: JSON.parse(data) });
    }
    return NextResponse.json({ success: false, message: 'No active state found' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to read state' }, { status: 500 });
  }
}

