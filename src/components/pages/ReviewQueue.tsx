'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  CheckCircle2,
  Ban,
  Clock,
  Layers,
  ChevronRight,
  Copy,
  Check,
  Globe,
  Laptop,
} from 'lucide-react';
import { ReviewItem } from '@/types';
import { api } from '@/lib/api';
import { RiskBadge } from '../RiskBadge';

interface ReviewQueueProps {
  onOpenReview: (id: string) => void;
  onRefreshParent: () => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onOpenReview, onRefreshParent }) => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getReviewQueue(statusFilter, search);
      setItems(res.items);
      setPendingCount(res.pendingCount);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue();
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickDecision = async (
    id: string,
    decision: 'approved' | 'rejected' | 'abuser',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    try {
      await api.submitDecision(id, decision);
      fetchQueue();
      onRefreshParent();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const renderSignalBadge = (reason: string, idx: number) => {
    const isBot =
      reason.toLowerCase().includes('bot') ||
      reason.toLowerCase().includes('webdriver') ||
      reason.toLowerCase().includes('headless');
    const isTempMail = reason.toLowerCase().includes('disposable') || reason.toLowerCase().includes('email');
    const isMulti = reason.toLowerCase().includes('multi') || reason.toLowerCase().includes('account');

    let badgeClass = 'bg-secondary text-secondary-foreground border-border';
    if (isBot) badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25';
    else if (isTempMail) badgeClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25';
    else if (isMulti) badgeClass = 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/25';

    return (
      <span
        key={idx}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${badgeClass} max-w-[190px] truncate`}
        title={reason}
      >
        <span className="w-1 h-1 rounded-full bg-current opacity-80" />
        <span className="truncate">{reason}</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 space-y-3.5 w-full">
      {/* Header & Controls HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span>Manual Review Queue</span>
            {pendingCount > 0 ? (
              <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-destructive/15 text-destructive border border-destructive/30">
                {pendingCount} Pending Triage
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                Queue Clear
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Flagged suspicious registrations. Human-in-the-loop triage prevents false-positive lockouts.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, IP, or FP hash..."
            className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-card text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-2xs"
          />
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-2.5 overflow-x-auto shrink-0">
        {[
          { id: 'pending', label: 'Pending Review', count: pendingCount },
          { id: 'all', label: 'All Events' },
          { id: 'approved', label: 'Approved (Allowed)' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'abuser', label: 'Banned Devices' },
        ].map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`h-8 px-3 rounded-md text-xs font-mono transition-colors flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-accent text-accent-foreground font-medium border border-border shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-destructive/20 text-destructive font-bold">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Queue Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden shadow-xs flex-1 min-h-0 flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-muted-foreground gap-2">
            <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
            <span>Fetching flagged registrations...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-md border border-border bg-secondary flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">Review Queue is Clear</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              No registrations are waiting in this triage view. You can simulate attack scenarios using the header simulator to generate test traffic.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-card sticky top-0 z-20 border-b border-border text-[10px] uppercase font-mono font-medium text-muted-foreground tracking-wider shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">User / Registration</th>
                    <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">Threat Score</th>
                    <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">Triggered Signals</th>
                    <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">Hardware Cluster</th>
                    <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">Origin & Time</th>
                    <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0 text-right">Triage Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onOpenReview(item.id)}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <td className="py-2 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded border border-border bg-secondary flex items-center justify-center font-mono font-semibold text-xs text-foreground shrink-0">
                          {item.email ? item.email[0].toUpperCase() : '?'}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-medium text-foreground transition-colors flex items-center gap-1.5 truncate max-w-[220px]">
                            <span className="truncate">{item.email || 'Anonymous signup'}</span>
                            <button
                              onClick={(e) => handleCopy(item.email, item.id, e)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                              title="Copy email"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            ID: {item.event_id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2 px-3.5">
                      <RiskBadge score={item.risk_score} level={item.risk_level} />
                    </td>

                    <td className="py-2 px-3.5 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {item.reasons.slice(0, 2).map((r, idx) => renderSignalBadge(r, idx))}
                        {item.reasons.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground border border-border font-mono">
                            +{item.reasons.length - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2 px-3.5">
                      <div className="flex items-center gap-1.5 font-mono text-foreground text-[11px]">
                        <Laptop className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{item.fingerprint_id.slice(0, 12)}...</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
                        <Layers className="w-3 h-3 text-muted-foreground" />
                        <span>{item.linked_accounts_count || 1} accounts linked</span>
                      </div>
                    </td>

                    <td className="py-2 px-3.5 text-muted-foreground">
                      <div className="font-mono text-foreground text-xs flex items-center gap-1">
                        <Globe className="w-3 h-3 text-muted-foreground" />
                        <span>{item.ip_address}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span>
                          {new Date(Number(item.created_at)).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>

                    <td className="py-2 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => handleQuickDecision(item.id, 'approved', e)}
                          className="h-6 px-2 rounded-md text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                          title="Quick Approve"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Allow</span>
                        </button>

                        <button
                          onClick={(e) => handleQuickDecision(item.id, 'rejected', e)}
                          className="h-6 px-2 rounded-md text-[11px] font-mono font-medium border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                          title="Reject Registration"
                        >
                          <span className="hidden sm:inline">Reject</span>
                        </button>

                        <button
                          onClick={(e) => handleQuickDecision(item.id, 'abuser', e)}
                          className="h-7 px-2 rounded-md text-xs font-mono font-medium bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25 transition-colors flex items-center gap-1"
                          title="Tag Device as Abuser"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Ban</span>
                        </button>

                        <button
                          onClick={() => onOpenReview(item.id)}
                          className="h-7 w-7 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors ml-1"
                          title="Detailed Investigation"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="shrink-0 px-4 py-2.5 border-t border-border bg-muted/20 text-[11px] font-mono text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse" />
              <span>Showing {items.length} registration{items.length === 1 ? '' : 's'} in queue</span>
            </span>
            <span className="hidden sm:inline text-[10px] text-muted-foreground/80">
              Click any row to open full audit dossier
            </span>
          </div>
        </>
      )}
    </div>
  </div>
);
};
