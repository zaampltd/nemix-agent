"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Terminal, Play, CheckCircle2, Cpu, Activity, Lock, Key,
  Eye, EyeOff, Save, Sparkles, ChevronRight, UserCheck, ThumbsUp, ThumbsDown,
  ShieldAlert, Clock, Compass, Rocket, Zap, RefreshCw, FileCode,
  Coins, Users, Kanban, Plus, PlayCircle, PauseCircle, Code, Copy, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ─── Interfaces ───
interface Agent {
  id: string;
  role: string;
  name: string;
  avatar: string;
  status: 'working' | 'sleeping';
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: 'todo' | 'inprogress' | 'awaiting' | 'done';
  thought: string;
  output?: string;
}

interface LogEntry {
  timestamp: string;
  source: string;
  message: string;
  type: 'system' | 'agent' | 'success' | 'alert' | 'error';
}

export default function Page() {
  // ─── State Management ───
  const [mission, setMission] = useState("Build an autonomous multi-agent gateway router.");
  const [goal, setGoal] = useState("Decompose and execute Next.js edge failover schemas.");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [budgetUsed, setBudgetUsed] = useState(4200);
  const [governanceMode, setGovernanceMode] = useState(true);
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Simulation Controls
  const [isAutoTicking, setIsAutoTicking] = useState(false);
  const [isHeartbeating, setIsHeartbeating] = useState(false);
  
  // Overlays & Previews
  const [activeCodePreview, setActiveCodePreview] = useState<string | null>(null);
  const [activeApprovalTicket, setActiveApprovalTicket] = useState<Ticket | null>(null);
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  
  // Custom Hire New Agent Fields
  const [newAgentRole, setNewAgentRole] = useState("");
  const [newAgentName, setNewAgentName] = useState("");

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Load API Key from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nemix_agent_key');
    if (saved) setApiKey(saved);
  }, []);

  const saveKey = () => {
    localStorage.setItem('nemix_agent_key', apiKey.trim());
    addLocalLog('[System] Gateway key securely hashed and cached client-side.');
  };

  const addLocalLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  // ─── Initialize Swarm ───
  const handleStartCompany = async () => {
    if (!mission.trim() || !goal.trim()) return;

    setIsInitializing(true);
    addLocalLog('[System] Handshaking Nemix swarm gateway...');

    try {
      const response = await fetch('/api/orchestrator/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission: mission.trim(), goal: goal.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to bootstrap Paperclip workspace');
      }

      const data = await response.json();
      
      setTimeout(() => {
        setAgents(data.state.agents);
        setTickets(data.state.tickets);
        setLogs(data.state.logs);
        setBudgetUsed(data.state.budgetUsed);
        setGovernanceMode(data.state.governanceMode);
        setInitialized(true);
        setIsInitializing(false);
        
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#3b82f6', '#10b981', '#ffffff']
        });
      }, 1500);

    } catch (e: any) {
      setIsInitializing(false);
      addLocalLog(`[Error] Handshake failed: ${e?.message || 'Gateway Timeout'}`);
    }
  };

  // ─── Trigger Heartbeat Tick ───
  const triggerHeartbeat = async () => {
    if (isHeartbeating) return;
    
    // Check if there is an active approval request blocking the loop
    const awaitingTicket = tickets.find(t => t.status === 'awaiting');
    if (awaitingTicket && governanceMode) {
      setActiveApprovalTicket(awaitingTicket);
      setIsAutoTicking(false); // pause auto ticks
      addLocalLog('[System] Heartbeat paused: Swarm awaits governance board decision.');
      return;
    }

    setIsHeartbeating(true);

    try {
      const response = await fetch('/api/orchestrator/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Heartbeat sync failed');
      }

      const data = await response.json();
      
      setTickets(data.state.tickets);
      setAgents(data.state.agents);
      setLogs(data.state.logs);
      setBudgetUsed(data.state.budgetUsed);
      
      // Auto-open approval overlay if governance mode is active
      const nextAwaiting = data.state.tickets.find((t: any) => t.status === 'awaiting');
      if (nextAwaiting && governanceMode) {
        setActiveApprovalTicket(nextAwaiting);
        setIsAutoTicking(false);
      }

      // Check if all tickets done
      const allDone = data.state.tickets.every((t: any) => t.status === 'done');
      if (allDone && tickets.some(t => t.status !== 'done')) {
        confetti({
          particleCount: 150,
          spread: 85,
          colors: ['#10b981', '#3b82f6', '#ffffff']
        });
        setIsAutoTicking(false);
      }

    } catch (e: any) {
      addLocalLog(`[Error] Heartbeat sync failure: ${e?.message}`);
      setIsAutoTicking(false);
    } finally {
      setIsHeartbeating(false);
    }
  };

  // ─── Auto Run Loop ───
  useEffect(() => {
    let interval: any;
    if (isAutoTicking) {
      interval = setInterval(() => {
        triggerHeartbeat();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAutoTicking, tickets, governanceMode]);

  // ─── Human Board Approval Decision ───
  const handleBoardApproval = async (decision: 'approved' | 'rejected') => {
    if (!activeApprovalTicket) return;
    
    const ticket = activeApprovalTicket;
    setActiveApprovalTicket(null);

    try {
      const response = await fetch('/api/orchestrator/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, decision })
      });

      if (!response.ok) {
        throw new Error('Approval registration failed');
      }

      const data = await response.json();
      setTickets(data.state.tickets);
      setAgents(data.state.agents);
      setLogs(data.state.logs);

      if (decision === 'approved') {
        confetti({
          particleCount: 50,
          spread: 40,
          colors: ['#10b981', '#ffffff']
        });
      }

    } catch (e: any) {
      addLocalLog(`[Error] Board decision failed to register: ${e?.message}`);
    }
  };

  // ─── Hire Custom Worker Agent ───
  const handleHireAgent = () => {
    if (!newAgentName.trim() || !newAgentRole.trim()) return;

    const newAgent: Agent = {
      id: `agent_${Math.random().toString(36).substring(2, 9)}`,
      role: newAgentRole,
      name: newAgentName,
      avatar: '🤖',
      status: 'sleeping'
    };

    setAgents(prev => [...prev, newAgent]);
    addLocalLog(`[CEO] Swarm expanded! Recruited specialized agent "${newAgentName}" as "${newAgentRole}".`);
    
    setIsHireModalOpen(false);
    setNewAgentName("");
    setNewAgentRole("");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f3f3f7] font-sans flex flex-col overflow-hidden selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* ─── Outer Shell Container ─── */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-42px)]">

        {/* ======================================================== */}
        {/* LEFT SIDEBAR: Org Hierarchy (250px)                     */}
        {/* ======================================================== */}
        <aside className="w-[280px] bg-[#111111]/70 border-r border-white/10 flex flex-col shrink-0 relative z-20 backdrop-blur-md">
          {/* Top Brand Mission */}
          <div className="p-5 border-b border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5.5 h-5.5 text-blue-400" />
              <span className="font-extrabold text-xs tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 font-outfit">
                NEMIX SWARM
              </span>
            </div>
            {initialized && (
              <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1">
                <span className="text-[8px] font-black uppercase text-blue-400 tracking-wider">Mission Statement</span>
                <p className="text-[10px] leading-relaxed text-zinc-400 line-clamp-3">
                  {mission}
                </p>
              </div>
            )}
          </div>

          {/* Org Chart Tree Navigation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3" /> Swarm Hierarchy
              </span>
            </div>

            {agents.length === 0 ? (
              <div className="text-center py-20 text-zinc-600 text-[10px] leading-relaxed border border-dashed border-white/5 rounded-xl">
                Hive inactive. Establish company details to hire agents.
              </div>
            ) : (
              <div className="space-y-3.5 pl-1.5">
                
                {/* CEO Node */}
                {agents.filter(a => a.id === 'agent_ceo').map(ceo => (
                  <div key={ceo.id} className="relative group">
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900 border border-white/5 shadow-md">
                      <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center text-base shrink-0">
                        {ceo.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-black uppercase text-white truncate">{ceo.name}</h4>
                        <p className="text-[8px] font-bold text-blue-400 uppercase tracking-wide mt-0.5">{ceo.role}</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full relative shrink-0 ${
                        ceo.status === 'working' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'
                      }`} />
                    </div>
                    {/* Visual Connection line to worker agents */}
                    <div className="absolute left-6 top-11 bottom-[-20px] w-0.5 bg-white/5 pointer-events-none" />
                  </div>
                ))}

                {/* Worker Nodes */}
                <div className="space-y-2.5 pl-6 pt-2">
                  {agents.filter(a => a.id !== 'agent_ceo').map(worker => (
                    <div key={worker.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-black/40 border border-white/5 group relative">
                      {/* Connection horizontal line */}
                      <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-4 h-0.5 bg-white/5 pointer-events-none" />
                      
                      <div className="w-7.5 h-7.5 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-center text-sm shrink-0">
                        {worker.avatar}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="text-[9px] font-black uppercase text-zinc-300 truncate">{worker.name}</h5>
                        <p className="text-[8px] font-medium text-zinc-500 truncate mt-0.5">{worker.role}</p>
                      </div>
                      
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        worker.status === 'working' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'
                      }`} />
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>

          {/* Hire Button */}
          {initialized && (
            <div className="p-4 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setIsHireModalOpen(true)}
                className="w-full h-10 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 transition-all font-bold text-xs flex items-center justify-center gap-1.5 text-zinc-300"
              >
                <Plus className="w-4 h-4 text-blue-400" />
                Hire New Agent
              </button>
            </div>
          )}
        </aside>

        {/* ======================================================== */}
        {/* MAIN CONTENT AREA: Workspace & Kanban Board              */}
        {/* ======================================================== */}
        <main className="flex-1 flex flex-col bg-[#050505] overflow-hidden relative z-10">
          
          {/* Header Workspace Options */}
          <header className="px-6 py-4.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#050505]/90 backdrop-blur-md">
            
            {/* Left: Active Goal */}
            <div className="flex-1 max-w-lg min-w-0 pr-4">
              <span className="text-[8px] font-black uppercase text-blue-400 tracking-wider">Active Corporate Directive</span>
              <h2 className="text-xs font-bold text-zinc-200 truncate mt-0.5">
                {initialized ? goal : "Awaiting Swarm Initialization..."}
              </h2>
            </div>

            {/* Right Controls */}
            {initialized && (
              <div className="flex items-center gap-5 shrink-0">
                {/* Budget Coins */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/60 border border-white/5">
                  <Coins className="w-4 h-4 text-blue-400" />
                  <div>
                    <span className="text-[7px] font-black uppercase text-zinc-500 tracking-wider block">Budget Tokens</span>
                    <span className="text-xs font-bold text-white font-mono leading-none">
                      {budgetUsed.toLocaleString()} <span className="text-[9px] text-zinc-500">NMX</span>
                    </span>
                  </div>
                </div>

                {/* God Mode Governance Mode Toggle */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/60 border border-white/5">
                  <div>
                    <span className="text-[7px] font-black uppercase text-zinc-500 tracking-wider block">Governance Mode</span>
                    <span className="text-[10px] font-bold text-white leading-none">
                      {governanceMode ? "God Mode On" : "Autonomous"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGovernanceMode(!governanceMode);
                      addLocalLog(`[System] Governance Mode toggled ${!governanceMode ? 'ON (Board Yes/No required)' : 'OFF (Autonomous auto-merge)'}`);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
                      governanceMode ? 'bg-blue-600' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      governanceMode ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Heartbeat Tickers */}
                <div className="flex items-center gap-2">
                  {/* Auto Ticks Loop */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoTicking(!isAutoTicking);
                      addLocalLog(`[System] Auto heartbeat execution loop ${!isAutoTicking ? 'STARTED' : 'PAUSED'}.`);
                    }}
                    className={`h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all text-white shadow-lg ${
                      isAutoTicking 
                        ? 'bg-zinc-800 hover:bg-zinc-700' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-600/10'
                    }`}
                  >
                    {isAutoTicking ? (
                      <>
                        <PauseCircle className="w-4 h-4" /> Pause Loop
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4" /> Auto Run Loop
                      </>
                    )}
                  </button>

                  {/* Manual Single Heartbeat Tick */}
                  <button
                    type="button"
                    onClick={triggerHeartbeat}
                    disabled={isHeartbeating || isAutoTicking}
                    className="h-9 px-3.5 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 transition-all font-bold text-xs flex items-center justify-center gap-1.5 text-zinc-300 disabled:opacity-40"
                  >
                    <Zap className={`w-3.5 h-3.5 text-blue-400 ${isHeartbeating ? 'animate-bounce' : ''}`} />
                    Heartbeat Tick
                  </button>
                </div>

              </div>
            )}

          </header>

          {/* Core Swarm Workspace Kanban View */}
          <div className="flex-1 overflow-hidden p-6 flex flex-col">
            
            {!initialized ? (
              // Empty Uninitialized Workspace State
              <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-600/15 animate-pulse">
                  <Kanban className="w-8 h-8 text-white" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black uppercase tracking-wider text-white font-outfit">
                    Initialize Swarm Company Pipeline
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Set up your enterprise profile and define the goal to automatically spin up a CEO and worker roster, break down tickets, and execute code using the Nemix API.
                  </p>
                </div>

                <div className="w-full bg-[#111111] border border-white/10 p-5 rounded-2xl space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Company Mission</label>
                    <input
                      type="text"
                      value={mission}
                      onChange={e => setMission(e.target.value)}
                      placeholder="e.g. Build an autonomous modular SaaS compiler firm."
                      className="w-full h-9 px-3 rounded-lg bg-black border border-white/10 text-xs text-white focus:ring-1 focus:ring-blue-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Master Swarm Goal</label>
                    <textarea
                      value={goal}
                      onChange={e => setGoal(e.target.value)}
                      placeholder="e.g. Create a fast-fallback gateway routing script and verify compilation static checks."
                      className="w-full h-16 p-3 rounded-lg bg-black border border-white/10 text-xs text-white resize-none focus:ring-1 focus:ring-blue-500/50 outline-none leading-relaxed"
                    />
                  </div>
                  
                  {/* Secure Key Vault inline */}
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      placeholder="nex_sk_ep_xxxxxxxxxxxx"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      className="w-full h-10 pl-3 pr-20 text-xs font-mono rounded-xl bg-black border border-white/10 text-white focus:ring-1 focus:ring-blue-500/50 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-12 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5 text-zinc-400" /> : <Eye className="w-3.5 h-3.5 text-zinc-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={saveKey}
                      disabled={!apiKey.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40"
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartCompany}
                    disabled={isInitializing || !mission.trim() || !goal.trim()}
                    className="w-full h-10.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/10 hover:opacity-95 disabled:opacity-40"
                  >
                    {isInitializing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Backlog & Roster...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current text-white" />
                        Initialize Swarm Pipeline
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // Kanban Grid Layout (4 columns)
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4.5 overflow-hidden">
                
                {/* ─── COLUMN 1: TO DO ─── */}
                <div className="flex flex-col bg-[#111111]/40 border border-white/5 rounded-2xl p-4 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 shrink-0">
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" /> To Do
                    </span>
                    <span className="text-[9px] font-mono font-bold text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                      {tickets.filter(t => t.status === 'todo').length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
                    {tickets.filter(t => t.status === 'todo').map(ticket => (
                      <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} />
                    ))}
                  </div>
                </div>

                {/* ─── COLUMN 2: IN PROGRESS ─── */}
                <div className="flex flex-col bg-[#111111]/40 border border-white/5 rounded-2xl p-4 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 shrink-0">
                    <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> In Progress
                    </span>
                    <span className="text-[9px] font-mono font-bold text-blue-400/80 bg-blue-950/20 border border-blue-500/10 px-1.5 py-0.5 rounded">
                      {tickets.filter(t => t.status === 'inprogress').length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
                    {tickets.filter(t => t.status === 'inprogress').map(ticket => (
                      <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} />
                    ))}
                  </div>
                </div>

                {/* ─── COLUMN 3: AWAITING APPROVAL ─── */}
                <div className="flex flex-col bg-[#111111]/40 border border-white/5 rounded-2xl p-4 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 shrink-0">
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> Governance Review
                    </span>
                    <span className="text-[9px] font-mono font-bold text-amber-400/80 bg-amber-950/20 border border-amber-500/10 px-1.5 py-0.5 rounded">
                      {tickets.filter(t => t.status === 'awaiting').length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
                    {tickets.filter(t => t.status === 'awaiting').map(ticket => (
                      <KanbanCard 
                        key={ticket.id} 
                        ticket={ticket} 
                        agents={agents} 
                        onCodePreview={setActiveCodePreview} 
                        onApproveRequest={setActiveApprovalTicket}
                        governanceMode={governanceMode}
                      />
                    ))}
                  </div>
                </div>

                {/* ─── COLUMN 4: DONE ─── */}
                <div className="flex flex-col bg-[#111111]/40 border border-white/5 rounded-2xl p-4 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 shrink-0">
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Done
                    </span>
                    <span className="text-[9px] font-mono font-bold text-emerald-400/80 bg-emerald-950/20 border border-emerald-500/10 px-1.5 py-0.5 rounded">
                      {tickets.filter(t => t.status === 'done').length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
                    {tickets.filter(t => t.status === 'done').map(ticket => (
                      <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} />
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Bottom Execution Shell Drawer */}
          {initialized && (
            <div className="h-[180px] bg-black border-t border-white/10 flex flex-col shrink-0 relative z-10 p-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2.5 shrink-0">
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Live Swarm execution log
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-50 animate-ping" />
                  <span className="text-[8px] font-mono text-emerald-400 font-extrabold tracking-widest uppercase">STREAMING</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 font-mono text-[9px] text-zinc-400 custom-scrollbar">
                {logs.map((log, idx) => {
                  const isError = log.includes('[Error]');
                  const isCEO = log.includes('[CEO]');
                  const isSystem = log.includes('[System]');
                  return (
                    <div 
                      key={idx}
                      className={`p-2 rounded-lg border leading-relaxed ${
                        isError 
                          ? 'bg-red-950/20 border-red-900/30 text-red-400' 
                          : isCEO 
                          ? 'bg-blue-950/15 border-blue-900/20 text-blue-300'
                          : isSystem 
                          ? 'bg-zinc-900/40 border-white/5 text-zinc-400'
                          : 'bg-zinc-950/20 border-transparent text-zinc-300'
                      }`}
                    >
                      {log}
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}

        </main>

      </div>

      {/* ======================================================== */}
      {/* GOVERNANCE MODAL OVERLAY: User Board decisions           */}
      {/* ======================================================== */}
      <AnimatePresence>
        {activeApprovalTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-blue-500/30 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative overflow-hidden"
            >
              {/* Alert pulses */}
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-blue-400 animate-pulse" />
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-blue-400 font-outfit">
                    GOVERNANCE VOTE REQUIRED
                  </h3>
                </div>
                <span className="text-[8px] font-black uppercase bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                  GOD MODE ACTIVED
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Target backlogged Ticket</span>
                <h4 className="text-xs font-bold text-white uppercase">{activeApprovalTicket.title}</h4>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Agent Reasoning & Synthesis Output</span>
                <p className="text-[10.5px] leading-relaxed text-zinc-400 bg-black border border-white/5 p-3 rounded-lg max-h-[140px] overflow-y-auto custom-scrollbar">
                  {activeApprovalTicket.thought}
                </p>
              </div>

              {activeApprovalTicket.output && (
                <div className="space-y-1.5">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Generated Code Preview</span>
                  <pre className="text-[9px] font-mono text-emerald-400 bg-black/80 border border-white/5 p-3 rounded-lg max-h-[120px] overflow-y-auto custom-scrollbar select-text">
                    <code>{activeApprovalTicket.output}</code>
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleBoardApproval('approved')}
                  className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/10"
                >
                  <ThumbsUp className="w-4 h-4" /> Approve Deploy
                </button>
                <button
                  type="button"
                  onClick={() => handleBoardApproval('rejected')}
                  className="h-11 rounded-xl bg-red-950/50 border border-red-500/30 hover:bg-red-950 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold text-red-400"
                >
                  <ThumbsDown className="w-4 h-4" /> Reject Code
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* CODE PREVIEW MODAL OVERLAY                              */}
      {/* ======================================================== */}
      <AnimatePresence>
        {activeCodePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[80vh] text-left"
            >
              {/* Window Header */}
              <div className="bg-black/60 px-5 py-3.5 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-mono text-zinc-300">Code Explorer Preview</span>
                </div>
                <button
                  onClick={() => setActiveCodePreview(null)}
                  className="text-zinc-500 hover:text-white text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 p-5 overflow-y-auto bg-black font-mono text-[11px] leading-relaxed text-emerald-400 custom-scrollbar select-text">
                <pre><code>{activeCodePreview}</code></pre>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* HIRE NEW AGENT MODAL OVERLAY                              */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isHireModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-white/10 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h4 className="text-xs font-black uppercase text-white font-outfit">Recruit Specialized Agent</h4>
                <button 
                  onClick={() => setIsHireModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Agent Name</label>
                  <input
                    type="text"
                    value={newAgentName}
                    onChange={e => setNewAgentName(e.target.value)}
                    placeholder="e.g. Scribe-v2, Traffic-Optimizer..."
                    className="w-full h-9 px-3 rounded-lg bg-black border border-white/10 text-xs text-white focus:ring-1 focus:ring-blue-500/50 outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Agent Role / Specialty</label>
                  <input
                    type="text"
                    value={newAgentRole}
                    onChange={e => setNewAgentRole(e.target.value)}
                    placeholder="e.g. Lead Copywriter, SEO Optimizer..."
                    className="w-full h-9 px-3 rounded-lg bg-black border border-white/10 text-xs text-white focus:ring-1 focus:ring-blue-500/50 outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleHireAgent}
                disabled={!newAgentName.trim() || !newAgentRole.trim()}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-colors disabled:opacity-40"
              >
                Hire Employee
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer copyright */}
      <footer className="py-2.5 border-t border-white/5 text-center text-[9px] font-medium text-zinc-600 bg-black shrink-0 relative z-20">
        © {new Date().getFullYear()} Nemix Corporation. All private client-side agent configurations encrypted in sandbox.
      </footer>

    </div>
  );
}

// ─── Custom Kanban Card Sub-Component ───
function KanbanCard({ 
  ticket, 
  agents, 
  onCodePreview,
  onApproveRequest,
  governanceMode
}: { 
  ticket: Ticket; 
  agents: Agent[];
  onCodePreview: (code: string) => void;
  onApproveRequest?: (ticket: Ticket) => void;
  governanceMode?: boolean;
}) {
  const agent = agents.find(a => a.id === ticket.assignedTo);
  const isAwaiting = ticket.status === 'awaiting';
  const hasOutput = !!ticket.output;

  return (
    <motion.div
      layoutId={ticket.id}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="p-3.5 rounded-xl border border-white/5 bg-[#111111]/90 shadow-md flex flex-col space-y-3 text-left"
    >
      <h4 className="text-[10.5px] font-black uppercase text-zinc-100 tracking-wide leading-tight">
        {ticket.title}
      </h4>
      <p className="text-[9.5px] text-zinc-400 leading-relaxed">
        {ticket.description}
      </p>

      {/* Reasoning log snippet */}
      <div className="bg-black/60 border border-white/5 p-2 rounded-lg text-[9px] font-mono text-zinc-500 leading-relaxed">
        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest block mb-0.5">Reasoning Log</span>
        {ticket.thought}
      </div>

      <div className="flex items-center justify-between border-t border-white/5 pt-2.5 gap-2 shrink-0">
        {/* Agent Avatar info */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded bg-zinc-950 border border-white/5 flex items-center justify-center text-xs shrink-0">
            {agent?.avatar || '🤖'}
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-bold text-zinc-300 truncate leading-tight">{agent?.name || 'Worker-Bot'}</p>
            <p className="text-[7.5px] text-zinc-500 truncate leading-tight">{agent?.role || 'Worker'}</p>
          </div>
        </div>

        {/* Action button inside card */}
        <div className="flex items-center gap-1 shrink-0">
          {hasOutput && (
            <button
              onClick={() => onCodePreview(ticket.output!)}
              className="p-1 px-1.5 rounded bg-blue-950/20 border border-blue-500/10 hover:border-blue-500/30 text-blue-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5"
            >
              <Code className="w-2.5 h-2.5" /> Output
            </button>
          )}

          {isAwaiting && onApproveRequest && governanceMode && (
            <button
              onClick={() => onApproveRequest(ticket)}
              className="p-1 px-1.5 rounded bg-emerald-950/30 border border-emerald-500/20 hover:bg-emerald-950 text-emerald-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5"
            >
              Vote
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
