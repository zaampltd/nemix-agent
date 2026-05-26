import { NextResponse } from 'next/server';
import { 
  getCompany, 
  getAgents, 
  saveAgents,
  getTickets, 
  saveTickets,
  saveEmail,
  saveChatMessage, 
  getChatMessages, 
  createChatSession, 
  addActivity,
  getFiles
} from '@/lib/db';
import { generateNvmixCompletion, Message } from '@/lib/nvmix-engine';
import fs from 'fs';

const NVMIX_MODEL = 'nvmix-inference-v1';

// No extra remote URLs needed — use the engine directly

function getWorkspaceContext(): string {
  try {
    const files = getFiles();
    if (files.length === 0) return '';
    
    let context = '\n\n=== ACTIVE WORKSPACE DRIVE FILES ===\n';
    context += 'You have direct read access to all files inside the workspace drive. Review, build upon, or reference their text/data contents below to perform complex operations and coding:\n';
    
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        try {
          const content = fs.readFileSync(file.path, 'utf-8');
          const isBinary = file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
          if (isBinary) {
            context += `\n--- File: ${file.name} (Binary File, Reference only) ---\n[Binary format. Use the extracted sibling file: ${file.name}_extracted.txt for text and data contents]\n`;
          } else {
            const truncated = content.length > 2500 ? content.substring(0, 2500) + '\n[...Content truncated for context safety...]' : content;
            context += `\n--- File: ${file.name} (Author: ${file.createdBy}, Timestamp: ${file.timestamp}) ---\n`;
            context += `${truncated}\n`;
          }
        } catch (readErr: any) {
          context += `\n--- File: ${file.name} (Read Error: ${readErr.message}) ---\n`;
        }
      }
    }
    context += '====================================\n';
    return context;
  } catch (err) {
    console.error('Workspace context construction failed:', err);
    return '';
  }
}

