"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Terminal, Play, CheckCircle2, Cpu, Activity, Lock, Key,
  Eye, EyeOff, Save, Sparkles, ChevronRight, UserCheck, ThumbsUp, ThumbsDown,
  ShieldAlert, Clock, Compass, Rocket, Zap, RefreshCw, FileCode,
  Coins, Users, Kanban, Plus, PlayCircle, PauseCircle, Code, Copy, Check,
  X, Server, CheckSquare, Layers, AlertCircle, Moon, Sun, Monitor, ShieldCheck, Database,
  MessageSquare, Folder, FolderOpen, FileText, Settings, Sliders, Send, Upload, HelpCircle, HardDrive,
  LayoutDashboard, LogOut, Table
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

// ─── Human Coding Aesthetic Helpers ───
const getAgentIcon = (id: string, fallbackAvatar: string) => {
  const normalizedId = id.toLowerCase();
  if (normalizedId.includes('ceo')) {
    return <BrainCircuit className="w-5 h-5 text-cyan-400" />;
  } else if (normalizedId.includes('architect')) {
    return <Compass className="w-5 h-5 text-indigo-400" />;
  } else if (normalizedId.includes('coder') || normalizedId.includes('dev')) {
    return <Code className="w-5 h-5 text-emerald-400" />;
  } else if (normalizedId.includes('qa') || normalizedId.includes('audit')) {
    return <ShieldCheck className="w-5 h-5 text-amber-400" />;
  }
  return <Cpu className="w-5 h-5 text-cyan-400" />;
};

const getAgentMetrics = (id: string) => {
  const normalizedId = id.toLowerCase();
  if (normalizedId.includes('ceo')) {
    return { temp: 0.2, tokens: '1.4M', successRate: '99.2%', latency: '18ms' };
  } else if (normalizedId.includes('architect')) {
    return { temp: 0.5, tokens: '890K', successRate: '98.5%', latency: '24ms' };
  } else if (normalizedId.includes('coder') || normalizedId.includes('dev')) {
    return { temp: 0.7, tokens: '2.1M', successRate: '96.8%', latency: '14ms' };
  } else if (normalizedId.includes('qa') || normalizedId.includes('audit')) {
    return { temp: 0.1, tokens: '1.1M', successRate: '99.9%', latency: '12ms' };
  }
  return { temp: 0.7, tokens: '240K', successRate: '95.0%', latency: '35ms' };
};

