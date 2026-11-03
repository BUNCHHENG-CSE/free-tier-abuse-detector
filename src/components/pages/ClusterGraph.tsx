'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Network,
  Layers,
  ShieldAlert,
  Fingerprint,
  Info,
  RefreshCw,
  Zap,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ClusterGraphData, ClusterNode } from '@/types';
import { api } from '@/lib/api';

export const ClusterGraph: React.FC = () => {
  const [data, setData] = useState<ClusterGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<ClusterNode | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'abuse' | 'banned'>('all');
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false);

  const fetchClusters = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getClusters();
      setData(res);
      const firstMulti = res.nodes.find((n) => n.type === 'fingerprint' && (n.count || 0) > 1);
      if (firstMulti) {
        setSelectedNode((prev) => prev || firstMulti);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  if (loading || !data) {
    return (
      <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
        <span>Mapping relationship clusters...</span>
      </div>
    );
  }

  const fpNodes = data.nodes.filter((n) => {
    if (n.type !== 'fingerprint') return false;
    if (filterType === 'abuse') return (n.count || 0) > 1;
    if (filterType === 'banned') return n.isBanned;
    return true;
  });

  const activeLinks = selectedNode
    ? data.links.filter((l) => l.target === selectedNode.id || l.source === selectedNode.id)
    : [];

  const activeConnectedIds = new Set([
    ...(selectedNode ? [selectedNode.id] : []),
    ...activeLinks.map((l) => (l.source === selectedNode?.id ? l.target : l.source)),
  ]);

  return (
    <div className="space-y-3.5 w-full">
      {/* Header HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Network className="w-5 h-5 text-muted-foreground" />
            <span>Multi-Account Cluster Visualizer</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross-links browser hardware fingerprints with user accounts and IP addresses to reveal coordinated free-tier abuse rings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-card shadow-2xs">
            <button
              onClick={() => setFilterType('all')}
              className={`h-7 px-2.5 text-xs font-mono rounded transition-colors ${
                filterType === 'all'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Devices
            </button>
            <button
              onClick={() => setFilterType('abuse')}
              className={`h-7 px-2.5 text-xs font-mono rounded transition-colors flex items-center gap-1 ${
                filterType === 'abuse'
                  ? 'bg-destructive text-destructive-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Abuse Rings (≥2)</span>
            </button>
            <button
              onClick={() => setFilterType('banned')}
              className={`h-7 px-2.5 text-xs font-mono rounded transition-colors ${
                filterType === 'banned'
                  ? 'bg-amber-600 text-white font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Banned Only
            </button>
          </div>

          <button
            onClick={fetchClusters}
            className="h-7 w-7 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-2xs"
            title="Refresh cluster graph"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cluster Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-card space-y-0.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
              Multi-Account Syndicates
            </span>
            <div className="p-1 rounded border border-destructive/30 bg-destructive/10 text-destructive">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-destructive font-mono tabular-nums">
            {data.stats.multiAccountDevices}
          </div>
          <p className="text-[10px] text-muted-foreground font-mono truncate">
            Hardware tokens linked to &gt;1 distinct accounts
          </p>
        </div>

        <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-card space-y-0.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
              Syndicated Accounts
            </span>
            <div className="p-1 rounded border border-border bg-secondary text-foreground">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums">
            {data.stats.totalAccountsInClusters}
          </div>
          <p className="text-[10px] text-muted-foreground font-mono truncate">
            Total email registrations within clusters
          </p>
        </div>

        <div className="p-2.5 sm:p-3 rounded-lg border border-border bg-card space-y-0.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider">
              Syndicate Risk Status
            </span>
            <div className="p-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">Contained</div>
          <p className="text-[10px] text-muted-foreground font-mono truncate">
            Flagged in triage before free credits depleted
          </p>
        </div>
      </div>

      {/* Interactive Cluster Canvas & Node Inspector */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 ${isGraphFullscreen ? 'fixed inset-0 z-50 bg-background/95 backdrop-blur-md p-6 overflow-y-auto m-0 rounded-none' : ''}`}>
        <div className="lg:col-span-8 border border-border rounded-lg bg-card/60 p-3.5 sm:p-4 min-h-0 relative overflow-hidden flex flex-col justify-between shadow-xs mira-grid">
          <div className="flex items-center justify-between text-xs text-muted-foreground z-10 border-b border-border pb-2 bg-card/80 backdrop-blur-xs -m-1 p-2 rounded">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active Graph Constellation
              </span>
              <span className="text-border">•</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {data.links.length} Active Cross-Links
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2.5 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <span className="w-2 h-2 rounded bg-foreground"></span> Device
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-neutral-400"></span> Account
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <span className="w-2 h-2 rotate-45 rounded-2xs bg-amber-400"></span> IP
                </span>
              </div>

              <button
                onClick={() => setIsGraphFullscreen(!isGraphFullscreen)}
                className="h-6 px-2 rounded border border-border bg-card hover:bg-accent text-foreground text-xs flex items-center gap-1 transition-colors shadow-2xs font-mono"
                title={isGraphFullscreen ? "Exit full screen view" : "Make graph full screen"}
              >
                {isGraphFullscreen ? (
                  <>
                    <Minimize2 className="w-3 h-3" />
                    <span>Exit</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3" />
                    <span>Full Screen</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 my-auto py-2.5 z-10">
            {fpNodes.map((fp) => {
              const isMulti = (fp.count || 0) > 1;
              const isSelected = selectedNode?.id === fp.id;
              const isConnected = activeConnectedIds.has(fp.id);

              return (
                <div
                  key={fp.id}
                  onClick={() => setSelectedNode(fp)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-accent border-foreground shadow-xs'
                      : isMulti
                      ? 'bg-card border-destructive/40 hover:border-destructive shadow-2xs'
                      : 'bg-card border-border hover:border-neutral-600'
                  } ${!isSelected && !isConnected && selectedNode ? 'opacity-40' : 'opacity-100'}`}
                >
                  {isMulti && (
                    <span className="absolute -top-2 -right-1 px-1.5 py-0.2 rounded text-[8px] font-mono font-semibold bg-destructive text-destructive-foreground uppercase tracking-wider">
                      Cluster
                    </span>
                  )}

                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className={`p-1 rounded border ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-transparent'
                          : 'bg-secondary text-muted-foreground border-border'
                      }`}
                    >
                      <Fingerprint className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-mono text-xs font-semibold text-foreground truncate block">
                        {fp.id.slice(0, 14)}...
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Hardware Profile
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs text-muted-foreground border-t border-border pt-1.5 font-mono">
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Linked Accounts:</span>
                      <span
                        className={`px-1 py-0.2 rounded font-semibold ${
                          isMulti
                            ? 'bg-destructive/15 text-destructive border border-destructive/30'
                            : 'text-foreground'
                        }`}
                      >
                        {fp.count || 1}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span>Device State:</span>
                      <span
                        className={`uppercase font-medium ${
                          fp.isBanned ? 'text-destructive' : 'text-emerald-400'
                        }`}
                      >
                        {fp.isBanned ? 'BANNED' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] font-mono text-muted-foreground border-t border-border pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 z-10">
            <span>Graph Clustering Engine: Canonical MurmurHash3 Correlator</span>
            <span>Entropy: Canvas 2D + WebGL + AudioContext + Fonts</span>
          </div>
        </div>

        {/* Telemetry Inspector Drawer */}
        <div className="lg:col-span-4 border border-border rounded-lg bg-card p-3.5 sm:p-4 space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm text-foreground">Cluster Telemetry</h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border bg-secondary text-secondary-foreground font-medium">
                LIVE NODE
              </span>
            </div>

            {selectedNode ? (
              <div className="space-y-2.5">
                <div>
                  <span className="text-[10px] uppercase font-mono font-medium text-muted-foreground tracking-wider">
                    Inspected Hardware Node
                  </span>
                  <div className="font-mono text-xs text-foreground mt-0.5 break-all p-2 rounded-md border border-border bg-muted/20">
                    {selectedNode.id}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono font-medium text-muted-foreground tracking-wider flex items-center justify-between">
                    <span>Direct Relationships</span>
                    <span className="text-foreground">{activeLinks.length} edges</span>
                  </span>

                  <div className="space-y-1 mt-1.5 max-h-36 sm:max-h-44 overflow-y-auto">
                    {activeLinks.map((l, idx) => {
                      const otherId = l.source === selectedNode.id ? l.target : l.source;
                      const isAccount = otherId.includes('@');
                      return (
                        <div
                          key={idx}
                          className="p-1.5 px-2 rounded-md border border-border bg-card/60 text-xs flex items-center justify-between font-mono"
                        >
                          <span className="text-foreground truncate max-w-[170px] text-[11px]">
                            {otherId}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-1 py-0.2 rounded border ${
                              isAccount
                                ? 'bg-secondary text-secondary-foreground border-border'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {l.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-2.5 rounded-md border border-border bg-muted/30 text-xs text-muted-foreground space-y-0.5">
                  <div className="font-medium flex items-center gap-1.5 text-foreground">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Free-Tier Exploitation Insight</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Even when spinning up fresh Gmail aliases or switching VPN IP subnets, this actor cannot alter physical GPU rendering signatures or audio dynamics.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground italic font-mono">
                Click any device node on the graph canvas to inspect linked accounts and network edges.
              </div>
            )}
          </div>

          {selectedNode && (
            <div className="pt-2 border-t border-border">
              <button
                onClick={() => setSelectedNode(null)}
                className="w-full h-7 rounded-md text-xs font-mono font-medium border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors shadow-2xs"
              >
                Clear Node Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
