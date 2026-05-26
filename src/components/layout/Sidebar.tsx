"use client";

import React from 'react';
import { 
  LayoutDashboard, Users, MessageSquare, Folder, Mail, Settings, 
  Moon, Sun, HelpCircle, LogOut, Coins, BrainCircuit 
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'Dashboard' | 'Team' | 'Chat' | 'Files' | 'Emails' | 'Settings';
  setActiveTab: (tab: 'Dashboard' | 'Team' | 'Chat' | 'Files' | 'Emails' | 'Settings') => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  companyName: string;
  budgetUsed: number;
  onLogout?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isDarkMode,
  setIsDarkMode,
  companyName,
  budgetUsed,
  onLogout
}: SidebarProps) {
  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Team', label: 'Team Swarm', icon: Users },
    { id: 'Chat', label: 'Chat Rooms', icon: MessageSquare },
    { id: 'Files', label: 'Files Space', icon: Folder },
    { id: 'Emails', label: 'Email Box', icon: Mail },
    { id: 'Settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <aside className="w-64 border-r border-[var(--border-primary)] bg-[var(--bg-card)] backdrop-blur-md flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[var(--border-primary)] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <BrainCircuit className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm tracking-tight text-[var(--text-primary)]">NVMIX OS</span>
          <span className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
            Agentic Console
          </span>
        </div>
      </div>

      {/* Swarm Label */}
      {companyName && (
        <div className="mx-4 mt-5 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-primary)] flex flex-col gap-1">
          <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">Active Swarm</span>
          <span className="text-xs font-bold text-[var(--text-primary)] truncate">{companyName}</span>
          <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-[var(--border-primary)] text-[10px] text-[var(--text-secondary)]">
            <Coins className="w-3.5 h-3.5 text-yellow-500" />
            <span className="font-medium">Budget:</span>
            <span className="font-bold text-[var(--text-primary)]">{budgetUsed.toLocaleString()} tokens</span>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-blue-500/15' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`} />
              <span className="truncate">{item.label}</span>
              
              {isActive && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-[var(--border-primary)] space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-transparent hover:border-[var(--border-primary)] transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            {isDarkMode ? <Sun className="w-4.5 h-4.5 text-yellow-500" /> : <Moon className="w-4.5 h-4.5 text-indigo-500" />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border-primary)] font-bold">
            {isDarkMode ? 'DARK' : 'LIGHT'}
          </span>
        </button>

        {/* Support Help */}
        <a
          href="https://nvmix.com/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all duration-200"
        >
          <HelpCircle className="w-4.5 h-4.5" />
          <span>Documentation</span>
        </a>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Terminate Console</span>
          </button>
        )}
      </div>
    </aside>
  );
}
