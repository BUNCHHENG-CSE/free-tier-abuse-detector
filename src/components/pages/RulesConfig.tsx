'use client';

import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Save,
  Bell,
  Shield,
  Check,
  Zap,
  AlertTriangle,
  Globe,
  Activity,
  Cpu,
  Coins,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { RulesConfigData } from '@/types';
import { api } from '@/lib/api';

export const RulesConfig: React.FC = () => {
  const [data, setData] = useState<RulesConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ type: string; message: string; success: boolean } | null>(null);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Form states
  const [maxReg24h, setMaxReg24h] = useState(3);
  const [maxAccFp, setMaxAccFp] = useState(2);
  const [flagDisposable, setFlagDisposable] = useState(true);
  const [flagBot, setFlagBot] = useState(true);
  const [flagIpHop, setFlagIpHop] = useState(true);
  const [flagBehavioral, setFlagBehavioral] = useState(true);
  const [flagTampering, setFlagTampering] = useState(true);
  const [powEnabled, setPowEnabled] = useState(true);
  const [powDifficulty, setPowDifficulty] = useState(4);
  const [quotaLimit, setQuotaLimit] = useState(50);
  const [minScore, setMinScore] = useState(35);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');

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
      setFlagBehavioral(res.rules.flag_behavioral_bot !== 0);
      setFlagTampering(res.rules.flag_tampering !== 0);
      setPowEnabled(res.rules.pow_enabled !== 0);
      setPowDifficulty(res.rules.pow_difficulty ?? 4);
      setQuotaLimit(res.rules.quota_limit ?? 50);
      setMinScore(res.rules.min_score_to_flag);
      setWebhookUrl(res.app.webhook_url || '');
      setDiscordWebhookUrl(res.rules.discord_webhook_url || '');
      setSlackWebhookUrl(res.rules.slack_webhook_url || '');
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
        flag_behavioral_bot: flagBehavioral ? 1 : 0,
        flag_tampering: flagTampering ? 1 : 0,
        pow_enabled: powEnabled ? 1 : 0,
        pow_difficulty: powDifficulty,
        quota_limit: quotaLimit,
        discord_webhook_url: discordWebhookUrl,
        slack_webhook_url: slackWebhookUrl,
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

  const handleTestWebhook = async (url: string, type: string) => {
    if (!url) {
      alert(`Please enter a valid ${type} webhook URL first.`);
      return;
    }
    try {
      setTestingWebhook(true);
      const res = await api.testWebhook(url, type);
      setTestResult({ type, message: res.message, success: res.success });
      setTimeout(() => setTestResult(null), 5000);
    } catch (e: any) {
      setTestResult({ type, message: e.message, success: false });
      setTimeout(() => setTestResult(null), 5000);
    } finally {
      setTestingWebhook(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
        <span>Loading detection rule engine configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 w-full">
      {/* Header HUD */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Sliders className="w-5 h-5 text-muted-foreground" />
          <span>Rule Engine & Threat Flagging Thresholds</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Tune your velocity barriers, behavioral biometric tolerances, adaptive PoW puzzles, and free trial credit caps.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-3.5">
        {/* Core Detection Rules Grid */}
        <div className="border border-border rounded-lg bg-card p-3.5 sm:p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span>Velocity & Multi-Accounting Limits</span>
            </h3>
            <span className="text-[10px] uppercase font-mono font-medium px-1.5 py-0.2 rounded border border-border bg-secondary text-secondary-foreground">
              Active Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Rule 1: 24h Registration Velocity */}
            <div className="p-3 rounded-md border border-border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>24-Hour Hardware Velocity (N)</span>
                </span>
                <span className="text-[10px] font-mono font-medium text-destructive bg-destructive/15 px-1.5 py-0.2 rounded border border-destructive/30">
                  +40 PTS
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                Flags device if registered more than <strong className="text-foreground font-semibold font-mono">{maxReg24h} times</strong> across rolling 24 hours.
              </p>
              <div className="pt-1.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground text-[10px]">1 signup (Strict)</span>
                  <span className="font-semibold text-foreground bg-secondary px-2 py-0.5 rounded border border-border text-xs">
                    {maxReg24h} signups
                  </span>
                  <span className="text-muted-foreground text-[10px]">10 signups (Permissive)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={maxReg24h}
                  onChange={(e) => setMaxReg24h(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Rule 2: Multi-Account Linkage */}
            <div className="p-4 rounded-md border border-border bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Max Accounts per Device (M)</span>
                </span>
                <span className="text-[10px] font-mono font-medium text-destructive bg-destructive/15 px-1.5 py-0.2 rounded border border-destructive/30">
                  +35 PTS
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Flags device if linked to more than <strong className="text-foreground font-semibold font-mono">{maxAccFp} distinct accounts</strong> historically.
              </p>
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground text-[10px]">1 account</span>
                  <span className="font-semibold text-foreground bg-secondary px-2 py-0.5 rounded border border-border text-xs">
                    {maxAccFp} accounts
                  </span>
                  <span className="text-muted-foreground text-[10px]">10 accounts</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={maxAccFp}
                  onChange={(e) => setMaxAccFp(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between p-3.5 rounded-md border border-border bg-card/60 hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">Disposable & Temporary Email Domain Screening</span>
                  <span className="text-[10px] font-mono font-medium text-destructive bg-destructive/15 px-1.5 py-0.2 rounded border border-destructive/30">
                    +35 PTS
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  Instantly flags Mailinator, GuerrillaMail, 10MinuteMail, YOPmail, and 3,000+ burner email domains.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={flagDisposable}
                  onChange={(e) => setFlagDisposable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-foreground peer-checked:after:bg-background"></div>
              </label>
            </div>

            {/* Behavioral Biometrics */}
            <div className="flex items-center justify-between p-3.5 rounded-md border border-border bg-card/60 hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-foreground">Behavioral Biometrics & Instant Form-Fill Detection</span>
                  <span className="text-[10px] font-mono font-medium text-destructive bg-destructive/15 px-1.5 py-0.2 rounded border border-destructive/30">
                    +40 PTS
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  Detects automated submissions in &lt;600ms, robotic keystroke rhythms, and lack of human mouse curvature.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={flagBehavioral}
                  onChange={(e) => setFlagBehavioral(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-foreground peer-checked:after:bg-background"></div>
              </label>
            </div>

            {/* Canvas Farbling & Spoofing */}
            <div className="flex items-center justify-between p-3.5 rounded-md border border-border bg-card/60 hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium text-foreground">Anti-Fingerprint Farbling & Hardware Spoofing Shield</span>
                  <span className="text-[10px] font-mono font-medium text-destructive bg-destructive/15 px-1.5 py-0.2 rounded border border-destructive/30">
                    +40 PTS
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  Flags Brave Shields canvas noise farbling, Canvas Defender, and OS/User-Agent mismatches.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={flagTampering}
                  onChange={(e) => setFlagTampering(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-foreground peer-checked:after:bg-background"></div>
              </label>
            </div>

            {/* Headless & Bot Frameworks */}
            <div className="flex items-center justify-between p-3.5 rounded-md border border-border bg-card/60 hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">Headless Browser & WebDriver Bot Detection</span>
                  <span className="text-[10px] font-mono font-medium text-destructive bg-destructive/15 px-1.5 py-0.2 rounded border border-destructive/30">
                    +45 PTS
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  Identifies automated Puppeteer, Playwright, Selenium, and navigator.webdriver scripted runtimes.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={flagBot}
                  onChange={(e) => setFlagBot(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-foreground peer-checked:after:bg-background"></div>
              </label>
            </div>

            {/* IP Hopping */}
            <div className="flex items-center justify-between p-3.5 rounded-md border border-border bg-card/60 hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">Rapid IP Hopping & VPN Subnet Cycling</span>
                  <span className="text-[10px] font-mono font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30">
                    +20 PTS
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground block">
                  Correlates same browser hardware signature rapidly switching between 3+ distinct IP subnets within 12 hours.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={flagIpHop}
                  onChange={(e) => setFlagIpHop(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-foreground peer-checked:after:bg-background"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Adaptive PoW & Trial Quota Limit Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Adaptive PoW Challenge */}
          <div className="border border-border rounded-lg bg-card p-3.5 sm:p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Adaptive Proof-of-Work (PoW)</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={powEnabled}
                  onChange={(e) => setPowEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-foreground peer-checked:after:bg-background"></div>
              </label>
            </div>

            <p className="text-[11px] text-muted-foreground leading-normal">
              When a registration scores above the sensitivity threshold, AbuseShield responds with an invisible CPU challenge.
              Humans solve it in ~200ms; automated bot harvesters burn massive CPU.
            </p>

            <div className="space-y-1.5 pt-0.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground text-[10px]">Difficulty 2 (~20ms)</span>
                <span className="font-semibold text-foreground bg-secondary px-2 py-0.5 rounded border border-border text-xs">
                  Target: {powDifficulty} Leading Zeros
                </span>
                <span className="text-muted-foreground text-[10px]">Difficulty 5 (~1.2s)</span>
              </div>
              <input
                type="range"
                min="2"
                max="5"
                value={powDifficulty}
                onChange={(e) => setPowDifficulty(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Trial Quota Cap per Device */}
          <div className="border border-border rounded-lg bg-card p-3.5 sm:p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Device-Bound Trial Quota Cap</h3>
              </div>
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                {quotaLimit} Free Credits
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-normal">
              Maximum free tier operations or trial compute credits allowed per physical device fingerprint, pooled across all registered accounts.
            </p>

            <div className="space-y-1.5 pt-0.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground text-[10px]">10 Credits</span>
                <span className="font-semibold text-foreground bg-secondary px-2 py-0.5 rounded border border-border text-xs">
                  {quotaLimit} Credits Pool
                </span>
                <span className="text-muted-foreground text-[10px]">200 Credits</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={quotaLimit}
                onChange={(e) => setQuotaLimit(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Scoring & Queue Threshold */}
        <div className="border border-border rounded-lg bg-card p-3.5 sm:p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Review Queue Sensitivity Threshold</span>
            </h3>
            <span className="font-mono text-xs font-semibold text-foreground bg-secondary px-2 py-0.5 rounded border border-border">
              {minScore} / 100 Risk Score
            </span>
          </div>

          <div className="space-y-2 pt-0.5">
            <input
              type="range"
              min="15"
              max="80"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
              <span className="text-destructive">Aggressive (15 pts)</span>
              <span className="text-foreground font-medium">Recommended (35 pts)</span>
              <span className="text-emerald-400">Permissive (70 pts)</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Any registration event scoring at or above this threshold is automatically directed to your staff Manual Review Queue.
            </p>
          </div>
        </div>

        {/* Real-Time Discord & Slack Alert Webhooks */}
        <div className="border border-border rounded-lg bg-card p-3.5 sm:p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span>Real-Time Incident Alerts (Discord, Slack, & Custom Webhook)</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              RICH EMBEDS &amp; 1-CLICK ACTIONS
            </span>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                testResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-destructive/10 border-destructive/30 text-destructive'
              }`}
            >
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Discord Webhook */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#5865F2]"></span>
                  <span>Discord Channel Webhook URL</span>
                </label>
                <button
                  type="button"
                  disabled={testingWebhook || !discordWebhookUrl}
                  onClick={() => handleTestWebhook(discordWebhookUrl, 'discord')}
                  className="text-[11px] font-semibold text-[#5865F2] hover:underline flex items-center gap-1 disabled:opacity-40"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Test Discord Alert</span>
                </button>
              </div>
              <input
                type="url"
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-2xs"
              />
            </div>

            {/* Slack Webhook */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#4A154B]"></span>
                  <span>Slack Incoming Webhook URL</span>
                </label>
                <button
                  type="button"
                  disabled={testingWebhook || !slackWebhookUrl}
                  onClick={() => handleTestWebhook(slackWebhookUrl, 'slack')}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 disabled:opacity-40"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Test Slack Alert</span>
                </button>
              </div>
              <input
                type="url"
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-2xs"
              />
            </div>

            {/* Generic Webhook */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Generic JSON Ingestion Webhook URL</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/webhooks/abuse"
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Save Action */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="h-9 px-4 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Persisting Rules...' : 'Save Rule Configuration'}</span>
          </button>

          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Rules updated and reloaded successfully!</span>
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
