/**
 * Header Component (Top Command Bar)
 * High-density top contextual bar providing view breadcrumbs, live ticker stats,
 * network indicators, permission tier status, and emergency alert banners.
 */

import React from 'react';
import { PermissionTier } from '../types/wallet';
import { PermissionPassportBadge } from './PermissionPassportBadge';
import {
  TrendingUp,
  Radio,
  Flame,
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'autonomous' | 'chat' | 'security' | 'audit' | 'tests';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  walletAddress: string;
  networkName: string;
  permissionTier: PermissionTier;
  isPaused: boolean;
  onOpenPassport: () => void;
  onTogglePanic?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  walletAddress: _walletAddress,
  networkName: _networkName,
  permissionTier,
  isPaused,
  onOpenPassport,
  onTogglePanic,
}) => {
  const viewMeta: Record<ActiveTab, { title: string; subtitle: string; tag: string }> = {
    dashboard: {
      title: 'Command Center',
      subtitle: 'Real-time asset telemetry & 7-day on-chain expenditure trends',
      tag: 'PORTFOLIO HUD',
    },
    autonomous: {
      title: 'Autonomous Agent Engine',
      subtitle: 'On-chain autonomous operations, risk evaluation & rebalancing',
      tag: 'TRACK SIGNATURE',
    },
    chat: {
      title: 'Agent Copilot',
      subtitle: 'Natural language intent parsing & EIP-712 structured signing',
      tag: 'INTERACTIVE AI',
    },
    security: {
      title: 'Security Center & Recovery',
      subtitle: 'Tactical panic halt, deterministic policies & air-gapped key escrow',
      tag: 'AIR-GAPPED DEFENSE',
    },
    audit: {
      title: 'Cryptographic Audit Trail',
      subtitle: 'Deterministic SHA-256 hash-linked immutable event ledger',
      tag: 'CHAIN INTEGRITY',
    },
    tests: {
      title: 'Verification & Policy Suite',
      subtitle: 'Live deterministic invariant tests (Rules POL-00 through POL-09)',
      tag: 'FORMAL VERIFICATION',
    },
  };

  const currentMeta = viewMeta[activeTab] || viewMeta.dashboard;

  return (
    <header className="sticky top-0 z-20 bg-[#040816]/90 backdrop-blur-xl border-b border-cyan-950/60 shadow-lg shadow-black/50">
      {/* Emergency Active Warning Header Banner (Only visible when Emergency Pause is active) */}
      {isPaused && (
        <div className="bg-gradient-to-r from-rose-950/90 via-red-900/90 to-rose-950/90 border-b border-rose-600 px-4 py-2.5 flex items-center justify-between text-xs text-rose-100 font-mono animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
            <span className="font-bold">
              EMERGENCY HALT ARMED (RULE POL-00): All outgoing transactions, signing gates, and autonomous tasks are strictly blocked.
            </span>
          </div>
          {onTogglePanic && (
            <button
              onClick={onTogglePanic}
              type="button"
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shrink-0 shadow-md ml-3"
            >
              Disarm Emergency Halt
            </button>
          )}
        </div>
      )}

      {/* Primary Contextual Bar */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: View Identity & Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40">
                {currentMeta.tag}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {currentMeta.title}
              </h1>
            </div>
            <p className="text-xs text-slate-400 truncate hidden sm:block">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Center / Right: Live Ticker & Passport */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Ticker (Compact) */}
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#030612]/80 border border-cyan-950/80 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">ETH:</span>
              <span className="text-slate-200 font-bold">$2,642.50</span>
              <span className="text-emerald-400 flex items-center text-[11px]">
                <TrendingUp className="w-3 h-3" /> +3.4%
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Gas:</span>
              <span className="text-cyan-300 font-bold">15.4 Gwei</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-slate-400">#5,849,224</span>
            </div>
          </div>

          {/* Network Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#070e20] border border-cyan-900/30 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-slate-200 font-medium">Sepolia</span>
          </div>

          {/* Permission Passport Badge */}
          <PermissionPassportBadge
            tier={permissionTier}
            onClick={onOpenPassport}
          />
        </div>
      </div>
    </header>
  );
};
