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
    <div className="w-[330px] flex-shrink-0 bg-[#0c0e17] border border-[#1b1f2e] rounded-2xl flex flex-col overflow-hidden shadow-2xl relative h-full">
      {/* Shell Header */}
      <div className="flex justify-between items-center bg-[#07090f] px-4 py-3 border-b border-[#1b1f2e] shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500/80" />
          <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
          <span className="w-2 h-2 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[9px] font-mono font-black uppercase text-blue-400 tracking-widest flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-blue-400" /> Swarm Shell Streams
        </span>
        <span className="text-[8px] font-mono text-emerald-400 font-black tracking-widest uppercase flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" /> ACTIVE
        </span>
      </div>
      
      {/* Log Entries Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-2.5 pr-2 pl-4 py-4 bg-[#0a0c14] font-mono text-[10px] text-slate-350 custom-scrollbar select-text leading-relaxed"
      >
        {activities.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
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
                className={`flex items-start gap-2.5 py-0.5 border-l-2 border-transparent transition-all hover:bg-white/[0.02] ${
                  isError 
                    ? 'border-l-red-500/50 text-red-400' 
                    : isCEO 
                    ? 'border-l-blue-500/50 text-blue-450 font-semibold'
                    : isSystem 
                    ? 'text-slate-450'
                    : 'border-l-emerald-500/50 text-emerald-400'
                }`}
              >
                {/* Gutter Line Numbers */}
                <span className="opacity-20 select-none text-[8px] font-mono font-black shrink-0 mt-0.5">
                  {(idx + 1).toString().padStart(3, '0')}
                </span>
                
                {/* Time Indicator */}
                {timeStr && (
                  <span className="opacity-25 select-none text-[8.5px] font-mono shrink-0 mt-0.5">
                    [{timeStr}]
                  </span>
                )}
                
                <span className="flex-1 select-text leading-relaxed font-semibold">
                  {act.type === 'ceo' ? (
                    <span className="bg-blue-950/50 border border-blue-500/30 text-blue-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none">CEO</span>
                  ) : act.type === 'system' ? (
                    <span className="bg-slate-900/60 border border-slate-700/30 text-slate-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none">System</span>
                  ) : act.type === 'error' ? (
                    <span className="bg-red-950/50 border border-red-500/30 text-red-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none animate-pulse">Error</span>
                  ) : (
                    <span className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none">Agent</span>
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
