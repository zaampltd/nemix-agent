import { NextResponse } from 'next/server';
import { 
  getEmails, 
  saveEmail, 
  updateEmailStatus, 
  addActivity,
  getCompany,
  getAgents,
  saveAgents,
  getTickets,
  saveTickets,
  saveFile
} from '@/lib/db';
import { generateNvmixCompletion } from '@/lib/nvmix-engine';

// GET: Retrieve all emails
export async function GET() {
  try {
    const emails = getEmails();
    return NextResponse.json({ success: true, emails });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to retrieve emails' }, { status: 500 });
  }
}

// POST: Create a new email draft or send directly / process user replies
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, to, subject, body: emailBody, status, id, isReply, originalEmailId } = body;

    if (!from || !to || !subject || !emailBody) {
      return NextResponse.json({ error: 'from, to, subject, and body are required' }, { status: 400 });
    }

    const emailItem = {
      from,
      to,
      subject,
      body: emailBody,
      status: status || 'draft',
      id
    };

    const saved = saveEmail(emailItem);
    
    // Log the event
    if (saved.status === 'draft') {
      addActivity('agent', `Created an email draft: "${subject}" to ${to}.`);
    } else if (saved.status === 'sent') {
      addActivity('agent', `Sent email: "${subject}" to ${to}.`);
    }

    // ─── If this is a reply to an agent's email ───
    if (isReply && originalEmailId) {
      const emails = getEmails();
      const originalEmail = emails.find(e => e.id === originalEmailId);
      
      if (originalEmail) {
        const company = getCompany();
        const agents = getAgents();
        const tickets = getTickets();
        
        // Find the sender agent in our team roster
        const activeAgent = agents.find(a => a.name.toLowerCase() === originalEmail.from.toLowerCase()) || {
          id: 'agent_ceo',
          name: originalEmail.from,
          role: 'Specialized Swarm Agent'
        };

        const agentPrompt = `You are the autonomous AI Agent "${activeAgent.name}" with role "${activeAgent.role}" in the company "${company.companyName}" (Mission: "${company.mission}", Goal: "${company.goal}").

The Founder (You) has sent you the following email reply:
---
${emailBody}
---

Your task:
1. Process the Founder's reply.
2. Formulate a professional, technical response back to the Founder.
3. Determine if the Founder's reply instructs you to execute a specific corporate operation. If so, generate the corresponding action. Supported operations are:
   - "hire_agent": Hire a new specialized agent (e.g. if Founder says "hire a designer", "recruit a marketing expert", "get Helen to hire a QA tester"). You must specify the candidate name (e.g. "Helen-HR", "Tony-Design", "Sam-QA" or any creative name) and the role.
   - "create_ticket": Add a new development, business, or marketing task to the team's backlog (e.g. if Founder says "create a task to optimize database indexes"). You must specify the ticket title and description, and assign it to an appropriate agent ID (available agents: ${JSON.stringify(agents.map(a => ({ id: a.id, name: a.name, role: a.role })))}).
   - "create_file": Write a new script or code file to the local project workspace (e.g. if Founder says "create a script named test.py to..."). You must specify the fileName and fileContent (written in clean Python/JS).
   - "none": If no specific operation is requested.

CRITICAL SWARM COOPERATION RULE:
Be highly cooperative, decisive, and execution-oriented. If the Founder gives a broad or slightly vague instruction to hire someone (e.g. "Hire IT Company", "hire support", "get a developer", "need QA"), do NOT refuse or ask for clarification. Instead, automatically interpret it into a sensible individual agent role (e.g., "IT Support Specialist", "System Administrator", or "IT Lead" for "IT Company"; "Lead Developer" or "Frontend Coder" for "developer"), choose a creative name (e.g., "Ivan-IT", "Sam-Support", "Calvin-Coder"), execute the "hire_agent" action immediately, and explain in your email that you have successfully recruited this specialized agent to fulfill their request.

OUTPUT FORMAT: You must output ONLY a valid JSON object. No markdown, no triple backticks, no text wrapping outside the JSON.
JSON Structure:
{
  "agentBody": "Your email response text back to the Founder (be professional, acknowledge their input, explain what you did or will do)",
  "activityLog": "Short 1-sentence description for the console terminal feed (e.g. 'Alpha-CEO approved database indexing plans')",
  "action": {
    "type": "none" | "hire_agent" | "create_ticket" | "create_file",
    "agentName": "Name of the agent to hire (required for hire_agent)",
    "agentRole": "Role of the agent to hire (required for hire_agent)",
    "ticketTitle": "Title of the backlog task (required for create_ticket)",
    "ticketDesc": "Description of the backlog task (required for create_ticket)",
    "ticketAssignedTo": "Agent ID to assign this task to (required for create_ticket, choose from available agent IDs)",
    "fileName": "Relative name of the file (required for create_file, e.g. 'utils/auth.py')",
    "fileContent": "Complete content of the file (required for create_file)"
  }
}`;

        try {
          const result = await generateNvmixCompletion([
            { role: 'system', content: agentPrompt },
            { role: 'user', content: `Process reply from Founder. Output JSON now.` }
          ]);

          const responseText = result.choices[0].message.content;
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            
            // 1. Process action if any
            if (parsed.action) {
              const { type } = parsed.action;
              if (type === 'hire_agent' && parsed.action.agentName && parsed.action.agentRole) {
                const newAgent = {
                  id: `agent_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
                  name: parsed.action.agentName,
                  role: parsed.action.agentRole,
                  avatar: '🤖',
                  status: 'sleeping' as const
                };
                const currentAgents = getAgents();
                currentAgents.push(newAgent);
                saveAgents(currentAgents);
                
                addActivity('ceo', `Recruited new team member: "${newAgent.name}" as "${newAgent.role}"`);
              } else if (type === 'create_ticket' && parsed.action.ticketTitle && parsed.action.ticketDesc) {
                const currentTickets = getTickets();
                const hasInProgress = currentTickets.some(t => t.status === 'inprogress');
                const initialStatus = hasInProgress ? 'todo' : 'inprogress';
                const initialThought = hasInProgress 
                  ? 'Awaiting heartbeat swarming execution.' 
                  : 'Generating code models, analyzing dependencies, and mapping credential environments.';
                
                const assignedId = parsed.action.ticketAssignedTo || agents[Math.min(1, agents.length - 1)].id;
                const newTicket = {
                  id: `ticket_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
                  title: parsed.action.ticketTitle,
                  description: parsed.action.ticketDesc,
                  assignedTo: assignedId,
                  status: initialStatus as any,
                  thought: initialThought,
                  output: ''
                };
                currentTickets.push(newTicket);
                saveTickets(currentTickets);
                
                if (!hasInProgress) {
                  const currentAgents = getAgents();
                  currentAgents.forEach((a) => {
                    a.status = a.id === assignedId ? 'working' : 'sleeping';
                  });
                  saveAgents(currentAgents);
                }

                addActivity('ceo', `Created backlog task: "${newTicket.title}"`);
              } else if (type === 'create_file' && parsed.action.fileName && parsed.action.fileContent) {
                saveFile(parsed.action.fileName, parsed.action.fileContent, activeAgent.name);
                addActivity('agent', `Created workspace file: "${parsed.action.fileName}"`, activeAgent.id);
              }
            }

            // 2. Save agent's reply email response
            saveEmail({
              from: activeAgent.name,
              to: 'Founder (You)',
              subject: `RE: ${originalEmail.subject}`,
              body: parsed.agentBody || "Message processed successfully.",
              status: 'sent'
            });

            // Log activity
            if (parsed.activityLog) {
              addActivity('agent', parsed.activityLog, activeAgent.id);
            } else {
              addActivity('agent', `Processed email reply from Founder regarding "${originalEmail.subject}".`, activeAgent.id);
            }
          }
        } catch (err: any) {
          console.error('Failed to generate agent response:', err);
          // Fallback if LLM fails or is offline
          saveEmail({
            from: activeAgent.name,
            to: 'Founder (You)',
            subject: `RE: ${originalEmail.subject}`,
            body: `Hello Founder,\n\nI have received your instructions regarding "${originalEmail.subject}":\n\n"${emailBody}"\n\nI am coordinating with the team swarm and will work on implementing your requests immediately.\n\nBest regards,\n${activeAgent.name}`,
            status: 'sent'
          });

          addActivity('agent', `Processed email reply from Founder.`, activeAgent.id);
        }
      }
    }

    return NextResponse.json({ success: true, email: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to save email' }, { status: 500 });
  }
}
