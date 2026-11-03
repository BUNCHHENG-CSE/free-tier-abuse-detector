'use client';

import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Inbox,
  Fingerprint,
  Network,
  Sliders,
  Code2,
  TerminalSquare,
  Sparkles,
  Coins,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount?: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount = 0,
  collapsed = false,
  onToggleCollapse,
}) => {
  const [showRoiDetails, setShowRoiDetails] = useState(false);

  // Global keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          return;
        }
        e.preventDefault();
        onToggleCollapse?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCollapse]);

  const primaryNav = [
    { id: 'overview', label: 'Security Overview', icon: LayoutDashboard },
    { id: 'queue', label: 'Review Queue', icon: Inbox, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'fingerprints', label: 'Device Registry', icon: Fingerprint },
    { id: 'clusters', label: 'Cluster Visualizer', icon: Network },
    { id: 'quotas', label: 'Trial Quota Pools', icon: Coins },
  ];

  const secondaryNav = [
    { id: 'rules', label: 'Detection Rules', icon: Sliders },
    { id: 'integration', label: 'SDK Integration', icon: Code2 },
    { id: 'playground', label: 'Interactive Sandbox', icon: TerminalSquare },
  ];

  return (
    <aside
      className={`border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between shrink-0 select-none overflow-hidden transition-[width] duration-250 ease-in-out h-full ${
        collapsed ? 'w-16 items-center' : 'w-64'
      }`}
    >
      {/* Scrollable Navigation Area */}
      <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar ${collapsed ? 'w-full px-2 py-3 space-y-4' : 'px-3 py-3 space-y-4'}`}>
        {/* Section 1: Monitoring & Triage */}
        <div className="w-full">
          {!collapsed ? (
            <div className="text-[10px] uppercase font-mono font-semibold tracking-wider text-muted-foreground/75 px-2.5 py-1">
              Monitoring & Triage
            </div>
          ) : (
            <div className="w-6 h-px bg-border/60 mx-auto my-1" />
          )}

          <nav className="mt-1 space-y-1">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const titleText = collapsed
                ? `${item.label}${item.badge ? ` (${item.badge} pending)` : ''}`
                : undefined;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={titleText}
                  className={`flex items-center rounded-lg text-xs transition-colors group relative ${
                    collapsed
                      ? 'w-10 h-10 mx-auto justify-center'
                      : 'w-full justify-between px-2.5 py-2'
                  } ${
                    isActive
                      ? 'bg-accent text-accent-foreground font-semibold border border-border/80 shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {item.badge !== null && item.badge !== undefined && (
                    collapsed ? (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-destructive/15 text-destructive border border-destructive/30 shrink-0">
                        {item.badge}
                      </span>
                    )
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section 2: Rules & SDK */}
        <div className="w-full">
          {!collapsed ? (
            <div className="text-[10px] uppercase font-mono font-semibold tracking-wider text-muted-foreground/75 px-2.5 py-1">
              Rules & Sandbox
            </div>
          ) : (
            <div className="w-6 h-px bg-border/60 mx-auto my-1" />
          )}

          <nav className="mt-1 space-y-1">
            {secondaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center rounded-lg text-xs transition-colors group relative ${
                    collapsed
                      ? 'w-10 h-10 mx-auto justify-center'
                      : 'w-full justify-between px-2.5 py-2'
                  } ${
                    isActive
                      ? 'bg-accent text-accent-foreground font-semibold border border-border/80 shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Streamlined SaaS ROI Callout (Optimized footprint) */}
        {!collapsed && (
          <div className="p-2.5 rounded-lg border border-border/80 bg-card/70 space-y-1.5 shadow-2xs">
            <button
              onClick={() => setShowRoiDetails((prev) => !prev)}
              className="w-full flex items-center justify-between text-left group"
              title="Click to toggle cost comparison details"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[11px] font-mono font-semibold text-foreground">
                  ROI Advantage
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Save 90%
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
                    showRoiDetails ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground text-[10px]">Plan Range:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                $29–$79<span className="text-[9px] font-normal text-muted-foreground">/mo</span>
              </span>
            </div>

            {showRoiDetails && (
              <div className="pt-1.5 space-y-1 text-[10px] font-mono border-t border-border/50 text-muted-foreground animate-in fade-in">
                <div className="flex justify-between">
                  <span>Enterprise Fraud:</span>
                  <span className="line-through">$500/mo</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-muted-foreground/80 pt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Zero silent lockouts • Human-in-loop</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pinned Footer: Controls & Telemetry */}
      <div className={`p-2.5 border-t border-border/70 space-y-2 bg-card/40 shrink-0 ${collapsed ? 'w-full flex flex-col items-center p-2' : 'w-full'}`}>
        {/* Telemetry pill */}
        {!collapsed ? (
          <div className="p-2 rounded-md border border-border/70 bg-card/60 text-[10px] font-mono text-muted-foreground flex items-center justify-between shadow-2xs">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>SDK Engine</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
              5.2KB • 15ms
            </span>
          </div>
        ) : (
          <div
            className="w-9 h-9 rounded-md border border-border bg-card flex flex-col items-center justify-center text-[9px] font-mono text-emerald-500 cursor-help"
            title="SDK Engine Active: 5.2KB gz, Sub-15ms entropy"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mb-0.5" />
            <span>5K</span>
          </div>
        )}

        {/* Sidebar Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`flex items-center justify-center gap-2 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground text-xs transition-colors shadow-2xs ${
              collapsed ? 'h-9 w-9 p-0' : 'w-full px-2.5 py-1.5'
            }`}
            title={collapsed ? 'Expand Sidebar (Ctrl+B)' : 'Collapse Sidebar (Ctrl+B)'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <div className="w-full flex items-center justify-between">
                <span className="flex items-center gap-2 text-[11px] font-mono">
                  <PanelLeftClose className="w-3.5 h-3.5" />
                  <span>Collapse Sidebar</span>
                </span>
                <kbd className="text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                  Ctrl+B
                </kbd>
              </div>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};