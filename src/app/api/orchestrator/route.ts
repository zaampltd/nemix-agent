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
  saveChatMessage,
  saveFile,
  getFiles
} from '@/lib/db';
import { Agent, Ticket, CompanyState } from '@/lib/types';
import { generateNvmixCompletion } from '@/lib/nvmix-engine';
import fs from 'fs';
import path from 'path';

// ─── Filename derivation helper from task title ───
function getFilenameForTicket(title: string, roleName: string): string {
  const lowerTitle = title.toLowerCase();
  const { ext } = getOutputTypeForRole(roleName);
  
  if (lowerTitle.includes('blueprint') || lowerTitle.includes('blue print')) return `campaign_blueprint${ext}`;
  if (lowerTitle.includes('lead magnet') || lowerTitle.includes('lead_magnet')) return `lead_magnet${ext}`;
  if (lowerTitle.includes('crm') || lowerTitle.includes('customer relationship')) return `crm_system${ext}`;
  if (lowerTitle.includes('traffic') || lowerTitle.includes('conversion') || lowerTitle.includes('analytics')) return `traffic_analysis${ext}`;
  if (lowerTitle.includes('architect') || lowerTitle.includes('schema')) return `architecture_design${ext}`;
  if (lowerTitle.includes('bootstrap') || lowerTitle.includes('api')) return `app_api${ext}`;
  if (lowerTitle.includes('security') || lowerTitle.includes('qa') || lowerTitle.includes('audit')) return `security_audit${ext}`;
  if (lowerTitle.includes('social media') || lowerTitle.includes('content calendar') || lowerTitle.includes('instagram') || lowerTitle.includes('linkedin')) return `social_media_content${ext}`;
  if (lowerTitle.includes('financial') || lowerTitle.includes('budget') || lowerTitle.includes('report') || lowerTitle.includes('accounting')) return `financial_report${ext}`;
  if (lowerTitle.includes('compliance') || lowerTitle.includes('policy') || lowerTitle.includes('legal') || lowerTitle.includes('hr handbook')) return `compliance_policy${ext}`;
  if (lowerTitle.includes('strategy') || lowerTitle.includes('operational') || lowerTitle.includes('roadmap')) return `operational_strategy${ext}`;
  if (lowerTitle.includes('onboarding') || lowerTitle.includes('client') || lowerTitle.includes('support')) return `client_onboarding${ext}`;
  if (lowerTitle.includes('marketing') || lowerTitle.includes('campaign')) return `marketing_plan${ext}`;
  
  // Generic fallback: sanitize the title to lowercase snake_case
  const sanitized = lowerTitle.replace(/[^a-z0-9\s-_]/g, '').trim().replace(/[\s-_]+/g, '_');
  return `${sanitized || 'document'}${ext}`;
}

// ─── STRICT RULE: ONLY NVMIX API ───
const NVMIX_MODEL = 'nvmix-inference-v1';

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

