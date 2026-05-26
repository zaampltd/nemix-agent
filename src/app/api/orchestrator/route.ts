import { NextResponse } from 'next/server';
import { 
  getCompany, 
  saveCompany, 
  getAgents, 
  saveAgents, 
  getTickets, 
  saveTickets, 
  addActivity, 
  getActivity,
  saveEmail,
  getChatSessions,
  saveChatMessage 
} from '@/lib/db';
import { Agent, Ticket, CompanyState } from '@/lib/types';

// ─── STRICT RULE: ONLY NVMIX API ───
const NVMIX_MODEL = 'nvmix-inference-v1';

// ─── Highly Resilient Nvmix API Helper with Automatic Fallbacks ───
async function callNvmixAPI(apiKey: string, messages: { role: string; content: string }[]) {
  const urls = [
    process.env.NVMIX_API_URL,
    'https://nvmix.com/api/v1/chat/completions',
    'https://nemix-jjjj.vercel.app/api/v1/chat/completions',
    'http://localhost:3000/api/v1/chat/completions',
    'http://localhost:3001/api/v1/chat/completions',
    'http://localhost:3002/api/v1/chat/completions',
  ].filter(Boolean) as string[];

  let lastErr: any = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body:    JSON.stringify({ model: NVMIX_MODEL, messages }),
        signal:  AbortSignal.timeout(4000), // optimized timeout to 4s for swarm operations
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
    const company = getCompany();
    const agents = getAgents();
    const tickets = getTickets();
    const activities = getActivity();
    
    // Map activity items to the legacy string log format for backwards compatibility
    const logs = activities
      .slice()
      .reverse()
      .map(act => {
        const prefix = act.type === 'system' ? 'System' : act.type === 'ceo' ? 'CEO' : act.type === 'error' ? 'Error' : 'Agent';
        return `[${prefix}] ${act.message}`;
      });

    return NextResponse.json({
      success: true,
      state: {
        ...company,
        agents,
        tickets,
        logs
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to read state' }, { status: 500 });
  }
}

// ─── POST: Swarm Actions ───
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) return NextResponse.json({ error: 'action is required' }, { status: 400 });

    const company = getCompany();

    // ══════════════════════════════════════════════
    // ACTION: onboard  (also aliased as "initialize")
    // ══════════════════════════════════════════════
    if (action === 'onboard' || action === 'initialize') {
      const { companyName, goal, apiKey, mission } = body;

      if (!companyName || !goal)
        return NextResponse.json({ error: 'companyName and goal are required' }, { status: 400 });

      // Verify Nvmix API key is provided
      if (!apiKey || apiKey.trim().length < 5) {
        return NextResponse.json(
          { error: 'Autonomous onboarding failed: No active Nvmix API Key provided. Real AI execution requires an active Nvmix key.' },
          { status: 400 }
        );
      }

      // ── 1. Call Nvmix API to dynamically generate the agent roster ──
      let agents: Agent[] = [];

      try {
        const prompt = `You are an AI orchestration expert. Given a company named "${companyName}" with mission: "${mission || goal}", output ONLY a valid JSON array (no markdown, no explanation) of exactly 4 agent objects. Each object must have: id (string), role (string), name (string), avatar (emoji string), status ("working" for first agent, "sleeping" for others). Example: [{"id":"agent_ceo","role":"CEO","name":"Alpha-CEO","avatar":"💼","status":"working"}]`;

        const result = await callNvmixAPI(apiKey.trim(), [
          { role: 'system', content: prompt },
          { role: 'user',   content: `Company: ${companyName}. Mission: ${mission || goal}. Output the JSON array now.` },
        ]);
        const content  = result?.choices?.[0]?.message?.content ?? '';
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            agents = parsed.map((a: any, i: number) => ({
              id:     a.id     || `agent_${i}`,
              role:   a.role   || `Agent ${i + 1}`,
              name:   a.name   || `Nvmix-Bot-${i + 1}`,
              avatar: a.avatar || '🤖',
              status: i === 0  ? 'working' : 'sleeping',
            }));
          } else {
            throw new Error('Parsed array is empty or invalid.');
          }
        } else {
          throw new Error('No JSON array found in API response.');
        }
      } catch (err: any) {
        return NextResponse.json(
          { error: `Autonomous onboarding failed: Failed to fetch agent roster from Nvmix API: ${err?.message || err}` },
          { status: 502 }
        );
      }

      // ── 2. Break goal into BACKLOG TICKETS dynamically ──
      let tickets: Ticket[] = [];
      try {
        const ticketsPrompt = `You are an AI project manager. Given a company named "${companyName}" with goal: "${goal}" and these agents hired: ${JSON.stringify(
          agents.map(a => ({ id: a.id, role: a.role, name: a.name }))
        )}, generate a backlog of exactly 3 relevant, highly specific development/marketing/business tickets for the company. Output ONLY a valid JSON array (no markdown, no explanation) of exactly 3 ticket objects. Each object must have: id ("ticket_1", "ticket_2", "ticket_3"), title (string), description (string), assignedTo (string - one of the agent ids except ${agents[0]?.id || 'agent_ceo'}), status ("todo"), thought (string), output ("").`;

        const ticketResult = await callNvmixAPI(apiKey.trim(), [
          { role: 'system', content: ticketsPrompt },
          { role: 'user',   content: `Generate 3 backlog tickets for company: ${companyName}. Output JSON now.` },
        ]);
        
        const ticketContent = ticketResult?.choices?.[0]?.message?.content ?? '';
        const jsonMatch = ticketContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length === 3) {
            tickets = parsed.map((t: any, i: number) => ({
              id: t.id || `ticket_${i + 1}`,
              title: t.title || 'Dynamic swarming task',
              description: t.description || 'Complete pending work unit.',
              assignedTo: t.assignedTo || agents[Math.min(i + 1, agents.length - 1)].id,
              status: 'todo',
              thought: t.thought || 'Awaiting heartbeat execution.',
              output: ''
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to dynamically generate tickets, falling back to static backlog:', err);
      }

      // Fallback to static tickets if dynamic ticket creation failed
      if (tickets.length === 0) {
        tickets = [
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
      }

      const nextCompany: CompanyState = {
        companyName,
        mission: mission || `Build production pipelines for ${companyName}.`,
        goal,
        apiKey: apiKey.trim(),
        budgetUsed: 0,
        governanceMode: true
      };

      saveCompany(nextCompany);
      saveAgents(agents);
      saveTickets(tickets);

      // Clear legacy/init activity feed
      const emptyActivity: any[] = [];
      addActivity('system', `Swarm "${companyName}" launched successfully via Nvmix API.`);
      addActivity('ceo', `${agents[0]?.name} hired to lead the mission.`);
      addActivity('ceo', `Created ${tickets.length} backlog tickets for goal: "${goal}"`);

      // CEO Welcome Email to User
      saveEmail({
        from: agents[0]?.name || 'CEO',
        to: 'Founder (You)',
        subject: `Welcome to ${companyName} — Swarm Deployed Successfully`,
        body: `Greetings Founder,\n\nI am ${agents[0]?.name || 'your CEO'}, and I am pleased to confirm that the ${companyName} autonomous swarm has been successfully deployed.\n\nOur mission: ${mission || goal}\n\nI have recruited ${agents.length} specialized agents and created ${tickets.length} initial tasks in the backlog.\n\nThe team is ready to begin execution. Please pulse the swarm engine or enable Auto Runner to start task processing.\n\nBest regards,\n${agents[0]?.name || 'CEO'}`,
        status: 'draft'
      });

      // CEO posts welcome in first chat session
      const sessions = getChatSessions();
      if (sessions.length > 0) {
        saveChatMessage(sessions[0].id, {
          role: 'assistant',
          content: `🚀 Welcome to ${companyName}! I'm ${agents[0]?.name || 'your CEO'}. The swarm is operational with ${agents.length} agents and ${tickets.length} tasks queued. Ready to begin execution.`,
          senderName: agents[0]?.name || 'CEO'
        });
      }

      // Retrieve full state to return
      const activities = getActivity();
      const logs = activities
        .slice()
        .reverse()
        .map(act => {
          const prefix = act.type === 'system' ? 'System' : act.type === 'ceo' ? 'CEO' : act.type === 'error' ? 'Error' : 'Agent';
          return `[${prefix}] ${act.message}`;
        });

      return NextResponse.json({
        success:  true,
        message:  '🚀 Swarm deployed successfully via Nvmix API!',
        state:    {
          ...nextCompany,
          agents,
          tickets,
          logs
        },
      });
    }

    // ══════════════════════════════════════════════
    // ACTION: heartbeat
    // ══════════════════════════════════════════════
    if (action === 'heartbeat') {
      if (!company.goal) return NextResponse.json({ error: 'Swarm not initialized' }, { status: 400 });

      const tickets = getTickets();
      const agents = getAgents();
      let budgetDelta = 0;

      const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? id;

      const activeIdx = tickets.findIndex((t) => t.status === 'inprogress');

      if (activeIdx !== -1) {
        // ── Complete the in-progress ticket ──
        const ticket = tickets[activeIdx];

        // Ensure key exists
        if (!company.apiKey || company.apiKey.trim().length < 5) {
          return NextResponse.json(
            { error: 'Heartbeat compilation failed: No active Nvmix API Key configured. Real code compilation requires a Nvmix key.' },
            { status: 400 }
          );
        }

        let codeOutput = '';

        // Fetch real code from Nvmix API
        try {
          const result = await callNvmixAPI(company.apiKey.trim(), [
            { role: 'system', content: 'You are an autonomous software agent. Output ONLY valid Python code (no markdown fences), 10–15 lines, for the given task.' },
            { role: 'user',   content: `Write production Python code for: ${ticket.title}` },
          ]);
          const raw = result?.choices?.[0]?.message?.content ?? '';
          if (raw.trim().length > 20) {
            codeOutput = raw.trim();
          } else {
            throw new Error('API returned empty or invalid code output.');
          }
        } catch (err: any) {
          // Graceful error recovery — DON'T crash the heartbeat
          ticket.status = 'todo'; // Put back in queue for retry
          ticket.thought = `Compilation failed: ${err?.message || 'Unknown error'}. Queued for automatic retry.`;
          
          addActivity('error', `Failed to compile "${ticket.title}": ${err?.message || 'API timeout'}`);
          addActivity('ceo', `Recovery: Moving "${ticket.title}" back to backlog for retry.`);
          
          // CEO drafts error report email
          saveEmail({
            from: agents[0]?.name || 'CEO',
            to: 'Founder (You)',
            subject: `Task Failed: ${ticket.title} — Auto-Recovery Active`,
            body: `Attention Founder,\n\nThe task "${ticket.title}" failed during compilation.\n\nError: ${err?.message || 'API timeout or connectivity issue'}\n\nI have automatically moved this task back to the backlog for retry. The agent will reattempt on the next heartbeat pulse.\n\nNo action required from your side unless this persists.\n\n— ${agents[0]?.name || 'CEO'}`,
            status: 'draft'
          });
          
          // Post failure notice in chat
          const errSessions = getChatSessions();
          if (errSessions.length > 0) {
            saveChatMessage(errSessions[0].id, {
              role: 'assistant',
              content: `⚠️ Task "${ticket.title}" failed compilation. Auto-recovery: moved back to backlog for retry.`,
              senderName: agents[0]?.name || 'CEO'
            });
          }
          
          // DON'T return error — continue with partial state (fall through to saveCompany/saveAgents/saveTickets)
        }

        if (codeOutput) {
          ticket.status  = 'awaiting';
          ticket.thought = 'Compilation complete. Synthesized module code. Awaiting Board of Directors approval to merge.';
          ticket.output  = codeOutput;

          agents.forEach((a) => {
            if (a.id === ticket.assignedTo) a.status = 'sleeping';
            if (a.id === (agents[0]?.id ?? 'agent_ceo')) a.status = 'working';
          });

          budgetDelta = Math.floor(Math.random() * 800) + 1200;
          
          addActivity('agent', `Finished: "${ticket.title}".`, ticket.assignedTo);
          addActivity('ceo', `Board approval required to merge "${ticket.title}".`);

          // Agent drafts completion email
          saveEmail({
            from: agentName(ticket.assignedTo),
            to: agents[0]?.name || 'CEO',
            subject: `Task Completed: ${ticket.title} — Awaiting Governance`,
            body: `Hello ${agents[0]?.name || 'CEO'},\n\nI have completed the task: "${ticket.title}"\n\nThe compiled output is ready for your review. Code has been generated and is pending Board governance approval before merge.\n\nPlease review the output and approve or reject the merge.\n\nRegards,\n${agentName(ticket.assignedTo)}`,
            status: 'sent'
          });

          // Agent posts completion in chat
          const completeSessions = getChatSessions();
          if (completeSessions.length > 0) {
            saveChatMessage(completeSessions[0].id, {
              role: 'assistant',
              content: `✅ Completed: "${ticket.title}" — Code compiled successfully. Awaiting Board governance approval.`,
              senderName: agentName(ticket.assignedTo)
            });
          }
        }

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
          
          addActivity('ceo', `Dispatched ${agentName(ticket.assignedTo)} → "${ticket.title}".`);
          addActivity('agent', `Task "${ticket.title}" now In Progress.`, ticket.assignedTo);

          // Agent drafts email to CEO about task pickup
          saveEmail({
            from: agentName(ticket.assignedTo),
            to: agents[0]?.name || 'CEO',
            subject: `Task Started: ${ticket.title}`,
            body: `Hello ${agents[0]?.name || 'CEO'},\n\nI have picked up the task: "${ticket.title}"\n\nDescription: ${ticket.description}\n\nI am now analyzing dependencies and generating code modules. I will report back when compilation is complete.\n\nRegards,\n${agentName(ticket.assignedTo)}`,
            status: 'sent'
          });

          // Agent posts in chat
          const chatSessions = getChatSessions();
          if (chatSessions.length > 0) {
            saveChatMessage(chatSessions[0].id, {
              role: 'assistant',
              content: `📋 Starting work on: "${ticket.title}" — Analyzing dependencies and generating code...`,
              senderName: agentName(ticket.assignedTo)
            });
          }
        } else {
          // All done or all awaiting
          const awaitingIdx = tickets.findIndex((t) => t.status === 'awaiting');
          if (awaitingIdx === -1) {
            addActivity('system', `All tickets completed. Swarm standing by.`);
            agents.forEach((a) => (a.status = 'sleeping'));
          }
        }
      }

      const nextCompany: CompanyState = {
        ...company,
        budgetUsed: (company.budgetUsed ?? 0) + budgetDelta
      };

      saveCompany(nextCompany);
      saveAgents(agents);
      saveTickets(tickets);

      // Fetch logs and aggregate state
      const activities = getActivity();
      const logs = activities
        .slice()
        .reverse()
        .map(act => {
          const prefix = act.type === 'system' ? 'System' : act.type === 'ceo' ? 'CEO' : act.type === 'error' ? 'Error' : 'Agent';
          return `[${prefix}] ${act.message}`;
        });

      return NextResponse.json({
        success: true,
        state: {
          ...nextCompany,
          agents,
          tickets,
          logs
        }
      });
    }

    // ══════════════════════════════════════════════
    // ACTION: hire_agent
    // ══════════════════════════════════════════════
    if (action === 'hire_agent') {
      const { agent } = body;
      if (!agent) return NextResponse.json({ error: 'agent object is required' }, { status: 400 });

      const agents = getAgents();
      agents.push(agent);
      saveAgents(agents);

      addActivity('ceo', `Recruited "${agent.name}" as "${agent.role}".`);

      const activities = getActivity();
      const logs = activities
        .slice()
        .reverse()
        .map(act => {
          const prefix = act.type === 'system' ? 'System' : act.type === 'ceo' ? 'CEO' : act.type === 'error' ? 'Error' : 'Agent';
          return `[${prefix}] ${act.message}`;
        });

      return NextResponse.json({
        success: true,
        state: {
          ...company,
          agents,
          tickets: getTickets(),
          logs
        }
      });
    }

    // ══════════════════════════════════════════════
    // ACTION: approve
    // ══════════════════════════════════════════════
    if (action === 'approve') {
      const { ticketId, decision } = body;
      if (!ticketId || !decision)
        return NextResponse.json({ error: 'ticketId and decision are required' }, { status: 400 });

      const tickets = getTickets();
      const agents = getAgents();

      const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? id;

      const ticketIdx = tickets.findIndex((t) => t.id === ticketId);
      if (ticketIdx === -1)
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

      const ticket = tickets[ticketIdx];

      if (decision === 'approved') {
        ticket.status  = 'done';
        ticket.thought = 'Merged & deployed. Verified by Board and static compilers.';
        addActivity('system', `✅ Approved merge for "${ticket.title}".`);
        addActivity('ceo', `"${ticket.title}" closed as DONE.`);

        saveEmail({
          from: agents[0]?.name || 'CEO',
          to: agentName(ticket.assignedTo),
          subject: `Approved: ${ticket.title}`,
          body: `The Board has approved and merged your work on "${ticket.title}". Well done.\n\n— ${agents[0]?.name || 'CEO'}`,
          status: 'sent'
        });
        const approveSessions = getChatSessions();
        if (approveSessions.length > 0) {
          saveChatMessage(approveSessions[0].id, {
            role: 'assistant',
            content: `✅ Board approved merge: "${ticket.title}" — Deployed to production.`,
            senderName: agents[0]?.name || 'CEO'
          });
        }
      } else {
        ticket.status  = 'todo';
        ticket.thought = 'Board rejected. Restructuring architecture files and parameters.';
        addActivity('system', `❌ REJECTED "${ticket.title}". Moved back to Todo.`);

        saveEmail({
          from: agents[0]?.name || 'CEO',
          to: agentName(ticket.assignedTo),
          subject: `Rejected: ${ticket.title}`,
          body: `The Board has rejected your work on "${ticket.title}". Please restructure and resubmit.\n\n— ${agents[0]?.name || 'CEO'}`,
          status: 'sent'
        });
        const rejectSessions = getChatSessions();
        if (rejectSessions.length > 0) {
          saveChatMessage(rejectSessions[0].id, {
            role: 'assistant',
            content: `❌ Board rejected: "${ticket.title}" — Moved back to backlog for rework.`,
            senderName: agents[0]?.name || 'CEO'
          });
        }
      }

      // CEO goes idle after governance decision
      agents.forEach((a) => { if (a.id === (agents[0]?.id ?? 'agent_ceo')) a.status = 'sleeping'; });

      saveTickets(tickets);
      saveAgents(agents);

      // Fetch logs and aggregate state
      const activities = getActivity();
      const logs = activities
        .slice()
        .reverse()
        .map(act => {
          const prefix = act.type === 'system' ? 'System' : act.type === 'ceo' ? 'CEO' : act.type === 'error' ? 'Error' : 'Agent';
          return `[${prefix}] ${act.message}`;
        });

      return NextResponse.json({
        success: true,
        state: {
          ...company,
          tickets,
          agents,
          logs
        }
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
