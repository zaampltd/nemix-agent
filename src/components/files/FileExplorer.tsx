"use client";

import React, { useState, useEffect } from 'react';
import { 
  Folder, Search, FileCode, Layers, Database, 
  FileText, HardDrive, Terminal, HelpCircle, RefreshCw, Clock, ArrowRight
} from 'lucide-react';
import { FileRegistryItem } from '@/lib/types';
import CodePreviewModal from '../ui/CodePreviewModal';

interface FileExplorerProps {
  budgetUsed: number; // passed just for stable size estimations
}

export default function FileExplorer({ budgetUsed }: FileExplorerProps) {
  const [files, setFiles] = useState<FileRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch files list from API
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.success) {
        setFiles(data.files);
      }
    } catch (e) {
      console.error('Failed to retrieve file registry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handlePreviewFile = async (item: FileRegistryItem) => {
    try {
      setPreviewLoading(true);
      const res = await fetch(`/api/files?path=${encodeURIComponent(item.path)}`);
      const data = await res.json();
      if (data.success) {
        setPreviewContent(data.content);
      } else {
        setPreviewContent(`# Error Loading File\n\nCould not load file at path: ${item.path}\n\nReason: ${data.error || 'Unknown file system error'}`);
      }
    } catch (err: any) {
      setPreviewContent(`# Workspace Error\n\nFailed to fetch file contents: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'json') return <FileCode className="w-5 h-5 text-cyan-400 animate-pulse" />;
    if (ext === 'py' || ext === 'js' || ext === 'ts' || ext === 'tsx' || ext === 'html' || ext === 'css') {
      return <FileCode className="w-5 h-5 text-emerald-400 animate-pulse" />;
    }
    if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
      return <Database className="w-5 h-5 text-emerald-555" />;
    }
    if (ext === 'pdf') {
      return <FileText className="w-5 h-5 text-rose-500 animate-pulse" />;
    }
    if (ext === 'docx' || ext === 'doc') {
      return <FileText className="w-5 h-5 text-blue-500 animate-pulse" />;
    }
    if (fileName.includes('_extracted.txt')) {
      return <FileText className="w-5 h-5 text-amber-500 animate-pulse" />;
    }
    return <FileText className="w-5 h-5 text-indigo-550" />;
  };

  // Safe stable mock size generation based on ID seed
  const getFileSize = (item: FileRegistryItem) => {
    let seed = 0;
    for (let i = 0; i < item.id.length; i++) seed += item.id.charCodeAt(i);
    const sizeBytes = 250 + (seed % 9) * 115 + (budgetUsed % 50);
    if (sizeBytes > 1024) return (sizeBytes / 1024).toFixed(1) + ' KB';
    return sizeBytes + ' Bytes';
  };

  // Dynamic colors for agent role badges
  const getAuthorBadgeStyle = (author: string) => {
    const lower = author.toLowerCase();
    if (lower.includes('ceo')) return 'bg-amber-500/10 text-amber-550 border-amber-500/20';
    if (lower.includes('marketer') || lower.includes('marketing') || lower.includes('beta')) return 'bg-orange-500/10 text-orange-550 border-orange-500/20';
    if (lower.includes('dev') || lower.includes('coder') || lower.includes('developer') || lower.includes('gamma')) return 'bg-purple-500/10 text-purple-550 border-purple-500/20';
    if (lower.includes('analyst') || lower.includes('data') || lower.includes('delta')) return 'bg-blue-500/10 text-blue-550 border-blue-500/20';
    if (lower.includes('hr') || lower.includes('helen')) return 'bg-rose-500/10 text-rose-550 border-rose-500/20';
    if (lower.includes('support') || lower.includes('admin') || lower.includes('sam')) return 'bg-teal-500/10 text-teal-550 border-teal-500/20';
    return 'bg-[var(--text-secondary)]/10 text-[var(--text-secondary)] border-[var(--border-primary)]';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-5">
      
      {/* File Explorer Header */}
      <div className="flex justify-between items-center shrink-0 border-b border-[var(--border-primary)]/30 pb-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-lg shadow-blue-500/5">
            <Folder className="w-5 h-5 text-blue-555 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider block leading-none">
              Workspace drives explorer
            </h3>
            <span className="text-[8px] text-[var(--text-secondary)] uppercase font-mono tracking-widest mt-1.5 block">
              autonomous local project workspace and data assets
            </span>
          </div>
        </div>

        {/* Local storage status */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3.5 py-1.5 shadow-sm text-[10px]">
          <HardDrive className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="text-emerald-600 dark:text-emerald-500 font-extrabold uppercase tracking-wide">Workspace active</span>
        </div>
      </div>

      {/* Search & Refresh controls */}
      <div className="flex gap-3 select-none shrink-0">
        <div className="flex-1 relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search workspace files by name or path..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/25 transition-all shadow-inner placeholder-[var(--text-secondary)]/50"
          />
        </div>
        <button
          onClick={fetchFiles}
          disabled={loading}
          className="h-10 px-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] hover:text-blue-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Disk</span>
        </button>
      </div>

      {/* Explorer lists */}
      <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-4 pb-4">
        {loading ? (
          <div className="text-center py-24 text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest animate-pulse select-none flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
            <span>Querying local drive registers...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="border border-dashed border-[var(--border-primary)] rounded-2xl py-24 text-center text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-3 select-none bg-[var(--bg-card)]/30">
            <HelpCircle className="w-8 h-8 text-[var(--text-secondary)] animate-bounce" />
            <span className="text-[var(--text-primary)] text-sm font-black">No files detected on local disk</span>
            <p className="text-[10px] text-[var(--text-secondary)] font-medium lowercase tracking-normal max-w-xs mt-1 leading-relaxed text-center px-4">
              Agent modules write code outputs directly to your disk once they receive heartbeat instructions from the CEO.
            </p>
          </div>
        ) : (
          filteredFiles.map((file) => {
            let relativeTime = '';
            try {
              relativeTime = new Date(file.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            } catch {
              relativeTime = '';
            }

            return (
              <div 
                key={file.id} 
                className="bg-[var(--bg-card)] border border-[var(--border-primary)]/80 rounded-2xl p-5 flex items-center justify-between hover:border-blue-500/30 hover:bg-[var(--bg-surface-hover)] transition-all duration-300 group shadow-md hover:shadow-lg relative overflow-hidden"
              >
                {/* Glowing subtle border hint */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="flex items-center gap-4.5 min-w-0 pr-4">
                  {/* Glowing custom icon container matching file type */}
                  <div className="w-11 h-11 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 opacity-50" />
                    {getFileIcon(file.name)}
                  </div>

                  <div className="min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-[var(--text-primary)] truncate group-hover:text-blue-500 transition-colors select-all leading-tight">
                        {file.name}
                      </h4>
                      {/* Size pill */}
                      <span className="text-[9px] font-bold font-mono text-[var(--text-secondary)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full border border-[var(--border-primary)] shrink-0">
                        {getFileSize(file)}
                      </span>
                    </div>

                    {/* Absolute local path display with segment crumbs styling */}
                    <div className="text-[10px] text-[var(--text-secondary)] font-mono font-medium tracking-normal select-all truncate max-w-2xl bg-[var(--bg-surface)]/60 px-2 py-1 rounded-lg border border-[var(--border-primary)]/60 w-fit flex items-center gap-1">
                      <span className="text-[var(--text-muted)] select-none">C:</span>
                      <ArrowRight className="w-2.5 h-2.5 text-[var(--text-muted)]/60 inline shrink-0" />
                      <span className="truncate">{file.path.split('\\').slice(1).join(' › ')}</span>
                    </div>

                    {/* Rich Tag Row */}
                    <div className="flex flex-wrap items-center gap-2 mt-1 select-none">
                      {/* Time synced tag */}
                      <span className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-secondary)] font-mono">
                        <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>{relativeTime}</span>
                      </span>

                      <span className="text-[var(--text-muted)]/60 font-mono text-[9px] font-bold select-none">•</span>

                      {/* Author Tag */}
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border font-sans tracking-wide uppercase ${getAuthorBadgeStyle(file.createdBy)}`}>
                        {file.createdBy === 'user' ? 'Founder' : file.createdBy}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 shrink-0 select-none">
                  <button 
                    disabled={previewLoading}
                    onClick={() => handlePreviewFile(file)}
                    className="h-9 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-600/15 border border-blue-500/25 hover:border-blue-500/50 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50 hover:shadow-md hover:scale-[1.02]"
                  >
                    <Terminal className="w-4 h-4 text-blue-500" />
                    <span>Preview</span>
                  </button>
                  
                  <a
                    href={`/api/files?path=${encodeURIComponent(file.path)}&download=true`}
                    download={file.name}
                    className="h-9 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-600/15 border border-indigo-500/25 hover:border-indigo-500/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02]"
                  >
                    <ArrowRight className="w-4 h-4 text-indigo-500 rotate-90" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Code preview Modal integration */}
      {previewContent && (
        <CodePreviewModal 
          code={previewContent} 
          onClose={() => setPreviewContent(null)} 
        />
      )}

    </div>
  );
}
