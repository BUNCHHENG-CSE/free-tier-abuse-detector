'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Maximize2,
  Minimize2,
  Shield,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Monitor,
  Bot,
  Activity,
  Lock,
  Unlock,
  RotateCcw,
  ArrowRight,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Layers,
  Mail,
  UserCheck,
  Code2,
  Coins,
  Fingerprint,
  Sliders,
  Globe,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { RiskBadge } from '@/components/RiskBadge';

interface PresetOption {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  accentClass: string;
  activeBorderClass: string;
  badgeClass: string;
}

const PRESET_SCENARIOS: PresetOption[] = [
  {
    id: 'legit',
    step: '01',
    title: 'Clean User',
    subtitle: 'Corporate domain & organic cadence',
    badge: 'LOW RISK',
    icon: UserCheck,
    accentClass: 'text-emerald-600 dark:text-emerald-400',
    activeBorderClass:
      'border-emerald-500/60 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.1] ring-1 ring-emerald-500/30',
    badgeClass:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  },
  {
    id: 'multi',
    step: '02',
    title: 'Multi-Account',
    subtitle: 'Same PC hardware harvester',
    badge: 'CLUSTER',
    icon: Layers,
    accentClass: 'text-rose-600 dark:text-rose-400',
    activeBorderClass:
      'border-rose-500/60 bg-rose-500/[0.06] dark:bg-rose-500/[0.1] ring-1 ring-rose-500/30',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
  },
  {
    id: 'tempmail',
    step: '03',
    title: 'Disposable Mail',
    subtitle: 'Mailinator burner inbox',
    badge: 'BURNER',
    icon: Mail,
    accentClass: 'text-purple-600 dark:text-purple-400',
    activeBorderClass:
      'border-purple-500/60 bg-purple-500/[0.06] dark:bg-purple-500/[0.1] ring-1 ring-purple-500/30',
    badgeClass:
      'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25',
  },
  {
    id: 'alias',
    step: '04',
    title: 'Plus Alias',
    subtitle: 'user+quota@gmail subaddress',
    badge: '+ALIAS',
    icon: Sparkles,
    accentClass: 'text-amber-600 dark:text-amber-400',
    activeBorderClass:
      'border-amber-500/60 bg-amber-500/[0.06] dark:bg-amber-500/[0.1] ring-1 ring-amber-500/30',
    badgeClass:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
  },
  {
    id: 'bot_cadence',
    step: '05',
    title: 'Bot Cadence',
    subtitle: '<120ms scripted form fill',
    badge: 'ROBOTIC',
    icon: Bot,
    accentClass: 'text-cyan-600 dark:text-cyan-400',
    activeBorderClass:
      'border-cyan-500/60 bg-cyan-500/[0.06] dark:bg-cyan-500/[0.1] ring-1 ring-cyan-500/30',
    badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
  },
  {
    id: 'farbling',
    step: '06',
    title: 'Brave Farbling',
    subtitle: 'Canvas entropy noise injection',
    badge: 'SPOOFED',
    icon: Sliders,
    accentClass: 'text-pink-600 dark:text-pink-400',
    activeBorderClass:
      'border-pink-500/60 bg-pink-500/[0.06] dark:bg-pink-500/[0.1] ring-1 ring-pink-500/30',
    badgeClass: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/25',
  },
];

