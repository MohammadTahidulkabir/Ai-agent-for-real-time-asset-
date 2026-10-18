/**
 * Security Center View
 * Features Tactical Emergency Panic Button (POL-00), Permission Passport configuration,
 * deterministic spending caps, verified entity allowlist/blocklist, and safety invariant telemetry.
 */

import React, { useState } from 'react';
import { PermissionTier, WalletState } from '../types/wallet';
import { PermissionPassportBadge } from './PermissionPassportBadge';
import { truncateAddress } from '../lib/crypto';
import { auditLedger } from '../lib/auditLedger';
import { getEntityByAddress } from '../lib/knownEntities';
import {
  Sliders,
  AlertOctagon,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  BadgeCheck,
  Copy,
  Flame,
  PowerOff,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { WalletRecoverySection } from './WalletRecoverySection';
import { CyberCard } from './CyberCard';

interface SecurityCenterViewProps {
  wallet: WalletState;
  onUpdateWalletConfig: (updated: Partial<WalletState>) => void;
  showToast?: (type: 'success' | 'error' | 'info', message: string, txHash?: string) => void;
}

export const SecurityCenterView: React.FC<SecurityCenterViewProps> = ({
  wallet,
  onUpdateWalletConfig,
  showToast,
}) => {
  const [perTxCap, setPerTxCap] = useState(wallet.spendingLimits.perTransactionCapEth.toString());
  const [dailyCap, setDailyCap] = useState(wallet.spendingLimits.dailyCapEth.toString());
  const [newAllowlistAddress, setNewAllowlistAddress] = useState('');
  const [newAllowlistLabel, setNewAllowlistLabel] = useState('');
  const [newBlocklistAddress, setNewBlocklistAddress] = useState('');
  const [newBlocklistLabel, setNewBlocklistLabel] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [isPressingPanic, setIsPressingPanic] = useState(false);

  const tiers: { tier: PermissionTier; title: string; desc: string; badge: string }[] = [
    { tier: 'TIER_0_READ_ONLY', title: 'Tier 0: Read Only', desc: 'Balances & activity inspection only. Zero signing capability.', badge: 'Auditor' },
    { tier: 'TIER_1_SIMULATION', title: 'Tier 1: Simulation', desc: 'Fee estimate and transaction simulation. Broadcast is completely disabled.', badge: 'Sandbox' },
    { tier: 'TIER_2_CONFIRMED_EXECUTION', title: 'Tier 2: Confirmed Execution', desc: 'Deterministic security gating. Every on-chain mutation requires proposal authorization.', badge: 'Recommended' },
    { tier: 'TIER_3_LIMITED_AUTOMATION', title: 'Tier 3: Limited Automation', desc: 'Autonomous micro-transfers (<=0.05 ETH) and rebalancing to allowlisted contracts.', badge: 'Autonomous' },
  ];

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(perTxCap);
    const d = parseFloat(dailyCap);
    if (!isNaN(p) && !isNaN(d) && p > 0 && d >= p) {
      onUpdateWalletConfig({
        spendingLimits: {
          ...wallet.spendingLimits,
          perTransactionCapEth: p,
          dailyCapEth: d,
        },
      });
      auditLedger.recordEvent(
        'SETTINGS_UPDATED',
        'USER',
        `Updated spending limits: per-tx cap = ${p} ETH, daily cap = ${d} ETH`,
        { perTxCap: p, dailyCap: d }
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleToggleEmergencyPause = () => {
    const nextState = !wallet.isEmergencyPaused;
    onUpdateWalletConfig({ isEmergencyPaused: nextState });
    auditLedger.recordEvent(
      'EMERGENCY_PAUSE_TOGGLED',
      'USER',
      `Emergency Panic Switch triggered ${nextState ? 'ENGAGED (All Outgoing Transactions Strictly Halted)' : 'DISARMED (Normal Operations Resumed)'}`,
      { isEmergencyPaused: nextState, rule: 'POL-00' }
    );
  };

  const handleAddAllowlist = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = newAllowlistAddress.trim();
    if (addr.startsWith('0x') && addr.length === 42 && !wallet.allowlist.includes(addr)) {
      const updated = [...wallet.allowlist, addr];
      onUpdateWalletConfig({ allowlist: updated });
      setNewAllowlistAddress('');
      setNewAllowlistLabel('');
      auditLedger.recordEvent('SETTINGS_UPDATED', 'USER', `Added ${newAllowlistLabel || addr} to allowlist`, { address: addr, label: newAllowlistLabel });
    }
  };

  const handleRemoveAllowlist = (addr: string) => {
    const updated = wallet.allowlist.filter(a => a.toLowerCase() !== addr.toLowerCase());
    onUpdateWalletConfig({ allowlist: updated });
    auditLedger.recordEvent('SETTINGS_UPDATED', 'USER', `Removed ${addr} from allowlist`, { address: addr });
  };

  const handleAddBlocklist = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = newBlocklistAddress.trim();
    if (addr.startsWith('0x') && addr.length === 42 && !wallet.blocklist.includes(addr)) {
      const updated = [...wallet.blocklist, addr];
      onUpdateWalletConfig({ blocklist: updated });
      setNewBlocklistAddress('');
      setNewBlocklistLabel('');
      auditLedger.recordEvent('SETTINGS_UPDATED', 'USER', `Added ${newBlocklistLabel || addr} to threat blocklist`, { address: addr, label: newBlocklistLabel });
    }
  };

  const handleRemoveBlocklist = (addr: string) => {
    const updated = wallet.blocklist.filter(a => a.toLowerCase() !== addr.toLowerCase());
    onUpdateWalletConfig({ blocklist: updated });
    auditLedger.recordEvent('SETTINGS_UPDATED', 'USER', `Removed ${addr} from threat blocklist`, { address: addr });
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* TACTICAL EMERGENCY PANIC BUTTON CONSOLE (RULE POL-00)    */}
      {/* ======================================================== */}
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-xl ${
          wallet.isEmergencyPaused
            ? 'bg-[#180a0e] border-rose-600/80 panic-glow-active'
            : 'bg-[#0c121e] border-rose-950/60 hover:border-rose-900/50'
        }`}
      >
        {/* Tactical Hazard Backdrop Accent */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity ${
            wallet.isEmergencyPaused ? 'hazard-stripes-active opacity-60' : 'hazard-stripes opacity-20'
          }`}
        />

        <div className="relative p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Illuminated Panic Status Indicator */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 shadow-inner ${
                wallet.isEmergencyPaused
                  ? 'bg-rose-900/90 border-rose-400 text-rose-100 shadow-rose-900/80 animate-pulse'
                  : 'bg-rose-950/40 border-rose-900/60 text-rose-400'
              }`}
            >
              {wallet.isEmergencyPaused ? (
                <Flame className="w-7 h-7 text-rose-200" />
              ) : (
                <AlertOctagon className="w-7 h-7 text-rose-500" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-rose-400 uppercase">
                  Rule POL-00 Invariant
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    wallet.isEmergencyPaused
                      ? 'bg-rose-600/30 text-rose-200 border-rose-500 animate-pulse'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  }`}
                >
                  {wallet.isEmergencyPaused ? 'HALT ENGAGED' : 'SYSTEM ARMED & SECURE'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
                <span>Tactical Emergency Panic Button</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                {wallet.isEmergencyPaused ? (
                  <span className="text-rose-200 font-medium">
                    EMERGENCY HALT IS ACTIVE: All on-chain broadcasts, proposal authorizations, and autonomous operations are strictly blocked.
                  </span>
                ) : (
                  <span>
                    Immediately halts all on-chain transactions, autonomous agent loops, and pending signatures with zero latency.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Big Tactile Panic Button */}
          <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
            <button
              onClick={handleToggleEmergencyPause}
              onMouseDown={() => setIsPressingPanic(true)}
              onMouseUp={() => setIsPressingPanic(false)}
              onMouseLeave={() => setIsPressingPanic(false)}
              type="button"
              className={`relative group px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black tracking-wider text-xs sm:text-sm uppercase transition-all duration-200 shadow-2xl flex items-center gap-3 border cursor-pointer ${
                wallet.isEmergencyPaused
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400 shadow-emerald-900/50 active:scale-95'
                  : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white border-rose-400/80 shadow-rose-950/80 hover:shadow-rose-600/40 active:scale-95'
              } ${isPressingPanic ? 'scale-95' : ''}`}
            >
              {wallet.isEmergencyPaused ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-200" />
                  <span>Disarm Emergency Pause</span>
                </>
              ) : (
                <>
                  <PowerOff className="w-5 h-5 text-white animate-pulse" />
                  <span>Trigger Panic Button</span>
                </>
              )}
            </button>
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Zero-latency deterministic abort</span>
            </span>
          </div>
        </div>

        {/* Real-Time Invariant Metrics Strip */}
        <div className="px-6 py-2.5 border-t border-rose-950/60 bg-black/40 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${wallet.isEmergencyPaused ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
              <span>Broadcast Gate: {wallet.isEmergencyPaused ? '100% BLOCKED' : 'ONLINE'}</span>
            </span>
            <span className="hidden sm:inline-block text-slate-600">|</span>
            <span className="hidden sm:inline">Verification: SHA-256 Tamper-Evident</span>
          </div>
          <div className="text-slate-400">
            Enforced by <span className="text-cyan-400 font-semibold">PolicyEngine.ts (POL-00)</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PERMISSION PASSPORT TIER MANAGEMENT                      */}
      {/* ======================================================== */}
      <CyberCard variant="cyan" tilt={false} className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Permission Passport Tier Management</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select the active operational tier for the agent. Invariants are enforced deterministically by Rule POL-09.
            </p>
          </div>
          <PermissionPassportBadge tier={wallet.permissionTier} compact />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {tiers.map(t => {
            const isSelected = wallet.permissionTier === t.tier;
            return (
              <button
                key={t.tier}
                onClick={() => {
                  onUpdateWalletConfig({ permissionTier: t.tier });
                  auditLedger.recordEvent('SETTINGS_UPDATED', 'USER', `Switched Permission Passport to ${t.title}`, { tier: t.tier });
                }}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border-cyan-500/80 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-950/40'
                    : 'bg-[#090f1d]/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {t.title}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {t.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-4">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </CyberCard>

      {/* ======================================================== */}
      {/* SPENDING LIMITS (POL-07 & POL-08)                         */}
      {/* ======================================================== */}
      <CyberCard variant="neutral" tilt={false} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Deterministic Spending Caps</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforced by Rule POL-07 (Per-Transaction Cap) and Rule POL-08 (24-Hour Rolling Cap).
            </p>
          </div>
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono font-bold animate-fade-in">
              <Check className="w-3.5 h-3.5" /> Saved &amp; Audited
            </span>
          )}
        </div>

        <form onSubmit={handleSaveLimits} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Per-Transaction Ceiling (ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.001"
                value={perTxCap}
                onChange={e => setPerTxCap(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090f1d] border border-slate-800 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-mono">ETH</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Rule POL-07: Single transaction cannot exceed this value.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              24-Hour Cumulative Limit (ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.05"
                min="0.01"
                value={dailyCap}
                onChange={e => setDailyCap(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#090f1d] border border-slate-800 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-mono">ETH</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Rule POL-08: Rolling 24h spending pool ceiling.</p>
          </div>

          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              Update Spending Limits
            </button>
          </div>
        </form>
      </CyberCard>

      {/* ======================================================== */}
      {/* WALLET RECOVERY & ENCRYPTED KEY BACKUP                   */}
      {/* ======================================================== */}
      <WalletRecoverySection
        wallet={wallet}
        onNotification={(msg, type) => showToast?.(type, msg)}
      />

      {/* ======================================================== */}
      {/* ALLOWLIST & BLOCKLIST (POL-03 & POL-04)                   */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approved Allowlist */}
        <CyberCard variant="emerald" tilt={false} className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Recipient Allowlist</span>
              </h2>
              <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded font-semibold">
                POL-03 Compliant
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Authorized counterparties for low-friction execution. Addresses receive green reputation status.
            </p>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
              {wallet.allowlist.map(addr => {
                const entity = getEntityByAddress(addr);
                return (
                  <div
                    key={addr}
                    className="p-3 rounded-xl bg-[#0f172a] border border-[#1e293b] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-white truncate">
                          {entity ? entity.name : 'Custom Recipient'}
                        </span>
                        {entity && (
                          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/60 px-1.5 py-0.2 rounded shrink-0">
                            {entity.tag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-slate-400 text-[11px]">
                          {truncateAddress(addr, 8, 6)}
                        </span>
                        <button
                          onClick={() => handleCopy(addr)}
                          className="text-slate-500 hover:text-cyan-400 cursor-pointer"
                          title="Copy address"
                        >
                          {copiedAddr === addr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveAllowlist(addr)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Remove from allowlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleAddAllowlist} className="space-y-2 pt-3 border-t border-slate-800/80">
            <input
              type="text"
              placeholder="Recipient Label (e.g. Authorized Vendor)"
              value={newAllowlistLabel}
              onChange={e => setNewAllowlistLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0f172a] border border-[#1e293b] text-white text-xs focus:border-cyan-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="0x... EVM Address"
                value={newAllowlistAddress}
                onChange={e => setNewAllowlistAddress(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0f172a] border border-[#1e293b] text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>
        </CyberCard>

        {/* Threat Blocklist */}
        <CyberCard variant="crimson" tilt={false} className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Threat Intelligence Blocklist</span>
              </h2>
              <span className="text-[10px] font-mono bg-rose-950/60 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded font-semibold">
                POL-04 Enforced
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Known phishing exploits, malicious drainers, and sanctioned contracts. Transactions to these are strictly blocked.
            </p>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
              {wallet.blocklist.map(addr => {
                const entity = getEntityByAddress(addr);
                return (
                  <div
                    key={addr}
                    className="p-3 rounded-xl bg-[#120f1a] border border-rose-950/70 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-semibold text-rose-200 truncate">
                          {entity ? entity.name : 'Flagged Adversary'}
                        </span>
                        {entity && (
                          <span className="text-[10px] font-mono text-rose-300 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.2 rounded shrink-0">
                            {entity.tag}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-slate-400 text-[11px]">
                          {truncateAddress(addr, 8, 6)}
                        </span>
                        <button
                          onClick={() => handleCopy(addr)}
                          className="text-slate-500 hover:text-cyan-400 cursor-pointer"
                          title="Copy address"
                        >
                          {copiedAddr === addr ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveBlocklist(addr)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Remove from blocklist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleAddBlocklist} className="space-y-2 pt-3 border-t border-slate-800/80">
            <input
              type="text"
              placeholder="Threat Tag (e.g. Known Phishing Exploit)"
              value={newBlocklistLabel}
              onChange={e => setNewBlocklistLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0f172a] border border-[#1e293b] text-white text-xs focus:border-rose-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="0x... Threat EVM Address"
                value={newBlocklistAddress}
                onChange={e => setNewBlocklistAddress(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0f172a] border border-[#1e293b] text-white font-mono text-xs focus:border-rose-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Threat</span>
              </button>
            </div>
          </form>
        </CyberCard>
      </div>
    </div>
  );
};
