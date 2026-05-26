"use client";

import React from 'react';
import {
  LayoutDashboard, Users, MessageSquare, Folder, Mail, Settings,
  Moon, Sun, HelpCircle, LogOut, Coins, Briefcase
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface SidebarProps {
  activeTab: 'Dashboard' | 'Team' | 'Projects' | 'Chat' | 'Files' | 'Emails' | 'Settings';
  setActiveTab: (tab: 'Dashboard' | 'Team' | 'Projects' | 'Chat' | 'Files' | 'Emails' | 'Settings') => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  companyName: string;
  budgetUsed: number;
  onLogout?: () => void;
}

const menuItems = [
  { id: 'Dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'Team',      label: 'My Team',    icon: Users           },
  { id: 'Projects',  label: 'Projects',   icon: Briefcase       },
  { id: 'Chat',      label: 'Chat',       icon: MessageSquare   },
  { id: 'Files',     label: 'Files',      icon: Folder          },
  { id: 'Emails',    label: 'Email',      icon: Mail            },
  { id: 'Settings',  label: 'Settings',   icon: Settings        },
] as const;

/* Per-tab Tailwind accent maps — same on dark/light,
   just pick readable colours that work on both backgrounds */
const accentClasses: Record<string, string> = {
  Dashboard: 'bg-indigo-500/[0.12] border-indigo-500/25 text-indigo-400',
  Team:      'bg-violet-500/[0.12] border-violet-500/25 text-violet-400',
  Projects:  'bg-cyan-500/[0.12]   border-cyan-500/25   text-cyan-500',
  Chat:      'bg-blue-500/[0.12]   border-blue-500/25   text-blue-400',
  Files:     'bg-emerald-500/[0.12] border-emerald-500/25 text-emerald-500 light:text-emerald-700',
  Emails:    'bg-amber-500/[0.12]  border-amber-500/25  text-amber-500',
  Settings:  'bg-[var(--text-muted)]/[0.12] border-[var(--text-muted)]/25 text-[var(--text-muted)]',
};

const dotClasses: Record<string, string> = {
  Dashboard: 'bg-indigo-400',
  Team:      'bg-violet-400',
  Projects:  'bg-cyan-400',
  Chat:      'bg-blue-400',
  Files:     'bg-emerald-500',
  Emails:    'bg-amber-400',
  Settings:  'bg-[var(--text-muted)]',
};

export default function Sidebar({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  companyName,
  budgetUsed,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="w-64 flex flex-col h-screen select-none relative bg-[var(--bg-card)] border-r border-[var(--border-primary)]"
      style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.18)' }}
    >
      {/* Top aurora line (dark only) */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent pointer-events-none dark:opacity-100 opacity-30" />

      {/* ── Brand Header ── */}
      <div className="p-5 border-b border-[var(--border-primary)] flex items-center gap-3">
        {/* Official Nvmix logo */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-violet-600/20 blur-md" />
          <BrandLogo size={34} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-black text-[15px] tracking-tight text-[var(--text-primary)] leading-tight">Nvmix</span>
          <span className="text-[9.5px] text-indigo-400 font-medium tracking-wide mt-0.5 opacity-80">
            Agent Workspace
          </span>
        </div>
      </div>

      {/* ── Active Workspace Card ── */}
      {companyName && (
        <div className="mx-3.5 mt-4">
          <div className="p-3.5 rounded-2xl flex flex-col gap-1.5 relative overflow-hidden bg-[var(--bg-surface)] border border-indigo-500/[0.14]"
            style={{ boxShadow: '0 4px 16px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.04)' }}
          >
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-indigo-500/[0.06] rounded-full blur-xl pointer-events-none" />

            <span className="text-[9.5px] font-semibold flex items-center gap-1.5"
              style={{ color: isDarkMode ? '#818cf8' : '#4f46e5' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  backgroundColor: isDarkMode ? '#34d399' : '#16a34a',
                  boxShadow: isDarkMode ? '0 0 5px #10b981' : '0 0 5px #16a34a'
                }}
              />
              Active workspace
            </span>
            <span className="text-xs font-bold text-[var(--text-primary)] truncate">{companyName}</span>
            <div className="flex items-center gap-1.5 mt-0.5 pt-1.5 border-t border-[var(--border-primary)] text-[10px] text-[var(--text-secondary)]">
              <Coins className="w-3 h-3 opacity-80" style={{ color: isDarkMode ? '#fbbf24' : '#d97706' }} />
              <span className="font-medium">Budget used:</span>
              <span className="font-bold" style={{ color: isDarkMode ? '#f59e0b' : '#b45309' }}>{budgetUsed.toLocaleString()} tokens</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const accent = accentClasses[item.id] ?? '';
          const dot = dotClasses[item.id] ?? 'bg-indigo-400';

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[11.5px] font-bold tracking-tight transition-all duration-200 group relative border overflow-hidden ${
                isActive
                  ? `${accent} shadow-sm`
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-primary)]'
              }`}
            >
              {/* Left accent bar */}
              {isActive && (
                <span className={`absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full ${dot}`} />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-all duration-200 ${
                  isActive ? 'opacity-100 scale-105' : 'opacity-40 group-hover:opacity-65 group-hover:scale-105'
                }`}
              />
              <span className={`truncate ${isActive ? '' : 'group-hover:text-[var(--text-primary)]'}`}>
                {item.label}
              </span>

              {/* Active dot */}
              {isActive && (
                <span className={`absolute right-3 w-1.5 h-1.5 rounded-full ${dot} opacity-80`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="p-3.5 border-t border-[var(--border-primary)] space-y-1">
        {/* Theme toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200 group"
        >
          <div className="flex items-center gap-2.5">
            {isDarkMode
              ? <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-400 transition-colors" />
              : <Moon className="w-3.5 h-3.5 text-indigo-500 group-hover:text-indigo-500 transition-colors" />
            }
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
            isDarkMode
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              : 'bg-amber-400/10 text-amber-500 border border-amber-400/20'
          }`}>
            {isDarkMode ? 'DARK' : 'LIGHT'}
          </span>
        </button>

        {/* Docs */}
        <a
          href="https://nvmix.com/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200 group"
        >
          <HelpCircle className="w-3.5 h-3.5 opacity-50 group-hover:opacity-80 transition-opacity" />
          <span>Documentation</span>
        </a>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[11px] font-semibold text-rose-400/60 hover:text-rose-500 hover:bg-rose-500/[0.06] border border-transparent hover:border-rose-500/[0.12] transition-all duration-200 group"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
            <span>Sign out</span>
          </button>
        )}
      </div>

      {/* Bottom ambient fill */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-indigo-500/[0.04] to-transparent pointer-events-none" />
    </aside>
  );
}
