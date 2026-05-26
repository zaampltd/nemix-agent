"use client";

import React from 'react';
import { MessageSquare, Plus, Trash2, Calendar } from 'lucide-react';
import { ChatSession } from '@/lib/types';

interface ChatSessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
}

export default function ChatSessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession
}: ChatSessionListProps) {
  
  // Format date helper
  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-64 border-r border-[var(--border-primary)] bg-[var(--bg-card)]/50 backdrop-blur-md flex flex-col h-full overflow-hidden shrink-0 select-none">
      {/* Session Title Header */}
      <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between shrink-0">
        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <span>Workspaces</span>
        </h3>
        <button
          onClick={onCreateSession}
          className="p-1.5 rounded-lg border border-[var(--border-primary)] hover:border-blue-500/30 hover:bg-blue-500/10 text-[var(--text-secondary)] hover:text-blue-400 transition-all active:scale-95"
          title="New Workspace Chat"
        >
          <Plus className="w-4.5 h-4.5 text-blue-400" />
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {sessions.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)] text-[10px] uppercase font-bold tracking-wider leading-relaxed">
            No active chats.<br />Create a workspace!
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            return (
              <div
                key={session.id}
                className={`group flex items-center justify-between p-2.5 rounded-xl border border-transparent transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/10 border-blue-500/20 text-blue-400'
                    : 'hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-primary)] text-[var(--text-secondary)]'
                }`}
                onClick={() => onSelectSession(session.id)}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors truncate">
                    {session.title}
                  </div>
                  <div className="text-[9px] text-[var(--text-secondary)] truncate font-semibold mt-0.5">
                    {session.lastMessage}
                  </div>
                  <div className="flex items-center gap-1 text-[8px] text-[var(--text-muted)] mt-1 font-mono">
                    <Calendar className="w-2.5 h-2.5" />
                    <span>{formatDate(session.createdAt)}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="p-1 rounded bg-transparent opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-all"
                  title="Delete Workspace"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
