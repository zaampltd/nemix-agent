"use client";

import React, { useState, useEffect } from 'react';
import { 
  Folder, Search, FileCode, Layers, Database, 
  FileText, HardDrive, Terminal, HelpCircle 
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
    if (ext === 'py') return <Layers className="w-5 h-5 text-rose-400 animate-pulse" />;
    if (ext === 'csv') return <Database className="w-5 h-5 text-emerald-400" />;
    return <FileText className="w-5 h-5 text-indigo-400" />;
  };

  // Safe stable mock size generation based on ID seed
  const getFileSize = (item: FileRegistryItem) => {
    let seed = 0;
    for (let i = 0; i < item.id.length; i++) seed += item.id.charCodeAt(i);
    const sizeBytes = 250 + (seed % 9) * 115 + (budgetUsed % 50);
    if (sizeBytes > 1024) return (sizeBytes / 1024).toFixed(1) + ' KB';
    return sizeBytes + ' Bytes';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden space-y-4">
      
      {/* File Explorer Header */}
      <div className="flex justify-between items-center shrink-0 border-b border-[var(--border-primary)]/30 pb-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-center justify-center">
            <Folder className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider block leading-none">
              Workspace drives explorer
            </h3>
            <span className="text-[8px] text-[var(--text-secondary)] uppercase font-mono tracking-widest mt-1 block">
              autonomous local project workspace and data assets
            </span>
          </div>
        </div>

        {/* Local storage status */}
        <div className="flex items-center gap-2.5 bg-black/45 border border-[var(--border-primary)]/40 rounded-full px-3.5 py-1.5 shadow-inner text-[10px]">
          <HardDrive className="w-3.5 h-3.5 text-blue-450" />
          <span className="text-gray-500 font-bold uppercase tracking-wider">Local Drives:</span>
          <span className="text-emerald-500 font-extrabold uppercase tracking-wide">ACTIVE</span>
        </div>
      </div>

      {/* Search & Refresh controls */}
      <div className="flex gap-3 select-none">
        <div className="flex-1 relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search workspace files by name or path..."
            className="w-full pl-10 pr-4 py-2.5 bg-black/45 border border-[var(--border-primary)] rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500/40 shadow-inner"
          />
        </div>
        <button
          onClick={fetchFiles}
          className="h-9 px-4.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          Refresh Disk
        </button>
      </div>

      {/* Explorer lists */}
      <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar space-y-3.5">
        {loading ? (
          <div className="text-center py-20 text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest animate-pulse select-none">
            Querying local drive registers...
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="border border-dashed border-[var(--border-primary)] rounded-2xl py-20 text-center text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-2 select-none">
            <HelpCircle className="w-8 h-8 text-[var(--text-muted)]" />
            <span>No files detected on local disk</span>
            <p className="text-[9px] text-[var(--text-muted)] font-medium lowercase tracking-normal max-w-xs mt-1 leading-normal">
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
                className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-4.5 flex items-center justify-between hover:border-blue-500/25 hover:bg-[var(--bg-surface-hover)] transition-all duration-300 group shadow-md"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-4">
                  <div className="w-10 h-10 bg-black/40 border border-[var(--border-primary)] rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-inner">
                    {getFileIcon(file.name)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase text-white truncate group-hover:text-blue-400 transition-colors select-all leading-tight">
                      {file.name}
                    </h4>
                    {/* Absolute local path display */}
                    <p className="text-[9px] text-slate-500 font-mono font-medium tracking-wide mt-1 select-all truncate max-w-2xl bg-black/25 px-1.5 py-0.5 rounded border border-[var(--border-primary)]/40 w-fit">
                      {file.path}
                    </p>
                    <p className="text-[8px] text-[var(--text-secondary)] uppercase mt-1.5 font-mono font-semibold tracking-wide select-none">
                      Size: {getFileSize(file)} • Synced: {relativeTime} • Author: {file.createdBy === 'user' ? 'Founder' : file.createdBy}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0 select-none">
                  <button 
                    disabled={previewLoading}
                    onClick={() => handlePreviewFile(file)}
                    className="h-8 px-3 rounded-lg bg-blue-950/20 border border-blue-500/20 hover:bg-blue-600/15 hover:border-blue-500/40 text-blue-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span>Preview File</span>
                  </button>
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