export default function Page() {
  // ─── Global App Tabs ───
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Team' | 'Files' | 'Chat' | 'Settings'>('Dashboard');

  // ─── Swarm State ───
  const [companyName, setCompanyName] = useState("");
  const [mission, setMission] = useState("");
  const [goal, setGoal] = useState("");
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

  // Auto-scroll logs helper with paint safety timeout
  useEffect(() => {
    const container = logContainerRef.current;
    if (container) {
      const scrollTimeout = setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
      return () => clearTimeout(scrollTimeout);
    }
  }, [logs, activeTab]);

  // Auto-scroll chat helper with paint safety timeout
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      const scrollTimeout = setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
      return () => clearTimeout(scrollTimeout);
    }
  }, [chatMessages, activeTab]);

  // Load API Key and active state from backend on mount
  useEffect(() => {
    const saved = localStorage.getItem('nvmix_agent_key');
    if (saved) setApiKey(saved);

    const loadState = async () => {
      try {
        const response = await fetch('/api/orchestrator');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.state && data.state.agents.length > 0) {
            setCompanyName(data.state.companyName || "Nvmix Swarm Corp");
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
                text: `Welcome to the Swarm Workspace, Board of Directors. Swarm Company "${data.state.companyName || 'Nvmix Swarm'}" is online. Directives set. How shall we progress?`,
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
    localStorage.setItem('nvmix_agent_key', apiKey.trim());
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
    addLocalLog('[System] Contacting Nvmix API Gateway to broker agent roster...');

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
    
    const demoCompany = "Nvmix Fintech Corp";
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
    addLocalLog(`[CEO] Recruited "${newAgentName}" as "${newAgentRole}".`);
    setIsHireModalOpen(false);
    setNewAgentName("");
    setNewAgentRole("");
  };

  // ─── Swarm Chat (Nvmix API Live) ───
  const handleSendPromptMessage = async (e: React.FormEvent) => {
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
    const sentMessage = typedMessage.trim();
    setTypedMessage("");
    const typingId = Math.random().toString();
    setChatMessages(prev => [...prev, { id: typingId, sender: 'Orchestrator-Alpha (CEO)', text: '...', timestamp: new Date().toLocaleTimeString(), isAgent: true }]);
    try {
      const res  = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: sentMessage, channel: activeChannel }) });
      const data = await res.json();
      setChatMessages(prev => prev.filter(m => m.id !== typingId).concat({ id: Math.random().toString(), sender: data.agent || 'Orchestrator-Alpha (CEO)', text: data.reply || 'Processing complete.', timestamp: new Date().toLocaleTimeString(), isAgent: true }));
    } catch {
      setChatMessages(prev => prev.filter(m => m.id !== typingId).concat({ id: Math.random().toString(), sender: 'Orchestrator-Alpha (CEO)', text: 'Nvmix gateway unreachable. Operating in local standby mode.', timestamp: new Date().toLocaleTimeString(), isAgent: true }));
    }
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
    { name: "nvmix_chat_model_guidelines.md", size: "5.1 KB", type: "Doc", date: "24-05-2026", folder: "Prompts" },
    { name: "company_unit_economics_spreadsheet.csv", size: "14.2 KB", type: "Dataset", date: "21-05-2026", folder: "Datasets" }
  ];

  const filteredFiles = knowledgeFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === "All Drives" || file.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="bg-nvmixBg text-gray-200 h-screen flex overflow-hidden selection:bg-neonCyan selection:text-white font-sans antialiased">
      
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
                : 'text-gray-550 hover:text-gray-300 hover:bg-white/5'
            } ${!initialized ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Dashboard Overview"
          >
            {activeTab === 'Dashboard' && (
              <span className="absolute -left-2 w-1 h-5 rounded-r bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
            )}
            <LayoutDashboard className="w-5 h-5" />
            <span className="absolute left-[54px] bg-panelBg border border-panelBorder text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">Dashboard</span>
          </button>

          {/* Team / Roster Tab */}
          <button 
            onClick={() => { if(initialized) setActiveTab('Team'); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group ${
              activeTab === 'Team' 
                ? 'bg-cyan-900/30 border border-cyan-500/40 text-cyan-400 glow-cyan' 
                : 'text-gray-550 hover:text-gray-300 hover:bg-white/5'
            } ${!initialized ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Swarm Roster tree"
          >
            {activeTab === 'Team' && (
              <span className="absolute -left-2 w-1 h-5 rounded-r bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
            )}
            <Users className="w-5 h-5" />
            <span className="absolute left-[54px] bg-panelBg border border-panelBorder text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">Agents Tree</span>
          </button>

          {/* Swarm Chat Tab */}
          <button 
            onClick={() => { if(initialized) setActiveTab('Chat'); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group ${
              activeTab === 'Chat' 
                ? 'bg-cyan-900/30 border border-cyan-500/40 text-cyan-400 glow-cyan' 
                : 'text-gray-550 hover:text-gray-300 hover:bg-white/5'
            } ${!initialized ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Interactive Chat Console"
          >
            {activeTab === 'Chat' && (
              <span className="absolute -left-2 w-1 h-5 rounded-r bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
            )}
            <MessageSquare className="w-5 h-5" />
            <span className="absolute left-[54px] bg-panelBg border border-panelBorder text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">Swarm Chat</span>
          </button>

          {/* Files Knowledge Tab */}
          <button 
            onClick={() => { if(initialized) setActiveTab('Files'); }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative group ${
              activeTab === 'Files' 
                ? 'bg-cyan-900/30 border border-cyan-500/40 text-cyan-400 glow-cyan' 
                : 'text-gray-550 hover:text-gray-300 hover:bg-white/5'
            } ${!initialized ? 'opacity-40 cursor-not-allowed' : ''}`}
            title="Knowledge Base Explorer"
          >
            {activeTab === 'Files' && (
              <span className="absolute -left-2 w-1 h-5 rounded-r bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
            )}
            <Folder className="w-5 h-5" />
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
            {activeTab === 'Settings' && (
              <span className="absolute -left-2 w-1 h-5 rounded-r bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
            )}
            <Settings className="w-5 h-5" />
            <span className="absolute left-[54px] bg-panelBg border border-panelBorder text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none">System Settings</span>
          </button>
        </div>

        {/* Bottom logout / reset trigger */}
        <div className="flex flex-col items-center gap-3 w-full px-2 pt-4 border-t border-panelBorder/50">
          <button 
            className="w-10 h-10 rounded-xl text-gray-500 hover:text-gray-300 hover:bg-white/5 flex items-center justify-center transition-all cursor-pointer"
            title="System Diagnostics & Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setInitialized(false);
              setAgents([]);
              setTickets([]);
              setLogs([]);
              addLocalLog('[System] Swarm company reset.');
            }}
            className="w-10 h-10 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all cursor-pointer"
            title="Wipe Session Swarm"
          >
            <LogOut className="w-5 h-5" />
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
                Provide your custom credentials, company parameters, and directive goals. Dispatches active multi-agent trees powered strictly by the client Nvmix API.
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
                    placeholder="e.g. Nvmix Fintech Corp"
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
                <label className="text-[8.5px] font-black uppercase tracking-widest text-cyan-400 block">Nvmix Local API Key</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="nvx_sk_ep_xxxxxxxxxxxx"
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
          <aside className="w-[360px] flex-shrink-0 flex flex-col gap-4 h-full order-last">
            
            {/* Contextual Side Panel View Toggles */}
            {activeTab === 'Dashboard' && (
              <>
                {/* Mission controls goal */}
                <div className="bg-panelBg border border-panelBorder rounded-xl p-5 flex flex-col flex-1 overflow-hidden relative shadow-lg">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <i className="fa-solid fa-compass text-cyan-400 animate-pulse"></i>
                    <h2 className="text-xs font-bold text-gray-100 uppercase tracking-widest">Mission Control</h2>
                  </div>
                  <div className="flex-1 bg-[#050608]/70 border border-white/[0.03] rounded-lg p-4 mb-4 overflow-y-auto custom-scrollbar shadow-inner select-text leading-relaxed text-xs text-gray-300 space-y-4">
                    <div>
                      <p className="pb-1.5 flex items-center gap-2 text-[9px] font-bold text-cyan-400 uppercase tracking-widest"><i className="fa-solid fa-circle-notch text-[7px] animate-spin text-cyan-400/40"></i> Mission Statement</p>
                      <p className="text-white font-sans text-xs tracking-wide leading-relaxed font-medium select-text">{mission}</p>
                    </div>
                    <div className="border-t border-panelBorder/40 pt-3">
                      <p className="pb-1.5 flex items-center gap-2 text-[9px] font-bold text-cyan-400 uppercase tracking-widest"><i className="fa-solid fa-bolt text-[7px] text-cyan-400/40"></i> Active Swarm Goal</p>
                      <p className="text-white font-sans text-xs tracking-wide leading-relaxed font-medium select-text">{goal}</p>
                    </div>
                  </div>
                  
                  {/* Action buttons inside sidebar */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={triggerHeartbeat}
                      disabled={isHeartbeating || isAutoTicking}
                      className="h-11 rounded-lg border border-neonCyan bg-[#082f49] hover:bg-[#0c4a6e] text-cyan-300 text-[10px] font-bold tracking-widest uppercase transition-all glow-cyan disabled:opacity-40 cursor-pointer"
                    >
                      <i className="fa-solid fa-bolt mr-1"></i> Heartbeat Tick
                    </button>
                    <button
                      onClick={() => {
                        setIsAutoTicking(!isAutoTicking);
                        addLocalLog(`[System] Auto-heartbeat loop execution ${!isAutoTicking ? 'STARTED' : 'PAUSED'}.`);
                      }}
                      className={`h-11 rounded-lg border text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
                <div className="bg-panelBg border border-panelBorder rounded-xl p-5 shrink-0 relative shadow-lg">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-shield-halved text-cyan-400"></i>
                      <h2 className="text-xs font-bold text-gray-100 uppercase tracking-widest">Governance</h2>
                    </div>
                    {activeApprovalTicket && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    )}
                  </div>
                  {activeApprovalTicket && governanceMode ? (
                    <div className="border border-amber-500/20 bg-amber-950/20 rounded-lg p-4 relative overflow-hidden shadow-lg animate-pulse">
                      <div className="absolute top-0 left-0 w-[3px] h-full bg-amber-500"></div>
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <i className="fa-solid fa-triangle-exclamation animate-pulse"></i> Review Pending
                      </p>
                      <p className="text-xs text-gray-200 mb-2 font-medium">
                        Agent needs your approval to merge: <span className="text-white font-bold block mt-1 uppercase select-all">"{activeApprovalTicket.title}"</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono line-clamp-2 select-text bg-black/30 p-2 rounded border border-white/[0.02]">{activeApprovalTicket.thought}</p>
                      
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => handleBoardApproval('approved')}
                          className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold tracking-wider transition-all uppercase cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleBoardApproval('rejected')}
                          className="flex-1 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-350 text-[10px] font-bold tracking-wider transition-all uppercase cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-white/[0.03] bg-[#090b10]/40 rounded-lg p-4 text-center text-xs text-textMuted py-5 font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-2">
                      <i className="fa-solid fa-circle-check text-cyan-400 text-lg"></i> 
                      <span className="text-[9px] tracking-widest text-slate-400 font-bold">ALL SYSTEMS SECURED</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'Team' && (
              <div className="bg-panelBg border border-panelBorder rounded-xl p-5 flex flex-col h-full overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />
                <h2 className="text-xs font-bold text-gray-150 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <i className="fa-solid fa-sitemap text-cyan-400"></i> Corporate Org Chart
                </h2>
                
                <div className="flex-1 flex flex-col items-center relative py-4">
                  {/* CEO Node */}
                  <div className="flex flex-col items-center z-10 mb-4 shrink-0 group">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-950/70 to-slate-900/90 border-2 border-cyan-500/35 glow-cyan flex items-center justify-center mb-2 relative group-hover:scale-105 transition-all duration-300 shadow-lg">
                      <BrainCircuit className="w-8 h-8 text-cyan-400" />
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-500 rounded-full border-2 border-slate-900 animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.8)]"></div>
                    </div>
                    <span className="text-xs font-black text-white uppercase tracking-widest leading-none">Alpha-CEO</span>
                    <span className="text-[7.5px] text-cyan-400 font-extrabold uppercase tracking-widest mt-1 opacity-90">Swarm Director</span>
                  </div>

                  {/* Connectors lines */}
                  <div className="w-64 h-6 border-t border-l border-r border-cyan-500/25 rounded-t-xl absolute top-[106px] pointer-events-none"></div>
                  <div className="w-[1px] h-4 bg-cyan-500/25 absolute top-[94px] pointer-events-none"></div>
                  <div className="w-[1px] h-4 bg-cyan-500/25 absolute top-[106px] left-1/2 -translate-x-1/2 pointer-events-none"></div>
                  
                  {/* Worker Nodes row */}
                  <div className="flex justify-between w-72 mt-2 shrink-0">
                    
                    {/* Dev */}
                    <div className={`flex flex-col items-center bg-[#0e111a]/95 border rounded-xl p-2.5 w-[92px] group hover:-translate-y-1 transition-all duration-300 ${
                      devAgent?.status === 'working' ? 'border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)] bg-cyan-950/10' : 'border-panelBorder'
                    }`}>
                      <div className="w-8 h-8 rounded-lg bg-black/40 border border-panelBorder flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform relative">
                        <Code className={`w-4 h-4 ${devAgent?.status === 'working' ? 'text-emerald-400' : 'text-slate-400'}`} />
                        {devAgent?.status === 'working' && (
                          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900 animate-ping"></span>
                        )}
                      </div>
                      <span className="text-[9px] font-black text-white uppercase tracking-wider truncate max-w-full text-center">
                        {devAgent ? devAgent.name : "Dev-Bot"}
                      </span>
                      <span className="text-[7.5px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5 leading-none">Developer</span>
                    </div>

                    {/* Architect */}
                    <div className={`flex flex-col items-center bg-[#0e111a]/95 border rounded-xl p-2.5 w-[92px] group hover:-translate-y-1 transition-all duration-300 ${
                      marketerAgent?.status === 'working' || (initialized && !devAgent) ? 'border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)] bg-indigo-950/10' : 'border-panelBorder'
                    }`}>
                      <div className="w-8 h-8 rounded-lg bg-black/40 border border-panelBorder flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform relative">
                        <Compass className={`w-4 h-4 ${marketerAgent?.status === 'working' || (initialized && !devAgent) ? 'text-indigo-400' : 'text-slate-400'}`} />
                        {(marketerAgent?.status === 'working' || (initialized && !devAgent)) && (
                          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-indigo-500 border border-slate-900 animate-ping"></span>
                        )}
                      </div>
                      <span className="text-[9px] font-black text-white uppercase tracking-wider truncate max-w-full text-center">
                        {marketerAgent ? marketerAgent.name : "Architect"}
                      </span>
                      <span className="text-[7.5px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5 leading-none">Architect</span>
                    </div>

                    {/* QA */}
                    <div className={`flex flex-col items-center bg-[#0e111a]/95 border rounded-xl p-2.5 w-[92px] group hover:-translate-y-1 transition-all duration-300 ${
                      qaAgent?.status === 'working' ? 'border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)] bg-amber-950/10' : 'border-panelBorder'
                    }`}>
                      <div className="w-8 h-8 rounded-lg bg-black/40 border border-panelBorder flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform relative">
                        <ShieldCheck className={`w-4 h-4 ${qaAgent?.status === 'working' ? 'text-amber-400' : 'text-slate-400'}`} />
                        {qaAgent?.status === 'working' && (
                          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-500 border border-slate-900 animate-ping"></span>
                        )}
                      </div>
                      <span className="text-[9px] font-black text-white uppercase tracking-wider truncate max-w-full text-center">
                        {qaAgent ? qaAgent.name : "QA-Bot"}
                      </span>
                      <span className="text-[7.5px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5 leading-none">Auditor</span>
                    </div>

                  </div>

                  {/* Warning notice & Spawn Action */}
                  <div className="mt-8 border-t border-panelBorder/30 w-full pt-5 flex-1 flex flex-col justify-end space-y-4">
                    <div className="bg-[#091d24]/20 border border-cyan-500/10 rounded-xl p-3.5 shadow-inner text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-[2px] h-full bg-cyan-500/40"></div>
                      <p className="text-[10px] text-slate-350 leading-relaxed font-medium">
                        Spawning recursive employee templates requires <span className="text-cyan-400 font-bold">secure completions authorization</span>. Dispatches sync active roster loops dynamically.
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setIsHireModalOpen(true)}
                      className="w-full py-3 rounded-xl border border-neonCyan bg-[#082f49] hover:bg-[#0c4a6e] text-cyan-300 text-xs font-bold tracking-widest transition-all hover:scale-[1.01] active:scale-100 uppercase flex items-center justify-center gap-1.5 glow-cyan cursor-pointer shadow-md"
                    >
                      <Plus className="w-4 h-4 text-cyan-300 animate-pulse" /> Hire Specialized Agent
                    </button>
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'Files' && (
              <div className="bg-panelBg border border-panelBorder rounded-xl p-5 flex flex-col h-full overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                <h2 className="text-xs font-bold text-gray-150 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FolderOpen className="w-4.5 h-4.5 text-cyan-400" /> Knowledge Structure
                </h2>
                
                {/* Search query box */}
                <div className="relative mb-5 shrink-0 select-none">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search files..."
                    className="w-full py-2.5 pl-9 pr-4 bg-[#050508]/80 border border-panelBorder/75 rounded-xl text-xs font-mono text-gray-300 outline-none focus:border-cyan-500/40 transition-colors shadow-inner"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 flex items-center">
                    <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
                  </div>
                </div>

                {/* Directory structures */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar select-none">
                  {[
                    { label: "All Drives", icon: <HardDrive className="w-4 h-4" />, count: knowledgeFiles.length },
                    { label: "Datasets", icon: <Database className="w-4 h-4" />, count: knowledgeFiles.filter(f=>f.folder==="Datasets").length },
                    { label: "Prompts", icon: <Sliders className="w-4 h-4" />, count: knowledgeFiles.filter(f=>f.folder==="Prompts").length },
                    { label: "Blueprints", icon: <Layers className="w-4 h-4" />, count: knowledgeFiles.filter(f=>f.folder==="Blueprints").length },
                    { label: "Drives", icon: <Folder className="w-4 h-4" />, count: knowledgeFiles.filter(f=>f.folder==="Drives").length }
                  ].map((folder) => {
                    const isSelected = selectedFolder === folder.label;
                    
                    return (
                      <button
                        key={folder.label}
                        onClick={() => setSelectedFolder(folder.label)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl text-xs font-black uppercase transition-all relative overflow-hidden group border ${
                          isSelected 
                            ? 'bg-[#091b24]/40 border-cyan-500/25 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.03)]' 
                            : 'hover:bg-[#151a23]/35 hover:border-panelBorder/60 border-transparent text-gray-400'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 w-[2.5px] h-full bg-cyan-400 rounded-r shadow-[0_0_8px_#06b6d4]"></div>
                        )}
                        
                        <span className="flex items-center gap-2.5 relative z-10">
                          <span className={isSelected ? "text-cyan-400" : "text-gray-500 group-hover:text-cyan-450 transition-colors"}>
                            {folder.icon}
                          </span>
                          <span className={isSelected ? "text-white" : "group-hover:text-cyan-400 transition-colors"}>{folder.label}</span>
                        </span>
                        
                        <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-lg border relative z-10 transition-colors ${
                          isSelected 
                            ? 'bg-cyan-950/40 border-cyan-500/25 text-cyan-400 shadow-inner' 
                            : 'bg-black/35 border-panelBorder/40 text-gray-550'
                        }`}>{folder.count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'Chat' && (
              <div className="bg-panelBg border border-panelBorder rounded-xl p-5 flex flex-col h-full overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                <h2 className="text-xs font-bold text-gray-150 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400 animate-pulse" /> Chat Rooms
                </h2>
                
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar select-none">
                  {[
                    { label: "# ceo-office", detail: "Primary swarm directives", status: "idle", agent: "Orchestrator-Alpha" },
                    { label: "# architect-designs", detail: "System modules discussions", status: "idle", agent: "Architect-Bot" },
                    { label: "# dev-compiling", detail: "Active task output threads", status: "working", agent: "Code-Engine-v4" },
                    { label: "# qa-security", detail: "Compiler static audits checks", status: "idle", agent: "Shield-Auditor" }
                  ].map((channel) => {
                    const isSelected = activeChannel === channel.label;
                    const isActive = channel.status === "working";
                    
                    return (
                      <button
                        key={channel.label}
                        onClick={() => setActiveChannel(channel.label)}
                        className={`w-full flex flex-col p-3.5 rounded-xl text-left border relative overflow-hidden transition-all duration-300 group ${
                          isSelected 
                            ? 'bg-[#091b24]/40 border-cyan-500/25 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.03)]' 
                            : 'hover:bg-[#151a23]/35 hover:border-panelBorder/60 border-transparent text-gray-400'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 w-[2.5px] h-full bg-cyan-400 rounded-r shadow-[0_0_8px_#06b6d4]"></div>
                        )}
                        
                        <div className="flex items-center justify-between w-full relative z-10">
                          <span className={`text-[11px] font-black tracking-wider uppercase ${
                            isSelected ? 'text-white' : 'text-slate-300 group-hover:text-cyan-400 transition-colors'
                          }`}>{channel.label}</span>
                          
                          {/* Animated status beacon inside channel chip */}
                          <div className="flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isActive 
                                ? 'bg-neonCyan animate-pulse shadow-[0_0_5px_#06b6d4]' 
                                : isSelected 
                                ? 'bg-neonGreen/60' 
                                : 'bg-slate-600/40'
                            }`} />
                          </div>
                        </div>
                        
                        <span className="text-[9px] text-textMuted mt-1 truncate max-w-full font-medium leading-relaxed font-sans">{channel.detail}</span>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-panelBorder/20 text-[7.5px] font-mono text-gray-500">
                          <span>LISTENER:</span>
                          <span className={isSelected ? "text-cyan-400/80 font-bold" : "text-gray-400"}>{channel.agent}</span>
                        </div>
                      </button>
                    );
                  })}
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
                      {apiKey ? `nvx_sk_ep_${'*'.repeat(12)}${apiKey.slice(-4)}` : "MOCKED_DEFAULT_SECURE_VAULT_KEY"}
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
            <header className="flex justify-between items-center border-b border-panelBorder pb-5 mb-6 shrink-0">
              <div>
                <h1 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3.5 flex items-center gap-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-350 font-sans text-xl tracking-wide font-black">{companyName} Swarm Command Center</span>
                </h1>
                <div className="flex gap-4 items-center">
                  <div className="bg-[#050608]/40 border border-white/[0.03] rounded-full px-3.5 py-1.5 flex items-center gap-2">
                    <span className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-widest">Active Swarm Directive:</span>
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[280px]">
                      {goal}
                    </span>
                  </div>
                  <div className="bg-[#050608]/40 border border-white/[0.03] rounded-full px-3.5 py-1.5 flex items-center gap-2">
                    <span className="text-[9px] text-textMuted font-extrabold uppercase tracking-widest">Compute Budget Used:</span>
                    <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                      <i className="fa-solid fa-coins text-cyan-400 animate-pulse"></i> {budgetUsed.toLocaleString()} <span className="text-[9px] text-cyan-400 font-sans font-black">NVX</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* God mode switch */}
              <div className="flex items-center gap-3 bg-[#050608]/40 px-4 py-2 rounded-xl border border-panelBorder shrink-0 shadow-inner">
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">GOD MODE / AUTH</span>
                <button
                  type="button"
                  onClick={() => {
                    setGovernanceMode(!governanceMode);
                    addLocalLog(`[System] Governance Mode toggled ${!governanceMode ? 'ON' : 'OFF'}`);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-all duration-300 shadow-inner p-0.5 cursor-pointer ${
                    governanceMode ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md ${
                    governanceMode ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </header>

            {/* TAB CONTENTS RENDER SECTION */}
            
            {activeTab === 'Dashboard' && (
              <div className="flex-1 flex gap-5 overflow-hidden">
                
                {/* Left side: The Kanban board columns */}
                <div className="flex-1 flex gap-4 overflow-hidden">
                  
                  {/* To Do Column */}
                  <div className="w-[280px] flex-shrink-0 flex flex-col gap-3.5 h-full overflow-hidden bg-[#050608]/20 border border-white/[0.01] backdrop-blur-xl rounded-2xl p-3.5 shadow-lg shadow-black/10">
                    <div className="flex justify-between items-center px-1 shrink-0">
                      <h3 className="text-xs font-bold text-slate-350 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-500" /> To Do
                      </h3>
                      <span className="text-[9px] font-mono font-bold text-textMuted bg-[#050608] border border-panelBorder px-2.5 py-0.5 rounded-lg shadow-inner">
                        {tickets.filter(t => t.status === 'todo').length}
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar pb-2">
                      {tickets.filter(t => t.status === 'todo').map(ticket => (
                        <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} />
                      ))}
                    </div>
                  </div>

                  {/* In Progress Column */}
                  <div className="w-[280px] flex-shrink-0 flex flex-col gap-3.5 h-full overflow-hidden bg-[#050608]/20 border border-white/[0.01] backdrop-blur-xl rounded-2xl p-3.5 shadow-lg shadow-black/10">
                    <div className="flex justify-between items-center px-1 shrink-0">
                      <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-glow-cyan"></span>
                        </span>
                        In Progress
                      </h3>
                      <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 px-2.5 py-0.5 rounded-lg">
                        {tickets.filter(t => t.status === 'inprogress').length}
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar pb-2">
                      {tickets.filter(t => t.status === 'inprogress').map(ticket => (
                        <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} isActive />
                      ))}
                    </div>
                  </div>

                  {/* Completed Column */}
                  <div className="w-[280px] flex-shrink-0 flex flex-col gap-3.5 h-full overflow-hidden bg-[#050608]/20 border border-white/[0.01] backdrop-blur-xl rounded-2xl p-3.5 shadow-lg shadow-black/10">
                    <div className="flex justify-between items-center px-1 shrink-0">
                      <h3 className="text-xs font-bold text-neonGreen uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-neonGreen animate-pulse shadow-glow-success" /> Completed
                      </h3>
                      <span className="text-[9px] font-mono font-bold text-neonGreen bg-emerald-950/20 border border-neonGreen/20 px-2.5 py-0.5 rounded-lg">
                        {tickets.filter(t => t.status === 'done' || t.status === 'awaiting').length}
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar pb-2">
                      {tickets.filter(t => t.status === 'done' || t.status === 'awaiting').map(ticket => (
                        <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} isCompleted />
                      ))}
                    </div>
                  </div>

                </div>

                {/* Right side: Vertical Swarm Shell Operations streams */}
                <div className="w-[330px] flex-shrink-0 bg-[#050608]/80 border border-panelBorder rounded-2xl flex flex-col overflow-hidden shadow-2xl relative h-full">
                  <div className="flex justify-between items-center bg-[#090b11] px-4 py-3 border-b border-panelBorder shrink-0 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase text-cyan-400 tracking-widest font-mono flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Swarm Shell streams
                    </span>
                    <span className="text-[8px] font-mono text-neonGreen font-black tracking-widest uppercase flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-neonGreen animate-pulse shadow-[0_0_5px_#10b981]" /> STREAM_ACTIVE
                    </span>
                  </div>
                  
                  <div 
                    ref={logContainerRef}
                    className="flex-1 overflow-y-auto space-y-2 pr-2 pl-4 py-4 bg-[#050608]/30 font-mono text-[10px] text-gray-300 custom-scrollbar select-text leading-relaxed"
                  >
                    {logs.map((log, idx) => {
                      const isError = log.includes('[Error]');
                      const isCEO = log.includes('[CEO]');
                      const isSystem = log.includes('[System]');
                      const isBroker = log.includes('[Broker]');
                      
                      let time = "";
                      let msg = log;
                      const timeMatch = log.match(/^\[(.*?)\]/);
                      if (timeMatch) {
                        time = timeMatch[1];
                        msg = log.substring(timeMatch[0].length).trim();
                      }

                      return (
                        <div 
                          key={idx}
                          className={`flex items-start gap-2.5 py-0.5 border-l-2 border-transparent transition-all hover:bg-white/[0.01] ${
                            isError 
                              ? 'border-l-red-500/40 text-red-450' 
                              : isCEO 
                              ? 'border-l-cyan-500/40 text-cyan-300/90 font-medium'
                              : isSystem 
                              ? 'text-gray-400/80'
                              : isBroker
                              ? 'border-l-emerald-500/40 text-emerald-350'
                              : 'text-gray-400/80'
                          }`}
                        >
                          <span className="opacity-25 select-none text-[8px] font-mono font-black shrink-0 mt-0.5">{(idx+1).toString().padStart(3, '0')}</span>
                          {time && <span className="opacity-30 select-none text-[8.5px] font-mono shrink-0 mt-0.5">[{time}]</span>}
                          <span className="flex-1 select-text leading-relaxed font-semibold">
                            {msg.startsWith('[CEO]') ? (
                              <span className="bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none">CEO</span>
                            ) : msg.startsWith('[System]') ? (
                              <span className="bg-slate-950/40 border border-slate-700/20 text-slate-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none">System</span>
                            ) : msg.startsWith('[Error]') ? (
                              <span className="bg-red-950/40 border border-red-500/20 text-red-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none animate-pulse">Error</span>
                            ) : msg.startsWith('[Broker]') ? (
                              <span className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 text-[8px] font-extrabold uppercase px-1 py-0.5 rounded-md mr-1 select-none">Broker</span>
                            ) : null}
                            {msg.replace(/^\[(CEO|System|Error|Broker)\]\s*/, '')}
                          </span>
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
                  {agents.map((agent) => {
                    const metrics = getAgentMetrics(agent.id);
                    const systemPromptText = agent.id === 'agent_ceo' 
                      ? `You analyze goals: "${goal}", coordinate workers, and organize task backlogs using Nvmix API completions.`
                      : `You execute targeted Swarm development, architectures, or auditing tasks dispatches dynamically.`;
                    
                    return (
                      <div 
                        key={agent.id} 
                        className={`border rounded-2xl p-5 flex flex-col space-y-4 hover:border-cyan-500/35 transition-all duration-300 group relative overflow-hidden backdrop-blur-md ${
                          agent.status === 'working' 
                            ? 'bg-[#091b24]/40 border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.04)]' 
                            : 'bg-[#0e111a]/85 border-panelBorder shadow-lg'
                        }`}
                      >
                        {/* Glow ambient background detail */}
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none" />
                        
                        <div className="flex justify-between items-start gap-2 relative z-10">
                          <div className="flex items-center gap-3.5">
                            <div className={`w-11 h-11 rounded-xl bg-black/40 border border-panelBorder flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 shadow-inner ${
                              agent.status === 'working' ? 'border-cyan-500/30' : ''
                            }`}>
                              {getAgentIcon(agent.id, agent.avatar)}
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase text-white tracking-widest group-hover:text-cyan-400 transition-colors leading-tight">{agent.name}</h4>
                              <p className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mt-1.5 opacity-85">{agent.role}</p>
                            </div>
                          </div>

                          {/* pulsing badge */}
                          <div className="flex items-center gap-1.5 bg-black/45 px-2.5 py-1 rounded-full border border-panelBorder shrink-0 select-none shadow-sm">
                            <span className="relative flex h-1.5 w-1.5">
                              {agent.status === 'working' && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neonGreen opacity-75"></span>
                              )}
                              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${agent.status === 'working' ? 'bg-neonGreen shadow-[0_0_6px_#10b981]' : 'bg-slate-550'}`} />
                            </span>
                            <span className={`text-[8.5px] font-extrabold uppercase tracking-widest ${agent.status === 'working' ? 'text-neonGreen' : 'text-slate-405'}`}>{agent.status}</span>
                          </div>
                        </div>

                        {/* System Prompt Blueprint styled like a micro IDE panel */}
                        <div className="bg-[#050608]/75 border border-panelBorder/40 p-4 rounded-xl text-[10px] font-mono leading-relaxed shadow-inner relative group/panel border-l-2 border-l-cyan-500/30">
                          <div className="flex items-center justify-between border-b border-panelBorder/20 pb-2 mb-2 select-none text-[8.5px] font-black text-gray-500 uppercase tracking-wider font-sans">
                            <span className="text-[8.5px] font-bold text-cyan-400/90 tracking-widest">prompt_system_blueprint.py</span>
                            <span className="opacity-80">ReadOnly • UTF-8</span>
                          </div>
                          <div className="select-text overflow-y-auto max-h-[75px] custom-scrollbar text-slate-300 font-medium">
                            <span className="text-purple-400">class</span> <span className="text-cyan-400">{agent.name.replace(/-/g, '')}</span>:<br />
                            &nbsp;&nbsp;<span className="text-purple-400">def</span> <span className="text-blue-400">execute</span>(self):<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"""</span><br />
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-slate-350">{systemPromptText}</span><br />
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"""</span>
                          </div>
                        </div>

                        {/* Premium agent telemetry params */}
                        <div className="grid grid-cols-4 gap-2 pt-1 border-t border-panelBorder/20 text-[9px] font-mono relative z-10 select-none">
                          <div className="bg-black/20 p-2 rounded-lg border border-panelBorder/10 text-center">
                            <span className="text-gray-500 block text-[7.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Temp</span>
                            <span className="text-slate-300 font-extrabold">{metrics.temp}</span>
                          </div>
                          <div className="bg-black/20 p-2 rounded-lg border border-panelBorder/10 text-center">
                            <span className="text-gray-550 block text-[7.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Tokens</span>
                            <span className="text-cyan-400 font-extrabold">{metrics.tokens}</span>
                          </div>
                          <div className="bg-black/20 p-2 rounded-lg border border-panelBorder/10 text-center">
                            <span className="text-gray-550 block text-[7.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Success</span>
                            <span className="text-emerald-405 font-extrabold text-neonGreen">{metrics.successRate}</span>
                          </div>
                          <div className="bg-black/20 p-2 rounded-lg border border-panelBorder/10 text-center">
                            <span className="text-gray-550 block text-[7.5px] font-sans font-bold uppercase tracking-wider mb-0.5">Latency</span>
                            <span className="text-indigo-400 font-extrabold">{metrics.latency}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'Files' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                <div className="flex justify-between items-center shrink-0 border-b border-panelBorder/30 pb-4 select-none">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center">
                      <Folder className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider block leading-none">Knowledge base drives</h3>
                      <span className="text-[8px] text-textMuted uppercase font-mono tracking-widest mt-1 block">autonomous files & prompts vault</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="h-9 px-4.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 transition-all hover:scale-[1.01] active:scale-100 shadow-glow-cyan shrink-0 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-white" /> Upload Asset
                    </button>
                  </div>
                </div>

                {/* files grid list explorer */}
                <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-3.5 select-none">
                  {filteredFiles.length === 0 ? (
                    <div className="text-center py-20 text-textMuted text-xs font-bold uppercase tracking-wider">
                      No files matching filters
                    </div>
                  ) : (
                    filteredFiles.map((file, idx) => {
                      const isJson = file.name.endsWith('.json');
                      const isPdf = file.name.endsWith('.pdf');
                      const isCsv = file.name.endsWith('.csv');
                      
                      const fileIcon = isJson 
                        ? <FileCode className="w-5 h-5 text-cyan-400 animate-pulse" />
                        : isPdf 
                        ? <Layers className="w-5 h-5 text-rose-400 animate-pulse" />
                        : isCsv
                        ? <Database className="w-5 h-5 text-emerald-400" />
                        : <FileText className="w-5 h-5 text-indigo-400" />;
                        
                      const folderColorClass = file.folder === "Datasets"
                        ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400"
                        : file.folder === "Prompts"
                        ? "bg-purple-950/30 border-purple-500/20 text-purple-400"
                        : file.folder === "Blueprints"
                        ? "bg-cyan-950/30 border-cyan-500/20 text-cyan-400"
                        : "bg-indigo-950/30 border-indigo-500/20 text-indigo-400";
                        
                      return (
                        <div 
                          key={idx} 
                          className="bg-[#0e111a]/85 border border-panelBorder rounded-2xl p-4.5 flex items-center justify-between hover:border-cyan-500/25 hover:bg-[#151a23]/60 transition-all duration-300 group shadow-md"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 bg-black/40 border border-panelBorder rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-inner">
                              {fileIcon}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black uppercase text-white truncate max-w-sm group-hover:text-cyan-400 transition-colors select-text leading-tight">{file.name}</h4>
                              <p className="text-[8px] text-textMuted uppercase mt-1.5 font-mono font-medium tracking-wide">
                                {file.type} • {file.size} • Synced {file.date}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-[8px] font-black uppercase border px-2.5 py-0.5 rounded-lg shadow-inner ${folderColorClass}`}>
                              {file.folder}
                            </span>
                            
                            <button 
                              onClick={() => {
                                // Dynamic code preview contents for file
                                const codeContent = isJson 
                                  ? `{\n  "schema": "nvmix_edge_gateway_router",\n  "version": "1.0.4",\n  "active_failover": true,\n  "fallback_hosts": ["together.nvmix.com", "backup.gateway.ai"],\n  "retry_timeout_ms": 500\n}`
                                  : isCsv
                                  ? `Date,Tokens,ComputeCost,APIKeyUsed\n21-05-2026,1.4M,4200 NVX,nvx_sk_ep_***\n22-05-2026,890K,2800 NVX,nvx_sk_ep_***\n23-05-2026,2.1M,6400 NVX,nvx_sk_ep_***`
                                  : `// Direct System Document Asset: ${file.name}\n// Loaded into agent prompt context successfully.\n\ndef load_context():\n    return "Swarm company active configuration specifications."`;
                                setActiveCodePreview(codeContent);
                              }}
                              className="h-8 px-3.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 hover:bg-cyan-600/15 hover:border-cyan-500/40 text-cyan-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                            >
                              <i className="fa-solid fa-code"></i> Preview Source
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Chat' && (
              <div className="flex-1 flex flex-col overflow-hidden relative shadow-2xl">
                {/* Channel Header details with overlapping participant avatars */}
                <div className="flex items-center justify-between shrink-0 border-b border-panelBorder/30 pb-4 mb-4 select-none">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-center">
                      <MessageSquare className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-white uppercase tracking-wider block leading-none">{activeChannel}</span>
                      <span className="text-[8px] text-textMuted uppercase font-mono tracking-widest mt-1 block">active swarm communications room</span>
                    </div>
                  </div>
                  
                  {/* Overlapping active agent participants badges */}
                  <div className="flex items-center gap-3.5 bg-[#050608]/40 border border-panelBorder/40 rounded-full px-3.5 py-1.5 shadow-inner">
                    <span className="text-[7.5px] font-black uppercase text-gray-500 tracking-wider">Agents Listening:</span>
                    <div className="flex -space-x-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-900 border border-cyan-500/40 flex items-center justify-center shadow-md relative group/tooltip" title="Orchestrator-Alpha">
                        <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-neonGreen absolute -bottom-0.5 -right-0.5 border border-slate-900 animate-pulse"></span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-slate-900 border border-indigo-500/40 flex items-center justify-center shadow-md" title="Architect-Bot">
                        <Compass className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-slate-900 border border-emerald-500/40 flex items-center justify-center shadow-md" title="Code-Engine-v4">
                        <Code className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-slate-900 border border-amber-500/40 flex items-center justify-center shadow-md" title="Shield-Auditor">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* chat messages scroll container */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto space-y-5 pr-1.5 custom-scrollbar mb-4 bg-[#050608]/30 border border-panelBorder/40 rounded-2xl p-5 shadow-inner leading-relaxed"
                >
                  {chatMessages.map((msg) => {
                    const isMsgAgent = msg.isAgent;
                    const senderLower = msg.sender.toLowerCase();
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 max-w-[78%] group relative ${
                          isMsgAgent 
                            ? 'mr-auto text-left items-start' 
                            : 'ml-auto text-right items-start flex-row-reverse'
                        }`}
                      >
                        {/* Dynamic vector avatar badge alongside message bubble */}
                        <div className={`w-8 h-8 rounded-lg bg-black/45 border border-panelBorder/70 flex items-center justify-center shrink-0 shadow-sm ${
                          isMsgAgent ? 'border-cyan-500/20' : 'border-indigo-500/20'
                        }`}>
                          {isMsgAgent ? (
                            senderLower.includes('ceo') ? (
                              <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse" />
                            ) : senderLower.includes('architect') ? (
                              <Compass className="w-4 h-4 text-indigo-400" />
                            ) : senderLower.includes('code') || senderLower.includes('dev') ? (
                              <Code className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Cpu className="w-4 h-4 text-slate-400" />
                            )
                          ) : (
                            <UserCheck className="w-4 h-4 text-indigo-450" />
                          )}
                        </div>

                        <div className={`flex flex-col ${isMsgAgent ? '' : 'items-end'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black uppercase text-white tracking-widest leading-none flex items-center gap-1">
                              {msg.sender}
                              {isMsgAgent && (
                                <span className="bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 text-[6.5px] font-extrabold uppercase px-1 py-0.5 rounded tracking-wide leading-none select-none">AI Agent</span>
                              )}
                            </span>
                            <span className="text-[7.5px] text-textMuted font-mono font-medium">{msg.timestamp}</span>
                          </div>

                          <div className={`p-4 rounded-2xl text-xs leading-relaxed select-text font-sans font-medium border relative transition-all shadow-md ${
                            isMsgAgent 
                              ? 'bg-[#151a23]/60 border-panelBorder rounded-tl-none text-gray-250 hover:border-panelBorder/80' 
                              : 'bg-[#082f49]/40 border-cyan-500/20 rounded-tr-none text-white hover:border-cyan-500/30'
                          }`}>
                            {msg.text}

                            {/* code snippet preview if loaded */}
                            {msg.codeSnippet && (
                              <div className="mt-3.5 pt-3 border-t border-panelBorder/30">
                                <pre className="text-[9px] font-mono text-emerald-450 bg-black/60 p-3 rounded-lg overflow-x-auto select-text leading-relaxed border border-panelBorder/30">
                                  <code>{msg.codeSnippet}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Bouncing typing indicator when agent is heartbeating */}
                  {isHeartbeating && (
                    <div className="flex gap-3 items-center mr-auto text-left max-w-[70%] text-[10px] font-mono text-cyan-400/80 bg-cyan-950/10 border border-cyan-500/10 p-3.5 rounded-xl animate-pulse">
                      <BrainCircuit className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span>Orchestrator-Alpha is synthesizing next agent tick...</span>
                      <div className="flex gap-1 items-center pl-1.5">
                        <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-100" />
                        <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-200" />
                        <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-300" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Cohesive Floating ChatGPT-tier input control console */}
                <form 
                  onSubmit={handleSendPromptMessage} 
                  className="bg-[#050508]/85 border border-panelBorder/50 rounded-2xl p-2.5 flex items-center gap-3 shadow-2xl relative"
                >
                  {/* Upload asset attachment button */}
                  <button
                    type="button"
                    title="Attach Knowledge Asset File"
                    className="w-9 h-9 rounded-xl hover:bg-white/5 flex items-center justify-center text-gray-500 hover:text-cyan-400 transition-colors shrink-0 cursor-pointer border border-transparent hover:border-panelBorder/40"
                  >
                    <Upload className="w-4.5 h-4.5" />
                  </button>
                  
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={e => setTypedMessage(e.target.value)}
                    placeholder={`Direct Orchestrator Alpha in ${activeChannel}...`}
                    className="flex-1 bg-transparent border-none text-xs font-mono text-white outline-none placeholder:text-gray-600 px-1 py-2"
                  />
                  
                  {/* Active LLM Model indicator engine badge */}
                  <div className="bg-[#111827] border border-panelBorder/40 rounded-lg px-2.5 py-1 text-[8.5px] font-mono text-gray-500 shrink-0 select-none hidden md:flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    <span>Llama-3.1-70B</span>
                  </div>

                  <button
                    type="submit"
                    disabled={!typedMessage.trim()}
                    className="w-9 h-9 rounded-xl bg-[#082f49] hover:bg-[#0c4a6e] border border-cyan-500/25 text-cyan-300 flex items-center justify-center transition-all glow-cyan disabled:opacity-30 disabled:glow-none shrink-0 cursor-pointer hover:scale-[1.03] active:scale-100 shadow-md"
                  >
                    <Send className="w-4 h-4 text-cyan-300" />
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'Settings' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-widest font-sans border-b border-panelBorder/40 pb-3 shrink-0">System Configurations</h3>

                <div className="flex-1 overflow-y-auto space-y-6 pr-1.5 custom-scrollbar">
                  {/* Nvmix API Gateway Description Card */}
                  <div className="bg-[#0e111a]/85 border border-panelBorder rounded-2xl p-5 flex flex-col space-y-4 hover:border-cyan-500/35 transition-all duration-300 relative overflow-hidden backdrop-blur-md shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />
                    <div className="flex items-center gap-2 select-none">
                      <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">Nvmix API Gateway</label>
                    </div>
                    <div className="p-4 rounded-xl bg-cyan-950/10 border border-cyan-500/10 text-xs text-cyan-300 leading-relaxed font-sans select-none">
                      <p className="font-bold mb-1.5 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Zero Cost & Automated Orchestration</p>
                      The Nvmix API operates completely free of charge. The intelligent gateway dynamically evaluates, delegates, and chooses the optimal LLM system under the hood for each swarm directive. Manual compute budgeting or model selectors are not required.
                    </div>
                  </div>

                  {/* Company Profile Settings card */}
                  <div className="bg-[#0e111a]/85 border border-panelBorder rounded-2xl p-5 flex flex-col space-y-4 hover:border-cyan-500/35 transition-all duration-300 relative overflow-hidden backdrop-blur-md shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />
                    <div className="flex items-center gap-2 select-none">
                      <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">Company Profile & Swarm Directive</label>
                    </div>
                    <p className="text-[10px] text-textMuted leading-relaxed select-none">
                      Update the core branding and active objectives that govern the autonomous swarm.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Company Name</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={e => {
                            setCompanyName(e.target.value);
                            addLocalLog(`[System] Company Name updated to: ${e.target.value}`);
                          }}
                          className="w-full px-3 py-2 bg-black/40 border border-panelBorder rounded-xl text-xs font-mono text-white outline-none focus:border-cyan-500/40 shadow-inner"
                        />
                      </div>
                      
                      <div>
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Company Mission</label>
                        <input
                          type="text"
                          value={mission}
                          onChange={e => {
                            setMission(e.target.value);
                            addLocalLog(`[System] Core company mission updated.`);
                          }}
                          className="w-full px-3 py-2 bg-black/40 border border-panelBorder rounded-xl text-xs font-mono text-white outline-none focus:border-cyan-500/40 shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-1">Active Objective (Goal)</label>
                        <input
                          type="text"
                          value={goal}
                          onChange={e => {
                            setGoal(e.target.value);
                            addLocalLog(`[System] Active swarm objective updated.`);
                          }}
                          className="w-full px-3 py-2 bg-black/40 border border-panelBorder rounded-xl text-xs font-mono text-white outline-none focus:border-cyan-500/40 shadow-inner"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Swarm Governance & Autonomy settings */}
                  <div className="bg-[#0e111a]/85 border border-panelBorder rounded-2xl p-5 flex flex-col space-y-4 hover:border-cyan-500/35 transition-all duration-300 relative overflow-hidden backdrop-blur-md shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />
                    <div className="flex items-center gap-2 select-none">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">Governance & Autonomy Mode</label>
                    </div>
                    <p className="text-[10px] text-textMuted leading-relaxed select-none">
                      Adjust the balance of power between founder approvals and autonomous multi-agent execution.
                    </p>
                    
                    <div className="space-y-4">
                      {/* Governance toggle */}
                      <div className="flex items-center justify-between p-3 bg-black/30 border border-panelBorder/40 rounded-xl">
                        <div>
                          <span className="text-[10px] font-bold text-white block uppercase tracking-wider font-sans">Autonomous Governance (God Mode)</span>
                          <span className="text-[8px] text-textMuted uppercase tracking-wider block mt-0.5 font-sans">Allow agents to auto-deploy code assets without confirmation</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setGovernanceMode(!governanceMode);
                            addLocalLog(`[System] Governance Mode toggled ${!governanceMode ? 'ON' : 'OFF'}`);
                          }}
                          className={`w-9 h-5 rounded-full relative transition-all duration-300 shadow-inner p-0.5 cursor-pointer shrink-0 ${
                            governanceMode ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-slate-800'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md ${
                            governanceMode ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Telemetry log toggle */}
                      <div className="flex items-center justify-between p-3 bg-black/30 border border-panelBorder/40 rounded-xl">
                        <div>
                          <span className="text-[10px] font-bold text-white block uppercase tracking-wider font-sans">Live Agent Telemetry Stream</span>
                          <span className="text-[8px] text-textMuted uppercase tracking-wider block mt-0.5 font-sans">Stream heartbeat diagnostic logs into the command timeline</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsHeartbeating(!isHeartbeating);
                            addLocalLog(`[System] Live telemetry stream ${!isHeartbeating ? 'ENABLED' : 'DISABLED'}`);
                          }}
                          className={`w-9 h-5 rounded-full relative transition-all duration-300 shadow-inner p-0.5 cursor-pointer shrink-0 ${
                            isHeartbeating ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-slate-800'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md ${
                            isHeartbeating ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Local API Key Settings fields */}
                  <div className="bg-[#0e111a]/85 border border-panelBorder rounded-2xl p-5 flex flex-col space-y-4 hover:border-cyan-500/35 transition-all duration-300 relative overflow-hidden backdrop-blur-md shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />
                    <div className="flex items-center gap-2 select-none">
                      <Key className="w-4 h-4 text-cyan-400" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">Update API Handshake Keys</label>
                    </div>
                    <p className="text-[10px] text-textMuted leading-relaxed select-none">
                      Broker direct completions streams to primary gateways using customized secure vault credentials.
                    </p>
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        placeholder="nvx_sk_ep_xxxxxxxxxxxx"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="w-full pl-4 pr-24 py-3 bg-black/40 border border-panelBorder rounded-xl text-xs font-mono text-white outline-none focus:border-cyan-500/40 shadow-inner"
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#082f49] hover:bg-[#0c4a6e] border border-cyan-500/20 text-cyan-400 flex items-center justify-center transition-colors shadow-md"
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
    ? 'border-panelBorder/30 bg-[#0e111a]/40 opacity-75' 
    : isActive 
    ? 'bg-[#0c1f24] border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.06)]' 
    : 'bg-[#0e111a]/85 border-white/[0.03] shadow-lg';

  const titleClass = isCompleted 
    ? 'text-gray-400 font-bold line-through' 
    : 'text-white font-extrabold tracking-wide';

  return (
    <motion.div
      layoutId={ticket.id}
      transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      className={`border rounded-2xl p-5 flex flex-col space-y-4 text-left hover:border-cyan-500/20 transition-all ${borderClass}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6.5 h-6.5 rounded-lg bg-[#050608] border border-panelBorder/60 flex items-center justify-center text-xs shrink-0 select-none shadow-inner">
            {agent?.avatar || '🤖'}
          </div>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest truncate max-w-[120px]">
            {agent?.name || 'AI Specialist'}
          </span>
        </div>
        
        {isActive && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
          </span>
        )}
      </div>

      <h4 className={`text-xs uppercase tracking-wide leading-tight ${titleClass}`}>
        {ticket.title}
      </h4>
      <p className="text-[10px] text-textMuted leading-relaxed select-text font-medium">
        {ticket.description}
      </p>

      {/* Embedded monospaced Thought Snippet logs */}
      <div className="bg-[#050608]/50 border border-panelBorder/30 p-3 rounded-xl text-[10px] font-mono text-slate-350 leading-relaxed shadow-inner border-l-2 border-l-cyan-500/40 relative">
        <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest block mb-1">Active Reasoning</span>
        <div className="select-text overflow-y-auto max-h-[70px] custom-scrollbar font-medium">
          {ticket.thought}
        </div>
      </div>

      {isActive && (
        <div className="pt-1 shrink-0">
          <div className="w-full bg-[#082f49]/40 rounded-full h-1.5 mb-1.5 overflow-hidden border border-cyan-500/10">
            <div className="bg-cyan-500 h-full rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.4)]" style={{ width: '65%' }}></div>
          </div>
          <span className="text-[9.5px] text-cyan-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping mr-0.5" /> 65% Compiling...
          </span>
        </div>
      )}

      {isCompleted && (
        <div className="w-full bg-slate-950 rounded-full h-1.5 mt-1 shrink-0 border border-white/[0.01]">
          <div className="bg-emerald-500 h-full rounded-full shadow-[0_0_6px_rgba(16,185,129,0.3)]" style={{ width: '100%' }}></div>
        </div>
      )}

      {hasOutput && (
        <div className="pt-2 border-t border-panelBorder/40 flex justify-end shrink-0">
          <button
            onClick={() => onCodePreview(ticket.output!)}
            className="h-7 px-3.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 hover:bg-cyan-600/15 hover:border-cyan-500/40 text-cyan-400 text-[8.5px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <i className="fa-solid fa-code"></i> Output Code
          </button>
        </div>
      )}

    </motion.div>
  );
}
