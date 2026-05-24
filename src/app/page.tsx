"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Terminal, Play, CheckCircle2, Cpu, Activity, Lock, Key,
  Eye, EyeOff, Save, Sparkles, ChevronRight, UserCheck, ThumbsUp, ThumbsDown,
  ShieldAlert, Clock, Compass, Rocket, Zap, RefreshCw, FileCode,
  Coins, Users, Kanban, Plus, PlayCircle, PauseCircle, Code, Copy, Check,
  X, Server, CheckSquare, Layers, AlertCircle, Moon, Sun, Monitor, ShieldCheck, Database,
  MessageSquare, Folder, FolderOpen, FileText, Settings, Sliders, Send, Upload, HelpCircle, HardDrive
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

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isAgent: boolean;
  codeSnippet?: string;
}

export default function Page() {
  // ─── Global App Tabs ───
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Team' | 'Files' | 'Chat' | 'Settings'>('Dashboard');

  // ─── Swarm State ───
  const [companyName, setCompanyName] = useState("Nemix Swarm Corp");
  const [mission, setMission] = useState("Build an autonomous multi-agent edge gateway router.");
  const [goal, setGoal] = useState("Decompose and execute Next.js edge failover schemas.");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [budgetUsed, setBudgetUsed] = useState(4200);
  const [budgetLimit, setBudgetLimit] = useState(100000);
  const [governanceMode, setGovernanceMode] = useState(true);
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Theme & Model Settings
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedModel, setSelectedModel] = useState("meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo");
  
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

  // Chat Section State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState("# ceo-office");

  // Files/Knowledge Base State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string>("All Drives");

  const logContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, activeTab]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, activeTab]);

  // Load API Key and active state from backend on mount
  useEffect(() => {
    const saved = localStorage.getItem('nemix_agent_key');
    if (saved) setApiKey(saved);

    const loadState = async () => {
      try {
        const response = await fetch('/api/orchestrator');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.state && data.state.agents.length > 0) {
            setCompanyName(data.state.companyName || "Nemix Swarm Corp");
            setMission(data.state.mission);
            setGoal(data.state.goal);
            setAgents(data.state.agents);
            setTickets(data.state.tickets);
            setLogs(data.state.logs);
            setBudgetUsed(data.state.budgetUsed);
            setGovernanceMode(data.state.governanceMode);
            setInitialized(true);
            
            // Seed initial chat messages
            setChatMessages([
              {
                id: '1',
                sender: 'Orchestrator-Alpha (CEO)',
                text: `Welcome to the Swarm Workspace, Board of Directors. Swarm Company "${data.state.companyName || 'Nemix Swarm'}" is online. Directives set. How shall we progress?`,
                timestamp: new Date().toLocaleTimeString(),
                isAgent: true
              }
            ]);
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

  // ─── Initialize Swarm ───
  const handleStartCompany = async () => {
    if (!companyName.trim() || !goal.trim()) return;

    setIsInitializing(true);
    addLocalLog('[System] Contacting Nemix API Gateway to broker agent roster...');

    try {
      const response = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'onboard',
          companyName: companyName.trim(),
          goal: goal.trim(),
          apiKey: apiKey.trim(),
          mission: mission.trim()
        })
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
        setActiveTab('Dashboard');
        
        // Seed chat messages
        setChatMessages([
          {
            id: '1',
            sender: 'Orchestrator-Alpha (CEO)',
            text: `Initial roster deployed for Swarm Corp "${companyName}". Backlog created with 3 tickets. All agents waiting directive.`,
            timestamp: new Date().toLocaleTimeString(),
            isAgent: true
          }
        ]);

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
    
    const demoCompany = "Nemix Fintech Corp";
    const demoMission = "Build a high-performance automated stock and asset trading portfolio dashboard.";
    const demoGoal = "Construct Next.js graphs, configure webhooks, and compile mock trading logic.";
    
    setCompanyName(demoCompany);
    setMission(demoMission);
    setGoal(demoGoal);

    try {
      const response = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'onboard',
          companyName: demoCompany,
          goal: demoGoal,
          apiKey: apiKey.trim(),
          mission: demoMission
        })
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
        setActiveTab('Dashboard');

        // Seed chat messages
        setChatMessages([
          {
            id: '1',
            sender: 'Orchestrator-Alpha (CEO)',
            text: `Swarm Company "${demoCompany}" initialized successfully. Roster dispatches configured. Setup active goal metrics. Ready for operations ticks.`,
            timestamp: new Date().toLocaleTimeString(),
            isAgent: true
          }
        ]);
        
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
    
    const awaitingTicket = tickets.find(t => t.status === 'awaiting');
    if (awaitingTicket && governanceMode) {
      setActiveApprovalTicket(awaitingTicket);
      setIsAutoTicking(false);
      addLocalLog('[System] Heartbeat paused: Swarm awaits governance board decision.');
      return;
    }

    setIsHeartbeating(true);

    try {
      const response = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heartbeat' })
      });

      if (!response.ok) {
        throw new Error('Heartbeat sync failed');
      }

      const data = await response.json();
      
      setTickets(data.state.tickets);
      setAgents(data.state.agents);
      setLogs(data.state.logs);
      setBudgetUsed(data.state.budgetUsed);
      
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
      const response = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          ticketId: ticket.id,
          decision
        })
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

  // ─── Swarm Chat Prompt Submissions ───
  const handleSendPromptMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'Board Member (You)',
      text: typedMessage,
      timestamp: new Date().toLocaleTimeString(),
      isAgent: false
    };

    setChatMessages(prev => [...prev, userMsg]);
    const prompt = typedMessage.trim().toLowerCase();
    setTypedMessage("");

    // Simulate CEO processing/response based on prompt goal
    setTimeout(() => {
      let responseText = `Board directive acknowledged. Analyzing goal parameter configurations: "${goal}". dispatches queued.`;
      let code = "";

      if (prompt.includes('status') || prompt.includes('update')) {
        const completed = tickets.filter(t => t.status === 'done').length;
        const total = tickets.length;
        responseText = `Current Swarm telemetry status: ${completed}/${total} tasks finalized. Computed budget actively cached. standing by for ticks!`;
      } else if (prompt.includes('code') || prompt.includes('blueprint') || prompt.includes('file')) {
        responseText = `CEO Synthesis complete: Produced edge fallover route script vault parameters securely matching ${companyName} goals.`;
        code = `// Dynamic Swarm Route Module: edge_failover_hook.py
import requests
from nemix import NemixAPI

class GatewayRouter:
    def __init__(self):
        self.endpoint = "https://api.nemix.ai/v1/chat/completions"
        self.local_key = "nex_sk_secured_vault"
        
    def execute_failover(self, payload):
        print("Routing to primary together gateway...")
        # Static validation loops success
        return {"status": "SUCCESS", "route": "api.nemix.ai"}`;
      } else if (prompt.includes('hire') || prompt.includes('recruit')) {
        responseText = `Roster instructions registered. To hire custom agents dynamically, please navigate to the "Team/Agents" directory tab or use the hire terminal modal.`;
      }

      const agentMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'Orchestrator-Alpha (CEO)',
        text: responseText,
        timestamp: new Date().toLocaleTimeString(),
        isAgent: true,
        codeSnippet: code || undefined
      };

      setChatMessages(prev => [...prev, agentMsg]);
    }, 1000);
  };

  // Hired agent references
  const devAgent = agents.find(a => a.id === 'agent_coder') || agents.find(a => a.role.toLowerCase().includes('dev') || a.role.toLowerCase().includes('architect'));
  const marketerAgent = agents.find(a => a.role.toLowerCase().includes('market')) || agents.find(a => a.id === 'agent_architect');
  const qaAgent = agents.find(a => a.id === 'agent_qa') || agents.find(a => a.role.toLowerCase().includes('qa') || a.role.toLowerCase().includes('auditor'));

  // Mock uploaded files knowledge database
  const knowledgeFiles = [
    { name: "swarm_onboarding_brief.md", size: "2.4 KB", type: "Doc", date: "24-05-2026", folder: "Drives" },
    { name: "together_ai_fallback_specs.pdf", size: "1.8 MB", type: "PDF", date: "22-05-2026", folder: "Drives" },
    { name: "edge_router_schema_blueprint.json", size: "482 Bytes", type: "Config", date: "23-05-2026", folder: "Blueprints" },
    { name: "nemix_chat_model_guidelines.md", size: "5.1 KB", type: "Doc", date: "24-05-2026", folder: "Prompts" },
    { name: "company_unit_economics_spreadsheet.csv", size: "14.2 KB", type: "Dataset", date: "21-05-2026", folder: "Datasets" }
  ];

  const filteredFiles = knowledgeFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === "All Drives" || file.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="bg-nemixBg text-gray-200 h-screen flex overflow-hidden selection:bg-neonCyan selection:text-white font-sans antialiased">
      
      {/* ======================================================== */}
      {/* PANEL 1: GLOBAL NAVIGATION SIDEBAR (Extreme Left, 64px) */}
      {/* ======================================================== */}
      <nav className="w-[64px] flex-shrink-0 bg-[#050505] border-r border-panelBorder flex flex-col items-center py-4 z-30 relative shadow-xl">
        <div className="mb-8 cursor-pointer flex items-center justify-center">
          <span className="text-xl font-black text-cyan-400 italic font-mono">N</span>
          <span className="text-xs text-neonGreen -ml-1 mt-2">/</span>
        </div>

        <div className="flex-1 flex flex-col items-center gap-4 w-full px-2">
          {/* Dashboard Tab */}
          <button 
            onClick={() => { if(initialized) setActiveTab('Dashboard'); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group ${
              activeTab === 'Dashboard' 
                ? 'bg-cyan-900/30 border border-cyan-500/40 text-cyan-400 glow-cyan' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            } ${!initialized ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Dashboard Overview"
          >
            <i className="fa-solid fa-gear text-[18px]"></i>
            <span className="absolute left-[54px] bg-panelBg border border-panelBorder text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">Dashboard</span>
          </button>

          {/* Team / Roster Tab */}
          <button 
            onClick={() => { if(initialized) setActiveTab('Team'); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group ${
              activeTab === 'Team' 
                ? 'bg-cyan-900/30 border border-cyan-500/40 text-cyan-400 glow-cyan' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            } ${!initialized ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Swarm Roster tree"
          >
            <i className="fa-solid fa-user-group text-[16px]"></i>
            <span className="absolute left-[54px] bg-panelBg border border-panelBorder text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">Agents Tree</span>
          </button>

          {/* Swarm Chat Tab */}
          <button 
            onClick={() => { if(initialized) setActiveTab('Chat'); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group ${
              activeTab === 'Chat' 
                ? 'bg-cyan-900/30 border border-cyan-500/40 text-cyan-400 glow-cyan' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            } ${!initialized ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Interactive Chat Console"
          >
            <i className="fa-regular fa-file-lines text-[18px]"></i>
            <span className="absolute left-[54px] bg-panelBg border border-panelBorder text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">Swarm Chat</span>
          </button>

          {/* Files Knowledge Tab */}
          <button 
            onClick={() => { if(initialized) setActiveTab('Files'); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group ${
              activeTab === 'Files' 
                ? 'bg-cyan-900/30 border border-cyan-500/40 text-cyan-400 glow-cyan' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            } ${!initialized ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Knowledge Base Explorer"
          >
            <i className="fa-regular fa-folder text-[18px]"></i>
            <span className="absolute left-[54px] bg-panelBg border border-panelBorder text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">Knowledge Base</span>
          </button>

          {/* Settings Tab */}
          <button 
            onClick={() => { if(initialized) setActiveTab('Settings'); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group ${
              activeTab === 'Settings' 
                ? 'bg-cyan-900/30 border border-cyan-500/40 text-cyan-400 glow-cyan' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            } ${!initialized ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Settings panel"
          >
            <i className="fa-solid fa-atom text-[18px]"></i>
            <span className="absolute left-[54px] bg-panelBg border border-panelBorder text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">System Settings</span>
          </button>
        </div>

        {/* Bottom logout / reset trigger */}
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
              addLocalLog('[System] Swarm company reset.');
            }}
            className="w-10 h-10 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all"
            title="Wipe Session Swarm"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-[18px]"></i>
          </button>
        </div>
      </nav>

      {/* ======================================================== */}
      {/* FULL USER JOURNEY VIEW SCENARIO LAYOUT                   */}
      {/* ======================================================== */}
      {!initialized ? (
        
        // Setup / Initial Onboarding view
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(6,182,212,0.06),transparent_65%)] pointer-events-none" />
          
          <div className="bg-[#0e1015] border border-panelBorder rounded-2xl p-9 max-w-lg w-full text-center space-y-6 shadow-2xl relative glowing-border">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 via-indigo-600 to-emerald-500 border border-cyan-400/20 shadow-glow-primary flex items-center justify-center animate-pulse mx-auto">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-widest text-white uppercase font-sans">DEPLOY META SWARM</h2>
              <p className="text-xs text-textMuted max-w-sm mx-auto leading-relaxed">
                Provide your custom credentials, company parameters, and directive goals. Dispatches active multi-agent trees powered strictly by the client Nemix API.
              </p>
            </div>

            <div className="space-y-4 text-left pt-2">
              <div className="space-y-1.5">
                <label className="text-[8.5px] font-black uppercase tracking-widest text-cyan-400 block">Company Name</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <Compass className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Nemix Fintech Corp"
                    className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-panelBorder rounded-xl text-xs font-mono text-white outline-none focus:border-cyan-500/40 shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8.5px] font-black uppercase tracking-widest text-cyan-400 block">Swarm Goal Objective / Mission</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-4 text-gray-500">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <textarea
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    rows={3}
                    placeholder="e.g. Build an automated stock and asset trading portfolio dashboard."
                    className="w-full pl-10 pr-4 py-3 bg-[#050505] border border-panelBorder rounded-xl text-xs font-mono text-white outline-none focus:border-cyan-500/40 shadow-inner resize-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[8.5px] font-black uppercase tracking-widest text-cyan-400 block">Nemix Local API Key</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="nex_sk_ep_xxxxxxxxxxxx"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="w-full pl-10 pr-24 py-3 bg-[#050505] border border-panelBorder rounded-xl text-xs font-mono text-white outline-none focus:border-cyan-500/40 shadow-inner"
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
                    onClick={saveKey}
                    disabled={!apiKey.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#082f49] hover:bg-[#0c4a6e] border border-cyan-500/20 text-cyan-400 disabled:opacity-40"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-3">
              <button
                onClick={handleStartCompany}
                disabled={isInitializing || !companyName.trim() || !goal.trim()}
                className="w-full py-3.5 rounded-xl border border-neonCyan bg-[#082f49] hover:bg-[#0c4a6e] text-cyan-300 text-xs font-bold tracking-widest transition-all glow-cyan uppercase disabled:opacity-50"
              >
                {isInitializing ? "Deploying Corporate Swarm..." : "Deploy Swarm"}
              </button>
              <button
                onClick={handleDemoMode}
                disabled={isInitializing}
                className="w-full py-3 rounded-xl border border-indigo-500/30 bg-[#2e1d44]/35 hover:bg-[#3d2060] text-indigo-400 text-xs font-semibold tracking-wider transition-all uppercase"
              >
                Simulate Demo Mode (Single-Click)
              </button>
            </div>
          </div>
        </div>
      ) : (
        
        // Dashboard views (3-Panel Architecture)
        <div className="flex-1 flex gap-4 p-4 overflow-hidden relative z-10">
          
          {/* ======================================================== */}
          {/* PANEL 2: CONTEXTUAL SIDEBAR (Middle, 360px wide)        */}
          {/* ======================================================== */}
          <aside className="w-[360px] flex-shrink-0 flex flex-col gap-4 h-full">
            
            {/* Contextual Side Panel View Toggles */}
            {activeTab === 'Dashboard' && (
              <>
                {/* Mission controls goal */}
                <div className="bg-panelBg border border-panelBorder rounded-xl p-5 flex flex-col flex-1 overflow-hidden">
                  <h2 className="text-xs font-bold text-gray-100 uppercase tracking-widest mb-4">Mission Control</h2>
                  <div className="flex-1 bg-[#151a23] border border-panelBorder rounded-lg p-4 mb-4 overflow-y-auto custom-scrollbar shadow-inner select-text leading-relaxed text-xs font-mono text-gray-300 space-y-4">
                    <p className="border-b border-panelBorder/30 pb-2 flex items-center gap-2"><i className="fa-solid fa-compass text-cyan-400"></i> MISSION STATEMENT:</p>
                    <p className="text-white uppercase font-sans tracking-wide font-medium">{mission}</p>
                    <p className="border-b border-panelBorder/30 pb-2 pt-2 flex items-center gap-2"><i className="fa-solid fa-rocket text-cyan-400"></i> ACTIVE GOAL DIRECTIVE:</p>
                    <p className="text-white uppercase font-sans tracking-wide font-medium">{goal}</p>
                  </div>
                  
                  {/* Action buttons inside sidebar */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={triggerHeartbeat}
                      disabled={isHeartbeating || isAutoTicking}
                      className="h-11 rounded-lg border border-neonCyan bg-[#082f49] hover:bg-[#0c4a6e] text-cyan-300 text-[10px] font-bold tracking-widest uppercase transition-all glow-cyan disabled:opacity-40"
                    >
                      <i className="fa-solid fa-bolt mr-1"></i> Heartbeat Tick
                    </button>
                    <button
                      onClick={() => {
                        setIsAutoTicking(!isAutoTicking);
                        addLocalLog(`[System] Auto-heartbeat loop execution ${!isAutoTicking ? 'STARTED' : 'PAUSED'}.`);
                      }}
                      className={`h-11 rounded-lg border text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1 ${
                        isAutoTicking 
                          ? 'bg-zinc-800 border-zinc-700 text-gray-400' 
                          : 'bg-emerald-950/40 border-neonGreen/30 text-neonGreen hover:bg-emerald-900/60 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      }`}
                    >
                      {isAutoTicking ? (
                        <><i className="fa-solid fa-pause"></i> Pause Loop</>
                      ) : (
                        <><i className="fa-solid fa-play"></i> Auto Run</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Governance Queue (Pending votes) */}
                <div className="bg-panelBg border border-panelBorder rounded-xl p-5 shrink-0">
                  <h2 className="text-xs font-bold text-gray-100 uppercase tracking-widest mb-4">Governance Queue</h2>
                  {activeApprovalTicket && governanceMode ? (
                    <div className="border border-amber-600/50 bg-[#291711] rounded-lg p-4 relative overflow-hidden shadow-lg animate-pulse">
                      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Approval Required</h3>
                      </div>
                      <p className="text-[11px] text-gray-300 mb-1">Action Task: <span className="text-white font-bold uppercase">{activeApprovalTicket.title}</span></p>
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
              </>
            )}

            {activeTab === 'Team' && (
              <div className="bg-panelBg border border-panelBorder rounded-xl p-5 flex flex-col h-full overflow-hidden">
                <h2 className="text-xs font-bold text-gray-100 uppercase tracking-widest mb-6">Corporate Org Chart</h2>
                
                <div className="flex-1 flex flex-col items-center relative py-4">
                  {/* CEO Node */}
                  <div className="flex flex-col items-center z-10 mb-4 shrink-0">
                    <div className="w-14 h-14 rounded-lg bg-[#082f49] border-2 border-neonCyan glow-cyan flex items-center justify-center mb-2 relative">
                      <i className="fa-solid fa-user-tie text-2xl text-cyan-300"></i>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-neonCyan rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]"></div>
                    </div>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Alpha-CEO</span>
                  </div>

                  {/* Connectors lines */}
                  <div className="w-64 h-6 border-t-2 border-l-2 border-r-2 border-slate-700 rounded-t-xl absolute top-[100px]"></div>
                  <div className="w-[2px] h-4 bg-slate-700 absolute top-[88px]"></div>
                  <div className="w-[2px] h-4 bg-slate-700 absolute top-[100px] left-1/2 -translate-x-1/2"></div>
                  
                  {/* Worker Nodes row */}
                  <div className="flex justify-between w-72 mt-2 shrink-0">
                    
                    {/* Dev */}
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

                    {/* Marketer */}
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

                    {/* QA */}
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

                  <div className="mt-8 border-t border-panelBorder/40 w-full pt-5 flex-1 flex flex-col justify-center space-y-3">
                    <p className="text-center text-[10.5px] text-textMuted leading-relaxed font-semibold">
                      Spawning recursive employee templates requires secure completions authorization. dispatches sync active roster loops dynamically.
                    </p>
                    <button
                      onClick={() => setIsHireModalOpen(true)}
                      className="py-2.5 w-full btn-secondary justify-center text-xs font-bold tracking-wider uppercase"
                    >
                      <i className="fa-solid fa-plus mr-1"></i> Hire Specialized Agent
                    </button>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'Files' && (
              <div className="bg-panelBg border border-panelBorder rounded-xl p-5 flex flex-col h-full overflow-hidden">
                <h2 className="text-xs font-bold text-gray-100 uppercase tracking-widest mb-4">Knowledge Structure</h2>
                
                {/* Search query box */}
                <div className="relative mb-4 shrink-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search files..."
                    className="w-full p-2 pl-8 bg-[#111827] border border-panelBorder rounded-lg text-xs font-mono text-gray-300 outline-none"
                  />
                  <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]"></i>
                </div>

                {/* Directory structures */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {[
                    { label: "All Drives", icon: "fa-hard-drive", count: knowledgeFiles.length },
                    { label: "Datasets", icon: "fa-database", count: knowledgeFiles.filter(f=>f.folder==="Datasets").length },
                    { label: "Prompts", icon: "fa-feather", count: knowledgeFiles.filter(f=>f.folder==="Prompts").length },
                    { label: "Blueprints", icon: "fa-project-diagram", count: knowledgeFiles.filter(f=>f.folder==="Blueprints").length },
                    { label: "Drives", icon: "fa-folder-open", count: knowledgeFiles.filter(f=>f.folder==="Drives").length }
                  ].map((folder) => (
                    <button
                      key={folder.label}
                      onClick={() => setSelectedFolder(folder.label)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold uppercase transition-colors ${
                        selectedFolder === folder.label 
                          ? 'bg-cyan-950/20 border border-cyan-500/30 text-cyan-400' 
                          : 'hover:bg-white/5 border border-transparent text-gray-400'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <i className={`fa-solid ${folder.icon} text-sm ${selectedFolder === folder.label ? 'text-cyan-400' : 'text-gray-500'}`}></i>
                        {folder.label}
                      </span>
                      <span className="text-[10px] font-mono opacity-60 bg-black/30 px-1.5 py-0.5 rounded">{folder.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Chat' && (
              <div className="bg-panelBg border border-panelBorder rounded-xl p-5 flex flex-col h-full overflow-hidden">
                <h2 className="text-xs font-bold text-gray-100 uppercase tracking-widest mb-4">Chat Channels</h2>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {[
                    { label: "# ceo-office", detail: "Primary swarm instructions" },
                    { label: "# architect-designs", detail: "System modules discussions" },
                    { label: "# dev-compiling", detail: "Active task output threads" },
                    { label: "# qa-security", detail: "Compiler and static audits checks" }
                  ].map((channel) => (
                    <button
                      key={channel.label}
                      onClick={() => setActiveChannel(channel.label)}
                      className={`w-full flex flex-col p-3 rounded-lg text-left transition-colors border ${
                        activeChannel === channel.label 
                          ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-400' 
                          : 'hover:bg-white/5 border-transparent text-gray-400'
                      }`}
                    >
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{channel.label}</span>
                      <span className="text-[9px] text-textMuted mt-1 truncate max-w-full font-medium leading-none">{channel.detail}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Settings' && (
              <div className="bg-panelBg border border-panelBorder rounded-xl p-5 flex flex-col h-full overflow-hidden">
                <h2 className="text-xs font-bold text-gray-100 uppercase tracking-widest mb-4">Vault Credentials</h2>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar text-xs">
                  <div className="bg-[#111827] border border-panelBorder rounded-lg p-4 space-y-2.5 relative shadow-inner">
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-full bg-cyan-500/5 blur-xl" />
                    <span className="text-[8px] font-black uppercase text-cyan-400 tracking-widest block leading-none">Security Key</span>
                    <p className="text-[10px] font-mono text-gray-400 select-text truncate">
                      {apiKey ? `nex_sk_ep_${'*'.repeat(12)}${apiKey.slice(-4)}` : "MOCKED_DEFAULT_SECURE_VAULT_KEY"}
                    </p>
                  </div>

                  <div className="bg-[#111827] border border-panelBorder rounded-lg p-4 space-y-2.5 relative shadow-inner">
                    <span className="text-[8px] font-black uppercase text-cyan-400 tracking-widest block leading-none">Model Engine Status</span>
                    <p className="text-[10.5px] font-bold text-white uppercase flex items-center gap-1.5">
                      <i className="fa-solid fa-atom text-cyan-400 animate-pulse"></i> {selectedModel.split('/').pop()}
                    </p>
                  </div>

                  <div className="bg-[#111827] border border-panelBorder rounded-lg p-4 space-y-2.5 relative shadow-inner">
                    <span className="text-[8px] font-black uppercase text-cyan-400 tracking-widest block leading-none">Telemetry Ping</span>
                    <p className="text-[10.5px] font-bold text-neonGreen uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-neonGreen rounded-full shadow-[0_0_5px_#10b981] animate-ping" /> Operational: 14ms
                    </p>
                  </div>
                </div>
              </div>
            )}

          </aside>

          {/* ======================================================== */}
          {/* PANEL 3: MAIN CONTENT AREA (Right, Remaining Width)      */}
          {/* ======================================================== */}
          <main className="flex-1 flex flex-col bg-panelBg border border-panelBorder rounded-xl p-6 overflow-hidden shadow-2xl relative">
            
            {/* Header section in Panel 3 */}
            <header className="flex justify-between items-end border-b border-panelBorder pb-4 mb-6 shrink-0">
              <div>
                <h1 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="text-white font-sans text-xl tracking-normal font-black">{companyName} Swarm Command Center</span>
                </h1>
                <div className="flex gap-12">
                  <div>
                    <p className="text-[9px] text-textMuted uppercase mb-1 font-bold tracking-wider">Active Swarm Directive:</p>
                    <p className="text-sm font-semibold text-white uppercase tracking-wide truncate max-w-sm">
                      {goal}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-textMuted uppercase mb-1 font-bold tracking-wider font-sans">Compute Budget Used:</p>
                    <p className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                      <i className="fa-solid fa-coins text-cyan-400 animate-pulse"></i> {budgetUsed.toLocaleString()} <span className="text-[9px] text-cyan-400 font-sans font-black">NMX</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* God mode switch */}
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

            {/* TAB CONTENTS RENDER SECTION */}
            
            {activeTab === 'Dashboard' && (
              <div className="flex-1 flex flex-col overflow-hidden gap-4">
                {/* Active board view */}
                <div className="flex-1 flex gap-5 overflow-hidden">
                  
                  {/* To Do Column */}
                  <div className="w-[280px] flex-shrink-0 flex flex-col gap-3 h-full overflow-hidden">
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

                  {/* In Progress Column */}
                  <div className="w-[280px] flex-shrink-0 flex flex-col gap-3 h-full overflow-hidden">
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

                  {/* Completed Column */}
                  <div className="w-[280px] flex-shrink-0 flex flex-col gap-3 h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-2 px-1 shrink-0">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-cyan" /> Completed
                      </h3>
                      <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-400/20 px-2 py-0.5 rounded-lg">
                        {tickets.filter(t => t.status === 'done' || t.status === 'awaiting').length}
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar">
                      {tickets.filter(t => t.status === 'done' || t.status === 'awaiting').map(ticket => (
                        <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} isCompleted />
                      ))}
                    </div>
                  </div>

                </div>

                {/* Shell Logs terminal */}
                <div className="h-[180px] bg-black/40 border border-panelBorder rounded-xl p-4 flex flex-col shrink-0 overflow-hidden shadow-inner relative z-10">
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
              </div>
            )}

            {activeTab === 'Team' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                <div className="flex justify-between items-center shrink-0">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest font-sans">Swarm Roster Directory</h3>
                  <button
                    onClick={() => setIsHireModalOpen(true)}
                    className="btn-secondary h-9 text-xs px-3.5 flex items-center gap-1.5 uppercase font-bold"
                  >
                    <Plus className="w-4 h-4 text-cyan-400" /> HIRE AGENT
                  </button>
                </div>

                {/* Agents detailed profiles grid list */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1.5 custom-scrollbar">
                  {agents.map((agent) => (
                    <div key={agent.id} className="border border-panelBorder bg-[#151a23]/40 rounded-xl p-5 flex flex-col space-y-4 hover:border-cyan-500/20 transition-all group">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black/40 border border-panelBorder rounded-lg flex items-center justify-center text-lg shrink-0">
                            {agent.avatar}
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase text-white tracking-wider group-hover:text-cyan-400 transition-colors">{agent.name}</h4>
                            <p className="text-[8px] font-extrabold text-cyan-400 uppercase tracking-widest mt-0.5">{agent.role}</p>
                          </div>
                        </div>

                        {/* pulsing badge */}
                        <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-full border border-panelBorder shrink-0 select-none">
                          <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'working' ? 'bg-neonGreen animate-pulse shadow-[0_0_5px_#10b981]' : 'bg-slate-500'}`} />
                          <span className={`text-[8px] font-black uppercase tracking-wider ${agent.status === 'working' ? 'text-neonGreen' : 'text-slate-400'}`}>{agent.status}</span>
                        </div>
                      </div>

                      <div className="bg-black/40 border border-panelBorder/30 p-3 rounded-lg text-[9.5px] font-mono text-slate-400 leading-relaxed shadow-inner">
                        <span className="text-[8.5px] font-black text-cyan-400 uppercase tracking-wider block mb-1">System Prompt Blueprint</span>
                        <div className="select-text overflow-y-auto max-h-[80px] custom-scrollbar">
                          {agent.id === 'agent_ceo' 
                            ? `You analyze goals: "${goal}", coordinate workers, and organize task backlogs using Nemix API completions.`
                            : `You execute targeted Swarm development, architectures, or auditing tasks dispatches dynamically.`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'Files' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                <div className="flex justify-between items-center shrink-0 border-b border-panelBorder/40 pb-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-widest font-sans flex items-center gap-2">
                    <Folder className="w-4.5 h-4.5 text-cyan-400" /> Knowledge base drives explorer
                  </h3>
                  <div className="flex gap-2">
                    <button className="btn-secondary h-8.5 text-xs px-3 flex items-center gap-1.5 uppercase font-bold text-cyan-400 bg-cyan-950/10 border border-cyan-500/20 shadow-glow-cyan">
                      <Upload className="w-3.5 h-3.5" /> Upload File
                    </button>
                  </div>
                </div>

                {/* files grid list explorer */}
                <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-3 select-none">
                  {filteredFiles.length === 0 ? (
                    <div className="text-center py-20 text-textMuted text-xs font-bold uppercase tracking-wider">
                      No files matching filters
                    </div>
                  ) : (
                    filteredFiles.map((file, idx) => (
                      <div key={idx} className="bg-[#151a23]/35 border border-panelBorder rounded-xl p-4 flex items-center justify-between hover:border-cyan-500/20 transition-all group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-black/40 border border-panelBorder rounded-lg flex items-center justify-center shrink-0 group-hover:text-cyan-400 transition-colors">
                            <FileText className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate max-w-sm group-hover:text-cyan-400 transition-colors select-text">{file.name}</h4>
                            <p className="text-[8px] text-textMuted uppercase mt-1 font-mono">{file.type} • {file.size} • Uploaded {file.date}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[8.5px] font-black uppercase bg-[#111827] border border-panelBorder px-2.5 py-0.5 rounded-lg text-cyan-400 shadow-inner">
                            {file.folder}
                          </span>
                          <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                            <Code className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Chat' && (
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Channel Header details */}
                <div className="flex items-center justify-between shrink-0 border-b border-panelBorder/40 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">{activeChannel}</span>
                    <span className="text-[9px] text-textMuted uppercase font-mono bg-black/30 border border-panelBorder px-2 py-0.5 rounded-lg shrink-0">CEO CHANNEL</span>
                  </div>
                  <span className="text-[8px] text-neonGreen font-black tracking-widest uppercase flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-neonGreen animate-ping" /> ACTIVE</span>
                </div>

                {/* chat messages scroll container */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar mb-4 bg-black/30 border border-panelBorder rounded-xl p-4 shadow-inner"
                >
                  {chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[85%] ${
                        msg.isAgent 
                          ? 'mr-auto text-left' 
                          : 'ml-auto text-right items-end'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase text-cyan-400 tracking-wide">{msg.sender}</span>
                        <span className="text-[8px] text-textMuted font-mono font-medium">{msg.timestamp}</span>
                      </div>

                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed select-text font-sans font-medium border ${
                        msg.isAgent 
                          ? 'bg-[#151a23]/60 border-panelBorder rounded-tl-none text-gray-200' 
                          : 'bg-[#082f49]/80 border-cyan-500/20 rounded-tr-none text-white'
                      }`}>
                        {msg.text}

                        {/* code snippet preview if loaded */}
                        {msg.codeSnippet && (
                          <div className="mt-3.5 pt-3.5 border-t border-panelBorder/40">
                            <pre className="text-[9.5px] font-mono text-emerald-400 bg-black/50 p-3 rounded-lg overflow-x-auto select-text leading-relaxed">
                              <code>{msg.codeSnippet}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input prompt message form */}
                <form onSubmit={handleSendPromptMessage} className="flex gap-2.5 shrink-0">
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={e => setTypedMessage(e.target.value)}
                    placeholder="Enter board directive / prompt for Orchestrator Alpha..."
                    className="flex-1 px-4 py-3 bg-[#050505] border border-panelBorder rounded-xl text-xs font-mono text-white outline-none focus:border-cyan-500/40 shadow-inner"
                  />
                  <button
                    type="submit"
                    className="w-12 h-11.5 rounded-xl border border-neonCyan bg-[#082f49] hover:bg-[#0c4a6e] text-cyan-300 flex items-center justify-center transition-all glow-cyan"
                  >
                    <Send className="w-4 h-4 text-cyan-300 animate-pulse" />
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'Settings' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest font-sans border-b border-panelBorder/40 pb-3 shrink-0">System Configurations</h3>

                <div className="flex-1 overflow-y-auto space-y-6 pr-1.5 custom-scrollbar">
                  
                  {/* Model settings config */}
                  <div className="space-y-2 text-left">
                    <label className="text-[8.5px] font-black uppercase tracking-widest text-cyan-400 block">LLM Engine Model</label>
                    <select
                      value={selectedModel}
                      onChange={e => {
                        setSelectedModel(e.target.value);
                        addLocalLog(`[System] LLM engine switched to: ${e.target.value}`);
                      }}
                      className="w-full p-3.5 bg-[#050505] border border-panelBorder rounded-xl text-xs font-mono text-white outline-none focus:border-cyan-500/40 shadow-inner uppercase tracking-wider"
                    >
                      <option value="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo">Llama 3.1 70B (Fast completions)</option>
                      <option value="meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo">Llama 3.1 405B (Deep reasoning)</option>
                      <option value="anthropic/claude-3-opus">Claude 3 Opus (Logical edge)</option>
                    </select>
                  </div>

                  {/* Slider limits budget */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[8.5px] font-black uppercase tracking-widest text-cyan-400 block">Compute Budget Threshold</label>
                      <span className="text-xs font-mono font-bold text-white">{budgetLimit.toLocaleString()} NMX</span>
                    </div>
                    
                    <input
                      type="range"
                      min={10000}
                      max={500000}
                      step={10000}
                      value={budgetLimit}
                      onChange={e => {
                        setBudgetLimit(parseInt(e.target.value));
                        addLocalLog(`[System] Compute budget threshold adjusted to: ${parseInt(e.target.value).toLocaleString()} NMX`);
                      }}
                      className="w-full h-1 bg-[#111827] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-[8px] text-textMuted uppercase tracking-wider font-bold pt-1">
                      <span>10k NMX min</span>
                      <span>500k NMX max</span>
                    </div>
                  </div>

                  {/* Local API Key Settings fields */}
                  <div className="space-y-2 text-left pt-2">
                    <label className="text-[8.5px] font-black uppercase tracking-widest text-cyan-400 block">Update API Handshake Keys</label>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        placeholder="nex_sk_ep_xxxxxxxxxxxx"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="w-full pl-4 pr-24 py-3.5 bg-[#050505] border border-panelBorder rounded-xl text-xs font-mono text-white outline-none focus:border-cyan-500/40 shadow-inner"
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
                        onClick={saveKey}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#082f49] hover:bg-[#0c4a6e] border border-cyan-500/20 text-cyan-400"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </main>
        </div>
      )}

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
          <div className="w-6 h-6 rounded bg-[#0b0f19] border border-panelBorder flex items-center justify-center text-xs shrink-0 select-none">
            {agent?.avatar || '🤖'}
          </div>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide truncate max-w-[120px]">
            {agent?.name || 'Worker-Bot'}
          </span>
        </div>
        
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

      {isActive && (
        <div className="pt-1.5 shrink-0">
          <div className="w-full bg-[#064e3b] rounded-full h-1.5 mb-1.5 overflow-hidden">
            <div className="bg-neonCyan h-full rounded-full animate-pulse" style={{ width: '65%' }}></div>
          </div>
          <span className="text-[9.5px] text-cyan-400 font-bold uppercase tracking-wider">65% Compiling...</span>
        </div>
      )}

      {isCompleted && (
        <div className="w-full bg-[#1f2937] rounded-full h-1.5 mt-2 shrink-0">
          <div className="bg-blue-900 h-full rounded-full" style={{ width: '100%' }}></div>
        </div>
      )}

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
