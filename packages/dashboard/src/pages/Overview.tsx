import React from 'react';
import {
  Users,
  AlertOctagon,
  Percent,
  Layers,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { OverviewData } from '../types';
import { RiskBadge } from '../components/RiskBadge';

interface OverviewProps {
  data: OverviewData;
  onOpenReview: (id: string) => void;
  onSwitchTab: (tab: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ data, onOpenReview, onSwitchTab }) => {
  const { metrics, timeline, topReasons } = data;

  const statCards = [
    {
      label: 'Total Registrations Checked',
      value: metrics.totalSignups.toLocaleString(),
      subtext: 'Protected by <10KB SDK',
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      label: 'Flagged for Review',
      value: metrics.flaggedCount.toLocaleString(),
      subtext: `${metrics.pendingReviewCount} awaiting review`,
      icon: AlertOctagon,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      label: 'Abuse Share %',
      value: `${metrics.abuseSharePercent}%`,
      subtext: metrics.abuseSharePercent < 5 ? 'Pain mild (<5%)' : 'Sharp revenue pain (>5%)',
      icon: Percent,
      color: metrics.abuseSharePercent > 20 ? 'text-rose-400' : 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Multi-Account Clusters',
      value: metrics.multiAccountFpCount.toLocaleString(),
      subtext: 'Devices sharing 2+ accounts',
      icon: Layers,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      label: 'Estimated Quota Saved',
      value: `$${metrics.estimatedSavings.toLocaleString()}`,
      subtext: 'Free-tier compute / API leakage',
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  const maxTimelineTotal = Math.max(...timeline.map((t) => t.total), 1);

  return (
    <div className="space-y-6">
      {/* Page Title & Pitch Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/40 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Free-Tier Abuse & Revenue Leakage Dashboard</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
              Active Protection
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Catches disposable emails, VPN-hopping multi-accounting, and scripted quota harvests without paying $500/mo enterprise prices. Manual review queue prevents black-box customer friction.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSwitchTab('queue')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
          >
            <span>Open Review Queue ({metrics.pendingReviewCount})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5 High-Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{card.label}</span>
                <div className={`p-1.5 rounded-lg border ${card.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-white">{card.value}</div>
              <div className="text-[11px] text-slate-500 font-medium">{card.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 24-Hour Velocity & Abuse Timeline */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>24-Hour Registration Velocity & Abuse Share</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution of normal signups vs flagged suspicious accounts</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span> Normal Signups
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Flagged Abuse
              </span>
            </div>
          </div>

          {/* SVG / Bar Chart */}
          <div className="h-48 flex items-end gap-2 pt-6 pb-2 border-b border-slate-800/60">
            {timeline.map((item, index) => {
              const totalHeight = Math.max(8, (item.total / maxTimelineTotal) * 100);
              const flaggedHeight = item.total > 0 ? (item.flagged / item.total) * totalHeight : 0;
              const cleanHeight = totalHeight - flaggedHeight;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1.5 group relative h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 px-2 py-1 bg-slate-800 text-[10px] text-white rounded border border-slate-700 whitespace-nowrap shadow-lg">
                    {item.time}: {item.total} total ({item.flagged} flagged)
                  </div>

                  <div className="w-full max-w-[28px] rounded-t overflow-hidden flex flex-col justify-end">
                    {cleanHeight > 0 && (
                      <div
                        style={{ height: `${cleanHeight}%` }}
                        className="w-full bg-indigo-500/70 group-hover:bg-indigo-400 transition"
                      ></div>
                    )}
                    {flaggedHeight > 0 && (
                      <div
                        style={{ height: `${flaggedHeight}%` }}
                        className="w-full bg-rose-500/80 group-hover:bg-rose-400 transition"
                      ></div>
                    )}
                    {item.total === 0 && (
                      <div className="w-full h-1 bg-slate-800 rounded"></div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 truncate w-full text-center">
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Triggered Signals Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <div>
            <h3 className="font-bold text-sm text-white">Top Triggered Abuse Signals</h3>
            <p className="text-xs text-slate-400 mt-0.5">Leading vectors of free-tier revenue leakage</p>
          </div>

          <div className="space-y-3 pt-2">
            {topReasons.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No abuse signals triggered yet</p>
            ) : (
              topReasons.map((item, i) => {
                const maxCount = Math.max(...topReasons.map((r) => r.count), 1);
                const percent = Math.round((item.count / maxCount) * 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{item.reason}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{item.count} detections</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full"
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Positioning Rule:</span>
            <span className="text-slate-200 font-semibold">Flag & Review (No Silent Bans)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