// ─── Industry → default agent roster (fallback when AI roster generation fails) ───
const INDUSTRY_AGENT_ROSTERS: Record<string, Array<{ role: string; name: string; avatar: string }>> = {
  technology:  [
    { role: 'CEO',               name: 'Alpha-CEO',        avatar: '💼' },
    { role: 'Software Engineer', name: 'Codebot-7',        avatar: '💻' },
    { role: 'QA Engineer',       name: 'TestShield',       avatar: '🔍' },
    { role: 'DevOps Engineer',   name: 'PipelineX',        avatar: '⚙️' },
    { role: 'Security Auditor',  name: 'CipherGuard',      avatar: '🔒' },
    { role: 'Project Manager',   name: 'TaskMaster',       avatar: '📋' },
    { role: 'Tech Writer',       name: 'DocuBot',          avatar: '📝' },
  ],
  finance: [
    { role: 'CEO',                  name: 'FinCEO',          avatar: '💼' },
    { role: 'CFO',                  name: 'Vault-AI',        avatar: '💰' },
    { role: 'Accountant',           name: 'LedgerBot',       avatar: '📊' },
    { role: 'Financial Analyst',    name: 'DataFin',         avatar: '📈' },
    { role: 'Risk Advisor',         name: 'RiskRadar',       avatar: '⚠️' },
    { role: 'Compliance Officer',   name: 'RegBot',          avatar: '⚖️' },
    { role: 'Investment Strategist',name: 'AlphaFund',       avatar: '💹' },
  ],
  marketing: [
    { role: 'CEO',              name: 'BrandCEO',        avatar: '💼' },
    { role: 'CMO',              name: 'MarketMind',      avatar: '📣' },
    { role: 'Content Writer',   name: 'QuillBot',        avatar: '✍️' },
    { role: 'SEO Specialist',   name: 'SearchMaster',    avatar: '🔎' },
    { role: 'Social Media Manager', name: 'SocialWave', avatar: '📱' },
    { role: 'Ad Strategist',    name: 'AdEngine',        avatar: '🎯' },
    { role: 'Brand Designer',   name: 'PixelForge',      avatar: '🎨' },
  ],
  healthcare: [
    { role: 'CEO',               name: 'MedCEO',         avatar: '💼' },
    { role: 'Medical Advisor',   name: 'DocAI',          avatar: '🏥' },
    { role: 'Data Analyst',      name: 'HealthMetrics',  avatar: '📊' },
    { role: 'Compliance Officer',name: 'MedRegBot',      avatar: '⚖️' },
    { role: 'Patient Coordinator', name: 'CareBot',      avatar: '💊' },
    { role: 'Research Analyst',  name: 'BioResearch',    avatar: '🔬' },
    { role: 'Operations Manager',name: 'OpsHealth',      avatar: '⚙️' },
  ],
  ecommerce: [
    { role: 'CEO',               name: 'CommerceCEO',    avatar: '💼' },
    { role: 'E-Commerce Manager',name: 'StoreBot',       avatar: '🛒' },
    { role: 'Inventory Manager', name: 'StockSense',     avatar: '📦' },
    { role: 'Customer Support',  name: 'SupportAI',      avatar: '🎧' },
    { role: 'Social Media Manager', name: 'SocialSell', avatar: '📱' },
    { role: 'Analytics Specialist', name: 'DataShop',   avatar: '📊' },
    { role: 'Logistics Coordinator', name: 'ShipBot',   avatar: '🚚' },
  ],
  startup: [
    { role: 'CEO',               name: 'FounderAI',      avatar: '🚀' },
    { role: 'CTO',               name: 'TechPilot',      avatar: '💻' },
    { role: 'Product Manager',   name: 'ProductMind',    avatar: '🎯' },
    { role: 'Growth Hacker',     name: 'GrowthEngine',   avatar: '📈' },
    { role: 'Full-Stack Developer', name: 'BuildBot',   avatar: '⚙️' },
    { role: 'Customer Success',  name: 'ClientWave',     avatar: '💬' },
    { role: 'Investor Relations',name: 'FundBot',        avatar: '💰' },
  ],
  education: [
    { role: 'CEO',               name: 'EduCEO',         avatar: '💼' },
    { role: 'Curriculum Designer', name: 'LearnBot',     avatar: '📚' },
    { role: 'Content Creator',   name: 'EduWriter',      avatar: '✍️' },
    { role: 'Student Advisor',   name: 'GuidanceAI',     avatar: '🎓' },
    { role: 'Platform Developer',name: 'EduCode',        avatar: '💻' },
    { role: 'Research Analyst',  name: 'AcademicBot',    avatar: '🔬' },
    { role: 'Operations Manager',name: 'EduOps',         avatar: '⚙️' },
  ],
  restaurant: [
    { role: 'CEO',               name: 'FoodCEO',        avatar: '💼' },
    { role: 'Operations Manager',name: 'KitchenOps',     avatar: '🍽️' },
    { role: 'Chef Advisor',      name: 'ChefBot',        avatar: '👨‍🍳' },
    { role: 'Inventory Manager', name: 'FoodStock',      avatar: '📦' },
    { role: 'Social Media Manager', name: 'FoodGram',   avatar: '📸' },
    { role: 'Customer Relations',name: 'TableBot',       avatar: '😊' },
    { role: 'Financial Controller', name: 'RestFinance', avatar: '💰' },
  ],
  consulting: [
    { role: 'CEO',               name: 'ConsultCEO',     avatar: '💼' },
    { role: 'Senior Consultant', name: 'StrategyBot',    avatar: '🧠' },
    { role: 'Research Analyst',  name: 'InsightAI',      avatar: '🔍' },
    { role: 'Project Manager',   name: 'DeliverBot',     avatar: '📋' },
    { role: 'Business Advisor',  name: 'AdvisoryAI',     avatar: '💡' },
    { role: 'Financial Analyst', name: 'FinConsult',     avatar: '📊' },
    { role: 'Report Writer',     name: 'ReportBot',      avatar: '📝' },
  ],
  realestate: [
    { role: 'CEO',               name: 'PropCEO',        avatar: '💼' },
    { role: 'Property Manager',  name: 'PropBot',        avatar: '🏠' },
    { role: 'Sales Agent',       name: 'DealMaker',      avatar: '🤝' },
    { role: 'Legal Advisor',     name: 'LegalProp',      avatar: '⚖️' },
    { role: 'Finance Manager',   name: 'PropFin',        avatar: '💰' },
    { role: 'Marketing Specialist', name: 'PropMark',   avatar: '📣' },
    { role: 'Client Relations',  name: 'ClientProp',     avatar: '😊' },
  ],
  logistics: [
    { role: 'CEO',               name: 'LogiCEO',        avatar: '💼' },
    { role: 'Logistics Manager', name: 'RouteBot',       avatar: '🗺️' },
    { role: 'Supply Chain Analyst', name: 'ChainAI',    avatar: '🔗' },
    { role: 'Operations Manager',name: 'OpsFleet',       avatar: '⚙️' },
    { role: 'Fleet Coordinator', name: 'FleetBot',       avatar: '🚛' },
    { role: 'Warehouse Manager', name: 'StockBot',       avatar: '🏭' },
    { role: 'Compliance Officer',name: 'FreightReg',     avatar: '⚖️' },
  ],
};
const DEFAULT_ROSTER = [
  { role: 'CEO',               name: 'Alpha-CEO',     avatar: '💼' },
  { role: 'Operations Manager',name: 'OpsBot',        avatar: '⚙️' },
  { role: 'Business Analyst',  name: 'InsightBot',    avatar: '📊' },
  { role: 'Project Manager',   name: 'TaskMaster',    avatar: '📋' },
  { role: 'Marketing Manager', name: 'MarketBot',     avatar: '📣' },
  { role: 'Financial Analyst', name: 'FinanceBot',    avatar: '💰' },
  { role: 'Content Writer',    name: 'WriteBot',      avatar: '✍️' },
];

