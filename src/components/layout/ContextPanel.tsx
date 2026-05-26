"use client";

import React from 'react';
import { 
  Activity, ShieldAlert, Cpu, Heart, Play, Pause, Sparkles,
  Layers, HardDrive, Key, Database, Mail, Users, FileText
} from 'lucide-react';
import { CompanyState, Agent, Ticket } from '@/lib/types';

interface ContextPanelProps {
  activeTab: 'Dashboard' | 'Team' | 'Chat' | 'Files' | 'Emails' | 'Settings';
  companyState: CompanyState;
  agents: Agent[];
  tickets: Ticket[];
  activeChannel?: string;
  setActiveChannel?: (chan: string) => void;
  onHeartbeat?: () => void;
  isHeartbeating?: boolean;
  isAutoTicking?: boolean;
  setIsAutoTicking?: (val: boolean) => void;
}

export default function ContextPanel({
  activeTab,
  companyState,
  agents,
  tickets,
  activeChannel = '# ceo-office',
  setActiveChannel,
  onHeartbeat,
  isHeartbeating = false,
  isAutoTicking = false,
  setIsAutoTicking
}: ContextPanelProps) {
  const completedTickets = tickets.filter(t => t.status === 'done').length;
  const inProgressTicket = tickets.find(t => t.status === 'inprogress');
  
  // Dynamic switch of content based on activeTab
  const renderPanelContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <div className="space-y-6">
            {/* Mission Statement */}
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-extrabold text-[var(--text-secondary)] tracking-wider">Mission Statement</h3>
              <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                {companyState.mission || 'Awaiting swarm deployment...'}
              </div>
            </div>

            {/* Orchestration Controls */}
            {onHeartbeat && (
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-extrabold text-[var(--text-secondary)] tracking-wider">Swarm Engine</h3>
                <div className="p-4 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Governance</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wider">
                      {companyState.governanceMode ? 'Strict Board' : 'Autonomous'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Auto Runner</span>
                    <button
                      onClick={() => setIsAutoTicking && setIsAutoTicking(!isAutoTicking)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border ${
                        isAutoTicking
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-[var(--border-primary)] text-[var(--text-secondary)] border-transparent'
                      }`}
                    >
                      {isAutoTicking ? 'Running' : 'Paused'}
                    </button>
                  </div>

                  {/* Manual Pulse Trigger */}
                  <button
                    disabled={isHeartbeating || isAutoTicking}
                    onClick={onHeartbeat}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200 btn-primary disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Activity className={`w-4 h-4 ${isHeartbeating ? 'animate-spin' : ''}`} />
                    <span>{isHeartbeating ? 'Executing Cycle...' : 'Pulse Swarm'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Engine Overview */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-[var(--text-secondary)] tracking-wider">Swarm Metrics</h3>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Completed</span>
                  <span className="text-xl font-extrabold text-[var(--text-primary)]">
                    {completedTickets}/{tickets.length}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Engine Rate</span>
                  <span className="text-xl font-extrabold text-[var(--text-primary)]">
                    {inProgressTicket ? 'Busy' : 'Idle'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Team':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-[var(--text-secondary)] tracking-wider">Hired Roster</h3>
              <div className="space-y-2">
                {agents.map((agent) => (
                  <div key={agent.id} className="p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] flex items-center gap-3">
                    <span className="text-lg">{agent.avatar || '🤖'}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{agent.name}</h4>
                      <p className="text-[10px] font-semibold text-[var(--text-secondary)] truncate">{agent.role}</p>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${agent.status === 'working' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Roster Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded bg-[var(--border-primary)] flex flex-col">
                  <span className="text-[var(--text-secondary)]">Total Hired</span>
                  <span className="font-bold text-[var(--text-primary)]">{agents.length}</span>
                </div>
                <div className="p-2 rounded bg-[var(--border-primary)] flex flex-col">
                  <span className="text-[var(--text-secondary)]">Working Now</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {agents.filter(a => a.status === 'working').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Chat':
        const channels = [
          { name: '# ceo-office', desc: 'Direct strategy with CEO' },
          ...agents.filter(a => a.id !== 'agent_ceo').map(a => ({
            name: `# ${a.role.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            desc: `Direct line to ${a.name}`
          }))
        ];
        
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-[var(--text-secondary)] tracking-wider">Rooms & Channels</h3>
              <div className="space-y-1">
                {channels.map((chan) => {
                  const isActive = activeChannel === chan.name;
                  return (
                    <button
                      key={chan.name}
                      onClick={() => setActiveChannel && setActiveChannel(chan.name)}
                      className={`w-full flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-blue-600/10 border border-blue-500/20 text-[var(--color-primary)]'
                          : 'hover:bg-[var(--bg-surface-hover)] border border-transparent text-[var(--text-secondary)]'
                      }`}
                    >
                      <span className="text-xs font-bold text-[var(--text-primary)]">{chan.name}</span>
                      <span className="text-[10px] text-[var(--text-secondary)] truncate w-full">{chan.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-3 text-[10px] text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                <span>Tip: Mentions</span>
              </div>
              <p className="leading-relaxed">
                You can tag specific agents directly in the chat using <strong className="text-[var(--text-primary)]">@AgentName</strong> to route queries to their specialized persona.
              </p>
            </div>
          </div>
        );

      case 'Files':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-[var(--text-secondary)] tracking-wider">Workspace Drives</h3>
              <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Database className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[var(--text-primary)]">Local Sandbox</span>
                    <span className="text-[9px] text-[var(--text-secondary)] uppercase">Ready</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border-primary)] text-[10px] text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between">
                    <span>Target Directory:</span>
                    <span className="font-bold text-[var(--text-primary)] truncate max-w-[150px]" title="C:\Users\shahi\NvmixProjects">
                      NvmixProjects/
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Read/Write:</span>
                    <span className="text-emerald-500 font-bold uppercase">Authorized</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'Emails':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-[var(--text-secondary)] tracking-wider">Mail Terminal</h3>
              <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[var(--text-primary)]">Email Client</span>
                    <span className="text-[9px] text-[var(--text-secondary)] uppercase">Simulated Sandbox</span>
                  </div>
                </div>

                <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed pt-2 border-t border-[var(--border-primary)]">
                  Hired agents draft email proposals for your review before dispatch. Keep track of drafts, inbox communications, and outbound emails.
                </p>
              </div>
            </div>
          </div>
        );

      case 'Settings':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-[var(--text-secondary)] tracking-wider">Security Profile</h3>
              <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Key className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[var(--text-primary)]">Nvmix API Key</span>
                    <span className="text-[9px] text-[var(--text-secondary)] uppercase">Active & Validated</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border-primary)] text-[10px] text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between">
                    <span>Key Status:</span>
                    <span className="text-emerald-500 font-bold uppercase">Connected</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Server Fallbacks:</span>
                    <span className="font-bold text-[var(--text-primary)]">5 Active Providers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="w-80 border-l border-[var(--border-primary)] bg-[var(--bg-card)] backdrop-blur-md p-6 flex flex-col h-screen overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between pb-5 border-b border-[var(--border-primary)] mb-6">
        <h2 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
          <Layers className="w-4.5 h-4.5 text-blue-500" />
          <span>Mission Control</span>
        </h2>
        <span className="text-[9px] font-extrabold bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Live
        </span>
      </div>

      {renderPanelContent()}
    </aside>
  );
}
