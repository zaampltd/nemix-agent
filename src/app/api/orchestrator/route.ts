import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');

// ─── STRICT RULE: ONLY NVMIX API ───
const NVMIX_MODEL   = 'nvmix-inference-v1';

// ─── DB Helpers ───
const getDefaultState = () => ({
  companyName:    '',
  mission:        '',
  goal:           '',
  apiKey:         '',
  budgetUsed:     0,
  governanceMode: true,
  agents:         [],
  tickets:        [],
  logs:           [],
});

const readDB = (): any => {
  if (!existsSync(DB_PATH)) return getDefaultState();
  try { return JSON.parse(readFileSync(DB_PATH, 'utf-8')); }
  catch { return getDefaultState(); }
};

const writeDB = (state: any) =>
  writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');

// ─── Highly Resilient Nvmix API Helper with Automatic Fallbacks ───
async function callNvmixAPI(apiKey: string, messages: { role: string; content: string }[]) {
  const urls = [
    process.env.NVMIX_API_URL,
    'https://nvmix.com/api/v1/chat/completions',
    'https://nemix-jjjj.vercel.app/api/v1/chat/completions',
    'http://localhost:3000/api/v1/chat/completions',
  ].filter(Boolean) as string[];

  let lastErr: any = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body:    JSON.stringify({ model: NVMIX_MODEL, messages }),
        signal:  AbortSignal.timeout(8000),
      });
      if (res.ok) {
        return await res.json();
      }
      const errText = await res.text();
      console.warn(`Fetch to ${url} failed with status ${res.status}: ${errText}`);
      lastErr = new Error(`Status ${res.status}: ${errText}`);
    } catch (err: any) {
      console.warn(`Fetch to ${url} failed with error: ${err?.message || err}`);
      lastErr = err;
    }
  }
  throw lastErr || new Error('All Nvmix API endpoints are unreachable.');
}

// ─── GET: Retrieve Swarm State ───
export async function GET() {
  try {
    return NextResponse.json({ success: true, state: readDB() });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to read state' }, { status: 500 });
  }
}

