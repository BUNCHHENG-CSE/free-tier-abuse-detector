'use client';

import React, { useState } from 'react';
import {
  Users,
  AlertOctagon,
  Percent,
  Layers,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { OverviewData } from '@/types';

interface OverviewProps {
  data: OverviewData;
  onOpenReview: (id: string) => void;
  onSwitchTab: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ data, onSwitchTab }) => {
  const { metrics, timeline, topReasons } = data;
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const statCards = [
    {
      label: 'Registrations Screened',
      value: metrics.totalSignups.toLocaleString(),
      subtext: '<10KB SDK hardware audit',
      icon: Users,
      badge: '100% COVERAGE',
      badgeColor: 'text-foreground bg-muted border-border',
    },
    {
      label: 'Flagged for Review',
      value: metrics.flaggedCount.toLocaleString(),
      subtext: `${metrics.pendingReviewCount} pending decision`,
      icon: AlertOctagon,
      badge: metrics.pendingReviewCount > 0 ? `${metrics.pendingReviewCount} PENDING` : 'QUEUE CLEAR',
      badgeColor:
        metrics.pendingReviewCount > 0
          ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/25'
          : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    },
    {
      label: 'Abuse Share Ratio',
      value: `${metrics.abuseSharePercent}%`,
      subtext: metrics.abuseSharePercent < 5 ? 'Normal organic traffic' : 'Elevated multi-accounting',
      icon: Percent,
      badge: metrics.abuseSharePercent < 5 ? 'HEALTHY' : 'ELEVATED',
      badgeColor:
        metrics.abuseSharePercent < 5
          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
          : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25',
    },
    {
      label: 'Multi-Account Clusters',
      value: metrics.multiAccountFpCount.toLocaleString(),
      subtext: 'Hardware linked to ≥2 accounts',
      icon: Layers,
      badge: 'HARDWARE LINKED',
      badgeColor: 'text-foreground bg-muted border-border',
    },
    {
      label: 'Estimated Quota Saved',
      value: `$${metrics.estimatedSavings.toLocaleString()}`,
      subtext: 'Free GPU / API compute saved',
      icon: DollarSign,
      badge: 'ROI POSITIVE',
      badgeColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    },
  ];

  const maxTimelineTotal = Math.max(...timeline.map((t) => t.total), 1);
  const totalClean = timeline.reduce((acc, t) => acc + (t.total - t.flagged), 0);
  const totalFlagged = timeline.reduce((acc, t) => acc + t.flagged, 0);

  return (
    <div className="space-y-3.5 w-full">
      {/* Top Threat Posture HUD Banner - Mira Style */}
      <div className="rounded-lg border border-border bg-card p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] uppercase tracking-wider font-mono font-medium text-emerald-400">
                Threat Defense Active
              </span>
              <span className="text-border">•</span>
              <span className="text-xs text-muted-foreground font-mono">Zero Customer Friction</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Free-Tier Abuse & Quota Defense
            </h1>

            <p className="text-xs text-muted-foreground max-w-2xl leading-normal">
              Real-time client hardware fingerprinting detects disposable emails, automated signups, and VPN rotating syndicates across all free-tier quotas without disruptive hard lockouts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onSwitchTab('queue')}
              className="h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs group"
            >
              <span>Review Queue</span>
              {metrics.pendingReviewCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-destructive text-destructive-foreground font-bold">
                  {metrics.pendingReviewCount}
                </span>
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <button
              onClick={() => onSwitchTab('clusters')}
              className="h-8 px-3 rounded-md text-xs font-medium border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cluster Visualizer</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="p-3 rounded-lg border border-border bg-card hover:border-neutral-700 transition-colors shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] uppercase font-mono font-medium px-1.5 py-0.5 rounded border ${card.badgeColor}`}>
                  {card.badge}
                </span>
                <div className="p-1 rounded-md border border-border bg-secondary/50 text-muted-foreground">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-muted-foreground block truncate">
                  {card.label}
                </span>
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
                  {card.value}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {card.subtext}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {/* 24-Hour Velocity & Abuse Timeline */}
        <div className="lg:col-span-2 p-3.5 sm:p-4 rounded-lg border border-border bg-card space-y-3 shadow-xs relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
            <div>
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span>24-Hour Velocity & Threat Distribution</span>
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Hourly throughput of clean customer signups vs flagged multi-account attempts
              </p>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-neutral-800 dark:bg-neutral-300"></span>
                <span>Clean ({totalClean})</span>
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>Flagged ({totalFlagged})</span>
              </span>
            </div>
          </div>

          {/* Interactive Bar Chart */}
          <div className="h-44 sm:h-48 flex items-end gap-2 pt-4 pb-1 relative">
            <div className="absolute inset-x-0 top-4 bottom-6 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-b border-border w-full"></div>
              <div className="border-b border-border w-full"></div>
              <div className="border-b border-border w-full"></div>
            </div>

            {timeline.map((item, index) => {
              const totalHeight = Math.max(10, (item.total / maxTimelineTotal) * 100);
              const flaggedHeight = item.total > 0 ? (item.flagged / item.total) * totalHeight : 0;
              const cleanHeight = totalHeight - flaggedHeight;
              const isHovered = hoveredPoint === index;

              return (
                <div
                  key={index}
                  onMouseEnter={() => setHoveredPoint(index)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="flex-1 flex flex-col items-center gap-1.5 group relative h-full justify-end cursor-pointer z-10"
                >
                  {isHovered && (
                    <div className="absolute -top-14 opacity-100 transition-all pointer-events-none z-30 px-3 py-1.5 bg-card border border-border text-xs rounded-md shadow-lg whitespace-nowrap animate-in fade-in">
                      <div className="font-mono font-medium text-foreground text-[11px] mb-0.5 flex items-center justify-between gap-3">
                        <span>{item.time}</span>
                        <span className="text-muted-foreground">{item.total} Total</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <span className="text-emerald-600 dark:text-emerald-400">✓ {item.total - item.flagged} Clean</span>
                        <span className="text-rose-600 dark:text-rose-400">⚠ {item.flagged} Flagged</span>
                      </div>
                    </div>
                  )}

                  <div
                    className={`w-full max-w-[28px] rounded-t-sm overflow-hidden flex flex-col justify-end transition-all duration-200 ${
                      isHovered ? 'opacity-100 scale-105' : 'opacity-85'
                    }`}
                  >
                    {cleanHeight > 0 && (
                      <div
                        style={{ height: `${cleanHeight}%` }}
                        className="w-full bg-neutral-800 dark:bg-neutral-300 hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
                      ></div>
                    )}
                    {flaggedHeight > 0 && (
                      <div
                        style={{ height: `${flaggedHeight}%` }}
                        className="w-full bg-rose-500 transition-colors"
                      ></div>
                    )}
                    {item.total === 0 && <div className="w-full h-1 bg-secondary rounded"></div>}
                  </div>

                  <span
                    className={`text-[10px] font-mono transition-colors text-center truncate w-full ${
                      isHovered ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Peak traffic period: Healthy organic throughput with automated flagged separation
            </span>
            <span className="text-muted-foreground font-mono text-[10px]">2h intervals</span>
          </div>
        </div>

        {/* Top Triggered Signals Breakdown */}
        <div className="p-3.5 sm:p-4 rounded-lg border border-border bg-card space-y-3 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h3 className="font-semibold text-sm text-foreground">Leading Abuse Vectors</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Hardware entropy & policy triggers</p>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border bg-secondary text-secondary-foreground font-medium">
                TOP 5
              </span>
            </div>

            <div className="space-y-2.5 pt-3">
              {topReasons.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground italic">
                  No policy triggers recorded yet. Use simulation buttons in header to generate test traffic.
                </div>
              ) : (
                topReasons.map((item, i) => {
                  const maxCount = Math.max(...topReasons.map((r) => r.count), 1);
                  const percent = Math.round((item.count / maxCount) * 100);

                  return (
                    <div key={i} className="space-y-1 group">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-foreground font-medium truncate max-w-[170px]" title={item.reason}>
                          {item.reason}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.2 rounded border border-border">
                          {item.count}
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            i === 0 ? 'bg-destructive' : 'bg-primary'
                          }`}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-md border border-border bg-muted/30 text-xs text-muted-foreground space-y-0.5">
            <div className="font-medium text-foreground flex items-center gap-1.5 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Indie SaaS Policy: Zero False Positives</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-normal">
              Suspicious registrations trigger manual review rather than immediate hard blocking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
