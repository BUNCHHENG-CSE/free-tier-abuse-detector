import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, CheckCircle, Ban, AlertTriangle, Monitor, Cpu, Globe, Mail, Clock } from 'lucide-react';
import { ReviewDetailData } from '../types';
import { api } from '../api';
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

  useEffect(() => {
    let mounted = true;
    api.getReviewDetail(itemId)
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
  }, [itemId]);

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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm">
          Loading investigation details...
        </div>
      </div>
    );
  }

  const { item, linkedAccounts, eventTimeline } = data;
  const signals = item.raw_signals;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl shadow-indigo-950/40 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center">
              <Mail className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{item.email || 'Anonymous Registration'}</h3>
                <RiskBadge score={item.risk_score} level={item.risk_level} />
              </div>
              <p className="text-xs text-muted font-mono flex items-center gap-2 mt-0.5">
                <span>FP: {item.fingerprint_id}</span>
                <span>•</span>
                <span>IP: {item.ip_address}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Triggered Reasons Alert */}
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Flagged Risk Signals ({item.reasons.length})</span>
            </div>
            <ul className="space-y-1.5">
              {item.reasons.map((r, idx) => (
                <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Multi-Account Cluster on this Device */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Accounts on this Device ({linkedAccounts.length})
                </span>
                <span className="text-[10px] text-muted font-mono">same hardware FP</span>
              </div>
              <div className="border border-slate-800/80 rounded-xl bg-slate-900/30 divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
                {linkedAccounts.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 italic">No other accounts linked</div>
                ) : (
                  linkedAccounts.map((acc, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-slate-200">{acc.email}</span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {acc.ip_address} • {new Date(acc.first_seen_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          acc.status === 'banned'
                            ? 'bg-rose-500/20 text-rose-400'
                            : acc.status === 'flagged'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {acc.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Hardware Signals Breakdown */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Extracted Hardware Signals
              </span>
              <div className="border border-slate-800/80 rounded-xl bg-slate-900/30 p-3.5 space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" /> WebGL GPU:
                  </span>
                  <span className="font-mono text-slate-200 text-right max-w-[220px] truncate" title={signals?.webgl?.unmaskedRenderer}>
                    {signals?.webgl?.unmaskedRenderer || 'Masked / Headless'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-cyan-400" /> Resolution:
                  </span>
                  <span className="font-mono text-slate-200">
                    {signals?.screen?.width ? `${signals.screen.width}x${signals.screen.height} @${signals.screen.devicePixelRatio}x` : '800x600 (Virtual)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" /> Timezone & Locale:
                  </span>
                  <span className="font-mono text-slate-200">
                    {signals?.system?.timezone || 'UTC'} ({signals?.system?.language || 'en'})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bot / Automation:</span>
                  <span className={`font-semibold ${signals?.bot?.isWebdriver || signals?.bot?.isHeadless ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {signals?.bot?.isWebdriver ? 'WebDriver: TRUE' : signals?.bot?.isHeadless ? 'Headless: TRUE' : 'Clean'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Review Notes Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Reviewer Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Free-tier quota harvester confirmed; rotating ProtonMail addresses"
              className="w-full px-3.5 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Modal Footer Decisions */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Current status: <strong className="text-white uppercase">{item.status}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDecision('approved')}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Approve (Allow)</span>
            </button>
            <button
              onClick={() => handleDecision('rejected')}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
            >
              <span>Reject Registration</span>
            </button>
            <button
              onClick={() => handleDecision('abuser')}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500 text-white hover:bg-rose-600 transition flex items-center gap-1.5 shadow-lg shadow-rose-950/40"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Tag as Abuser & Ban Device</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
