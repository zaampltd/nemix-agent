"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Building2, Target, Key,
  Eye, EyeOff, ChevronRight, ChevronLeft,
  Sparkles, Check, ArrowRight, ExternalLink,
  Briefcase, HeartPulse, ShoppingBag, Rocket,
  Code2, TrendingUp, Megaphone, Utensils,
  GraduationCap, Truck, Home, Globe
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface DeploySwarmProps {
  onDeploy: (companyName: string, goal: string, mission: string, apiKey: string, userName?: string, industry?: string) => void;
  onDemoMode: () => void;
  isDeploying: boolean;
}

const INDUSTRIES = [
  { id: 'technology', label: 'Technology / IT', icon: Code2, color: '#6366f1', agents: ['Software Engineer', 'QA Engineer', 'DevOps Engineer', 'Security Auditor', 'Project Manager', 'Tech Writer'] },
  { id: 'finance', label: 'Finance & Banking', icon: TrendingUp, color: '#10b981', agents: ['CFO', 'Accountant', 'Financial Analyst', 'Risk Advisor', 'Compliance Officer', 'Investment Strategist'] },
  { id: 'marketing', label: 'Marketing & Growth', icon: Megaphone, color: '#f59e0b', agents: ['CMO', 'Content Writer', 'SEO Specialist', 'Social Media Manager', 'Ad Strategist', 'Brand Designer'] },
  { id: 'healthcare', label: 'Healthcare', icon: HeartPulse, color: '#ef4444', agents: ['Medical Advisor', 'Data Analyst', 'Compliance Officer', 'Patient Coordinator', 'Research Analyst', 'Operations Manager'] },
  { id: 'ecommerce', label: 'E-Commerce / Retail', icon: ShoppingBag, color: '#8b5cf6', agents: ['E-Commerce Manager', 'Inventory Manager', 'Customer Support', 'Social Media Manager', 'Analytics Specialist', 'Logistics Coordinator'] },
  { id: 'startup', label: 'Startup / SaaS', icon: Rocket, color: '#06b6d4', agents: ['CTO', 'Full-Stack Developer', 'Product Manager', 'Growth Hacker', 'Customer Success', 'Investor Relations'] },
  { id: 'education', label: 'Education', icon: GraduationCap, color: '#f97316', agents: ['Curriculum Designer', 'Content Creator', 'Student Advisor', 'Platform Developer', 'Research Analyst', 'Operations Manager'] },
  { id: 'logistics', label: 'Logistics / Supply Chain', icon: Truck, color: '#64748b', agents: ['Logistics Manager', 'Supply Chain Analyst', 'Operations Manager', 'Fleet Coordinator', 'Warehouse Manager', 'Compliance Officer'] },
  { id: 'realestate', label: 'Real Estate', icon: Home, color: '#d97706', agents: ['Property Manager', 'Sales Agent', 'Legal Advisor', 'Finance Manager', 'Marketing Specialist', 'Client Relations'] },
  { id: 'restaurant', label: 'Restaurant / Food', icon: Utensils, color: '#22c55e', agents: ['Operations Manager', 'Chef Advisor', 'Inventory Manager', 'Social Media Manager', 'Customer Relations', 'Financial Controller'] },
  { id: 'consulting', label: 'Consulting', icon: Briefcase, color: '#a855f7', agents: ['Senior Consultant', 'Research Analyst', 'Project Manager', 'Business Advisor', 'Financial Analyst', 'Report Writer'] },
  { id: 'other', label: 'Other / General', icon: Globe, color: '#6366f1', agents: ['Operations Manager', 'Business Analyst', 'Project Manager', 'Marketing Manager', 'Financial Controller', 'HR Manager'] },
];

const STEP_CONFIG = [
  { id: 1, label: 'Profile', icon: User, title: 'Tell us about yourself', subtitle: 'Who will be running this workspace?' },
  { id: 2, label: 'Company', icon: Building2, title: 'Your Company', subtitle: 'What kind of business do you run?' },
  { id: 3, label: 'Mission', icon: Target, title: 'Your Goal', subtitle: 'What do you want to automate?' },
  { id: 4, label: 'API Key', icon: Key, title: 'Connect Nvmix', subtitle: 'Authorize your AI workspace' },
];

