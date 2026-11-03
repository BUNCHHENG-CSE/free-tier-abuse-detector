'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { DeviceQuotaRecord } from '@/types';
import {
  Coins,
  ShieldAlert,
  RotateCcw,
  Lock,
  Unlock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Info,
} from 'lucide-react';

export const DeviceQuotas: React.FC = () => {
  const [quotas, setQuotas] = useState<DeviceQuotaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchQuotas = async () => {
    try {
      setLoading(true);
      const res = await api.getDeviceQuotas();
      setQuotas(res.quotas);
    } catch (err) {
      console.error('Failed to load device quotas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotas();
  }, []);

  const handleReset = async (fpId: string) => {
    try {
      await api.resetDeviceQuota(fpId);
      setActionSuccess(`Reset quota pool for ${fpId.slice(0, 14)}...`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchQuotas();
    } catch (err: any) {
      alert('Error resetting quota: ' + err.message);
    }
  };

  const handleToggleLock = async (fpId: string, currentLocked: number) => {
    try {
      const willLock = currentLocked === 0;
      await api.lockDeviceQuota(fpId, willLock);
      setActionSuccess(`${willLock ? 'Locked' : 'Unlocked'} quota pool for ${fpId.slice(0, 14)}...`);
      setTimeout(() => setActionSuccess(null), 3000);
      fetchQuotas();
    } catch (err: any) {
      alert('Error updating lock status: ' + err.message);
    }
  };

  const filteredQuotas = quotas.filter((q) =>
    q.fingerprint_id.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsedCredits = quotas.reduce((acc, q) => acc + q.credits_used, 0);
  const lockedCount = quotas.filter((q) => q.is_locked === 1).length;
  const exhaustedCount = quotas.filter((q) => q.credits_used >= q.credits_allocated).length;

  return (
    <div className="space-y-3.5 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">Device-Bound Trial Quota Pools</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
              CROSS-ACCOUNT GUARD
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enforce a shared free compute & trial quota per hardware fingerprint across all linked accounts.
          </p>
        </div>

        <button
          onClick={fetchQuotas}
          className="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-medium text-foreground transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Pools</span>
        </button>
      </div>

      {/* Info Callout */}
      <div className="p-2.5 px-3.5 rounded-lg border border-primary/20 bg-primary/5 flex items-start sm:items-center gap-2.5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-[11px] sm:text-xs text-muted-foreground leading-normal">
          <strong className="text-foreground font-semibold">How Trial Pooling Stops Compute Drain: </strong>
          When an abuser creates 5 accounts on the same machine to harvest free tokens,
          AbuseShield binds credit consumption to their hardware fingerprint. Once their shared pool reaches the quota cap (50 credits),
          further free actions are denied across <span className="text-foreground font-medium">all 5 accounts simultaneously</span>.
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-card shadow-xs space-y-0.5">
          <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Active Device Pools</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-foreground">{quotas.length}</div>
          <span className="text-[10px] text-muted-foreground block truncate">Tracked hardware devices</span>
        </div>

        <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-card shadow-xs space-y-0.5">
          <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Total Credits Burned</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-primary flex items-center gap-1.5">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{totalUsedCredits}</span>
          </div>
          <span className="text-[10px] text-muted-foreground block truncate">Aggregate cross-account usage</span>
        </div>

        <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-card shadow-xs space-y-0.5">
          <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Exhausted Device Pools</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-500 flex items-center gap-1.5">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{exhaustedCount}</span>
          </div>
          <span className="text-[10px] text-muted-foreground block truncate">Reached free tier trial cap</span>
        </div>

        <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-card shadow-xs space-y-0.5">
          <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Locked Abuse Devices</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-destructive flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{lockedCount}</span>
          </div>
          <span className="text-[10px] text-muted-foreground block truncate">Quota hard-locked by staff</span>
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-2.5 px-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter device pools by fingerprint ID (fp_...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 h-8 rounded-lg border border-border bg-card text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-card sticky top-0 z-20 border-b border-border text-[10px] uppercase font-mono font-medium text-muted-foreground tracking-wider shadow-2xs">
              <tr>
                <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">Device Fingerprint</th>
                <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">Linked Accounts</th>
                <th className="py-2.5 px-3.5 min-w-[170px] bg-card/95 backdrop-blur-sm sticky top-0">Trial Quota Consumption</th>
                <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">Status</th>
                <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">Last Activity</th>
                <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                    Loading device quota pools...
                  </td>
                </tr>
              ) : filteredQuotas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                    No device quota pools registered yet. Initiate a trial signup in the demo SaaS or call <code className="font-mono text-foreground">AbuseShield.consumeQuota()</code>.
                  </td>
                </tr>
              ) : (
                filteredQuotas.map((q) => {
                  const percent = Math.min(100, Math.round((q.credits_used / q.credits_allocated) * 100));
                  const isExhausted = q.credits_used >= q.credits_allocated;
                  const isLocked = q.is_locked === 1;

                  return (
                    <tr key={q.fingerprint_id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3.5 font-mono font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{q.fingerprint_id.slice(0, 16)}...</span>
                        </div>
                      </td>
                      <td className="py-2 px-3.5 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${q.linked_accounts_count > 1 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-muted text-muted-foreground'}`}>
                          {q.linked_accounts_count} accounts
                        </span>
                      </td>
                      <td className="py-2 px-3.5">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-foreground font-semibold">{q.credits_used} / {q.credits_allocated} credits</span>
                            <span className="text-muted-foreground">{percent}%</span>
                          </div>
                          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${isLocked ? 'bg-destructive' : isExhausted ? 'bg-amber-500' : 'bg-primary'}`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3.5">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-destructive/15 text-destructive border border-destructive/30">
                            <Lock className="w-3 h-3" />
                            LOCKED
                          </span>
                        ) : isExhausted ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            EXHAUSTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3.5 text-muted-foreground font-mono text-[11px]">
                        {new Date(q.last_used_at).toLocaleDateString()} {new Date(q.last_used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 px-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleReset(q.fingerprint_id)}
                            title="Reset consumed credits to 0"
                            className="h-6 px-2 rounded-md border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition text-[11px] flex items-center gap-1 shadow-2xs"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset</span>
                          </button>
                          <button
                            onClick={() => handleToggleLock(q.fingerprint_id, q.is_locked)}
                            title={isLocked ? 'Unlock device quota' : 'Lock device quota'}
                            className={`h-6 px-2 rounded-md border transition text-[11px] flex items-center gap-1 shadow-2xs ${isLocked ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-destructive/30 text-destructive hover:bg-destructive/10'}`}
                          >
                            {isLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            <span>{isLocked ? 'Unlock' : 'Lock'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
