"use client";

import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { ActivityItem } from '@/lib/types';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic when new activities arrive
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const scrollTimeout = setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
      return () => clearTimeout(scrollTimeout);
    }
  }, [activities]);

  return (
    <div className="w-[330px] flex-shrink-0 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl flex flex-col overflow-hidden shadow-2xl relative h-full">
      {/* Shell Header */}
      <div className="flex justify-between items-center bg-[var(--bg-surface)] px-4 py-3 border-b border-[var(--border-primary)] shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[9px] font-extrabold uppercase text-[var(--color-primary)] tracking-widest font-mono flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-blue-500" /> Swarm Shell Streams
        </span>
        <span className="text-[8px] font-mono text-emerald-400 font-black tracking-widest uppercase flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" /> STREAM_ACTIVE
        </span>
      </div>
      
      {/* Log Entries Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-2.5 pr-2 pl-4 py-4 bg-[var(--bg-surface)] font-mono text-[10px] text-[var(--text-secondary)] custom-scrollbar select-text leading-relaxed"
      >
        {activities.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-widest">
            Awaiting swarm activities...
          </div>
        ) : (
          activities.slice().reverse().map((act, idx) => {
            const isError = act.type === 'error';
            const isCEO = act.type === 'ceo';
            const isSystem = act.type === 'system';
            
            // Format ISO timestamp into local time
            let timeStr = '';
            try {
              timeStr = new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            } catch {
              timeStr = '';
            }

            return (
              <div 
                key={act.id}
                className={`flex items-start gap-2.5 py-0.5 border-l-2 border-transparent transition-all hover:bg-white/[0.01] ${
                  isError 
                    ? 'border-l-red-500/40 text-red-400' 
                    : isCEO 
                    ? 'border-l-blue-500/40 text-blue-300/90 font-medium'
                    : isSystem 
                    ? 'text-slate-400/80'
                    : 'border-l-emerald-500/40 text-emerald-400'
                }`}
              >
                {/* Gutter Line Numbers */}
                <span className="opacity-25 select-none text-[8px] font-mono font-black shrink-0 mt-0.5">
                  {(idx + 1).toString().padStart(3, '0')}
                </span>
                
                {/* Time Indicator */}
                {timeStr && (
                  <span className="opacity-30 select-none text-[8.5px] font-mono shrink-0 mt-0.5">
                    [{timeStr}]
                  </span>
                )}
                
                <span className="flex-1 select-text leading-relaxed font-semibold">
                  {act.type === 'ceo' ? (
                    <span className="bg-blue-950/40 border border-blue-500/20 text-blue-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none">CEO</span>
                  ) : act.type === 'system' ? (
                    <span className="bg-slate-950/40 border border-slate-700/20 text-slate-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none">System</span>
                  ) : act.type === 'error' ? (
                    <span className="bg-red-950/40 border border-red-500/20 text-red-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none animate-pulse">Error</span>
                  ) : (
                    <span className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none">Agent</span>
                  )}
                  {act.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
