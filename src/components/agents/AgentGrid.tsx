"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Cpu, BrainCircuit, Compass, Code, 
  ShieldCheck, Sparkles, Network, LayoutGrid, ArrowDown, User, Briefcase, Database
} from 'lucide-react';
import { Agent } from '@/lib/types';

interface AgentGridProps {
  agents: Agent[];
  onHireAgent: (name: string, role: string) => void;
  companyGoal: string;
  budgetUsed: number;
}

export default function AgentGrid({
  agents,
  onHireAgent,
  companyGoal,
  budgetUsed
}: AgentGridProps) {
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('');
  const [viewMode, setViewMode] = useState<'chart' | 'grid'>('chart');
  
  // Interactive reporting path highlight states
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const getAgentIcon = (roleName: string) => {
    const norm = roleName.toLowerCase();
    if (norm.includes('ceo')) {
      return <BrainCircuit className="w-5 h-5 text-amber-500" />;
    } else if (norm.includes('architect') || norm.includes('design')) {
      return <Compass className="w-5 h-5 text-indigo-400" />;
    } else if (norm.includes('coder') || norm.includes('dev') || norm.includes('writer') || norm.includes('engineer')) {
      return <Code className="w-5 h-5 text-emerald-400" />;
    } else if (norm.includes('qa') || norm.includes('audit') || norm.includes('security')) {
      return <ShieldCheck className="w-5 h-5 text-rose-400" />;
    } else if (norm.includes('market') || norm.includes('sales')) {
      return <Briefcase className="w-5 h-5 text-orange-400" />;
    } else if (norm.includes('analyst') || norm.includes('data')) {
      return <Database className="w-5 h-5 text-blue-400" />;
    }
    return <Cpu className="w-5 h-5 text-[var(--text-muted)]" />;
  };

  // Dynamically compute stable telemetry metrics based on agent id
  const getAgentMetrics = (agent: Agent) => {
    const id = agent.id.toLowerCase();
    let seed = 0;
    for (let i = 0; i < id.length; i++) {
      seed += id.charCodeAt(i);
    }
    
    const temp = (0.1 + (seed % 8) * 0.1).toFixed(1);
    const baseTokens = 200 + (seed % 15) * 100;
    const tokens = ((baseTokens + (budgetUsed % 500)) / 10).toFixed(1) + 'K';
    const successRate = (95.0 + (seed % 50) * 0.1).toFixed(1) + '%';
    const latency = (10 + (seed % 30)) + 'ms';
    
    return { temp, tokens, successRate, latency };
  };

  const handleHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName.trim() || !newAgentRole.trim()) return;
    onHireAgent(newAgentName.trim(), newAgentRole.trim());
    setNewAgentName('');
    setNewAgentRole('');
    setIsHireModalOpen(false);
  };

  // ─── Resolve Reporting Hierarchy ───
  const getSupervisor = (agent: Agent, agentsList: Agent[]): Agent | null => {
    const ceoNode = agentsList.find(a => a.role.toLowerCase().includes('ceo')) || agentsList[0];
    if (!ceoNode || agent.id === ceoNode.id) return null;

    const roleLower = agent.role.toLowerCase();

    // Data Analyst reports to Marketer Lead
    if (roleLower.includes('analyst') || roleLower.includes('data')) {
      const marketer = agentsList.find(a => a.role.toLowerCase().includes('market'));
      if (marketer) return marketer;
    }
    // Sam-Support reports to Coder/Developer Lead
    if (roleLower.includes('support') || roleLower.includes('admin') || roleLower.includes('infrastructure')) {
      const dev = agentsList.find(a => a.role.toLowerCase().includes('developer') || a.role.toLowerCase().includes('dev') || a.role.toLowerCase().includes('coder'));
      if (dev) return dev;
    }
    
    // Custom hired developer reports to core Developer
    if (roleLower.includes('coder') || roleLower.includes('engineer') || roleLower.includes('qa') || roleLower.includes('test')) {
      const mainDev = agentsList.find(a => (a.role.toLowerCase().includes('developer') || a.role.toLowerCase().includes('dev')) && a.id !== agent.id);
      if (mainDev) return mainDev;
    }

    // Default: reports to CEO
    return ceoNode;
  };

  const getSubordinates = (agent: Agent, agentsList: Agent[]): Agent[] => {
    return agentsList.filter(a => {
      const superv = getSupervisor(a, agentsList);
      return superv?.id === agent.id;
    });
  };

  // Group agents by dynamic structural level for Org Chart
  const ceoNode = agents.find(a => a.role.toLowerCase().includes('ceo')) || agents[0];
  const level1 = ceoNode ? [ceoNode] : [];
  
  const level2 = agents.filter(a => {
    if (!ceoNode) return false;
    if (a.id === ceoNode.id) return false;
    const superv = getSupervisor(a, agents);
    return superv?.id === ceoNode.id;
  });

  const level3 = agents.filter(a => {
    if (!ceoNode) return false;
    if (a.id === ceoNode.id) return false;
    const superv = getSupervisor(a, agents);
    return superv !== null && superv.id !== ceoNode.id;
  });

  // Dynamic colors for role headers
  const getRoleHeaderStyle = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes('ceo')) return 'border-amber-500/30 bg-amber-500/5 text-amber-550 dark:text-amber-400';
    if (lower.includes('market') || lower.includes('growth')) return 'border-orange-500/30 bg-orange-500/5 text-orange-550 dark:text-orange-400';
    if (lower.includes('dev') || lower.includes('coder') || lower.includes('developer') || lower.includes('engineer')) return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-555 dark:text-emerald-400';
    if (lower.includes('hr') || lower.includes('helen')) return 'border-rose-500/30 bg-rose-500/5 text-rose-550 dark:text-rose-400';
    if (lower.includes('analyst') || lower.includes('data')) return 'border-blue-500/30 bg-blue-500/5 text-blue-550 dark:text-blue-400';
    return 'border-indigo-500/30 bg-indigo-500/5 text-indigo-550 dark:text-indigo-400';
  };

  // Resolve specialty details for the English layout requirements
  const getAgentDetails = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes('ceo')) {
      return {
        tier: 'Tier-1 Executive',
        specialty: 'Strategy & Oversight',
        blueprint: 'Analyzes company objectives, coordinates team tasks, schedules priorities, and tracks milestone progress.'
      };
    }
    if (lower.includes('dev') || lower.includes('coder') || lower.includes('developer') || lower.includes('engineer')) {
      return {
        tier: 'Tier-2 Director',
        specialty: 'Software Engineering',
        blueprint: 'Full stack script builder and API integrator. Translates tickets into executable code modules, manages dependencies, and compiles services.'
      };
    }
    if (lower.includes('market') || lower.includes('growth')) {
      return {
        tier: 'Tier-2 Director',
        specialty: 'Growth & Campaigns',
        blueprint: 'Outreach lead and campaign architect. Focuses on SEO visibility, market analytics, and growth funnels.'
      };
    }
    if (lower.includes('hr') || lower.includes('helen')) {
      return {
        tier: 'Tier-2 Lead',
        specialty: 'HR & Operations',
        blueprint: 'Talent coordinator. Integrates new agents, manages workspace workflows, and maintains operational consistency.'
      };
    }
    if (lower.includes('analyst') || lower.includes('data')) {
      return {
        tier: 'Tier-3 Specialist',
        specialty: 'Research & Analytics',
        blueprint: 'Web search analyst and data researcher. Audits market trends, compiles product benchmarks, and generates detailed reports.'
      };
    }
    if (lower.includes('support') || lower.includes('admin') || lower.includes('infrastructure')) {
      return {
        tier: 'Tier-3 Specialist',
        specialty: 'Infrastructure Support',
        blueprint: 'System administration and workspace maintenance. Manages background tasks, resolves database parser assets, and secures data pipelines.'
      };
    }
    // Fallback for custom agents
    return {
      tier: 'Tier-3 Specialist',
      specialty: 'Targeted Operations',
      blueprint: `Executes custom tickets, targeted scripts, or workspace auditing workflows as assigned by their supervisor.`
    };
  };

  const hasActiveHighlight = hoveredAgentId !== null || selectedAgentId !== null;

  const isHighlighted = (agentId: string) => {
    const activeId = hoveredAgentId || selectedAgentId;
    if (!activeId) return true; // Show all normally if nothing is hovered/selected
    
    if (agentId === activeId) return true;
    
    const targetAgent = agents.find(a => a.id === agentId);
    const activeAgent = agents.find(a => a.id === activeId);
    
    if (!targetAgent || !activeAgent) return false;
    
    // Is targetAgent a supervisor of activeAgent (upstream path)?
    let currentSuper = getSupervisor(activeAgent, agents);
    while (currentSuper) {
      if (currentSuper.id === agentId) return true;
      currentSuper = getSupervisor(currentSuper, agents);
    }
    
    // Is targetAgent a subordinate of activeAgent (downstream path)?
    let activeSuper = getSupervisor(targetAgent, agents);
    while (activeSuper) {
      if (activeSuper.id === activeId) return true;
      activeSuper = getSupervisor(activeSuper, agents);
    }
    
    return false;
  };

  // Custom agent card component for cleaner tree layout
  const renderAgentNode = (agent: Agent, supervisor: Agent | null) => {
    const metrics = getAgentMetrics(agent);
    const details = getAgentDetails(agent.role);
    const highlighted = isHighlighted(agent.id);
    const dimMode = hasActiveHighlight && !highlighted;
    const isActiveNode = agent.id === (hoveredAgentId || selectedAgentId);

    return (
      <motion.div 
        key={agent.id}
        onMouseEnter={() => setHoveredAgentId(agent.id)}
        onMouseLeave={() => setHoveredAgentId(null)}
        onClick={() => setSelectedAgentId(selectedAgentId === agent.id ? null : agent.id)}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ 
          opacity: dimMode ? 0.35 : 1,
          scale: isActiveNode ? 1.03 : dimMode ? 0.97 : 1,
          filter: dimMode ? 'grayscale(35%) blur(0.2px)' : 'none'
        }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`border rounded-2xl p-4 flex flex-col space-y-3 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden backdrop-blur-md text-left w-full max-w-[285px] shrink-0 mx-auto select-none cursor-pointer ${
          isActiveNode
            ? 'bg-indigo-500/[0.08] border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.18)] z-30'
            : agent.status === 'working' 
            ? 'bg-indigo-500/[0.05] border-indigo-500/25 shadow-[0_0_20px_rgba(99,102,241,0.05)]' 
            : 'bg-[var(--bg-card)] border-[var(--border-primary)] shadow-md hover:border-indigo-500/40'
        }`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-blue-500/5 blur-xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
        
        {/* Card Header Info */}
        <div className="flex justify-between items-start gap-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300 ${
              agent.status === 'working' || isActiveNode ? 'border-blue-500/35' : ''
            }`}>
              {getAgentIcon(agent.role)}
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase text-[var(--text-primary)] tracking-widest leading-none group-hover:text-blue-550 transition-colors">
                {agent.name}
              </h4>
              <span className={`inline-block text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border mt-1.5 leading-none select-none ${getRoleHeaderStyle(agent.role)}`}>
                {agent.role}
              </span>
            </div>
          </div>

          {/* Working pulsing dot */}
          <div className={`flex items-center gap-1.5 bg-[var(--bg-surface)] px-2 py-0.5 rounded-full border border-[var(--border-primary)] shrink-0 shadow-sm text-[8px] font-extrabold uppercase tracking-widest ${agent.status === 'working' ? 'text-emerald-500 font-black' : 'text-[var(--text-secondary)]'}`}>
            <span className="relative flex h-1 w-1 shrink-0">
              {agent.status === 'working' && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-1 w-1 ${agent.status === 'working' ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-[var(--text-muted)]/50'}`} />
            </span>
            <span>{agent.status}</span>
          </div>
        </div>

        {/* Command Tier Badge & Supervisor */}
        <div className="flex flex-wrap items-center gap-1.5 select-none relative z-10">
          <span className="text-[7.5px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 font-sans tracking-wide uppercase leading-none">
            {details.tier}
          </span>
          {supervisor && (
            <div className="text-[8px] font-mono font-bold text-[var(--text-secondary)] flex items-center gap-1 bg-[var(--bg-surface)]/60 px-2 py-0.5 rounded border border-[var(--border-primary)]/40 w-fit select-none">
              <span className="text-[var(--text-muted)] uppercase tracking-widest text-[7px] leading-none">Reports To:</span>
              <span className="text-[var(--text-primary)] uppercase leading-none font-sans font-black flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                {supervisor.name}
              </span>
            </div>
          )}
        </div>

        {/* Function Specialty Description */}
        <div className="text-[9.5px] text-[var(--text-secondary)] font-medium leading-relaxed font-sans select-text bg-[var(--bg-surface)]/30 p-2.5 rounded-xl border border-[var(--border-primary)]/40 relative z-10">
          <strong className="text-[var(--text-primary)] font-bold block mb-1 select-none text-[8px] uppercase tracking-wider text-indigo-400">Specialty Blueprint:</strong>
          {details.blueprint}
        </div>

        {/* Dynamic Telemetry Row */}
        <div className="grid grid-cols-4 gap-1.5 pt-1.5 border-t border-[var(--border-primary)]/20 text-[8.5px] font-mono select-none relative z-10">
          <div className="bg-[var(--bg-primary)] p-1.5 rounded-lg border border-[var(--border-primary)]/40 text-center">
            <span className="text-[var(--text-muted)] block text-[6.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Temp</span>
            <span className="text-[var(--text-primary)] font-extrabold">{metrics.temp}</span>
          </div>
          <div className="bg-[var(--bg-primary)] p-1.5 rounded-lg border border-[var(--border-primary)]/40 text-center">
            <span className="text-[var(--text-muted)] block text-[6.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Tokens</span>
            <span className="text-blue-500 font-extrabold">{metrics.tokens}</span>
          </div>
          <div className="bg-[var(--bg-primary)] p-1.5 rounded-lg border border-[var(--border-primary)]/40 text-center">
            <span className="text-[var(--text-muted)] block text-[6.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Acc</span>
            <span className="text-emerald-500 font-extrabold">{metrics.successRate}</span>
          </div>
          <div className="bg-[var(--bg-primary)] p-1.5 rounded-lg border border-[var(--border-primary)]/40 text-center">
            <span className="text-[var(--text-muted)] block text-[6.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Ping</span>
            <span className="text-indigo-500 font-extrabold">{metrics.latency}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-5 h-full">
      {/* Header and Toggle Controls */}
      <div className="flex justify-between items-center shrink-0 select-none border-b border-[var(--border-primary)]/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/5">
            <Network className="w-5 h-5 text-blue-555 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] tracking-tight block leading-none">
              Team Org Chart
            </h3>
            <span className="text-[8.5px] text-blue-500 font-medium tracking-wide mt-1.5 block">
              Reporting structure & agent overview
            </span>
          </div>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--bg-surface)] border border-[var(--border-primary)] p-0.5 rounded-xl shadow-inner text-[9px] font-black uppercase tracking-wider mr-1">
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'chart'
                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-450 font-extrabold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Org Chart</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-450 font-extrabold shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid List</span>
            </button>
          </div>

          <button
            onClick={() => setIsHireModalOpen(true)}
            className="h-9 text-xs px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 border border-blue-400/20 text-white flex items-center gap-1.5 uppercase font-bold shadow-md shadow-blue-500/15 cursor-pointer hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 text-white" /> 
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Main Roster Body content depending on selected tab */}
      <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar pb-6 relative">
        <AnimatePresence mode="wait">
          {viewMode === 'chart' ? (
            /* ==================== ORG CHART TREE VIEW ==================== */
            <motion.div
              key="org-chart"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col items-center space-y-6 py-6 w-full text-center select-none"
            >
              {/* Interactive Legend Banner */}
              <div className="w-full max-w-4xl bg-indigo-500/[0.06] border border-indigo-500/15 rounded-2xl p-4 mb-2 text-left backdrop-blur-md select-none">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Network className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-[var(--text-primary)] tracking-tight leading-none">
                      How to use
                    </h4>
                    <p className="text-[9.5px] text-[var(--text-secondary)] mt-1.5 leading-relaxed font-sans">
                      This interactive chart maps **reporting structures** and **operational blue prints**.
                      Hover or click any agent card to highlight their active reporting hierarchy, supervisors, and direct subordinates in real time.
                    </p>
                  </div>
                </div>
              </div>

              {/* Level 1: Executive (CEO Node) */}
              {level1.map(agent => {
                const highlighted = isHighlighted(agent.id);
                return (
                  <div key={agent.id} className="relative w-full flex flex-col items-center">
                    <span className="text-[7.5px] font-semibold text-[var(--text-muted)] tracking-wider bg-[var(--bg-surface)] px-3 py-1 border border-[var(--border-primary)] rounded-full mb-3 shadow-sm select-none">
                      Leadership
                    </span>
                    {renderAgentNode(agent, null)}
                    {level2.length > 0 && (
                      <div className={`w-0.5 h-8 mt-2 select-none shadow-sm transition-all duration-300 ${
                        hasActiveHighlight && highlighted
                          ? 'bg-gradient-to-b from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                          : 'bg-gradient-to-b from-blue-500 to-indigo-500'
                      }`} />
                    )}
                  </div>
                );
              })}

              {/* Level 2: Department Leads Row */}
              {level2.length > 0 && (
                <div className="w-full flex flex-col items-center relative">
                  
                  {/* The Horizontal Connector Bridge */}
                  {level2.length > 1 && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center -mt-6 select-none pointer-events-none">
                      <div className={`h-0.5 w-[70%] max-w-[850px] transition-all duration-300 ${
                        hasActiveHighlight 
                          ? 'bg-gradient-to-r from-blue-500/20 via-indigo-500 to-blue-500/20 shadow-[0_0_8px_rgba(129,140,248,0.5)]' 
                          : 'bg-gradient-to-r from-blue-500/10 via-indigo-500/50 to-blue-500/10'
                      }`} />
                    </div>
                  )}

                  <span className="text-[7.5px] font-semibold text-[var(--text-muted)] tracking-wider bg-[var(--bg-surface)] px-3 py-1 border border-[var(--border-primary)] rounded-full mb-4 shadow-sm select-none">
                    Department Leads
                  </span>
                  
                  {/* Grid layout for leads */}
                  <div className="flex flex-wrap justify-center gap-6 w-full max-w-5xl px-4 relative">
                    {level2.map(agent => {
                      const subordinates = getSubordinates(agent, agents);
                      const highlighted = isHighlighted(agent.id);
                      const dimMode = hasActiveHighlight && !highlighted;
                      return (
                        <div key={agent.id} className="flex flex-col items-center min-w-[285px] max-w-[290px] relative">
                          
                          {/* Top connector line for this node to meet the horizontal bridge */}
                          <div className={`w-0.5 h-4 -mt-4 mb-2 select-none transition-all duration-300 ${
                            dimMode 
                              ? 'bg-indigo-500/10' 
                              : hasActiveHighlight && highlighted
                              ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' 
                              : 'bg-indigo-500/40'
                          }`} />

                          {renderAgentNode(agent, ceoNode)}
                          
                          {subordinates.length > 0 && (
                            <div className={`w-0.5 h-6 mt-2 select-none transition-all duration-300 ${
                              dimMode
                                ? 'bg-indigo-500/10'
                                : hasActiveHighlight && highlighted
                                ? 'bg-gradient-to-b from-indigo-500 to-blue-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]'
                                : 'bg-gradient-to-b from-indigo-500 to-blue-400'
                            }`} />
                          )}
                          
                          {/* Render direct Level 3 children underneath their specific supervisor! */}
                          {subordinates.length > 0 && (
                            <div className="flex flex-col gap-4 mt-2 w-full">
                              {subordinates.map(subAgent => (
                                <div key={subAgent.id} className="w-full">
                                  {renderAgentNode(subAgent, agent)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Orphans Level 2 check: if some level 3 agents supervisor is missing from Level 2, render them separately */}
              {level3.filter(a => !level2.some(l2 => l2.id === getSupervisor(a, agents)?.id)).length > 0 && (
                <div className="w-full flex flex-col items-center mt-6">
                  <span className="text-[7.5px] font-semibold text-[var(--text-muted)] tracking-wider bg-[var(--bg-surface)] px-3 py-1 border border-[var(--border-primary)] rounded-full mb-4 shadow-sm select-none">
                    Specialists
                  </span>
                  <div className="flex flex-wrap justify-center gap-6 w-full max-w-5xl px-4">
                    {level3.filter(a => !level2.some(l2 => l2.id === getSupervisor(a, agents)?.id)).map(agent => (
                      <div key={agent.id} className="min-w-[285px] max-w-[290px]">
                        {renderAgentNode(agent, getSupervisor(agent, agents))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* ==================== CLASSIC GRID ROSTER VIEW ==================== */
            <motion.div
              key="grid-roster"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {agents.map((agent) => {
                const supervisor = getSupervisor(agent, agents);
                const metrics = getAgentMetrics(agent);
                const details = getAgentDetails(agent.role);
                
                const blueprintText = agent.role.toLowerCase().includes('ceo') 
                  ? `Analyze goals, coordinate workers, and organize task backlogs.`
                  : `Execute assigned tasks, targeted scripts, or workspace workflows.`;

                return (
                  <div 
                    key={agent.id} 
                    className={`border rounded-2xl p-5 flex flex-col space-y-4 hover:border-blue-500/35 transition-all duration-300 group relative overflow-hidden backdrop-blur-md ${
                      agent.status === 'working' 
                        ? 'bg-indigo-500/[0.05] border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.04)]' 
                        : 'bg-[var(--bg-card)] border-[var(--border-primary)] shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
                    
                    {/* Profile Card Header */}
                    <div className="flex justify-between items-start gap-2 relative z-10 select-none">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-inner ${
                          agent.status === 'working' ? 'border-blue-500/30' : ''
                        }`}>
                          {getAgentIcon(agent.role)}
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-[var(--text-primary)] tracking-widest group-hover:text-blue-550 transition-colors leading-tight">
                            {agent.name}
                          </h4>
                          <p className="text-[8px] font-black text-blue-555 uppercase tracking-widest mt-1.5 opacity-85">
                            {agent.role}
                          </p>
                        </div>
                      </div>

                      {/* Pulsing state indicator */}
                      <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] px-2.5 py-1 rounded-full border border-[var(--border-primary)] shrink-0 shadow-sm">
                        <span className="relative flex h-1.5 w-1.5">
                          {agent.status === 'working' && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${agent.status === 'working' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-[var(--text-muted)]/50'}`} />
                        </span>
                        <span className={`text-[8.5px] font-extrabold uppercase tracking-widest ${agent.status === 'working' ? 'text-emerald-500 font-black' : 'text-[var(--text-secondary)]'}`}>
                          {agent.status}
                        </span>
                      </div>
                    </div>

                    {/* Supervisor line in Grid view */}
                    <div className="flex flex-wrap items-center gap-2 select-none relative z-10">
                      <span className="text-[7.5px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20 font-sans tracking-wide uppercase leading-none">
                        {details.tier}
                      </span>
                      {supervisor && (
                        <div className="text-[8px] font-mono font-bold text-[var(--text-secondary)] flex items-center gap-1 bg-[var(--bg-surface)] px-2 py-0.5 rounded-full border border-[var(--border-primary)] w-fit select-none">
                          <span className="text-[var(--text-muted)] uppercase tracking-widest text-[7px] leading-none">Reports To:</span>
                          <span className="text-[var(--text-primary)] uppercase font-sans font-black flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-indigo-500" />
                            {supervisor.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Blueprint Prompt Panel */}
                    <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] p-4 rounded-xl text-[10px] font-mono leading-relaxed shadow-inner relative group/panel border-l-2 border-l-indigo-500/40">
                      <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-2 mb-2 select-none text-[8.5px] font-black text-[var(--text-muted)] uppercase tracking-wider font-sans">
                        <span className="text-[8.5px] font-bold text-indigo-400 tracking-widest">prompt_system_blueprint.py</span>
                        <span className="opacity-80">ReadOnly • UTF-8</span>
                      </div>
                      <div className="select-text overflow-y-auto max-h-[75px] custom-scrollbar text-[var(--text-primary)] font-medium">
                        <span className="text-purple-500 font-semibold">class</span> <span className="text-indigo-500">{agent.name.replace(/[^a-zA-Z0-9]/g, '')}</span>:<br />
                        &nbsp;&nbsp;<span className="text-purple-500 font-semibold">def</span> <span className="text-indigo-400">execute</span>(self):<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-500">"""</span><br />
                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[var(--text-secondary)]">{blueprintText}</span><br />
                        &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-500">"""</span>
                      </div>
                    </div>

                    {/* Specialty details block */}
                    <div className="bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-primary)]/40 text-[9.5px] text-[var(--text-secondary)] font-sans flex items-start gap-2 select-text">
                      <span className="text-indigo-400 font-semibold shrink-0 border border-indigo-500/20 bg-indigo-500/5 px-1.5 py-0.5 rounded leading-none text-[7px] uppercase tracking-wider">Role</span>
                      <p className="leading-normal">{details.blueprint}</p>
                    </div>

                    {/* Dynamic Telemetry meters */}
                    <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[var(--border-primary)]/20 text-[9px] font-mono relative z-10 select-none">
                      <div className="bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-primary)]/40 text-center">
                        <span className="text-[var(--text-secondary)] block text-[7.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Temp</span>
                        <span className="text-[var(--text-primary)] font-extrabold">{metrics.temp}</span>
                      </div>
                      <div className="bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-primary)]/40 text-center">
                        <span className="text-[var(--text-secondary)] block text-[7.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Compute</span>
                        <span className="text-blue-500 font-extrabold">{metrics.tokens}</span>
                      </div>
                      <div className="bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-primary)]/40 text-center">
                        <span className="text-[var(--text-secondary)] block text-[7.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Accuracy</span>
                        <span className="text-emerald-500 font-extrabold">{metrics.successRate}</span>
                      </div>
                      <div className="bg-[var(--bg-primary)] p-2 rounded-lg border border-[var(--border-primary)]/40 text-center">
                        <span className="text-[var(--text-secondary)] block text-[7.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Ping</span>
                        <span className="text-indigo-500 font-extrabold">{metrics.latency}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hire modal */}
      <AnimatePresence>
        {isHireModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[var(--bg-primary)]/80 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="cyber-card max-w-sm w-full p-6 space-y-5 shadow-2xl text-left bg-[var(--bg-card)] border border-[var(--border-primary)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-3">
                <h4 className="text-xs font-bold uppercase text-[var(--text-primary)] tracking-widest font-sans flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span>Add Team Member</span>
                </h4>
                <button 
                  onClick={() => setIsHireModalOpen(false)}
                  className="p-1 rounded-lg border border-[var(--border-primary)] hover:border-red-500/20 hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleHireSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8.5px] font-bold uppercase tracking-widest text-blue-500 block">Agent Name</label>
                  <input
                    type="text"
                    required
                    value={newAgentName}
                    onChange={e => setNewAgentName(e.target.value)}
                    placeholder="e.g. Scribe-v2, Traffic-Optimizer..."
                    className="w-full p-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[8.5px] font-bold uppercase tracking-widest text-blue-500 block">Agent Specialty / Role</label>
                  <input
                    type="text"
                    required
                    value={newAgentRole}
                    onChange={e => setNewAgentRole(e.target.value)}
                    placeholder="e.g. Lead Copywriter, QA Auditor..."
                    className="w-full p-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newAgentName.trim() || !newAgentRole.trim()}
                  className="btn-primary w-full py-3.5 mt-2 rounded-xl text-xs font-extrabold tracking-widest uppercase disabled:opacity-40 cursor-pointer"
                >
                  Hire Employee
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
