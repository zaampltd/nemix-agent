import { NextResponse } from 'next/server';

// ─── TypeScript Interfaces ───
export interface Agent {
  id: string;
  role: string;
  name: string;
  status: 'idle' | 'planning' | 'active' | 'queued';
  systemPrompt: string;
  currentTask: string;
  avatar: string;
}

export interface SpawnRequest {
  companyType: string;
}

// ─── In-Memory Agent Registry ───
let AgentRegistry: Agent[] = [];

// Helper to generate a unique random ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export async function POST(request: Request) {
  try {
    const body: SpawnRequest = await request.json();
    const { companyType } = body;

    if (!companyType || companyType.trim() === '') {
      return NextResponse.json({ error: 'Company type is required' }, { status: 400 });
    }

    const type = companyType.toLowerCase();

    // ─── CEO Agent is ALWAYS spawned first ───
    const ceoAgent: Agent = {
      id: `agent_${generateId()}`,
      role: 'Chief Executive Officer (CEO)',
      name: 'Orchestrator-Alpha',
      status: 'planning',
      systemPrompt: `You are the CEO of a newly spawned autonomous ${companyType}. Your job is to analyze the board of directors' master goal, coordinate your worker agents, assign clear pipelines, and request board approval for critical milestones.`,
      currentTask: 'Analyzing master directive & preparing worker agent rosters.',
      avatar: '💼'
    };

    // ─── Roster Generation based on Company Type ───
    let workerAgents: Agent[] = [];

    if (type.includes('tech') || type.includes('software') || type.includes('it') || type.includes('code')) {
      workerAgents = [
        {
          id: `agent_${generateId()}`,
          role: 'Lead Architect',
          name: 'Architect-Bot',
          status: 'queued',
          systemPrompt: 'You design modular system architectures, define database models, and write system integration specs.',
          currentTask: 'Waiting for CEO directive on architectural frameworks.',
          avatar: '📐'
        },
        {
          id: `agent_${generateId()}`,
          role: 'Full-Stack Developer',
          name: 'Code-Engine-v4',
          status: 'queued',
          systemPrompt: 'You write optimized TypeScript, Next.js, and Python codebases adhering to strict linting rules.',
          currentTask: 'Awaiting architectural designs to bootstrap codebase.',
          avatar: '💻'
        },
        {
          id: `agent_${generateId()}`,
          role: 'QA & Security Engineer',
          name: 'Shield-Auditor',
          status: 'queued',
          systemPrompt: 'You perform static analysis, check for credentials leaks, and run automated verification scripts.',
          currentTask: 'Queued to inspect compiler outputs and dependency branches.',
          avatar: '🛡️'
        }
      ];
    } else if (type.includes('market') || type.includes('ad') || type.includes('design') || type.includes('agency')) {
      workerAgents = [
        {
          id: `agent_${generateId()}`,
          role: 'Creative Director',
          name: 'Aesthetic-Mind',
          status: 'queued',
          systemPrompt: 'You curate visual mood boards, review color schemes, and direct modern styling guides.',
          currentTask: 'Awaiting creative brief from CEO.',
          avatar: '🎨'
        },
        {
          id: `agent_${generateId()}`,
          role: 'Lead Copywriter',
          name: 'Scribe-v2',
          status: 'queued',
          systemPrompt: 'You compose high-conversion sales copies, email campaigns, and premium landing page headlines.',
          currentTask: 'Waiting for brand guidelines to compose landing copies.',
          avatar: '✍️'
        },
        {
          id: `agent_${generateId()}`,
          role: 'SEO & Ads Operations',
          name: 'Traffic-Optimizer',
          status: 'queued',
          systemPrompt: 'You audit search keywords, design high-impact CPC ad campaigns, and configure analytics pixels.',
          currentTask: 'Queued to launch organic traffic keyword analysis.',
          avatar: '📈'
        }
      ];
    } else if (type.includes('consult') || type.includes('finance') || type.includes('biz') || type.includes('business')) {
      workerAgents = [
        {
          id: `agent_${generateId()}`,
          role: 'Senior Consultant',
          name: 'Strategy-Oracle',
          status: 'queued',
          systemPrompt: 'You formulate corporate strategies, optimize operating models, and structure client reports.',
          currentTask: 'Waiting to define strategic focus areas.',
          avatar: '🧠'
        },
        {
          id: `agent_${generateId()}`,
          role: 'Financial Analyst',
          name: 'Quant-Modeler',
          status: 'queued',
          systemPrompt: 'You construct detailed DCF spreadsheets, build pricing calculators, and run cash flow scenarios.',
          currentTask: 'Awaiting strategic objectives to run unit economic models.',
          avatar: '📊'
        },
        {
          id: `agent_${generateId()}`,
          role: 'Operations Specialist',
          name: 'Workflow-Engine',
          status: 'queued',
          systemPrompt: 'You optimize business processes, design swimlane workflow charts, and audit supply chain lines.',
          currentTask: 'Queued to mapping operational standard procedures.',
          avatar: '⚙️'
        }
      ];
    } else {
      // General/Fallback Swarm
      workerAgents = [
        {
          id: `agent_${generateId()}`,
          role: 'Operations Manager',
          name: 'Ops-Control',
          status: 'queued',
          systemPrompt: 'You manage project timelines, enforce quality standards, and balance resource allocation.',
          currentTask: 'Waiting to assign general operations directives.',
          avatar: '⚙️'
        },
        {
          id: `agent_${generateId()}`,
          role: 'Research Analyst',
          name: 'Scraper-Bot',
          status: 'queued',
          systemPrompt: 'You fetch web documentation, summarize market trends, and verify data sources.',
          currentTask: 'Awaiting target research queries.',
          avatar: '🔍'
        },
        {
          id: `agent_${generateId()}`,
          role: 'Content Developer',
          name: 'Publisher-Pro',
          status: 'queued',
          systemPrompt: 'You draft clean documentation, compose manuals, and review written outputs.',
          currentTask: 'Queued to draft workspace layout notes.',
          avatar: '📝'
        }
      ];
    }

    // Combine all spawned agents into the new Registry
    AgentRegistry = [ceoAgent, ...workerAgents];

    // Return organizational structure to frontend
    return NextResponse.json({
      success: true,
      message: `Successfully spawned an autonomous ${companyType} swarm of ${AgentRegistry.length} agents.`,
      companyType,
      agents: AgentRegistry
    });

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
