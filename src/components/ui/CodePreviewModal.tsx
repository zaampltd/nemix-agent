"use client";

import React, { useState } from 'react';
import { X, Copy, Check, Terminal } from 'lucide-react';

interface CodePreviewModalProps {
  code: string | null;
  onClose: () => void;
}

export default function CodePreviewModal({ code, onClose }: CodePreviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const lines = code.split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-primary)]/80 backdrop-blur-sm animate-fadeIn">
      <div className="cyber-card w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-premium">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/50 shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            <span className="text-[10px] font-extrabold uppercase text-[var(--color-primary)] tracking-widest font-mono flex items-center gap-1.5 ml-2">
              <Terminal className="w-3.5 h-3.5 text-blue-500" /> Compiled_Output.py
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border border-[var(--border-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface-hover)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-1 rounded-lg border border-[var(--border-primary)] hover:border-red-500/20 hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Code Body */}
        <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-relaxed select-text bg-[#030305]/95 text-slate-350 custom-scrollbar flex">
          {/* Line Numbers gutter */}
          <div className="text-right text-slate-600 select-none pr-4 border-r border-slate-800 shrink-0 flex flex-col">
            {lines.map((_, i) => (
              <span key={i} className="block leading-relaxed h-5 text-[10px] font-bold">
                {(i + 1).toString().padStart(2, '0')}
              </span>
            ))}
          </div>
          
          {/* Actual Code content */}
          <pre className="pl-4 flex-1 overflow-x-auto text-[11px] leading-relaxed text-slate-300 font-semibold select-text h-full">
            {lines.map((line, i) => (
              <code key={i} className="block leading-relaxed h-5 whitespace-pre">
                {line || ' '}
              </code>
            ))}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/50 flex items-center justify-between text-[10px] text-[var(--text-secondary)] font-bold font-sans uppercase tracking-wider shrink-0 select-none">
          <span>Language: Python 3</span>
          <span>Status: Verified static integrity</span>
        </div>

      </div>
    </div>
  );
}
