"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Coins, BrainCircuit, Activity, Sliders } from 'lucide-react';

import Sidebar from '@/components/layout/Sidebar';
import ContextPanel from '@/components/layout/ContextPanel';
import KanbanBoard from '@/components/dashboard/KanbanBoard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import AgentGrid from '@/components/agents/AgentGrid';
import ChatView from '@/components/chat/ChatView';
import ChatSessionList from '@/components/chat/ChatSessionList';
import FileExplorer from '@/components/files/FileExplorer';
import EmailView from '@/components/emails/EmailView';
import SettingsPanel from '@/components/settings/SettingsPanel';
import DeploySwarm from '@/components/onboarding/DeploySwarm';
import CodePreviewModal from '@/components/ui/CodePreviewModal';

import { CompanyState, Agent, Ticket, ActivityItem, ChatSession, ChatMessage } from '@/lib/types';

export default function Page() {
  // ─── Top-Level Navigation & UI States ───
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Team' | 'Chat' | 'Files' | 'Emails' | 'Settings'>('Dashboard');
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // ─── Swarm State ───
  const [companyState, setCompanyState] = useState<CompanyState>({
    companyName: '',
    mission: '',
    goal: '',
    apiKey: '',
    budgetUsed: 0,
    governanceMode: true
  });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // ─── Chat Sessions State ───
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeChannel, setActiveChannel] = useState('# ceo-office');

  // ─── Simulation Controls ───
  const [isAutoTicking, setIsAutoTicking] = useState(false);
  const [isHeartbeating, setIsHeartbeating] = useState(false);

  // ─── Overlays & Modals ───
  const [activeCodePreview, setActiveCodePreview] = useState<string | null>(null);
  const [activeApprovalTicket, setActiveApprovalTicket] = useState<Ticket | null>(null);

  // ─── Explicit Theme Sync Updater ───
  const handleSetDarkMode = (val: boolean) => {
    setIsDarkMode(val);
    const root = document.documentElement;
    if (val) {
      root.classList.add('dark');
      root.classList.remove('light');
      localStorage.setItem('nvmix_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('nvmix_theme', 'light');
    }
  };

  // ─── Fetch All Swarm State from Server ───
  const fetchSwarmState = async () => {
    try {
      const res = await fetch('/api/orchestrator');
      const data = await res.json();
      if (data.success && data.state) {
        const state = data.state;
        setCompanyState({
          companyName: state.companyName || '',
          mission: state.mission || '',
          goal: state.goal || '',
          apiKey: state.apiKey || '',
          budgetUsed: state.budgetUsed || 0,
          governanceMode: state.governanceMode !== undefined ? state.governanceMode : true
        });
        setAgents(state.agents || []);
        setTickets(state.tickets || []);
        
        if (state.companyName && state.companyName.trim().length > 0) {
          setInitialized(true);
        }
      }
    } catch (e) {
      console.error('Failed to load active swarm state from disk:', e);
    }
  };

  // ─── Fetch Activity Log Feed ───
  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      if (data.success) {
        setActivities(data.activity || []);
      }
    } catch (e) {
      console.error('Failed to retrieve activity feed:', e);
    }
  };

  // ─── Fetch Chat Sessions ───
  const fetchChatSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      const data = await res.json();
      if (data.success && data.sessions) {
        setChatSessions(data.sessions);
        if (data.sessions.length > 0 && !activeSessionId) {
          setActiveSessionId(data.sessions[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to retrieve chat sessions:', e);
    }
  };

  // ─── Fetch Messages for Active Chat Session ───
  const fetchChatMessages = async (sessId: string) => {
    try {
      const res = await fetch(`/api/chat/sessions?id=${sessId}`);
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.messages || []);
      }
    } catch (e) {
      console.error('Failed to load chat messages:', e);
    }
  };

  // ─── Initial Load on Mount ───
  useEffect(() => {
    const savedTheme = localStorage.getItem('nvmix_theme');
    const root = document.documentElement;
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      setIsDarkMode(true);
      root.classList.add('dark');
      root.classList.remove('light');
    }
    fetchSwarmState();
    fetchActivities();
    fetchChatSessions();
  }, []);

  // ─── Trigger Chat Message Fetch on Session ID Change ───
  useEffect(() => {
    if (activeSessionId) {
      fetchChatMessages(activeSessionId);
    }
  }, [activeSessionId]);

  // ─── Swarm Onboarding ───
  const handleDeploySwarm = async (companyName: string, goal: string, mission: string, apiKey: string) => {
    setIsInitializing(true);
    try {
      const res = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'onboard',
          companyName,
          goal,
          mission,
          apiKey
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update state
        setCompanyState({
          companyName: data.state.companyName,
          mission: data.state.mission,
          goal: data.state.goal,
          apiKey: data.state.apiKey,
          budgetUsed: data.state.budgetUsed,
          governanceMode: data.state.governanceMode
        });
        setAgents(data.state.agents);
        setTickets(data.state.tickets);
        setInitialized(true);

        // Seed First Chat Session
        const chatRes = await fetch('/api/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Onboarding General' })
        });
        const chatData = await chatRes.json();
        if (chatData.success) {
          await fetchChatSessions();
          setActiveSessionId(chatData.session.id);
        }

        fetchActivities();

        // Celebration
        confetti({
          particleCount: 150,
          spread: 85,
          colors: ['#3b82f6', '#10b981', '#7c6af7', '#ffffff']
        });
      } else {
        alert(`Autonomous swarm deployment failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Bootstrap failed to connect: ${e.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  // ─── Simulate Demo Mode ───
  const handleDemoMode = async () => {
    const key = companyState.apiKey || localStorage.getItem('nvmix_agent_key') || '';
    if (!key || key.length < 5) {
      alert('Handshake failed: Please enter a valid Nvmix API key first.');
      return;
    }
    
    await handleDeploySwarm(
      'Nvmix Fintech Corp',
      'Construct Next.js asset graphs, configure portfolio webhooks, and compile mock stock trading pipelines.',
      'Build a high-performance automated stock and cryptocurrency trading dashboard.',
      key
    );
  };

  // ─── Swarm Heartbeat Pulse ───
  const triggerHeartbeat = async () => {
    if (isHeartbeating) return;

    // Check governance approvals first
    const awaitingTicket = tickets.find(t => t.status === 'awaiting');
    if (awaitingTicket && companyState.governanceMode) {
      setActiveApprovalTicket(awaitingTicket);
      setIsAutoTicking(false);
      return;
    }

    setIsHeartbeating(true);
    try {
      const res = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heartbeat' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTickets(data.state.tickets);
        setAgents(data.state.agents);
        setCompanyState(prev => ({
          ...prev,
          budgetUsed: data.state.budgetUsed
        }));

        fetchActivities();

        // Check if now awaiting approval
        const nextAwaiting = data.state.tickets.find((t: any) => t.status === 'awaiting');
        if (nextAwaiting && companyState.governanceMode) {
          setActiveApprovalTicket(nextAwaiting);
          setIsAutoTicking(false);
        }

        // Check if all tickets completed
        const allDone = data.state.tickets.every((t: any) => t.status === 'done');
        if (allDone && tickets.some(t => t.status !== 'done')) {
          confetti({
            particleCount: 150,
            spread: 90,
            colors: ['#10b981', '#3b82f6', '#ffffff']
          });
          setIsAutoTicking(false);
        }
      }
    } catch (e) {
      console.error('Heartbeat sync failure:', e);
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
  }, [isAutoTicking, tickets, companyState.governanceMode]);

  // ─── Board Approval Decision ───
  const handleBoardApproval = async (decision: 'approved' | 'rejected') => {
    if (!activeApprovalTicket) return;
    const ticketId = activeApprovalTicket.id;
    setActiveApprovalTicket(null);

    try {
      const res = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          ticketId,
          decision
        })
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.state.tickets);
        setAgents(data.state.agents);
        fetchActivities();

        if (decision === 'approved') {
          confetti({
            particleCount: 80,
            spread: 50,
            colors: ['#10b981', '#ffffff']
          });
        }
      }
    } catch (e) {
      console.error('Failed to register board approval decision:', e);
    }
  };

  // ─── Recruit New Agent ───
  const handleHireAgent = async (name: string, role: string) => {
    const newAgent: Agent = {
      id: `agent_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      role,
      name,
      avatar: '🤖',
      status: 'sleeping'
    };

    try {
      const res = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hire_agent',
          agent: newAgent
        })
      });
      const data = await res.json();
      if (data.success) {
        setAgents(data.state.agents);
        fetchActivities();
      }
    } catch (e) {
      console.error('Hiring transaction failed:', e);
    }
  };

  // ─── Send Chat Message ───
  const handleSendChatMessage = async (msgText: string) => {
    if (!activeSessionId) return;

    // Create immediate user message optimism
    const tempUserMsg: ChatMessage = {
      id: `msg_temp_${Date.now()}`,
      role: 'user',
      content: msgText,
      timestamp: new Date().toISOString(),
      senderName: 'You'
    };
    setChatMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          channel: activeChannel,
          sessionId: activeSessionId
        })
      });
      
      const data = await res.json();
      if (data.success) {
        // Reload messages list
        fetchChatMessages(activeSessionId);
        fetchActivities();
        fetchChatSessions(); // Update last message in sidebar
      } else {
        // Show error message
        setChatMessages(prev => prev.filter(m => m.id !== tempUserMsg.id).concat({
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Error: ${data.error || 'Failed to dispatch chat.'}`,
          timestamp: new Date().toISOString(),
          senderName: 'System'
        }));
      }
    } catch (err: any) {
      setChatMessages(prev => prev.filter(m => m.id !== tempUserMsg.id).concat({
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Gateway Unreachable: ${err.message || 'Check connection status.'}`,
        timestamp: new Date().toISOString(),
        senderName: 'System'
      }));
    }
  };

  // ─── Create Chat Session ───
  const handleCreateChatSession = async () => {
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Workspace Chat' })
      });
      const data = await res.json();
      if (data.success) {
        await fetchChatSessions();
        setActiveSessionId(data.session.id);
      }
    } catch (e) {
      console.error('Failed to create new session:', e);
    }
  };

  // ─── Delete Chat Session ───
  const handleDeleteChatSession = async (sessId: string) => {
    try {
      const res = await fetch(`/api/chat/sessions?id=${sessId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await fetchChatSessions();
        if (activeSessionId === sessId) {
          setActiveSessionId(null);
          setChatMessages([]);
        }
      }
    } catch (e) {
      console.error('Failed to delete chat session:', e);
    }
  };

  // ─── Save Settings ───
  const handleSaveSettings = async (nextState: CompanyState) => {
    setCompanyState(nextState);
    try {
      const res = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'onboard', // onboard updates settings dynamically if already initialized
          companyName: nextState.companyName,
          goal: nextState.goal,
          mission: nextState.mission,
          apiKey: nextState.apiKey
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchSwarmState();
        fetchActivities();
        alert('Settings synchronized successfully on disk.');
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  // ─── Clear Roster & Terminate Swarm ───
  const handleWipeSwarm = async () => {
    if (confirm('Are you absolutely sure you want to terminate this corporate Swarm session? This will wipe your active database.')) {
      try {
        // To clear completely, onboard with empty parameters
        const res = await fetch('/api/orchestrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'onboard',
            companyName: 'Wiped',
            goal: 'Wiped',
            apiKey: 'wiped',
            mission: 'Wiped'
          })
        });
        
        // Reset local storage
        localStorage.removeItem('nvmix_agent_key');
        
        // Reload page to start fresh
        window.location.reload();
      } catch (e) {
        console.error('Reset failed:', e);
      }
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] h-screen flex overflow-hidden font-sans antialiased">
      
      {!initialized ? (
        // Initial Deploy Swarm view
        <DeploySwarm
          onDeploy={handleDeploySwarm}
          onDemoMode={handleDemoMode}
          isDeploying={isInitializing}
        />
      ) : (
        // Main Dashboard View (3-Panel Architecture)
        <div className="flex-1 flex overflow-hidden">
          
          {/* Panel 1: Navigation Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isDarkMode={isDarkMode}
            setIsDarkMode={handleSetDarkMode}
            companyName={companyState.companyName}
            budgetUsed={companyState.budgetUsed}
            onLogout={handleWipeSwarm}
          />

          {/* Panel 2: Main Content Workspace */}
          <main className="flex-1 flex flex-col p-6 overflow-hidden relative">
            {/* Ambient subtle glow overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.02),transparent_45%)] pointer-events-none" />

            {/* Header console */}
            <header className="flex justify-between items-center border-b border-[var(--border-primary)]/30 pb-5 mb-6 shrink-0 relative z-10 select-none">
              <div>
                <h1 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] via-blue-400 to-indigo-400 font-sans text-xl tracking-wide font-black">
                    {companyState.companyName} Command Center
                  </span>
                </h1>
                <div className="flex gap-4 items-center">
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-full px-3.5 py-1.5 flex items-center gap-2">
                    <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest">Directive:</span>
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[280px]">
                      {companyState.goal}
                    </span>
                  </div>
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-full px-3.5 py-1.5 flex items-center gap-2">
                    <span className="text-[9px] text-[var(--text-secondary)] font-extrabold uppercase tracking-widest font-mono">Telemetry Status:</span>
                    <span className="text-xs font-bold text-emerald-500 uppercase flex items-center gap-1.5 leading-none">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_#10b981] animate-ping" /> OPERATIONAL
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Governance controls */}
              <div className="flex items-center gap-3 bg-[var(--bg-surface)] px-4 py-2 rounded-xl border border-[var(--border-primary)] shrink-0 shadow-inner">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                  Governance Mode
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextGov = !companyState.governanceMode;
                    const next = { ...companyState, governanceMode: nextGov };
                    setCompanyState(next);
                    handleSaveSettings(next);
                  }}
                  className={`w-9 h-5 rounded-full relative transition-all duration-300 shadow-inner p-0.5 cursor-pointer shrink-0 ${
                    companyState.governanceMode ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-md ${
                    companyState.governanceMode ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </header>

            {/* Render Tab Contents */}
            <div className="flex-1 flex overflow-hidden relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex-1 flex overflow-hidden h-full"
                >
                  {activeTab === 'Dashboard' && (
                    <div className="flex-1 flex gap-5 overflow-hidden h-full">
                      {/* Left: Kanban Board */}
                      <KanbanBoard
                        tickets={tickets}
                        agents={agents}
                        onCodePreview={setActiveCodePreview}
                        activeApprovalTicket={activeApprovalTicket}
                        onBoardApproval={handleBoardApproval}
                        governanceMode={companyState.governanceMode}
                      />
                      
                      {/* Right: Real-time Terminal Log Feed */}
                      <ActivityFeed activities={activities} />
                    </div>
                  )}

                  {activeTab === 'Team' && (
                    <AgentGrid
                      agents={agents}
                      onHireAgent={handleHireAgent}
                      companyGoal={companyState.goal}
                      budgetUsed={companyState.budgetUsed}
                    />
                  )}

                  {activeTab === 'Chat' && (
                    <div className="flex-1 flex gap-4 overflow-hidden h-full">
                      {/* Sidebar Session List */}
                      <ChatSessionList
                        sessions={chatSessions}
                        activeSessionId={activeSessionId}
                        onSelectSession={setActiveSessionId}
                        onCreateSession={handleCreateChatSession}
                        onDeleteSession={handleDeleteChatSession}
                      />

                      {/* Right Chat Console */}
                      <ChatView
                        messages={chatMessages}
                        agents={agents}
                        activeChannel={activeChannel}
                        isHeartbeating={isHeartbeating}
                        onSendMessage={handleSendChatMessage}
                        sessionId={activeSessionId}
                      />
                    </div>
                  )}

                  {activeTab === 'Files' && (
                    <FileExplorer budgetUsed={companyState.budgetUsed} />
                  )}

                  {activeTab === 'Emails' && (
                    <EmailView />
                  )}

                  {activeTab === 'Settings' && (
                    <SettingsPanel
                      companyState={companyState}
                      onSave={handleSaveSettings}
                      isDarkMode={isDarkMode}
                      setIsDarkMode={handleSetDarkMode}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Panel 3: Right Context Sidebar */}
          <ContextPanel
            activeTab={activeTab}
            companyState={companyState}
            agents={agents}
            tickets={tickets}
            activeChannel={activeChannel}
            setActiveChannel={setActiveChannel}
            onHeartbeat={triggerHeartbeat}
            isHeartbeating={isHeartbeating}
            isAutoTicking={isAutoTicking}
            setIsAutoTicking={setIsAutoTicking}
          />

        </div>
      )}

      {/* Code Preview Overlay Modal */}
      {activeCodePreview && (
        <CodePreviewModal
          code={activeCodePreview}
          onClose={() => setActiveCodePreview(null)}
        />
      )}

    </div>
  );
}
