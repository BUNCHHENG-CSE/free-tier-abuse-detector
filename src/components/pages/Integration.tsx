'use client';

import React, { useState } from 'react';
import { Code2, Copy, Check, DollarSign, ShieldCheck, Sparkles } from 'lucide-react';

export const Integration: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSnippetTab, setActiveSnippetTab] = useState<'script' | 'react' | 'backend' | 'form'>('script');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const scriptSnippet = `<!-- 1. Include ultra-lightweight (<10KB) AbuseShield SDK -->
<script
  src="/sdk/abuse-shield.min.js"
  data-api-key="pk_live_abuseshield_demo"
  data-auto-attach="true">
</script>

<script>
  // Access hardware fingerprint at signup time:
  window.AbuseShield.getFingerprint().then((fp) => {
    console.log('Deterministic Hardware FP:', fp.fingerprintId);
    console.log('Entropy Confidence:', fp.confidence);
  });
</script>`;

  const reactSnippet = `import { useEffect, useState } from 'react';
import { AbuseShield } from '@/sdk';

export function useAbuseShield(apiKey = 'pk_live_abuseshield_demo') {
  const [fingerprint, setFingerprint] = useState(null);

  useEffect(() => {
    const client = AbuseShield.init({ apiKey });
    client.getFingerprint().then(setFingerprint);
  }, [apiKey]);

  const verifyRegistration = async (email: string) => {
    return AbuseShield.verify({ email, action: 'signup' });
  };

  return { fingerprint, verifyRegistration };
}`;

  const backendSnippet = `// Next.js App Router / Node.js Backend Verification (Server-to-Server)
export async function POST(req: Request) {
  const { email, as_fingerprint_id, as_client_token } = await req.json();

  // Query AbuseShield risk engine
  const check = await fetch(new URL('/api/v1/verify', req.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AbuseShield-Key': process.env.ABUSESHIELD_KEY || 'pk_live_abuseshield_demo'
    },
    body: JSON.stringify({
      email,
      clientFingerprintId: as_fingerprint_id,
      clientToken: as_client_token,
      action: 'signup'
    })
  }).then(r => r.json());

  if (check.action === 'flag') {
    // Queued in staff dashboard without blocking the customer
    console.log('Suspicious registration queued for review. Risk Score:', check.riskScore);
  }

  // Complete user creation with zero false-positive dropoff
  return Response.json({ success: true, reviewRequired: check.reviewRequired });
}`;

  const formSnippet = `<!-- Auto-attach to registration form: Automatically injects hidden inputs -->
<form action="/signup" method="POST" data-abuseshield="true">
  <input type="email" name="email" placeholder="you@company.com" required />
  <input type="password" name="password" required />

  <!-- Hidden inputs injected on submit automatically:
       <input type="hidden" name="as_fingerprint_id" value="fp_8a2d..." />
       <input type="hidden" name="as_client_token" value="tok_..." />
  -->

  <button type="submit">Start Free Trial</button>
</form>`;

  const snippets = {
    script: { label: '1. Script Tag (<10KB)', code: scriptSnippet, desc: 'Zero build tools needed. Paste into HTML head or Webflow/Framer/Carrd.' },
    react: { label: '2. React / Next.js Hook', code: reactSnippet, desc: 'TypeScript hook for Single Page Apps and modern web frameworks.' },
    backend: { label: '3. Next.js / Node Verification', code: backendSnippet, desc: 'Server-to-server risk score verification handler.' },
    form: { label: '4. Form Auto-Attach', code: formSnippet, desc: 'Infers inputs and appends hidden token fields on form submission.' },
  };

  return (
    <div className="space-y-3.5 w-full">
      {/* Header HUD */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Code2 className="w-5 h-5 text-muted-foreground" />
          <span>SDK Integration & Market Positioning</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Drop the &lt;10KB SDK script into your signup page, collect physical hardware entropy in &lt;15ms, and query the risk engine.
        </p>
      </div>

      {/* Pricing Comparison Anchor Table */}
      <div className="border border-border rounded-lg bg-card p-3.5 sm:p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-2.5">
          <div>
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Indie SaaS Positioning & Enterprise Comparison</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Why enterprise fraud vendors fail bootstrapped and indie SaaS teams.
            </p>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium border border-emerald-500/25 font-mono">
            $29 – $79 / month
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/30 border-b border-border text-[10px] uppercase font-mono font-medium text-muted-foreground">
              <tr>
                <th className="py-2 px-3">Solution</th>
                <th className="py-2 px-3">Monthly Cost</th>
                <th className="py-2 px-3">SDK Bundle Size</th>
                <th className="py-2 px-3">Blocking Policy</th>
                <th className="py-2 px-3">Target ICP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-muted-foreground font-mono">
              <tr className="hover:bg-muted/20 transition-colors">
                <td className="py-2 px-3 font-medium text-muted-foreground">Castle.io</td>
                <td className="py-2 px-3">~$500 / mo</td>
                <td className="py-2 px-3">&gt;45 KB (Heavy)</td>
                <td className="py-2 px-3">Black-box rules</td>
                <td className="py-2 px-3">Enterprise Teams</td>
              </tr>
              <tr className="hover:bg-muted/20 transition-colors">
                <td className="py-2 px-3 font-medium text-muted-foreground">FingerprintJS Pro</td>
                <td className="py-2 px-3">~$200 / mo</td>
                <td className="py-2 px-3">~20 KB</td>
                <td className="py-2 px-3">Raw ID generation</td>
                <td className="py-2 px-3">Mid-Market SaaS</td>
              </tr>
              <tr className="bg-muted/40 border-l-2 border-foreground font-semibold text-foreground">
                <td className="py-2 px-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>AbuseShield</span>
                </td>
                <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-bold">$29 – $79 / mo</td>
                <td className="py-2 px-3">&lt; 10 KB (6.3KB gz)</td>
                <td className="py-2 px-3">Manual Triage Queue</td>
                <td className="py-2 px-3">Indie & Freemium SaaS</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-2.5 px-3 rounded-md border border-border bg-muted/20 text-xs text-muted-foreground space-y-0.5 font-mono">
          <strong className="text-foreground flex items-center gap-1.5 font-medium text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            Core Value Proposition:
          </strong>
          <p className="leading-relaxed text-[11px]">
            Reduce obvious free-tier abuse without false-positive customer lockouts. If multi-accounting is above 5% of monthly signups, AbuseShield pays for itself immediately by stopping free GPU/API token leakage.
          </p>
        </div>
      </div>

      {/* Tabbed Code Snippet Center */}
      <div className="border border-border rounded-lg bg-card p-3.5 sm:p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-2.5">
          <div>
            <h3 className="font-semibold text-sm text-foreground">SDK Implementation Guide</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{snippets[activeSnippetTab].desc}</p>
          </div>

          <button
            onClick={() => copyToClipboard(snippets[activeSnippetTab].code, activeSnippetTab)}
            className="h-7 px-2.5 rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-xs font-mono font-medium flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
          >
            {copiedKey === activeSnippetTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Snippet Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {(['script', 'react', 'backend', 'form'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSnippetTab(tab)}
              className={`h-7 px-2.5 rounded-md text-xs font-mono transition-colors shrink-0 ${
                activeSnippetTab === tab
                  ? 'bg-accent text-accent-foreground font-medium border border-border shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              {snippets[tab].label}
            </button>
          ))}
        </div>

        {/* Code Display */}
        <pre className="p-3 rounded-md border border-border bg-muted/20 text-xs text-foreground font-mono overflow-x-auto leading-relaxed shadow-2xs">
          {snippets[activeSnippetTab].code}
        </pre>
      </div>
    </div>
  );
};
