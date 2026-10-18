/**
 * Permission Passport Badge Component
 * Makes safety and authorization boundaries visible to users.
 */

import React from 'react';
import { PermissionTier } from '../types/wallet';
import { ShieldCheck, Eye, Terminal, Zap } from 'lucide-react';

interface PermissionPassportBadgeProps {
  tier: PermissionTier;
  onClick?: () => void;
  compact?: boolean;
}

export const PermissionPassportBadge: React.FC<PermissionPassportBadgeProps> = ({
  tier,
  onClick,
  compact = false,
}) => {
  const tierConfig = {
    TIER_0_READ_ONLY: {
      label: 'Tier 0: Read Only',
      shortLabel: 'Read Only',
      rule: 'No signing capability',
      icon: Eye,
      border: 'border-slate-700',
      text: 'text-slate-300',
      bg: 'bg-slate-900/80',
    },
    TIER_1_SIMULATION: {
      label: 'Tier 1: Simulation',
      shortLabel: 'Simulation Only',
      rule: 'Fee estimate & simulation only (never broadcast)',
      icon: Terminal,
      border: 'border-amber-700/60',
      text: 'text-amber-300',
      bg: 'bg-amber-950/30',
    },
    TIER_2_CONFIRMED_EXECUTION: {
      label: 'Tier 2: Confirmed Execution',
      shortLabel: 'Confirmed Execution',
      rule: 'User must authorize exact proposal hash',
      icon: ShieldCheck,
      border: 'border-cyan-700/60',
      text: 'text-cyan-300',
      bg: 'bg-cyan-950/30',
    },
    TIER_3_LIMITED_AUTOMATION: {
      label: 'Tier 3: Limited Automation',
      shortLabel: 'Limited Automation',
      rule: 'Micro-transfers to allowlisted recipients under hard caps',
      icon: Zap,
      border: 'border-emerald-700/60',
      text: 'text-emerald-300',
      bg: 'bg-emerald-950/30',
    },
  }[tier];

  const Icon = tierConfig.icon;

  if (compact) {
    return (
      <button
        onClick={onClick}
        type="button"
        title={`Permission Passport: ${tierConfig.rule}`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${tierConfig.border} ${tierConfig.bg} ${tierConfig.text} hover:opacity-90 transition-opacity`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="whitespace-nowrap">{tierConfig.shortLabel}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className={`text-left p-3.5 rounded-lg border ${tierConfig.border} ${tierConfig.bg} hover:border-slate-600 transition-all w-full`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${tierConfig.text}`} />
          <span className={`text-xs font-semibold ${tierConfig.text}`}>
            {tierConfig.label}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">Permission Passport</span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">
        {tierConfig.rule}
      </p>
    </button>
  );
};