export default function DeploySwarm({ onDeploy, onDemoMode, isDeploying }: DeploySwarmProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Form data
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('Founder');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('1-10');
  const [goal, setGoal] = useState('');
  const [mission, setMission] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyValidating, setKeyValidating] = useState(false);
  const [keyValid, setKeyValid] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('nvmix_agent_key');
    if (saved) { setApiKey(saved); setKeyValid(true); }
    const savedUser = localStorage.getItem('nvmix_user_name');
    if (savedUser) setUserName(savedUser);
  }, []);

  const selectedIndustry = INDUSTRIES.find(i => i.id === industry);

  const canProceed = () => {
    if (step === 1) return userName.trim().length >= 2;
    if (step === 2) return companyName.trim().length >= 2 && industry !== '';
    if (step === 3) return goal.trim().length >= 10;
    if (step === 4) return apiKey.trim().startsWith('nvx_') && apiKey.trim().length >= 20;
    return false;
  };

  const goNext = () => {
    if (!canProceed()) return;
    setDirection(1);
    setStep(s => Math.min(s + 1, 4));
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 1));
  };

  const handleValidateKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) return;

    // Immediately reject non-Nvmix keys — strict format check
    if (!trimmed.startsWith('nvx_') || trimmed.length < 20) {
      setKeyValid(false);
      return;
    }

    setKeyValidating(true);
    try {
      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trimmed}` },
        body: JSON.stringify({ model: 'nvmix-inference-v1', messages: [{ role: 'user', content: 'ping' }] }),
        signal: AbortSignal.timeout(12000)
      });

      // STRICT: only accept HTTP 200/OK — never auto-accept on error responses
      const valid = res.ok && res.status === 200;
      setKeyValid(valid);
      if (valid) {
        localStorage.setItem('nvmix_agent_key', trimmed);
      } else {
        // Remove any previously stored key if this one fails validation
        localStorage.removeItem('nvmix_agent_key');
      }
    } catch (err: any) {
      // Timeout, abort, or network failure — NEVER auto-accept.
      // A key that can't be verified is treated as invalid.
      console.warn('[Nvmix] Key validation failed:', err?.message || err);
      setKeyValid(false);
      localStorage.removeItem('nvmix_agent_key');
    } finally {
      setKeyValidating(false);
    }
  };

  const handleLaunch = async () => {
    if (!canProceed()) return;
    localStorage.setItem('nvmix_user_name', userName.trim());
    localStorage.setItem('nvmix_agent_key', apiKey.trim());
    const derivedMission = mission.trim() ||
      `${companyName.trim()} is a ${selectedIndustry?.label || industry} company. Our goal: ${goal.trim()}`;
    onDeploy(companyName.trim(), goal.trim(), derivedMission, apiKey.trim(), userName.trim(), industry);
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const currentStep = STEP_CONFIG[step - 1];
  const CurrentIcon = currentStep.icon;

  return (
    <div className="flex-1 flex items-center justify-center p-6 relative min-h-screen overflow-hidden select-none"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-xl z-10">

        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <BrandLogo size={40} className="drop-shadow-[0_0_15px_rgba(99,102,241,0.35)]" />
            <span className="text-xl font-black text-[var(--text-primary)] tracking-tight">Nvmix</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border text-indigo-400 border-indigo-500/25"
              style={{ background: 'rgba(99,102,241,0.08)' }}>Agents</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] font-medium">
            Automate your entire company with AI agents
          </p>
        </div>


        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEP_CONFIG.map((s, idx) => {
            const StepIcon = s.icon;
            const isActive = s.id === step;
            const isDone = s.id < step;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isDone ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' :
                    isActive ? 'shadow-lg shadow-indigo-500/40' : 'bg-[var(--bg-surface)] border border-[var(--border-primary)]'
                  }`}
                    style={isActive ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' } : undefined}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <StepIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                    )}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wide ${
                    isActive ? 'text-indigo-400' : isDone ? 'text-emerald-500' : 'text-[var(--text-muted)]'
                  }`}>{s.label}</span>
                </div>
                {idx < STEP_CONFIG.length - 1 && (
                  <div className={`h-px w-12 mb-5 transition-all duration-500 ${isDone ? 'bg-emerald-500/60' : 'bg-[var(--border-primary)]'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Main Card */}
        <div className="rounded-2xl overflow-hidden relative"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            boxShadow: '0 24px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(99,102,241,0.06)'
          }}
        >
          {/* Top shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5) 40%, rgba(139,92,246,0.4) 60%, transparent)' }} />

          {/* Step header */}
          <div className="px-8 pt-8 pb-6 border-b border-[var(--border-primary)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <CurrentIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)] leading-none mb-1">
                  {currentStep.title}
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">{currentStep.subtitle}</p>
              </div>
              <div className="ml-auto text-[10px] font-bold text-[var(--text-muted)] tabular-nums">
                {step} / 4
              </div>
            </div>
          </div>

          {/* Animated step content */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="px-8 py-7"
              >

                {/* ─── Step 1: Profile ─── */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">Your Name *</label>
                      <input
                        autoFocus
                        type="text"
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && goNext()}
                        placeholder="e.g. Ahmed Khan"
                        className="w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-primary)',
                          color: 'var(--text-primary)',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border-primary)'}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">Your Role</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Founder', 'CEO', 'Manager', 'Director', 'Owner', 'Other'].map(r => (
                          <button key={r} type="button" onClick={() => setUserRole(r)}
                            className="py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer"
                            style={{
                              background: userRole === r ? 'rgba(99,102,241,0.15)' : 'var(--bg-surface)',
                              borderColor: userRole === r ? 'rgba(99,102,241,0.4)' : 'var(--border-primary)',
                              color: userRole === r ? '#a5b4fc' : 'var(--text-secondary)',
                            }}
                          >{r}</button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl flex items-start gap-3"
                      style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Nvmix Agents will create a full AI team for your company — automatically handling projects,
                        emails, reports, social media, accounting, and more.
                      </p>
                    </div>
                  </div>
                )}

                {/* ─── Step 2: Company ─── */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">Company Name *</label>
                      <input
                        autoFocus
                        type="text"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="e.g. TechCorp Solutions"
                        className="w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-primary)',
                          color: 'var(--text-primary)',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border-primary)'}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">Industry *</label>
                      <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                        {INDUSTRIES.map(ind => {
                          const IndIcon = ind.icon;
                          const selected = industry === ind.id;
                          return (
                            <button key={ind.id} type="button" onClick={() => setIndustry(ind.id)}
                              className="py-3 px-2 rounded-xl text-[10px] font-semibold transition-all border cursor-pointer flex flex-col items-center gap-1.5 leading-tight text-center"
                              style={{
                                background: selected ? `${ind.color}15` : 'var(--bg-surface)',
                                borderColor: selected ? `${ind.color}60` : 'var(--border-primary)',
                                color: selected ? ind.color : 'var(--text-secondary)',
                              }}
                            >
                              <IndIcon className="w-4 h-4 shrink-0" style={{ color: selected ? ind.color : undefined }} />
                              {ind.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block">Company Size</label>
                      <div className="flex gap-2">
                        {['1-10', '11-50', '51-200', '200+'].map(s => (
                          <button key={s} type="button" onClick={() => setCompanySize(s)}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer"
                            style={{
                              background: companySize === s ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface)',
                              borderColor: companySize === s ? 'rgba(99,102,241,0.35)' : 'var(--border-primary)',
                              color: companySize === s ? '#a5b4fc' : 'var(--text-secondary)',
                            }}
                          >{s}</button>
                        ))}
                      </div>
                    </div>

                    {selectedIndustry && (
                      <div className="p-3.5 rounded-xl flex items-start gap-2.5"
                        style={{ background: `${selectedIndustry.color}0d`, border: `1px solid ${selectedIndustry.color}30` }}>
                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: selectedIndustry.color }} />
                        <p className="text-[10.5px] leading-relaxed" style={{ color: selectedIndustry.color }}>
                          AI will hire: <strong>{selectedIndustry.agents.slice(0, 4).join(', ')}</strong> and more for your company.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Step 3: Mission / Goal ─── */}
                {step === 3 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">
                        What do you want to automate? *
                      </label>
                      <textarea
                        autoFocus
                        value={goal}
                        onChange={e => setGoal(e.target.value)}
                        rows={4}
                        placeholder={`e.g. Automate all ${selectedIndustry?.label || 'company'} operations including project management, client reports, social media posts, financial tracking, and team coordination.`}
                        className="w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all resize-none leading-relaxed"
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-primary)',
                          color: 'var(--text-primary)',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border-primary)'}
                      />
                      <div className="text-right text-[9px] text-[var(--text-muted)]">{goal.length} chars (min 10)</div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block">
                        Company Mission / Vision (Optional)
                      </label>
                      <input
                        type="text"
                        value={mission}
                        onChange={e => setMission(e.target.value)}
                        placeholder="e.g. To deliver world-class technology solutions that transform businesses."
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-primary)',
                          color: 'var(--text-primary)',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border-primary)'}
                      />
                    </div>

                    {/* Quick goal suggestions */}
                    {selectedIndustry && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Quick Goals</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            `Automate all ${selectedIndustry.label} operations`,
                            `Generate weekly reports automatically`,
                            `Manage team tasks and projects`,
                            `Handle client communications`,
                          ].map(suggestion => (
                            <button key={suggestion} type="button"
                              onClick={() => setGoal(suggestion)}
                              className="text-[9.5px] px-2.5 py-1.5 rounded-lg font-medium cursor-pointer transition-all border"
                              style={{
                                background: 'var(--bg-surface)',
                                borderColor: 'var(--border-primary)',
                                color: 'var(--text-secondary)',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#a5b4fc'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-primary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                            >
                              + {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Step 4: API Key ─── */}
                {step === 4 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block">Nvmix API Key *</label>
                        <a href="https://nvmix.com/dashboard/api-keys" target="_blank" rel="noopener noreferrer"
                          className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer">
                          Get key at nvmix.com <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="relative">
                        <input
                          autoFocus
                          type={showKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={e => { setApiKey(e.target.value); setKeyValid(null); }}
                          placeholder="nvx_live_sk_xxxxxxxxxxxxxxxxxxxxxxxx"
                          className="w-full px-4 py-3.5 pr-24 rounded-xl text-sm font-mono outline-none transition-all"
                          style={{
                            background: 'var(--bg-surface)',
                            border: `1px solid ${
                              keyValid === true ? 'rgba(22,163,74,0.5)' :
                              keyValid === false ? 'rgba(239,68,68,0.5)' :
                              'var(--border-primary)'
                            }`,
                            color: 'var(--text-primary)',
                          }}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button type="button" onClick={() => setShowKey(s => !s)}
                            className="p-1.5 rounded-lg transition-colors cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button type="button" onClick={handleValidateKey} disabled={!apiKey.trim() || keyValidating}
                            className="text-[9px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all disabled:opacity-50"
                            style={{
                              background: keyValid === true ? 'rgba(22,163,74,0.15)' : 'rgba(99,102,241,0.12)',
                              border: keyValid === true ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(99,102,241,0.25)',
                              color: keyValid === true ? '#16a34a' : '#a5b4fc',
                            }}
                          >
                            {keyValidating ? '...' : keyValid === true ? '✓ OK' : 'Test'}
                          </button>
                        </div>
                      </div>
                      {keyValid === true && (
                        <p className="text-[10px] flex items-center gap-1" style={{ color: '#16a34a' }}>
                          <Check className="w-3 h-3" /> API key verified and saved
                        </p>
                      )}
                      {keyValid === false && (
                        <p className="text-[10px] flex items-center gap-1" style={{ color: '#ef4444' }}>
                          ✕ Invalid key — only Nvmix API keys work (format: nvx_...)
                        </p>
                      )}
                      {!apiKey.trim().startsWith('nvx_') && apiKey.trim().length > 3 && (
                        <p className="text-[10px]" style={{ color: '#f59e0b' }}>
                          ⚠️ Only Nvmix API keys are supported. Other keys (Groq, OpenAI, Gemini, etc.) will not work here.
                        </p>
                      )}
                    </div>


                    {/* Summary before launch */}
                    <div className="p-4 rounded-xl space-y-3"
                      style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Launch Summary</p>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Workspace Owner</span>
                          <span className="text-[var(--text-primary)] font-semibold">{userName} ({userRole})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Company</span>
                          <span className="text-[var(--text-primary)] font-semibold">{companyName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Industry</span>
                          <span className="text-[var(--text-primary)] font-semibold">{selectedIndustry?.label || industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">AI Agents</span>
                          <span className="font-semibold" style={{ color: '#16a34a' }}>6–8 agents hired automatically</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-[var(--text-muted)] text-center leading-relaxed">
                      Your API key is stored locally and never sent to third parties.
                      The AI will immediately hire agents and create tasks for your company.
                    </p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation footer */}
          <div className="px-8 pb-7 flex items-center gap-3">
            {step > 1 && (
              <button type="button" onClick={goBack}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)',
                }}>
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}

            {step < 4 ? (
              <button type="button" onClick={goNext} disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-all disabled:opacity-40"
                style={{
                  background: canProceed() ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : 'var(--bg-surface)',
                  color: canProceed() ? '#fff' : 'var(--text-muted)',
                  boxShadow: canProceed() ? '0 8px 24px -4px rgba(99,102,241,0.4)' : 'none',
                }}>
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleLaunch}
                disabled={isDeploying || !canProceed()}
                className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold cursor-pointer transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #06b6d4 100%)',
                  color: '#fff',
                  boxShadow: '0 8px 32px -4px rgba(99,102,241,0.5)',
                }}>
                {isDeploying ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Building your AI team...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    Launch AI Workspace
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Demo mode link */}
        {step === 4 && (
          <div className="text-center mt-4">
            <button type="button" onClick={onDemoMode} disabled={isDeploying}
              className="text-xs text-[var(--text-muted)] hover:text-indigo-400 transition-colors cursor-pointer underline underline-offset-2">
              Try demo mode instead (no API key required)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
