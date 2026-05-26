"use client";

import React, { useState } from 'react';
import { 
  Sliders, LayoutDashboard, BrainCircuit, Key, Save, 
  Sparkles, Eye, EyeOff, ShieldCheck, Moon, Sun, Database 
} from 'lucide-react';
import { CompanyState } from '@/lib/types';

interface SettingsPanelProps {
  companyState: CompanyState;
  onSave: (state: CompanyState) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export default function SettingsPanel({
  companyState,
  onSave,
  isDarkMode,
  setIsDarkMode
}: SettingsPanelProps) {
  const [companyName, setCompanyName] = useState(companyState.companyName);
  const [mission, setMission] = useState(companyState.mission);
  const [goal, setGoal] = useState(companyState.goal);
  const [apiKey, setApiKey] = useState(companyState.apiKey);
  const [governanceMode, setGovernanceMode] = useState(companyState.governanceMode);
  
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Save locally
    onSave({
      companyName: companyName.trim(),
      mission: mission.trim(),
      goal: goal.trim(),
      apiKey: apiKey.trim(),
      governanceMode,
      budgetUsed: companyState.budgetUsed
    });
    
    // Save to local storage for persistence across reloads
    localStorage.setItem('nvmix_agent_key', apiKey.trim());
    
    setTimeout(() => {
      setSaving(false);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0 border-b border-[var(--border-primary)]/30 pb-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-center justify-center">
            <Sliders className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider block leading-none">
              System configurations
            </h3>
            <span className="text-[8px] text-[var(--text-secondary)] uppercase font-mono tracking-widest mt-1 block">
              manage corporate directives and gateway credentials
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 pr-1.5 custom-scrollbar pb-6 select-none">
        
        {/* Nvmix API Gateway Info card */}
        <div className="bg-blue-950/10 border border-blue-500/20 rounded-2xl p-5 flex flex-col space-y-3 relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 leading-none">
              Nvmix Smart API Gateway
            </h4>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            The Nvmix engine operates as a highly resilient concurrent race aggregator. The gateway automatically brokers, racing multiple active LLMs concurrently on the server. There are no fees or budgets required.
          </p>
        </div>

        {/* Company Profile Settings card */}
        <div className="cyber-card p-5 space-y-4 bg-[var(--bg-card)] border border-[var(--border-primary)] relative shadow-lg">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4.5 h-4.5 text-blue-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 leading-none">
              Branding & Swarm Directive
            </h4>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Active Swarm Objective (Goal)</label>
                <input
                  type="text"
                  required
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Company Mission</label>
              <textarea
                rows={2}
                required
                value={mission}
                onChange={e => setMission(e.target.value)}
                className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner resize-none"
              />
            </div>
          </div>
        </div>

        {/* Governance Switch Settings */}
        <div className="cyber-card p-5 space-y-4 bg-[var(--bg-card)] border border-[var(--border-primary)] relative shadow-lg">
          <div className="flex items-center gap-2">
            <Sliders className="w-4.5 h-4.5 text-blue-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 leading-none">
              Governance & Autonomy Controls
            </h4>
          </div>
          
          <div className="space-y-3.5">
            {/* Governance Mode */}
            <div className="flex items-center justify-between p-3.5 bg-[var(--bg-surface)] border border-[var(--border-primary)]/40 rounded-xl">
              <div className="pr-4">
                <span className="text-[10px] font-bold text-[var(--text-primary)] block uppercase tracking-wider font-sans">
                  Strict Board Approvals (Governance Mode)
                </span>
                <span className="text-[8px] text-[var(--text-secondary)] uppercase tracking-wider block mt-0.5 font-sans leading-relaxed">
                  Require manual board verification before code merges are authorized to the local workspace
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGovernanceMode(!governanceMode)}
                className={`w-9 h-5 rounded-full relative transition-all duration-300 shadow-inner p-0.5 cursor-pointer shrink-0 ${
                  governanceMode ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md ${
                  governanceMode ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Appearance Mode */}
            <div className="flex items-center justify-between p-3.5 bg-[var(--bg-surface)] border border-[var(--border-primary)]/40 rounded-xl">
              <div className="pr-4">
                <span className="text-[10px] font-bold text-[var(--text-primary)] block uppercase tracking-wider font-sans">
                  Color Mode Appearance
                </span>
                <span className="text-[8px] text-[var(--text-secondary)] uppercase tracking-wider block mt-0.5 font-sans leading-relaxed">
                  Toggle adaptive light and obsidian dark theme palettes
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-9 h-5 rounded-full relative transition-all duration-300 shadow-inner p-0.5 cursor-pointer shrink-0 bg-slate-800`}
              >
                <div className={`w-4 h-4 rounded-full transition-all duration-300 shadow-md flex items-center justify-center ${
                  isDarkMode ? 'translate-x-4 bg-indigo-500' : 'translate-x-0 bg-yellow-500'
                }`}>
                  {isDarkMode ? <Moon className="w-2.5 h-2.5 text-white" /> : <Sun className="w-2.5 h-2.5 text-white" />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Local API keys card */}
        <div className="cyber-card p-5 space-y-4 bg-[var(--bg-card)] border border-[var(--border-primary)] relative shadow-lg">
          <div className="flex items-center gap-2">
            <Key className="w-4.5 h-4.5 text-blue-400" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 leading-none">
              Nvmix Handshake API Keys
            </h4>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
            Broker secure connections using customized vault credentials.
          </p>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              required
              placeholder="nvx_sk_ep_xxxxxxxxxxxx"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="w-full pl-4 pr-14 py-3 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving || !companyName.trim() || !goal.trim() || !apiKey.trim()}
            className="px-6 py-3.5 rounded-xl border border-blue-500/50 bg-[#082f49] hover:bg-[#0c4a6e] text-blue-300 text-xs font-black tracking-widest uppercase transition-all glow-cyan flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving changes...' : 'Save Settings'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
