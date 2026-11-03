'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Sparkles,
  RefreshCw,
  Terminal,
  Check,
  ExternalLink,
  Zap,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Loader2,
  Bot,
  UserCheck,
  Database,
  Globe,
  Mail,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ThemeToggle } from './ThemeToggle';

const SIMULATION_SCENARIOS = [
  {
    id: 'vpn_multi_accounting',
    label: 'VPN Multi-Account Ring',
    desc: '3 accounts registered from same hardware via 3 different VPN IPs',
    icon: Globe,
    color: 'text-amber-500 dark:text-amber-400',
    badge: 'CRITICAL',
    badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  },
  {
    id: 'disposable_batch',
    label: 'Disposable Email Harvester',
    desc: 'Burner domains (Mailinator, 10MinuteMail) rapid bot registration',
    icon: Mail,
    color: 'text-rose-500 dark:text-rose-400',
    badge: 'CHALLENGED',
    badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  {
    id: 'headless_bot',
    label: 'Headless Chrome Bot',
    desc: 'Automated Puppeteer crawler with navigator.webdriver runtime markers',
    icon: Bot,
    color: 'text-cyan-500 dark:text-cyan-400',
    badge: 'HIGH RISK',
    badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  },
  {
    id: 'legitimate',
    label: 'Clean Organic User',
    desc: 'Standard developer registration with organic hardware signals (Score: 0)',
    icon: UserCheck,
    color: 'text-emerald-500 dark:text-emerald-400',
    badge: 'ALLOWED',
    badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  {
    id: 'seed_demo_data',
    label: 'Reset & Seed Demo Dataset',
    desc: 'Populate 15 realistic events, 3 syndicate clusters, and clean accounts',
    icon: Database,
    color: 'text-purple-500 dark:text-purple-400',
    badge: 'DATASET',
    badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  },
];

interface HeaderProps {
  onRefresh: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  activeTab,
  setActiveTab,
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const [simulatingScenario, setSimulatingScenario] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

  const handleSimulate = async (scenario: string, label: string) => {
    try {
      setSimulatingScenario(scenario);
      await api.triggerScenario(scenario);
      setSuccessToast(`Injected: ${label}`);
      setTimeout(() => setSuccessToast(null), 3500);
      onRefresh();
    } catch (e: any) {
      alert(`Simulation failed: ${e.message}`);
    } finally {
      setSimulatingScenario(null);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur-md sticky top-0 z-40 px-5 flex items-center justify-between">
      {/* Brand & Environment HUD */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="w-8 h-8 rounded-md border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-xs"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('overview')}
            className="w-8 h-8 rounded-md border border-border bg-card hover:bg-accent flex items-center justify-center transition-colors shadow-xs"
            title="TCT Shield Platform"
          >
            <Shield className="w-4 h-4 text-foreground" />
          </button>

          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-sm tracking-tight text-foreground">
              TCT Shield
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded border border-border bg-muted/60 text-muted-foreground">
              &lt;10KB SDK
            </span>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Active Protection</span>
              </span>
              <span className="text-muted-foreground/40">•</span>
              <span className="font-mono text-[10px] text-muted-foreground/80">SQLite / Neon PG</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Center & Simulators */}
      <div className="flex items-center gap-2">
        {successToast && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Interactive Simulator Group & Menu HUD */}
        <div ref={dropdownRef} className="relative hidden lg:flex items-center gap-1 border border-border rounded-md p-0.5 bg-card/60 shadow-xs">
          {/* Main Dropdown Button for "SIMULATE" */}
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            disabled={simulatingScenario !== null}
            className={`h-7 px-2 text-[10px] font-mono font-medium uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              dropdownOpen
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            } disabled:opacity-50`}
            title="Open Abuse Simulation Menu (all 5 scenarios)"
          >
            {simulatingScenario ? (
              <Loader2 className="w-3 h-3 text-amber-500 dark:text-amber-400 animate-spin" />
            ) : (
              <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            )}
            <span>Simulate</span>
            <ChevronDown
              className={`w-3 h-3 text-muted-foreground transition-transform duration-150 ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Quick-Access Button 1: VPN Ring */}
          <button
            type="button"
            onClick={() => handleSimulate('vpn_multi_accounting', 'VPN Multi-Account Ring')}
            disabled={simulatingScenario !== null}
            className="h-7 px-2 text-xs font-mono rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Simulate 3 accounts registered from same hardware via 3 different VPN IPs"
          >
            {simulatingScenario === 'vpn_multi_accounting' ? (
              <Loader2 className="w-3 h-3 text-amber-500 dark:text-amber-400 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            )}
            <span>VPN Ring</span>
          </button>

          {/* Quick-Access Button 2: Temp Mail */}
          <button
            type="button"
            onClick={() => handleSimulate('disposable_batch', 'Disposable Email Harvester')}
            disabled={simulatingScenario !== null}
            className="h-7 px-2 text-xs font-mono rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Simulate registration with Mailinator / 10MinuteMail"
          >
            {simulatingScenario === 'disposable_batch' ? (
              <Loader2 className="w-3 h-3 text-rose-500 dark:text-rose-400 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 text-rose-500 dark:text-rose-400" />
            )}
            <span>Temp Mail</span>
          </button>

          {/* Dropdown Menu Popover */}
          {dropdownOpen && (
            <div className="absolute top-full mt-2 right-0 sm:left-0 sm:right-auto w-84 sm:w-96 rounded-lg border border-border bg-popover/98 backdrop-blur-md shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150 space-y-1">
              <div className="px-2.5 py-1.5 border-b border-border flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-500" />
                  Simulate Abuse Scenarios
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/80 px-1.5 py-0.2 rounded bg-muted">
                  5 Scenarios
                </span>
              </div>

              <div className="space-y-1 pt-1">
                {SIMULATION_SCENARIOS.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = simulatingScenario === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={simulatingScenario !== null}
                      onClick={() => {
                        setDropdownOpen(false);
                        handleSimulate(item.id, item.label);
                      }}
                      className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors flex items-start gap-2.5 group disabled:opacity-50 cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded border border-border bg-card flex items-center justify-center shrink-0 mt-0.5 group-hover:border-foreground/30 shadow-2xs">
                        {isCurrent ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        ) : (
                          <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {item.label}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-medium ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Demo SaaS Sandbox Launcher */}
        <a
          href="/demo"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shadow-xs"
          title="Open live customer-facing SaaS signup demo (VoxelAI Studio)"
        >
          <span>VoxelAI Demo</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </a>

        {/* Live Playground Navigation Button */}
        <button
          onClick={() => setActiveTab('playground')}
          className={`h-8 px-3 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs ${
            activeTab === 'playground'
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Interactive Sandbox</span>
        </button>

        {/* Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          className="h-8 px-2.5 rounded-md border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors shadow-xs text-xs font-mono"
          title={isFullscreen ? 'Exit Full Screen (Esc / F11)' : 'Full Screen View (F11)'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-foreground" />
              <span className="hidden xl:inline text-[11px]">Exit Full Screen</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-foreground" />
              <span className="hidden xl:inline text-[11px]">Full Screen</span>
            </>
          )}
        </button>

        {/* Theme Mode Switcher (Light / Dark / System) */}
        <ThemeToggle />

        {/* Refresh */}
        <button
          onClick={handleManualRefresh}
          className="h-8 w-8 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors shadow-xs"
          title="Refresh metrics & queues"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-foreground' : ''}`} />
        </button>
      </div>
    </header>
  );
};