// ─── Output type detector: decides file extension based on role + task ───
function getOutputTypeForRole(role: string): { ext: string; format: string } {
  const r = role.toLowerCase();
  if (r.includes('developer') || r.includes('engineer') || r.includes('cto') || r.includes('devops') || r.includes('qa') || r.includes('coder') || r.includes('platform dev')) {
    return { ext: '.py', format: 'python_code' };
  }
  if (r.includes('social media') || r.includes('content creator') || r.includes('brand')) {
    return { ext: '.md', format: 'social_content' };
  }
  if (r.includes('accountant') || r.includes('cfo') || r.includes('financial') || r.includes('finance') || r.includes('ledger')) {
    return { ext: '.csv', format: 'financial_report' };
  }
  if (r.includes('analyst') || r.includes('research') || r.includes('seo') || r.includes('data')) {
    return { ext: '.md', format: 'analysis_report' };
  }
  if (r.includes('compliance') || r.includes('legal') || r.includes('audit') || r.includes('security')) {
    return { ext: '.md', format: 'compliance_report' };
  }
  if (r.includes('writer') || r.includes('content') || r.includes('curriculum') || r.includes('doc')) {
    return { ext: '.md', format: 'document' };
  }
  return { ext: '.md', format: 'business_document' };
}

// ─── Nvmix API helper — delegates to engine which enforces Nvmix-only keys ───
async function callNvmixAPI(apiKey: string, messages: { role: string; content: string }[], timeoutMs = 20000) {
  return generateNvmixCompletion(messages as any, { temperature: 0.7, max_tokens: 2048, timeoutMs }, apiKey);
}


