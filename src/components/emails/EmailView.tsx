"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mail, Search, Send, Trash2, CheckCircle2, ChevronRight, 
  AlertCircle, Inbox, User, CornerUpLeft, Clock, Shield, Sparkles, Plus, Paperclip, ArrowRight
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

// Thread interface for grouping related emails
interface EmailThread {
  id: string; // Original email ID
  baseSubject: string;
  emails: Email[];
  latestTimestamp: string;
  latestEmail: Email;
  participants: string[];
}

export default function EmailView() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'inbox' | 'drafts' | 'sent'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  
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

  // Shared file upload state for Emails (compose or reply)
  const [emailUploading, setEmailUploading] = useState(false);
  const emailFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadContext, setUploadContext] = useState<'compose' | 'reply'>('compose');

  const handleEmailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEmailUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('createdBy', 'user');

    // Associate with the user's active project if set in localStorage
    if (typeof window !== 'undefined') {
      const activeProjId = localStorage.getItem('nvmix_active_project_id');
      if (activeProjId) {
        formData.append('projectId', activeProjId);
      }
    }

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        if (isComposing) {
          setComposeBody(prev => prev + `\n\n[Attachment Uploaded: ${file.name}]`);
        } else if (replyingToId) {
          setReplyText(prev => prev + `\n\n[Attachment Uploaded: ${file.name}]`);
        } else {
          alert(`Success: "${file.name}" has been uploaded and fully synchronized in your workspace drive!`);
        }
        
        if (emailFileInputRef.current) {
          emailFileInputRef.current.value = '';
        }
      } else {
        alert(`File upload failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Network error during file upload: ${err.message}`);
    } finally {
      setEmailUploading(false);
    }
  };

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
      }
    } catch (err) {
      console.error('Failed to update email status:', err);
    }
  };

  const handleSendReply = async (thread: EmailThread) => {
    if (!replyText.trim()) return;
    
    // Find the latest incoming email in this thread to reply to, or fallback to first email
    const latestIncoming = thread.emails
      .slice()
      .reverse()
      .find(e => isInboxEmail(e));
    const targetEmail = latestIncoming || thread.emails[0];
    
    setSendingReply(true);
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Founder (You)',
          to: targetEmail.from,
          subject: targetEmail.subject.toLowerCase().startsWith('re:') 
            ? targetEmail.subject 
            : `RE: ${targetEmail.subject}`,
          body: replyText,
          status: 'sent',
          isReply: true,
          originalEmailId: targetEmail.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyingToId(null);
        setReplyText('');
        setReplySuccessId(thread.id);
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
        // Clear active selection
        setSelectedThreadId(null);
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

  // Threading utility function
  const getBaseSubject = (subject: string): string => {
    return subject
      .replace(/^(re|fw|fwd|aw|antw):\s*/i, '')
      .replace(/^[re\s:]+/i, '')
      .replace(/\**$/, '') // Strip trailing asterisks
      .trim();
  };

  const groupIntoThreads = (allEmails: Email[]): EmailThread[] => {
    const threadsMap: { [baseSubject: string]: Email[] } = {};
    
    // Group emails by base subject
    allEmails.forEach(email => {
      const baseSub = getBaseSubject(email.subject);
      if (!threadsMap[baseSub]) {
        threadsMap[baseSub] = [];
      }
      threadsMap[baseSub].push(email);
    });
    
    // Convert groups to threads list
    const threadsList: EmailThread[] = Object.keys(threadsMap).map(baseSub => {
      const threadEmails = threadsMap[baseSub];
      
      // Sort oldest first (chronological order)
      threadEmails.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const latestEmail = threadEmails[threadEmails.length - 1];
      
      // Extract unique participants
      const participantsSet = new Set<string>();
      threadEmails.forEach(e => {
        participantsSet.add(e.from);
      });
      
      return {
        id: threadEmails[0].id,
        baseSubject: baseSub,
        emails: threadEmails,
        latestTimestamp: latestEmail.timestamp,
        latestEmail: latestEmail,
        participants: Array.from(participantsSet)
      };
    });
    
    // Sort latest active first
    threadsList.sort((a, b) => new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime());
    
    return threadsList;
  };

  const allThreads = groupIntoThreads(emails);

  const filteredThreads = allThreads.filter(thread => {
    let isMatchingTab = false;
    
    if (subTab === 'inbox') {
      // Inbox contains threads with at least one incoming email
      isMatchingTab = thread.emails.some(e => isInboxEmail(e) && e.status !== 'draft');
    } else if (subTab === 'drafts') {
      // Drafts contains threads where the latest active email is a draft
      isMatchingTab = thread.latestEmail.status === 'draft';
    } else {
      // Sent contains threads with at least one outbound email sent by Founder
      isMatchingTab = thread.emails.some(e => !isInboxEmail(e) && e.status === 'sent');
    }
    
    const isMatchingSearch = 
      thread.baseSubject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.emails.some(e => 
        e.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.body.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
    return isMatchingTab && isMatchingSearch;
  });

  // Auto-select first thread if none is selected and not composing
  useEffect(() => {
    if (!loading && filteredThreads.length > 0 && !selectedThreadId && !isComposing) {
      setSelectedThreadId(filteredThreads[0].id);
    }
  }, [filteredThreads, loading, selectedThreadId, isComposing]);

  // Redirect auto-selection from notifications portal
  useEffect(() => {
    const targetEmailId = localStorage.getItem('nvmix_selected_email_id');
    if (targetEmailId && allThreads.length > 0) {
      const targetThread = allThreads.find(t => t.emails.some(e => e.id === targetEmailId));
      if (targetThread) {
        setSelectedThreadId(targetThread.id);
        localStorage.removeItem('nvmix_selected_email_id');
      }
    }
  }, [allThreads]);

  const selectedThread = filteredThreads.find(t => t.id === selectedThreadId);

  // Tab counts
  const inboxCount = allThreads.filter(t => t.emails.some(e => isInboxEmail(e) && e.status !== 'draft')).length;
  const draftCount = allThreads.filter(t => t.latestEmail.status === 'draft').length;
  const sentCount = allThreads.filter(t => t.emails.some(e => !isInboxEmail(e) && e.status === 'sent')).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4 h-full">
      
      {/* Main Split Pane Workspace */}
      <div className="flex-1 flex overflow-hidden h-full gap-5">
        
        {/* ==================== LEFT COLUMN: EMAIL LIST ==================== */}
        <div className="w-[320px] md:w-[350px] shrink-0 flex flex-col pr-5 border-r border-[var(--border-primary)]/20 h-full overflow-hidden select-none">
          
          {/* Compose New Email Button */}
          <button
            onClick={() => {
              setIsComposing(true);
              setSelectedThreadId(null);
              setReplyingToId(null);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-4 rounded-xl text-xs font-black tracking-widest uppercase bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white shadow-md shadow-blue-500/15 transition-all cursor-pointer hover:shadow-lg shrink-0 border border-blue-400/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Compose Email</span>
          </button>

          {/* Fast Workspace Uploader Panel */}
          <div className="mb-4 p-3 bg-[var(--bg-surface)] border border-dashed border-[var(--border-primary)]/80 hover:border-blue-500/40 rounded-xl transition-all duration-300 relative group/upload select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover/upload:scale-105 transition-transform">
                <Paperclip className="w-4 h-4 text-blue-555" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-black uppercase text-[var(--text-primary)] tracking-wide">
                  Fast Drive Uploader
                </h4>
                <p className="text-[8px] text-[var(--text-secondary)] truncate">
                  Word, Excel, PDF, or Scripts
                </p>
              </div>
              <button
                type="button"
                disabled={emailUploading}
                onClick={() => {
                  setUploadContext(isComposing ? 'compose' : replyingToId ? 'reply' : 'compose');
                  setTimeout(() => emailFileInputRef.current?.click(), 55);
                }}
                className="px-2.5 py-1 text-[8.5px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-450 hover:bg-blue-500/10 border border-blue-500/20 rounded-lg cursor-pointer shrink-0 transition-colors"
              >
                {emailUploading ? '...' : 'Upload'}
              </button>
            </div>
          </div>

          {/* Segmented Sub-tabs */}
          <div className="flex bg-[var(--bg-surface)] border border-[var(--border-primary)] p-0.5 rounded-xl shadow-inner shrink-0 text-[9px] font-black uppercase tracking-wider mb-3">
            <button
              onClick={() => { setSubTab('inbox'); setSelectedThreadId(null); setReplyingToId(null); setIsComposing(false); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                subTab === 'inbox' && !isComposing
                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-450 font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              Inbox ({inboxCount})
            </button>
            <button
              onClick={() => { setSubTab('drafts'); setSelectedThreadId(null); setReplyingToId(null); setIsComposing(false); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                subTab === 'drafts' && !isComposing
                  ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-455 font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              Drafts ({draftCount})
            </button>
            <button
              onClick={() => { setSubTab('sent'); setSelectedThreadId(null); setReplyingToId(null); setIsComposing(false); }}
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

          {/* Scrollable Threads List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1 pb-6">
            {loading ? (
              <div className="text-center py-20 text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Retrieving mailbox...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="border border-dashed border-[var(--border-primary)] rounded-xl py-16 px-4 text-center text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-2 bg-[var(--bg-card)]/25">
                <Mail className="w-6 h-6 text-[var(--text-secondary)] animate-bounce" />
                <span>Empty Mailbox</span>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = selectedThreadId === thread.id;
                let timeStr = '';
                try {
                  timeStr = new Date(thread.latestTimestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
                } catch {
                  timeStr = '';
                }

                // Render sender circle based on the latest sender
                const latestEmail = thread.latestEmail;
                const participantsText = thread.participants.join(', ');

                return (
                  <div
                    key={thread.id}
                    onClick={() => { setSelectedThreadId(thread.id); setReplyingToId(null); setIsComposing(false); }}
                    className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all duration-200 select-none relative overflow-hidden group ${
                      isSelected
                        ? 'border-blue-500/35 bg-blue-500/5 shadow-sm'
                        : 'border-[var(--border-primary)] bg-[var(--bg-surface)] hover:border-blue-500/15 hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500" />
                    )}

                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${getAvatarGradient(latestEmail.from)} flex items-center justify-center font-bold text-xs shrink-0`}>
                      {getAvatarInitials(latestEmail.from)}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9.5px] font-black uppercase text-[var(--text-primary)] truncate max-w-[130px] group-hover:text-blue-550 transition-colors">
                          {participantsText}
                        </span>
                        <span className="text-[8px] font-mono text-[var(--text-secondary)] shrink-0">
                          {timeStr}
                        </span>
                      </div>
                      <h4 className="text-[11px] font-bold text-[var(--text-primary)] truncate mt-1 leading-tight">
                        {thread.baseSubject}
                      </h4>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate mt-1 font-medium font-sans">
                        {latestEmail.body}
                      </p>
                      
                      {/* Counter Badge if thread has replies */}
                      {thread.emails.length > 1 && (
                        <span className="inline-block text-[7.5px] font-black font-mono text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded mt-2 border border-blue-500/15 leading-none">
                          {thread.emails.length} Mails
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* ==================== RIGHT COLUMN: EMAIL READER / COMPOSE PANEL ==================== */}
        <div className="flex-grow flex flex-col h-full overflow-hidden relative">
          
          {isComposing ? (
            /* ==================== COMPOSE PANEL ==================== */
            <form onSubmit={handleSendNewCompose} className="flex-grow flex flex-col h-full overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-lg relative select-none">
              <div className="p-6 border-b border-[var(--border-primary)]/20 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Mail className="w-4.5 h-4.5 text-blue-555 animate-pulse" />
                  <h2 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider block">
                  New Message
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
                    <span>Email sent successfully!</span>
                  </div>
                )}

                {/* Dropdown Recipient */}
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Send To</label>
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
                  <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Subject Directive</label>
                  <input
                    type="text"
                    required
                    value={composeSubject}
                    onChange={e => setComposeSubject(e.target.value)}
                    placeholder="e.g. Create Stock Market Plan"
                    className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner placeholder-[var(--text-secondary)]/40"
                  />
                </div>

                {/* Body instructions */}
                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Instructions Content</label>
                  <textarea
                    required
                    rows={8}
                    value={composeBody}
                    onChange={e => setComposeBody(e.target.value)}
                    placeholder="Describe what the agent should swarm on in clean detail..."
                    className="w-full px-3.5 py-3 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner placeholder-[var(--text-secondary)]/40 flex-1 resize-none"
                  />
                </div>
              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={emailFileInputRef}
                onChange={handleEmailFileUpload}
                style={{ display: 'none' }}
              />

              {/* Footer submit */}
              <div className="p-4.5 bg-[var(--bg-card)] border-t border-[var(--border-primary)]/20 flex justify-between items-center gap-3 shrink-0">
                <button
                  type="button"
                  disabled={emailUploading}
                  onClick={() => {
                    setUploadContext('compose');
                    setTimeout(() => emailFileInputRef.current?.click(), 55);
                  }}
                  className="h-9 px-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-blue-550 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                  title="Upload Word, Excel, PDF, or code files"
                >
                  {emailUploading ? (
                    <div className="w-3.5 h-3.5 border-2 border-t-transparent border-blue-550 rounded-full animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4 text-blue-500 animate-pulse" />
                  )}
                  <span>Attach File</span>
                </button>

                <div className="flex gap-3">
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
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-white" />
                        <span>Send Directive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : selectedThread ? (
            /* ==================== EMAIL CONVERSATION THREAD READER ==================== */
            <div className="flex-grow flex flex-col h-full overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-lg relative">
              
              {/* Pinned Conversation Stack */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5 pb-32">
                
                {/* Thread Header Title */}
                <div className="flex justify-between items-start border-b border-[var(--border-primary)]/20 pb-5 select-none shrink-0">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-450 border border-blue-500/15">
                      Conversation ({selectedThread.emails.length} message{selectedThread.emails.length > 1 ? 's' : ''})
                    </span>
                    <h2 className="text-base font-extrabold text-[var(--text-primary)] tracking-tight leading-tight select-text">
                      {selectedThread.baseSubject}
                    </h2>
                  </div>
                  
                  <div className="shrink-0 text-[9px] font-mono font-bold">
                    {selectedThread.latestEmail.status === 'draft' ? (
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

                {/* Chronological Message Cards (email, reply, email, reply...) */}
                <div className="relative pl-2 space-y-6 select-text font-sans">
                  {/* Vertical Timeline Thread Connector Line */}
                  <div className="absolute left-5 top-7 bottom-7 w-0.5 bg-gradient-to-b from-blue-500/35 via-indigo-500/15 to-transparent pointer-events-none" />

                  {selectedThread.emails.map((email, index) => {
                    const isFromFounder = !isInboxEmail(email);
                    let timeStr = '';
                    try {
                      timeStr = new Date(email.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    } catch {
                      timeStr = '';
                    }

                    return (
                      <div key={email.id} className="flex gap-4 relative">
                        {/* Timeline Node Column */}
                        <div className="flex flex-col items-center shrink-0 w-6 justify-start pt-7 select-none">
                          <div className={`w-3 h-3 rounded-full border-2 z-10 transition-all ${
                            isFromFounder 
                              ? 'bg-blue-600 border-blue-400/40 shadow-[0_0_8px_rgba(37,99,235,0.4)] animate-pulse' 
                              : 'bg-[var(--bg-card)] border-[var(--border-primary)] shadow-sm'
                          }`} />
                        </div>

                        {/* Message Card Column */}
                        <div 
                          className={`flex-1 border rounded-2xl p-5 flex flex-col space-y-3.5 shadow-sm transition-all relative overflow-hidden backdrop-blur-md ${
                            isFromFounder
                              ? 'bg-indigo-500/[0.04] border-indigo-500/15 border-l-4 border-l-indigo-400 ml-4 mr-1'
                              : 'bg-[var(--bg-card)] border-[var(--border-primary)] mr-4 ml-1'
                          }`}
                        >
                          {/* Glow indicator for active drafts */}
                          {email.status === 'draft' && (
                            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-yellow-500/5 blur-2xl pointer-events-none" />
                          )}

                          {/* Card Header (Sender, Recipient, Time) */}
                          <div className="flex items-center justify-between border-b border-[var(--border-primary)]/15 pb-2.5 select-none">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${getAvatarGradient(email.from)} flex items-center justify-center font-bold text-xs shrink-0`}>
                                {getAvatarInitials(email.from)}
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase text-[var(--text-primary)] block leading-tight">
                                  {email.from}
                                </span>
                                <span className="text-[7.5px] font-mono text-[var(--text-secondary)] uppercase tracking-wider block mt-0.5">
                                  To: {email.to}
                                </span>
                              </div>
                            </div>
                            
                            <span className="text-[8.5px] font-mono text-[var(--text-secondary)] shrink-0">
                              {timeStr}
                            </span>
                          </div>

                          {/* Message body with preserved line breaks */}
                          <div className="text-xs text-[var(--text-primary)] font-medium leading-relaxed font-sans select-text whitespace-pre-wrap">
                            {email.body}
                          </div>

                          {/* Inline draft actions */}
                          {email.status === 'draft' && (
                            <div className="flex justify-end gap-3 select-none pt-3 border-t border-[var(--border-primary)]/15">
                              <button
                                onClick={() => handleUpdateStatus(email.id, 'cancelled')}
                                className="h-8 px-3.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Wipe Draft</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(email.id, 'sent')}
                                className="h-8 px-3.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-[9px] font-black tracking-widest uppercase flex items-center gap-1 transition-all shadow-md shadow-blue-500/10 cursor-pointer border border-blue-400/20"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Approve & Send</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={emailFileInputRef}
                onChange={handleEmailFileUpload}
                style={{ display: 'none' }}
              />

              {/* Pinned Reply / Actions Absolute Footer */}
              {subTab === 'inbox' && (
                <div className="absolute bottom-0 inset-x-0 bg-[var(--bg-card)] border-t border-[var(--border-primary)]/20 p-4.5 z-10 select-none">
                  {replyingToId === selectedThread.id ? (
                    <div className="space-y-3">
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder={`Type your reply...`}
                        className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner resize-none leading-relaxed placeholder-[var(--text-secondary)]/40 focus:ring-1 focus:ring-blue-500/10"
                      />
                      
                      <div className="flex justify-between items-center w-full gap-3">
                        <button
                          type="button"
                          disabled={emailUploading}
                          onClick={() => {
                            setUploadContext('reply');
                            setTimeout(() => emailFileInputRef.current?.click(), 55);
                          }}
                          className="h-8 px-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-blue-550 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                          title="Upload Word, Excel, PDF, or code files"
                        >
                          {emailUploading ? (
                            <div className="w-3 h-3 border-2 border-t-transparent border-blue-550 rounded-full animate-spin" />
                          ) : (
                            <Paperclip className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                          )}
                          <span>Attach File</span>
                        </button>

                        <div className="flex gap-2">
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
                            onClick={() => handleSendReply(selectedThread)}
                            disabled={sendingReply || !replyText.trim()}
                            className="h-8 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-[9px] font-black tracking-widest uppercase flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-40 border border-blue-400/20"
                          >
                            {sendingReply ? (
                              <>
                                <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5 text-white" />
                                <span>Send</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {replySuccessId === selectedThread.id && (
                        <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-555 text-[10px] font-mono select-none animate-slideUp">
                          <CheckCircle2 className="w-4 h-4 text-emerald-550 shrink-0" />
                          <span>Reply sent!</span>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          setReplyingToId(selectedThread.id);
                          setReplyText('');
                        }}
                        className="h-9 px-4 rounded-xl bg-blue-500/10 border border-blue-500/25 hover:bg-blue-600/15 hover:border-blue-500/40 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer select-none self-start"
                      >
                        <CornerUpLeft className="w-4 h-4 text-blue-500" />
                        <span>Reply to Thread</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            /* Premium Empty State Screen */
            <div className="flex-grow flex flex-col items-center justify-center p-8 bg-[var(--bg-card)] border border-[var(--border-primary)]/45 rounded-2xl shadow-lg select-none">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-blue-500/5 blur-xl w-16 h-16 pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center relative">
                  <Mail className="w-7 h-7 text-blue-500 animate-pulse" />
                  <Sparkles className="w-4.5 h-4.5 text-blue-400 absolute -top-1 -right-1 animate-bounce" />
                </div>
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                Autonomous Mail Intelligence
              </h3>
              <p className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-widest mt-2 block">
                Select a thread to read
              </p>
              
              {/* Telemetry Stats inside Empty State */}
              <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-sm text-center">
                <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)]/30 rounded-xl space-y-1">
                  <span className="text-[8px] font-black text-blue-500 uppercase block leading-none">Inbox</span>
                  <span className="text-xs font-black text-[var(--text-primary)]">{inboxCount} threads</span>
                </div>
                <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)]/30 rounded-xl space-y-1">
                  <span className="text-[8px] font-black text-yellow-500 uppercase block leading-none">Drafts</span>
                  <span className="text-xs font-black text-[var(--text-primary)]">{draftCount} threads</span>
                </div>
                <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)]/30 rounded-xl space-y-1">
                  <span className="text-[8px] font-black text-emerald-500 uppercase block leading-none">Sent</span>
                  <span className="text-xs font-black text-[var(--text-primary)]">{sentCount} threads</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
