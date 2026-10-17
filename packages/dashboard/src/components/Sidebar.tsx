import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Fingerprint,
  Network,
  Sliders,
  Code2,
  TerminalSquare,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, pendingCount = 0 }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'queue', label: 'Review Queue', icon: Inbox, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'fingerprints', label: 'Fingerprint Registry', icon: Fingerprint },
    { id: 'clusters', label: 'Cluster Visualizer', icon: Network },
    { id: 'rules', label: 'Rule Engine', icon: Sliders },
    { id: 'integration', label: 'SDK Integration', icon: Code2 },
    { id: 'playground', label: 'Live SaaS Demo', icon: TerminalSquare },
  ];

  return (
    <aside className="w-64 border-r border-border bg-[#070b14] flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500 px-3">
            Anti-Abuse Core
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 font-semibold border border-indigo-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Indie Anchor Callout */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Indie Pricing Anchor</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Castle: <span className="line-through text-slate-500">$500/mo</span>
            <br />
            FingerprintJS Pro: <span className="line-through text-slate-500">$200/mo</span>
            <br />
            <strong className="text-emerald-400">AbuseShield: $29–$79/mo</strong>
          </p>
          <div className="pt-1 text-[10px] text-slate-500 border-t border-slate-800 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            <span>Positioning: Reduce obvious abuse</span>
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-500">
        <div className="flex justify-between items-center text-slate-400 font-medium">
          <span>SDK Status</span>
          <span className="text-emerald-400 font-mono">Ready &lt;10KB</span>
        </div>
        <p className="mt-1 text-[10px] leading-tight">No black-box blocking. Manual queue workflow.</p>
      </div>
    </aside>
  );
};