// ─── GET: Retrieve Swarm State ───
export async function GET() {
  try {
    const company = getCompany();
    const agents = getAgents();
    const tickets = getTickets();

    // Ensure all completed (done) tickets have their files written to local disk so they show up in Files Space
    if (company.companyName && company.companyName.trim().length > 0) {
      try {
        const currentFiles = getFiles();
        const agentName = (id: string) => agents.find((a) => a.id === id)?.name ?? 'Agent';
        const agentRole = (id: string) => agents.find((a) => a.id === id)?.role ?? 'Marketer';
        const completedTickets = tickets.filter(t => t.status === 'done');

        for (const ticket of completedTickets) {
          const expectedFilename = getFilenameForTicket(ticket.title, agentRole(ticket.assignedTo));
          const fileExistsInRegistry = currentFiles.some(f => f.name === expectedFilename);
          
          if (!fileExistsInRegistry && ticket.output) {
            saveFile(expectedFilename, ticket.output, agentName(ticket.assignedTo));
            addActivity('agent', `Restored completed asset to disk: "${expectedFilename}"`, ticket.assignedTo);
          }
        }
      } catch (err) {
        console.error('Failed to sync completed files on disk:', err);
      }
    }
    
    // Refresh activities in case any files were restored and created activity items
    const finalActivities = getActivity();
    
    // Map activity items to the legacy string log format for backwards compatibility
    const logs = finalActivities
      .slice()
      .reverse()
      .map(act => {
        const prefix = act.type === 'system' ? 'System' : act.type === 'ceo' ? 'CEO' : act.type === 'error' ? 'Error' : 'Agent';
        return `[${prefix}] ${act.message}`;
      });

    // ── CEO is ALWAYS working — never sleeps ──
    // Force-fix in case any prior operation accidentally set CEO to sleeping
    if (agents.length > 0 && agents[0].status !== 'working') {
      agents[0].status = 'working';
      saveAgents(agents);
    }

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
    // ACTION: save_settings
    // ══════════════════════════════════════════════
    if (action === 'save_settings') {
      const { companyName, goal, mission, apiKey, governanceMode } = body;

      const currentCompany = getCompany();
      const nextCompany: CompanyState = {
        companyName: companyName !== undefined ? companyName : currentCompany.companyName,
        mission: mission !== undefined ? mission : currentCompany.mission,
        goal: goal !== undefined ? goal : currentCompany.goal,
        apiKey: apiKey !== undefined ? apiKey : currentCompany.apiKey,
        budgetUsed: currentCompany.budgetUsed ?? 0,
        governanceMode: governanceMode !== undefined ? governanceMode : currentCompany.governanceMode
      };

      saveCompany(nextCompany);
      addActivity('system', `Company command settings updated.`);

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
          agents: getAgents(),
          tickets: getTickets(),
          logs
        }
      });
    }

    // ══════════════════════════════════════════════
    // ACTION: onboard  (also aliased as "initialize")
    // ══════════════════════════════════════════════
    if (action === 'onboard' || action === 'initialize') {
      const { companyName, goal, apiKey, mission, userName = 'Founder', industry = 'general' } = body;

      if (!companyName || !goal)
        return NextResponse.json({ error: 'companyName and goal are required' }, { status: 400 });

      // Verify Nvmix API key has correct format
      if (!apiKey || !apiKey.trim().startsWith('nvx_') || apiKey.trim().length < 20) {
        return NextResponse.json(
          { error: 'Invalid API key. Only Nvmix API keys are supported (format: nvx_...). Get your key at https://nvmix.com/dashboard/api-keys' },
          { status: 400 }
        );
      }

      // ── 1. Build industry-specific agent roster via AI ──
      let agents: Agent[] = [];
      const industryKey = (industry || 'other').toLowerCase().replace(/[^a-z]/g, '');
      const fallbackRoster = INDUSTRY_AGENT_ROSTERS[industryKey] || DEFAULT_ROSTER;

      try {
        const agentCount = 7; // Always hire 7 agents for full company coverage
        const industryLabel = industry || 'general business';
        const prompt = `You are an expert AI company architect. A ${industryLabel} company named "${companyName}" is launching. The founder is ${userName}.
Company goal: "${goal}"

Hire exactly ${agentCount} specialized AI agents for this company. The first agent MUST be the CEO.
Choose roles that are MOST RELEVANT for a ${industryLabel} company — covering operations, technical work, financial analysis, marketing/social media, compliance, customer relations, and any domain-specific roles.

Output ONLY a valid JSON array — no markdown, no explanation, no code fences. Example format:
[{"id":"agent_ceo","role":"CEO","name":"Alpha-CEO","avatar":"💼","status":"working"},{"id":"agent_2","role":"Software Engineer","name":"CodeBot","avatar":"💻","status":"sleeping"}]

Rules: all ids must be unique strings starting with "agent_", avatar must be a single emoji, status is "working" for CEO and "sleeping" for all others.`;

        const result = await callNvmixAPI(apiKey.trim(), [
          { role: 'system', content: prompt },
          { role: 'user',   content: `Company: ${companyName}. Industry: ${industryLabel}. Goal: ${goal}. Output the JSON array of ${agentCount} agents now.` },
        ], 25000);
        const content  = result?.choices?.[0]?.message?.content ?? '';
        const jsonMatch = content.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length >= 4) {
            agents = parsed.slice(0, 8).map((a: any, i: number) => ({
              id:     (a.id || `agent_${i}`).replace(/[^a-z0-9_]/gi, '_'),
              role:   a.role   || fallbackRoster[i]?.role   || `Agent ${i + 1}`,
              name:   a.name   || fallbackRoster[i]?.name   || `Nvmix-Bot-${i + 1}`,
              avatar: a.avatar || fallbackRoster[i]?.avatar || '🤖',
              status: i === 0  ? 'working' : 'sleeping',
            }));
          } else {
            throw new Error('Parsed array has fewer than 4 agents.');
          }
        } else {
          throw new Error('No JSON array found in API response.');
        }
      } catch (err: any) {
        console.warn('Dynamic agent generation failed, using industry fallback roster:', err?.message);
        // Use industry-specific fallback roster instead of hard erroring
        agents = fallbackRoster.map((a, i) => ({
          id:     `agent_${i === 0 ? 'ceo' : a.role.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          role:   a.role,
          name:   a.name,
          avatar: a.avatar,
          status: i === 0 ? 'working' : 'sleeping',
        }));
      }

      // ── 2. Generate 5-6 industry-specific backlog tickets ──
      let tickets: Ticket[] = [];
      const nonCeoAgents = agents.slice(1); // exclude CEO from task assignment
      try {
        const ticketCount = Math.min(6, nonCeoAgents.length + 1);
        const ticketsPrompt = `You are an expert AI project manager. A ${industry || 'general'} company "${companyName}" has these agents: ${JSON.stringify(
          agents.map(a => ({ id: a.id, role: a.role, name: a.name }))
        )}.
Company goal: "${goal}"

Create exactly ${ticketCount} highly specific, real-world backlog tasks for this company. Each task should be DIFFERENT in scope:
- 1 task covering business strategy/planning
- 1 task covering technical/system work
- 1 task covering marketing/social media/content
- 1 task covering financial/accounting/reports
- 1 task covering operations/HR/compliance
- 1 task covering customer/client facing work

Assign each task to the MOST RELEVANT agent (NOT the CEO — agents: ${nonCeoAgents.map(a => `${a.id}=${a.role}`).join(', ')}).

Output ONLY valid JSON array — no markdown, no explanation:
[{"id":"ticket_1","title":"...","description":"...","assignedTo":"agent_id","status":"todo","thought":"...","output":""}]`;

        const ticketResult = await callNvmixAPI(apiKey.trim(), [
          { role: 'system', content: ticketsPrompt },
          { role: 'user',   content: `Generate ${ticketCount} backlog tickets for ${companyName} (${industry}). Output JSON now.` },
        ], 25000);
        
        const ticketContent = ticketResult?.choices?.[0]?.message?.content ?? '';
        const ticketJsonMatch = ticketContent.match(/\[[\s\S]*?\]/);
        if (ticketJsonMatch) {
          const parsed = JSON.parse(ticketJsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length >= 3) {
            const validAgentIds = new Set(agents.map(a => a.id));
            tickets = parsed.slice(0, 6).map((t: any, i: number) => {
              // Ensure assignedTo is a valid non-CEO agent
              let assignedTo = t.assignedTo;
              if (!validAgentIds.has(assignedTo) || assignedTo === agents[0]?.id) {
                assignedTo = nonCeoAgents[i % nonCeoAgents.length]?.id || agents[1]?.id;
              }
              return {
                id: `ticket_${i + 1}`,
                title: t.title || `Task ${i + 1}`,
                description: t.description || 'Complete this business task.',
                assignedTo,
                status: 'todo' as const,
                thought: t.thought || 'Queued for execution.',
                output: ''
              };
            });
          }
        }
      } catch (err) {
        console.warn('Dynamic ticket generation failed, using industry fallback tickets:', err);
      }

      // Fallback industry-specific tickets
      if (tickets.length === 0) {
        const t = nonCeoAgents;
        tickets = [
          { id: 'ticket_1', title: `Build ${companyName} operational strategy`, description: `Create a comprehensive operational roadmap and business strategy document for ${companyName}.`, assignedTo: t[0]?.id || agents[1]?.id, status: 'todo', thought: 'Analyzing company structure and drafting strategy.', output: '' },
          { id: 'ticket_2', title: `Develop core ${industry || 'business'} systems`, description: `Build the primary technical systems, automations, and workflows for ${companyName}'s operations.`, assignedTo: t[1]?.id || agents[2]?.id, status: 'todo', thought: 'Designing system architecture and core workflows.', output: '' },
          { id: 'ticket_3', title: 'Create social media content calendar', description: `Plan and write 30-day social media content for ${companyName} across LinkedIn, Instagram, and Twitter.`, assignedTo: t[2]?.id || agents[3]?.id, status: 'todo', thought: 'Researching brand voice and audience demographics.', output: '' },
          { id: 'ticket_4', title: 'Generate financial reports & budget plan', description: `Produce quarterly financial report, budget allocation, and cash flow projections for ${companyName}.`, assignedTo: t[3]?.id || agents[Math.min(4, agents.length - 1)]?.id, status: 'todo', thought: 'Analyzing financial data and preparing reports.', output: '' },
          { id: 'ticket_5', title: 'Draft compliance & policy documentation', description: `Write all required compliance policies, HR handbook, and legal framework documents for ${companyName}.`, assignedTo: t[4]?.id || agents[Math.min(5, agents.length - 1)]?.id, status: 'todo', thought: 'Reviewing regulatory requirements for compliance documents.', output: '' },
          { id: 'ticket_6', title: 'Build client onboarding & support system', description: `Design and implement a client onboarding flow, FAQ, and customer support documentation for ${companyName}.`, assignedTo: t[5]?.id || agents[Math.min(6, agents.length - 1)]?.id, status: 'todo', thought: 'Mapping client journey and designing support workflows.', output: '' },
        ];
      }

      const nextCompany: CompanyState = {
        companyName,
        mission: mission || `${companyName} automates all ${industry || 'business'} operations with AI.`,
        goal,
        apiKey: apiKey.trim(),
        budgetUsed: 0,
        governanceMode: true
      };

      saveCompany(nextCompany);
      saveAgents(agents);
      saveTickets(tickets);

      addActivity('system', `✅ "${companyName}" workspace launched by ${userName} via Nvmix AI.`);
      addActivity('ceo', `${agents[0]?.name} hired as CEO — leading ${agents.length} specialized agents.`);
      addActivity('ceo', `Hired ${agents.length - 1} team members: ${agents.slice(1).map(a => a.role).join(', ')}.`);
      addActivity('ceo', `Created ${tickets.length} backlog tasks for goal: "${goal.substring(0, 80)}..."`);

      // CEO Welcome Email
      saveEmail({
        from: agents[0]?.name || 'CEO',
        to: `${userName} (Founder)`,
        subject: `Welcome to ${companyName} — Your AI Team is Ready`,
        body: `Dear ${userName},\n\nI am ${agents[0]?.name || 'your CEO'}, and I'm thrilled to confirm that ${companyName} is now fully operational.\n\nIndustry: ${industry || 'General Business'}\nMission: ${mission || goal}\n\nYour AI team (${agents.length} agents):\n${agents.slice(1).map(a => `  • ${a.name} — ${a.role}`).join('\n')}\n\nBacklog tasks created: ${tickets.length}\n${tickets.map((t, i) => `  ${i + 1}. ${t.title}`).join('\n')}\n\nI will begin executing tasks immediately. Enable Auto Runner or press "Pulse" to start.\n\nReady to automate everything,\n${agents[0]?.name || 'CEO'}\n${companyName}`,
        status: 'draft'
      });

      // CEO posts welcome in chat
      const sessions = getChatSessions();
      if (sessions.length > 0) {
        saveChatMessage(sessions[0].id, {
          role: 'assistant',
          content: `🚀 **${companyName} is live!**\n\nI'm ${agents[0]?.name}, your AI CEO. I've hired ${agents.length - 1} specialized agents for your ${industry || 'company'}:\n${agents.slice(1).map(a => `• **${a.name}** (${a.role})`).join('\n')}\n\n${tickets.length} tasks are queued and ready. Press **Pulse** or enable **Auto Runner** to start full automation.`,
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

        // Fetch real output from Nvmix API with full workspace files context
        try {
          const workspaceContext = getWorkspaceContext();
          const assignedAgent = agents.find(a => a.id === ticket.assignedTo);
          const agentRole = assignedAgent?.role || 'Business Agent';
          const { format } = getOutputTypeForRole(agentRole);

          // Build format-specific system prompt
          let systemPrompt = '';
          if (format === 'python_code') {
            systemPrompt = `You are an expert ${agentRole} AI agent for ${company.companyName}. Your job is to write complete, production-ready Python code.
Do NOT output placeholders or mock setups. Write REAL, fully working code with proper imports, classes, error handling, and logic.
Output ONLY the raw Python code — no markdown fences, no explanation.
${workspaceContext}`;
          } else if (format === 'financial_report') {
            systemPrompt = `You are an expert ${agentRole} AI agent for ${company.companyName}. Your job is to produce structured financial reports in CSV format.
Create REAL financial data with proper headers, realistic numbers, and multiple rows.
Format: CSV with clear headers. Include totals, summaries, and analysis rows.
Output ONLY the raw CSV content — no markdown, no explanation.
${workspaceContext}`;
          } else if (format === 'social_content') {
            systemPrompt = `You are an expert ${agentRole} AI agent for ${company.companyName}. Your job is to create compelling social media content.
Write ready-to-post content for LinkedIn, Instagram, and Twitter/X.
Include: post captions, hashtags, emojis, call-to-actions, and engagement hooks.
Format in clean Markdown with sections for each platform.
${workspaceContext}`;
          } else if (format === 'compliance_report') {
            systemPrompt = `You are an expert ${agentRole} AI agent for ${company.companyName}. Your job is to write comprehensive compliance and legal documents.
Write REAL policies with proper legal language, sections, subsections, and requirements.
Format in clean, professional Markdown with clear headings and numbered sections.
${workspaceContext}`;
          } else if (format === 'analysis_report') {
            systemPrompt = `You are an expert ${agentRole} AI agent for ${company.companyName}. Your job is to produce detailed analytical reports.
Include: executive summary, data analysis, findings, recommendations, and action items.
Use real data, statistics, and industry benchmarks where applicable.
Format in professional Markdown with clear sections and tables.
${workspaceContext}`;
          } else {
            systemPrompt = `You are an expert ${agentRole} AI agent for ${company.companyName}. Your job is to produce comprehensive, professional business documents.
Write in clear, professional language with proper structure, headings, and actionable content.
Do NOT use placeholder content. Write REAL, detailed, usable content.
Format in clean Markdown with proper sections.
${workspaceContext}`;
          }

          const userPrompt = `Task: "${ticket.title}"
Description: "${ticket.description}"
Company Goal: "${company.goal}"
Your Role: ${agentRole}
Output Format: ${format}

Produce the complete, high-quality ${format === 'python_code' ? 'Python script' : format === 'financial_report' ? 'CSV financial report' : 'document'} now. Be thorough, detailed, and production-ready:`;


          const result = await callNvmixAPI(company.apiKey.trim(), [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt },
          ], 20000);
          const raw = result?.choices?.[0]?.message?.content ?? '';
          if (raw.trim().length > 20) {
            codeOutput = raw.trim();
          } else {
            throw new Error('API returned empty or invalid output.');
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
          const assignedAgent2 = agents.find(a => a.id === ticket.assignedTo);
          const agentRole2 = assignedAgent2?.role || 'Business Agent';
          const { format: completedFormat } = getOutputTypeForRole(agentRole2);
          const outputLabel = completedFormat === 'python_code' ? 'Python script' : completedFormat === 'financial_report' ? 'financial report (CSV)' : completedFormat === 'social_content' ? 'social media content' : 'business document';

          ticket.status  = 'awaiting';
          ticket.thought = `${outputLabel.charAt(0).toUpperCase() + outputLabel.slice(1)} complete. Awaiting Board approval to save and deploy.`;
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
            // CEO stays 'working' always — only workers sleep
            agents.forEach((a) => {
              a.status = a.id === agents[0]?.id ? 'working' : 'sleeping';
            });
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
        
        // Save to workspace local disk!
        try {
          const targetAgent = agents.find((a) => a.id === ticket.assignedTo);
          const filename = getFilenameForTicket(ticket.title, targetAgent?.role ?? 'Marketer');
          const creator = agentName(ticket.assignedTo);
          saveFile(filename, ticket.output || '# Completed module work', creator);
          addActivity('agent', `Saved completed asset to disk: "${filename}"`, ticket.assignedTo);
        } catch (e: any) {
          console.error('Failed to write completed ticket file to workspace drive:', e);
        }
        
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