export default function DemoSaasPage() {
  const [name, setName] = useState('Alex Morrison');
  const [email, setEmail] = useState('alex.morrison@gmail.com');
  const [password, setPassword] = useState('VoxelPass2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [activePreset, setActivePreset] = useState<string>('legit');

  const [currentFp, setCurrentFp] = useState<any | null>(null);
  const [overrideSignals, setOverrideSignals] = useState<any | null>(null);
  const [copiedFp, setCopiedFp] = useState(false);
  const [rescanning, setRescanning] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  const [behaviorText, setBehaviorText] = useState('Analyzing interaction...');
  const [behaviorError, setBehaviorError] = useState(false);

  const [farblingText, setFarblingText] = useState('Pass (Deterministic)');
  const [farblingError, setFarblingError] = useState(false);

  const [powText, setPowText] = useState('Ready (SHA-256 Micro-Solver)');
  const [powStatus, setPowStatus] = useState<'ready' | 'solving' | 'solved'>('ready');

  const [quotaData, setQuotaData] = useState<{
    used: number;
    allocated: number;
    remaining: number;
    isLocked: boolean;
  } | null>(null);
  const [consuming, setConsuming] = useState(false);
  const [resettingQuota, setResettingQuota] = useState(false);
  const [quotaFeedback, setQuotaFeedback] = useState<{
    type: 'info' | 'error' | 'success';
    message: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitLabel, setSubmitLabel] = useState('Claim 50 Free GPU 3D Credits');
  const [verifyResponse, setVerifyResponse] = useState<any | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshQuotaHUD = useCallback(
    async (fpId?: string) => {
      const targetFp = fpId || currentFp?.fingerprintId;
      if (!targetFp) return;
      try {
        const res = await fetch(`/api/v1/quota/${targetFp}`);
        if (res.ok) {
          const data = await res.json();
          setQuotaData(data);
        }
      } catch {}
    },
    [currentFp?.fingerprintId]
  );

  const collectFingerprint = useCallback(async () => {
    if (typeof window !== 'undefined' && (window as any).AbuseShield) {
      setRescanning(true);
      try {
        const fp = await (window as any).AbuseShield.getFingerprint();
        setCurrentFp(fp);
        if (fp?.signals?.behavior && !overrideSignals?.behavior) {
          setBehaviorText(
            `${fp.signals.behavior.timeOnPageMs}ms on page, ${fp.signals.behavior.mouseMovementsCount} mouse moves`
          );
        }
        await refreshQuotaHUD(fp.fingerprintId);
      } finally {
        setTimeout(() => setRescanning(false), 300);
      }
    }
  }, [overrideSignals?.behavior, refreshQuotaHUD]);

  useEffect(() => {
    let mounted = true;
    const initInspector = async () => {
      if (typeof window !== 'undefined' && (window as any).AbuseShield) {
        const fp = await (window as any).AbuseShield.getFingerprint();
        if (!mounted) return;
        setCurrentFp(fp);
        if (fp?.signals?.behavior) {
          setBehaviorText(
            `${fp.signals.behavior.timeOnPageMs}ms on page, ${fp.signals.behavior.mouseMovementsCount} mouse moves`
          );
        }
        refreshQuotaHUD(fp.fingerprintId);
      }
    };

    initInspector();
    const timer = setTimeout(initInspector, 500);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [refreshQuotaHUD]);

  const setPreset = (type: string) => {
    setActivePreset(type);
    setVerifyResponse(null);
    setOverrideSignals(null);
    setBehaviorError(false);
    setFarblingError(false);

    if (currentFp?.signals?.behavior) {
      setBehaviorText(
        `${currentFp.signals.behavior.timeOnPageMs}ms on page, ${currentFp.signals.behavior.mouseMovementsCount} mouse moves`
      );
    } else {
      setBehaviorText('Analyzing interaction...');
    }
    setFarblingText('Pass (Deterministic)');

    if (type === 'legit') {
      setName('Alex Morrison');
      setEmail(`user_${Math.floor(Math.random() * 9000 + 1000)}@techfirm.com`);
    } else if (type === 'multi') {
      setName('Alex Morrison (Alt)');
      setEmail(`multi_account_${Math.floor(Math.random() * 90 + 10)}@gmail.com`);
    } else if (type === 'tempmail') {
      setName('Burner Harvester');
      setEmail(`harvest_quota_${Math.floor(Math.random() * 900)}@mailinator.com`);
    } else if (type === 'alias') {
      setName('Alex Morrison');
      setEmail(`alex.morrison+freequota${Math.floor(Math.random() * 50)}@gmail.com`);
    } else if (type === 'bot_cadence') {
      setName('Headless Script');
      setEmail(`scripted_bot_${Math.floor(Math.random() * 9000)}@fastmail.com`);
      setOverrideSignals({
        behavior: { timeOnPageMs: 120, isAutomatedCadence: true, mouseMovementsCount: 0 },
      });
      setBehaviorText('ROBOTIC CADENCE (<120ms)');
      setBehaviorError(true);
    } else if (type === 'farbling') {
      setName('Privacy Spoofer');
      setEmail(`brave_farbler_${Math.floor(Math.random() * 9000)}@proton.me`);
      setOverrideSignals({
        canvas: { isCanvasFarblingDetected: true, supported: true, hash: 'farble_hash_999' },
      });
      setFarblingText('FARBLING NOISE INJECTED');
      setFarblingError(true);
    }
  };

  const consumeTrialCredit = async () => {
    if (!currentFp) return;
    setConsuming(true);
    setQuotaFeedback(null);
    try {
      const res = await fetch('/api/v1/quota/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprintId: currentFp.fingerprintId,
          amount: 15,
          email,
        }),
      });
      const data = await res.json();
      await refreshQuotaHUD();
      if (!data.allowed) {
        setQuotaFeedback({
          type: 'error',
          message: `Trial credit operation blocked across this device: ${data.reason}. No more free credits available!`,
        });
      } else {
        setQuotaFeedback({
          type: 'info',
          message: `Consumed 15 GPU credits for 3D mesh render (${data.remaining} credits remaining on this device).`,
        });
      }
    } catch (e: any) {
      setQuotaFeedback({
        type: 'error',
        message: 'Error consuming quota: ' + e.message,
      });
    } finally {
      setConsuming(false);
    }
  };

  const handleResetQuota = async () => {
    if (!currentFp?.fingerprintId) return;
    setResettingQuota(true);
    setQuotaFeedback(null);
    try {
      const res = await fetch('/api/v1/quota/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerprintId: currentFp.fingerprintId,
        }),
      });
      if (res.ok) {
        await refreshQuotaHUD();
        setQuotaFeedback({
          type: 'success',
          message: 'Device trial pool restored to 50 free compute credits.',
        });
      }
    } catch (e: any) {
      setQuotaFeedback({
        type: 'error',
        message: 'Failed to reset quota: ' + e.message,
      });
    } finally {
      setResettingQuota(false);
    }
  };

  const handleCopyFp = () => {
    if (!currentFp?.fingerprintId) return;
    navigator.clipboard.writeText(currentFp.fingerprintId);
    setCopiedFp(true);
    setTimeout(() => setCopiedFp(false), 1800);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitLabel('Verifying hardware & behavioral signals...');

    try {
      const baseSignals = currentFp ? currentFp.signals : {};
      const signals = overrideSignals ? { ...baseSignals, ...overrideSignals } : baseSignals;

      let res = await fetch('/api/v1/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AbuseShield-Key': 'pk_live_abuseshield_demo',
        },
        body: JSON.stringify({
          email,
          action: 'signup',
          clientFingerprintId: currentFp ? currentFp.fingerprintId : 'fp_demo_unknown',
          clientToken: currentFp ? currentFp.clientToken : 'tok_demo',
          signals,
        }),
      });

      let data = await res.json();

      if (
        data.action === 'challenge' &&
        data.challenge &&
        typeof window !== 'undefined' &&
        (window as any).AbuseShield
      ) {
        setSubmitLabel('Solving Adaptive PoW Challenge in WebWorker...');
        setPowText(`SOLVING DIFFICULTY ${data.challenge.difficulty}...`);
        setPowStatus('solving');

        const solution = await (window as any).AbuseShield.solvePoW(data.challenge);
        setPowText(`SOLVED in ${solution.timeTakenMs}ms`);
        setPowStatus('solved');

        res = await fetch('/api/v1/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-AbuseShield-Key': 'pk_live_abuseshield_demo',
          },
          body: JSON.stringify({
            email,
            action: 'signup',
            clientFingerprintId: currentFp ? currentFp.fingerprintId : 'fp_demo_unknown',
            clientToken: currentFp ? currentFp.clientToken : 'tok_demo',
            signals,
            powSolution: solution,
          }),
        });
        data = await res.json();
      }

      setVerifyResponse(data);
      await refreshQuotaHUD();
    } catch (err: any) {
      setQuotaFeedback({
        type: 'error',
        message: 'Verification error: ' + err.message,
      });
    } finally {
      setSubmitting(false);
      setSubmitLabel('Claim 50 Free GPU 3D Credits');
    }
  };

  const quotaPercent = quotaData
    ? Math.min(100, Math.round((quotaData.used / quotaData.allocated) * 100))
    : 0;

  const isBot =
    currentFp?.signals?.bot?.isWebdriver || currentFp?.signals?.bot?.isHeadless;

  const isFlagged =
    verifyResponse && (verifyResponse.action === 'flag' || verifyResponse.riskScore >= 35);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground font-sans relative overflow-x-hidden mira-grid selection:bg-indigo-500/20">
      {/* Subtle Adaptive Ambient Lighting (Tuned for both Light and Dark modes) */}
      <div className="fixed top-0 left-1/4 w-[28rem] h-[28rem] bg-indigo-500/[0.06] dark:bg-indigo-500/[0.09] rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="fixed bottom-0 right-1/4 w-[28rem] h-[28rem] bg-cyan-500/[0.06] dark:bg-cyan-500/[0.08] rounded-full blur-3xl pointer-events-none translate-y-1/2" />

      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center font-mono font-bold text-white text-sm shadow-xs">
            V
          </div>
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground text-sm tracking-tight">
                  VoxelAI Studio
                </span>
                <span className="text-[9px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300">
                  DEMO SAAS
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:block font-mono">
                Freemium Generative 3D Mesh Engine
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 pl-3 ml-1 border-l border-border text-[11px] text-muted-foreground font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Protected by TCT Shield</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Mode Switcher (Light / Dark / System) */}
          <ThemeToggle />

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="h-8 px-2.5 rounded-md border border-border bg-card/80 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 font-mono text-xs shadow-2xs cursor-pointer"
            title={isFullscreen ? 'Exit Full Screen' : 'Toggle Full Screen'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-foreground" />
                <span className="hidden sm:inline text-[11px]">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-foreground" />
                <span className="hidden sm:inline text-[11px]">Fullscreen</span>
              </>
            )}
          </button>

          {/* Back to Admin Dashboard */}
          <Link
            href="/"
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 text-xs font-mono font-medium shadow-xs group"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>TCT Shield Admin HUD</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 my-auto relative z-10">
        {/* Left Column: Customer-Facing Freemium Signup & Abuse Simulator */}
        <div className="lg:col-span-6 space-y-4">
          {/* Hero Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Free Tier: 50 Free 3D Compute Credits</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-[10px] opacity-80">No Credit Card Required</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Create your free VoxelAI account
            </h1>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-xl">
              Transform text prompts into production-ready 3D meshes in seconds. Protected in real time by{' '}
              <span className="text-foreground font-medium">TCT Shield</span> hardware fingerprinting, behavioral biometrics, and cross-account device quota guards.
            </p>
          </div>

          {/* 6-Scenario Abuse Preset Matrix */}
          <div className="p-4 rounded-xl bg-card/90 backdrop-blur-md border border-border space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Simulate Free-Tier Abuse Scenarios
              </span>
              <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-muted/70 border border-border">
                6 Interactive Presets
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_SCENARIOS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPreset(preset.id)}
                    className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer group ${
                      isSelected
                        ? preset.activeBorderClass
                        : 'bg-background/60 hover:bg-accent/50 border-border hover:border-foreground/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${preset.accentClass}`} />
                        <span className="font-mono font-bold text-xs text-foreground truncate">
                          {preset.step}. {preset.title}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <span className="text-[10px] text-muted-foreground truncate">
                        {preset.subtitle}
                      </span>
                      <span
                        className={`text-[8px] font-mono font-semibold px-1 py-0.2 rounded border shrink-0 ${preset.badgeClass}`}
                      >
                        {preset.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Freemium Signup Form Card */}
          <form
            onSubmit={handleSignup}
            className="rounded-xl p-5 bg-card/95 backdrop-blur-md border border-border space-y-3.5 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs">
                  V
                </div>
                <div>
                  <h2 className="text-xs font-bold text-foreground">
                    Account Registration
                  </h2>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    Instant 50 GPU credit provisioning upon verification
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border font-medium">
                Zero-Friction Guard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono font-semibold text-foreground block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Alex Morrison"
                  className="w-full h-9 px-3 bg-background border border-input rounded-lg text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono font-semibold text-foreground block mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-9 pl-3 pr-8 bg-background border border-input rounded-lg text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono font-semibold text-foreground block mb-1">
                Work / Personal Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="alex.morrison@gmail.com"
                className="w-full h-9 px-3 bg-background border border-input rounded-lg text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-2xs"
              />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{submitLabel}</span>
              </button>
            </div>
          </form>

          {/* Cross-Account Trial Quota Pool Sandbox */}
          <div className="p-5 rounded-xl bg-card/95 backdrop-blur-md border border-border space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Cross-Account Trial Quota Pool
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Hardware-bound credit ledger across all accounts on this device
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {!quotaData ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold border border-border">
                    Checking...
                  </span>
                ) : quotaData.isLocked ? (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    LOCKED
                  </span>
                ) : quotaData.remaining <= 0 ? (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    EXHAUSTED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    {quotaData.remaining} CREDITS LEFT
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-foreground font-medium">
                  Credits:{' '}
                  {quotaData ? `${quotaData.used} / ${quotaData.allocated} used` : '0 / 50'}
                </span>
                <span className="text-muted-foreground">
                  {quotaData
                    ? `${quotaPercent}% used (${quotaData.remaining} remaining)`
                    : '0% used'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden border border-border p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    quotaPercent >= 90
                      ? 'bg-rose-500'
                      : quotaPercent >= 70
                      ? 'bg-amber-500'
                      : 'bg-cyan-500'
                  }`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
            </div>

            {quotaFeedback && (
              <div
                className={`p-2.5 rounded-lg border text-[11px] font-mono flex items-start gap-2 ${
                  quotaFeedback.type === 'error'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    : quotaFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300'
                }`}
              >
                {quotaFeedback.type === 'error' ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{quotaFeedback.message}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={consumeTrialCredit}
                disabled={consuming}
                className="flex-1 h-9 px-3 rounded-lg border border-cyan-500/35 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {consuming
                    ? 'Rendering 3D model...'
                    : 'Render 3D Model (Consume 15 Credits)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleResetQuota}
                disabled={resettingQuota}
                title="Reset device trial quota pool back to 50 credits"
                className="h-9 px-3 rounded-lg border border-border bg-secondary hover:bg-accent text-foreground text-xs font-mono font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resettingQuota ? 'animate-spin' : ''}`} />
                <span>Reset Pool</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time TCT Shield Signal Inspector HUD */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl p-5 bg-card/95 backdrop-blur-md border border-border space-y-4 shadow-sm">
            {/* Inspector Header */}
            <div className="flex items-center justify-between border-b border-border pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <div>
                  <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <span>TCT Shield Live Signal Inspector</span>
                  </h2>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    Real-time client telemetry &amp; deterministic hardware entropy
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/25">
                  &lt;10KB SDK
                </span>
                <button
                  type="button"
                  onClick={collectFingerprint}
                  title="Re-scan browser hardware entropy"
                  className="h-7 w-7 rounded-md border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${rescanning ? 'animate-spin text-foreground' : ''}`} />
                </button>
              </div>
            </div>

            {/* Canonical Hardware Fingerprint Card */}
            <div className="p-4 rounded-xl bg-background/80 border border-border space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-indigo-500" />
                  Canonical Client Hardware Fingerprint
                </span>
                {currentFp?.fingerprintId && (
                  <button
                    type="button"
                    onClick={handleCopyFp}
                    className="text-[10px] font-mono text-muted-foreground hover:text-foreground flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-card hover:bg-accent transition-colors cursor-pointer"
                  >
                    {copiedFp ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="font-mono text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-300 break-all select-all">
                {currentFp ? currentFp.fingerprintId : 'Collecting physical entropy...'}
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] text-muted-foreground font-mono pt-2 border-t border-border/60">
                <span className="flex items-center gap-1">
                  <span>Confidence:</span>
                  <strong className="text-foreground">
                    {currentFp ? `${(currentFp.confidence * 100).toFixed(0)}%` : '--'}
                  </strong>
                </span>
                <span className="flex items-center gap-1">
                  <span>Token:</span>
                  <strong className="text-foreground">
                    {currentFp?.clientToken ? `${currentFp.clientToken.slice(0, 14)}…` : '--'}
                  </strong>
                </span>
                <span className="flex items-center gap-1">
                  <span>Speed:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {currentFp ? `${currentFp.elapsedMs} ms` : '-- ms'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Signals Details Matrix */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/40 border border-border/70">
                <span className="text-muted-foreground flex items-center gap-2 text-[11px]">
                  <Activity className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Behavioral Biometrics:</span>
                </span>
                <span
                  className={`text-[11px] text-right ${
                    behaviorError
                      ? 'text-rose-600 dark:text-rose-400 font-bold'
                      : 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  }`}
                >
                  {behaviorText}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/40 border border-border/70">
                <span className="text-muted-foreground flex items-center gap-2 text-[11px]">
                  <Sliders className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                  <span>Anti-Farbling Canvas Test:</span>
                </span>
                <span
                  className={`text-[11px] text-right ${
                    farblingError
                      ? 'text-rose-600 dark:text-rose-400 font-bold'
                      : 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  }`}
                >
                  {farblingText}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/40 border border-border/70">
                <span className="text-muted-foreground flex items-center gap-2 text-[11px]">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Adaptive PoW Engine:</span>
                </span>
                <span
                  className={`text-[11px] font-bold text-right ${
                    powStatus === 'solving'
                      ? 'text-amber-600 dark:text-amber-400 animate-pulse'
                      : powStatus === 'solved'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-indigo-600 dark:text-indigo-300'
                  }`}
                >
                  {powText}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/40 border border-border/70">
                <span className="text-muted-foreground flex items-center gap-2 text-[11px]">
                  <Cpu className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>WebGL GPU Architecture:</span>
                </span>
                <span
                  className="text-foreground text-[11px] text-right max-w-[230px] truncate"
                  title={currentFp?.signals?.webgl?.unmaskedRenderer}
                >
                  {currentFp?.signals?.webgl?.unmaskedRenderer || 'Detecting...'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/40 border border-border/70">
                <span className="text-muted-foreground flex items-center gap-2 text-[11px]">
                  <Monitor className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span>Display Geometry &amp; Ratio:</span>
                </span>
                <span className="text-foreground text-[11px]">
                  {currentFp?.signals?.screen
                    ? `${currentFp.signals.screen.width}x${currentFp.signals.screen.height} @${currentFp.signals.screen.devicePixelRatio}x`
                    : 'Detecting...'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/40 border border-border/70">
                <span className="text-muted-foreground flex items-center gap-2 text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  <span>System Locale &amp; Timezone:</span>
                </span>
                <span className="text-foreground text-[11px]">
                  {currentFp?.signals?.system
                    ? `${currentFp.signals.system.timezone} (${currentFp.signals.system.platform})`
                    : 'Detecting...'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-secondary/40 border border-border/70">
                <span className="text-muted-foreground flex items-center gap-2 text-[11px]">
                  <Bot className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Automated Bot / Headless:</span>
                </span>
                <span
                  className={`text-[11px] font-bold ${
                    isBot
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isBot ? 'AUTOMATION DETECTED' : 'Clean (Human Browser)'}
                </span>
              </div>
            </div>

            {/* Raw Signal Payload Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowRawJson((prev) => !prev)}
                className="w-full h-8 px-3 rounded-lg border border-border bg-background/70 hover:bg-accent text-muted-foreground hover:text-foreground text-[11px] font-mono flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>
                    {showRawJson
                      ? 'Hide Raw SDK Telemetry JSON'
                      : 'Inspect Raw SDK Telemetry JSON'}
                  </span>
                </span>
                <span className="text-[10px] opacity-75">
                  {showRawJson ? 'Collapse' : 'Expand'}
                </span>
              </button>

              {showRawJson && (
                <pre className="mt-2 p-3 rounded-lg bg-background border border-border text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-52 custom-scrollbar">
                  {JSON.stringify(
                    {
                      fingerprintId: currentFp?.fingerprintId,
                      confidence: currentFp?.confidence,
                      elapsedMs: currentFp?.elapsedMs,
                      overrideSignals,
                      signals: currentFp?.signals,
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </div>

            {/* Verification Server Response Box */}
            {verifyResponse && (
              <div
                className={`p-4 rounded-xl border space-y-2.5 animate-in fade-in duration-200 ${
                  isFlagged
                    ? 'bg-rose-500/10 border-rose-500/30 text-foreground'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                }`}
              >
                {isFlagged ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Flagged for Manual Staff Review</span>
                      </span>
                      <RiskBadge
                        score={verifyResponse.riskScore}
                        level={verifyResponse.riskLevel || 'high'}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Registration permitted without abruptly locking out the user, but routed to the staff review queue and alerted via webhook.
                    </p>
                    {(verifyResponse.reasons || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {(verifyResponse.reasons || []).map((r: string, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10px] font-mono border border-rose-500/30"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                      <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        <span>Inspect in TCT Shield Admin HUD</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Action: {verifyResponse.action?.toUpperCase()}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Registration Allowed (Clean User)</span>
                      </span>
                      <RiskBadge
                        score={verifyResponse.riskScore}
                        level={verifyResponse.riskLevel || 'low'}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Clean human behavioral cadence, deterministic canvas hash, and valid domain. Full 50 compute credits unlocked.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-3.5 px-6 text-center text-[11px] font-mono text-muted-foreground bg-background/90 backdrop-blur-md">
        TCT Shield Sandbox • Stopping free-tier quota leakage for freemium SaaS teams without $500/mo enterprise lock-in.
      </footer>
    </div>
  );
}