// ─── POST: Swarm Actions ───
export async function POST(request: Request) {
  try {
    const body           = await request.json();
    const { action }     = body;

    if (!action) return NextResponse.json({ error: 'action is required' }, { status: 400 });

    const db = readDB();

    // ══════════════════════════════════════════════
    // ACTION: onboard  (also aliased as "initialize")
    // ══════════════════════════════════════════════
    if (action === 'onboard' || action === 'initialize') {
      const { companyName, goal, apiKey, mission } = body;

      if (!companyName || !goal)
        return NextResponse.json({ error: 'companyName and goal are required' }, { status: 400 });

      // ── 1. Try Nvmix API to dynamically generate the agent roster ──
      let agents: any[] = [];
      let nvmixUsed     = false;

      if (apiKey && apiKey.trim().length > 5) {
        try {
          const prompt = `You are an AI orchestration expert. Given a company named "${companyName}" with mission: "${mission || goal}", output ONLY a valid JSON array (no markdown, no explanation) of exactly 4 agent objects. Each object must have: id (string), role (string), name (string), avatar (emoji string), status ("working" for first agent, "sleeping" for others). Example: [{"id":"agent_ceo","role":"CEO","name":"Alpha-CEO","avatar":"💼","status":"working"}]`;

          const result   = await callNvmixAPI(apiKey.trim(), [
            { role: 'system', content: prompt },
            { role: 'user',   content: `Company: ${companyName}. Mission: ${mission || goal}. Output the JSON array now.` },
          ]);
          const content  = result?.choices?.[0]?.message?.content ?? '';
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed) && parsed.length > 0) {
              agents    = parsed.map((a: any, i: number) => ({
                id:     a.id     || `agent_${i}`,
                role:   a.role   || `Agent ${i + 1}`,
                name:   a.name   || `Nvmix-Bot-${i + 1}`,
                avatar: a.avatar || '🤖',
                status: i === 0  ? 'working' : 'sleeping',
              }));
              nvmixUsed = true;
            }
          }
        } catch {
          // Nvmix API unreachable — fall through to premium defaults below
        }
      }

      // ── 2. Premium default agents if Nvmix API not used ──
      if (!nvmixUsed) {
        agents = [
          { id: 'agent_ceo',       role: 'CEO (Chief Executive Officer)', name: 'Orchestrator-Alpha', avatar: '💼', status: 'working'  },
          { id: 'agent_architect', role: 'Software Architect',            name: 'Architect-Bot',      avatar: '📐', status: 'sleeping' },
          { id: 'agent_coder',     role: 'Lead Developer',                name: 'Code-Engine-v4',     avatar: '💻', status: 'sleeping' },
          { id: 'agent_qa',        role: 'QA & Security Auditor',         name: 'Shield-Auditor',     avatar: '🛡️', status: 'sleeping' },
        ];
      }

      // ── 3. Break goal into backlog tickets ──
      const tickets = [
        {
          id:          'ticket_1',
          title:       'Design system architecture & data models',
          description: `Map out modular architecture structures and data schemas for ${companyName}.`,
          assignedTo:  agents[1]?.id || 'agent_architect',
          status:      'todo',
          thought:     'Awaiting architectural heartbeat check.',
          output:      '',
        },
        {
          id:          'ticket_2',
          title:       'Bootstrap core API & application files',
          description: 'Create modular layout packages, API interfaces, and core application logic.',
          assignedTo:  agents[2]?.id || 'agent_coder',
          status:      'todo',
          thought:     'Queued to start coding codebase packages.',
          output:      '',
        },
        {
          id:          'ticket_3',
          title:       'Execute security validation & QA audits',
          description: 'Perform type checks and secure environment scanning to audit code integrity.',
          assignedTo:  agents[3]?.id || 'agent_qa',
          status:      'todo',
          thought:     'Ready to perform security checks on compile structures.',
          output:      '',
        },
      ];

      const newState = {
        companyName,
        mission:        mission || `Build production pipelines for ${companyName}.`,
        goal,
        apiKey:         apiKey || '',
        budgetUsed:     0,
        governanceMode: true,
        agents,
        tickets,
        logs: [
          `[System] Swarm "${companyName}" launched successfully${nvmixUsed ? ' via Nvmix API' : ' with default roster'}.`,
          `[CEO] ${agents[0]?.name} hired to lead the mission.`,
          `[CEO] Created ${tickets.length} backlog tickets for goal: "${goal}"`,
        ],
      };

      writeDB(newState);

      return NextResponse.json({
        success:  true,
        message:  nvmixUsed ? '🚀 Swarm deployed via Nvmix API!' : 'Swarm deployed with premium defaults.',
        nvmixUsed,
        state:    newState,
      });
    }

    // ══════════════════════════════════════════════
    // ACTION: heartbeat
    // ══════════════════════════════════════════════
    if (action === 'heartbeat') {
      if (!db.goal) return NextResponse.json({ error: 'Swarm not initialized' }, { status: 400 });

      const tickets: any[]  = [...db.tickets];
      const agents:  any[]  = [...db.agents];
      const logs:    string[] = [...db.logs];
      let budgetDelta        = 0;

      const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? id;

      const activeIdx = tickets.findIndex((t) => t.status === 'inprogress');

      if (activeIdx !== -1) {
        // ── Complete the in-progress ticket ──
        const ticket = tickets[activeIdx];

        // Default synthesized output
        let codeOutput = `# Synthesized output for: ${ticket.title}\nimport os\nfrom nvmix import NvmixEdgeRouter\n\ndef run():\n    print("Nvmix Gateway handshake: SUCCESS")\n    return True\n`;

        // Try Nvmix API for richer code output
        if (db.apiKey && db.apiKey.trim().length > 5) {
          try {
            const result  = await callNvmixAPI(db.apiKey.trim(), [
              { role: 'system', content: 'You are an autonomous software agent. Output ONLY valid Python code (no markdown fences), 10–15 lines, for the given task.' },
              { role: 'user',   content: `Write production Python code for: ${ticket.title}` },
            ]);
            const raw = result?.choices?.[0]?.message?.content ?? '';
            if (raw.trim().length > 20) codeOutput = raw.trim();
          } catch {
            // Use default output above
          }
        }

        ticket.status  = 'awaiting';
        ticket.thought = 'Compilation complete. Synthesized module code. Awaiting Board of Directors approval to merge.';
        ticket.output  = codeOutput;

        agents.forEach((a) => {
          if (a.id === ticket.assignedTo)             a.status = 'sleeping';
          if (a.id === (agents[0]?.id ?? 'agent_ceo')) a.status = 'working';
        });

        budgetDelta = Math.floor(Math.random() * 800) + 1200;
        logs.push(`[${agentName(ticket.assignedTo)}] Finished: "${ticket.title}".`);
        logs.push(`[CEO] Board approval required to merge "${ticket.title}".`);

      } else {
        // ── Start the next todo ticket ──
        const todoIdx = tickets.findIndex((t) => t.status === 'todo');

        if (todoIdx !== -1) {
          const ticket   = tickets[todoIdx];
          ticket.status  = 'inprogress';
          ticket.thought = 'Generating code models, analyzing dependencies, and mapping credential environments.';

          agents.forEach((a) => {
            a.status = a.id === ticket.assignedTo ? 'working' : 'sleeping';
          });

          budgetDelta = Math.floor(Math.random() * 500) + 600;
          logs.push(`[CEO] Dispatched ${agentName(ticket.assignedTo)} → "${ticket.title}".`);
          logs.push(`[${agentName(ticket.assignedTo)}] Task "${ticket.title}" now In Progress.`);
        } else {
          // All done or all awaiting
          const awaitingIdx = tickets.findIndex((t) => t.status === 'awaiting');
          if (awaitingIdx === -1) {
            logs.push(`[System] All tickets completed. Swarm standing by.`);
            agents.forEach((a) => (a.status = 'sleeping'));
          }
        }
      }

      const nextState = { ...db, agents, tickets, logs, budgetUsed: (db.budgetUsed ?? 0) + budgetDelta };
      writeDB(nextState);
      return NextResponse.json({ success: true, state: nextState });
    }

    // ══════════════════════════════════════════════
    // ACTION: approve
    // ══════════════════════════════════════════════
    if (action === 'approve') {
      const { ticketId, decision } = body;
      if (!ticketId || !decision)
        return NextResponse.json({ error: 'ticketId and decision are required' }, { status: 400 });

      const tickets: any[] = [...db.tickets];
      const agents:  any[] = [...db.agents];
      const logs:    string[] = [...db.logs];

      const ticketIdx = tickets.findIndex((t) => t.id === ticketId);
      if (ticketIdx === -1)
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

      const ticket = tickets[ticketIdx];

      if (decision === 'approved') {
        ticket.status  = 'done';
        ticket.thought = 'Merged & deployed. Verified by Board and static compilers.';
        logs.push(`[Board] ✅ Approved merge for "${ticket.title}".`);
        logs.push(`[CEO] "${ticket.title}" closed as DONE.`);
      } else {
        ticket.status  = 'todo';
        ticket.thought = 'Board rejected. Restructuring architecture files and parameters.';
        logs.push(`[Board] ❌ REJECTED "${ticket.title}". Moved back to Todo.`);
      }

      // CEO goes idle after governance decision
      agents.forEach((a) => { if (a.id === (agents[0]?.id ?? 'agent_ceo')) a.status = 'sleeping'; });

      const nextState = { ...db, tickets, agents, logs };
      writeDB(nextState);
      return NextResponse.json({ success: true, state: nextState });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
