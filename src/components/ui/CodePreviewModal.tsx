"use client";

import React, { useState, useMemo } from 'react';
import { X, Copy, Check, FileText, Code2, User, Briefcase, Activity, ChevronDown, ChevronUp, Hash } from 'lucide-react';

interface CodePreviewModalProps {
  code: string | null;
  onClose: () => void;
}

type ContentType = 'agents' | 'json-cards' | 'code' | 'text';

function detectContentType(content: string): ContentType {
  const trimmed = content.trim();

  // Try parsing as JSON array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object') {
        // Check if it looks like agent data
        const hasAgentFields = arr.some((item: any) =>
          item.role || item.name || item.status || item.id?.includes('agent')
        );
        if (hasAgentFields) return 'agents';
        return 'json-cards';
      }
    } catch {}
  }

  // Try parsing as JSON object
  if ((trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try { JSON.parse(trimmed); return 'json-cards'; } catch {}
  }

  // Code detection
  const codeSignals = ['function ', 'const ', 'let ', 'var ', 'def ', 'class ', 'import ', 'export ', '=>'];
  if (codeSignals.some(s => trimmed.includes(s)) && trimmed.split('\n').length > 3) {
    return 'code';
  }

  return 'text';
}

/** Status badge colors */
function statusColor(status: string) {
  const s = (status || '').toLowerCase();
  if (s === 'working' || s === 'active' || s === 'done' || s === 'completed')
    return { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34d399', dot: '#10b981' };
  if (s === 'sleeping' || s === 'idle')
    return { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.22)', text: '#a5b4fc', dot: '#6366f1' };
  if (s === 'error' || s === 'failed')
    return { bg: 'rgba(244,63,94,0.10)', border: 'rgba(244,63,94,0.22)', text: '#fb7185', dot: '#f43f5e' };
  return { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', text: '#94a3b8', dot: '#64748b' };
}

/** Emoji avatars → gradient fallback color */
function avatarColor(avatar: string): string {
  const colors: Record<string, string> = {
    '🤖': 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    '💻': 'linear-gradient(135deg,#0ea5e9,#6366f1)',
    '🛡': 'linear-gradient(135deg,#10b981,#059669)',
    '🔵': 'linear-gradient(135deg,#0ea5e9,#2563eb)',
    '🏗': 'linear-gradient(135deg,#f59e0b,#ef4444)',
    '📊': 'linear-gradient(135deg,#ec4899,#8b5cf6)',
    '⚖': 'linear-gradient(135deg,#f59e0b,#fbbf24)',
  };
  for (const [emoji, grad] of Object.entries(colors)) {
    if (avatar?.includes(emoji)) return grad;
  }
  return 'linear-gradient(135deg,#6366f1,#8b5cf6)';
}

/** Render beautiful agent profile cards */
function AgentCards({ data }: { data: any[] }) {
  return (
    <div className="p-6 grid grid-cols-1 gap-4 overflow-auto">
      {data.map((agent: any, i: number) => {
        const sc = statusColor(agent.status || '');
        const avatar = agent.avatar || '🤖';
        return (
          <div
            key={i}
            className="rounded-2xl p-5 flex items-start gap-5 transition-all duration-200"
            style={{
              background: 'rgba(15,18,32,0.7)',
              border: '1px solid rgba(99,102,241,0.12)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            }}
          >
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-lg"
              style={{ background: avatarColor(avatar) }}
            >
              {avatar}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name + Status */}
              <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
                <h3 className="text-[15px] font-bold text-white leading-tight truncate">
                  {agent.name || 'Unnamed Agent'}
                </h3>
                <span
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                  style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: sc.dot, boxShadow: `0 0 6px ${sc.dot}` }}
                  />
                  {agent.status || 'Unknown'}
                </span>
              </div>

              {/* Role */}
              <div className="flex items-center gap-1.5 mb-3">
                <Briefcase className="w-3 h-3 shrink-0" style={{ color: '#a5b4fc' }} />
                <span className="text-[12px] font-semibold" style={{ color: '#a5b4fc' }}>
                  {agent.role || 'No Role Assigned'}
                </span>
              </div>

              {/* Meta pills */}
              <div className="flex flex-wrap gap-2">
                {agent.id && (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.16)', color: '#818cf8' }}
                  >
                    <Hash className="w-2.5 h-2.5" />
                    {agent.id}
                  </span>
                )}
                {agent.department && (
                  <span
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', color: '#34d399' }}
                  >
                    {agent.department}
                  </span>
                )}
                {agent.skills && Array.isArray(agent.skills) && agent.skills.map((skill: string, si: number) => (
                  <span
                    key={si}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', color: '#fbbf24' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Render generic JSON as beautiful key-value cards */
function JsonCards({ data }: { data: any[] | Record<string, any> }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <div className="p-6 space-y-4">
      {items.map((item: any, i: number) => (
        <div
          key={i}
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(15,18,32,0.7)',
            border: '1px solid rgba(99,102,241,0.12)',
          }}
        >
          {items.length > 1 && (
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#6366f1' }}>
              Record {i + 1}
            </p>
          )}
          <div className="space-y-2">
            {Object.entries(item).map(([key, value]) => (
              <div key={key} className="flex items-start gap-3">
                <span
                  className="text-[11px] font-bold uppercase tracking-wide shrink-0 w-28"
                  style={{ color: '#a5b4fc' }}
                >
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="text-[12px] leading-relaxed flex-1" style={{ color: '#e2e8f0' }}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Render plain text as a clean English report */
function TextReport({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="p-6 space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        if (trimmed.endsWith(':') && trimmed.length < 60) {
          return (
            <h3 key={i} className="text-[11px] font-black uppercase tracking-widest pt-3 pb-1 first:pt-0" style={{ color: '#a5b4fc' }}>
              {trimmed.replace(/:$/, '')}
            </h3>
          );
        }
        if (/^[•\-*]/.test(trimmed)) {
          return (
            <div key={i} className="flex items-start gap-2.5 pl-2">
              <span className="text-indigo-400 text-xs mt-0.5 shrink-0">▸</span>
              <p className="text-[13px] leading-relaxed" style={{ color: '#e2e8f0' }}>
                {trimmed.replace(/^[•\-*]\s*/, '')}
              </p>
            </div>
          );
        }
        if (/^\d+\./.test(trimmed)) {
          return (
            <div key={i} className="flex items-start gap-2.5 pl-2">
              <span className="text-[11px] font-bold shrink-0 w-5 text-right" style={{ color: '#6366f1' }}>
                {trimmed.match(/^\d+/)?.[0]}.
              </span>
              <p className="text-[13px] leading-relaxed" style={{ color: '#e2e8f0' }}>
                {trimmed.replace(/^\d+\.\s*/, '')}
              </p>
            </div>
          );
        }
        return (
          <p key={i} className="text-[13px] leading-relaxed" style={{ color: '#cbd5e1' }}>
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

/** Render code with line numbers */
function CodeView({ content }: { content: string }) {
  const lines = content.replace(/```[\w]*\n?/g, '').replace(/```\n?/g, '').trim().split('\n');
  return (
    <div className="flex p-5 font-mono text-xs leading-relaxed select-text">
      <div className="text-right pr-4 border-r shrink-0 flex flex-col select-none"
        style={{ color: 'rgba(148,163,184,0.4)', borderColor: 'rgba(99,102,241,0.12)' }}>
        {lines.map((_, i) => (
          <span key={i} className="block h-5 text-[10px] font-bold leading-5">
            {(i + 1).toString().padStart(2, '0')}
          </span>
        ))}
      </div>
      <pre className="pl-4 flex-1 overflow-x-auto text-[11px] leading-relaxed" style={{ color: '#e2e8f0' }}>
        {lines.map((line, i) => (
          <code key={i} className="block h-5 whitespace-pre leading-5">{line || ' '}</code>
        ))}
      </pre>
    </div>
  );
}

// ─── Main Modal Component ───────────────────────────────────────────────────

export default function CodePreviewModal({ code, onClose }: CodePreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  if (!code) return null;

  const contentType = useMemo(() => detectContentType(code), [code]);
  const parsedData = useMemo(() => {
    try { return JSON.parse(code.trim()); } catch { return null; }
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const typeLabel: Record<ContentType, string> = {
    agents: 'AI Agent Profiles',
    'json-cards': 'Data Report',
    code: 'Source Code',
    text: 'Agent Report',
  };

  const typeBadge: Record<ContentType, { label: string; color: string; bg: string; border: string }> = {
    agents:      { label: 'AGENTS',  color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)' },
    'json-cards':{ label: 'DATA',    color: '#34d399', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.25)' },
    code:        { label: 'CODE',    color: '#c084fc', bg: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.25)' },
    text:        { label: 'ENGLISH', color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.25)' },
  };

  const badge = typeBadge[contentType];
  const lineCount = code.split('\n').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(160deg, rgba(15,18,32,0.98) 0%, rgba(10,12,26,0.98) 100%)',
          border: '1px solid rgba(99,102,241,0.18)',
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Top aurora line */}
        <div className="h-px w-full shrink-0" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.6) 30%, rgba(139,92,246,0.5) 60%, transparent 100%)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 select-none"
          style={{ borderBottom: '1px solid rgba(99,102,241,0.10)' }}>
          <div className="flex items-center gap-3">
            {/* macOS dots */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
            </div>
            <div className="w-px h-4" style={{ background: 'rgba(99,102,241,0.2)' }} />
            <div className="flex items-center gap-2">
              {contentType === 'agents' ? (
                <User className="w-3.5 h-3.5" style={{ color: '#a5b4fc' }} />
              ) : contentType === 'code' ? (
                <Code2 className="w-3.5 h-3.5" style={{ color: '#c084fc' }} />
              ) : (
                <FileText className="w-3.5 h-3.5" style={{ color: '#a5b4fc' }} />
              )}
              <span className="text-[12px] font-bold text-white/80">{typeLabel[contentType]}</span>
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest"
                style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}
              >
                {badge.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(contentType === 'agents' || contentType === 'json-cards') && (
              <button
                onClick={() => setShowRaw(r => !r)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                style={{
                  background: showRaw ? 'rgba(99,102,241,0.16)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  color: showRaw ? '#a5b4fc' : 'rgba(148,163,184,0.7)',
                }}
              >
                {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showRaw ? 'Formatted' : 'Raw'}
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider cursor-pointer transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: 'rgba(148,163,184,0.8)',
              }}
            >
              {copied ? (
                <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
              ) : (
                <><Copy className="w-3 h-3" /><span>Copy</span></>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer transition-all"
              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.18)', color: '#fb7185' }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {showRaw ? (
            <CodeView content={code} />
          ) : contentType === 'agents' && Array.isArray(parsedData) ? (
            <AgentCards data={parsedData} />
          ) : contentType === 'json-cards' && parsedData ? (
            <JsonCards data={parsedData} />
          ) : contentType === 'code' ? (
            <CodeView content={code} />
          ) : (
            <TextReport content={code} />
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 flex items-center justify-between shrink-0 select-none"
          style={{ borderTop: '1px solid rgba(99,102,241,0.10)', background: 'rgba(8,10,20,0.5)' }}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.4)' }}>
            {contentType === 'agents'
              ? `${Array.isArray(parsedData) ? parsedData.length : 0} Agent${Array.isArray(parsedData) && parsedData.length !== 1 ? 's' : ''} Listed`
              : contentType === 'json-cards'
              ? 'Structured Data'
              : contentType === 'code'
              ? 'Source Code'
              : 'Plain English Output'}
          </span>
          <span className="text-[9px] font-mono font-bold" style={{ color: 'rgba(148,163,184,0.3)' }}>
            {lineCount} lines
          </span>
        </div>
      </div>
    </div>
  );
}
