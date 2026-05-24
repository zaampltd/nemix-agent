"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Terminal, Play, CheckCircle2, Cpu, Activity, Lock, Key,
  Eye, EyeOff, Save, Sparkles, ChevronRight, UserCheck, ThumbsUp, ThumbsDown,
  ShieldAlert, Clock, Compass, Rocket, Zap, RefreshCw, FileCode,
  Coins, Users, Kanban, Plus, PlayCircle, PauseCircle, Code, Copy, Check,
  X, Server, CheckSquare, Layers, AlertCircle
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
    addLocalLog('[System] Credentials key successfully saved in client-side secure vault.');
  };

  const addLocalLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // ─── Initialize Swarm ───
  const handleStartCompany = async () => {
    if (!mission.trim() || !goal.trim()) return;

    setIsInitializing(true);
    addLocalLog('[System] Initiating secure handshake with Nemix API Gateway...');

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
          particleCount: 120,
          spread: 80,
          origin: { y: 0.7 },
          colors: ['#3b82f6', '#10b981', '#7c6af7', '#ffffff']
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
    <div className="min-h-screen bg-[#020204] text-[#f3f3f7] font-sans flex flex-col overflow-hidden relative selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* ─── Breathtaking, High-Visibility Animated Glow Backgrounds ─── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Massive vibrant neon blurs with high visibility */}
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 20, 0],
            y: [0, -30, 0]
          }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[650px] h-[650px] rounded-full opacity-[0.16] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7c6af7 0%, transparent 70%)', filter: 'blur(120px)' }} 
        />
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }}
          className="absolute bottom-[-15%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.12] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', filter: 'blur(130px)' }} 
        />
        <div className="absolute top-[30%] right-[20%] w-[450px] h-[450px] rounded-full opacity-[0.05] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', filter: 'blur(110px)' }} />
        
        {/* Subtle dynamic background light beams */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        {/* Dense tech dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      {/* ─── Main Scaffold Row ─── */}
      <div className="flex flex-1 overflow-hidden h-screen relative z-10">

        {/* ======================================================== */}
        {/* LEFT SIDEBAR: Org Hierarchy (290px)                     */}
        {/* ======================================================== */}
        <aside className="w-[290px] bg-[#09090b]/90 border-r border-white/[0.08] flex flex-col shrink-0 relative z-20 backdrop-blur-3xl">
          {/* Top Brand Mission */}
          <div className="p-5.5 border-b border-white/[0.08] space-y-4.5 bg-[#09090b]/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <BrainCircuit className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <span className="font-black text-sm tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400 font-outfit">
                  NEMIX SWARM
                </span>
                <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest block leading-none mt-1">META-ORCHESTRATOR</span>
              </div>
            </div>

            {initialized && (
              <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-2xl space-y-2 shadow-inner">
                <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest block">CORPORATE MISSION</span>
                <p className="text-[10.5px] leading-relaxed text-zinc-400 font-semibold font-sans">
                  {mission}
                </p>
              </div>
            )}
          </div>

          {/* Org Chart Tree Navigation */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-600" /> Active Roster Hierarchy
              </span>
            </div>

            {agents.length === 0 ? (
              <div className="text-center py-28 text-zinc-500 text-[10px] leading-relaxed border border-dashed border-white/[0.06] rounded-2xl bg-white/[0.01] px-4">
                Hive is currently offline.<br />Initialize swarm company on onboarding dashboard.
              </div>
            ) : (
              <div className="space-y-4 pl-1">
                
                {/* CEO Node */}
                {agents.filter(a => a.id === 'agent_ceo').map(ceo => (
                  <div key={ceo.id} className="relative">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/90 border border-white/[0.08] shadow-md relative z-10 transition-all hover:border-white/20">
                      <div className="w-8.5 h-8.5 rounded-lg bg-black border border-white/10 flex items-center justify-center text-lg shrink-0 shadow-inner">
                        {ceo.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10.5px] font-black uppercase text-white truncate font-outfit">{ceo.name}</h4>
                        <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">{ceo.role}</p>
                      </div>
                      <span className={`w-2.5 h-2.5 rounded-full relative shrink-0 border border-black ${
                        ceo.status === 'working' ? 'bg-emerald-500 animate-pulse shadow-glow-success' : 'bg-zinc-700'
                      }`} />
                    </div>
                    {/* Visual Connection line to worker agents */}
                    <div className="absolute left-7.5 top-12 bottom-[-24px] w-[1px] bg-white/[0.08] pointer-events-none" />
                  </div>
                ))}

                {/* Worker Nodes */}
                <div className="space-y-3 pl-7.5 pt-1.5">
                  {agents.filter(a => a.id !== 'agent_ceo').map(worker => (
                    <div key={worker.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] relative hover:border-white/[0.1] transition-all group shadow-sm">
                      {/* Connection horizontal line */}
                      <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-4 h-[1px] bg-white/[0.08] pointer-events-none" />
                      
                      <div className="w-7.5 h-7.5 rounded-lg bg-zinc-950 border border-white/5 flex items-center justify-center text-sm shrink-0">
                        {worker.avatar}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="text-[9.5px] font-bold uppercase text-zinc-200 truncate font-outfit">{worker.name}</h5>
                        <p className="text-[8px] font-semibold text-zinc-500 truncate mt-0.5 uppercase tracking-wide">{worker.role.split(' ')[0]}</p>
                      </div>
                      
                      <span className={`w-2 h-2 rounded-full shrink-0 border border-black ${
                        worker.status === 'working' ? 'bg-emerald-500 animate-pulse shadow-glow-success' : 'bg-zinc-700'
                      }`} />
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>

          {/* Hire Button */}
          {initialized && (
            <div className="p-5 border-t border-white/[0.08] bg-[#09090b] shrink-0">
              <button
                type="button"
                onClick={() => setIsHireModalOpen(true)}
                className="w-full h-11 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 transition-all font-bold text-xs flex items-center justify-center gap-1.5 text-zinc-300 hover:text-white"
              >
                <Plus className="w-4 h-4 text-blue-400" />
                Hire New Agent
              </button>
            </div>
          )}
        </aside>

        {/* ======================================================== */}
        {/* MAIN WORKSPACE: Upper Headers & Ticket Board            */}
        {/* ======================================================== */}
        <main className="flex-1 flex flex-col overflow-hidden relative z-10">
          
          {/* Header Workspace Details */}
          <header className="px-6 py-4.5 border-b border-white/[0.08] flex items-center justify-between shrink-0 bg-[#020204]/80 backdrop-blur-3xl">
            
            {/* Left: Active Goal */}
            <div className="flex-1 max-w-lg min-w-0 pr-4">
              <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest block">ACTIVE SWARM GOAL DIRECTIVE</span>
              <h2 className="text-xs font-bold text-zinc-100 truncate mt-0.5 font-outfit uppercase tracking-wide">
                {initialized ? goal : "Awaiting Swarm Setup Launchpad..."}
              </h2>
            </div>

            {/* Right Controls */}
            {initialized && (
              <div className="flex items-center gap-4 shrink-0">
                {/* Budget Coins */}
                <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-white/[0.06] shadow-sm">
                  <Coins className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
                  <div>
                    <span className="text-[7px] font-black uppercase text-zinc-500 tracking-widest block leading-none">BUDGET USED</span>
                    <span className="text-[11.5px] font-extrabold text-white font-mono leading-none mt-1 block">
                      {budgetUsed.toLocaleString()} <span className="text-[9px] text-zinc-500 font-black">NMX</span>
                    </span>
                  </div>
                </div>

                {/* God Mode Governance Mode Toggle */}
                <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-white/[0.06] shadow-sm">
                  <div>
                    <span className="text-[7px] font-black uppercase text-zinc-500 tracking-widest block leading-none">GOVERNANCE MODE</span>
                    <span className="text-[10px] font-extrabold text-zinc-200 leading-none mt-1 block">
                      {governanceMode ? "God Mode On" : "Autonomous"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGovernanceMode(!governanceMode);
                      addLocalLog(`[System] Governance Mode toggled ${!governanceMode ? 'ON (Board approvals required)' : 'OFF (Autonomous loops)'}`);
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors focus:outline-none shrink-0 ${
                      governanceMode ? 'bg-blue-600' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
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
                      addLocalLog(`[System] Auto-heartbeat loop execution ${!isAutoTicking ? 'STARTED' : 'PAUSED'}.`);
                    }}
                    className={`h-10 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all text-white shadow-lg ${
                      isAutoTicking 
                        ? 'bg-zinc-800 hover:bg-zinc-700' 
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-blue-600/15'
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
                    className="h-10 px-4 rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 transition-all font-bold text-xs flex items-center justify-center gap-1.5 text-zinc-300 disabled:opacity-40"
                  >
                    <Zap className={`w-3.5 h-3.5 text-blue-400 ${isHeartbeating ? 'animate-bounce' : ''}`} />
                    Heartbeat Tick
                  </button>
                </div>

              </div>
            )}

          </header>

          {/* Core Kanban Board Area */}
          <div className="flex-1 overflow-hidden p-6 flex flex-col relative">
            
            {!initialized ? (
              // Breathtaking Onboarding Launchpad Setup Portal
              <div className="flex-1 flex items-center justify-center max-w-5xl mx-auto w-full">
                {/* Glow border wrapper */}
                <div className="bg-gradient-to-r from-blue-500/15 via-purple-500/10 to-emerald-500/10 p-[1.5px] rounded-3xl w-full shadow-2xl shadow-blue-500/5">
                  <div className="bg-[#0b0b0e]/95 rounded-[22px] border border-white/[0.06] overflow-hidden w-full grid grid-cols-1 md:grid-cols-12 max-h-[85vh]">
                    
                    {/* Left Column: Visual Brief (5 spans) */}
                    <div className="md:col-span-5 bg-gradient-to-b from-[#0e0e12] to-black p-8.5 flex flex-col justify-between border-r border-white/[0.08] relative">
                      {/* Dynamic light leak inside onboarding */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(124,106,247,0.1),transparent_65%)]" />
                      
                      <div className="space-y-6.5 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                          <BrainCircuit className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="space-y-3.5">
                          <h3 className="text-xl font-extrabold uppercase tracking-wider text-white font-outfit">
                            Nemix Swarm Portal
                          </h3>
                          <p className="text-[11px] leading-relaxed text-zinc-400 font-semibold font-sans">
                            Bootstrap an autonomous corporate model using client-side recursive pipelines. The CEO plans the backlog, coordinates workers, and routes code changes using the secure Nemix Gateway API.
                          </p>
                        </div>

                        {/* Roster Pipeline Steps */}
                        <div className="space-y-4 pt-3.5">
                          {[
                            "CEO breaks master goal into Backlog",
                            "Dispatches Developers & QA Auditors",
                            "God Mode Human Governance review",
                            "Fast-forward compilation checks & deploy"
                          ].map((step, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="w-5.5 h-5.5 rounded-full bg-blue-950 border border-blue-500/30 flex items-center justify-center text-[10px] font-black text-blue-400">
                                {idx + 1}
                              </span>
                              <span className="text-[10px] font-extrabold text-zinc-300 uppercase tracking-wider">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="text-[9px] text-zinc-500 pt-6 border-t border-white/5 uppercase tracking-widest font-black relative z-10">
                        CLIENT-SIDE SECURED HANDSHAKE GATEWAY
                      </div>
                    </div>

                    {/* Right Column: Interactive Fields (7 spans) */}
                    <div className="md:col-span-7 p-9 bg-white/[0.01] backdrop-blur-xl flex flex-col justify-center space-y-5.5">
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-blue-400 block mb-1">Company Mission Statement</label>
                        <input
                          type="text"
                          value={mission}
                          onChange={e => setMission(e.target.value)}
                          placeholder="e.g. Build a high-performance modular Edge Router."
                          className="w-full h-11 px-4 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all font-semibold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-blue-400 block mb-1">Master Swarm Directive / Goal</label>
                        <textarea
                          value={goal}
                          onChange={e => setGoal(e.target.value)}
                          placeholder="e.g. Code failover fallback gateway parameters and execute security audits."
                          className="w-full h-22 p-3.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none leading-relaxed transition-all font-semibold"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-blue-400 block mb-1">Secure Vault Gateway Key</label>
                        <div className="relative">
                          <input
                            type={showKey ? 'text' : 'password'}
                            placeholder="nex_sk_ep_xxxxxxxxxxxx"
                            value={apiKey}
                            onChange={e => setApiKey(e.target.value)}
                            className="w-full h-11 pl-4 pr-20 text-xs font-mono rounded-xl bg-black/60 border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all font-semibold"
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
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 shadow-md shadow-blue-600/10"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartCompany}
                        disabled={isInitializing || !mission.trim() || !goal.trim()}
                        className="w-full h-12 rounded-xl font-black text-xs flex items-center justify-center gap-2 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl shadow-blue-600/15 hover:opacity-95 disabled:opacity-40 transition-all select-none uppercase tracking-wider font-outfit"
                      >
                        {isInitializing ? (
                          <>
                            <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                            Recruiting Workers Swarm...
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
              // Kanban Grid Layout (4 columns)
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-5 overflow-hidden">
                
                {/* ─── COLUMN 1: TO DO ─── */}
                <div className="flex flex-col bg-white/[0.01] border border-white/[0.06] rounded-2xl p-4 overflow-hidden shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3 shrink-0">
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
                <div className="flex flex-col bg-white/[0.01] border border-white/[0.06] rounded-2xl p-4 overflow-hidden shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3 shrink-0">
                    <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-glow-primary" /> In Progress
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
                <div className="flex flex-col bg-white/[0.01] border border-white/[0.06] rounded-2xl p-4 overflow-hidden shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3 shrink-0">
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
                <div className="flex flex-col bg-white/[0.01] border border-white/[0.06] rounded-2xl p-4 overflow-hidden shadow-xl backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 mb-3 shrink-0">
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
            <div className="h-[200px] bg-[#08080a] border-t border-white/[0.08] flex flex-col shrink-0 relative z-10 p-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5 shrink-0">
                <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" /> Live Swarm Execution Log
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[8px] font-mono text-emerald-400 font-extrabold tracking-widest uppercase">STREAM ACTIVE</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 font-mono text-[9.5px] text-zinc-400 custom-scrollbar select-text leading-relaxed">
                {logs.map((log, idx) => {
                  const isError = log.includes('[Error]');
                  const isCEO = log.includes('[CEO]');
                  const isSystem = log.includes('[System]');
                  const isBroker = log.includes('[Broker]');
                  return (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-xl border ${
                        isError 
                          ? 'bg-red-950/15 border-red-900/20 text-red-400' 
                          : isCEO 
                          ? 'bg-blue-950/15 border-blue-900/20 text-blue-300'
                          : isSystem 
                          ? 'bg-zinc-900/40 border-white/5 text-zinc-400'
                          : isBroker
                          ? 'bg-emerald-950/10 border-emerald-900/20 text-emerald-400'
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0b0e]/95 border border-blue-500/20 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative overflow-hidden text-left"
            >
              {/* Alert background glow */}
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-blue-400 animate-pulse" />
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-blue-400 font-outfit">
                    GOVERNANCE VOTE REQUIRED
                  </h3>
                </div>
                <span className="text-[8px] font-black uppercase bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                  GOD MODE HIERARCHY
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block font-bold">Target backlog Ticket</span>
                <h4 className="text-xs font-black text-white font-outfit uppercase leading-tight">{activeApprovalTicket.title}</h4>
              </div>

              <div className="space-y-2">
                <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block font-bold">Agent Synthesis Thought Reasoning</span>
                <p className="text-[10px] leading-relaxed text-zinc-400 bg-black/60 border border-white/5 p-3.5 rounded-xl max-h-[140px] overflow-y-auto custom-scrollbar font-sans font-medium">
                  {activeApprovalTicket.thought}
                </p>
              </div>

              {activeApprovalTicket.output && (
                <div className="space-y-1.5">
                  <span className="text-[8.5px] text-zinc-500 uppercase tracking-widest block font-bold">Generated Output Code Vault</span>
                  <pre className="text-[9.5px] font-mono text-emerald-400 bg-black/80 border border-white/5 p-3 rounded-xl max-h-[140px] overflow-y-auto custom-scrollbar select-text leading-relaxed">
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
                  className="h-11 rounded-xl bg-red-950/40 border border-red-500/20 hover:bg-red-950/60 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold text-red-400"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0b0e]/95 border border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-left"
            >
              {/* Window Header */}
              <div className="bg-black/60 px-5 py-4 flex items-center justify-between border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-mono text-zinc-300">Workspace Code Output</span>
                </div>
                <button
                  onClick={() => setActiveCodePreview(null)}
                  className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0b0e]/95 border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
                <h4 className="text-xs font-black uppercase text-white font-outfit">Recruit Swarm Employee</h4>
                <button 
                  onClick={() => setIsHireModalOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Agent Name</label>
                  <input
                    type="text"
                    value={newAgentName}
                    onChange={e => setNewAgentName(e.target.value)}
                    placeholder="e.g. Scribe-v2, Traffic-Optimizer..."
                    className="w-full h-9.5 px-3 rounded-lg bg-black border border-white/10 text-xs text-white focus:ring-1 focus:ring-blue-500/50 outline-none transition-all font-semibold"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Agent Role / Specialty</label>
                  <input
                    type="text"
                    value={newAgentRole}
                    onChange={e => setNewAgentRole(e.target.value)}
                    placeholder="e.g. Lead Copywriter, SEO Optimizer..."
                    className="w-full h-9.5 px-3 rounded-lg bg-black border border-white/10 text-xs text-white focus:ring-1 focus:ring-blue-500/50 outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleHireAgent}
                disabled={!newAgentName.trim() || !newAgentRole.trim()}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-colors disabled:opacity-40 shadow-lg shadow-blue-600/10"
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
      className="p-4.5 rounded-2xl border border-white/[0.06] bg-[#0b0b0e]/95 shadow-md flex flex-col space-y-4 text-left hover:border-white/[0.12] transition-all group"
    >
      <h4 className="text-[10.5px] font-black uppercase text-zinc-100 tracking-wide font-outfit leading-tight group-hover:text-white transition-colors">
        {ticket.title}
      </h4>
      <p className="text-[9.5px] text-zinc-400 leading-relaxed font-semibold font-sans">
        {ticket.description}
      </p>

      {/* Reasoning log snippet */}
      <div className="bg-black/60 border border-white/[0.04] p-3 rounded-xl text-[9px] font-mono text-zinc-500 leading-relaxed shadow-inner">
        <span className="text-[8px] font-black text-blue-400/80 uppercase tracking-widest block mb-1">Reasoning Log</span>
        {ticket.thought}
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.06] pt-3.5 gap-2 shrink-0">
        {/* Agent Avatar info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded bg-zinc-950 border border-white/10 flex items-center justify-center text-xs shrink-0 shadow-inner">
            {agent?.avatar || '🤖'}
          </div>
          <div className="min-w-0">
            <p className="text-[8.5px] font-bold text-zinc-200 truncate leading-tight font-outfit uppercase">{agent?.name || 'Worker-Bot'}</p>
            <p className="text-[7.5px] text-zinc-500 truncate leading-tight mt-0.5 uppercase tracking-wider">{agent?.role.split(' ')[0] || 'Worker'}</p>
          </div>
        </div>

        {/* Action button inside card */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasOutput && (
            <button
              onClick={() => onCodePreview(ticket.output!)}
              className="h-6 px-2 rounded bg-blue-950/20 border border-blue-500/10 hover:border-blue-500/30 text-blue-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5 transition-colors"
            >
              <Code className="w-2.5 h-2.5" /> Output
            </button>
          )}

          {isAwaiting && onApproveRequest && governanceMode && (
            <button
              onClick={() => onApproveRequest(ticket)}
              className="h-6 px-2 rounded bg-emerald-950/30 border border-emerald-500/20 hover:bg-emerald-950 text-emerald-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5 transition-colors"
            >
              Vote
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
