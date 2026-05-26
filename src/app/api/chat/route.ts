import { NextResponse } from 'next/server';
import { 
  getCompany, 
  getAgents, 
  getTickets, 
  saveChatMessage, 
  getChatMessages, 
  createChatSession, 
  addActivity 
} from '@/lib/db';
import { generateNvmixCompletion, Message } from '@/lib/nvmix-engine';

const NVMIX_MODEL = 'nvmix-inference-v1';

// ─── Filtered Remote-Only URLs to prevent Next.js loopback dev deadlocks ───
const NVMIX_REMOTE_URLS = [
  process.env.NVMIX_API_URL,
  'https://nvmix.com/api/v1/chat/completions',
  'https://nemix-jjjj.vercel.app/api/v1/chat/completions',
].filter((url) => {
  if (!url) return false;
  // Enforce remote-only: exclude any loopback localhost endpoints to prevent server deadlocks
  return !url.includes('localhost') && !url.includes('127.0.0.1');
}) as string[];

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

    const systemPrompt = `You are ${agentName}, the ${agentRole} of an AI swarm company called "${companyName}".
Company mission: ${mission}
Current goal: ${goal}
Task progress: ${completedCount}/${tickets.length} tasks completed.${activeTicket ? `\nCurrently executing: "${activeTicket.title}".` : ''}

Respond concisely and professionally in-character as an AI agent executive. Keep responses under 3 sentences unless asked for code or a detailed report. Be helpful, direct, and intelligent.`;

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

    // Format chat history array from server-side database to feed to LLM
    const serverHistory = getChatMessages(sessionId);
    // Exclude the last message we just saved so we can add system prompt at top and format history correctly
    const formattedHistory = serverHistory.slice(0, -1).map((m: any) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: String(m.content || '')
    }));

    const messagesToSend: Message[] = [
      { role: 'system' as const, content: systemPrompt },
      ...formattedHistory,
      { role: 'user' as const,   content: message.trim() }
    ];

    // 1. Direct Engine Completion Promise (100% Deadlock-immune local execution)
    const directLocalPromise = (async () => {
      const result = await generateNvmixCompletion(messagesToSend, {
        temperature: 0.7,
        max_tokens: 400
      });
      
      const content = result?.choices?.[0]?.message?.content?.trim();
      if (!content || content.includes('[Nvmix System Offline]')) {
        throw new Error('Offline fallback returned');
      }
      return content;
    })();

    // 2. Build concurrent race promises combining local call + remote backends
    const promises = [
      directLocalPromise,
      ...NVMIX_REMOTE_URLS.map(async (url) => {
        const res = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body:    JSON.stringify({
            model:       NVMIX_MODEL,
            messages:    messagesToSend,
            max_tokens:  400,
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(5000), // Enforce 5s timeout on remote calls
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content?.trim();
        
        if (!reply || reply.includes('[Nvmix System Offline]')) {
          throw new Error('Offline fallback returned');
        }
        return reply;
      })
    ];

    try {
      const reply = await Promise.any(promises);
      
      // Save assistant response to persistent DB
      saveChatMessage(sessionId, {
        role: 'assistant',
        content: reply,
        senderName: agentName
      });

      // Track interaction in activity log
      addActivity('agent', `Replied to chat session in room: "${channel || 'General'}".`, targetAgent?.id);

      return NextResponse.json({ 
        success: true, 
        reply, 
        agent: agentName, 
        source: 'nvmix',
        sessionId
      });
    } catch (err: any) {
      console.error('Chat completion failed:', err);
      
      // Save a graceful error response as assistant message
      const errorMsg = saveChatMessage(sessionId, {
        role: 'assistant',
        content: `⚠️ I apologize — the Nvmix API gateway is temporarily unreachable. Error: ${err?.message || 'Connection timeout'}. Please try again in a moment, or check your API key in Settings.`,
        senderName: targetAgent?.name || 'CEO'
      });
      
      addActivity('error', `Chat API failed: ${err?.message || 'Unknown error'}`);
      
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