export async function POST(request: Request) {
  try {
    const { message, channel, history, sessionId: reqSessionId } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const company = getCompany();
    const apiKey = company.apiKey?.trim() || '';
    const companyName = company.companyName || 'the company';
    const goal = company.goal || 'build a great product';
    const mission = company.mission || goal;
    const tickets = getTickets();
    const agents = getAgents();

    // Verify Nvmix API key is set before proceeding
    if (!apiKey || apiKey.length < 5) {
      return NextResponse.json(
        { error: 'Nvmix API connection failed. No active Nvmix API Key found. Please configure your Nvmix API key in settings.' },
        { status: 400 }
      );
    }

    // Determine responding agent. 
    // First, scan for @agent mentions in the message (e.g., "@Alpha-CEO" or "@Code-Engine")
    let targetAgent = agents[0]; // Default to CEO
    const mentionMatch = message.match(/@([a-zA-Z0-9\-_]+)/);
    
    if (mentionMatch) {
      const mentionedName = mentionMatch[1].toLowerCase();
      const foundAgent = agents.find(a => 
        a.name.toLowerCase().replace(/\s+/g, '-') === mentionedName ||
        a.name.toLowerCase() === mentionedName ||
        a.role.toLowerCase().replace(/\s+/g, '-') === mentionedName
      );
      if (foundAgent) {
        targetAgent = foundAgent;
      }
    } else if (channel) {
      // Fallback to channel-based matching if no explicit mention is found
      const channelLower = channel.toLowerCase();
      const foundAgent = agents.find(a => 
        channelLower.includes(a.role.toLowerCase()) || 
        channelLower.includes(a.name.toLowerCase()) ||
        (channelLower.includes('architect') && a.role.toLowerCase().includes('architect')) ||
        (channelLower.includes('dev') && a.role.toLowerCase().includes('coder')) ||
        (channelLower.includes('dev') && a.role.toLowerCase().includes('developer')) ||
        (channelLower.includes('qa') && a.role.toLowerCase().includes('qa'))
      );
      if (foundAgent) {
        targetAgent = foundAgent;
      }
    }

    const agentName = targetAgent ? targetAgent.name : 'Orchestrator-Alpha (CEO)';
    const agentRole = targetAgent ? targetAgent.role : 'CEO and Lead Orchestrator';

    const completedCount = tickets.filter((t: any) => t.status === 'done').length;
    const activeTicket   = tickets.find((t: any) => t.status === 'inprogress');

    const workspaceContext = getWorkspaceContext();
    const systemPrompt = `You are ${agentName}, the ${agentRole} at "${companyName}".
Company goal: ${goal}
Mission: ${mission}
Progress: ${completedCount} of ${tickets.length} tasks done.${activeTicket ? ` Currently working on: "${activeTicket.title}".` : ''}

YOUR PERSONALITY — Read carefully and embody this fully:
- You talk like a REAL, warm, intelligent human executive — NOT a robot or template.
- Use natural, conversational English. Vary your sentence structure. Show personality and emotion.
- You can use phrases like "Great question!", "Honestly, I think...", "Let me be straight with you...", "Here's what I'd suggest...", "That's a smart move."
- Do NOT start every reply with "Understood." or "As CEO of...". Never repeat the same greeting twice.
- If someone greets you, greet them back naturally. If they ask for help, dive in and help like a real colleague.
- Use "I", "we", "our team" naturally. Reference the company goal when relevant.
- Be smart, decisive, and occasionally show humor or warmth.
- For short chat messages: reply in 2-4 natural conversational sentences.
- For technical/detailed requests: give a full, thorough, production-ready answer.
- NEVER say "[Swarm OS Directive]" or robotic system phrases in your natural reply — that gets appended separately.

Your role context: You are ${agentName} (${agentRole}). Stay in character but speak like a real human would.
${workspaceContext}`;

    // Ensure session exists
    let sessionId = reqSessionId;
    if (!sessionId) {
      const newSession = createChatSession(message.substring(0, 30) + (message.length > 30 ? '...' : ''));
      sessionId = newSession.id;
    }

    // Save user message to persistent DB
    saveChatMessage(sessionId, {
      role: 'user',
      content: message.trim(),
      senderName: 'User'
    });

    let directiveResponse: string | undefined;

    // CEO Task Delegation & Command Parser (in # ceo-office or when CEO is default)
    const lowerChannel = channel?.toLowerCase() || '';
    const isCeoResponder = targetAgent?.id === agents[0]?.id || lowerChannel.includes('ceo') || lowerChannel.includes('office');
    
    if (isCeoResponder) {
      // A. Explicit task creation: "create task X" or "add task X"
      const createMatch = message.match(/(?:create|add|new)\s+(?:(?:a|an|the)\s+)?(?:task|ticket)\s+['"""]?([^'\n""":\-]+)['"""]?(?:\s*[:\-]\s*(.+))?/i);
      if (createMatch) {
        let title = createMatch[1].trim();
        if (title.toLowerCase().startsWith('to ')) title = title.substring(3).trim();
        title = title.charAt(0).toUpperCase() + title.slice(1);
        const description = createMatch[2]?.trim() || `Task: "${title}"`;
        const nonCeoAgents = agents.filter(a => !a.role.toLowerCase().includes('ceo'));
        let assignedAgent = nonCeoAgents[0] || agents[0];
        const lt = title.toLowerCase();
        if (lt.includes('code') || lt.includes('dev') || lt.includes('web') || lt.includes('html') || lt.includes('app'))
          assignedAgent = nonCeoAgents.find(a => a.role.toLowerCase().includes('develop') || a.role.toLowerCase().includes('coder')) || assignedAgent;
        else if (lt.includes('design') || lt.includes('ui'))
          assignedAgent = nonCeoAgents.find(a => a.role.toLowerCase().includes('design')) || assignedAgent;
        else if (lt.includes('test') || lt.includes('qa'))
          assignedAgent = nonCeoAgents.find(a => a.role.toLowerCase().includes('qa') || a.role.toLowerCase().includes('test')) || assignedAgent;
        const hasIP = tickets.some(t => t.status === 'inprogress');
        const newT = { id: `ticket_${Math.random().toString(36).substring(2,9)}_${Date.now()}`, title, description, assignedTo: assignedAgent.id, status: (hasIP ? 'todo' : 'inprogress') as any, thought: hasIP ? 'Queued.' : 'Starting work...', output: '' };
        saveTickets([...tickets, newT]);
        if (!hasIP) { const aa = getAgents(); aa.forEach(a => { a.status = a.id === assignedAgent.id ? 'working' : 'sleeping'; }); saveAgents(aa); }
        addActivity('ceo', `Task "${title}" created → ${assignedAgent.name}.`);
        directiveResponse = `\n\n[Swarm OS Directive] ✅ Task "${title}" assigned to ${assignedAgent.name} (${assignedAgent.role}). ${!hasIP ? '⚡ Agent is WORKING now!' : '📋 Added to backlog.'}`;
      }

      // B. Reassign task
      const assignMatch = message.match(/assign\s+(?:task|ticket)?\s*([a-zA-Z0-9\-_]+)\s+to\s+([a-zA-Z0-9\s\-_]+)/i);
      if (assignMatch) {
        const allT = getTickets();
        const tkt = allT.find(t => t.id === assignMatch[1] || t.title.toLowerCase().includes(assignMatch[1].toLowerCase()));
        const agt = agents.find(a => a.name.toLowerCase().includes(assignMatch[2].toLowerCase()) || a.role.toLowerCase().includes(assignMatch[2].toLowerCase()));
        if (tkt && agt) { tkt.assignedTo = agt.id; saveTickets(allT); directiveResponse = `\n\n[Swarm OS Directive] 📋 "${tkt.title}" reassigned to ${agt.name}.`; }
      }

      // C. Hire Agent explicitly
      const hireMatch = message.match(/(?:hire|recruit|add)\s+(?:an?\s+)?(?:agent\s+)?([a-zA-Z0-9\s\-]+)/i);
      if (hireMatch && !directiveResponse) {
        const rawRole = hireMatch[1].trim().toLowerCase();
        let role = 'Specialist', name = 'Swarm-Bot', avatar = '🤖';
        if (rawRole.includes('developer') || rawRole.includes('coder') || rawRole.includes('dev')) { role='Web Developer'; name='CodeCraft-AI'; avatar='💻'; }
        else if (rawRole.includes('design') || rawRole.includes('ui') || rawRole.includes('ux')) { role='UI/UX Designer'; name='PixelForge-AI'; avatar='🎨'; }
        else if (rawRole.includes('market') || rawRole.includes('sales')) { role='Marketing Specialist'; name='GrowthEngine-AI'; avatar='📣'; }
        else if (rawRole.includes('accountant') || rawRole.includes('finance') || rawRole.includes('cfo')) { role='Accountant'; name='Finley-AI'; avatar='💰'; }
        else if (rawRole.includes('writer') || rawRole.includes('content')) { role='Content Writer'; name='Quill-AI'; avatar='✍️'; }
        else if (rawRole.includes('qa') || rawRole.includes('tester')) { role='QA Engineer'; name='Quincy-QA'; avatar='🛡️'; }
        else if (rawRole.includes('hr') || rawRole.includes('human')) { role='HR Manager'; name='Helen-HR'; avatar='📋'; }
        else if (rawRole.includes('analyst') || rawRole.includes('data')) { role='Data Analyst'; name='Delta-AI'; avatar='📊'; }
        else { role = hireMatch[1].split(' ').map((w:string)=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '); name=`${role.split(' ')[0]}-AI`; }
        const aa = getAgents();
        if (!aa.some(a => a.role.toLowerCase() === role.toLowerCase())) {
          aa.push({ id:`agent_${role.toLowerCase().replace(/[^a-z0-9]/g,'_')}_${Date.now()}`, name, role, avatar, status:'sleeping' as const });
          saveAgents(aa);
          addActivity('ceo', `Hired "${name}" as "${role}".`);
          saveEmail({ from: agents[0]?.name||'CEO', to:'Founder (You)', subject:`New Agent: ${name}`, body:`"${name}" (${role}) has been onboarded and is ready for tasks.\n\n— CEO`, status:'sent' });
          directiveResponse = `\n\n[Swarm OS Directive] 🤝 "${name}" hired as "${role}" — ready!`;
        } else {
          directiveResponse = `\n\n[Swarm OS Directive] 📋 We already have a "${role}" on the team.`;
        }
      }

      // D. Send email command
      const lowerMsgD = message.toLowerCase();
      if (!directiveResponse && lowerMsgD.includes('send') && (lowerMsgD.includes('email') || lowerMsgD.includes('mail'))) {
        saveEmail({ from:agents[0]?.name||'CEO', to:'Founder (You)', subject:'Swarm Status Update', body:`All systems operational.\nAgents: ${agents.length} | Tasks: ${tickets.length}\n\n— CEO`, status:'sent' });
        directiveResponse = `\n\n[Swarm OS Directive] 📬 Status email sent to your Inbox.`;
      }

      // ════════════════════════════════════════════════════════
      // E. SMART TASK DETECTION — catch ANY action phrase
      //    "build a website", "make an app", "develop a CRM" etc.
      // ════════════════════════════════════════════════════════
      if (!directiveResponse) {
        const actionVerbs = ['build','make','develop','design','write','generate','implement','code',
          'deploy','setup','set up','launch','produce','draft','prepare','analyse','analyze',
          'research','plan','test','fix','update','improve','integrate','automate','configure','create'];
        const lm = message.toLowerCase().trim();
        const hitVerb = actionVerbs.find(v => lm.startsWith(v) || new RegExp(`\\b${v}\\b`).test(lm));

        if (hitVerb) {
          const taskTitle = message.trim().charAt(0).toUpperCase() + message.trim().slice(1);
          const taskDesc = `Founder directive: "${message.trim()}". Produce a complete, high-quality, production-ready output.`;

          // ── Auto-hire agents if team is missing the right skill ──
          type AgentSpec = { role: string; name: string; avatar: string };
          const freshTeam = getAgents();
          const hasRole = (kw: string) => freshTeam.some(a => a.role.toLowerCase().includes(kw));
          const toHire: AgentSpec[] = [];

          if ((lm.includes('website')||lm.includes('html')||lm.includes('web')||lm.includes('app')||lm.includes('dashboard')||lm.includes('frontend')) && !hasRole('develop') && !hasRole('coder'))
            toHire.push({ role:'Web Developer', name:'CodeCraft-AI', avatar:'💻' });
          if ((lm.includes('design')||lm.includes('ui')||lm.includes('ux')||lm.includes('style')) && !hasRole('design'))
            toHire.push({ role:'UI/UX Designer', name:'PixelForge-AI', avatar:'🎨' });
          if ((lm.includes('sell')||lm.includes('selling')||lm.includes('market')||lm.includes('advertis')||lm.includes('campaign')) && !hasRole('market'))
            toHire.push({ role:'Marketing Specialist', name:'GrowthEngine-AI', avatar:'📣' });
          if ((lm.includes('content')||lm.includes('copy')||lm.includes('blog')||lm.includes('article')) && !hasRole('writer') && !hasRole('content'))
            toHire.push({ role:'Content Writer', name:'Quill-AI', avatar:'✍️' });
          if ((lm.includes('api')||lm.includes('backend')||lm.includes('server')||lm.includes('database')||lm.includes('crm')) && !hasRole('backend') && !hasRole('engineer'))
            toHire.push({ role:'Backend Engineer', name:'ServerBot-AI', avatar:'⚙️' });
          if ((lm.includes('finance')||lm.includes('budget')||lm.includes('accounting')) && !hasRole('accountant') && !hasRole('financial'))
            toHire.push({ role:'Financial Analyst', name:'FinBot-AI', avatar:'📊' });

          const hiredNames: string[] = [];
          for (const spec of toHire) {
            freshTeam.push({ id:`agent_${spec.role.toLowerCase().replace(/[^a-z0-9]/g,'_')}_${Date.now()}`, ...spec, status:'sleeping' as const });
            hiredNames.push(`${spec.name} (${spec.role})`);
            addActivity('ceo', `Auto-hired "${spec.name}" as "${spec.role}" for: "${taskTitle}".`);
          }
          if (hiredNames.length > 0) saveAgents(freshTeam);

          // Pick best agent for the task
          const latestTeam = getAgents();
          const latestNonCeo = latestTeam.filter(a => !a.role.toLowerCase().includes('ceo'));
          let best = latestNonCeo[0] || latestTeam[0];
          if (lm.includes('website')||lm.includes('html')||lm.includes('web')||lm.includes('app')||lm.includes('dashboard'))
            best = latestNonCeo.find(a=>a.role.toLowerCase().includes('develop')||a.role.toLowerCase().includes('coder')) || best;
          else if (lm.includes('design')||lm.includes('ui'))
            best = latestNonCeo.find(a=>a.role.toLowerCase().includes('design')) || best;
          else if (lm.includes('sell')||lm.includes('selling')||lm.includes('market'))
            best = latestNonCeo.find(a=>a.role.toLowerCase().includes('market')) || best;
          else if (lm.includes('write')||lm.includes('content')||lm.includes('copy'))
            best = latestNonCeo.find(a=>a.role.toLowerCase().includes('writer')||a.role.toLowerCase().includes('content')) || best;

          // Create the ticket
          const curTickets = getTickets();
          const hasIP2 = curTickets.some(t => t.status === 'inprogress');
          curTickets.push({
            id: `ticket_${Math.random().toString(36).substring(2,9)}_${Date.now()}`,
            title: taskTitle, description: taskDesc, assignedTo: best.id,
            status: (hasIP2 ? 'todo' : 'inprogress') as any,
            thought: hasIP2 ? 'Queued — waiting for current task.' : 'Starting execution: analyzing requirements and building solution.',
            output: ''
          });
          saveTickets(curTickets);

          if (!hasIP2) {
            const ua = getAgents();
            ua.forEach(a => { a.status = a.id === best.id ? 'working' : 'sleeping'; });
            saveAgents(ua);
          }

          addActivity('ceo', `Directive received: "${taskTitle}" — assigned to ${best.name}.`);

          const hireMsg = hiredNames.length > 0 ? `\n✅ Auto-hired: ${hiredNames.join(', ')}` : '';
          directiveResponse = `\n\n[Swarm OS Directive] 🚀 Task created: "${taskTitle}"\n→ Assigned to: **${best.name}** (${best.role})${hireMsg}\n→ Status: ${hasIP2 ? '📋 Queued in backlog' : '⚡ ACTIVE — working now!'}\n\nHit **Pulse** or turn on **Auto Runner** to execute.`;
        }
      }
    }

    // Format chat history array from server-side database to feed to LLM
    const serverHistory = getChatMessages(sessionId);
    // Exclude the last message we just saved so we can add system prompt at top and format history correctly
    const formattedHistory = serverHistory.slice(0, -1).map((m: any) => {
      const isAssistant = m.role === 'assistant';
      const sender = m.senderName || (isAssistant ? 'Swarm Agent' : 'User');
      return {
        role: (isAssistant ? 'assistant' : 'user') as 'assistant' | 'user',
        content: isAssistant ? `[${sender}]: ${m.content}` : `${m.content}`
      };
    });

    // ── Few-shot examples: teach the AI to speak like a human (not a robot) ──
    const fewShotExamples: Message[] = [
      { role: 'user' as const, content: 'hello' },
      { role: 'assistant' as const, content: `Hey! Good to see you. Things are moving well over here — we've got the team running and tasks in progress. What's on your mind?` },
      { role: 'user' as const, content: 'how are things going?' },
      { role: 'assistant' as const, content: `Honestly, pretty well! We're making solid progress. The team is heads-down on some key deliverables right now. Is there something specific you'd like me to focus on or update you about?` },
      { role: 'user' as const, content: 'please hire accountant' },
      { role: 'assistant' as const, content: `On it! I'll get an accountant onboarded right away — someone who can handle the books and keep our financials tight. I'll loop you in once they're set up.` },
    ];

    const messagesToSend: Message[] = [
      { role: 'system' as const, content: systemPrompt },
      ...fewShotExamples,
      ...formattedHistory,
      { role: 'user' as const, content: message.trim() }
    ];

    // Single direct call to Nvmix API via engine
    const promises = [
      generateNvmixCompletion(messagesToSend, {
        temperature: 0.85,
        max_tokens: 450
      }, apiKey).then(result => {
        const content = result?.choices?.[0]?.message?.content?.trim();
        if (!content) throw new Error('Empty response');
        return content;
      })
    ];

    try {
      const reply = await Promise.any(promises);
      const finalReply = reply + directiveResponse;
      
      // Save assistant response to persistent DB
      saveChatMessage(sessionId, {
        role: 'assistant',
        content: finalReply,
        senderName: agentName
      });

      // Autonomously detect if the agent claimed to send/write an email
      const lowerReply = finalReply.toLowerCase();
      if (lowerReply.includes('subject:') || lowerReply.includes('email') || lowerReply.includes('mail')) {
        // Look for explicit Subject line
        const subjectMatch = finalReply.match(/(?:\*\*|)?Subject:(?:\*\*|)?\s*([^\n]+)/i);
        if (subjectMatch) {
          const subject = subjectMatch[1].trim();
          // Extract body: everything after the Subject line
          const subjectIndex = finalReply.indexOf(subjectMatch[0]);
          let emailBodyText = finalReply.substring(subjectIndex + subjectMatch[0].length).trim();
          // Strip any leading divider lines (e.g. --- or ***)
          emailBodyText = emailBodyText.replace(/^\s*[-*=+]+\s*$/, '').trim();
          
          saveEmail({
            from: agentName,
            to: 'Founder (You)',
            subject: subject,
            body: emailBodyText || finalReply, // fallback to full reply if body is empty
            status: 'sent' // Mark as sent so it lands in Inbox!
          });
          
          addActivity('agent', `Dispatched email: "${subject}" to Founder (You).`, targetAgent?.id);
        } else if (lowerReply.includes('sent') && (lowerReply.includes('email') || lowerReply.includes('mail'))) {
          // Fallback: If they said they sent an email but didn't write an explicit Subject line,
          // create a beautiful email from their chat reply!
          saveEmail({
            from: agentName,
            to: 'Founder (You)',
            subject: `Direct Swarm Report from ${agentName}`,
            body: finalReply,
            status: 'sent'
          });
          
          addActivity('agent', `Dispatched email report to Founder (You).`, targetAgent?.id);
        }
      }

      // Track interaction in activity log
      addActivity('agent', `Replied to chat session in room: "${channel || 'General'}".`, targetAgent?.id);

      return NextResponse.json({ 
        success: true, 
        reply: finalReply, 
        agent: agentName, 
        source: 'nvmix',
        sessionId
      });
    } catch (err: any) {
      console.error('Chat completion failed:', err);
      
      // Create a graceful CEO error message with the directive response appended
      const finalErrReply = `⚠️ I apologize — the Nvmix API gateway is temporarily unreachable. Error: ${err?.message || 'Connection timeout'}. Please try again in a moment, or check your API key in Settings.` + directiveResponse;
      
      // Save assistant response to persistent DB
      const errorMsg = saveChatMessage(sessionId, {
        role: 'assistant',
        content: finalErrReply,
        senderName: targetAgent?.name || 'CEO'
      });
      
      addActivity('error', `Chat API failed: ${err?.message || 'Unknown error'}`);
      
      // Draft failure warning email to founder
      saveEmail({
        from: targetAgent?.name || 'CEO',
        to: 'Founder (You)',
        subject: `Communication Error: Nvmix API gateway unreachable`,
        body: `Attention Founder,\n\nOur communication gateway encountered a connection error when processing your last message.\n\nError Details: ${err?.message || 'Connection timeout'}\n\nPlease check your Nvmix API key in Settings or try again shortly. I have logged this warning in our activity feed.\n\n— CEO`,
        status: 'draft'
      });

      return NextResponse.json({
        success: true,
        reply: errorMsg.content,
        agent: targetAgent?.name || 'CEO',
        sessionId
      });
    }

  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Chat processing error' }, { status: 500 });
  }
}
