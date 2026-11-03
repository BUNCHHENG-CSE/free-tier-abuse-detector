'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle,
  Ban,
  AlertTriangle,
  Monitor,
  Cpu,
  Globe,
  Mail,
  Layers,
  Copy,
  Check,
  Hash,
  Terminal,
} from 'lucide-react';
import { ReviewDetailData } from '@/types';
import { api } from '@/lib/api';
import { RiskBadge } from './RiskBadge';

interface ReviewModalProps {
  itemId: string;
  onClose: () => void;
  onDecisionSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ itemId, onClose, onDecisionSubmitted }) => {
  const [data, setData] = useState<ReviewDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getReviewDetail(itemId)
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        alert(err.message);
        onClose();
      });
    return () => {
      mounted = false;
    };
  }, [itemId, onClose]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleDecision = async (decision: 'approved' | 'rejected' | 'abuser') => {
    try {
      setSubmitting(true);
      await api.submitDecision(itemId, decision, notes);
      onDecisionSubmitted();
      onClose();
    } catch (e: any) {
      alert(`Action failed: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="p-6 bg-card border border-border rounded-lg text-muted-foreground text-xs flex items-center gap-3 shadow-lg">
          <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
          <span>Loading investigation dossier...</span>
        </div>
      </div>
    );
  }

  const { item, linkedAccounts } = data;
  const signals = item.raw_signals;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[92vh] flex flex-col shadow-lg overflow-hidden animate-in fade-in my-auto">
        {/* Dossier Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-md border border-border bg-secondary/80 flex items-center justify-center text-foreground shrink-0 shadow-2xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-foreground text-sm tracking-tight">
                  {item.email || 'Anonymous Registration'}
                </h3>
                <RiskBadge score={item.risk_score} level={item.risk_level} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3 text-muted-foreground" />
                  <span>FP: {item.fingerprint_id.slice(0, 16)}...</span>
                  <button
                    onClick={() => handleCopy(item.fingerprint_id)}
                    className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                    title="Copy full fingerprint ID"
                  >
                    {copiedText === item.fingerprint_id ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </span>
                <span className="text-border">•</span>
                <span className="text-muted-foreground">IP: {item.ip_address}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dossier Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Risk Reasons Alert Box */}
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-destructive uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Detected Free-Tier Abuse Signals ({item.reasons.length})</span>
              </div>
              <span className="text-[10px] font-mono font-medium text-destructive px-2 py-0.5 rounded border border-destructive/30 bg-destructive/15">
                Action Required
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {item.reasons.map((r, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-md bg-card/60 border border-destructive/20 text-xs text-foreground flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0"></span>
                  <span className="leading-snug">{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2-Column Intel Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Multi-Account Cluster Card */}
            <div className="p-4 rounded-lg border border-border bg-card/50 space-y-3 flex flex-col justify-between shadow-2xs">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-medium uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                    Accounts on this Device ({linkedAccounts.length})
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Hardware Link</span>
                </div>

                <div className="divide-y divide-border/60 max-h-48 overflow-y-auto mt-2">
                  {linkedAccounts.length === 0 ? (
                    <div className="p-4 text-xs text-muted-foreground italic text-center">
                      No other accounts linked to this hardware yet.
                    </div>
                  ) : (
                    linkedAccounts.map((acc, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-medium text-foreground block">{acc.email}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {acc.ip_address} • {new Date(Number(acc.first_seen_at)).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-medium border ${
                            acc.status === 'banned'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : acc.status === 'flagged'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {acc.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-border text-[10px] text-muted-foreground">
                Triggered if &gt;2 distinct accounts share hardware token.
              </div>
            </div>

            {/* Extracted Hardware Signals */}
            <div className="p-4 rounded-lg border border-border bg-card/50 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <span className="text-xs font-medium uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
                  Hardware Entropy Signals
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">&lt;10KB SDK</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2 rounded-md bg-secondary/30 border border-border/60 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> GPU Architecture:
                  </span>
                  <span
                    className="font-mono text-foreground text-right max-w-[200px] truncate text-[11px]"
                    title={signals?.webgl?.unmaskedRenderer}
                  >
                    {signals?.webgl?.unmaskedRenderer || 'Standard WebGL Hardware'}
                  </span>
                </div>

                <div className="p-2 rounded-md bg-secondary/30 border border-border/60 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" /> Display Geometry:
                  </span>
                  <span className="font-mono text-foreground text-[11px]">
                    {signals?.screen?.width
                      ? `${signals.screen.width}x${signals.screen.height} @${signals.screen.devicePixelRatio}x`
                      : '1920x1080 @2x'}
                  </span>
                </div>

                <div className="p-2 rounded-md bg-secondary/30 border border-border/60 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> System Timezone:
                  </span>
                  <span className="font-mono text-foreground text-[11px]">
                    {signals?.system?.timezone || 'America/Los_Angeles'} ({signals?.system?.language || 'en-US'})
                  </span>
                </div>

                <div className="p-2 rounded-md bg-secondary/30 border border-border/60 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Automation Status:
                  </span>
                  <span
                    className={`font-mono text-[11px] font-medium ${
                      signals?.bot?.isWebdriver || signals?.bot?.isHeadless ? 'text-destructive' : 'text-emerald-400'
                    }`}
                  >
                    {signals?.bot?.isWebdriver
                      ? 'WebDriver Active'
                      : signals?.bot?.isHeadless
                      ? 'Headless Browser'
                      : 'Clean Human Browser'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Review Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Investigation / Staff Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Free-tier quota farming confirmed from same PC. Rotating Gmail aliases."
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
            />
          </div>
        </div>

        {/* Dossier Footer Decision Bar */}
        <div className="px-6 py-3.5 border-t border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Status:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-border bg-secondary text-secondary-foreground uppercase">
              {item.status}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDecision('approved')}
              disabled={submitting}
              className="h-8 px-3 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Allow (Approve)</span>
            </button>

            <button
              onClick={() => handleDecision('rejected')}
              disabled={submitting}
              className="h-8 px-3 rounded-md text-xs font-medium border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shadow-2xs"
            >
              <span>Reject</span>
            </button>

            <button
              onClick={() => handleDecision('abuser')}
              disabled={submitting}
              className="h-8 px-3 rounded-md text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Tag Abuser & Ban Device</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
