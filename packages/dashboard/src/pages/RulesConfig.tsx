import React, { useEffect, useState } from 'react';
import { Sliders, Save, Bell, Shield, Check, Info } from 'lucide-react';
import { RulesConfigData } from '../types';
import { api } from '../api';

export const RulesConfig: React.FC = () => {
  const [data, setData] = useState<RulesConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [maxReg24h, setMaxReg24h] = useState(3);
  const [maxAccFp, setMaxAccFp] = useState(2);
  const [flagDisposable, setFlagDisposable] = useState(true);
  const [flagBot, setFlagBot] = useState(true);
  const [flagIpHop, setFlagIpHop] = useState(true);
  const [minScore, setMinScore] = useState(35);
  const [webhookUrl, setWebhookUrl] = useState('');

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await api.getRules();
      setData(res);
      setMaxReg24h(res.rules.max_registrations_24h);
      setMaxAccFp(res.rules.max_accounts_per_fp);
      setFlagDisposable(res.rules.flag_disposable_email === 1);
      setFlagBot(res.rules.flag_headless_bot === 1);
      setFlagIpHop(res.rules.flag_ip_hopping === 1);
      setMinScore(res.rules.min_score_to_flag);
      setWebhookUrl(res.app.webhook_url || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateRules({
        max_registrations_24h: maxReg24h,
        max_accounts_per_fp: maxAccFp,
        flag_disposable_email: flagDisposable ? 1 : 0,
        flag_headless_bot: flagBot ? 1 : 0,
        flag_ip_hopping: flagIpHop ? 1 : 0,
        min_score_to_flag: minScore,
        webhook_url: webhookUrl,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      alert(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading rule engine configuration...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <span>Rule Engine & Flagging Thresholds</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure velocity limits, multi-accounting triggers, and review queue thresholds. AbuseShield flags suspicious activity for human review without hard black-box blocking.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Rules Section */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-5">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Detection Rules (MVP Rules Layer)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rule 1: Max 24h registrations */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <label className="text-xs font-bold text-slate-200 block">
                Rule 1: 24-Hour Registration Velocity (N)
              </label>
              <p className="text-[11px] text-slate-400">
                Same browser fingerprint registering more than <strong className="text-indigo-400">{maxReg24h} times</strong> in 24 hours → Flag for review
              </p>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={maxReg24h}
                  onChange={(e) => setMaxReg24h(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-500"
                />
                <span className="font-mono text-sm font-bold text-white w-8 text-right">{maxReg24h}</span>
              </div>
            </div>

            {/* Rule 2: Max accounts per fingerprint */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <label className="text-xs font-bold text-slate-200 block">
                Rule 2: Max Accounts per Device (M)
              </label>
              <p className="text-[11px] text-slate-400">
                Same browser fingerprint linked to more than <strong className="text-indigo-400">{maxAccFp} distinct accounts</strong> → Flag for review
              </p>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={maxAccFp}
                  onChange={(e) => setMaxAccFp(parseInt(e.target.value))}
                  className="flex-1 accent-indigo-500"
                />
                <span className="font-mono text-sm font-bold text-white w-8 text-right">{maxAccFp}</span>
              </div>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Flag Disposable / Temporary Email Domains</span>
                <span className="text-[11px] text-slate-400">
                  Detects Mailinator, GuerrillaMail, 10MinuteMail, and hundreds of disposable providers
                </span>
              </div>
              <input
                type="checkbox"
                checked={flagDisposable}
                onChange={(e) => setFlagDisposable(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Flag Automated Headless Browsers (WebDriver)</span>
                <span className="text-[11px] text-slate-400">
                  Detects navigator.webdriver, headless chrome markers, and automation scripts
                </span>
              </div>
              <input
                type="checkbox"
                checked={flagBot}
                onChange={(e) => setFlagBot(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Flag Rapid IP Hopping (VPN Bypass Detection)</span>
                <span className="text-[11px] text-slate-400">
                  Detects same device fingerprint rotating 3+ distinct IP addresses within 12 hours
                </span>
              </div>
              <input
                type="checkbox"
                checked={flagIpHop}
                onChange={(e) => setFlagIpHop(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Scoring & Queue Threshold */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <span>Review Queue Threshold</span>
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Minimum Risk Score to Queue for Review:</span>
              <span className="font-mono text-sm font-bold text-indigo-400">{minScore} / 100</span>
            </div>
            <input
              type="range"
              min="15"
              max="80"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Aggressive (15)</span>
              <span>Balanced (35 - Recommended)</span>
              <span>Permissive (70)</span>
            </div>
          </div>
        </div>

        {/* Webhooks Section */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Bell className="w-4 h-4 text-indigo-400" />
            <span>Abuse Alert Webhook</span>
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Slack / Discord / Custom Webhook URL</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/... or https://your-api.com/webhooks/abuse"
              className="w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-[11px] text-slate-500">Dispatches an instant notification whenever a registration is flagged for review.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-2 shadow-lg shadow-indigo-600/25"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Rule Configuration'}</span>
          </button>

          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 animate-fade-in font-medium">
              <Check className="w-4 h-4" />
              <span>Rules updated successfully!</span>
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
