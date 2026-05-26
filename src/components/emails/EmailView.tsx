"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, Search, Send, Trash2, CheckCircle2, ChevronRight, 
  AlertCircle, Inbox, User, CornerUpLeft, Clock, Shield, Sparkles, Plus
} from 'lucide-react';
import { Email } from '@/lib/types';

// Helper for agent specific avatar design
const getAvatarInitials = (name: string) => {
  if (!name) return '🤖';
  if (name.toLowerCase().includes('founder') || name.toLowerCase().includes('you')) return '👑';
  const parts = name.split('-');
  if (parts.length > 1) {
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  }
  const words = name.split(' ');
  if (words.length > 1) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAvatarGradient = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('ceo')) return 'from-amber-500 to-yellow-600 text-white shadow-md shadow-amber-500/10';
  if (lower.includes('hr') || lower.includes('helen')) return 'from-rose-500 to-pink-650 text-white shadow-md shadow-rose-500/10';
  if (lower.includes('marketer') || lower.includes('marketing') || lower.includes('beta')) return 'from-orange-500 to-red-650 text-white shadow-md shadow-orange-500/10';
  if (lower.includes('dev') || lower.includes('coder') || lower.includes('developer') || lower.includes('gamma')) return 'from-purple-500 to-indigo-650 text-white shadow-md shadow-purple-500/10';
  if (lower.includes('analyst') || lower.includes('data') || lower.includes('delta')) return 'from-blue-500 to-cyan-650 text-white shadow-md shadow-blue-500/10';
  if (lower.includes('support') || lower.includes('admin') || lower.includes('sam')) return 'from-teal-500 to-emerald-650 text-white shadow-md shadow-teal-500/10';
  if (lower.includes('founder') || lower.includes('you')) return 'from-indigo-500 to-blue-650 text-white shadow-md shadow-indigo-500/10';
  return 'from-slate-550 to-slate-700 text-white';
};

