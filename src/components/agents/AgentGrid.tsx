"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, X, Cpu, BrainCircuit, Compass, Code, 
  ShieldCheck, Sparkles, Terminal 
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

  const getAgentIcon = (roleName: string) => {
    const norm = roleName.toLowerCase();
    if (norm.includes('ceo')) {
      return <BrainCircuit className="w-5 h-5 text-blue-400" />;
    } else if (norm.includes('architect') || norm.includes('design')) {
      return <Compass className="w-5 h-5 text-indigo-400" />;
    } else if (norm.includes('coder') || norm.includes('dev') || norm.includes('writer')) {
      return <Code className="w-5 h-5 text-emerald-400" />;
    } else if (norm.includes('qa') || norm.includes('audit') || norm.includes('security')) {
      return <ShieldCheck className="w-5 h-5 text-amber-400" />;
    }
    return <Cpu className="w-5 h-5 text-slate-400" />;
  };

  // Dynamically compute stable telemetry metrics based on agent id
  const getAgentMetrics = (agent: Agent) => {
    const id = agent.id.toLowerCase();
    // Compute a stable hash seed from id
    let seed = 0;
    for (let i = 0; i < id.length; i++) {
      seed += id.charCodeAt(i);
    }
    
    const temp = (0.1 + (seed % 8) * 0.1).toFixed(1);
    
    // Scale token count by budgetUsed for a dynamic "live work" feel
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0 select-none">
        <h3 className="text-xs font-black text-white uppercase tracking-widest font-sans">
          Swarm Roster Directory
        </h3>
        <button
          onClick={() => setIsHireModalOpen(true)}
          className="btn-secondary h-9 text-xs px-3.5 flex items-center gap-1.5 uppercase font-bold"
        >
          <Plus className="w-4 h-4 text-blue-500" /> 
          <span>Hire Custom Agent</span>
        </button>
      </div>

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1.5 custom-scrollbar pb-6">
        {agents.map((agent) => {
          const metrics = getAgentMetrics(agent);
          
          const blueprintText = agent.role.toLowerCase().includes('ceo') 
            ? `You analyze goals: "${companyGoal}", coordinate workers, and organize task backlogs using Nvmix API completions.`
            : `You execute targeted Swarm development, architectures, or auditing tasks dispatches dynamically.`;

          return (
            <div 
              key={agent.id} 
              className={`border rounded-2xl p-5 flex flex-col space-y-4 hover:border-blue-500/35 transition-all duration-300 group relative overflow-hidden backdrop-blur-md ${
                agent.status === 'working' 
                  ? 'bg-blue-950/10 border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.04)]' 
                  : 'bg-[var(--bg-card)] border-[var(--border-primary)] shadow-lg'
              }`}
            >
              {/* Glow Ambient background decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
              
              {/* Profile Card Header */}
              <div className="flex justify-between items-start gap-2 relative z-10 select-none">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl bg-black/40 border border-[var(--border-primary)] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-inner ${
                    agent.status === 'working' ? 'border-blue-500/30' : ''
                  }`}>
                    {getAgentIcon(agent.role)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-white tracking-widest group-hover:text-blue-400 transition-colors leading-tight">
                      {agent.name}
                    </h4>
                    <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-1.5 opacity-85">
                      {agent.role}
                    </p>
                  </div>
                </div>

                {/* Pulsing state indicator */}
                <div className="flex items-center gap-1.5 bg-black/45 px-2.5 py-1 rounded-full border border-[var(--border-primary)] shrink-0 shadow-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    {agent.status === 'working' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    )}
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${agent.status === 'working' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-slate-650'}`} />
                  </span>
                  <span className={`text-[8.5px] font-extrabold uppercase tracking-widest ${agent.status === 'working' ? 'text-emerald-400' : 'text-slate-450'}`}>
                    {agent.status}
                  </span>
                </div>
              </div>

              {/* Blueprint Prompt Panel */}
              <div className="bg-[#050608]/75 border border-[var(--border-primary)]/40 p-4 rounded-xl text-[10px] font-mono leading-relaxed shadow-inner relative group/panel border-l-2 border-l-blue-500/30">
                <div className="flex items-center justify-between border-b border-[var(--border-primary)]/20 pb-2 mb-2 select-none text-[8.5px] font-black text-gray-500 uppercase tracking-wider font-sans">
                  <span className="text-[8.5px] font-bold text-blue-400/90 tracking-widest">prompt_system_blueprint.py</span>
                  <span className="opacity-80">ReadOnly • UTF-8</span>
                </div>
                <div className="select-text overflow-y-auto max-h-[75px] custom-scrollbar text-slate-300 font-medium">
                  <span className="text-purple-400">class</span> <span className="text-blue-400">{agent.name.replace(/[^a-zA-Z0-9]/g, '')}</span>:<br />
                  &nbsp;&nbsp;<span className="text-purple-400">def</span> <span className="text-blue-400">execute</span>(self):<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"""</span><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-slate-350">{blueprintText}</span><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"""</span>
                </div>
              </div>

              {/* Dynamic Telemetry meters */}
              <div className="grid grid-cols-4 gap-2 pt-1 border-t border-[var(--border-primary)]/20 text-[9px] font-mono relative z-10 select-none">
                <div className="bg-black/20 p-2 rounded-lg border border-[var(--border-primary)]/10 text-center">
                  <span className="text-gray-500 block text-[7.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Temp</span>
                  <span className="text-slate-300 font-extrabold">{metrics.temp}</span>
                </div>
                <div className="bg-black/20 p-2 rounded-lg border border-[var(--border-primary)]/10 text-center">
                  <span className="text-gray-550 block text-[7.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Compute</span>
                  <span className="text-blue-400 font-extrabold">{metrics.tokens}</span>
                </div>
                <div className="bg-black/20 p-2 rounded-lg border border-[var(--border-primary)]/10 text-center">
                  <span className="text-gray-550 block text-[7.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Accuracy</span>
                  <span className="text-emerald-400 font-extrabold">{metrics.successRate}</span>
                </div>
                <div className="bg-black/20 p-2 rounded-lg border border-[var(--border-primary)]/10 text-center">
                  <span className="text-gray-550 block text-[7.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Ping</span>
                  <span className="text-indigo-400 font-extrabold">{metrics.latency}</span>
                </div>
              </div>

            </div>
          );
        })}
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
                <h4 className="text-xs font-bold uppercase text-white tracking-widest font-sans flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span>Recruit Swarm Agent</span>
                </h4>
                <button 
                  onClick={() => setIsHireModalOpen(false)}
                  className="p-1 rounded-lg border border-[var(--border-primary)] hover:border-red-500/20 hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleHireSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8.5px] font-bold uppercase tracking-widest text-blue-400 block">Agent Name</label>
                  <input
                    type="text"
                    required
                    value={newAgentName}
                    onChange={e => setNewAgentName(e.target.value)}
                    placeholder="e.g. Scribe-v2, Traffic-Optimizer..."
                    className="w-full p-2.5 bg-black/40 border border-[var(--border-primary)] rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500/40"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[8.5px] font-bold uppercase tracking-widest text-blue-400 block">Agent Specialty / Role</label>
                  <input
                    type="text"
                    required
                    value={newAgentRole}
                    onChange={e => setNewAgentRole(e.target.value)}
                    placeholder="e.g. Lead Copywriter, QA Auditor..."
                    className="w-full p-2.5 bg-black/40 border border-[var(--border-primary)] rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!newAgentName.trim() || !newAgentRole.trim()}
                  className="w-full py-3.5 mt-2 rounded-xl border border-blue-500/50 bg-[#082f49] hover:bg-[#0c4a6e] text-blue-300 text-xs font-extrabold tracking-widest transition-all glow-cyan uppercase disabled:opacity-40"
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
