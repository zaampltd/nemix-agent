"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Search, Send, X, Trash2, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Inbox } from 'lucide-react';
import { Email } from '@/lib/types';

export default function EmailView() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'inbox' | 'drafts' | 'sent'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

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
        // Refetch emails list
        fetchEmails();
      }
    } catch (err) {
      console.error('Failed to update email status:', err);
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
      // sent: status is 'sent' AND not an inbox email (avoid duplicates)
      isMatchingTab = email.status === 'sent' && !isInboxEmail(email);
    }
    const isMatchingSearch = 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body.toLowerCase().includes(searchQuery.toLowerCase());
    return isMatchingTab && isMatchingSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedEmailId(prev => (prev === id ? null : id));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      
      {/* Header */}
      <div className="flex justify-between items-center shrink-0 border-b border-[var(--border-primary)]/30 pb-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-center">
            <Mail className="w-4.5 h-4.5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider block leading-none">
              Autonomous Swarm Mailroom
            </h3>
            <span className="text-[8px] text-[var(--text-secondary)] uppercase font-mono tracking-widest mt-1 block">
              review and authorize outgoing agent communications
            </span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-[var(--bg-surface)] border border-[var(--border-primary)] p-1 rounded-xl shadow-inner shrink-0 text-[10px] font-bold uppercase tracking-wider">
          <button
            onClick={() => { setSubTab('inbox'); setExpandedEmailId(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'inbox'
                ? 'bg-purple-600/15 border border-purple-500/20 text-purple-400 font-extrabold'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Inbox ({emails.filter(e => e.to.toLowerCase().includes('founder') || e.to.toLowerCase().includes('you')).length})
          </button>
          <button
            onClick={() => { setSubTab('drafts'); setExpandedEmailId(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'drafts'
                ? 'bg-purple-600/15 border border-purple-500/20 text-purple-400 font-extrabold'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Review Queue ({emails.filter(e => e.status === 'draft').length})
          </button>
          <button
            onClick={() => { setSubTab('sent'); setExpandedEmailId(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'sent'
                ? 'bg-purple-600/15 border border-purple-500/20 text-purple-400 font-extrabold'
                : 'text-[var(--text-secondary)] hover:text-white'
            }`}
          >
            Sent Archive ({emails.filter(e => e.status === 'sent' && !(e.to.toLowerCase().includes('founder') || e.to.toLowerCase().includes('you'))).length})
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative shrink-0 select-none">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search corporate emails by subject, recipient, sender, body..."
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-purple-500/40 shadow-inner"
        />
      </div>

      {/* Emails list */}
      <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-3.5 pb-6">
        {loading ? (
          <div className="text-center py-20 text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest animate-pulse select-none">
            Retrieving mailbox entries...
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="border border-dashed border-[var(--border-primary)] rounded-2xl py-20 text-center text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-2 select-none">
            <Mail className="w-8 h-8 text-[var(--text-muted)]" />
            <span>{subTab === 'inbox' ? 'No emails in your inbox' : subTab === 'drafts' ? 'No emails awaiting review' : 'No sent emails found'}</span>
            {subTab === 'inbox' && (
              <p className="text-[9px] text-[var(--text-muted)] font-medium lowercase tracking-normal max-w-xs mt-1 leading-normal">
                Emails addressed to you (Founder) from your swarm agents will appear here.
              </p>
            )}
            {subTab === 'drafts' && (
              <p className="text-[9px] text-[var(--text-muted)] font-medium lowercase tracking-normal max-w-xs mt-1 leading-normal">
                Agents draft professional outbound communications (e.g. investor pitches, marketing dispatches, code sync briefs) for your authorization.
              </p>
            )}
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isExpanded = expandedEmailId === email.id;
            let timeStr = '';
            try {
              timeStr = new Date(email.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            } catch {
              timeStr = '';
            }

            return (
              <div 
                key={email.id} 
                className={`bg-[var(--bg-card)] border rounded-2xl transition-all duration-300 shadow-md ${
                  isExpanded 
                    ? 'border-purple-500/25 bg-[var(--bg-surface-hover)] shadow-lg' 
                    : 'border-[var(--border-primary)] hover:border-purple-500/15 hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {/* Collapsed Header view */}
                <div 
                  onClick={() => toggleExpand(email.id)}
                  className="p-4.5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className="w-9 h-9 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                      <Mail className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black uppercase text-[var(--text-primary)] truncate leading-tight group-hover:text-purple-400">
                        {email.subject}
                      </h4>
                      <p className="text-[8px] text-[var(--text-secondary)] uppercase mt-1.5 font-mono font-semibold tracking-wide">
                        From: <span className="text-[var(--text-primary)] font-bold">{email.from}</span> • To: <span className="text-[var(--text-primary)] font-bold">{email.to}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0 font-mono text-[9px] font-bold text-[var(--text-secondary)]">
                    <span>{timeStr}</span>
                    {isExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                  </div>
                </div>

                {/* Expanded content view */}
                {isExpanded && (
                  <div className="px-6 pb-5 pt-1.5 border-t border-[var(--border-primary)]/30 space-y-4 animate-fadeIn">
                    <div className="space-y-1">
                      <div className="text-[8px] font-black text-purple-400 uppercase tracking-widest select-none">
                        Email Message Details
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-mono space-y-0.5 select-all">
                        <div><strong className="text-[var(--text-primary)]">Sender:</strong> {email.from}</div>
                        <div><strong className="text-[var(--text-primary)]">Recipient:</strong> {email.to}</div>
                        <div><strong className="text-[var(--text-primary)]">Subject:</strong> {email.subject}</div>
                      </div>
                    </div>

                    <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)]/40 p-4.5 rounded-xl text-xs text-[var(--text-primary)] font-medium leading-relaxed select-text shadow-inner">
                      {email.body.split('\n').map((para, i) => (
                        <p key={i} className={i > 0 ? 'mt-3.5' : ''}>{para}</p>
                      ))}
                    </div>

                    {email.status === 'draft' && (
                      <div className="flex justify-end gap-3 select-none">
                        <button
                          onClick={() => handleUpdateStatus(email.id, 'cancelled')}
                          className="h-8.5 px-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[9px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Wipe Draft</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(email.id, 'sent')}
                          className="h-8.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white text-[9px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/10 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-white" />
                          <span>Approve & Send</span>
                        </button>
                      </div>
                    )}

                    {email.status === 'sent' && (
                      <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-wider select-none justify-end">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Dispatched successfully</span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