export default function EmailView() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'inbox' | 'drafts' | 'sent'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  
  // Replying state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccessId, setReplySuccessId] = useState<string | null>(null);

  // New Compose state
  const [isComposing, setIsComposing] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingCompose, setSendingCompose] = useState(false);
  const [composeSuccess, setComposeSuccess] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);

  // Fetch emails from API
  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/emails');
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails);
      }
    } catch (e) {
      console.error('Failed to retrieve emails:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch hired agents list
  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/orchestrator');
      const data = await res.json();
      if (data.success && data.state) {
        setAgents(data.state.agents || []);
        if (data.state.agents && data.state.agents.length > 0) {
          setComposeTo(data.state.agents[0].name);
        }
      }
    } catch (e) {
      console.error('Failed to retrieve hired agents:', e);
    }
  };

  useEffect(() => {
    fetchEmails();
    fetchAgents();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'sent' | 'cancelled') => {
    try {
      const res = await fetch('/api/emails', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.success) {
        fetchEmails();
        // If we cancel/send a draft, clear the selected view or select the next one
        if (selectedEmailId === id) {
          setSelectedEmailId(null);
        }
      }
    } catch (err) {
      console.error('Failed to update email status:', err);
    }
  };

  const handleSendReply = async (originalEmail: Email) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Founder (You)',
          to: originalEmail.from,
          subject: `RE: ${originalEmail.subject}`,
          body: replyText,
          status: 'sent',
          isReply: true,
          originalEmailId: originalEmail.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyingToId(null);
        setReplyText('');
        setReplySuccessId(originalEmail.id);
        setTimeout(() => setReplySuccessId(null), 5000);
        fetchEmails();
      } else {
        alert(`Failed to send reply: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Connection failed: ${e.message}`);
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendNewCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSubject.trim() || !composeBody.trim()) return;
    setSendingCompose(true);
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Founder (You)',
          to: composeTo,
          subject: composeSubject,
          body: composeBody,
          status: 'sent'
        })
      });
      const data = await res.json();
      if (data.success) {
        setComposeSuccess(true);
        setComposeSubject('');
        setComposeBody('');
        setTimeout(() => {
          setComposeSuccess(false);
          setIsComposing(false);
        }, 1500);
        
        await fetchEmails();
        // Redirect to sent tab
        setSubTab('sent');
        // Let it select the newly sent email (or first)
        setSelectedEmailId(null);
      } else {
        alert(`Failed to dispatch email: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Gateway dispatch failed: ${e.message}`);
    } finally {
      setSendingCompose(false);
    }
  };

  const isInboxEmail = (email: Email) =>
    email.to.toLowerCase().includes('founder') || email.to.toLowerCase().includes('you');

  const filteredEmails = emails.filter(email => {
    let isMatchingTab = false;
    if (subTab === 'inbox') {
      isMatchingTab = isInboxEmail(email);
    } else if (subTab === 'drafts') {
      isMatchingTab = email.status === 'draft';
    } else {
      isMatchingTab = email.status === 'sent' && !isInboxEmail(email);
    }
    const isMatchingSearch = 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body.toLowerCase().includes(searchQuery.toLowerCase());
    return isMatchingTab && isMatchingSearch;
  });

  // Auto-select first email in tab if none is selected and not composing
  useEffect(() => {
    if (!loading && filteredEmails.length > 0 && !selectedEmailId && !isComposing) {
      setSelectedEmailId(filteredEmails[0].id);
    }
  }, [filteredEmails, loading, selectedEmailId, isComposing]);

  const selectedEmail = filteredEmails.find(e => e.id === selectedEmailId);

  const inboxCount = emails.filter(e => isInboxEmail(e)).length;
  const draftCount = emails.filter(e => e.status === 'draft').length;
  const sentCount = emails.filter(e => e.status === 'sent' && !isInboxEmail(e)).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4 h-full">
      
      {/* Main Mailroom Split Pane Workspace */}
      <div className="flex-1 flex overflow-hidden h-full gap-5">
        
        {/* ==================== LEFT COLUMN: EMAIL LIST ==================== */}
        <div className="w-[320px] md:w-[350px] shrink-0 flex flex-col pr-5 border-r border-[var(--border-primary)]/20 h-full overflow-hidden select-none">
          
          {/* Compose New Email Button */}
          <button
            onClick={() => {
              setIsComposing(true);
              setSelectedEmailId(null);
              setReplyingToId(null);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-4 rounded-xl text-xs font-black tracking-widest uppercase bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white shadow-md shadow-blue-500/15 transition-all cursor-pointer hover:shadow-lg shrink-0 border border-blue-400/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Compose Email</span>
          </button>

          {/* Segmented Sub-tabs */}
          <div className="flex bg-[var(--bg-surface)] border border-[var(--border-primary)] p-0.5 rounded-xl shadow-inner shrink-0 text-[9px] font-black uppercase tracking-wider mb-3">
            <button
              onClick={() => { setSubTab('inbox'); setSelectedEmailId(null); setReplyingToId(null); setIsComposing(false); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                subTab === 'inbox' && !isComposing
                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-450 font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              Inbox ({inboxCount})
            </button>
            <button
              onClick={() => { setSubTab('drafts'); setSelectedEmailId(null); setReplyingToId(null); setIsComposing(false); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                subTab === 'drafts' && !isComposing
                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-455 font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              Drafts ({draftCount})
            </button>
            <button
              onClick={() => { setSubTab('sent'); setSelectedEmailId(null); setReplyingToId(null); setIsComposing(false); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                subTab === 'sent' && !isComposing
                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-455 font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              Sent ({sentCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative shrink-0 mb-3.5">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
              <Search className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search mails..."
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 shadow-inner placeholder-[var(--text-secondary)]/50"
            />
          </div>

          {/* Scrollable Email Row Cards */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1 pb-6">
            {loading ? (
              <div className="text-center py-20 text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Retrieving mailbox...
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="border border-dashed border-[var(--border-primary)] rounded-xl py-16 px-4 text-center text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-2 bg-[var(--bg-card)]/25">
                <Mail className="w-6 h-6 text-[var(--text-secondary)] animate-bounce" />
                <span>Empty Mailbox</span>
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = selectedEmailId === email.id;
                let timeStr = '';
                try {
                  timeStr = new Date(email.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                } catch {
                  timeStr = '';
                }

                return (
                  <div
                    key={email.id}
                    onClick={() => { setSelectedEmailId(email.id); setReplyingToId(null); setIsComposing(false); }}
                    className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all duration-200 select-none relative overflow-hidden group ${
                      isSelected
                        ? 'border-blue-500/35 bg-blue-500/5 shadow-sm'
                        : 'border-[var(--border-primary)] bg-[var(--bg-surface)] hover:border-blue-500/15 hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-550" />
                    )}

                    {/* Circle Avatar initials */}
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${getAvatarGradient(email.from)} flex items-center justify-center font-bold text-xs shrink-0`}>
                      {getAvatarInitials(email.from)}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase text-[var(--text-primary)] truncate max-w-[130px] group-hover:text-blue-550 transition-colors">
                          {email.from}
                        </span>
                        <span className="text-[8px] font-mono text-[var(--text-secondary)] shrink-0">
                          {timeStr}
                        </span>
                      </div>
                      <h4 className="text-[11px] font-bold text-[var(--text-primary)] truncate mt-1 leading-tight">
                        {email.subject}
                      </h4>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate mt-1 font-medium font-sans">
                        {email.body}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* ==================== RIGHT COLUMN: EMAIL READER / COMPOSE PANEL ==================== */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {isComposing ? (
            /* ==================== COMPOSE COMPONENT PANEL ==================== */
            <form onSubmit={handleSendNewCompose} className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-lg relative select-none">
              <div className="p-6 border-b border-[var(--border-primary)]/20 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Mail className="w-4.5 h-4.5 text-blue-550 animate-pulse" />
                  <h2 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider block">
                    New Telemetry Directive Email
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="text-[10px] px-2.5 py-1 rounded bg-[var(--border-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] font-bold uppercase transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                {composeSuccess && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-mono select-none animate-slideUp">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Email successfully dispatched! Target agent is swarming...</span>
                  </div>
                )}

                {/* Dropdown Recipient */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Recipient Agent</label>
                  <select
                    required
                    value={composeTo}
                    onChange={e => setComposeTo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner appearance-none cursor-pointer"
                  >
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.name} className="bg-[var(--bg-surface)] text-[var(--text-primary)]">
                        {agent.name} ({agent.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Subject Directive</label>
                  <input
                    type="text"
                    required
                    value={composeSubject}
                    onChange={e => setComposeSubject(e.target.value)}
                    placeholder="e.g. Compile stock marketing script or optimize UI"
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner placeholder-[var(--text-secondary)]/40"
                  />
                </div>

                {/* Body instructions */}
                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Instructions Content</label>
                  <textarea
                    required
                    rows={8}
                    value={composeBody}
                    onChange={e => setComposeBody(e.target.value)}
                    placeholder="Describe what the agent should swarm on in clean detail..."
                    className="w-full flex-1 px-3.5 py-3 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner resize-none leading-relaxed placeholder-[var(--text-secondary)]/40"
                  />
                </div>
              </div>

              {/* Footer submit */}
              <div className="p-4.5 bg-[var(--bg-card)] border-t border-[var(--border-primary)]/20 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="h-9 px-4 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingCompose || !composeSubject.trim() || !composeBody.trim()}
                  className="h-9 px-5.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/15 cursor-pointer disabled:opacity-40"
                >
                  {sendingCompose ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      <span>Swarming...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-white" />
                      <span>Send Telemetry Direct</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : selectedEmail ? (
            /* ==================== NORMAL EMAIL READER ==================== */
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-lg relative">
              
              {/* Scrollable Reader Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-32">
                
                {/* Header Title section */}
                <div className="flex justify-between items-start border-b border-[var(--border-primary)]/20 pb-5 select-none">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15">
                      Telemetry Thread
                    </span>
                    <h2 className="text-base font-extrabold text-[var(--text-primary)] tracking-tight leading-tight select-text">
                      {selectedEmail.subject}
                    </h2>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="shrink-0 text-[9px] font-mono font-bold">
                    {selectedEmail.status === 'draft' ? (
                      <span className="text-yellow-600 dark:text-yellow-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" /> Pending Review
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_4px_#10b981] animate-pulse" /> Dispatched
                      </span>
                    )}
                  </div>
                </div>

                {/* Sender/Recipient Detail Pane */}
                <div className="flex items-center gap-4 bg-[var(--bg-surface)] p-3.5 border border-[var(--border-primary)] rounded-xl select-none">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${getAvatarGradient(selectedEmail.from)} flex items-center justify-center font-bold text-xs shrink-0`}>
                    {getAvatarInitials(selectedEmail.from)}
                  </div>
                  <div className="min-w-0 flex-1 font-mono text-[9px] text-[var(--text-secondary)] space-y-0.5">
                    <div>
                      <strong className="text-[var(--text-primary)]">From:</strong> {selectedEmail.from}
                    </div>
                    <div>
                      <strong className="text-[var(--text-primary)]">To:</strong> {selectedEmail.to}
                    </div>
                    <div>
                      <strong className="text-[var(--text-primary)]">Date:</strong> {new Date(selectedEmail.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Main Body content */}
                <div className="text-xs text-[var(--text-primary)] font-medium leading-relaxed select-text space-y-3.5 bg-[var(--bg-surface)]/20 border border-[var(--border-primary)]/30 p-5 rounded-xl shadow-inner">
                  {selectedEmail.body.split('\n').map((para, i) => (
                    <p key={i} className={i > 0 ? 'mt-2.5' : ''}>{para}</p>
                  ))}
                </div>

                {/* Outbound Authorization Buttons (Draft tab only) */}
                {selectedEmail.status === 'draft' && (
                  <div className="flex justify-end gap-3 select-none pt-4 border-t border-[var(--border-primary)]/20">
                    <button
                      onClick={() => handleUpdateStatus(selectedEmail.id, 'cancelled')}
                      className="h-9 px-4.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <span>Wipe Draft</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedEmail.id, 'sent')}
                      className="h-9 px-4.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/15 cursor-pointer border border-blue-400/20"
                    >
                      <Send className="w-4 h-4 text-white" />
                      <span>Approve & Discard Outbound</span>
                    </button>
                  </div>
                )}

              </div>

              {/* Pinned Reply / Actions Absolute Footer */}
              {subTab === 'inbox' && (
                <div className="absolute bottom-0 inset-x-0 bg-[var(--bg-card)] border-t border-[var(--border-primary)]/20 p-4.5 z-10 select-none">
                  {replyingToId === selectedEmail.id ? (
                    <div className="space-y-3">
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder={`Instruct ${selectedEmail.from}... (e.g. "Hire a frontend developer" or "optimize compilation seeders")`}
                        className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner resize-none leading-relaxed placeholder-[var(--text-secondary)]/40 focus:ring-1 focus:ring-blue-500/10"
                      />
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyText('');
                          }}
                          disabled={sendingReply}
                          className="h-8 px-3.5 rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={() => handleSendReply(selectedEmail)}
                          disabled={sendingReply || !replyText.trim()}
                          className="h-8 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-40"
                        >
                          {sendingReply ? (
                            <>
                              <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin" />
                              <span>Swarming...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5 text-white" />
                              <span>Dispatch Reply</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {replySuccessId === selectedEmail.id && (
                        <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-555 text-[10px] font-mono select-none animate-slideUp">
                          <CheckCircle2 className="w-4 h-4 text-emerald-550 shrink-0" />
                          <span>Reply dispatched! {selectedEmail.from} is swarming on your requests in the background.</span>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          setReplyingToId(selectedEmail.id);
                          setReplyText('');
                        }}
                        className="h-9 px-4 rounded-xl bg-blue-500/10 border border-blue-500/25 hover:bg-blue-600/15 hover:border-blue-500/40 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer select-none self-start"
                      >
                        <CornerUpLeft className="w-4 h-4 text-blue-500" />
                        <span>Reply to Agent</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            /* Premium Empty State Screen */
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--bg-card)] border border-[var(--border-primary)]/45 rounded-2xl shadow-lg select-none">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-blue-500/5 blur-xl w-16 h-16 pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-blue-950/20 border border-blue-500/20 flex items-center justify-center relative">
                  <Mail className="w-7 h-7 text-blue-500 animate-pulse" />
                  <Sparkles className="w-4.5 h-4.5 text-blue-400 absolute -top-1 -right-1 animate-bounce" />
                </div>
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                Autonomous Mail Intelligence
              </h3>
              <p className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-widest mt-2 block">
                Select a swarming telemetry thread to inspect
              </p>
              
              {/* Telemetry Stats inside Empty State */}
              <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-sm text-center">
                <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)]/30 rounded-xl space-y-1">
                  <span className="text-[8px] font-black text-blue-500 uppercase block leading-none">Inbox</span>
                  <span className="text-xs font-black text-[var(--text-primary)]">{inboxCount} threads</span>
                </div>
                <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)]/30 rounded-xl space-y-1">
                  <span className="text-[8px] font-black text-yellow-500 uppercase block leading-none">Drafts</span>
                  <span className="text-xs font-black text-[var(--text-primary)]">{draftCount} items</span>
                </div>
                <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)]/30 rounded-xl space-y-1">
                  <span className="text-[8px] font-black text-emerald-500 uppercase block leading-none">Sent</span>
                  <span className="text-xs font-black text-[var(--text-primary)]">{sentCount} entries</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
