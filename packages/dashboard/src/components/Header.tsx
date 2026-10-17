import React, { useState } from 'react';
import { Shield, Sparkles, Play, RefreshCw, Terminal, Check } from 'lucide-react';
import { api } from '../api';

interface HeaderProps {
  onRefresh: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, activeTab, setActiveTab }) => {
  const [simulating, setSimulating] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSimulate = async (scenario: string, label: string) => {
    try {
      setSimulating(true);
      await api.triggerScenario(scenario);
      setSuccessToast(`Simulated: ${label}`);
      setTimeout(() => setSuccessToast(null), 3500);
      onRefresh();
    } catch (e: any) {
      alert(`Simulation failed: ${e.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-[#090d16]/90 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">AbuseShield</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SDK &lt;10KB
              </span>
            </div>
            <p className="text-[11px] text-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Acme Cloud Production • Free-Tier Protection
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {successToast && (
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Quick Simulator Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => handleSimulate('vpn_multi_accounting', 'VPN Multi-Account Ring')}
            disabled={simulating}
            className="px-2.5 py-1 text-xs font-medium rounded text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
            title="Simulate 3 accounts registered from same hardware via 3 different VPN IPs"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Simulate VPN Ring</span>
          </button>

          <button
            onClick={() => handleSimulate('disposable_batch', 'Disposable Email Harvester')}
            disabled={simulating}
            className="px-2.5 py-1 text-xs font-medium rounded text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
            title="Simulate registration with Mailinator / 10MinuteMail"
          >
            <Sparkles className="w-3 h-3 text-rose-400" />
            <span>Simulate Temp Mail</span>
          </button>
        </div>

        <button
          onClick={() => setActiveTab('playground')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
            activeTab === 'playground'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Live Playground</span>
        </button>

        <button
          onClick={onRefresh}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition"
          title="Refresh metrics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
