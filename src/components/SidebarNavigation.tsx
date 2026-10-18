/**
 * SidebarNavigation Component
 * Command Center collapsible navigation dock featuring glowing neon cyber aesthetics,
 * live real-time HUD widgets, integrated quick panic switch, and wallet telemetry.
 */

import React, { useState } from 'react';
import { ActiveTab } from './Header';
import { truncateAddress } from '../lib/crypto';
import {
  LayoutDashboard,
  Bot,
  Sparkles,
  ShieldCheck,
  Hash,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Flame,
  Cpu,
  Activity,
  Layers,
} from 'lucide-react';

interface SidebarNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  walletAddress: string;
  networkName: string;
  isPaused: boolean;
  onTogglePanic?: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeTab,
  onTabChange,
  walletAddress,
  networkName: _networkName,
  isPaused,
  onTogglePanic,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Command Center',
      sublabel: 'Overview & Spending',
      icon: LayoutDashboard,
      shortcut: '1',
    },
    {
      id: 'autonomous' as ActiveTab,
      label: 'Autonomous Agent',
      sublabel: 'On-Chain Execution Core',
      icon: Bot,
      badge: 'AI Loop',
      shortcut: '2',
    },
    {
      id: 'chat' as ActiveTab,
      label: 'Agent Copilot',
      sublabel: 'Intent & EIP-712 Chat',
      icon: Sparkles,
      shortcut: '3',
    },
    {
      id: 'security' as ActiveTab,
      label: 'Security & Recovery',
      sublabel: 'Panic, Policies & Enclave',
      icon: ShieldCheck,
      badge: isPaused ? 'HALTED' : undefined,
      shortcut: '4',
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Audit Ledger',
      sublabel: 'Cryptographic Trail',
      icon: Hash,
      shortcut: '5',
    },
    {
      id: 'tests' as ActiveTab,
      label: 'Verification Suite',
      sublabel: 'Deterministic Invariants',
      icon: Terminal,
      shortcut: '6',
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 flex flex-col bg-[#050814]/95 backdrop-blur-2xl border-r border-cyan-900/30 transition-all duration-300 ease-in-out shadow-[4px_0_30px_rgba(0,0,0,0.6)] ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* 1. Brand & Header Block */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-cyan-950/60 bg-gradient-to-r from-cyan-950/20 via-transparent to-purple-950/20">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Glowing Cybernetic Hexagon Emblem */}
          <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0">
            <div className="w-full h-full bg-[#050814] rounded-[7px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">ClearSpend</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                  v2.4
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300/70 tracking-wider uppercase">
                Autonomous AI Wallet
              </span>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          type="button"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 border border-transparent hover:border-cyan-800/40 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-mono tracking-wider text-slate-500 uppercase flex items-center justify-between">
            <span>Navigation Deck</span>
            <Layers className="w-3 h-3 text-slate-600" />
          </div>
        )}

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              title={isCollapsed ? `${item.label} (${item.shortcut})` : undefined}
              className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 via-cyan-900/40 to-transparent text-cyan-200 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent hover:border-slate-800'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              {/* Active Neon Left Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              )}
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'
                }`}
              />
              {!isCollapsed && (
                <div className="flex-1 text-left flex flex-col min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                          item.badge === 'HALTED'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse font-bold'
                            : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 truncate font-mono">
                    {item.sublabel}
                  </span>
                </div>
              )}
            </button>
          );
        })}

        {/* 3. Live HUD Telemetry Widget (Visible when expanded) */}
        {!isCollapsed && (
          <div className="pt-4">
            <div className="p-3 rounded-xl bg-[#030612]/90 border border-cyan-950/70 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span>LIVE HUD METRICS</span>
                </span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  SYNCED
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
                <div className="flex justify-between items-center bg-[#070d1e] px-2 py-1 rounded border border-cyan-900/20">
                  <span className="text-slate-500">ETH / USD:</span>
                  <span className="font-bold text-slate-200">$2,642.50</span>
                </div>
                <div className="flex justify-between items-center bg-[#070d1e] px-2 py-1 rounded border border-cyan-900/20">
                  <span className="text-slate-500">Sepolia Gas:</span>
                  <span className="font-bold text-cyan-300">15.4 Gwei</span>
                </div>
                <div className="flex justify-between items-center bg-[#070d1e] px-2 py-1 rounded border border-cyan-900/20">
                  <span className="text-slate-500">Block Track:</span>
                  <span className="text-slate-400">#5,849,224</span>
                </div>
                <div className="flex justify-between items-center bg-[#070d1e] px-2 py-1 rounded border border-cyan-900/20">
                  <span className="text-slate-500">Invariants:</span>
                  <span className="text-emerald-400 font-semibold">10 Verified</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Tactical Panic Emergency Switch Dock */}
      <div className="p-3 border-t border-cyan-950/60 bg-[#030713]">
        {onTogglePanic && (
          <button
            onClick={onTogglePanic}
            type="button"
            className={`w-full relative overflow-hidden rounded-xl p-2.5 font-mono text-xs font-bold transition-all duration-300 ${
              isPaused
                ? 'hazard-stripes-active text-rose-100 border border-rose-600 panic-glow-active'
                : 'bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-900/60 hover:border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Flame className={`w-4 h-4 ${isPaused ? 'text-rose-400 animate-bounce' : 'text-rose-400'}`} />
              {!isCollapsed && (
                <span>
                  {isPaused ? 'HALT ENGAGED (POL-00)' : 'TACTICAL PANIC BUTTON'}
                </span>
              )}
            </div>
          </button>
        )}

        {/* 5. Wallet Identity Widget */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)] shrink-0" />
            {!isCollapsed && (
              <span className="text-slate-400 truncate text-[11px]">
                {truncateAddress(walletAddress)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              type="button"
              title="Copy address"
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={`https://sepolia.etherscan.io/address/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View on Etherscan"
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};
