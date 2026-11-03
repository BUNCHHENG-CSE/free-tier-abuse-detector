'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RiskBadgeProps {
  score: number;
  level?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score, level, showIcon = true, size = 'md' }) => {
  const isHigh = score >= 70 || level === 'HIGH' || level === 'CRITICAL';
  const isMedium = !isHigh && (score >= 31 || level === 'MEDIUM');

  const config = isHigh
    ? {
        label: 'High Risk',
        icon: ShieldAlert,
        badgeBg: 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400',
        dotBg: 'bg-rose-500 dark:bg-rose-400',
        barBg: 'bg-rose-500',
        textColor: 'text-rose-600 dark:text-rose-400',
      }
    : isMedium
    ? {
        label: 'Flagged',
        icon: AlertTriangle,
        badgeBg: 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400',
        dotBg: 'bg-amber-500 dark:bg-amber-400',
        barBg: 'bg-amber-500',
        textColor: 'text-amber-600 dark:text-amber-400',
      }
    : {
        label: 'Clean',
        icon: ShieldCheck,
        badgeBg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400',
        dotBg: 'bg-emerald-500 dark:bg-emerald-400',
        barBg: 'bg-emerald-500',
        textColor: 'text-emerald-600 dark:text-emerald-400',
      };

  const Icon = config.icon;

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border shadow-2xs ${config.badgeBg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dotBg}`} />
        <span className="font-semibold">{score}</span>
        <span className="uppercase tracking-wider opacity-80">{config.label}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono font-medium border shadow-2xs ${config.badgeBg}`}>
      {showIcon && <Icon className={`w-3.5 h-3.5 ${config.textColor}`} />}
      <span className="font-semibold tracking-tight text-foreground">{score}</span>
      <span className="text-[10px] text-muted-foreground">/100</span>
      <div className="w-8 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
        <div
          className={`h-full ${config.barBg} transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className="text-[11px] font-medium tracking-wide opacity-90 uppercase">
        {config.label}
      </span>
    </span>
  );
};
