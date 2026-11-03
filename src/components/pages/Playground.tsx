'use client';

import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Shield,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Cpu,
  Monitor,
  Globe,
  ArrowRight,
  Zap,
  RefreshCw,
  Layers,
  Laptop,
} from 'lucide-react';
import { RiskBadge } from '../RiskBadge';

interface PlaygroundProps {
  onSwitchToQueue: () => void;
}

export const Playground: React.FC<PlaygroundProps> = ({ onSwitchToQueue }) => {
  const [email, setEmail] = useState('developer@startup.io');
  const [password, setPassword] = useState('VoxelPass2026!');
  const [fullName, setFullName] = useState('Sarah Chen');

  const [fingerprintResult, setFingerprintResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [activeScenario, setActiveScenario] = useState<string>('clean');

  // Collect real client fingerprint from window.AbuseShield on load
  const refreshFingerprint = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).AbuseShield) {
        const fp = await (window as any).AbuseShield.getFingerprint();
        setFingerprintResult(fp);
      }
    } catch (e) {
      console.warn('Could not load browser fingerprint:', e);
    }
  };

  useEffect(() => {
    refreshFingerprint();
    const timer = setTimeout(refreshFingerprint, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setVerifyResult(null);

      // Call verify on local AbuseShield backend
      const res = await fetch('/api/v1/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AbuseShield-Key': 'pk_live_abuseshield_demo',
        },
        body: JSON.stringify({
          email,
          action: 'signup',
          clientFingerprintId: fingerprintResult?.fingerprintId || 'fp_browser_demo',
          clientToken: fingerprintResult?.clientToken || 'tok_demo',
          signals: fingerprintResult?.signals,
        }),
      });

      const data = await res.json();
      setVerifyResult(data);
    } catch (err: any) {
      alert(`Verify request failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const setScenario = (scenarioType: string, scenarioEmail: string) => {
    setActiveScenario(scenarioType);
    setEmail(scenarioEmail);
    setVerifyResult(null);
  };

  return (
    <div className="space-y-3.5 w-full">
      {/* Header HUD */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Terminal className="w-5 h-5 text-muted-foreground" />
          <span>Interactive Attack Simulator & Hardware Sandbox</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Test real-time browser entropy collection and risk scoring. The &lt;10KB SDK running in this tab is inspecting your hardware signals live.
        </p>
      </div>

      {/* Preset Scenario Selector HUD */}
      <div className="p-3 sm:p-3.5 rounded-lg border border-border bg-card space-y-2 shadow-xs">
        <span className="text-[10px] font-mono uppercase font-medium text-muted-foreground tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Select Abuse Test Scenario:
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setScenario('clean', `legit.user.${Math.floor(Math.random() * 899 + 100)}@techfirm.io`)}
            className={`p-2.5 rounded-md border text-left transition-colors font-mono ${
              activeScenario === 'clean'
                ? 'bg-accent text-accent-foreground border-foreground/50 shadow-2xs'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clean User</span>
            </div>
            <p className="text-[10px] opacity-75 mt-0.5 leading-snug">
              Standard organic corporate email. Score: 0 (Allowed).
            </p>
          </button>

          <button
            type="button"
            onClick={() => setScenario('multi', 'same.device.freequota@gmail.com')}
            className={`p-2.5 rounded-md border text-left transition-colors font-mono ${
              activeScenario === 'multi'
                ? 'bg-accent text-accent-foreground border-foreground/50 shadow-2xs'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Layers className="w-3.5 h-3.5 text-destructive" />
              <span>Multi-Account Farm</span>
            </div>
            <p className="text-[10px] opacity-75 mt-0.5 leading-snug">
              Same device registering 2nd/3rd account. Flags cluster.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setScenario('tempmail', `free_harvest_${Math.floor(Math.random() * 900)}@mailinator.com`)}
            className={`p-2.5 rounded-md border text-left transition-colors font-mono ${
              activeScenario === 'tempmail'
                ? 'bg-accent text-accent-foreground border-foreground/50 shadow-2xs'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Disposable Email</span>
            </div>
            <p className="text-[10px] opacity-75 mt-0.5 leading-snug">
              Mailinator / 10MinuteMail temporary domain detection.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setScenario('alias', `alex.morrison+freegpu${Math.floor(Math.random() * 90)}@gmail.com`)}
            className={`p-2.5 rounded-md border text-left transition-colors font-mono ${
              activeScenario === 'alias'
                ? 'bg-accent text-accent-foreground border-foreground/50 shadow-2xs'
                : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Plus-Alias Trick</span>
            </div>
            <p className="text-[10px] opacity-75 mt-0.5 leading-snug">
              Gmail +alias subaddressing clustered to primary box.
            </p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4">
        {/* Mock Freemium SaaS Signup Form */}
        <div className="lg:col-span-6 border border-border rounded-lg bg-card p-3.5 sm:p-4 space-y-3 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-border bg-secondary flex items-center justify-center font-bold text-xs text-foreground">
                  V
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">VoxelAI Studio</h3>
                  <span className="text-[10px] text-muted-foreground font-mono">Protected Client Signup Form</span>
                </div>
              </div>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border border-border bg-secondary text-secondary-foreground font-medium">
                50 Free Credits
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5 pt-2.5">
              <div>
                <label className="text-[11px] font-medium text-foreground block mb-0.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-foreground block mb-0.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-foreground block mb-0.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-2xs"
                  required
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-8 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{submitting ? 'Inspecting Client Hardware Signals...' : 'Claim 50 Free GPU Credits'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Verification Server Result */}
          {verifyResult && (
            <div className={`p-3 rounded-md border space-y-2 font-mono ${
              verifyResult.action === 'flag'
                ? 'bg-destructive/10 border-destructive/25 text-foreground'
                : 'bg-emerald-500/10 border-emerald-500/25 text-foreground'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  {verifyResult.action === 'flag' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="text-destructive">Flagged for Staff Triage</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Registration Allowed (Clean User)</span>
                    </>
                  )}
                </span>
                <RiskBadge score={verifyResult.riskScore} level={verifyResult.riskLevel} />
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {verifyResult.action === 'flag'
                  ? 'Registration succeeded without friction for the customer, but hardware flags queued it for staff manual review in AbuseShield.'
                  : 'Passed all multi-accounting and disposable domain checks. Full quota access granted.'}
              </p>

              {verifyResult.reasons?.length > 0 && (
                <div className="space-y-1 text-xs pt-0.5">
                  <span className="font-medium text-foreground block text-[11px]">Triggered Abuse Rules:</span>
                  <div className="flex flex-wrap gap-1">
                    {verifyResult.reasons.map((r: string, idx: number) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-destructive/15 text-destructive text-[10px] font-mono border border-destructive/30">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {verifyResult.action === 'flag' && (
                <button
                  onClick={onSwitchToQueue}
                  className="w-full mt-1 h-7 rounded-md text-xs font-medium border border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Open in Manual Review Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Live Client Hardware Signals Inspector */}
        <div className="lg:col-span-6 border border-border rounded-lg bg-card p-3.5 sm:p-4 space-y-3 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span>Real-Time Browser Entropy Inspector</span>
                </h3>
                <p className="text-[10px] text-muted-foreground font-mono">Captured locally in your active browser window by the &lt;10KB SDK</p>
              </div>
              <button
                onClick={refreshFingerprint}
                className="h-7 w-7 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-2xs"
                title="Re-run fingerprinting"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {fingerprintResult ? (
              <div className="space-y-2.5 pt-1.5 font-mono">
                {/* Fingerprint ID Card */}
                <div className="p-2.5 rounded-md border border-border bg-muted/20 space-y-0.5">
                  <span className="text-[10px] uppercase font-mono font-medium text-muted-foreground tracking-wider">
                    Deterministic Hardware Hash (MurmurHash3)
                  </span>
                  <div className="font-mono text-xs font-semibold text-foreground break-all">
                    {fingerprintResult.fingerprintId}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-0.5">
                    <span>Confidence: {(fingerprintResult.confidence * 100).toFixed(0)}%</span>
                    <span>Execution: {fingerprintResult.elapsedMs}ms</span>
                  </div>
                </div>

                {/* Signals Matrix */}
                <div className="space-y-1 text-xs">
                  <div className="p-2 rounded-md border border-border/60 bg-secondary/30 flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Cpu className="w-3.5 h-3.5" /> WebGL GPU:
                    </span>
                    <span className="font-mono text-foreground text-right max-w-[200px] truncate text-[11px]" title={fingerprintResult.signals?.webgl?.unmaskedRenderer}>
                      {fingerprintResult.signals?.webgl?.unmaskedRenderer || 'Standard WebGL'}
                    </span>
                  </div>

                  <div className="p-2 rounded-md border border-border/60 bg-secondary/30 flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Monitor className="w-3.5 h-3.5" /> Geometry & DPI:
                    </span>
                    <span className="font-mono text-foreground text-[11px]">
                      {fingerprintResult.signals?.screen?.width}x{fingerprintResult.signals?.screen?.height} @{fingerprintResult.signals?.screen?.devicePixelRatio}x
                    </span>
                  </div>

                  <div className="p-2 rounded-md border border-border/60 bg-secondary/30 flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Globe className="w-3.5 h-3.5" /> Timezone:
                    </span>
                    <span className="font-mono text-foreground text-[11px]">
                      {fingerprintResult.signals?.system?.timezone || 'UTC'}
                    </span>
                  </div>

                  <div className="p-2 rounded-md border border-border/60 bg-secondary/30 flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Terminal className="w-3.5 h-3.5" /> Canvas 2D Digest:
                    </span>
                    <span className="font-mono text-foreground text-[11px]">
                      {fingerprintResult.signals?.canvas?.hash?.slice(0, 16)}...
                    </span>
                  </div>

                  <div className="p-2 rounded-md border border-border/60 bg-secondary/30 flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                      <Laptop className="w-3.5 h-3.5" /> Device Token:
                    </span>
                    <span className="font-mono text-foreground text-[11px]">
                      {fingerprintResult.clientToken?.slice(0, 18)}...
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground italic font-mono">
                Collecting local browser hardware entropy...
              </div>
            )}
          </div>

          <div className="p-2.5 rounded-md border border-border bg-muted/30 text-[10px] text-muted-foreground leading-relaxed space-y-0.5 font-mono">
            <span className="font-medium text-foreground block">How AbuseShield detects fraud rings:</span>
            <p>
              When a user rotates emails to harvest trial bonuses, their physical GPU shader precision, font glyph layout, and audio dynamics remain deterministic, allowing AbuseShield to correlate accounts instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
