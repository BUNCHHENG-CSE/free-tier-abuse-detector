import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RiskBadgeProps {
  score: number;
  level?: string;
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score, level, showIcon = true }) => {
  if (score >= 70 || level === 'HIGH' || level === 'CRITICAL') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        {showIcon && <ShieldAlert className="w-3.5 h-3.5" />}
        <span>{score}/100</span>
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">High Risk</span>
      </span>
    );
  }

  if (score >= 31 || level === 'MEDIUM') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        {showIcon && <AlertTriangle className="w-3.5 h-3.5" />}
        <span>{score}/100</span>
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Flagged</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
      {showIcon && <ShieldCheck className="w-3.5 h-3.5" />}
      <span>{score}/100</span>
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Allowed</span>
    </span>
  );
};
