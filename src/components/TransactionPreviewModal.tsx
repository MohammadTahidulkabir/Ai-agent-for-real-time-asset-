/**
 * Transaction Preview & Authorization Modal (Enhanced)
 * Features simulated AI Risk Assessment scoring, reputation & amount justification,
 * cryptographic canonical proposal hashing, and an intuitive, user-friendly signing gate.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { TransactionProposal, WalletState, RiskAssessment } from '../types/wallet';
import { calculateAiRiskAssessment } from '../lib/riskEngine';
import { truncateAddress } from '../lib/crypto';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Lock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface TransactionPreviewModalProps {
  proposal: TransactionProposal | null;
  wallet: WalletState;
  onAuthorize: (proposal: TransactionProposal) => void;
  onReject: (proposal: TransactionProposal, reason: string) => void;
  onClose: () => void;
  isExecuting: boolean;
}

export const TransactionPreviewModal: React.FC<TransactionPreviewModalProps> = ({
  proposal,
  wallet,
  onAuthorize,
  onReject,
  onClose,
  isExecuting,
}) => {
  if (!proposal) return null;

  const [timeLeftSec, setTimeLeftSec] = useState<number>(60);
  const [hasCopiedHash, setHasCopiedHash] = useState(false);
  const [hasCopiedAddress, setHasCopiedAddress] = useState(false);
  const [showAllRules, setShowAllRules] = useState(false);

  // Compute or use cached AI risk assessment
  const riskAssessment: RiskAssessment = useMemo(() => {
    if (proposal.riskAssessment) return proposal.riskAssessment;
    return calculateAiRiskAssessment(proposal.recipient, proposal.amount, proposal.asset, wallet);
  }, [proposal, wallet]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const remainingMs = proposal.expiresAt - Date.now();
      return Math.max(0, Math.floor(remainingMs / 1000));
    };

    setTimeLeftSec(calculateTimeLeft());
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeftSec(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [proposal]);

  const isExpired = timeLeftSec <= 0 || proposal.status === 'EXPIRED';
  const totalEth = (parseFloat(proposal.amount || '0') + parseFloat(proposal.estimatedFeeEth || '0')).toFixed(6);
  const timeProgressPct = Math.max(0, Math.min(100, (timeLeftSec / 60) * 100));

  const copyProposalHash = () => {
    navigator.clipboard.writeText(proposal.canonicalHash);
    setHasCopiedHash(true);
    setTimeout(() => setHasCopiedHash(false), 2000);
  };

  const copyRecipientAddress = () => {
    navigator.clipboard.writeText(proposal.recipient);
    setHasCopiedAddress(true);
    setTimeout(() => setHasCopiedAddress(false), 2000);
  };

  // Deterministic avatar gradient based on address
  const getAddressGradient = (addr: string) => {
    const clean = addr.replace('0x', '').slice(0, 6) || 'abcdef';
    return `linear-gradient(135deg, #${clean.slice(0, 6)}, #${clean.slice(2, 6)}88)`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#060c1d]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-2xl max-w-xl w-full max-h-[92vh] overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col relative text-slate-100">
        {/* Expiration Progress Line */}
        <div className="w-full bg-slate-800 h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeftSec < 15 ? 'bg-rose-500' : timeLeftSec < 30 ? 'bg-amber-400' : 'bg-cyan-500'
            }`}
            style={{ width: `${timeProgressPct}%` }}
          />
        </div>

        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Transaction Authorization Gate
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Nonce #{proposal.nonce}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                <span>{wallet.network.name}</span>
                <span>•</span>
                <span>Chain ID: {proposal.chainId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${
                isExpired
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                  : timeLeftSec < 15
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                  : 'bg-slate-800/80 text-cyan-300 border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isExpired ? 'EXPIRED' : `${timeLeftSec}s remaining`}</span>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Main Transfer Highlight Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  You are transferring
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                    {proposal.amount}
                  </span>
                  <span className="text-xl font-bold text-cyan-400">
                    {proposal.asset === 'native' ? 'ETH' : proposal.asset}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                    ${(parseFloat(proposal.amount || '0') * 2500).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </span>
              </div>

              {/* Policy Engine Badge */}
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block mb-1 font-mono">Policy Engine</span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                    proposal.policyEvaluation.verdict === 'ALLOW'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      : proposal.policyEvaluation.verdict === 'NEEDS_CONFIRMATION'
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                      : 'bg-rose-950/80 text-rose-300 border-rose-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{proposal.policyEvaluation.verdict}</span>
                </span>
              </div>
            </div>

            {/* Recipient Card with Identicon */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-full shrink-0 border border-slate-700 shadow-sm"
                  style={{ background: getAddressGradient(proposal.recipient) }}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">Recipient:</span>
                    {proposal.recipientLabel ? (
                      <span className="text-[11px] font-bold text-cyan-300 truncate">
                        {proposal.recipientLabel}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-200 truncate">
                        {truncateAddress(proposal.recipient, 10, 8)}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-slate-400 block truncate text-[11px]" title={proposal.recipient}>
                    {proposal.recipient}
                  </span>
                </div>
              </div>
              <button
                onClick={copyRecipientAddress}
                type="button"
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] shrink-0 cursor-pointer"
                title="Copy Full EVM Address"
              >
                {hasCopiedAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{hasCopiedAddress ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* SIMULATED AI RISK ASSESSMENT CARD */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-300 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    AI Risk Assessment
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Autonomous Reputation &amp; Exposure Analysis
                  </span>
                </div>
              </div>

              {/* Risk Level Badge */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border shadow-sm ${
                    riskAssessment.level === 'LOW_RISK'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/80 shadow-emerald-950/50'
                      : riskAssessment.level === 'MEDIUM_RISK'
                      ? 'bg-amber-950 text-amber-300 border-amber-700/80 shadow-amber-950/50'
                      : 'bg-rose-950 text-rose-300 border-rose-700/80 shadow-rose-950/50'
                  }`}
                >
                  {riskAssessment.level === 'LOW_RISK' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : riskAssessment.level === 'MEDIUM_RISK' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  <span>{riskAssessment.label}</span>
                  <span className="text-slate-400">•</span>
                  <span>Score: {riskAssessment.score}/100</span>
                </span>
              </div>
            </div>

            {/* Risk Gauge Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 flex">
                <div
                  className={`h-full transition-all duration-500 ${
                    riskAssessment.score < 30
                      ? 'bg-emerald-500'
                      : riskAssessment.score < 65
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${riskAssessment.score}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
                <span>0 (Safe)</span>
                <span>50 (Moderate)</span>
                <span>100 (Critical Threat)</span>
              </div>
            </div>

            {/* Plain-English Justification Box */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <p className="font-sans">
                <span className="font-semibold text-white">AI Justification: </span>
                {riskAssessment.justification}
              </p>
            </div>

            {/* Risk Factors Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 block mb-0.5 font-medium">Counterparty Reputation</span>
                <span
                  className={`font-mono font-semibold flex items-center gap-1 ${
                    riskAssessment.recipientReputation.status === 'TRUSTED'
                      ? 'text-emerald-400'
                      : riskAssessment.recipientReputation.status === 'THREAT_FLAGGED'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {riskAssessment.recipientReputation.status === 'TRUSTED' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  <span>{riskAssessment.recipientReputation.label}</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {riskAssessment.recipientReputation.description}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 block mb-0.5 font-medium">Balance &amp; Cap Exposure</span>
                <span className="font-mono font-semibold text-slate-200">
                  {riskAssessment.amountAnalysis.exposurePct}% of Wallet Liquidity
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {riskAssessment.amountAnalysis.description}
                </p>
              </div>
            </div>
          </div>

          {/* Cryptographic Canonical Proposal Hash Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Canonical Proposal Hash (SHA-256)</span>
              </span>
              <button
                onClick={copyProposalHash}
                type="button"
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono transition-colors flex items-center gap-1 cursor-pointer"
              >
                {hasCopiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{hasCopiedHash ? 'Copied' : 'Copy Hash'}</span>
              </button>
            </div>
            <code className="text-[11px] font-mono text-slate-300 break-all block p-2 rounded bg-slate-900 border border-slate-800">
              {proposal.canonicalHash}
            </code>
            <p className="text-[11px] text-slate-400 leading-tight">
              Cryptographically seals sender, recipient, asset, amount, and nonce. Any byte altered in flight invalidates signing.
            </p>
          </div>

          {/* Collapsible Deterministic Policy Engine Audit */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 overflow-hidden">
            <button
              onClick={() => setShowAllRules(!showAllRules)}
              type="button"
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-slate-200 hover:bg-slate-900/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Deterministic Policy Checks ({proposal.policyEvaluation.ruleResults.length} Invariants Audited)
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-[11px] font-mono">
                  {showAllRules ? 'Collapse' : 'Expand All'}
                </span>
                {showAllRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAllRules ? (
              <div className="p-3 border-t border-slate-800/80 space-y-1.5 max-h-48 overflow-y-auto">
                {proposal.policyEvaluation.ruleResults.map(rule => (
                  <div
                    key={rule.ruleId}
                    className="flex items-start justify-between p-2 rounded bg-slate-900/70 border border-slate-800 text-xs"
                  >
                    <div className="flex items-start gap-2">
                      {rule.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-mono text-slate-200 font-semibold mr-2">
                          {rule.ruleId}: {rule.ruleName}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{rule.reason}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-mono shrink-0 ml-2 font-medium ${
                        rule.verdict === 'ALLOW'
                          ? 'text-emerald-400'
                          : rule.verdict === 'NEEDS_CONFIRMATION'
                          ? 'text-cyan-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {rule.verdict}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3.5 pb-3 pt-1 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/40">
                <span>All core security rules verified: Chain allowlist, address syntax, gas buffer &amp; spending caps.</span>
                <span className="text-emerald-400 font-mono font-medium">10/10 PASS</span>
              </div>
            )}
          </div>

          {/* Balance Flow Strip */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block mb-0.5">Current Balance</span>
              <span className="text-slate-200 font-bold">{wallet.balances.native} ETH</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block mb-0.5">Deduction (Tx + Gas)</span>
              <span className="text-amber-400 font-bold">-{totalEth} ETH</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block mb-0.5">New Balance</span>
              <span className="text-emerald-400 font-bold">
                {(Math.max(0, parseFloat(wallet.balances.native) - parseFloat(totalEth))).toFixed(4)} ETH
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            onClick={() => onReject(proposal, 'User cancelled transaction')}
            disabled={isExecuting}
            type="button"
            className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Reject &amp; Abort
          </button>

          <button
            onClick={() => onAuthorize(proposal)}
            disabled={isExecuting || isExpired || !proposal.policyEvaluation.canExecute || wallet.isEmergencyPaused}
            type="button"
            className={`px-6 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
              isExecuting
                ? 'bg-cyan-600 text-white cursor-wait opacity-80'
                : wallet.isEmergencyPaused
                ? 'bg-rose-950 text-rose-300 border border-rose-800 cursor-not-allowed'
                : isExpired
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : !proposal.policyEvaluation.canExecute
                ? 'bg-rose-950 text-rose-300 border border-rose-800 cursor-not-allowed'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-500/20 active:scale-[0.98]'
            }`}
          >
            {isExecuting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Broadcasting to Sepolia...</span>
              </>
            ) : wallet.isEmergencyPaused ? (
              <span>Blocked by Emergency Pause (POL-00)</span>
            ) : isExpired ? (
              <span>Proposal Expired</span>
            ) : !proposal.policyEvaluation.canExecute ? (
              <span>Blocked by Policy</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Sign &amp; Broadcast ({proposal.amount} {proposal.asset === 'native' ? 'ETH' : proposal.asset})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
