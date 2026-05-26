"use client";

import React, { useState, useMemo } from 'react';
import { X, Copy, Check, FileText, Code2, ChevronDown, ChevronUp } from 'lucide-react';

interface CodePreviewModalProps {
  code: string | null;
  onClose: () => void;
}

/** Try to detect if content is raw JSON / code that needs pretty-printing */
function detectContentType(content: string): 'json' | 'code' | 'text' {
  const trimmed = content.trim();
  // Looks like JSON
  if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && (trimmed.endsWith('}') || trimmed.endsWith(']'))) {
    try { JSON.parse(trimmed); return 'json'; } catch { /* not valid json */ }
  }
  // Looks like code (has multiple { } or function/class/def keywords)
  const codeSignals = ['function ', 'const ', 'let ', 'var ', 'def ', 'class ', 'import ', 'export ', '=>', '```'];
  if (codeSignals.some(s => trimmed.includes(s)) && trimmed.split('\n').length > 3) {
    return 'code';
  }
  return 'text';
}

/** Convert raw JSON into a human-readable English summary */
function jsonToReadable(jsonStr: string): string {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.map((item, i) => {
        if (typeof item === 'object' && item !== null) {
          return `Item ${i + 1}:\n` + Object.entries(item)
            .map(([k, v]) => `  • ${k.charAt(0).toUpperCase() + k.slice(1)}: ${String(v)}`)
            .join('\n');
        }
        return `• ${String(item)}`;
      }).join('\n\n');
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed)
        .map(([k, v]) => `• ${k.charAt(0).toUpperCase() + k.slice(1)}: ${typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}`)
        .join('\n');
    }
    return String(parsed);
  } catch {
    return jsonStr;
  }
}

/** Strip markdown code fences from code output */
function stripCodeFences(content: string): string {
  return content.replace(/```[\w]*\n?/g, '').replace(/```\n?/g, '').trim();
}

export default function CodePreviewModal({ code, onClose }: CodePreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  if (!code) return null;

  const contentType = useMemo(() => detectContentType(code), [code]);

  // Produce a clean, human-readable version of the content
  const readableContent = useMemo(() => {
    if (contentType === 'json') return jsonToReadable(code);
    if (contentType === 'code') return stripCodeFences(code);
    return code;
  }, [code, contentType]);

  const displayContent = showRaw ? code : readableContent;
  const lines = displayContent.split('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const isJson = contentType === 'json';
  const isCode = contentType === 'code';
  const isText = contentType === 'text';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-primary)]/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden rounded-2xl"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          boxShadow: '0 32px 80px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08)',
        }}
      >
        {/* Top shimmer line */}
        <div className="h-px w-full shrink-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5) 40%, rgba(139,92,246,0.4) 60%, transparent)' }} />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)] shrink-0 select-none"
          style={{ background: 'rgba(10,13,24,0.6)' }}
        >
          <div className="flex items-center gap-3">
            {/* macOS-style dots */}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
            </div>
            <div className="w-px h-4 bg-[var(--border-primary)]" />
            <div className="flex items-center gap-2">
              {isText ? (
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Code2 className="w-3.5 h-3.5 text-violet-400" />
              )}
              <span className="text-[11px] font-bold text-[var(--text-primary)] tracking-wide">
                {isText ? 'Agent Output Report' : isJson ? 'Structured Data Output' : 'Code Output'}
              </span>
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: isText ? 'rgba(99,102,241,0.12)' : isJson ? 'rgba(16,185,129,0.10)' : 'rgba(139,92,246,0.10)',
                  border: isText ? '1px solid rgba(99,102,241,0.22)' : isJson ? '1px solid rgba(16,185,129,0.22)' : '1px solid rgba(139,92,246,0.22)',
                  color: isText ? '#a5b4fc' : isJson ? '#34d399' : '#c084fc',
                }}
              >
                {isText ? 'ENGLISH' : isJson ? 'DATA' : 'CODE'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle raw for JSON */}
            {isJson && (
              <button
                onClick={() => setShowRaw(r => !r)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                style={{
                  background: showRaw ? 'rgba(99,102,241,0.14)' : 'var(--bg-surface)',
                  border: '1px solid var(--border-primary)',
                  color: showRaw ? '#a5b4fc' : 'var(--text-muted)',
                }}
              >
                {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showRaw ? 'Readable' : 'Raw JSON'}
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-secondary)',
              }}
            >
              {copied ? (
                <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
              ) : (
                <><Copy className="w-3 h-3" /><span>Copy</span></>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)', color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.10)'; e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-primary)'; }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto custom-scrollbar" style={{ background: 'rgba(8,10,20,0.6)' }}>
          {isText && !showRaw ? (
            // Beautiful text/English rendering
            <div className="p-6 space-y-3">
              {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-3" />;

                // Section headers (lines ending in : or ALL CAPS short lines)
                if (trimmed.endsWith(':') && trimmed.length < 60) {
                  return (
                    <h3 key={i} className="text-[11px] font-black uppercase tracking-widest mt-4 first:mt-0"
                      style={{ color: '#a5b4fc' }}>
                      {trimmed.replace(/:$/, '')}
                    </h3>
                  );
                }
                // Bullet points
                if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                  return (
                    <div key={i} className="flex items-start gap-2.5 pl-2">
                      <span className="text-indigo-400 text-xs mt-0.5 shrink-0">▸</span>
                      <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {trimmed.replace(/^[•\-*]\s*/, '')}
                      </p>
                    </div>
                  );
                }
                // Numbered items
                if (/^\d+\./.test(trimmed)) {
                  return (
                    <div key={i} className="flex items-start gap-2.5 pl-2">
                      <span className="text-xs font-bold text-indigo-400/80 mt-0.5 shrink-0 tabular-nums">
                        {trimmed.match(/^\d+/)?.[0]}.
                      </span>
                      <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        {trimmed.replace(/^\d+\.\s*/, '')}
                      </p>
                    </div>
                  );
                }
                // Normal paragraph
                return (
                  <p key={i} className="text-[12.5px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {trimmed}
                  </p>
                );
              })}
            </div>
          ) : (
            // Code / JSON / Raw mode — monospace with line numbers
            <div className="flex p-5 font-mono text-xs leading-relaxed select-text">
              {/* Line numbers */}
              <div className="text-right pr-4 border-r shrink-0 flex flex-col select-none"
                style={{ color: 'var(--text-muted)', borderColor: 'var(--border-primary)' }}>
                {lines.map((_, i) => (
                  <span key={i} className="block h-5 text-[10px] font-bold leading-5">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                ))}
              </div>
              {/* Code content */}
              <pre className="pl-4 flex-1 overflow-x-auto text-[11px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {lines.map((line, i) => (
                  <code key={i} className="block h-5 whitespace-pre leading-5">{line || ' '}</code>
                ))}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-primary)] flex items-center justify-between shrink-0 select-none"
          style={{ background: 'rgba(10,13,24,0.6)' }}>
          <span className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}>
            {isText ? 'Plain English Report' : isJson ? (showRaw ? 'Raw JSON Data' : 'Formatted Data') : 'Source Code Output'}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}>
            {lines.length} line{lines.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
