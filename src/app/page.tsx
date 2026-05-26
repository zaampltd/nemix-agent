"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Coins, BrainCircuit, Activity, Sliders, Bell, X, AlertTriangle, Mail, Check } from 'lucide-react';

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
import ProjectsView from '@/components/projects/ProjectsView';

import { CompanyState, Agent, Ticket, ActivityItem, ChatSession, ChatMessage } from '@/lib/types';

export default function Page() {
  // ─── Top-Level Navigation & UI States ───
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Team' | 'Projects' | 'Chat' | 'Files' | 'Emails' | 'Settings'>('Dashboard');
  const [initialized, setInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [emails, setEmails] = useState<any[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

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

  // ─── Fetch Emails for Notification Alerts ───
  const fetchEmails = async () => {
    try {
      const res = await fetch('/api/emails');
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails);
      }
    } catch (e) {
      console.error('Failed to retrieve emails for notifications:', e);
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
    fetchEmails();
  }, []);

  // ─── Trigger Chat Message Fetch on Session ID Change ───
  useEffect(() => {
    if (activeSessionId) {
      fetchChatMessages(activeSessionId);
    }
  }, [activeSessionId]);

  // ─── Swarm Onboarding ───
  const handleDeploySwarm = async (companyName: string, goal: string, mission: string, apiKey: string, userName?: string, industry?: string) => {
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
          apiKey,
          userName: userName || 'Founder',
          industry: industry || 'general'
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
          body: JSON.stringify({ title: 'General Workspace' })
        });
        const chatData = await chatRes.json();
        if (chatData.success) {
          await fetchChatSessions();
          setActiveSessionId(chatData.session.id);
        }

        fetchActivities();

        // Celebration
        confetti({
          particleCount: 180,
          spread: 90,
          colors: ['#3b82f6', '#10b981', '#7c6af7', '#06b6d4', '#ffffff']
        });
      } else {
        alert(`Failed to launch workspace: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`Connection failed: ${e.message}`);
    } finally {
      setIsInitializing(false);
    }
  };

  // ─── Demo Mode ───
  const handleDemoMode = async () => {
    const key = companyState.apiKey || localStorage.getItem('nvmix_agent_key') || '';
    if (!key || key.length < 5) {
      alert('Please enter a valid Nvmix API key first. Get one at nvmix.com');
      return;
    }
    const userName = localStorage.getItem('nvmix_user_name') || 'Demo User';
    await handleDeploySwarm(
      'TechVision Solutions',
      'Automate all technology company operations including software development, project management, client reports, security audits, and team coordination.',
      'Build world-class software that transforms businesses through AI-powered automation.',
      key,
      userName,
      'technology'
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
      // 35s timeout — Nvmix API can take up to 30s to respond
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      let res: Response;
      try {
        res = await fetch('/api/orchestrator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'heartbeat' }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        const isTimeout = fetchErr?.name === 'AbortError';
        const msg = isTimeout
          ? 'Nvmix API timed out (35s). The AI is taking longer than expected — try again.'
          : `Cannot reach server: ${fetchErr?.message || 'network error'}. Make sure the dev server is running.`;
        console.error('[Heartbeat]', msg);
        setIsAutoTicking(false);
        setIsHeartbeating(false);
        return;
      }

      // Handle non-ok HTTP (e.g. 400, 500 from API)
      if (!res.ok) {
        let errMsg = `Server error ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData?.error || errMsg;
        } catch {}
        console.error('[Heartbeat] API error:', errMsg);
        // Don't stop auto-ticking on recoverable errors — just log and continue
        setIsHeartbeating(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        setTickets(data.state.tickets);
        setAgents(data.state.agents);
        setCompanyState(prev => ({
          ...prev,
          budgetUsed: data.state.budgetUsed
        }));

        fetchActivities();
        fetchEmails();

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
    } catch (e: any) {
      console.error('[Heartbeat] Unexpected error:', e?.message || e);
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
        fetchChatSessions();

        // ── Auto-start execution when CEO creates a task directive ──
        // If the reply contains "[Swarm OS Directive]" it means a task/ticket was created.
        // Automatically kick off the heartbeat runner so agents start immediately.
        const replyText: string = data.reply || data.message || '';
        const isDirective =
          replyText.includes('[Swarm OS Directive]') ||
          replyText.includes('🚀 Task created') ||
          replyText.includes('⚡ ACTIVE') ||
          replyText.includes('Task created:');

        if (isDirective && !isAutoTicking) {
          // Small delay so ticket is fully persisted before heartbeat fires
          setTimeout(() => {
            setIsAutoTicking(true);
            // Trigger immediate first pulse — don't wait for interval
            triggerHeartbeat();
          }, 800);
        }

        // Also refresh agent/ticket state so Dashboard updates immediately
        fetchSwarmState();
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
          action: 'save_settings',
          companyName: nextState.companyName,
          goal: nextState.goal,
          mission: nextState.mission,
          apiKey: nextState.apiKey,
          governanceMode: nextState.governanceMode
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchSwarmState();
        fetchActivities();
        if (activeTab === 'Settings') {
          alert('Settings synchronized successfully on disk.');
        }
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

  // ─── Dynamic Notifications Selector Logic ───
  interface NotificationItem {
    id: string;
    type: 'email' | 'approval' | 'issue';
    title: string;
    description: string;
    timestamp: string;
    meta?: any;
  }

  const notifications: NotificationItem[] = [];

  // 1. Add tickets awaiting approval (high priority)
  tickets.filter(t => t.status === 'awaiting').forEach(ticket => {
    notifications.push({
      id: `approval_${ticket.id}`,
      type: 'approval',
      title: 'Approval Required',
      description: `Task "${ticket.title}" is awaiting board approval.`,
      timestamp: new Date().toISOString(),
      meta: { ticket }
    });
  });

  // 2. Add recent incoming emails
  const isInboxEmail = (email: any) =>
    email.to.toLowerCase().includes('founder') || email.to.toLowerCase().includes('you');

  emails.filter(e => isInboxEmail(e) && e.status === 'sent').forEach(email => {
    notifications.push({
      id: `email_${email.id}`,
      type: 'email',
      title: `New Email from ${email.from}`,
      description: email.subject,
      timestamp: email.timestamp,
      meta: { email }
    });
  });

  // 3. Add issues / warning logs from activity stream
  activities.filter(act => 
    act.message.toLowerCase().includes('fail') || 
    act.message.toLowerCase().includes('error') || 
    act.message.toLowerCase().includes('warn') || 
    act.message.toLowerCase().includes('cancel')
  ).forEach(act => {
    notifications.push({
      id: `activity_${act.id || Math.random()}`,
      type: 'issue',
      title: 'System Alert',
      description: act.message,
      timestamp: act.timestamp,
      meta: { act }
    });
  });

  // Sort latest first
  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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
            {/* Rich ambient glow overlays */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-indigo-500/[0.05] to-transparent" />
              <div className="absolute top-0 left-1/4 w-96 h-64 bg-indigo-600/[0.04] rounded-full blur-3xl" />
              <div className="absolute top-0 right-1/4 w-64 h-48 bg-violet-600/[0.04] rounded-full blur-3xl" />
            </div>

            {/* Header console */}
            <header className="flex justify-between items-center border-b border-indigo-500/[0.07] pb-5 mb-6 shrink-0 relative z-40 select-none">
              <div>
                <h1 className="mb-2.5">
                  <span className="text-gradient-aurora font-black text-xl tracking-tight leading-none">
                    {companyState.companyName} Command Center
                  </span>
                </h1>
                <div className="flex gap-3 items-center">
                  <div
                    className="rounded-full px-3.5 py-1.5 flex items-center gap-2"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
                  >
                    <span className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.12em]">Directive:</span>
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[260px]">
                      {companyState.goal}
                    </span>
                  </div>
                  <div
                    className="rounded-full px-3.5 py-1.5 flex items-center gap-2"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)' }}
                  >
                    <span className="text-[9px] text-emerald-400/70 font-black uppercase tracking-[0.12em]">Telemetry:</span>
                    <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5 leading-none">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_6px_#10b981] animate-ping" /> OPERATIONAL
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Governance & Notifications controls */}
              <div className="flex items-center gap-4 shrink-0 relative">
                
                {/* Governance Switch */}
                <div
                  className="flex items-center gap-3 px-4 py-2 rounded-xl select-none bg-[var(--bg-surface)] border border-[var(--border-primary)]"
                >
                  <span className="text-[9.5px] font-black text-indigo-400/60 uppercase tracking-[0.12em]">
                    Governance
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextGov = !companyState.governanceMode;
                      const next = { ...companyState, governanceMode: nextGov };
                      setCompanyState(next);
                      handleSaveSettings(next);
                    }}
                    className={`w-9 h-5 rounded-full relative transition-all duration-300 p-0.5 cursor-pointer shrink-0 ${
                      companyState.governanceMode
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                        : 'bg-[var(--bg-surface)] border border-[var(--border-primary)]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full transition-all duration-300 shadow-md ${
                      companyState.governanceMode
                        ? 'translate-x-4 bg-white'
                        : 'translate-x-0 bg-[var(--text-muted)]'
                    }`} />
                  </button>
                </div>

                {/* Notifications Bell Popover Container */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center relative cursor-pointer transition-all duration-250 select-none"
                    style={isNotificationOpen ? {
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.35)',
                      boxShadow: '0 0 16px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                    } : {
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-primary)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                  >
                    <Bell
                      className={`w-4 h-4 transition-all duration-200 ${
                        isNotificationOpen ? 'text-indigo-300' : 'text-[var(--text-muted)]'
                      } ${notifications.length > 0 && !isNotificationOpen ? 'animate-[bounce_2s_infinite]' : ''}`}
                    />
                    {notifications.length > 0 && (
                      <span
                        className="absolute -top-1 -right-1 w-4 h-4 text-white text-[8px] font-mono font-black rounded-full flex items-center justify-center z-10 leading-none animate-pulse"
                        style={{ background: 'linear-gradient(135deg,#e11d48,#f43f5e)', boxShadow: '0 0 8px rgba(244,63,94,0.6)', border: '1px solid rgba(0,0,0,0.3)' }}
                      >
                        {notifications.length}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotificationOpen && (
                      <>
                        {/* Underlay to dismiss dropdown */}
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={() => setIsNotificationOpen(false)} 
                        />
                        
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.93 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 12, scale: 0.93 }}
                          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute right-0 top-11 w-80 rounded-2xl z-50 p-4 select-none overflow-hidden max-h-[400px] flex flex-col font-sans notification-panel"
                        >
                          {/* Top edge aurora */}
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent pointer-events-none" />

                          {/* Popover Header */}
                          <div className="flex justify-between items-center border-b border-indigo-500/[0.08] pb-2.5 mb-3 shrink-0">
                            <span className="text-[9px] font-black text-white/80 uppercase tracking-[0.12em]">
                              Swarm Alerts Center
                            </span>
                            {notifications.length > 0 && (
                              <span
                                className="text-[8px] font-black uppercase tracking-widest font-mono px-2 py-0.5 rounded leading-none"
                                style={{ background: 'rgba(99,102,241,0.14)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.22)' }}
                              >
                                {notifications.length} Pending
                              </span>
                            )}
                          </div>

                          {/* Alerts List */}
                          <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2 pr-1 max-h-[300px]">
                            {notifications.length === 0 ? (
                              <div className="py-12 flex flex-col items-center justify-center text-center gap-2 select-none">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center"
                                  style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.22)', boxShadow: '0 0 14px rgba(16,185,129,0.15)' }}
                                >
                                  <Check className="w-5 h-5 text-emerald-400" />
                                </div>
                                <h4 className="text-[10px] font-black uppercase text-white/70 tracking-wide">
                                  System Stable
                                </h4>
                                <p className="text-[8.5px] text-[var(--text-muted)] max-w-[200px] leading-relaxed">
                                  No alerts pending. All telemetry streams are fully nominal.
                                </p>
                              </div>
                            ) : (
                              notifications.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => {
                                    setIsNotificationOpen(false);
                                    if (item.type === 'approval') {
                                      setActiveApprovalTicket(item.meta.ticket);
                                      setActiveTab('Dashboard');
                                    } else if (item.type === 'email') {
                                      localStorage.setItem('nvmix_selected_email_id', item.meta.email.id);
                                      setActiveTab('Emails');
                                    } else if (item.type === 'issue') {
                                      setActiveTab('Dashboard');
                                    }
                                  }}
                                  className="p-3 rounded-xl cursor-pointer flex gap-3 items-start transition-all relative overflow-hidden group select-none"
                                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}
                                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.22)')}
                                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.08)')}
                                >
                                  {/* Icon column */}
                                  <div className="shrink-0 pt-0.5">
                                    {item.type === 'approval' && (
                                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.22)', boxShadow: '0 0 8px rgba(245,158,11,0.1)' }}>
                                        <Sliders className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                                      </div>
                                    )}
                                    {item.type === 'email' && (
                                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)', boxShadow: '0 0 8px rgba(99,102,241,0.1)' }}>
                                        <Mail className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
                                      </div>
                                    )}
                                    {item.type === 'issue' && (
                                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.10)', border: '1px solid rgba(244,63,94,0.20)', boxShadow: '0 0 8px rgba(244,63,94,0.08)' }}>
                                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Description column */}
                                  <div className="min-w-0 flex-grow">
                                    <div className="flex justify-between items-center gap-2">
                                      <span className="text-[9.5px] font-bold text-[var(--text-primary)] uppercase truncate leading-tight group-hover:text-indigo-400 transition-colors">
                                        {item.title}
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-[var(--text-secondary)] mt-1 truncate leading-relaxed">
                                      {item.description}
                                    </p>
                                    <span className="inline-block text-[7px] font-mono text-indigo-500/40 mt-1 uppercase tracking-wide">
                                      Click to inspect
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

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

                  {activeTab === 'Projects' && (
                    <ProjectsView />
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
