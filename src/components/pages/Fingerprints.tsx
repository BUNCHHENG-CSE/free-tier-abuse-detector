'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Fingerprint as FingerprintIcon,
  Search,
  Layers,
  Cpu,
  Globe,
  Copy,
  Check,
  X,
  Laptop,
  Eye,
} from 'lucide-react';
import { FingerprintItem } from '@/types';
import { api } from '@/lib/api';

export const Fingerprints: React.FC = () => {
  const [items, setItems] = useState<FingerprintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFp, setSelectedFp] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchFps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getFingerprints(search);
      setItems(res.fingerprints);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchFps();
  }, [fetchFps]);

  const handleCopy = (text: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleBan = async (id: string, currentBanned: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.toggleBanFingerprint(id, currentBanned !== 1);
      fetchFps();
      if (selectedFp && selectedFp.fingerprint.id === id) {
        setSelectedFp((prev: any) => ({
          ...prev,
          fingerprint: {
            ...prev.fingerprint,
            is_banned: currentBanned === 1 ? 0 : 1,
          },
        }));
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleInspect = async (id: string) => {
    try {
      const res = await api.getFingerprintDetail(id);
      setSelectedFp(res);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-3.5 w-full">
      {/* Header HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FingerprintIcon className="w-5 h-5 text-muted-foreground" />
            <span>Hardware Fingerprint Registry</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deterministic MurmurHash3 profiles generated across Canvas, WebGL, and OS entropy. Identifies repeated account signups from identical hardware.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchFps();
          }}
          className="relative w-full sm:w-72"
        >
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hash, GPU, or IP..."
            className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-card text-xs font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-2xs"
          />
        </form>
      </div>

      {/* Main Full-Width Registry Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
            <span>Indexing client hardware fingerprints...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FingerprintIcon className="w-8 h-8 text-muted-foreground mx-auto" />
            <h4 className="text-sm font-semibold text-foreground">No Fingerprints Recorded Yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Once users visit your application with the &lt;10KB SDK installed, their hardware entropy signatures will populate here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-card sticky top-0 z-20 border-b border-border text-[10px] uppercase font-mono font-medium text-muted-foreground tracking-wider shadow-2xs">
                <tr>
                  <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">Hardware Fingerprint ID</th>
                  <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">Account Linkage</th>
                  <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">GPU & Screen Signature</th>
                  <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">Origin IP</th>
                  <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0">Status</th>
                  <th className="py-2.5 px-3.5 bg-card/95 backdrop-blur-sm sticky top-0 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((fp) => {
                  const isMulti = fp.linked_accounts_count > 1;
                  const isSelected = selectedFp?.fingerprint?.id === fp.id;

                  return (
                    <tr
                      key={fp.id}
                      onClick={() => handleInspect(fp.id)}
                      className={`hover:bg-muted/30 transition-colors group cursor-pointer ${
                        isSelected ? 'bg-accent/40 border-l-2 border-foreground' : ''
                      }`}
                    >
                      <td className="py-2 px-3.5">
                        <div className="flex items-center gap-2 font-mono font-semibold text-foreground transition-colors">
                          <Laptop className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{fp.id.slice(0, 18)}...</span>
                          <button
                            onClick={(e) => handleCopy(fp.id, e)}
                            className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                            title="Copy full fingerprint hash"
                          >
                            {copiedId === fp.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5 flex items-center gap-2">
                          <span>{fp.total_events} events</span>
                          <span>•</span>
                          <span>Last seen: {new Date(Number(fp.last_seen_at)).toLocaleDateString()}</span>
                        </div>
                      </td>

                      <td className="py-2 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border ${
                            isMulti
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                          <span className="font-semibold">{fp.linked_accounts_count}</span>
                          <span className="text-[10px] opacity-80">
                            {fp.linked_accounts_count === 1 ? 'account' : 'accounts'}
                          </span>
                        </span>
                      </td>

                      <td className="py-2 px-3.5 max-w-xs text-muted-foreground">
                        <div
                          className="font-mono text-foreground text-xs truncate flex items-center gap-1.5"
                          title={fp.webgl_renderer || 'Standard'}
                        >
                          <Cpu className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{fp.webgl_renderer || 'GPU Not Reported'}</span>
                        </div>
                        {fp.canvas_hash && (
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                            Canvas Hash: {fp.canvas_hash.slice(0, 12)}...
                          </div>
                        )}
                      </td>

                      <td className="py-2 px-3.5 text-muted-foreground">
                        <div className="font-mono text-foreground text-xs flex items-center gap-1">
                          <Globe className="w-3 h-3 text-muted-foreground" />
                          <span>{fp.primary_ip || '127.0.0.1'}</span>
                        </div>
                      </td>

                      <td className="py-2 px-3.5">
                        {fp.is_banned === 1 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-destructive/15 text-destructive border border-destructive/30">
                            BANNED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                            CLEAN
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleToggleBan(fp.id, fp.is_banned, e)}
                            className={`h-6 px-2 rounded-md text-[11px] font-mono font-medium transition-colors border shadow-2xs ${
                              fp.is_banned === 1
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/25'
                                : 'bg-destructive/15 text-destructive hover:bg-destructive/25 border-destructive/30'
                            }`}
                          >
                            {fp.is_banned === 1 ? 'Unban Device' : 'Ban Device'}
                          </button>

                          <button
                            onClick={() => handleInspect(fp.id)}
                            className="h-6 w-6 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                            title="Inspect details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-Over Inspection Drawer */}
      {selectedFp && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-lg bg-card border-l border-border h-full flex flex-col justify-between shadow-xl animate-in slide-in-from-right p-6 space-y-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md border border-border bg-secondary flex items-center justify-center text-foreground">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Hardware Device Profile</h3>
                    <p className="text-[10px] font-mono text-muted-foreground break-all">
                      {selectedFp.fingerprint.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedFp(null)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-5 p-3.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider block">
                    Device State
                  </span>
                  <span className="font-medium text-foreground text-xs">
                    {selectedFp.fingerprint.is_banned === 1 ? 'Device is Banned' : 'Device is Allowed'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleBan(selectedFp.fingerprint.id, selectedFp.fingerprint.is_banned)}
                  className={`h-7 px-2.5 rounded-md text-xs font-mono font-medium transition-colors border shadow-2xs ${
                    selectedFp.fingerprint.is_banned === 1
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                      : 'bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25'
                  }`}
                >
                  {selectedFp.fingerprint.is_banned === 1 ? 'Unban Device' : 'Ban Hardware'}
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-foreground">
                    Accounts Registered on this Hardware ({selectedFp.accounts.length})
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Shared Machine</span>
                </div>

                <div className="space-y-2">
                  {selectedFp.accounts.map((acc: any, i: number) => (
                    <div key={i} className="p-3 rounded-md border border-border bg-card/60 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">{acc.email}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded uppercase border border-border bg-secondary text-secondary-foreground font-medium">
                          {acc.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono flex justify-between pt-1">
                        <span>IP: {acc.ip_address}</span>
                        <span>Registered {new Date(Number(acc.first_seen_at)).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <button
                onClick={() => setSelectedFp(null)}
                className="w-full h-8 rounded-md text-xs font-medium border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shadow-2xs"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
