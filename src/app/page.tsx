"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Briefcase, FileSignature, ArrowRight, RefreshCw, LayoutDashboard,
  Users, Folder, MessageSquare, Settings, Play, Pause, ChevronRight, Plus,
  Send, Upload, Eye, EyeOff, Save, X, HardDrive, CheckCircle2, AlertCircle,
  HelpCircle, ShieldCheck, Activity, Terminal, Code
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
  const [activeTab, setActiveTab] = useState<'Overview' | 'Team' | 'Files' | 'Chat' | 'Settings'>('Overview');

  // ─── Swarm State ───
  const [companyName, setCompanyName] = useState("");
  const [mission, setMission] = useState("");
  const [goal, setGoal] = useState("");
  const [apiKey, setApiKey] = useState("mock_sk_ep_nemix_credentials_local");
  const [showKey, setShowKey] = useState(false);
  
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [budgetUsed, setBudgetUsed] = useState(4200);
  const [budgetLimit, setBudgetLimit] = useState(100000);
  const [governanceMode, setGovernanceMode] = useState(true);
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Model Settings
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
  const [newAgentAvatar, setNewAgentAvatar] = useState("🤖");

  // Chat Section State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [activeChannel, setActiveChannel] = useState("Alex (Lead Developer)");

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

  // Load active state from backend on mount
  useEffect(() => {
    const saved = localStorage.getItem('nemix_agent_key');
    if (saved) setApiKey(saved);

    const loadState = async () => {
      try {
        const response = await fetch('/api/orchestrator');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.state && data.state.agents.length > 0) {
            setCompanyName(data.state.companyName || "My Startup Corp");
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
                sender: 'Orchestrator (CEO)',
                text: `Welcome to the main workspace! I've loaded your project "${data.state.companyName || 'My Startup'}" and successfully deployed your custom team of AI specialists. They are standing by and ready to help!`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isAgent: true
              }
            ]);
          }
        }
      } catch (e: any) {
        addLocalLog(`[System] Session restore failed: ${e.message}`);
      }
    };
    loadState();
  }, []);

  const saveKey = () => {
    localStorage.setItem('nemix_agent_key', apiKey.trim());
    addLocalLog('[System] Gateway key credentials safely cached in your secure settings.');
  };

  const addLocalLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // ─── Initialize Swarm ───
  const handleStartCompany = async () => {
    if (!companyName.trim() || !goal.trim()) return;

    setIsInitializing(true);
    addLocalLog('[System] Initiating workspace setup and hiring your digital AI team...');

    const calculatedMission = `Create a beautiful, fully functional platform for "${companyName}" designed to satisfy the core objective: "${goal}".`;

    try {
      const response = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'onboard',
          companyName: companyName.trim(),
          goal: goal.trim(),
          apiKey: apiKey.trim(),
          mission: calculatedMission
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
        setMission(calculatedMission);
        setInitialized(true);
        setIsInitializing(false);
        setActiveTab('Overview');
        
        // Seed chat messages
        setChatMessages([
          {
            id: '1',
            sender: 'Orchestrator (CEO)',
            text: `Hi there! I've successfully assembled your new digital product team for "${companyName}". We have generated 3 master project tasks on your Task Board to get started. How should we proceed?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAgent: true
          }
        ]);

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#ffffff']
        });
      }, 1500);

    } catch (e: any) {
      setIsInitializing(false);
      addLocalLog(`[Error] Workspace setup failed: ${e?.message || 'Gateway Timeout'}`);
    }
  };

  // ─── Initialize Swarm in Demo Mode ───
  const handleDemoMode = async () => {
    setIsInitializing(true);
    addLocalLog('[System] Launching pre-configured demo project sandbox...');
    
    const demoCompany = "ZenExpense Tracker";
    const demoGoal = "Create a gorgeous automated expense manager app for freelance designers and independent developers.";
    const demoMission = "Build a beautiful automated expense manager app for freelance designers and independent developers.";
    
    setCompanyName(demoCompany);
    setGoal(demoGoal);
    setMission(demoMission);

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
        setActiveTab('Overview');

        // Seed chat messages
        setChatMessages([
          {
            id: '1',
            sender: 'Orchestrator (CEO)',
            text: `Welcome to the ZenExpense Tracker project workspace! I've hired a custom developer, a security auditor, and an architect. Check out the Tasks Board to see what we are currently building!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAgent: true
          }
        ]);
        
        confetti({
          particleCount: 120,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#10b981', '#38bdf8']
        });
        addLocalLog('[System] Demo project sandbox successfully loaded!');
      }, 1000);

    } catch (e: any) {
      setIsInitializing(false);
      addLocalLog(`[Error] Demo sandbox failed: ${e?.message}`);
    }
  };

  // ─── Trigger Heartbeat Tick ───
  const triggerHeartbeat = async () => {
    if (isHeartbeating) return;
    
    const awaitingTicket = tickets.find(t => t.status === 'awaiting');
    if (awaitingTicket && governanceMode) {
      setActiveApprovalTicket(awaitingTicket);
      setIsAutoTicking(false);
      addLocalLog('[System] Simulation paused: awaiting your approval to merge new code.');
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
        throw new Error('Task execution tick failed');
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
          particleCount: 100,
          spread: 80,
          colors: ['#10b981', '#6366f1', '#ffffff']
        });
        setIsAutoTicking(false);
      }

    } catch (e: any) {
      addLocalLog(`[Error] Task execution error: ${e?.message}`);
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
        throw new Error('Decision registration failed');
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
        addLocalLog(`[CEO] Approved new module: "${ticket.title}". Deployed successfully!`);
      } else {
        addLocalLog(`[CEO] Rejected module: "${ticket.title}". Task returned to backlog for refinements.`);
      }

    } catch (e: any) {
      addLocalLog(`[Error] Board approval failed: ${e?.message}`);
    }
  };

  // ─── Hire Custom Worker Agent ───
  const handleHireAgent = () => {
    if (!newAgentName.trim() || !newAgentRole.trim()) return;

    const newAgent: Agent = {
      id: `agent_${Math.random().toString(36).substring(2, 9)}`,
      role: newAgentRole,
      name: newAgentName,
      avatar: newAgentAvatar,
      status: 'sleeping'
    };

    setAgents(prev => [...prev, newAgent]);
    addLocalLog(`[CEO] Team expanded! Welcomed "${newAgentName}" as your new "${newAgentRole}".`);
    
    setIsHireModalOpen(false);
    setNewAgentName("");
    setNewAgentRole("");
    setNewAgentAvatar("🤖");
  };

  // ─── Swarm Chat Prompt Submissions ───
  const handleSendPromptMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'You (Owner)',
      text: typedMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAgent: false
    };

    setChatMessages(prev => [...prev, userMsg]);
    const prompt = typedMessage.trim().toLowerCase();
    setTypedMessage("");

    // Simulate CEO processing/response based on prompt goal
    setTimeout(() => {
      let responseText = `Received your message! I've coordinated with your team, and we are working on aligning our development roadmap to fit: "${typedMessage}". Let me know if you would like me to trigger the next tasks!`;
      let code = "";

      if (prompt.includes('status') || prompt.includes('update')) {
        const completed = tickets.filter(t => t.status === 'done').length;
        const total = tickets.length;
        responseText = `Here is our current progress: We have completed ${completed} out of ${total} tasks on your Task Board. Your digital team is currently active and waiting for your next instructions!`;
      } else if (prompt.includes('code') || prompt.includes('delivery') || prompt.includes('file')) {
        responseText = `Perfect, here is the architectural blueprint for your project routing systems:`;
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
      } else if (prompt.includes('hire') || prompt.includes('add')) {
        responseText = `If you want to expand your digital team, click the "Hire AI Specialist" button inside the "My AI Team" directory. We can instantly onboard new experts!`;
      }

      const agentMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'Orchestrator (CEO)',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAgent: true,
        codeSnippet: code || undefined
      };

      setChatMessages(prev => [...prev, agentMsg]);
    }, 1000);
  };

  // Mock uploaded files knowledge database
  const knowledgeFiles = [
    { name: "project_scope_brief.md", size: "2.4 KB", type: "Doc", date: "24-05-2026", folder: "Drives" },
    { name: "system_design_fallback.pdf", size: "1.8 MB", type: "PDF", date: "22-05-2026", folder: "Drives" },
    { name: "edge_router_blueprints.json", size: "482 Bytes", type: "Config", date: "23-05-2026", folder: "Blueprints" },
    { name: "model_integration_guidelines.md", size: "5.1 KB", type: "Doc", date: "24-05-2026", folder: "Prompts" },
    { name: "startup_unit_economics.csv", size: "14.2 KB", type: "Dataset", date: "21-05-2026", folder: "Datasets" }
  ];

  const filteredFiles = knowledgeFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === "All Drives" || file.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="bg-[#0f172a] text-slate-100 h-screen flex overflow-hidden selection:bg-indigo-500/20 selection:text-indigo-300 font-sans antialiased">
      
      {/* ======================================================== */}
      {/* FRICTIONLESS ONBOARDING VIEW (`!initialized` state)     */}
      {/* ======================================================== */}
      {!initialized ? (
        <div className="flex-1 flex items-center justify-center p-6 relative z-10 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b]/20 to-[#0f172a]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none" />
          
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-2xl rounded-3xl p-10 max-w-lg w-full text-center space-y-8 shadow-2xl relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/10 border border-indigo-400/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">Let's build your dream team.</h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
                Tell us about your project, and we'll instantly deploy a custom team of AI specialists to build it for you.
              </p>
            </div>

            <div className="space-y-5 text-left pt-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Project Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Briefcase className="w-4.5 h-4.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. ZenExpense Tracker"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950/40 border border-slate-800 rounded-xl text-sm font-sans text-white outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 shadow-inner font-medium transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">What does this company do?</label>
                <div className="relative">
                  <div className="absolute left-4 top-4 text-slate-500">
                    <FileSignature className="w-4.5 h-4.5 text-slate-400" />
                  </div>
                  <textarea
                    value={goal}
                    onChange={e => setGoal(e.target.value)}
                    rows={4}
                    placeholder="e.g. We build a beautiful automated billing and expense tracking app for freelancers, complete with custom analytics and PDF generation."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-950/40 border border-slate-800 rounded-xl text-sm font-sans text-white outline-none focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20 shadow-inner resize-none font-medium leading-relaxed transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3.5 pt-3">
              <button
                onClick={handleStartCompany}
                disabled={isInitializing || !companyName.trim() || !goal.trim()}
                className="w-full py-4 rounded-xl btn-primary justify-center text-sm font-bold shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInitializing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    Hiring My AI Team...
                  </>
                ) : (
                  <>
                    Hire My AI Team
                    <ArrowRight className="w-4.5 h-4.5 text-white ml-0.5 animate-pulse" />
                  </>
                )}
              </button>
              
              <button
                onClick={handleDemoMode}
                disabled={isInitializing}
                className="w-full py-3 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 text-slate-300 text-xs font-bold tracking-wider transition-all uppercase cursor-pointer"
              >
                Try With Mock Demo Project
              </button>
            </div>
          </div>
        </div>
      ) : (
        
        // ========================================================
        // MAIN WORKSPACE LAYOUT (3 Panels, B2B SaaS Style)
        // ========================================================
        <div className="flex-1 flex overflow-hidden">
          
          {/* ─── PANEL 1: LEFT NAVIGATION SIDEBAR ─── */}
          <nav className="w-64 flex-shrink-0 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between py-6 z-30 relative shadow-2xl">
            <div className="space-y-8">
              {/* Brand Header */}
              <div className="px-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/10 border border-indigo-400/20">
                  <Sparkles className="w-4.5 h-4.5 text-white animate-pulse" />
                </div>
                <div>
                  <h1 className="text-sm font-extrabold tracking-tight text-white leading-none">Nemix</h1>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5 block">Orchestrator</span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="px-3 space-y-1">
                {[
                  { id: 'Overview', label: 'Overview', icon: LayoutDashboard },
                  { id: 'Team', label: 'My AI Team', icon: Users },
                  { id: 'Files', label: 'Files', icon: Folder },
                  { id: 'Chat', label: 'Chat', icon: MessageSquare },
                  { id: 'Settings', label: 'Settings', icon: Settings },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative ${
                        isActive
                          ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/4 h-1/2 w-1 rounded-full bg-indigo-500" />
                      )}
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="px-4 space-y-4">
              {/* Founder Profile */}
              <div className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-2xl border border-slate-800/40">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                  SC
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">Sarah Chen</h4>
                  <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider block">Founder</span>
                </div>
              </div>

              {/* Reset board button */}
              <button
                onClick={() => {
                  setInitialized(false);
                  setAgents([]);
                  setTickets([]);
                  setLogs([]);
                  setCompanyName("");
                  setGoal("");
                  setMission("");
                  addLocalLog('[System] Swarm company reset.');
                }}
                className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-red-950/10 text-slate-400 hover:text-red-400 text-xs font-bold transition-all uppercase flex items-center justify-center gap-2 cursor-pointer"
                title="Reset Workspace"
              >
                <X className="w-3.5 h-3.5" />
                Reset Project
              </button>
            </div>
          </nav>

          {/* ─── PANEL 2: CONTEXTUAL SIDEBAR (Middle) ─── */}
          <aside className="w-80 flex-shrink-0 bg-slate-900/30 border-r border-slate-800/80 flex flex-col justify-between p-5 z-20 relative h-full">
            
            {/* Overview / Board Sidebar Content */}
            {activeTab === 'Overview' && (
              <div className="flex flex-col flex-1 overflow-hidden space-y-5">
                {/* Mission Scope details */}
                <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4.5 flex flex-col flex-1 overflow-hidden">
                  <div className="flex items-center gap-2 mb-3.5 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    </div>
                    <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Project Mission</h2>
                  </div>
                  
                  <div className="flex-1 bg-slate-950/50 border border-slate-800/50 rounded-xl p-4.5 overflow-y-auto custom-scrollbar shadow-inner leading-relaxed text-xs text-slate-300 space-y-4">
                    <div>
                      <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest block mb-1">Company Goal</span>
                      <p className="text-white font-medium select-text">{companyName || "Dream Team App"}</p>
                    </div>
                    
                    <div className="border-t border-slate-800/50 pt-3">
                      <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest block mb-1">Product Description</span>
                      <p className="text-white font-medium select-text leading-relaxed">{goal}</p>
                    </div>
                  </div>
                  
                  {/* Heartbeat controls */}
                  <div className="grid grid-cols-2 gap-2.5 shrink-0 pt-3">
                    <button
                      onClick={triggerHeartbeat}
                      disabled={isHeartbeating || isAutoTicking}
                      className="h-10 rounded-xl border border-indigo-500/20 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 text-[10px] font-bold tracking-widest uppercase transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Step Task
                    </button>
                    <button
                      onClick={() => {
                        setIsAutoTicking(!isAutoTicking);
                        addLocalLog(`[System] Auto-drive execution ${!isAutoTicking ? 'STARTED' : 'PAUSED'}.`);
                      }}
                      className={`h-10 rounded-xl border text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isAutoTicking 
                          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750' 
                          : 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/30'
                      }`}
                    >
                      {isAutoTicking ? (
                        <>Pause Drive</>
                      ) : (
                        <>Auto Drive</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Approvals Baner in Sidebar fallback */}
                <div className="bg-slate-900/50 border border-slate-800/60 rounded-2xl p-4.5 shrink-0 space-y-3">
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest">God-Mode Approvals</h2>
                  {activeApprovalTicket && governanceMode ? (
                    <div className="border border-amber-600/20 bg-amber-500/5 rounded-xl p-4 relative overflow-hidden shadow-md">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                      <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">Action Required</h3>
                      <p className="text-xs text-slate-250 leading-relaxed font-medium">
                        Your AI Lead Developer completed code for: <span className="text-white font-bold block mt-0.5">{activeApprovalTicket.title}</span>
                      </p>
                      
                      <div className="flex gap-2 mt-4 shrink-0">
                        <button
                          onClick={() => handleBoardApproval('approved')}
                          className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleBoardApproval('rejected')}
                          className="flex-1 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-slate-800/60 bg-slate-950/20 rounded-xl p-4 text-center text-xs text-slate-500 py-6 font-bold uppercase tracking-wider">
                      No reviews pending
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Team Directory list view */}
            {activeTab === 'Team' && (
              <div className="flex flex-col flex-1 overflow-hidden space-y-4">
                <div className="flex items-center gap-2 mb-2 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-950/40 border border-indigo-500/25 flex items-center justify-center">
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Team Directory</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {agents.map((agent) => (
                    <div key={agent.id} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between hover:border-indigo-500/20 transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800/60 flex items-center justify-center text-lg shrink-0 select-none">
                          {agent.avatar}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-extrabold text-white truncate">{agent.name}</h4>
                          <p className="text-[10px] text-indigo-400 font-bold uppercase mt-0.5 truncate">{agent.role.split(' ')[0]}</p>
                        </div>
                      </div>
                      
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        agent.status === 'working' 
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 animate-pulse' 
                          : 'bg-slate-850 border-slate-800 text-slate-500'
                      }`}>
                        {agent.status === 'working' ? "Working" : "Idle"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-800/50 shrink-0">
                  <button
                    onClick={() => setIsHireModalOpen(true)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
                  >
                    <Plus className="w-4 h-4 text-white" /> Hire AI Specialist
                  </button>
                </div>
              </div>
            )}

            {/* Knowledge Vault Sidebar list view */}
            {activeTab === 'Files' && (
              <div className="flex flex-col flex-1 overflow-hidden space-y-4">
                <div className="flex items-center gap-2 mb-2 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-950/40 border border-indigo-500/25 flex items-center justify-center">
                    <Folder className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Files Vault</h2>
                </div>
                
                <div className="relative mb-2 shrink-0">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search files..."
                    className="w-full py-2.5 pl-9 pr-4 bg-slate-950/40 border border-slate-800 rounded-xl text-xs font-sans text-slate-300 outline-none focus:border-indigo-500/40"
                  />
                  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]"></i>
                </div>

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
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold uppercase transition-all border ${
                        selectedFolder === folder.label 
                          ? 'bg-indigo-600/10 border-indigo-500/25 text-indigo-400 font-extrabold' 
                          : 'hover:bg-slate-900/40 border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <i className={`fa-solid ${folder.icon} text-sm ${selectedFolder === folder.label ? 'text-indigo-400' : 'text-slate-500'}`}></i>
                        {folder.label}
                      </span>
                      <span className="text-[10px] font-mono opacity-60 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">{folder.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Channels tab list view */}
            {activeTab === 'Chat' && (
              <div className="flex flex-col flex-1 overflow-hidden space-y-4">
                <div className="flex items-center gap-2 mb-2 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-950/40 border border-indigo-500/25 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest">AI Channels</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {[
                    { label: "Alex (Lead Developer)", detail: "Code and deployment discussions" },
                    { label: "Sarah (QA Auditor)", detail: "Security audits and checks reviews" },
                    { label: "Orchestrator (Swarm CEO)", detail: "Master goal planning strategies" }
                  ].map((channel) => (
                    <button
                      key={channel.label}
                      onClick={() => setActiveChannel(channel.label)}
                      className={`w-full flex flex-col p-3 rounded-xl text-left transition-all border ${
                        activeChannel === channel.label 
                          ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400 font-extrabold' 
                          : 'hover:bg-slate-900/40 border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold text-white uppercase tracking-wider">{channel.label.split(' ')[0]} channel</span>
                      <span className="text-[10px] text-slate-500 mt-1 truncate max-w-full font-medium leading-none">{channel.detail}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Configuration Settings tab sidebar details */}
            {activeTab === 'Settings' && (
              <div className="flex flex-col flex-1 overflow-hidden space-y-4">
                <div className="flex items-center gap-2 mb-2 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-950/40 border border-indigo-500/25 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Settings Overview</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar text-xs">
                  <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-4.5 space-y-2 relative shadow-inner">
                    <span className="text-[9px] font-extrabold uppercase text-indigo-400 tracking-widest block leading-none">Security Key</span>
                    <p className="text-[10px] font-mono text-slate-400 truncate">
                      {apiKey ? `sk_ep_${'*'.repeat(12)}${apiKey.slice(-4)}` : "SECURED_LOCAL_GATEWAY_CREDENTIALS"}
                    </p>
                  </div>

                  <div className="bg-slate-950/30 border border-slate-800 rounded-2xl p-4.5 space-y-2 relative shadow-inner">
                    <span className="text-[9px] font-extrabold uppercase text-indigo-400 tracking-widest block leading-none">AI Intelligence Engine</span>
                    <p className="text-[11px] font-bold text-white uppercase flex items-center gap-1.5">
                      <i className="fa-solid fa-atom text-indigo-400 mr-1 animate-pulse"></i> Llama 3.1 70B
                    </p>
                  </div>
                </div>
              </div>
            )}

          </aside>

          {/* ─── PANEL 3: MAIN CONTENT WORKSPACE ─── */}
          <main className="flex-1 flex flex-col bg-slate-900/40 p-6 overflow-hidden z-10 relative">
            
            {/* Overview / Task Board Content */}
            {activeTab === 'Overview' && (
              <div className="flex-1 flex flex-col overflow-hidden gap-5">
                
                {/* Approvals banner if active */}
                <AnimatePresence>
                  {activeApprovalTicket && governanceMode && (
                    <motion.div
                      initial={{ opacity: 0, y: -15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-5 flex items-center justify-between shadow-xl shrink-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Action Required: Approve launch?</h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {agents.find(a=>a.id===activeApprovalTicket.assignedTo)?.name || "Lead Developer"} has completed task: <span className="font-bold text-white uppercase select-all">"{activeApprovalTicket.title}"</span>. Approving will merge the code.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleBoardApproval('approved')}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                          Approve Merge
                        </button>
                        <button
                          onClick={() => handleBoardApproval('rejected')}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Send Back
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex justify-between items-center px-1 shrink-0">
                  <div>
                    <h3 className="text-lg font-extrabold text-white font-sans flex items-center gap-2.5">
                      Task Board
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Track real-time progress of your AI team's deliverables.</p>
                  </div>
                  
                  {/* Simulate heartbeats in overview */}
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-2 bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-800">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 shadow-glow-primary"></span>
                    </span>
                    Live Loop Tick Active
                  </span>
                </div>

                {/* Soft-slate Linear-inspired Kanban Board */}
                <div className="flex-1 flex gap-5 overflow-hidden">
                  
                  {/* To Do Backlog Column */}
                  <div className="w-[300px] flex-shrink-0 flex flex-col gap-3.5 h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-1 px-1 shrink-0">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Backlog
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                        {tickets.filter(t => t.status === 'todo').length}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar pb-6">
                      {tickets.filter(t => t.status === 'todo').map(ticket => (
                        <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} />
                      ))}
                    </div>
                  </div>

                  {/* Active Progress Column */}
                  <div className="w-[300px] flex-shrink-0 flex flex-col gap-3.5 h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-1 px-1 shrink-0">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400"></span>
                        </span>
                        Active Work
                      </span>
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-950/20 px-2 py-0.5 rounded-lg border border-indigo-500/10">
                        {tickets.filter(t => t.status === 'inprogress').length}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar pb-6">
                      {tickets.filter(t => t.status === 'inprogress').map(ticket => (
                        <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} isActive />
                      ))}
                    </div>
                  </div>

                  {/* Completed Column */}
                  <div className="w-[300px] flex-shrink-0 flex flex-col gap-3.5 h-full overflow-hidden">
                    <div className="flex justify-between items-center mb-1 px-1 shrink-0">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Completed
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded-lg border border-emerald-500/10">
                        {tickets.filter(t => t.status === 'done' || t.status === 'awaiting').length}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar pb-6">
                      {tickets.filter(t => t.status === 'done' || t.status === 'awaiting').map(ticket => (
                        <KanbanCard key={ticket.id} ticket={ticket} agents={agents} onCodePreview={setActiveCodePreview} isCompleted />
                      ))}
                    </div>
                  </div>

                </div>

                {/* SaaS Activity Feed Timeline (Bottom) */}
                <div className="h-44 bg-slate-950/30 border border-slate-800/80 rounded-2xl p-4 flex flex-col shrink-0 overflow-hidden shadow-inner relative z-10">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 shrink-0">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-400" /> Real-time Activity Feed
                    </span>
                    <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Roster Stream Active
                    </span>
                  </div>
                  
                  <div 
                    ref={logContainerRef}
                    className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-sans text-xs text-slate-350 custom-scrollbar select-text leading-relaxed"
                  >
                    {logs.map((log, idx) => {
                      const isError = log.includes('[Error]');
                      const isCEO = log.includes('[CEO]');
                      const isSystem = log.includes('[System]');
                      const isBroker = log.includes('[Broker]');
                      return (
                        <div 
                          key={idx}
                          className={`p-2 rounded-xl flex items-start gap-2.5 border border-transparent transition-all ${
                            isError 
                              ? 'bg-rose-500/5 text-rose-400' 
                              : isCEO 
                              ? 'bg-indigo-500/5 text-indigo-300 font-medium'
                              : isSystem 
                              ? 'text-slate-400'
                              : isBroker
                              ? 'bg-emerald-500/5 text-emerald-400 font-medium'
                              : 'text-slate-400'
                          }`}
                        >
                          <span className="text-[9px] text-slate-600 font-mono font-bold shrink-0 mt-0.5">{(idx+1).toString().padStart(3, '0')}</span>
                          <span className="flex-1 select-text">{log}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Team Directory active grid list view */}
            {activeTab === 'Team' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-5">
                <div className="flex justify-between items-center shrink-0 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-white font-sans flex items-center gap-2">
                      Active AI Workforce
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Direct and view your team of highly specialized AI builders.</p>
                  </div>
                  <button
                    onClick={() => setIsHireModalOpen(true)}
                    className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10"
                  >
                    <Plus className="w-4 h-4 text-white" /> Hire Specialist
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-1.5 custom-scrollbar pb-6">
                  {agents.map((agent) => (
                    <div key={agent.id} className="border border-slate-800/80 bg-slate-900/20 hover:border-indigo-500/20 rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg transition-all group">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 bg-slate-950 border border-slate-800/60 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:bg-slate-900 transition-colors">
                            {agent.avatar}
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold text-white truncate group-hover:text-indigo-400 transition-all">{agent.name}</h4>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">{agent.role}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-950/40 px-3 py-1 rounded-full border border-slate-800 shrink-0 select-none">
                          <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'working' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${agent.status === 'working' ? 'text-emerald-400 font-extrabold' : 'text-slate-500'}`}>{agent.status}</span>
                        </div>
                      </div>

                      <div className="bg-slate-950/20 border border-slate-800/60 p-4 rounded-xl text-xs text-slate-350 leading-relaxed shadow-inner mt-4">
                        <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider block mb-1">Responsibilities</span>
                        <p className="select-text font-medium text-slate-300">
                          {agent.id === 'agent_ceo' 
                            ? `Coordinates full project task flows, translates board directives, and monitors overall budget metrics.`
                            : agent.id === 'agent_architect'
                            ? `Designs high-performance, modular system blueprints, schemas, and gateway connection maps.`
                            : agent.id === 'agent_coder'
                            ? `Writes clean developer code modules, configures layouts, bootstraps routes, and optimizes server parameters.`
                            : `Performs static audits, checks validation scripts, runs type validations, and guarantees security certifications.`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files Main Dropbox Explorer View */}
            {activeTab === 'Files' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-5">
                <div className="flex justify-between items-center shrink-0 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-white font-sans flex items-center gap-2">
                      Files Explorer
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manage references, design briefs, datasets, and code blueprint documents.</p>
                  </div>
                  <button className="px-4 py-2.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer">
                    <Upload className="w-3.5 h-3.5" /> Upload Document
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-3 pb-6">
                  {filteredFiles.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      No files matching filters
                    </div>
                  ) : (
                    filteredFiles.map((file, idx) => (
                      <div key={idx} className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between hover:border-indigo-500/20 transition-all group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 bg-slate-950 border border-slate-800/60 rounded-lg flex items-center justify-center shrink-0 group-hover:text-indigo-400 transition-colors">
                            <Folder className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white truncate max-w-sm group-hover:text-indigo-400 transition-colors select-text">{file.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 font-semibold">{file.type} • {file.size} • Uploaded {file.date}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-[9px] font-extrabold uppercase bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-lg text-indigo-400 shadow-inner">
                            {file.folder}
                          </span>
                          <button 
                            onClick={() => setActiveCodePreview(`### Document Preview: ${file.name}\n\nThis document is actively loaded inside the team's shared drive. It provides background context for the AI agents to build ${companyName}.\n\nSize: ${file.size}\nType: ${file.type}\nStatus: SECURED`)}
                            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Slack/Intercom style chat interface */}
            {activeTab === 'Chat' && (
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <div className="flex items-center justify-between shrink-0 border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
                    <span className="text-sm font-bold text-white uppercase tracking-wider">{activeChannel}</span>
                    <span className="text-[9px] text-slate-500 font-extrabold uppercase font-mono bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-lg shrink-0">Live Channel</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connection Secure
                  </span>
                </div>

                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto space-y-4 pr-1.5 custom-scrollbar mb-4 bg-slate-950/20 border border-slate-800/80 rounded-2xl p-4 shadow-inner"
                >
                  {chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[80%] ${
                        msg.isAgent 
                          ? 'mr-auto text-left' 
                          : 'ml-auto text-right items-end'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wide">{msg.sender}</span>
                        <span className="text-[9px] text-slate-500 font-mono font-medium">{msg.timestamp}</span>
                      </div>

                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed select-text font-sans font-medium border ${
                        msg.isAgent 
                          ? 'bg-slate-900/40 border-slate-850 rounded-tl-none text-slate-200' 
                          : 'bg-indigo-600/10 border-indigo-500/15 rounded-tr-none text-white'
                      }`}>
                        {msg.text}

                        {msg.codeSnippet && (
                          <div className="mt-3.5 pt-3.5 border-t border-slate-800/40">
                            <pre className="text-[10px] font-mono text-indigo-300 bg-slate-950 p-3.5 rounded-xl overflow-x-auto select-text leading-relaxed border border-slate-800">
                              <code>{msg.codeSnippet}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendPromptMessage} className="flex gap-2.5 shrink-0">
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={e => setTypedMessage(e.target.value)}
                    placeholder={`Type a directive for ${activeChannel.split(' ')[0]}...`}
                    className="flex-1 px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-xl text-xs font-sans text-white outline-none focus:border-indigo-500/40 transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    className="w-12 h-11.5 rounded-xl border border-indigo-500/20 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Send className="w-4.5 h-4.5 animate-pulse" />
                  </button>
                </form>
              </div>
            )}

            {/* B2B SaaS Settings Screen tab */}
            {activeTab === 'Settings' && (
              <div className="flex-1 flex flex-col overflow-hidden space-y-6">
                <div className="border-b border-slate-800 pb-4 shrink-0">
                  <h3 className="text-lg font-extrabold text-white font-sans">Settings & Controls</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Customize budget limits, models, and connection credentials safely.</p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-1.5 custom-scrollbar pb-6">
                  
                  {/* Slider budget limit */}
                  <div className="space-y-3.5 text-left bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <label className="text-xs font-extrabold text-slate-200 block">Weekly Budget Spending Limit</label>
                        <p className="text-[11px] text-slate-500 mt-0.5">Control the maximum NMX compute credits your team can consume.</p>
                      </div>
                      <span className="text-sm font-mono font-extrabold text-white bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl shadow-inner">{budgetLimit.toLocaleString()} NMX</span>
                    </div>
                    
                    <input
                      type="range"
                      min={10000}
                      max={500000}
                      step={10000}
                      value={budgetLimit}
                      onChange={e => {
                        setBudgetLimit(parseInt(e.target.value));
                        addLocalLog(`[System] Spend limit adjusted to: ${parseInt(e.target.value).toLocaleString()} NMX`);
                      }}
                      className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 uppercase tracking-widest font-extrabold">
                      <span>10k Tokens</span>
                      <span>500k Tokens</span>
                    </div>
                  </div>

                  {/* Secret Gateway Credentials Key */}
                  <div className="space-y-3 bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                    <div>
                      <label className="text-xs font-extrabold text-slate-200 block">Secure Local API Vault Key</label>
                      <p className="text-[11px] text-slate-500 mt-0.5">Your primary local authentication credentials used by agents dynamically.</p>
                    </div>
                    
                    <div className="relative">
                      <input
                        type={showKey ? 'text' : 'password'}
                        placeholder="sk_ep_xxxxxxxxxxxx"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        className="w-full pl-4 pr-24 py-3.5 bg-slate-950/40 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:border-indigo-500/40 transition-all shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-14 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={saveKey}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Advanced Configuration settings (Accordion for developer items) */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/10">
                    <details className="group">
                      <summary className="flex items-center justify-between p-5 text-xs font-extrabold text-slate-300 uppercase tracking-widest cursor-pointer hover:bg-slate-900/35 transition-colors select-none">
                        <span>Advanced Developer Settings</span>
                        <ChevronRight className="w-4.5 h-4.5 text-slate-500 group-open:rotate-90 transition-transform" />
                      </summary>
                      
                      <div className="p-5 border-t border-slate-800/80 space-y-4 text-left">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">Base LLM Engine Model</label>
                          <select
                            value={selectedModel}
                            onChange={e => {
                              setSelectedModel(e.target.value);
                              addLocalLog(`[System] Default intelligence base engine switched to: ${e.target.value}`);
                            }}
                            className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:border-indigo-500/40"
                          >
                            <option value="meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo">Llama 3.1 70B Turbo</option>
                            <option value="meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo">Llama 3.1 405B Heavy</option>
                            <option value="mistralai/Mixtral-8x7B-Instruct-v0.1">Mixtral 8x7B MoE</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800 rounded-xl">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider block">Manual Approval Mode</span>
                            <span className="text-[10px] text-slate-500 mt-1 block">Require approval before merging AI work.</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              setGovernanceMode(!governanceMode);
                              addLocalLog(`[System] Manual Approval Mode ${!governanceMode ? 'ENABLED' : 'DISABLED'}.`);
                            }}
                            className={`w-12 h-6.5 rounded-full p-1 transition-all ${governanceMode ? 'bg-indigo-600' : 'bg-slate-800'}`}
                          >
                            <div className={`w-4.5 h-4.5 rounded-full bg-white transition-all ${governanceMode ? 'translate-x-5.5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    </details>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[80vh] text-left"
            >
              <div className="bg-slate-950 px-5 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5 mr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 animate-pulse" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-300">workspace_delivery_code.py</span>
                </div>
                <button
                  onClick={() => setActiveCodePreview(null)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto bg-slate-950/60 font-mono text-[11px] leading-relaxed text-indigo-300 custom-scrollbar select-text shadow-inner border-b border-slate-800">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold uppercase text-white tracking-widest font-sans">Hire AI Specialist</h4>
                <button 
                  onClick={() => setIsHireModalOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">Agent Name</label>
                  <input
                    type="text"
                    value={newAgentName}
                    onChange={e => setNewAgentName(e.target.value)}
                    placeholder="e.g. Scribe-v2, Traffic-Optimizer..."
                    className="w-full p-3 bg-slate-950/40 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 outline-none focus:border-indigo-500/40"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">Agent Specialty / Role</label>
                  <input
                    type="text"
                    value={newAgentRole}
                    onChange={e => setNewAgentRole(e.target.value)}
                    placeholder="e.g. Lead Copywriter, QA Auditor..."
                    className="w-full p-3 bg-slate-950/40 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 outline-none focus:border-indigo-500/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">Select Avatar Symbol</label>
                  <div className="grid grid-cols-5 gap-2 pt-1.5">
                    {['🤖', '💼', '💻', '📐', '🛡️', '⚙️', '📈', '🎨', '✍️', '🔬'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewAgentAvatar(emoji)}
                        className={`w-9 h-9 rounded-lg border text-lg flex items-center justify-center transition-all ${
                          newAgentAvatar === emoji
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleHireAgent}
                disabled={!newAgentName.trim() || !newAgentRole.trim()}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold tracking-wider transition-all uppercase disabled:opacity-40 cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                Assemble Specialist
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ─── Custom Kanban Card Component (Linear/Jira Inspired) ───
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
    ? 'border-slate-800/80 bg-slate-900/15' 
    : isActive 
    ? 'bg-slate-900/30 border-indigo-500/20 shadow-md shadow-indigo-500/2' 
    : 'bg-slate-900/20 border-slate-800/80';

  const titleClass = isCompleted 
    ? 'text-slate-400 line-through' 
    : 'text-white';

  return (
    <motion.div
      layoutId={ticket.id}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className={`border rounded-2xl p-5 flex flex-col space-y-3.5 text-left hover:border-slate-700/60 transition-all ${borderClass}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6.5 h-6.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-xs shrink-0 select-none">
            {agent?.avatar || '🤖'}
          </div>
          <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider truncate max-w-[120px]">
            {agent?.name || 'AI Specialist'}
          </span>
        </div>
        
        {isActive && (
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
        )}
      </div>

      <h4 className={`text-xs uppercase tracking-wide leading-tight font-extrabold ${titleClass}`}>
        {ticket.title}
      </h4>
      <p className="text-[11px] text-slate-400 leading-relaxed select-text font-medium">
        {ticket.description}
      </p>

      {/* Friendly thought progress status instead of developer output jargon */}
      <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl text-[10.5px] text-slate-300 leading-relaxed shadow-inner">
        <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-widest block mb-1">Active Reasoning</span>
        <div className="select-text overflow-y-auto max-h-[70px] custom-scrollbar leading-relaxed font-medium">
          {ticket.thought}
        </div>
      </div>

      {isActive && (
        <div className="pt-2 shrink-0">
          <div className="w-full bg-slate-950 rounded-full h-1.5 mb-1.5 overflow-hidden border border-slate-800/20">
            <div className="bg-indigo-500 h-full rounded-full animate-pulse" style={{ width: '65%' }}></div>
          </div>
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" /> Writing code... 65% completed
          </span>
        </div>
      )}

      {isCompleted && (
        <div className="pt-2 shrink-0">
          <div className="w-full bg-slate-950 rounded-full h-1.5 mb-1.5 overflow-hidden border border-slate-800/20">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            Completed Task
          </span>
        </div>
      )}

      {hasOutput && (
        <div className="pt-2.5 border-t border-slate-800/40 flex justify-end shrink-0">
          <button
            onClick={() => onCodePreview(ticket.output!)}
            className="h-8 px-3 rounded-lg bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/25 text-indigo-400 text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" /> View Delivery
          </button>
        </div>
      )}

    </motion.div>
  );
}
