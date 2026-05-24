"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Terminal, Play, CheckCircle2, Cpu, Activity, Lock, Key,
  Eye, EyeOff, Save, Sparkles, ChevronRight, UserCheck, ThumbsUp, ThumbsDown,
  ShieldAlert, Clock, Compass, Rocket, Zap, RefreshCw, FileCode,
  Coins, Users, Kanban, Plus, PlayCircle, PauseCircle, Code, Copy, Check,
  X, Server, CheckSquare, Layers, AlertCircle, Moon, Sun, Monitor, ShieldCheck, Database
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

export default function Page() {
  // ─── Swarm State ───
  const [mission, setMission] = useState("Build an autonomous multi-agent edge gateway router.");
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
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);
  
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
    addLocalLog('[System] Gateway key credentials safely cached in secure vault.');
  };

  const addLocalLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Toggle Theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  // ─── Initialize Swarm ───
  const handleStartCompany = async () => {
    if (!mission.trim() || !goal.trim()) return;

    setIsInitializing(true);
    addLocalLog('[System] Contacting Nemix API Gateway to broker agent roster...');

    try {
      const response = await fetch('/api/orchestrator/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission: mission.trim(), goal: goal.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to bootstrap swarm workspace');
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
          particleCount: 120,
          spread: 80,
          origin: { y: 0.7 },
          colors: ['#3b82f6', '#10b981', '#7c6af7', '#ffffff']
        });
      }, 1500);

    } catch (e: any) {
      setIsInitializing(false);
      addLocalLog(`[Error] Swarm bootstrap failed: ${e?.message || 'Gateway Timeout'}`);
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
    <div className="min-h-screen bg-nemix-bg text-nemix-text font-sans flex flex-col overflow-hidden relative selection:bg-blue-500/10 selection:text-blue-500">
      
      {/* ─── Premium Ambient Radial Glow backdrops ─── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 15, 0],
            y: [0, -15, 0]
          }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-15%] w-[800px] h-[800px] rounded-full opacity-[0.08] dark:opacity-[0.25] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-purple) 0%, transparent 65%)', filter: 'blur(150px)' }} 
        />
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            x: [0, -25, 0],
            y: [0, 25, 0]
          }}
          transition={{ repeat: Infinity, duration: 22, ease: "easeInOut" }}
          className="absolute bottom-[-20%] right-[-15%] w-[850px] h-[850px] rounded-full opacity-[0.05] dark:opacity-[0.16] pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 65%)', filter: 'blur(160px)' }} 
        />
        
        {/* Stripe Tech Operations Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)]" />
      </div>

      {/* ─── Main Scaffold Frame ─── */}
      <div className="flex flex-1 overflow-hidden h-screen relative z-10">

        {/* ======================================================== */}
        {/* LEFT SIDEBAR: Org Hierarchy (310px wide for layout flow) */}
        {/* ======================================================== */}
        <aside className="w-[310px] bg-nemix-card backdrop-blur-2xl border-r border-nemix-border flex flex-col shrink-0 relative z-20 shadow-[10px_0_40px_-20px_rgba(0,0,0,0.5)]">
          
          {/* Brand Top Block */}
          <div className="p-6 border-b border-nemix-border space-y-4 bg-black/[0.08] dark:bg-white/[0.01]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/10 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <BrainCircuit className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <span className="leading-none text-[15px] block font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                    NEMIX SWARM
                  </span>
                  <span className="text-[7.5px] font-black uppercase text-blue-400 tracking-widest block leading-none mt-1">META-ORCHESTRATOR</span>
                </div>
              </div>
              
              {/* Theme Toggler */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-8.5 h-8.5 rounded-xl border border-nemix-border hover:border-nemix-borderHover hover:bg-nemix-surface flex items-center justify-center text-nemix-secondary hover:text-nemix-text transition-all shadow-sm bg-black/10 dark:bg-white/[0.02]"
              >
                {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
            </div>

            {initialized && (
              <div className="bg-black/30 dark:bg-black/50 border border-nemix-border p-4 rounded-xl shadow-inner space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
                <span className="text-[7.5px] font-black uppercase text-blue-400 tracking-widest block leading-none">CORPORATE MISSION</span>
                <p className="text-[10px] leading-relaxed text-nemix-secondary font-medium select-text">
                  {mission}
                </p>
              </div>
            )}
          </div>

          {/* Org Chart Node Tree Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] font-black uppercase text-nemix-secondary tracking-widest flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-blue-500 opacity-80" /> Active Roster Hierarchy
              </span>
            </div>

            {agents.length === 0 ? (
              <div className="text-center py-24 text-nemix-secondary text-[10.5px] leading-relaxed border border-dashed border-nemix-border rounded-xl bg-black/10 dark:bg-black/20 px-5 space-y-3">
                <div className="w-10 h-10 rounded-full bg-nemix-surface border border-nemix-border flex items-center justify-center mx-auto text-nemix-muted">
                  <Monitor className="w-4.5 h-4.5" />
                </div>
                <p className="font-semibold text-nemix-secondary">
                  Swarm Workspace Offline.<br />Initialize the Swarm console to begin.
                </p>
              </div>
            ) : (
              <div className="space-y-5 pl-1 relative">
                
                {/* CEO Node */}
                {agents.filter(a => a.id === 'agent_ceo').map(ceo => (
                  <div key={ceo.id} className="relative">
                    <div className="cyber-card flex items-center gap-3.5 p-3.5 relative z-10 hover:-translate-y-0.5 hover:border-indigo-500/20 shadow-md">
                      {/* Gradient glow edge highlight */}
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
                      
                      <div className="w-9 h-9 rounded-lg bg-black/40 border border-nemix-border flex items-center justify-center text-lg shrink-0 shadow-inner">
                        {ceo.avatar}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-nemix-text truncate font-sans">{ceo.name}</h4>
                        <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">{ceo.role}</p>
                      </div>

                      {/* CEO active pulsing status dot */}
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        {ceo.status === 'working' && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nemix-success opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 border border-nemix-card ${
                          ceo.status === 'working' ? 'bg-nemix-success shadow-glow-success' : 'bg-nemix-muted'
                        }`} />
                      </span>
                    </div>
                    
                    {/* Visual Connection line to worker agents */}
                    <div className="absolute left-8 top-13 bottom-[-24px] w-[1px] border-l border-dashed border-nemix-border pointer-events-none opacity-80" />
                  </div>
                ))}

                {/* Worker Nodes */}
                <div className="space-y-3.5 pl-8 pt-1.5 relative">
                  {agents.filter(a => a.id !== 'agent_ceo').map(worker => (
                    <div key={worker.id} className="flex items-center gap-3 p-3 cyber-card bg-nemix-surface/30 relative hover:-translate-y-0.5 hover:border-blue-500/20 transition-all group shadow-sm">
                      {/* Connection horizontal line */}
                      <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-4 border-t border-dashed border-nemix-border pointer-events-none opacity-85" />
                      
                      <div className="w-8 h-8 rounded-lg bg-black/30 border border-nemix-border flex items-center justify-center text-sm shrink-0 shadow-inner">
                        {worker.avatar}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="text-[10px] font-extrabold uppercase text-nemix-text truncate tracking-wide">{worker.name}</h5>
                        <p className="text-[8px] font-bold text-nemix-secondary truncate mt-0.5 uppercase tracking-wider">{worker.role}</p>
                      </div>

                      {/* Worker active pulsing status dot */}
                      <span className="relative flex h-2 w-2 shrink-0">
                        {worker.status === 'working' && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nemix-success opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 border border-nemix-card ${
                          worker.status === 'working' ? 'bg-nemix-success shadow-glow-success' : 'bg-nemix-muted'
                        }`} />
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>

          {/* Sidebar Action Button */}
          {initialized && (
            <div className="p-6 border-t border-nemix-border bg-black/[0.05] shrink-0">
              <button
                type="button"
                onClick={() => setIsHireModalOpen(true)}
                className="w-full h-11 btn-secondary justify-center text-xs font-bold shadow-md shadow-black/10"
              >
                <Plus className="w-4 h-4 text-blue-500 animate-pulse" />
                Hire New Agent
              </button>
            </div>
          )}
        </aside>

        {/* ======================================================== */}
        {/* MAIN WORKSPACE: Operations Cockpit & Kanban Columns      */}
        {/* ======================================================== */}
        <main className="flex-1 flex flex-col overflow-hidden relative z-10">
          
          {/* Header Dashboard Metrics */}
          <header className="px-8 py-5 border-b border-nemix-border flex items-center justify-between shrink-0 bg-nemix-bg/85 backdrop-blur-2xl transition-all shadow-[0_4px_30px_-15px_rgba(0,0,0,0.6)]">
            
            {/* Active swarm goal */}
            <div className="flex-1 max-w-lg min-w-0 pr-6">
              <span className="text-[8px] font-black uppercase text-blue-500 tracking-widest block leading-none">ACTIVE DIRECTIVE GOAL</span>
              <h2 className="text-[12px] font-extrabold text-nemix-text truncate mt-1.5 tracking-wider uppercase font-mono bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                {initialized ? goal : "CONSOLE STATUS: OFFLINE"}
              </h2>
            </div>

            {/* Top metrics dashboard controls */}
            {initialized && (
              <div className="flex items-center gap-4 shrink-0">
                
                {/* Budget Used Metric widget */}
                <div className="flex items-center gap-3 px-4 py-2 cyber-card bg-nemix-surface/30 hover:border-blue-500/10 shadow-sm shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                    <Coins className="w-4 h-4 text-blue-500 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[7px] font-black uppercase text-nemix-secondary tracking-widest block leading-none">BUDGET USED</span>
                    <span className="text-[11px] font-black text-nemix-text font-mono leading-none mt-1 block">
                      {budgetUsed.toLocaleString()} <span className="text-[9px] text-blue-500 font-extrabold">NMX</span>
                    </span>
                  </div>
                </div>

                {/* God-Mode governance state switch */}
                <div className="flex items-center gap-3.5 px-4 py-2 cyber-card bg-nemix-surface/30 hover:border-purple-500/10 shadow-sm shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
                    <ShieldCheck className="w-4.5 h-4.5 text-purple-400" />
                  </div>
                  <div>
                    <span className="text-[7px] font-black uppercase text-nemix-secondary tracking-widest block leading-none">GOVERNANCE MODE</span>
                    <span className="text-[10px] font-black text-nemix-text uppercase tracking-wider leading-none mt-1 block">
                      {governanceMode ? "God Mode On" : "Fully Autonomous"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGovernanceMode(!governanceMode);
                      addLocalLog(`[System] Governance Mode toggled ${!governanceMode ? 'ON (Board approvals required)' : 'OFF (Autonomous loops)'}`);
                    }}
                    className={`w-9 h-5.5 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
                      governanceMode ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-glow-primary' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                      governanceMode ? 'translate-x-3.5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Heartbeats ticks buttons */}
                <div className="flex items-center gap-2">
                  
                  {/* Loop play/pause auto ticks trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoTicking(!isAutoTicking);
                      addLocalLog(`[System] Auto-heartbeat loop execution ${!isAutoTicking ? 'STARTED' : 'PAUSED'}.`);
                    }}
                    className={`h-11 px-4.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all text-white shadow-lg ${
                      isAutoTicking 
                        ? 'bg-zinc-800 hover:bg-zinc-750 border border-zinc-700' 
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 shadow-glow-primary'
                    }`}
                  >
                    {isAutoTicking ? (
                      <>
                        <PauseCircle className="w-4.5 h-4.5" /> Pause Loop
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4.5 h-4.5" /> Auto Run Loop
                      </>
                    )}
                  </button>

                  {/* Manual single heartbeat tick trigger */}
                  <button
                    type="button"
                    onClick={triggerHeartbeat}
                    disabled={isHeartbeating || isAutoTicking}
                    className="h-11 px-4 rounded-xl bg-nemix-surface border border-nemix-border hover:border-nemix-borderHover hover:bg-nemix-surface-hover transition-all font-bold text-xs flex items-center justify-center gap-1.5 text-nemix-text disabled:opacity-40"
                  >
                    <Zap className={`w-4 h-4 text-blue-500 ${isHeartbeating ? 'animate-bounce' : ''}`} />
                    Tick
                  </button>
                </div>

              </div>
            )}

          </header>

          {/* Kanban columns content area */}
          <div className="flex-1 overflow-hidden p-8 flex flex-col relative transition-all">
            
            {!initialized ? (
              // Breathtaking glowing console dashboard onboarding layout
              <div className="flex-1 flex items-center justify-center max-w-4xl mx-auto w-full">
                <div className="cyber-card glowing-border p-[1px] w-full shadow-premium">
                  <div className="bg-nemix-card rounded-[22px] overflow-hidden w-full grid grid-cols-1 md:grid-cols-12 max-h-[80vh]">
                    
                    {/* Left details grid block (5 columns) */}
                    <div className="md:col-span-5 bg-gradient-to-b from-[#0a0a10]/60 to-black/80 p-8 flex flex-col justify-between border-r border-nemix-border relative">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.08),transparent_65%)]" />
                      
                      <div className="space-y-6.5 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/10 relative overflow-hidden">
                          <BrainCircuit className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="space-y-3.5">
                          <h3 className="text-xl font-extrabold uppercase tracking-wider text-nemix-text font-sans">
                            Nemix Swarm Portal
                          </h3>
                          <p className="text-[11px] leading-relaxed text-nemix-secondary font-medium font-sans">
                            Deploy a recursive client-side swarm orchestration. The Meta-CEO breaks goals down into task backlogs, coordinates developers and auditors, and outputs compilation assets strictly routed through the secure Nemix API Gateway.
                          </p>
                        </div>

                        {/* Visual Roster pipeline progress points */}
                        <div className="space-y-4 pt-3.5">
                          {[
                            "CEO breaks goal into ticket backlogs",
                            "Specialist developers code assets",
                            "QA auditors validate compile parameters",
                            "God-Mode human board review approval"
                          ].map((step, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="w-5.5 h-5.5 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-[10px] font-black text-blue-400 font-mono shadow-inner shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-[9.5px] font-bold text-nemix-secondary uppercase tracking-wider">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-[8px] text-blue-500 font-black pt-6 border-t border-nemix-border uppercase tracking-widest relative z-10 flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-blue-500" /> CLIENT-SIDE VAULT DEPLOYMENT SECURED
                      </div>
                    </div>

                    {/* Right onboard form entries (7 columns) */}
                    <div className="md:col-span-7 p-9 bg-black/40 backdrop-blur-xl flex flex-col justify-center space-y-6">
                      
                      <div className="space-y-2">
                        <label className="text-[8.5px] font-black uppercase tracking-widest text-blue-500 block mb-1">Company Mission Statement</label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nemix-muted">
                            <Compass className="w-4.5 h-4.5" />
                          </div>
                          <input
                            type="text"
                            value={mission}
                            onChange={e => setMission(e.target.value)}
                            placeholder="e.g. Build an autonomous multi-agent edge gateway router."
                            className="w-full h-11.5 pl-11 pr-4 premium-input font-medium focus:border-blue-500/40"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[8.5px] font-black uppercase tracking-widest text-blue-500 block mb-1">Swarm Meta Directive / Goal</label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-4.5 text-nemix-muted">
                            <Rocket className="w-4.5 h-4.5" />
                          </div>
                          <textarea
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                            placeholder="e.g. Decompose and execute Next.js edge failover schemas."
                            className="w-full h-22 pl-11 pr-4 py-3.5 premium-input resize-none font-medium leading-relaxed focus:border-blue-500/40"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[8.5px] font-black uppercase tracking-widest text-blue-500 block mb-1">Secure Vault Gateway Key</label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nemix-muted">
                            <Key className="w-4.5 h-4.5" />
                          </div>
                          <input
                            type={showKey ? 'text' : 'password'}
                            placeholder="nex_sk_ep_xxxxxxxxxxxx"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            className="w-full h-11.5 pl-11 pr-24 premium-input font-semibold focus:border-blue-500/40"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-14 top-1/2 -translate-y-1/2 text-nemix-secondary hover:text-nemix-text transition-colors opacity-70"
                          >
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={saveKey}
                            disabled={!apiKey.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 shadow-md"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartCompany}
                        disabled={isInitializing || !mission.trim() || !goal.trim()}
                        className="w-full h-12.5 btn-primary justify-center uppercase tracking-widest text-xs font-black shadow-lg shadow-blue-600/10"
                      >
                        {isInitializing ? (
                          <>
                            <RefreshCw className="w-4.5 h-4.5 animate-spin text-white" />
                            Recruiting Swarm...
                          </>
                        ) : (
                          <>
                            <Play className="w-4.5 h-4.5 fill-current text-white" />
                            Initialize Swarm Company
                          </>
                        )}
                      </button>

                    </div>

                  </div>
                </div>
              </div>
            ) : (
              // Cyber Kanban Board Grid layout (4 columns)
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-hidden">
                
                {/* ─── COLUMN 1: TO DO ─── */}
                <div className="flex flex-col bg-nemix-card/20 border border-nemix-border rounded-2xl p-4.5 overflow-hidden shadow-sm backdrop-blur-2xl">
                  <div className="flex items-center justify-between border-b border-nemix-border pb-3 mb-4 shrink-0">
                    <span className="text-[10.5px] font-black uppercase text-nemix-secondary tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-nemix-secondary" /> To Do
                    </span>
                    <span className="text-[9.5px] font-mono font-bold text-nemix-secondary bg-nemix-surface/80 border border-nemix-border px-2 py-0.5 rounded-lg shadow-inner">
                      {tickets.filter(t => t.status === 'todo').length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
                    {tickets.filter(t => t.status === 'todo').map(ticket => (
                      <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} />
                    ))}
                  </div>
                </div>

                {/* ─── COLUMN 2: IN PROGRESS ─── */}
                <div className="flex flex-col bg-nemix-card/20 border border-nemix-border rounded-2xl p-4.5 overflow-hidden shadow-sm backdrop-blur-2xl">
                  <div className="flex items-center justify-between border-b border-nemix-border pb-3 mb-4 shrink-0">
                    <span className="text-[10.5px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 shadow-glow-primary"></span>
                      </span>
                      In Progress
                    </span>
                    <span className="text-[9.5px] font-mono font-bold text-blue-400 bg-blue-600/10 border border-blue-500/20 px-2 py-0.5 rounded-lg shadow-inner">
                      {tickets.filter(t => t.status === 'inprogress').length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
                    {tickets.filter(t => t.status === 'inprogress').map(ticket => (
                      <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} />
                    ))}
                  </div>
                </div>

                {/* ─── COLUMN 3: AWAITING APPROVAL ─── */}
                <div className="flex flex-col bg-nemix-card/20 border border-nemix-border rounded-2xl p-4.5 overflow-hidden shadow-sm backdrop-blur-2xl">
                  <div className="flex items-center justify-between border-b border-nemix-border pb-3 mb-4 shrink-0">
                    <span className="text-[10.5px] font-black uppercase text-nemix-warning tracking-widest flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nemix-warning opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-nemix-warning shadow-glow-warning"></span>
                      </span>
                      Governance Review
                    </span>
                    <span className="text-[9.5px] font-mono font-bold text-nemix-warning bg-nemix-warning/10 border border-nemix-warning/20 px-2 py-0.5 rounded-lg shadow-inner">
                      {tickets.filter(t => t.status === 'awaiting').length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
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
                <div className="flex flex-col bg-nemix-card/20 border border-nemix-border rounded-2xl p-4.5 overflow-hidden shadow-sm backdrop-blur-2xl">
                  <div className="flex items-center justify-between border-b border-nemix-border pb-3 mb-4 shrink-0">
                    <span className="text-[10.5px] font-black uppercase text-nemix-success tracking-widest flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nemix-success opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-nemix-success shadow-glow-success"></span>
                      </span>
                      Done
                    </span>
                    <span className="text-[9.5px] font-mono font-bold text-nemix-success bg-nemix-success/10 border border-nemix-success/20 px-2 py-0.5 rounded-lg shadow-inner">
                      {tickets.filter(t => t.status === 'done').length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar">
                    {tickets.filter(t => t.status === 'done').map(ticket => (
                      <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} />
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Bottom Execution shell log panel */}
          {initialized && (
            <div className="h-[230px] bg-nemix-card/90 border-t border-nemix-border flex flex-col shrink-0 relative z-10 p-6 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between border-b border-nemix-border pb-3 mb-3.5 shrink-0">
                <span className="text-[9px] font-black uppercase text-nemix-secondary tracking-widest flex items-center gap-2 font-mono">
                  <Terminal className="w-4.5 h-4.5 text-blue-500 animate-pulse" /> Live Swarm Console Execution logs
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-nemix-success animate-ping" />
                  <span className="text-[8px] font-mono text-nemix-success font-black tracking-widest uppercase">STREAM ACTIVE</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 font-mono text-[10px] text-nemix-secondary custom-scrollbar select-text leading-relaxed bg-black/40 border border-nemix-border rounded-xl p-4.5 shadow-inner">
                {logs.map((log, idx) => {
                  const isError = log.includes('[Error]');
                  const isCEO = log.includes('[CEO]');
                  const isSystem = log.includes('[System]');
                  const isBroker = log.includes('[Broker]');
                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border flex items-start gap-2.5 transition-all hover:bg-white/[0.01] ${
                        isError 
                          ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                          : isCEO 
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-extrabold'
                          : isSystem 
                          ? 'bg-zinc-500/5 border-nemix-border text-slate-400'
                          : isBroker
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-nemix-surface/30 border-transparent text-nemix-secondary'
                      }`}
                    >
                      <span className="opacity-40 select-none text-[8.5px] font-semibold shrink-0 mt-0.5">{(idx+1).toString().padStart(3, '0')}</span>
                      <span className="flex-1 break-all">{log}</span>
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
      {/* GOVERNANCE MODAL OVERLAY (God Mode Human Votes)          */}
      {/* ======================================================== */}
      <AnimatePresence>
        {activeApprovalTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-nemix-card border border-nemix-border rounded-3xl max-w-xl w-full p-7 space-y-6 shadow-2xl relative overflow-hidden text-left"
            >
              {/* Vibrant radial decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-nemix-border pb-4">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5.5 h-5.5 text-yellow-500 animate-pulse" />
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-yellow-500 font-sans">
                    GOVERNANCE BOARD DECISION REQUIRED
                  </h3>
                </div>
                <span className="text-[8px] font-black uppercase bg-purple-600/10 text-purple-400 px-2 py-0.5 rounded-lg border border-purple-500/25">
                  GOD MODE HIERARCHY
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[8.5px] text-nemix-secondary uppercase tracking-widest block font-black">Target backlog Ticket</span>
                <h4 className="text-sm font-black text-nemix-text font-sans uppercase leading-tight select-text">{activeApprovalTicket.title}</h4>
              </div>

              <div className="space-y-2">
                <span className="text-[8.5px] text-nemix-secondary uppercase tracking-widest block font-black">Agent Synthesis Reasonings</span>
                <p className="text-[10px] leading-relaxed text-nemix-text bg-black/40 border border-nemix-border p-4 rounded-xl max-h-[140px] overflow-y-auto custom-scrollbar font-sans font-medium select-text shadow-inner">
                  {activeApprovalTicket.thought}
                </p>
              </div>

              {activeApprovalTicket.output && (
                <div className="space-y-2">
                  <span className="text-[8.5px] text-nemix-secondary uppercase tracking-widest block font-black font-mono">Generated Compilation Code Vault</span>
                  <div className="relative">
                    <pre className="text-[9.5px] font-mono text-emerald-400 bg-black/60 border border-nemix-border p-4 rounded-xl max-h-[150px] overflow-y-auto custom-scrollbar select-text leading-relaxed shadow-inner">
                      <code>{activeApprovalTicket.output}</code>
                    </pre>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleBoardApproval('approved')}
                  className="h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-600/20"
                >
                  <ThumbsUp className="w-4 h-4 text-white" /> Approve & Deploy
                </button>
                <button
                  type="button"
                  onClick={() => handleBoardApproval('rejected')}
                  className="h-12 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 text-red-400 transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider shadow-sm"
                >
                  <ThumbsDown className="w-4 h-4" /> Reject Code Output
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-nemix-card border border-nemix-border rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-left"
            >
              {/* IDE top bar */}
              <div className="bg-black/[0.15] px-5 py-4 flex items-center justify-between border-b border-nemix-border">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5 mr-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <FileCode className="w-4.5 h-4.5 text-blue-500" />
                  <span className="text-[10px] font-mono font-bold tracking-wide text-nemix-text">SWARM_WORKSPACE_OUTPUT.md</span>
                </div>
                <button
                  onClick={() => setActiveCodePreview(null)}
                  className="w-7 h-7 rounded-lg hover:bg-nemix-surface flex items-center justify-center text-nemix-secondary hover:text-nemix-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Code output shell body */}
              <div className="flex-1 p-6 overflow-y-auto bg-black/60 font-mono text-[11px] leading-relaxed text-blue-400 custom-scrollbar select-text shadow-inner">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-nemix-card border border-nemix-border rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-nemix-border pb-3">
                <h4 className="text-xs font-black uppercase text-nemix-text font-sans tracking-wider">Recruit Swarm Agent</h4>
                <button 
                  onClick={() => setIsHireModalOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-nemix-surface flex items-center justify-center text-nemix-secondary hover:text-nemix-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-nemix-secondary block">Agent Roster Identifier</label>
                  <input
                    type="text"
                    value={newAgentName}
                    onChange={e => setNewAgentName(e.target.value)}
                    placeholder="e.g. Scribe-v2, Traffic-Optimizer..."
                    className="w-full h-10 px-3.5 premium-input font-semibold focus:border-blue-500/40"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[8.5px] font-black uppercase tracking-widest text-nemix-secondary block">Agent Specialty / Role</label>
                  <input
                    type="text"
                    value={newAgentRole}
                    onChange={e => setNewAgentRole(e.target.value)}
                    placeholder="e.g. Lead Copywriter, QA Auditor..."
                    className="w-full h-10 px-3.5 premium-input font-semibold focus:border-blue-500/40"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleHireAgent}
                disabled={!newAgentName.trim() || !newAgentRole.trim()}
                className="w-full h-11.5 btn-primary justify-center font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/10"
              >
                Hire Employee
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer corporate bar */}
      <footer className="py-3.5 border-t border-nemix-border text-center text-[9px] font-semibold text-nemix-secondary bg-nemix-card/65 backdrop-blur-2xl shrink-0 relative z-20">
        © {new Date().getFullYear()} Nemix Corporation. All private client-side agent configurations encrypted in Vercel sandbox.
      </footer>

    </div>
  );
}

// ─── Custom Cyber Kanban Card Component ───
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
      transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      className="p-5 cyber-card bg-nemix-card/45 flex flex-col space-y-4 text-left hover:-translate-y-0.5 hover:border-blue-500/25 shadow-sm group relative overflow-hidden"
    >
      {/* Light edge decoration */}
      <div className="absolute top-0 left-0 w-2 h-full bg-nemix-primary opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <h4 className="text-[11px] font-extrabold uppercase text-nemix-text tracking-wide font-sans leading-tight group-hover:text-blue-400 transition-colors">
        {ticket.title}
      </h4>
      <p className="text-[10px] text-nemix-secondary leading-relaxed font-medium font-sans select-text">
        {ticket.description}
      </p>

      {/* High-fidelity glowing inner reasoning log */}
      <div className="bg-black/55 border border-nemix-border p-3.5 rounded-xl text-[9px] font-mono text-slate-400 leading-relaxed shadow-inner relative overflow-hidden">
        <span className="text-[8.5px] font-extrabold text-blue-500 uppercase tracking-widest block mb-1 font-mono">Thought Reasoning</span>
        <div className="select-text truncate-lines max-h-[75px] overflow-y-auto custom-scrollbar">
          {ticket.thought}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-nemix-border pt-4 gap-2.5 shrink-0">
        
        {/* Agent Info card inside Kanban card */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-black/40 border border-nemix-border flex items-center justify-center text-sm shrink-0 shadow-inner">
            {agent?.avatar || '🤖'}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold text-nemix-text truncate leading-tight font-sans uppercase tracking-wide">{agent?.name || 'Worker-Bot'}</p>
            <p className="text-[7.5px] text-nemix-secondary truncate leading-tight mt-0.5 uppercase tracking-wider">{agent?.role || 'Developer'}</p>
          </div>
        </div>

        {/* Dynamic code compile actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasOutput && (
            <button
              onClick={() => onCodePreview(ticket.output!)}
              className="h-6.5 px-2.5 rounded-lg bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
            >
              <Code className="w-3 h-3 text-blue-400" /> Output
            </button>
          )}

          {isAwaiting && onApproveRequest && governanceMode && (
            <button
              onClick={() => onApproveRequest(ticket)}
              className="h-6.5 px-2.5 rounded-lg bg-emerald-600/10 border border-emerald-500/20 hover:bg-emerald-600/20 text-emerald-400 text-[8.5px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
            >
              <ThumbsUp className="w-2.5 h-2.5" /> Vote
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
