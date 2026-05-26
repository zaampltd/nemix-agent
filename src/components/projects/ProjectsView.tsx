"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderPlus, Folder, Plus, File, Download, Eye, Paperclip, Clock, 
  Sparkles, CheckCircle2, Activity, Calendar, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { Project, FileRegistryItem } from '@/lib/types';
import CodePreviewModal from '@/components/ui/CodePreviewModal';

export default function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<FileRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string>('project_default');
  
  // Expanded project ID for showing files
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>('project_default');

  // Form compose states for new Project
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [savingProject, setSavingProject] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // File uploading context
  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileUploading, setFileUploading] = useState(false);

  // Preview Modal state
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  // Fetch projects and files
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch projects
      const projRes = await fetch('/api/projects');
      const projData = await projRes.json();
      if (projData.success) {
        setProjects(projData.projects);
      }

      // Fetch files
      const fileRes = await fetch('/api/files');
      const fileData = await fileRes.json();
      if (fileData.success) {
        setFiles(fileData.files);
      }
    } catch (e) {
      console.error('Failed to retrieve project telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Load active project preference
    const savedActive = localStorage.getItem('nvmix_active_project_id');
    if (savedActive) {
      setActiveProjectId(savedActive);
      setExpandedProjectId(savedActive);
    }
  }, []);

  const handleSetActiveProject = (id: string) => {
    setActiveProjectId(id);
    localStorage.setItem('nvmix_active_project_id', id);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setSavingProject(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Project "${newProjectName}" successfully initialized!`);
        setNewProjectName('');
        setNewProjectDesc('');
        setTimeout(() => {
          setSuccessMsg('');
          setIsAddingProject(false);
        }, 1500);
        await fetchData();
      } else {
        alert(`Failed to initialize project: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Handshake connection failed: ${err.message}`);
    } finally {
      setSavingProject(false);
    }
  };

  const handleProjectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetProjId = uploadingProjectId;
    if (!file || !targetProjId) return;

    setFileUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('createdBy', 'User Upload');
    formData.append('projectId', targetProjId);

    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        alert(`File upload failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Network connection failed: ${err.message}`);
    } finally {
      setFileUploading(false);
      setUploadingProjectId(null);
    }
  };

  const triggerFileUpload = (projId: string) => {
    setUploadingProjectId(projId);
    setTimeout(() => fileInputRef.current?.click(), 55);
  };

  const triggerFilePreview = async (filePath: string) => {
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.success) {
        setPreviewContent(data.content);
      } else {
        alert(`Preview failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Failed to load file contents: ${err.message}`);
    }
  };

  const getFilesForProject = (projId: string) => {
    return files.filter(f => f.projectId === projId || (projId === 'project_default' && !f.projectId));
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden h-full space-y-4 select-none font-sans">
      
      {/* Top action bar */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider block">
            Workspace Projects Registry
          </h2>
          <p className="text-[10px] text-[var(--text-secondary)] font-mono uppercase tracking-widest mt-1">
            Group, organize and sync assets by corporate operational project
          </p>
        </div>
        
        <button
          onClick={() => setIsAddingProject(true)}
          className="flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-black tracking-widest uppercase bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white shadow-md shadow-blue-500/15 transition-all cursor-pointer border border-blue-400/20 active:scale-[0.98]"
        >
          <FolderPlus className="w-4 h-4 text-white" />
          <span>New Project</span>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden gap-5 h-full relative">
        
        {/* Scrollable list of projects */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-6 space-y-4">
          
          {loading && projects.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest animate-pulse">
              Retrieving telemetry registry...
            </div>
          ) : (
            projects.map((proj) => {
              const isActive = activeProjectId === proj.id;
              const isExpanded = expandedProjectId === proj.id;
              const projFiles = getFilesForProject(proj.id);
              let createdDate = '';
              try {
                createdDate = new Date(proj.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
              } catch {
                createdDate = '';
              }

              return (
                <div
                  key={proj.id}
                  className={`border rounded-2xl p-5 flex flex-col shadow-sm transition-all duration-300 relative overflow-hidden backdrop-blur-md ${
                    isActive
                      ? 'border-blue-500/35 bg-blue-500/5 shadow-md shadow-blue-500/5'
                      : 'border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-blue-500/15 hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  {/* Glowing vertical indicator for active project */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
                  )}

                  {/* Project Summary Row */}
                  <div className="flex justify-between items-start select-none">
                    <div className="flex gap-3.5 items-start">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                        isActive 
                          ? 'bg-blue-500/15 border border-blue-500/30 text-blue-550' 
                          : 'bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-secondary)]'
                      }`}>
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black uppercase text-[var(--text-primary)] tracking-wide select-text">
                            {proj.name}
                          </h3>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 text-[7.5px] font-black font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 leading-none uppercase tracking-widest shadow-[0_0_4px_rgba(16,185,129,0.1)]">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Active Workspace
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)] mt-1 max-w-[500px] leading-relaxed select-text font-medium font-sans">
                          {proj.description || 'No description provided.'}
                        </p>
                        
                        {/* Metadata row */}
                        <div className="flex items-center gap-4 mt-3 text-[8.5px] font-mono text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1.5 leading-none">
                            <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]/70" /> Created: {createdDate}
                          </span>
                          <span className="flex items-center gap-1.5 leading-none bg-blue-500/5 px-2 py-1 rounded-md border border-blue-500/10 text-blue-550 font-black">
                            <File className="w-3.5 h-3.5 text-blue-500" /> {projFiles.length} File{projFiles.length !== 1 ? 's' : ''} Associated
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions column */}
                    <div className="flex gap-2 items-center">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => handleSetActiveProject(proj.id)}
                          className="px-3 py-1.5 border border-[var(--border-primary)] hover:border-blue-500/25 bg-[var(--bg-surface)] hover:bg-blue-500/5 text-[var(--text-secondary)] hover:text-blue-550 text-[9px] font-black uppercase tracking-widest rounded-lg cursor-pointer transition-colors shadow-sm"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                        className="p-1.5 border border-[var(--border-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] rounded-lg cursor-pointer transition-colors text-[var(--text-secondary)]"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Files List */}
                  {isExpanded && (
                    <div className="mt-5 border-t border-[var(--border-primary)]/15 pt-4 space-y-3.5 select-text">
                      <div className="flex justify-between items-center select-none pb-1.5">
                        <h4 className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest block">
                          Associated Project Files
                        </h4>
                        <button
                          type="button"
                          onClick={() => triggerFileUpload(proj.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[8.5px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-450 hover:bg-blue-500/10 border border-blue-500/20 rounded-lg cursor-pointer transition-colors"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Add File to Project</span>
                        </button>
                      </div>

                      {projFiles.length === 0 ? (
                        <div className="py-8 px-4 text-center border border-dashed border-[var(--border-primary)] rounded-xl text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider bg-[var(--bg-card)]/10 flex flex-col items-center gap-1.5 select-none">
                          <Folder className="w-5 h-5 text-[var(--text-secondary)] animate-bounce" />
                          <span>No files registered in this project.</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {projFiles.map((file) => {
                            const fileExt = file.name.split('.').pop()?.toLowerCase();
                            const isBinary = ['pdf', 'docx', 'xlsx', 'xls'].includes(fileExt || '');
                            
                            // Visual extend styling based on extensions
                            let extBadgeGlow = 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border-[var(--border-primary)]';
                            if (fileExt === 'py') extBadgeGlow = 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_4px_rgba(239,68,68,0.08)]';
                            if (fileExt === 'json') extBadgeGlow = 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 shadow-[0_0_4px_rgba(6,182,212,0.08)]';
                            if (fileExt === 'docx') extBadgeGlow = 'bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_4px_rgba(59,130,246,0.08)]';
                            if (fileExt === 'xlsx') extBadgeGlow = 'bg-emerald-500/10 text-emerald-550 border-emerald-500/20 shadow-[0_0_4px_rgba(16,185,129,0.08)]';

                            return (
                              <div
                                key={file.id}
                                className="p-3 border border-[var(--border-primary)]/75 hover:border-blue-500/20 bg-[var(--bg-surface)] hover:bg-blue-500/5 rounded-xl flex gap-3 items-center justify-between group transition-all relative overflow-hidden"
                              >
                                <div className="flex gap-2.5 items-center min-w-0">
                                  {/* extension badge */}
                                  <span className={`w-7.5 h-7 rounded-lg border text-[8px] font-black uppercase tracking-wider font-mono flex items-center justify-center shrink-0 ${extBadgeGlow} select-none`}>
                                    {fileExt}
                                  </span>
                                  <div className="min-w-0">
                                    <h4 className="text-[10px] font-bold text-[var(--text-primary)] truncate block group-hover:text-blue-550 transition-colors select-text leading-tight">
                                      {file.name}
                                    </h4>
                                    <span className="text-[7.5px] font-mono text-[var(--text-secondary)] select-none">
                                      By: {file.createdBy}
                                    </span>
                                  </div>
                                </div>

                                {/* File actions */}
                                <div className="flex gap-1.5 shrink-0 select-none opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => triggerFilePreview(file.path)}
                                    className="p-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-primary)] hover:border-blue-500/25 text-[var(--text-secondary)] hover:text-blue-550 cursor-pointer shadow-sm"
                                    title="Preview content"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <a
                                    href={`/api/files?path=${encodeURIComponent(file.path)}&download=true`}
                                    className="p-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-primary)] hover:border-blue-500/25 text-[var(--text-secondary)] hover:text-blue-550 cursor-pointer shadow-sm flex items-center justify-center"
                                    title="Download File"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
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

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleProjectFileUpload}
        className="hidden"
      />

      {/* Preview Modal overlay */}
      {previewContent && (
        <CodePreviewModal
          code={previewContent}
          onClose={() => setPreviewContent(null)}
        />
      )}

      {/* Modal Add Project Popup */}
      {isAddingProject && (
        <div className="fixed inset-0 z-50 bg-[var(--md-scrim)]/45 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl p-6 relative overflow-hidden select-none animate-scaleUp">
            
            <div className="flex justify-between items-center border-b border-[var(--border-primary)]/20 pb-4.5 mb-5 shrink-0">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-blue-555 animate-pulse" />
                <h3 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-wider block">
                  Initialize Workspace Project
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingProject(false)}
                className="p-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-primary)] text-[var(--text-secondary)] cursor-pointer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              {successMsg && (
                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-mono select-none animate-slideUp">
                  <CheckCircle2 className="w-4 h-4 text-emerald-550 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="e.g. Marketing Launch Blueprint"
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner placeholder-[var(--text-secondary)]/40"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest block">Operational Description</label>
                <textarea
                  rows={4}
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  placeholder="Describe the scope and primary goal of this project workspace..."
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl text-xs font-mono text-[var(--text-primary)] outline-none focus:border-blue-500/40 shadow-inner placeholder-[var(--text-secondary)]/40 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-primary)]/15">
                <button
                  type="button"
                  onClick={() => setIsAddingProject(false)}
                  className="px-4 py-2 border border-[var(--border-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProject || !newProjectName.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-[10px] font-black tracking-widest uppercase flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/15 cursor-pointer disabled:opacity-40 rounded-xl border border-blue-400/20"
                >
                  {savingProject ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                      <span>Initializing...</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-3.5 h-3.5 text-white" />
                      <span>Initialize Project</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

// Simple internal X icon helper to prevent import issue
function XIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
