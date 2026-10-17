import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Sparkles, CheckCircle, AlertTriangle, Cpu, Monitor, Globe, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';

interface PlaygroundProps {
  onSwitchToQueue: () => void;
}

export const Playground: React.FC<PlaygroundProps> = ({ onSwitchToQueue }) => {
  const [email, setEmail] = useState('developer@startup.io');
  const [password, setPassword] = useState('secure_pass_123');
  const [fullName, setFullName] = useState('Sarah Chen');

  const [fingerprintResult, setFingerprintResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  // Collect real client fingerprint from window.AbuseShield on load
  const refreshFingerprint = async () => {
    try {
      if ((window as any).AbuseShield) {
        const fp = await (window as any).AbuseShield.getFingerprint();
        setFingerprintResult(fp);
      }
    } catch (e) {
      console.warn('Could not load browser fingerprint:', e);
    }
  };

  useEffect(() => {
    refreshFingerprint();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setVerifyResult(null);

      // Call verify on local AbuseShield backend
      const res = await fetch('http://localhost:4000/api/v1/verify', {
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

  const setScenario = (scenarioEmail: string) => {
    setEmail(scenarioEmail);
    setVerifyResult(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <span>Live Interactive Sandbox: &ldquo;Acme AI Studio&rdquo;</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Test real-time client fingerprinting and server risk evaluation. The SDK running below is analyzing your actual browser hardware signals right now.
        </p>
      </div>

      {/* Quick Test Preset Buttons */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400 mr-2">Preset Abuse Scenarios:</span>
        <button
          onClick={() => setScenario(`legit.user.${Math.floor(Math.random() * 899 + 100)}@gmail.com`)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition"
        >
          1. Clean User (New Legitimate Email)
        </button>
        <button
          onClick={() => setScenario('same.device.freequota@gmail.com')}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition"
        >
          2. Multi-Account Attack (Same Hardware)
        </button>
        <button
          onClick={() => setScenario(`free_credits_${Math.floor(Math.random() * 900)}@mailinator.com`)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition"
        >
          3. Disposable Email (Mailinator)
        </button>
        <button
          onClick={() => setScenario(`dev+abuse${Math.floor(Math.random() * 90)}@gmail.com`)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 transition"
        >
          4. Plus-Addressing Subalias (Gmail trick)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mock Freemium SaaS Signup Form */}
        <div className="border border-slate-800 rounded-2xl bg-gradient-to-b from-slate-900/70 to-slate-950 p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                AI
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Acme AI Studio</h3>
                <span className="text-[10px] text-emerald-400 font-semibold">Free-Trial: 50 Free GPU Credits</span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              Target App Form
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <Zap className="w-4 h-4" />
                <span>{submitting ? 'Verifying Hardware Signals...' : 'Start Free Tier (Submit Signup)'}</span>
              </button>
            </div>
          </form>

          {/* Live Server Risk Result Popup */}
          {verifyResult && (
            <div className={`p-4 rounded-xl border animate-fade-in space-y-3 ${
              verifyResult.action === 'flag'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  {verifyResult.action === 'flag' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Flagged for Review Queue</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Registration Allowed (Clean User)</span>
                    </>
                  )}
                </span>
                <RiskBadge score={verifyResult.riskScore} level={verifyResult.riskLevel} />
              </div>

              {verifyResult.reasons?.length > 0 && (
                <div className="space-y-1 text-xs">
                  <span className="font-semibold text-slate-300 block">Triggered Abuse Reasons:</span>
                  {verifyResult.reasons.map((r: string, idx: number) => (
                    <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0"></span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {verifyResult.action === 'flag' && (
                <button
                  onClick={onSwitchToQueue}
                  className="w-full mt-2 py-2 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 transition flex items-center justify-center gap-1.5"
                >
                  <span>Inspect in Manual Review Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Live Client Hardware Signals Inspector */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Live Browser Fingerprint Inspector</span>
              </h3>
              <p className="text-[11px] text-slate-400">Captured locally in your browser by the &lt;10KB SDK</p>
            </div>
            <button
              onClick={refreshFingerprint}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Re-run fingerprinting"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {fingerprintResult ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Canonical Device Fingerprint ID</span>
                <div className="font-mono text-xs font-bold text-indigo-300 break-all">
                  {fingerprintResult.fingerprintId}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>Confidence: {(fingerprintResult.confidence * 100).toFixed(0)}%</span>
                  <span>Collection Time: {fingerprintResult.elapsedMs}ms</span>
                </div>
              </div>

              {/* Signals Breakdown */}
              <div className="border border-slate-800 rounded-xl bg-slate-950/60 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" /> WebGL GPU:
                  </span>
                  <span className="font-mono text-slate-200 text-right max-w-[200px] truncate">
                    {fingerprintResult.signals?.webgl?.unmaskedRenderer || 'Standard WebGL'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-cyan-400" /> Screen & Pixel Ratio:
                  </span>
                  <span className="font-mono text-slate-200">
                    {fingerprintResult.signals?.screen?.width}x{fingerprintResult.signals?.screen?.height} @{fingerprintResult.signals?.screen?.devicePixelRatio}x
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" /> Timezone:
                  </span>
                  <span className="font-mono text-slate-200">
                    {fingerprintResult.signals?.system?.timezone || 'UTC'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Canvas Data Hash:</span>
                  <span className="font-mono text-slate-200">
                    {fingerprintResult.signals?.canvas?.hash?.slice(0, 16)}...
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Persistent Device Token:</span>
                  <span className="font-mono text-slate-300 text-[11px]">
                    {fingerprintResult.clientToken}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-slate-300 leading-relaxed">
                <strong className="text-indigo-300">How AbuseShield detects multi-accounting:</strong> If you change the email address above and submit again, the backend notices the exact same Fingerprint ID linking multiple accounts, increasing the Risk Score and placing it in your Review Queue!
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              Loading local browser fingerprint signals...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
