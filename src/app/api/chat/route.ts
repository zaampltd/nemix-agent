import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const DB_PATH       = path.join(process.cwd(), 'db.json');
const NVMIX_API_URL = 'https://nvmix.com/api/v1/chat/completions';
const NVMIX_MODEL   = 'nvmix-inference-v1';

const readDB = (): any => {
  if (!existsSync(DB_PATH)) return {};
  try { return JSON.parse(readFileSync(DB_PATH, 'utf-8')); }
  catch { return {}; }
};

// ─── Smart Local AI Responder ───
function smartLocalReply(message: string, db: any, agentName: string, agentRole: string): string {
  const lower          = message.toLowerCase().trim();
  const companyName    = db.companyName || 'the company';
  const goal           = db.goal        || 'build a great product';
  const mission        = db.mission     || goal;
  const tickets        = db.tickets     || [];
  const agents         = db.agents      || [];
  const completedCount = tickets.filter((t: any) => t.status === 'done').length;
  const totalCount     = tickets.length;
  const inProgressTicket = tickets.find((t: any) => t.status === 'inprogress');
  const awaitingTicket   = tickets.find((t: any) => t.status === 'awaiting');
  const pendingCount   = tickets.filter((t: any) => t.status === 'todo').length;

  // ── Greetings ──
  if (/^(hi|hello|hey|sup|yo|greetings|howdy|hola|salaam|assalam|aoa)\s*[!.]*$/.test(lower)) {
    return `Hello, Board Member! I am ${agentName}, your ${agentRole} for "${companyName}". The swarm is fully operational with ${agents.length} agents on roster. We have ${totalCount} active tasks — ${completedCount} completed. How may I assist you today?`;
  }

  // ── Wellbeing ──
  if (/(how are you|how r u|how do you do|you okay|you good|you alright|kya haal|kaisa hai|how's it going|hows it going|what's up|whats up|wsp|wassup)/i.test(lower)) {
    const statuses = ['Operating at peak efficiency', 'All systems nominal', 'Running at full capacity', 'Fully operational'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    return `${randomStatus}, thank you for asking. As CEO of "${companyName}", I am focused on our mission: ${mission}. ${inProgressTicket ? `Agent ${agents.find((a:any)=>a.id===inProgressTicket.assignedTo)?.name || 'assigned'} is currently executing "${inProgressTicket.title}".` : `${completedCount}/${totalCount} tasks complete.`} How can I assist you?`;
  }

  // ── Status ──
  if (/(status|progress|update|report|how.*(going|we doing)|tell me|summary)/i.test(lower)) {
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    if (awaitingTicket) {
      return `Swarm status: ${completedCount}/${totalCount} tasks complete (${pct}%). ⚠️ "${awaitingTicket.title}" is awaiting your Board approval before we can proceed. Please review and approve or reject in the Dashboard.`;
    }
    if (inProgressTicket) {
      const agent = agents.find((a: any) => a.id === inProgressTicket.assignedTo);
      return `Swarm progress: ${completedCount}/${totalCount} tasks complete (${pct}%). Currently ${agent?.name || 'an agent'} is actively working on "${inProgressTicket.title}". ${pendingCount} tasks remaining in backlog.`;
    }
    return `All systems standing by. ${completedCount}/${totalCount} tasks complete (${pct}%). ${pendingCount} tasks pending in backlog. Run a heartbeat tick to advance the swarm.`;
  }

  // ── Mission ──
  if (/(mission|goal|what.*build|what.*doing|what.*project|purpose|objective)/i.test(lower)) {
    return `Our mission for "${companyName}": ${mission}. Active goal: ${goal}. We have ${totalCount} tasks scoped to achieve this. ${completedCount > 0 ? `${completedCount} already completed.` : 'Awaiting first heartbeat tick to begin execution.'}`;
  }

  // ── Team ──
  if (/(team|agent|roster|who|crew|staff|members|employees)/i.test(lower)) {
    const agentList = agents.map((a: any) => `${a.name} (${a.role}) — ${a.status === 'working' ? '🟢 Active' : '⚪ Idle'}`).join(', ');
    return `Current swarm roster for "${companyName}" — ${agents.length} agents: ${agentList || 'No agents deployed yet'}. Run a heartbeat tick to activate field operations.`;
  }

  // ── Tickets ──
  if (/(ticket|task|backlog|todo|to-do|work|sprint|kanban)/i.test(lower)) {
    const todoList = tickets.filter((t: any) => t.status === 'todo').map((t: any) => `"${t.title}"`).join(', ');
    return `Backlog summary: ${pendingCount} pending, ${completedCount} done, ${totalCount - pendingCount - completedCount} in flight. Pending: ${todoList || 'none'}. Trigger a heartbeat to advance the pipeline.`;
  }

  // ── Approve ──
  if (/(approv|reject|merge|deploy|sign off|sign-off)/i.test(lower)) {
    if (awaitingTicket) {
      return `"${awaitingTicket.title}" is currently awaiting Board approval. ${awaitingTicket.thought} Navigate to the Dashboard Kanban board to approve or reject this merge.`;
    }
    return `No tasks are currently awaiting Board approval. All completed tasks have been processed. Trigger a heartbeat to advance the next task to completion.`;
  }

  // ── Hire ──
  if (/(hire|recruit|add agent|new agent|more agent)/i.test(lower)) {
    return `To expand the swarm roster, navigate to the Team tab and use the "Hire Agent" panel. You can specify any role and name. Currently we have ${agents.length} agents deployed for "${companyName}".`;
  }

  // ── API ──
  if (/(nvmix|nvmix|api|key|connection|gateway|token)/i.test(lower)) {
    return `The Nvmix AI Gateway is configured for "${companyName}". Your API credentials are securely stored. The swarm orchestration engine routes all agent tasks through the Nvmix pipeline automatically.`;
  }

  // ── Help ──
  if (/(help|what can you do|commands|options|how to)/i.test(lower)) {
    return `I can help you with: 📊 Swarm status & progress, 👥 Agent roster management, 📋 Task & ticket overview, ✅ Board approval decisions, 🏢 Company mission & goals. Just ask me anything about "${companyName}" operations!`;
  }

  // ── Thanks ──
  if (/(thanks|thank you|thx|appreciate|great|good job|well done|nice)/i.test(lower)) {
    return `Acknowledged, Board Member. Continuing operations for "${companyName}" — ${mission}. Standing by for your next directive.`;
  }

  // ── Default ──
  const defaultReplies = [
    `Processing your directive for "${companyName}". Our current focus: ${goal}. ${inProgressTicket ? `Agent is executing "${inProgressTicket.title}".` : `${pendingCount} tasks queued.`} Is there a specific aspect you'd like me to address?`,
    `Understood, Board Member. As ${agentRole} of "${companyName}", I am monitoring all swarm operations. ${completedCount}/${totalCount} tasks complete. How can I be of service?`,
    `Directive received. The swarm for "${companyName}" is ${completedCount === totalCount && totalCount > 0 ? 'mission complete' : 'actively executing'}. ${inProgressTicket ? `Currently working on "${inProgressTicket.title}".` : 'All agents on standby.'} What would you like to know?`,
  ];

  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
}

export async function POST(request: Request) {
  try {
    const { message, channel } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const db          = readDB();
    const apiKey      = db.apiKey?.trim() || '';
    const companyName = db.companyName || 'the company';
    const goal        = db.goal        || 'build a great product';
    const mission     = db.mission     || goal;
    const tickets     = db.tickets     || [];

    // Determine responding agent
    const agentName = channel?.includes('architect') ? 'Architect-Bot'
                    : channel?.includes('dev')        ? 'Code-Engine-v4'
                    : channel?.includes('qa')         ? 'Shield-Auditor'
                    : 'Orchestrator-Alpha (CEO)';

    const agentRole = channel?.includes('architect') ? 'Software Architect'
                    : channel?.includes('dev')        ? 'Lead Developer'
                    : channel?.includes('qa')         ? 'QA & Security Engineer'
                    : 'CEO and Lead Orchestrator';

    // Try Nvmix API first
    if (apiKey.length > 5) {
      try {
        const completedCount = tickets.filter((t: any) => t.status === 'done').length;
        const activeTicket   = tickets.find((t: any) => t.status === 'inprogress');

        const systemPrompt = `You are ${agentName}, the ${agentRole} of an AI swarm company called "${companyName}".
Company mission: ${mission}
Current goal: ${goal}
Task progress: ${completedCount}/${tickets.length} tasks completed.${activeTicket ? `\nCurrently executing: "${activeTicket.title}".` : ''}

Respond concisely and professionally in-character as an AI agent executive. Keep responses under 3 sentences unless asked for code or a detailed report. Be helpful, direct, and intelligent.`;

        const res = await fetch(NVMIX_API_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body:    JSON.stringify({
            model:       NVMIX_MODEL,
            messages:    [
              { role: 'system', content: systemPrompt },
              { role: 'user',   content: message.trim() },
            ],
            max_tokens:  400,
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const data  = await res.json();
          const reply = data?.choices?.[0]?.message?.content?.trim();
          if (reply && reply.length > 0) {
            return NextResponse.json({ success: true, reply, agent: agentName, source: 'nvmix' });
          }
        }
      } catch {
        // API unreachable — fall through to smart local AI
      }
    }

    // Smart local AI fallback
    const reply = smartLocalReply(message, db, agentName, agentRole);
    return NextResponse.json({ success: true, reply, agent: agentName, source: 'local' });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Chat processing error' }, { status: 500 });
  }
}
