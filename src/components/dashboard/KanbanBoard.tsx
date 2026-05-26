"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, Compass, Code, ShieldCheck, Cpu, 
  Terminal, ShieldAlert, CheckCircle2, Play 
} from 'lucide-react';
import { Ticket, Agent } from '@/lib/types';

interface KanbanBoardProps {
  tickets: Ticket[];
  agents: Agent[];
  onCodePreview: (code: string) => void;
  activeApprovalTicket: Ticket | null;
  onBoardApproval: (decision: 'approved' | 'rejected') => void;
  governanceMode: boolean;
}

export default function KanbanBoard({
  tickets,
  agents,
  onCodePreview,
  activeApprovalTicket,
  onBoardApproval,
  governanceMode
}: KanbanBoardProps) {
  
  const todoTickets = tickets.filter(t => t.status === 'todo');
  const inProgressTickets = tickets.filter(t => t.status === 'inprogress');
  const completedTickets = tickets.filter(t => t.status === 'done' || t.status === 'awaiting');

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      {/* Governance Banner inside Kanban view for premium notice visibility */}
      {activeApprovalTicket && governanceMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shrink-0 animate-pulse relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black uppercase text-amber-500 tracking-widest flex items-center gap-1.5 leading-none mb-1">
                Governance Review Pending
              </h4>
              <p className="text-xs text-[var(--text-primary)] font-semibold select-text truncate">
                Board approval required to merge: <strong className="text-amber-600 dark:text-amber-300">"{activeApprovalTicket.title}"</strong>
              </p>
              <p className="text-[10px] text-[var(--text-secondary)] font-mono truncate select-text mt-1 max-w-2xl bg-[var(--bg-primary)] px-2 py-0.5 rounded border border-[var(--border-primary)]">
                Reasoning: {activeApprovalTicket.thought}
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onBoardApproval('approved')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black tracking-widest uppercase transition-all shadow-md shadow-emerald-600/10"
            >
              Approve Merge
            </button>
            <button
              onClick={() => onBoardApproval('rejected')}
              className="px-4 py-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] hover:border-red-500/20 hover:text-red-500 text-[var(--text-secondary)] text-[10px] font-black tracking-widest uppercase transition-all"
            >
              Reject Code
            </button>
          </div>
        </motion.div>
      )}

      {/* Kanban Grid Columns */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        
        {/* To Do Column */}
        <div className="flex-1 flex flex-col gap-3.5 h-full overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-primary)] backdrop-blur-md rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="flex justify-between items-center px-1 shrink-0 select-none">
            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--text-muted)]/60" /> To Do
            </h3>
            <span className="text-[9px] font-mono font-black text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-primary)] px-2.5 py-0.5 rounded-lg shadow-inner">
              {todoTickets.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar pb-2">
            {todoTickets.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider">
                Backlog Empty
              </div>
            ) : (
              todoTickets.map(ticket => (
                <KanbanCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  agents={agents} 
                  onCodePreview={onCodePreview} 
                />
              ))
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="flex-1 flex flex-col gap-3.5 h-full overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-primary)] backdrop-blur-md rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="flex justify-between items-center px-1 shrink-0 select-none">
            <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
              </span>
              In Progress
            </h3>
            <span className="text-[9px] font-mono font-black text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-lg">
              {inProgressTickets.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar pb-2">
            {inProgressTickets.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider">
                No active execution
              </div>
            ) : (
              inProgressTickets.map(ticket => (
                <KanbanCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  agents={agents} 
                  onCodePreview={onCodePreview} 
                  isActive 
                />
              ))
            )}
          </div>
        </div>

        {/* Completed Column */}
        <div className="flex-1 flex flex-col gap-3.5 h-full overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-primary)] backdrop-blur-md rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-all duration-300">
          <div className="flex justify-between items-center px-1 shrink-0 select-none">
            <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" /> Completed
            </h3>
            <span className="text-[9px] font-mono font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
              {completedTickets.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar pb-2">
            {completedTickets.length === 0 ? (
              <div className="text-center py-10 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider">
                Zero completed tasks
              </div>
            ) : (
              completedTickets.map(ticket => (
                <KanbanCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  agents={agents} 
                  onCodePreview={onCodePreview} 
                  isCompleted 
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Internal Kanban Card Component ───
function KanbanCard({ 
  ticket, 
  agents, 
  onCodePreview,
  isActive = false,
  isCompleted = false
}: { 
  ticket: Ticket; 
  agents: Agent[];
  onCodePreview: (code: string) => void;
  isActive?: boolean;
  isCompleted?: boolean;
}) {
  const agent = agents.find(a => a.id === ticket.assignedTo);
  const hasOutput = !!ticket.output && ticket.output.trim().length > 10;

  const borderClass = isCompleted 
    ? 'border-[var(--border-primary)] bg-[var(--bg-card)] opacity-70 shadow-sm' 
    : isActive 
    ? 'bg-[var(--bg-card)] border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.12)]' 
    : 'bg-[var(--bg-card)] border-[var(--border-primary)] shadow-md hover:shadow-xl';

  const titleClass = isCompleted 
    ? 'text-[var(--text-secondary)] font-semibold line-through' 
    : 'text-[var(--text-primary)] font-extrabold tracking-wide';

  const getAgentIcon = (roleName: string = '') => {
    const norm = roleName.toLowerCase();
    if (norm.includes('ceo')) return '💼';
    if (norm.includes('architect')) return '📐';
    if (norm.includes('coder') || norm.includes('dev') || norm.includes('writer')) return '💻';
    if (norm.includes('qa') || norm.includes('audit')) return '🛡️';
    return '🤖';
  };

  return (
    <motion.div
      layoutId={ticket.id}
      transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      className={`border rounded-2xl p-5 flex flex-col space-y-3.5 text-left hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden group ${borderClass}`}
    >
      {/* Decorative top hover stripe */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover:via-blue-500/25 transition-all duration-300" />
      
      <div className="flex justify-between items-start gap-2 relative z-10 select-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center text-xs shrink-0 shadow-inner">
            {agent?.avatar || getAgentIcon(agent?.role)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest truncate max-w-[120px]">
              {agent?.name || 'AI specialist'}
            </span>
            <span className="text-[7.5px] text-[var(--text-secondary)] uppercase font-semibold leading-none mt-0.5 truncate">
              {agent?.role || 'Hired swarm bot'}
            </span>
          </div>
        </div>
        
        {isActive && (
          <span className="relative flex h-2 w-2 shrink-0 mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
          </span>
        )}
      </div>

      <h4 className={`text-xs uppercase tracking-wide leading-tight ${titleClass}`}>
        {ticket.title}
      </h4>
      <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed select-text font-medium">
        {ticket.description}
      </p>

      {/* Reasoning log */}
      {ticket.thought && (
        <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] p-3 rounded-xl text-[10px] font-mono text-[var(--text-secondary)] leading-relaxed shadow-inner border-l-2 border-l-blue-500/40 relative">
          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest block mb-1">Active Reasoning</span>
          <div className="select-text overflow-y-auto max-h-[70px] custom-scrollbar font-medium">
            {ticket.thought}
          </div>
        </div>
      )}

      {isActive && (
        <div className="pt-1 shrink-0 select-none">
          <div className="w-full bg-[var(--bg-primary)] rounded-full h-1.5 mb-1.5 overflow-hidden border border-[var(--border-primary)]">
            <div className="bg-blue-500 h-full rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.4)]" style={{ width: '65%' }}></div>
          </div>
          <span className="text-[9.5px] text-blue-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping mr-0.5" /> Compiling codebase module...
          </span>
        </div>
      )}

      {isCompleted && (
        <div className="w-full bg-[var(--bg-primary)] rounded-full h-1.5 mt-1 shrink-0 border border-[var(--border-primary)] overflow-hidden">
          <div className="bg-emerald-500 h-full rounded-full shadow-[0_0_6px_rgba(16,185,129,0.3)]" style={{ width: '100%' }}></div>
        </div>
      )}

      {hasOutput && (
        <div className="pt-2 border-t border-[var(--border-primary)] flex justify-end shrink-0 select-none">
          <button
            onClick={() => onCodePreview(ticket.output!)}
            className="h-7 px-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-primary)] hover:border-[var(--color-primary)] text-[var(--color-primary)] text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-black/5"
          >
            <Code className="w-3 h-3 text-[var(--color-primary)]" />
            <span>Output Code</span>
          </button>
        </div>
      )}

    </motion.div>
  );
}
