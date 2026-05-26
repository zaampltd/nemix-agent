"use client";

import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, Compass, Rocket, Key, 
  Eye, EyeOff, Save, Sparkles 
} from 'lucide-react';

interface DeploySwarmProps {
  onDeploy: (companyName: string, goal: string, mission: string, apiKey: string) => void;
  onDemoMode: () => void;
  isDeploying: boolean;
}

export default function DeploySwarm({
  onDeploy,
  onDemoMode,
  isDeploying
}: DeploySwarmProps) {
  const [companyName, setCompanyName] = useState('');
  const [goal, setGoal] = useState('');
  const [mission, setMission] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Load API Key from local storage on mount if available
  useEffect(() => {
    const saved = localStorage.getItem('nvmix_agent_key');
    if (saved) setApiKey(saved);
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('nvmix_agent_key', apiKey.trim());
      alert('Handshake key stored securely in local console storage.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !goal.trim() || !apiKey.trim()) return;
    
    const derivedMission = mission.trim() || `Build production pipelines for ${companyName.trim()}.`;
    onDeploy(
      companyName.trim(),
      goal.trim(),
      derivedMission,
      apiKey.trim()
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative z-10 select-none">
      {/* Sci-fi background ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.04),transparent_65%)] pointer-events-none" />
      
      <div className="bg-[#0e1015] border border-[var(--border-primary)] rounded-2xl p-9 max-w-lg w-full text-center space-y-6 shadow-2xl relative glowing-border">
        {/* Glowing Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 border border-blue-400/20 flex items-center justify-center animate-pulse mx-auto shadow-lg shadow-blue-500/10">
          <BrainCircuit className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-widest text-white uppercase font-sans">
            DEPLOY META SWARM
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
            Provide your custom credentials, company parameters, and directive goals. Dispatches active multi-agent trees powered strictly by the client Nvmix API.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left pt-2">
          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="text-[8.5px] font-black uppercase tracking-widest text-blue-400 block">Company Name</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <Compass className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Nvmix Fintech Corp"
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-[var(--border-primary)] rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500/40 shadow-inner"
              />
            </div>
          </div>

          {/* Goal Objective */}
          <div className="space-y-1.5">
            <label className="text-[8.5px] font-black uppercase tracking-widest text-blue-400 block">Swarm Goal Objective / Mission</label>
            <div className="relative">
              <div className="absolute left-3.5 top-4 text-gray-500">
                <Rocket className="w-4 h-4" />
              </div>
              <textarea
                required
                value={goal}
                onChange={e => setGoal(e.target.value)}
                rows={3}
                placeholder="e.g. Build an automated stock and asset trading portfolio dashboard."
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-[var(--border-primary)] rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500/40 shadow-inner resize-none"
              />
            </div>
          </div>

          {/* Optional Mission Statement */}
          <div className="space-y-1.5">
            <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-500 block">Company Mission (Optional)</label>
            <input
              type="text"
              value={mission}
              onChange={e => setMission(e.target.value)}
              placeholder="e.g. Build high-performance asset analytics portfolios."
              className="w-full px-4 py-3 bg-black/40 border border-[var(--border-primary)] rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500/40 shadow-inner"
            />
          </div>

          {/* Nvmix Handshake API key */}
          <div className="space-y-1.5">
            <label className="text-[8.5px] font-black uppercase tracking-widest text-blue-400 block">Nvmix Handshake API Key</label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showKey ? 'text' : 'password'}
                required
                placeholder="nvx_sk_ep_xxxxxxxxxxxx"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full pl-10 pr-24 py-3 bg-black/40 border border-[var(--border-primary)] rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500/40 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleSaveKey}
                disabled={!apiKey.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#082f49] hover:bg-[#0c4a6e] border border-blue-500/20 text-blue-400 disabled:opacity-40 transition-colors shadow-md"
                title="Save key to local browser vault"
              >
                <Save className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-3">
            <button
              type="submit"
              disabled={isDeploying || !companyName.trim() || !goal.trim() || !apiKey.trim()}
              className="w-full py-3.5 rounded-xl border border-blue-500/50 bg-[#082f49] hover:bg-[#0c4a6e] text-blue-300 text-xs font-extrabold tracking-widest transition-all glow-cyan uppercase disabled:opacity-50 cursor-pointer shadow-md"
            >
              {isDeploying ? "Deploying Corporate Swarm..." : "Deploy Swarm"}
            </button>
            <button
              type="button"
              onClick={onDemoMode}
              disabled={isDeploying}
              className="w-full py-3 rounded-xl border border-indigo-500/30 bg-[#2e1d44]/35 hover:bg-[#3d2060] text-indigo-400 text-xs font-semibold tracking-wider transition-all uppercase cursor-pointer"
            >
              Simulate Demo Mode (Single-Click)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
