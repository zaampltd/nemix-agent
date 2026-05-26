"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, Search, Send, Trash2, CheckCircle2, ChevronRight, 
  AlertCircle, Inbox, User, CornerUpLeft, Clock, Shield, Sparkles 
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
  if (lower.includes('ceo')) return 'from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10';
  if (lower.includes('hr') || lower.includes('helen')) return 'from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/10';
  if (lower.includes('architect') || lower.includes('design')) return 'from-purple-500 to-pink-600 text-white shadow-md shadow-purple-500/10';
  if (lower.includes('coder') || lower.includes('developer') || lower.includes('dev')) return 'from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/10';
  if (lower.includes('founder') || lower.includes('you')) return 'from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/10';
  return 'from-slate-500 to-slate-700 text-white';
};

export default function EmailView() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'inbox' | 'drafts' | 'sent'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccessId, setReplySuccessId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchEmails();
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

  // Auto-select first email in tab if none is selected
  useEffect(() => {
    if (!loading && filteredEmails.length > 0 && !selectedEmailId) {
      setSelectedEmailId(filteredEmails[0].id);
    }
  }, [filteredEmails, loading, selectedEmailId]);

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
          
          {/* Segmented Sub-tabs */}
          <div className="flex bg-[var(--bg-surface)] border border-[var(--border-primary)] p-0.5 rounded-xl shadow-inner shrink-0 text-[9px] font-black uppercase tracking-wider mb-3">
            <button
              onClick={() => { setSubTab('inbox'); setSelectedEmailId(null); setReplyingToId(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                subTab === 'inbox'
                  ? 'bg-purple-600/15 border border-purple-500/20 text-purple-400 font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Inbox ({inboxCount})
            </button>
            <button
              onClick={() => { setSubTab('drafts'); setSelectedEmailId(null); setReplyingToId(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                subTab === 'drafts'
                  ? 'bg-purple-600/15 border border-purple-500/20 text-purple-400 font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Drafts ({draftCount})
            </button>
            <button
              onClick={() => { setSubTab('sent'); setSelectedEmailId(null); setReplyingToId(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                subTab === 'sent'
                  ? 'bg-purple-600/15 border border-purple-500/20 text-purple-400 font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
            >
              Sent ({sentCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative shrink-0 mb-3.5">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search mails..."
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-purple-500/40 shadow-inner"
            />
          </div>

          {/* Scrollable Email Row Cards */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1 pb-6">
            {loading ? (
              <div className="text-center py-20 text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Retrieving mailbox...
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="border border-dashed border-[var(--border-primary)] rounded-xl py-12 px-4 text-center text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-2">
                <Mail className="w-6 h-6 text-[var(--text-muted)]" />
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
                    onClick={() => { setSelectedEmailId(email.id); setReplyingToId(null); }}
                    className={`p-3.5 border rounded-xl flex items-start gap-3 cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? 'border-purple-500/35 bg-purple-500/5 shadow-md'
                        : 'border-[var(--border-primary)] bg-[var(--bg-surface)] hover:border-purple-500/15 hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    {/* Circle Avatar initials */}
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${getAvatarGradient(email.from)} flex items-center justify-center font-bold text-xs shrink-0`}>
                      {getAvatarInitials(email.from)}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase text-[var(--text-primary)] truncate max-w-[130px]">
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

        {/* ==================== RIGHT COLUMN: EMAIL READER ==================== */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {selectedEmail ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-lg relative">
              
              {/* Scrollable Reader Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-32">
                
                {/* Header Title section */}
                <div className="flex justify-between items-start border-b border-[var(--border-primary)]/20 pb-5">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-purple-600/10 text-purple-400 border border-purple-500/10">
                      Telemetry Thread
                    </span>
                    <h2 className="text-base font-black text-[var(--text-primary)] tracking-tight leading-tight select-text">
                      {selectedEmail.subject}
                    </h2>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="shrink-0 text-[9px] font-mono font-bold">
                    {selectedEmail.status === 'draft' ? (
                      <span className="text-yellow-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" /> Pending Review
                      </span>
                    ) : (
                      <span className="text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_4px_#10b981]" /> Dispatched
                      </span>
                    )}
                  </div>
                </div>

                {/* Sender/Recipient Detail Pane */}
                <div className="flex items-center gap-4 bg-[var(--bg-surface)] p-3 border border-[var(--border-primary)] rounded-xl select-none">
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
                      className="h-9 px-4.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span>Wipe Draft</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedEmail.id, 'sent')}
                      className="h-9 px-4.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/15 cursor-pointer"
                    >
                      <Send className="w-4 h-4 text-white" />
                      <span>Approve & Discard Outbound</span>
                    </button>
                  </div>
                )}

              </div>

              {/* Pinned Reply / Actions Absolute Footer */}
              {subTab === 'inbox' && (
                <div className="absolute bottom-0 inset-x-0 bg-[var(--bg-card)] border-t border-[var(--border-primary)]/20 p-4.5 z-10">
                  {replyingToId === selectedEmail.id ? (
                    <div className="space-y-3">
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder={`Instruct ${selectedEmail.from}... (e.g. "Hire a frontend developer" or "optimize compilation seeders")`}
                        className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-purple-500/40 shadow-inner resize-none leading-relaxed"
                      />
                      <div className="flex justify-end gap-3 select-none">
                        <button
                          onClick={() => {
                            setReplyingToId(null);
                            setReplyText('');
                          }}
                          disabled={sendingReply}
                          className="h-8 px-3.5 rounded-lg border border-[var(--border-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <span>Cancel</span>
                        </button>
                        <button
                          onClick={() => handleSendReply(selectedEmail)}
                          disabled={sendingReply || !replyText.trim()}
                          className="h-8 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-[9px] font-extrabold tracking-widest uppercase flex items-center gap-1 transition-all shadow-md shadow-purple-500/10 cursor-pointer disabled:opacity-40"
                        >
                          {sendingReply ? (
                            <>
                              <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full animate-spin" />
                              <span>Swarming...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3 text-white" />
                              <span>Dispatch Reply</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {replySuccessId === selectedEmail.id && (
                        <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-[10px] font-mono select-none animate-slideUp">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>Reply dispatched! {selectedEmail.from} is swarming on your requests in the background.</span>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          setReplyingToId(selectedEmail.id);
                          setReplyText('');
                        }}
                        className="h-9 px-4 rounded-xl bg-purple-600/15 border border-purple-500/20 hover:bg-purple-600/25 text-purple-400 text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer select-none self-start"
                      >
                        <CornerUpLeft className="w-4.5 h-4.5 text-purple-400" />
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
                <div className="absolute inset-0 rounded-full bg-purple-500/5 blur-xl w-16 h-16 pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-center relative">
                  <Mail className="w-7 h-7 text-purple-400 animate-pulse" />
                  <Sparkles className="w-4.5 h-4.5 text-purple-300 absolute -top-1 -right-1 animate-bounce" />
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
                  <span className="text-[8px] font-black text-blue-400 uppercase block leading-none">Inbox</span>
                  <span className="text-xs font-black text-[var(--text-primary)]">{inboxCount} threads</span>
                </div>
                <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)]/30 rounded-xl space-y-1">
                  <span className="text-[8px] font-black text-yellow-500 uppercase block leading-none">Drafts</span>
                  <span className="text-xs font-black text-[var(--text-primary)]">{draftCount} items</span>
                </div>
                <div className="p-3 bg-[var(--bg-surface)] border border-[var(--border-primary)]/30 rounded-xl space-y-1">
                  <span className="text-[8px] font-black text-emerald-400 uppercase block leading-none">Sent</span>
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
