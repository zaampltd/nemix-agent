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

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs container ONLY without shifting page viewport
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Load API Key and active db.json state from backend on mount
  useEffect(() => {
    const saved = localStorage.getItem('nemix_agent_key');
    if (saved) setApiKey(saved);

    const loadState = async () => {
      try {
        const response = await fetch('/api/orchestrator/company');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.state) {
            setMission(data.state.mission);
            setGoal(data.state.goal);
            setAgents(data.state.agents);
            setTickets(data.state.tickets);
            setLogs(data.state.logs);
            setBudgetUsed(data.state.budgetUsed);
            setGovernanceMode(data.state.governanceMode);
            setInitialized(true);
            addLocalLog('[System] Re-connected to active swarm operations console.');
          }
        }
      } catch (e: any) {
        addLocalLog(`[System] Failed to restore previous session state: ${e.message}`);
      }
    };
    loadState();
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

  // ─── Initialize Swarm in Demo Mode ───
  const handleDemoMode = async () => {
    setIsInitializing(true);
    addLocalLog('[System] Launching Demo Mode: Bootstrapping pre-configured Swarm Company...');
    
    // Set default demo inputs
    const demoMission = "Build an autonomous multi-agent edge gateway router.";
    const demoGoal = "Decompose and execute Next.js edge failover schemas.";
    setMission(demoMission);
    setGoal(demoGoal);

    try {
      const response = await fetch('/api/orchestrator/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mission: demoMission, goal: demoGoal })
      });

      if (!response.ok) {
        throw new Error('Failed to bootstrap demo workspace');
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
          particleCount: 150,
          spread: 80,
          origin: { y: 0.7 },
          colors: ['#3b82f6', '#10b981', '#7c6af7', '#ffffff']
        });
        addLocalLog('[System] Demo Swarm successfully loaded. Swarm Roster and Kanban board are active!');
      }, 1000);

    } catch (e: any) {
      setIsInitializing(false);
      addLocalLog(`[Error] Demo Mode launch failed: ${e?.message}`);
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

  // Identify Swarm Agents for Sidebar Org Roster Representation
  const devAgent = agents.find(a => a.id === 'agent_coder') || agents.find(a => a.role.toLowerCase().includes('dev') || a.role.toLowerCase().includes('architect'));
  const marketerAgent = agents.find(a => a.role.toLowerCase().includes('market')) || agents.find(a => a.id === 'agent_architect');
  const qaAgent = agents.find(a => a.id === 'agent_qa') || agents.find(a => a.role.toLowerCase().includes('qa') || a.role.toLowerCase().includes('auditor'));

  return (
    <div className="bg-nemixBg text-gray-200 h-screen flex overflow-hidden selection:bg-neonCyan selection:text-white font-sans antialiased">
      
      {/* ======================================================== */}
      {/* LEFT NAVIGATION COLUMN (64px width matching mockup)      */}
      {/* ======================================================== */}
      <nav className="w-[64px] flex-shrink-0 bg-[#050505] border-r border-panelBorder flex flex-col items-center py-4 z-30 relative shadow-xl">
        <div className="mb-8 cursor-pointer flex items-center justify-center">
          <span className="text-xl font-black text-cyan-400 italic font-mono">X</span>
          <span className="text-xs text-neonGreen -ml-1 mt-2">/</span>
        </div>

        <div className="flex-1 flex flex-col items-center gap-3.5 w-full px-2">
          {/* Active Navigation button */}
          <button className="w-10 h-10 rounded-xl bg-cyan-900/30 border border-cyan-500/40 text-cyan-400 flex items-center justify-center transition-all glow-cyan relative">
            <i className="fa-solid fa-gear text-[18px]"></i>
          </button>

          <button className="w-10 h-10 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 flex items-center justify-center transition-all">
            <i className="fa-solid fa-grip text-[18px]"></i>
          </button>
          
          <button className="w-10 h-10 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 flex items-center justify-center transition-all">
            <i className="fa-solid fa-user-group text-[16px]"></i>
          </button>
          
          <button className="w-10 h-10 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 flex items-center justify-center transition-all">
            <i className="fa-regular fa-file-lines text-[18px]"></i>
          </button>
          
          <button className="w-10 h-10 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 flex items-center justify-center transition-all">
            <i className="fa-regular fa-folder text-[18px]"></i>
          </button>
          
          <button className="w-10 h-10 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 flex items-center justify-center transition-all">
            <i className="fa-solid fa-cloud-sun text-[16px]"></i>
          </button>
          
          <button className="w-10 h-10 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 flex items-center justify-center transition-all">
            <i className="fa-solid fa-atom text-[18px]"></i>
          </button>
        </div>

        {/* Bottom nav buttons */}
        <div className="flex flex-col items-center gap-3.5 w-full px-2 pt-4 border-t border-panelBorder/50">
          <button className="w-10 h-10 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 flex items-center justify-center transition-all">
            <i className="fa-regular fa-circle-question text-[18px]"></i>
          </button>
          <button
            onClick={() => {
              setInitialized(false);
              setAgents([]);
              setTickets([]);
              setLogs([]);
              addLocalLog('[System] Swarm company reset and session wiped.');
            }}
            className="w-10 h-10 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-[18px]"></i>
          </button>
        </div>
      </nav>

      {/* ======================================================== */}
      {/* MAIN CONTAINER LAYOUT (Aside Sidebar + Main Workspace)   */}
      {/* ======================================================== */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden relative">
        
        {/* Glow ambient background items inside workspace */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full opacity-[0.03] pointer-events-none" style={{ background: 'radial-gradient(circle, var(--neonCyan) 0%, transparent 65%)', filter: 'blur(100px)' }} />
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full opacity-[0.02] pointer-events-none" style={{ background: 'radial-gradient(circle, var(--neonGreen) 0%, transparent 65%)', filter: 'blur(110px)' }} />
        </div>

        {/* ======================================================== */}
        {/* SIDEBAR: Mission Controllers & Swarm Org Tree (360px)   */}
        {/* ======================================================== */}
        <aside className="w-[360px] flex-shrink-0 flex flex-col gap-4 h-full z-10">
          
          {/* Card 1: Corporate Orchestration Visual chart */}
          <div className="bg-panelBg border border-panelBorder rounded-xl p-5 flex flex-col shrink-0">
            <h2 className="text-xs font-bold text-gray-100 uppercase tracking-widest mb-6">Corporate Orchestration</h2>
            
            <div className="flex flex-col items-center relative py-1">
              
              {/* Alpha CEO Node */}
              <div className="flex flex-col items-center z-10 mb-4">
                <div className="w-14 h-14 rounded-lg bg-[#082f49] border-2 border-neonCyan glow-cyan flex items-center justify-center mb-2 relative">
                  <i className="fa-solid fa-user-tie text-2xl text-cyan-300"></i>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-neonCyan rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]"></div>
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Alpha-CEO</span>
              </div>

              {/* Dotted Connection Lines */}
              <div className="w-64 h-6 border-t-2 border-l-2 border-r-2 border-slate-700 rounded-t-xl absolute top-[85px]"></div>
              <div className="w-[2px] h-4 bg-slate-700 absolute top-[72px]"></div>
              <div className="w-[2px] h-4 bg-slate-700 absolute top-[85px] left-1/2 -translate-x-1/2"></div>
              
              {/* Workers Grid row */}
              <div className="flex justify-between w-72 mt-2">
                
                {/* Node 1: Dev */}
                <div className={`flex flex-col items-center bg-[#111827] border rounded-lg px-2.5 py-2 w-[88px] ${
                  devAgent?.status === 'working' ? 'glow-cyan border-neonCyan/30' : 'border-panelBorder'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      <i className="fa-solid fa-code text-[10px] text-cyan-300"></i>
                    </div>
                    <span className="text-[10px] font-bold text-white truncate max-w-[50px]">{devAgent ? devAgent.name : "Dev-Bot"}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${
                      devAgent?.status === 'working' ? 'bg-neonCyan shadow-[0_0_5px_#06b6d4]' : 'bg-slate-500'
                    }`} />
                    <span className="text-[9px] text-textMuted font-bold uppercase">{devAgent?.status === 'working' ? "Running" : "Idle"}</span>
                  </div>
                </div>

                {/* Node 2: Marketer */}
                <div className={`flex flex-col items-center bg-[#111827] border rounded-lg px-2.5 py-2 w-[94px] ${
                  marketerAgent?.status === 'working' || (initialized && !devAgent) ? 'glow-green border-neonGreen/30' : 'border-panelBorder'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      <i className="fa-solid fa-bullhorn text-[10px] text-neonGreen"></i>
                    </div>
                    <span className="text-[10px] font-bold text-white truncate max-w-[54px]">{marketerAgent ? marketerAgent.name : "Marketer"}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${
                      marketerAgent?.status === 'working' || (initialized && !devAgent) ? 'bg-neonGreen shadow-[0_0_5px_#10b981]' : 'bg-slate-500'
                    }`} />
                    <span className={`text-[9px] font-bold uppercase ${
                      marketerAgent?.status === 'working' || (initialized && !devAgent) ? 'text-neonGreen' : 'text-textMuted'
                    }`}>{(marketerAgent?.status === 'working' || (initialized && !devAgent)) ? "Running" : "Idle"}</span>
                  </div>
                </div>

                {/* Node 3: QA */}
                <div className={`flex flex-col items-center bg-[#111827] border rounded-lg px-2.5 py-2 w-[88px] ${
                  qaAgent?.status === 'working' ? 'glow-cyan border-neonCyan/30' : 'border-panelBorder'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                      <i className="fa-solid fa-bug text-[10px] text-amber-400"></i>
                    </div>
                    <span className="text-[10px] font-bold text-white truncate max-w-[50px]">{qaAgent ? qaAgent.name : "QA-Bot"}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 shrink-0">
                    <div className={`w-2 h-2 rounded-full ${
                      qaAgent?.status === 'working' ? 'bg-neonCyan shadow-[0_0_5px_#06b6d4]' : 'bg-slate-500'
                    }`} />
                    <span className="text-[9px] text-textMuted font-bold uppercase">{qaAgent?.status === 'working' ? "Running" : "Idle"}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Card 2: Mission Control entries */}
          <div className="bg-panelBg border border-panelBorder rounded-xl p-5 flex flex-col flex-1 overflow-hidden">
            <h2 className="text-xs font-bold text-gray-100 uppercase tracking-widest mb-4">Mission Control</h2>
            
            <div className="flex-1 bg-[#151a23] border border-panelBorder rounded-lg p-4 mb-4 overflow-y-auto custom-scrollbar shadow-inner relative">
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-cyan-500/5 blur-xl pointer-events-none" />
              
              {!initialized ? (
                // Input forms nested inside the scrollable Mission Control pane matching mockup setup
                <div className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest text-cyan-400 block">Mission Goal</label>
                    <textarea
                      value={mission}
                      onChange={e => setMission(e.target.value)}
                      rows={2}
                      className="w-full p-2 bg-[#050505] border border-panelBorder rounded-lg text-xs font-mono leading-relaxed text-gray-300 outline-none focus:border-cyan-500/40"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest text-cyan-400 block">Swarm Goal Objective</label>
                    <textarea
                      value={goal}
                      onChange={e => setGoal(e.target.value)}
                      rows={3}
                      className="w-full p-2 bg-[#050505] border border-panelBorder rounded-lg text-xs font-mono leading-relaxed text-gray-300 outline-none focus:border-cyan-500/40"
                    />
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="text-[8px] font-black uppercase tracking-widest text-cyan-400 block">Secure Gateway Credentials Key</label>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        placeholder="nex_sk_ep_xxxxxxxxxxxx"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="w-full p-2 pr-16 bg-[#050505] border border-panelBorder rounded-lg text-xs font-mono text-gray-300 outline-none focus:border-cyan-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={saveKey}
                        disabled={!apiKey.trim()}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded bg-[#082f49] hover:bg-[#0c4a6e] border border-cyan-500/20 text-cyan-400 disabled:opacity-40"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs font-mono text-gray-300 space-y-3.5 select-text leading-relaxed">
                  <p className="border-b border-panelBorder/30 pb-2 flex items-center gap-1.5"><i className="fa-solid fa-compass text-cyan-400"></i> MISSION STATEMENT:</p>
                  <p className="text-white uppercase font-sans tracking-wide font-medium leading-relaxed">{mission}</p>
                  <p className="border-b border-panelBorder/30 pb-2 pt-2 flex items-center gap-1.5"><i className="fa-solid fa-rocket text-cyan-400"></i> DIRECTIVE GOAL:</p>
                  <p className="text-white uppercase font-sans tracking-wide font-medium leading-relaxed">{goal}</p>
                </div>
              )}
            </div>

            {/* Launch / Reset trigger buttons */}
            {!initialized ? (
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleStartCompany}
                  disabled={isInitializing || !mission.trim() || !goal.trim()}
                  className="w-full py-3 rounded-lg border border-neonCyan bg-[#082f49] hover:bg-[#0c4a6e] text-cyan-300 text-xs font-bold tracking-widest transition-all glow-cyan uppercase disabled:opacity-50"
                >
                  {isInitializing ? "Deploying Swarm..." : "Deploy Swarm"}
                </button>
                <button
                  onClick={handleDemoMode}
                  disabled={isInitializing}
                  className="w-full py-2.5 rounded-lg border border-indigo-500/30 bg-[#2e1d44]/35 hover:bg-[#3d2060] text-indigo-400 text-xs font-semibold tracking-wider transition-all uppercase"
                >
                  Simulate Demo Mode
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={triggerHeartbeat}
                  disabled={isHeartbeating || isAutoTicking}
                  className="h-10 rounded-lg border border-neonCyan bg-[#082f49] hover:bg-[#0c4a6e] text-cyan-300 text-[10px] font-bold tracking-widest uppercase transition-all glow-cyan disabled:opacity-40"
                >
                  <i className="fa-solid fa-bolt mr-1"></i> Tick
                </button>
                <button
                  onClick={() => {
                    setIsAutoTicking(!isAutoTicking);
                    addLocalLog(`[System] Auto-heartbeat loop execution ${!isAutoTicking ? 'STARTED' : 'PAUSED'}.`);
                  }}
                  className={`h-10 rounded-lg border text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1 ${
                    isAutoTicking 
                      ? 'bg-zinc-800 border-zinc-700 text-gray-400' 
                      : 'bg-emerald-950/40 border-neonGreen/30 text-neonGreen hover:bg-emerald-900/60 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  }`}
                >
                  {isAutoTicking ? (
                    <><i className="fa-solid fa-pause"></i> Pause</>
                  ) : (
                    <><i className="fa-solid fa-play"></i> Auto Run</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Card 3: Governance Queue (Awaiting Vote Box) */}
          <div className="bg-panelBg border border-panelBorder rounded-xl p-5 shrink-0">
            <h2 className="text-xs font-bold text-gray-100 uppercase tracking-widest mb-4">Governance Queue</h2>
            
            {activeApprovalTicket && governanceMode ? (
              <div className="border border-amber-600/50 bg-[#291711] rounded-lg p-4 relative overflow-hidden shadow-lg animate-pulse">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Approval Required</h3>
                </div>
                <p className="text-[11px] text-gray-300 mb-1 select-text">Action Task: <span className="text-white font-bold uppercase">{activeApprovalTicket.title}</span></p>
                <p className="text-[9.5px] text-gray-400 font-mono line-clamp-2 select-text">{activeApprovalTicket.thought}</p>
                
                <div className="flex gap-2 mt-3.5">
                  <button
                    onClick={() => handleBoardApproval('approved')}
                    className="flex-1 py-2 rounded-md border border-neonGreen/50 bg-[#064e3b]/40 hover:bg-[#064e3b] text-neonGreen text-[10px] font-bold tracking-wider transition-all uppercase"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleBoardApproval('rejected')}
                    className="flex-1 py-2 rounded-md border border-slate-600 bg-slate-800 hover:bg-red-900/40 text-gray-300 text-[10px] font-bold tracking-wider transition-all uppercase"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="border border-panelBorder bg-[#111827]/40 rounded-lg p-4 text-center text-xs text-textMuted py-7 font-bold uppercase tracking-wider">
                <i className="fa-solid fa-shield-halved mr-1.5 text-slate-500 animate-pulse"></i> Queue Empty
              </div>
            )}
          </div>
        </aside>

        {/* ======================================================== */}
        {/* MAIN WORKSPACE PANEL: Cockpit, Kanban columns, Logs      */}
        {/* ======================================================== */}
        <main className="flex-1 flex flex-col bg-panelBg border border-panelBorder rounded-xl p-6 overflow-hidden z-10 shadow-2xl relative">
          
          {/* Main workspace header */}
          <header className="flex justify-between items-end border-b border-panelBorder pb-4 mb-6 shrink-0">
            <div>
              <h1 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-white font-sans text-xl tracking-normal font-black">Nemix Agent Orchestrator</span>
              </h1>
              <div className="flex gap-12">
                <div>
                  <p className="text-[9px] text-textMuted uppercase mb-1 font-bold tracking-wider">Active Swarm Goal:</p>
                  <p className="text-sm font-semibold text-white uppercase tracking-wide truncate max-w-sm">
                    {initialized ? goal : "Waiting Swarm Deployment..."}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-textMuted uppercase mb-1 font-bold tracking-wider">Compute Budget Used:</p>
                  <p className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                    <i className="fa-solid fa-coins text-cyan-400 animate-pulse"></i> {budgetUsed.toLocaleString()} <span className="text-[9px] text-cyan-400 uppercase font-black font-sans">NMX</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* God Mode auth switch */}
            <div className="flex items-center gap-3 bg-[#111827] px-4 py-2 rounded-lg border border-panelBorder shrink-0 shadow-inner">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">God Mode / Board Auth</span>
              <button
                type="button"
                onClick={() => {
                  setGovernanceMode(!governanceMode);
                  addLocalLog(`[System] Governance Mode toggled ${!governanceMode ? 'ON (Board approvals required)' : 'OFF (Autonomous loops)'}`);
                }}
                className={`w-10 h-5 rounded-full relative transition-all duration-300 shadow-inner p-0.5 ${
                  governanceMode ? 'bg-[#064e3b] shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md ${
                  governanceMode ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </header>

          {/* Grid Kanban Columns or Onboarding Interface */}
          {!initialized ? (
            // Predefined Setup console matching onboarding launchpad aesthetics
            <div className="flex-1 flex flex-col justify-center items-center max-w-lg mx-auto w-full space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 border border-cyan-400/20 shadow-glow-primary flex items-center justify-center animate-pulse">
                <i className="fa-solid fa-atom text-2xl text-white"></i>
              </div>
              <div className="text-center space-y-2 max-w-md">
                <h3 className="text-lg font-bold text-white uppercase tracking-widest font-sans">DEPLOY META SWARM</h3>
                <p className="text-xs text-textMuted leading-relaxed font-semibold">
                  Specify your company mission and directive goal inside the **Mission Control panel** on the left, cache your Gateway Vault Credentials key, and click **Deploy Swarm** or **Simulate Demo Mode** to spin up Orchestrator Alpha!
                </p>
              </div>

              <div className="w-full max-w-sm pt-4">
                <button
                  onClick={handleDemoMode}
                  className="w-full py-3.5 rounded-lg border border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-xs font-black tracking-widest shadow-glow-purple transition-all uppercase"
                >
                  <i className="fa-solid fa-wand-magic-sparkles mr-2 animate-bounce"></i> Quick Start Demo Swarm
                </button>
              </div>
            </div>
          ) : (
            // Active Board view (3 columns split horizontally)
            <div className="flex-1 flex gap-5 overflow-hidden">
              
              {/* ─── COLUMN 1: TO DO ─── */}
              <div className="w-[300px] flex-shrink-0 flex flex-col gap-3 h-full overflow-hidden">
                <div className="flex justify-between items-center mb-2 px-1 shrink-0">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> To Do
                  </h3>
                  <span className="text-[9px] font-mono font-bold text-textMuted bg-[#151a23] border border-panelBorder px-2 py-0.5 rounded-lg">
                    {tickets.filter(t => t.status === 'todo').length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
                  {tickets.filter(t => t.status === 'todo').map(ticket => (
                    <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} />
                  ))}
                </div>
              </div>

              {/* ─── COLUMN 2: IN PROGRESS ─── */}
              <div className="w-[300px] flex-shrink-0 flex flex-col gap-3 h-full overflow-hidden">
                <div className="flex justify-between items-center mb-2 px-1 shrink-0">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-neonGreen animate-pulse shadow-glow-success" /> In Progress
                  </h3>
                  <span className="text-[9px] font-mono font-bold text-neonGreen bg-emerald-950/40 border border-neonGreen/20 px-2 py-0.5 rounded-lg">
                    {tickets.filter(t => t.status === 'inprogress').length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
                  {tickets.filter(t => t.status === 'inprogress').map(ticket => (
                    <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} isActive />
                  ))}
                </div>
              </div>

              {/* ─── COLUMN 3: COMPLETED ─── */}
              <div className="w-[300px] flex-shrink-0 flex flex-col gap-3 h-full overflow-hidden">
                <div className="flex justify-between items-center mb-2 px-1 shrink-0">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-cyan" /> Completed
                  </h3>
                  <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-400/20 px-2 py-0.5 rounded-lg">
                    {tickets.filter(t => t.status === 'done' || t.status === 'awaiting').length}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
                  {/* Both awaiting (for approvals) and completed tickets are shown here in matching Completed lists */}
                  {tickets.filter(t => t.status === 'done' || t.status === 'awaiting').map(ticket => (
                    <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} isCompleted />
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Embedded live logs console at the bottom */}
          {initialized && (
            <div className="h-[180px] bg-black/40 border border-panelBorder rounded-xl p-4 mt-4 flex flex-col shrink-0 overflow-hidden shadow-inner relative z-10">
              <div className="flex items-center justify-between border-b border-panelBorder/40 pb-2 mb-2 shrink-0">
                <span className="text-[9px] font-black uppercase text-cyan-400 tracking-widest flex items-center gap-2 font-mono">
                  <i className="fa-solid fa-terminal animate-pulse"></i> Swarm Shell Operations Streams
                </span>
                <span className="text-[8px] font-mono text-neonGreen font-black tracking-widest uppercase flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-neonGreen animate-ping" /> STREAM_ACTIVE
                </span>
              </div>
              
              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[9.5px] text-slate-300 custom-scrollbar select-text leading-relaxed p-1"
              >
                {logs.map((log, idx) => {
                  const isError = log.includes('[Error]');
                  const isCEO = log.includes('[CEO]');
                  const isSystem = log.includes('[System]');
                  const isBroker = log.includes('[Broker]');
                  return (
                    <div 
                      key={idx}
                      className={`p-2 rounded border flex items-start gap-2 transition-all hover:bg-white/[0.01] ${
                        isError 
                          ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                          : isCEO 
                          ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 font-bold'
                          : isSystem 
                          ? 'bg-[#151a23] border-panelBorder text-slate-400'
                          : isBroker
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-[#151a23]/30 border-transparent text-slate-400'
                      }`}
                    >
                      <span className="opacity-30 select-none text-[8px] font-semibold shrink-0 mt-0.5">{(idx+1).toString().padStart(3, '0')}</span>
                      <span className="flex-1 break-all select-text">{log}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* CODE PREVIEW POPUP MODAL OVERLAY                        */}
      {/* ======================================================== */}
      <AnimatePresence>
        {activeCodePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-panelBg border border-panelBorder rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[80vh] text-left"
            >
              {/* Window header */}
              <div className="bg-[#050505] px-5 py-4 flex items-center justify-between border-b border-panelBorder">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 mr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <i className="fa-solid fa-code text-cyan-400"></i>
                  <span className="text-[10px] font-mono font-bold tracking-wider text-white">WORKSPACE_CODE_ASSET.md</span>
                </div>
                <button
                  onClick={() => setActiveCodePreview(null)}
                  className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Code output display box */}
              <div className="flex-1 p-6 overflow-y-auto bg-black/60 font-mono text-[10.5px] leading-relaxed text-cyan-300 custom-scrollbar select-text shadow-inner">
                <pre><code>{activeCodePreview}</code></pre>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* HIRE NEW AGENT OVERLAY POPUP MODAL                      */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isHireModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-panelBg border border-panelBorder rounded-xl max-w-sm w-full p-6 space-y-5 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-panelBorder pb-3">
                <h4 className="text-xs font-bold uppercase text-white tracking-widest font-sans">Recruit Swarm Agent</h4>
                <button 
                  onClick={() => setIsHireModalOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[8.5px] font-bold uppercase tracking-widest text-cyan-400 block">Agent Name</label>
                  <input
                    type="text"
                    value={newAgentName}
                    onChange={e => setNewAgentName(e.target.value)}
                    placeholder="e.g. Scribe-v2, Traffic-Optimizer..."
                    className="w-full p-2.5 bg-[#050505] border border-panelBorder rounded-lg text-xs font-mono text-gray-300 outline-none focus:border-cyan-500/40"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[8.5px] font-bold uppercase tracking-widest text-cyan-400 block">Agent Specialty / Role</label>
                  <input
                    type="text"
                    value={newAgentRole}
                    onChange={e => setNewAgentRole(e.target.value)}
                    placeholder="e.g. Lead Copywriter, QA Auditor..."
                    className="w-full p-2.5 bg-[#050505] border border-panelBorder rounded-lg text-xs font-mono text-gray-300 outline-none focus:border-cyan-500/40"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleHireAgent}
                disabled={!newAgentName.trim() || !newAgentRole.trim()}
                className="w-full py-3 rounded-lg border border-neonCyan bg-[#082f49] hover:bg-[#0c4a6e] text-cyan-300 text-xs font-bold tracking-widest transition-all glow-cyan uppercase disabled:opacity-40"
              >
                Hire Employee
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ─── Custom Kanban Card Component ───
function KanbanCard({ 
  ticket, 
  agents, 
  onCodePreview,
  isActive,
  isCompleted
}: { 
  ticket: Ticket; 
  agents: Agent[];
  onCodePreview: (code: string) => void;
  isActive?: boolean;
  isCompleted?: boolean;
}) {
  const agent = agents.find(a => a.id === ticket.assignedTo);
  const hasOutput = !!ticket.output;

  // Custom visual classes matching mockup
  const borderClass = isCompleted 
    ? 'border-panelBorder bg-[#151a23]/60' 
    : isActive 
    ? 'bg-[#022c22] border-neonGreen/40 glow-green' 
    : 'bg-[#151a23] border-panelBorder';

  const titleClass = isCompleted 
    ? 'text-gray-400 font-bold line-through' 
    : 'text-white font-semibold';

  return (
    <motion.div
      layoutId={ticket.id}
      transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      className={`border rounded-xl p-4.5 flex flex-col space-y-3.5 text-left hover:border-cyan-500/20 transition-all ${borderClass}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          {/* Hired Agent icon info */}
          <div className="w-6 h-6 rounded bg-[#0b0f19] border border-panelBorder flex items-center justify-center text-xs shrink-0 select-none">
            {agent?.avatar || '🤖'}
          </div>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide truncate max-w-[120px]">
            {agent?.name || 'Worker-Bot'}
          </span>
        </div>
        
        {/* Pulsing indicator matching In Progress status dot */}
        {isActive && (
          <div className="w-2.5 h-2.5 rounded-full bg-neonGreen shadow-[0_0_8px_#10b981] animate-pulse"></div>
        )}
      </div>

      <h4 className={`text-xs uppercase tracking-wide leading-tight ${titleClass}`}>
        {ticket.title}
      </h4>
      <p className="text-[10px] text-textMuted leading-relaxed select-text">
        {ticket.description}
      </p>

      {/* Embedded monospaced Thought Snippet logs */}
      <div className="bg-black/40 border border-panelBorder/30 p-2.5 rounded-lg text-[9px] font-mono text-slate-400 leading-relaxed shadow-inner">
        <span className="text-[8px] font-black text-cyan-400 uppercase tracking-wider block mb-1">Thought Snippet:</span>
        <div className="select-text overflow-y-auto max-h-[70px] custom-scrollbar">
          {ticket.thought}
        </div>
      </div>

      {/* Progress slider bar matching In Progress columns */}
      {isActive && (
        <div className="pt-1.5 shrink-0">
          <div className="w-full bg-[#064e3b] rounded-full h-1.5 mb-1.5 overflow-hidden">
            <div className="bg-neonCyan h-full rounded-full animate-pulse" style={{ width: '65%' }}></div>
          </div>
          <span className="text-[9.5px] text-cyan-400 font-bold uppercase tracking-wider">65% Compiling...</span>
        </div>
      )}

      {/* Completed progress slider bar */}
      {isCompleted && (
        <div className="w-full bg-[#1f2937] rounded-full h-1.5 mt-2 shrink-0">
          <div className="bg-blue-900 h-full rounded-full" style={{ width: '100%' }}></div>
        </div>
      )}

      {/* Code outputs actions */}
      {hasOutput && (
        <div className="pt-2 border-t border-panelBorder/40 flex justify-end shrink-0">
          <button
            onClick={() => onCodePreview(ticket.output!)}
            className="h-6 px-2.5 rounded bg-cyan-950/40 border border-cyan-400/20 hover:bg-cyan-900/60 text-cyan-400 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <i className="fa-solid fa-code"></i> Output Code
          </button>
        </div>
      )}

    </motion.div>
  );
}
