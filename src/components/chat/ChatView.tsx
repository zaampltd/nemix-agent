"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Cpu, BrainCircuit, Compass, Code, ShieldCheck, 
  UserCheck, AlertCircle, ArrowDown, Sparkles 
} from 'lucide-react';
import { ChatMessage, Agent } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatViewProps {
  messages: ChatMessage[];
  agents: Agent[];
  activeChannel: string;
  isHeartbeating: boolean;
  onSendMessage: (message: string) => void;
  sessionId: string | null;
}

export default function ChatView({
  messages,
  agents,
  activeChannel,
  isHeartbeating,
  onSendMessage,
  sessionId
}: ChatViewProps) {
  const [typedMessage, setTypedMessage] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat helper
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      const scrollTimeout = setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
      return () => clearTimeout(scrollTimeout);
    }
  }, [messages, isHeartbeating]);

  // Monitor typedMessage to trigger @mention autocomplete
  useEffect(() => {
    const lastAtIdx = typedMessage.lastIndexOf('@');
    if (lastAtIdx !== -1 && lastAtIdx >= typedMessage.length - 20) {
      const filterText = typedMessage.substring(lastAtIdx + 1).toLowerCase();
      // Only show if there's no space after '@'
      if (!filterText.includes(' ')) {
        setMentionFilter(filterText);
        setShowMentionDropdown(true);
        return;
      }
    }
    setShowMentionDropdown(false);
  }, [typedMessage]);

  const filteredAgentsForMention = agents.filter(agent => 
    agent.name.toLowerCase().includes(mentionFilter) ||
    agent.role.toLowerCase().includes(mentionFilter)
  );

  const getAgentAvatar = (name: string) => {
    const norm = name.toLowerCase();
    if (norm.includes('ceo')) return <BrainCircuit className="w-4 h-4 text-blue-400" />;
    if (norm.includes('architect')) return <Compass className="w-4 h-4 text-indigo-400" />;
    if (norm.includes('coder') || norm.includes('dev') || norm.includes('writer')) return <Code className="w-4 h-4 text-emerald-400" />;
    if (norm.includes('qa') || norm.includes('audit')) return <ShieldCheck className="w-4 h-4 text-amber-400" />;
    return <Cpu className="w-4 h-4 text-slate-400" />;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionDropdown && filteredAgentsForMention.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredAgentsForMention.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredAgentsForMention.length) % filteredAgentsForMention.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectMentionAgent(filteredAgentsForMention[mentionIndex]);
      } else if (e.key === 'Escape') {
        setShowMentionDropdown(false);
      }
    }
  };

  const selectMentionAgent = (agent: Agent) => {
    const lastAtIdx = typedMessage.lastIndexOf('@');
    if (lastAtIdx !== -1) {
      const cleanName = agent.name.replace(/\s+/g, '-');
      const newText = typedMessage.substring(0, lastAtIdx) + `@${cleanName} `;
      setTypedMessage(newText);
      setShowMentionDropdown(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !sessionId) return;
    onSendMessage(typedMessage.trim());
    setTypedMessage('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative shadow-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 h-full">
      {/* Dynamic room connections header */}
      <div className="flex items-center justify-between shrink-0 border-b border-[var(--border-primary)]/30 pb-4 mb-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-blue-500/20 flex items-center justify-center">
            <Cpu className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider block leading-none">
              {activeChannel}
            </span>
            <span className="text-[8px] text-[var(--text-secondary)] uppercase font-mono tracking-widest mt-1 block">
              active swarm communications room
            </span>
          </div>
        </div>
        
        {/* Listening avatar stack badge */}
        {agents.length > 0 && (
          <div className="flex items-center gap-3.5 bg-[var(--bg-surface)] border border-[var(--border-primary)]/40 rounded-full px-3.5 py-1.5 shadow-inner">
            <span className="text-[7.5px] font-black uppercase text-gray-500 tracking-wider">Listening Swarm:</span>
            <div className="flex -space-x-2">
              {agents.map((agent) => (
                <div 
                  key={agent.id}
                  className={`w-6 h-6 rounded-full bg-slate-900 border flex items-center justify-center shadow-md relative group/tooltip`}
                  title={`${agent.name} (${agent.role})`}
                >
                  <span className="text-xs">{agent.avatar || '🤖'}</span>
                  {agent.status === 'working' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 border border-slate-900 animate-pulse"></span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages list */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-5 pr-1.5 custom-scrollbar mb-4 bg-[var(--bg-surface)] border border-[var(--border-primary)]/30 rounded-2xl p-5 shadow-inner leading-relaxed"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3.5 select-none py-10">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase text-[var(--text-primary)] tracking-widest">Awaiting Swarm Dialogue</h4>
              <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 max-w-xs leading-relaxed">
                Start the conversation. Ask a question, give a directive, or tag specific agents with @ to interact!
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isAgent = msg.role === 'assistant' || msg.role === 'system';
            const isSystem = msg.role === 'system';
            const isUser = msg.role === 'user';
            
            let timeStr = '';
            try {
              timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch {
              timeStr = '';
            }

            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[80%] group relative ${
                  isAgent 
                    ? 'mr-auto text-left items-start' 
                    : 'ml-auto text-right items-start flex-row-reverse'
                }`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 rounded-lg bg-[var(--bg-surface)] border flex items-center justify-center shrink-0 shadow-sm ${
                  isAgent ? 'border-blue-500/20' : 'border-indigo-500/20'
                }`}>
                  {isSystem ? (
                    <Cpu className="w-4 h-4 text-slate-400" />
                  ) : isAgent ? (
                    getAgentAvatar(msg.senderName || '')
                  ) : (
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                  )}
                </div>

                <div className={`flex flex-col ${isAgent ? '' : 'items-end'}`}>
                  <div className="flex items-center gap-2 mb-1 select-none">
                    <span className="text-[9px] font-black uppercase text-[var(--text-primary)] tracking-widest leading-none flex items-center gap-1">
                      {msg.senderName || (isAgent ? 'Swarm Agent' : 'You')}
                      {isAgent && !isSystem && (
                        <span className="bg-blue-950/40 border border-blue-500/20 text-blue-400 text-[6.5px] font-extrabold uppercase px-1 py-0.5 rounded tracking-wide leading-none">
                          AI Agent
                        </span>
                      )}
                      {isSystem && (
                        <span className="bg-slate-950/40 border border-slate-700/20 text-slate-400 text-[6.5px] font-extrabold uppercase px-1 py-0.5 rounded tracking-wide leading-none">
                          System
                        </span>
                      )}
                    </span>
                    {timeStr && (
                      <span className="text-[7.5px] text-[var(--text-muted)] font-mono font-medium">{timeStr}</span>
                    )}
                  </div>

                  <div className={`p-4 rounded-2xl text-xs leading-relaxed select-text font-sans font-medium border relative transition-all shadow-md ${
                    isSystem
                      ? 'bg-slate-950/30 border-[var(--border-primary)] text-slate-400 rounded-tl-none font-mono text-[10px]'
                      : isAgent 
                      ? 'bg-[var(--bg-surface)] border-[var(--border-primary)] rounded-tl-none text-[var(--text-primary)] hover:border-blue-500/10' 
                      : 'bg-blue-950/20 border-blue-500/20 rounded-tr-none text-white hover:border-blue-500/30'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Pulse compiling loader */}
        {isHeartbeating && (
          <div className="flex gap-3 items-center mr-auto text-left max-w-[70%] text-[10px] font-mono text-blue-400/80 bg-blue-950/10 border border-blue-500/10 p-3.5 rounded-xl animate-pulse select-none">
            <BrainCircuit className="w-4 h-4 text-blue-400 animate-spin" />
            <span>Swarm engine compiles next instruction tick...</span>
            <div className="flex gap-1 items-center pl-1.5">
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-100" />
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-200" />
              <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce delay-300" />
            </div>
          </div>
        )}
      </div>

      {/* Floating Input area */}
      <div className="relative shrink-0 w-full select-none">
        
        {/* Autocomplete Mention suggestions */}
        <AnimatePresence>
          {showMentionDropdown && filteredAgentsForMention.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-full mb-2 left-0 right-0 z-30 cyber-card p-2 bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-premium max-h-48 overflow-y-auto custom-scrollbar space-y-0.5"
            >
              <div className="px-2.5 py-1.5 text-[8px] font-black text-gray-500 uppercase tracking-widest border-b border-[var(--border-primary)]/30 mb-1 leading-none">
                Mention Swarm Employee
              </div>
              {filteredAgentsForMention.map((agent, i) => (
                <button
                  key={agent.id}
                  onClick={() => selectMentionAgent(agent)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors font-semibold ${
                    i === mentionIndex 
                      ? 'bg-blue-600/10 text-blue-400' 
                      : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{agent.avatar || '🤖'}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">{agent.name}</span>
                      <span className="text-[8px] text-[var(--text-secondary)] uppercase tracking-wider font-mono">{agent.role}</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono bg-[var(--bg-surface)] border border-[var(--border-primary)] px-2 py-0.5 rounded uppercase font-bold text-gray-400">
                    ENTER
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input box */}
        <form 
          onSubmit={handleSubmit}
          className="bg-[var(--bg-card)] border border-[var(--border-primary)]/50 rounded-2xl p-2.5 flex items-center gap-3 shadow-2xl relative"
        >
          <input
            ref={inputRef}
            type="text"
            required
            disabled={!sessionId}
            value={typedMessage}
            onKeyDown={handleKeyDown}
            onChange={e => setTypedMessage(e.target.value)}
            placeholder={
              sessionId 
                ? `Direct Swarm agents in ${activeChannel}... (Type @ for employee listing)`
                : "Create or select a Workspace Chat first to begin..."
            }
            className="flex-1 bg-transparent border-none text-xs font-mono text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] px-3 py-2 disabled:opacity-50"
          />
          
          {/* Active LLM Model indicator badge */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)]/40 rounded-lg px-2.5 py-1 text-[8.5px] font-mono text-[var(--text-muted)] shrink-0 select-none hidden md:flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-blue-500 animate-pulse" />
            <span>Nvmix API Engine</span>
          </div>

          <button
            type="submit"
            disabled={!typedMessage.trim() || !sessionId}
            className="w-9 h-9 rounded-xl bg-[#082f49] hover:bg-[#0c4a6e] border border-blue-500/25 text-blue-300 flex items-center justify-center transition-all glow-cyan disabled:opacity-30 disabled:glow-none shrink-0 hover:scale-[1.03] active:scale-100 shadow-md cursor-pointer"
          >
            <Send className="w-4 h-4 text-blue-300" />
          </button>
        </form>
      </div>

    </div>
  );
}
