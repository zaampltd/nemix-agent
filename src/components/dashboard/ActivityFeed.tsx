"use client";

import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';
import { ActivityItem } from '@/lib/types';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div
      className="w-[330px] flex-shrink-0 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative h-full border"
      style={{
        background: 'var(--feed-bg, #0c0e17)',
        borderColor: 'var(--feed-border, #1b1f2e)',
      }}
    >
      <style>{`
        .dark  { --feed-bg: #0c0e17; --feed-header: #07090f; --feed-border: #1b1f2e; --feed-body: #0a0c14; }
        .light { --feed-bg: #f4f5f8; --feed-header: #e8eaef;  --feed-border: rgba(99,102,241,0.1); --feed-body: #f0f2f6; }
      `}</style>

      {/* Shell Header */}
      <div
        className="flex justify-between items-center px-4 py-3 border-b shrink-0 select-none"
        style={{
          background: 'var(--feed-header, #07090f)',
          borderColor: 'var(--feed-border, #1b1f2e)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500/80" />
          <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
          <span className="w-2 h-2 rounded-full bg-green-500/80" />
        </div>
        <span className="text-[9px] font-mono font-black uppercase text-indigo-400 tracking-widest flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" /> Swarm Shell Streams
        </span>
        <span className="text-[8px] font-mono text-emerald-400 font-black tracking-widest uppercase flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]" /> ACTIVE
        </span>
      </div>

      {/* Log Entries */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-2.5 pr-2 pl-4 py-4 font-mono text-[10px] custom-scrollbar select-text leading-relaxed"
        style={{ background: 'var(--feed-body, #0a0c14)' }}
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

            let timeStr = '';
            try {
              timeStr = new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            } catch {
              timeStr = '';
            }

            return (
              <div
                key={act.id}
                className={`flex items-start gap-2.5 py-0.5 border-l-2 border-transparent transition-all hover:bg-white/[0.025] ${
                  isError
                    ? 'border-l-red-500/50 text-red-400'
                    : isCEO
                    ? 'border-l-indigo-500/60 text-indigo-400 font-semibold'
                    : isSystem
                    ? 'text-[var(--text-muted)]'
                    : 'border-l-emerald-500/50 text-emerald-400'
                }`}
              >
                {/* Gutter Line Numbers */}
                <span className="opacity-20 select-none text-[8px] font-mono font-black shrink-0 mt-0.5">
                  {(idx + 1).toString().padStart(3, '0')}
                </span>

                {/* Time */}
                {timeStr && (
                  <span className="opacity-25 select-none text-[8.5px] font-mono shrink-0 mt-0.5">
                    [{timeStr}]
                  </span>
                )}

                <span className="flex-1 select-text leading-relaxed font-semibold">
                  {act.type === 'ceo' ? (
                    <span className="bg-indigo-900/40 border border-indigo-500/25 text-indigo-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none">CEO</span>
                  ) : act.type === 'system' ? (
                    <span className="bg-white/[0.07] border border-white/[0.12] text-[var(--text-muted)] text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none">SYS</span>
                  ) : act.type === 'error' ? (
                    <span className="bg-red-900/40 border border-red-500/25 text-red-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none animate-pulse">ERR</span>
                  ) : (
                    <span className="bg-emerald-900/40 border border-emerald-500/25 text-emerald-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none">AGT</span>
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
