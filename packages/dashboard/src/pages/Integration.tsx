import React, { useState } from 'react';
import { Code2, Copy, Check, DollarSign, ShieldCheck, Zap, Layers } from 'lucide-react';

export const Integration: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const scriptSnippet = `<!-- 1. Include ultra-lightweight (<10KB) AbuseShield SDK -->
<script
  src="http://localhost:4000/sdk/abuse-shield.min.js"
  data-api-key="pk_live_abuseshield_demo"
  data-auto-attach="true">
</script>

<script>
  // Access fingerprint at registration time:
  window.AbuseShield.getFingerprint().then((fp) => {
    console.log('Device Fingerprint ID:', fp.fingerprintId);
    console.log('Signals Confidence:', fp.confidence);
  });
</script>`;

  const reactSnippet = `import { useEffect, useState } from 'react';
import { AbuseShield } from '@abuseshield/sdk';

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

  const backendSnippet = `// Node.js Express Backend Verification (Server-to-Server)
app.post('/api/auth/register', async (req, res) => {
  const { email, as_fingerprint_id, as_client_token } = req.body;

  // Verify registration against AbuseShield
  const check = await fetch('http://localhost:4000/api/v1/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AbuseShield-Key': process.env.ABUSESHIELD_KEY
    },
    body: JSON.stringify({
      email,
      clientFingerprintId: as_fingerprint_id,
      clientToken: as_client_token,
      action: 'signup'
    })
  }).then(r => r.json());

  if (check.action === 'flag') {
    // Put user in manual review queue or require email confirmation / soft challenge
    console.log('Flagged registration queued for review. Risk Score:', check.riskScore);
  }

  // Proceed with registration without hard black-box blocking
  return res.json({ success: true, reviewRequired: check.reviewRequired });
});`;

  const formSnippet = `<!-- Auto-attach to registration form: Automatically adds hidden input fields -->
<form action="/signup" method="POST" data-abuseshield="true">
  <input type="email" name="email" placeholder="you@company.com" required />
  <input type="password" name="password" required />

  <!-- Hidden inputs injected on submit automatically:
       <input type="hidden" name="as_fingerprint_id" value="fp_8a2d..." />
       <input type="hidden" name="as_client_token" value="tok_..." />
  -->

  <button type="submit">Start Free Trial</button>
</form>`;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-400" />
          <span>SDK Integration & Pricing Anchors</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Drop the &lt;10KB SDK script into your registration page, collect hardware signals in &lt;15ms, and query the risk engine.
        </p>
      </div>

      {/* Pricing Comparison Anchor Table */}
      <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Indie Positioning & Pricing Anchors</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enterprise fraud vendors are too heavy and expensive for early-stage freemium teams.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
            $29 – $79 / month
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/70 border-b border-slate-800 text-[11px] uppercase font-semibold text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Solution</th>
                <th className="py-2.5 px-3">Monthly Cost</th>
                <th className="py-2.5 px-3">SDK Size</th>
                <th className="py-2.5 px-3">Blocking Policy</th>
                <th className="py-2.5 px-3">Target Audience</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="bg-slate-900/30">
                <td className="py-2.5 px-3 font-semibold text-slate-400">Castle.io</td>
                <td className="py-2.5 px-3 text-slate-400 font-mono">~$500 / month</td>
                <td className="py-2.5 px-3 text-slate-400">Heavy (&gt;45KB)</td>
                <td className="py-2.5 px-3 text-slate-400">Complex rules</td>
                <td className="py-2.5 px-3 text-slate-400">Enterprise Security Teams</td>
              </tr>
              <tr className="bg-slate-900/30">
                <td className="py-2.5 px-3 font-semibold text-slate-400">FingerprintJS Pro</td>
                <td className="py-2.5 px-3 text-slate-400 font-mono">~$200 / month</td>
                <td className="py-2.5 px-3 text-slate-400">~20KB</td>
                <td className="py-2.5 px-3 text-slate-400">Pure ID generation</td>
                <td className="py-2.5 px-3 text-slate-400">Mid-Market SaaS</td>
              </tr>
              <tr className="bg-indigo-600/15 border-l-2 border-indigo-500">
                <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>AbuseShield (This Project)</span>
                </td>
                <td className="py-3 px-3 font-bold text-emerald-400 font-mono">$29 – $79 / month</td>
                <td className="py-3 px-3 font-bold text-indigo-300 font-mono">&lt; 10 KB (5.2KB gz)</td>
                <td className="py-3 px-3 text-white font-medium">Flagging & Manual Queue</td>
                <td className="py-3 px-3 font-semibold text-white">Indie Hackers & Freemium SaaS</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <strong className="text-white">Validation Threshold:</strong>
          <p>
            Position as <em>&quot;reduce obvious abuse,&quot;</em> not <em>&quot;eliminate all abuse.&quot;</em> If visually identifiable multi-accounting is below 5% of monthly signups, the customer&apos;s pain is not sharp enough. Above 5%, AbuseShield saves hundreds of dollars in free compute / quota leakage every month.
          </p>
        </div>
      </div>

      {/* Code Snippets */}
      <div className="space-y-6">
        {/* Standalone Script Tag */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">1. Script Tag (&lt;10KB Minified Standalone Bundle)</span>
              <span className="text-[11px] text-slate-400">Zero build tools needed. Add to your HTML header or Webflow/Carrd landing page.</span>
            </div>
            <button
              onClick={() => copyToClipboard(scriptSnippet, 'script')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5"
            >
              {copiedKey === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'script' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-indigo-200 font-mono overflow-x-auto leading-relaxed">
            {scriptSnippet}
          </pre>
        </div>

        {/* React / Next.js */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">2. React / Next.js Hook</span>
              <span className="text-[11px] text-slate-400">Import from `@abuseshield/sdk` with TypeScript definitions.</span>
            </div>
            <button
              onClick={() => copyToClipboard(reactSnippet, 'react')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5"
            >
              {copiedKey === 'react' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'react' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-indigo-200 font-mono overflow-x-auto leading-relaxed">
            {reactSnippet}
          </pre>
        </div>

        {/* Backend Verification */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">3. Server-to-Server Verification (Node.js / Express)</span>
              <span className="text-[11px] text-slate-400">Verify client token and fingerprint on your signup API handler.</span>
            </div>
            <button
              onClick={() => copyToClipboard(backendSnippet, 'backend')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5"
            >
              {copiedKey === 'backend' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'backend' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-indigo-200 font-mono overflow-x-auto leading-relaxed">
            {backendSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
};
