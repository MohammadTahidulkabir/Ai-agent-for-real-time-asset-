/**
 * Deterministic Policy Engine for ClearSpend Agent Wallet
 * Strict rules gating execution. The LLM can explain, but CANNOT bypass or overrule this engine.
 */

import {
  PolicyEvaluation,
  PolicyRuleResult,
  PolicyVerdict,
  TransactionIntent,
  WalletState
} from '../types/wallet';
import { isValidEvmAddress } from './crypto';

export const SUPPORTED_CHAINS = [
  { id: 11155111, name: 'Ethereum Sepolia', nativeSymbol: 'ETH', rpcUrl: 'https://rpc.sepolia.org', explorerUrl: 'https://sepolia.etherscan.io', isTestnet: true },
  { id: 84532, name: 'Base Sepolia', nativeSymbol: 'ETH', rpcUrl: 'https://sepolia.base.org', explorerUrl: 'https://sepolia.basescan.org', isTestnet: true },
  { id: 17000, name: 'Ethereum Holesky', nativeSymbol: 'ETH', rpcUrl: 'https://ethereum-holesky-rpc.publicnode.com', explorerUrl: 'https://holesky.etherscan.io', isTestnet: true },
];

export const TRUSTED_ASSETS = ['native', 'ETH', 'USDC', 'DAI', 'WETH'];

export function evaluateProposalPolicy(
  intent: Partial<TransactionIntent>,
  wallet: WalletState
): PolicyEvaluation {
  const ruleResults: PolicyRuleResult[] = [];
  const now = Date.now();

  // RULE POL-00: Emergency Global Pause Switch
  if (wallet.isEmergencyPaused) {
    ruleResults.push({
      ruleId: 'POL-00',
      ruleName: 'Emergency Pause Check',
      passed: false,
      verdict: 'BLOCK',
      reason: 'Wallet operations are currently paused by the Emergency Security Switch.',
    });
  } else {
    ruleResults.push({
      ruleId: 'POL-00',
      ruleName: 'Emergency Pause Check',
      passed: true,
      verdict: 'ALLOW',
      reason: 'Emergency pause is inactive.',
    });
  }

  // RULE POL-01: Chain ID Allowlist
  const chainId = intent.chainId || wallet.network.id;
  const isChainAllowed = SUPPORTED_CHAINS.some(c => c.id === chainId);
  if (!isChainAllowed) {
    ruleResults.push({
      ruleId: 'POL-01',
      ruleName: 'Chain ID Allowlist',
      passed: false,
      verdict: 'BLOCK',
      reason: `Chain ID ${chainId} is not in the approved testnet registry. Only verified testnets are permitted.`,
    });
  } else {
    ruleResults.push({
      ruleId: 'POL-01',
      ruleName: 'Chain ID Allowlist',
      passed: true,
      verdict: 'ALLOW',
      reason: `Chain ID ${chainId} (${wallet.network.name}) is verified and allowlisted.`,
    });
  }

  // RULE POL-02: Recipient Address Syntax Check
  const recipient = intent.recipient?.trim();
  const isZeroAddress = recipient === '0x0000000000000000000000000000000000000000';
  const isDeadAddress = recipient?.toLowerCase() === '0x000000000000000000000000000000000000dead';

  if (!recipient) {
    ruleResults.push({
      ruleId: 'POL-02',
      ruleName: 'Recipient Syntax Verification',
      passed: false,
      verdict: 'CLARIFY',
      reason: 'Recipient address is missing from request.',
    });
  } else if (!isValidEvmAddress(recipient) || isZeroAddress || isDeadAddress) {
    ruleResults.push({
      ruleId: 'POL-02',
      ruleName: 'Recipient Syntax Verification',
      passed: false,
      verdict: 'BLOCK',
      reason: `Address "${recipient}" failed EVM format validation (must be 42-char hex, non-zero, valid checksum).`,
    });
  } else {
    ruleResults.push({
      ruleId: 'POL-02',
      ruleName: 'Recipient Syntax Verification',
      passed: true,
      verdict: 'ALLOW',
      reason: `Recipient address syntax verified: ${recipient.substring(0, 8)}...`,
    });
  }

  // RULE POL-03: Threat and Malicious Blocklist Check
  if (recipient) {
    const isBlocked = wallet.blocklist.some(b => b.toLowerCase() === recipient.toLowerCase());
    if (isBlocked) {
      ruleResults.push({
        ruleId: 'POL-03',
        ruleName: 'Threat & Phishing Blocklist',
        passed: false,
        verdict: 'BLOCK',
        reason: 'Recipient address matches known malicious phishing or high-risk exploit database.',
      });
    } else {
      ruleResults.push({
        ruleId: 'POL-03',
        ruleName: 'Threat & Phishing Blocklist',
        passed: true,
        verdict: 'ALLOW',
        reason: 'Recipient address cleared threat scan (not on blocklist).',
      });
    }
  }

  // RULE POL-04: Asset Allowlist Check
  const asset = (intent.asset || 'native').trim();
  const isAssetTrusted = TRUSTED_ASSETS.some(a => a.toLowerCase() === asset.toLowerCase());
  if (!isAssetTrusted) {
    ruleResults.push({
      ruleId: 'POL-04',
      ruleName: 'Asset Registry Allowlist',
      passed: false,
      verdict: 'BLOCK',
      reason: `Asset "${asset}" is unverified. Only verified assets (${TRUSTED_ASSETS.join(', ')}) are allowed.`,
    });
  } else {
    ruleResults.push({
      ruleId: 'POL-04',
      ruleName: 'Asset Registry Allowlist',
      passed: true,
      verdict: 'ALLOW',
      reason: `Asset "${asset}" is in trusted asset registry.`,
    });
  }

  // RULE POL-05: Positive Valid Amount Check
  const amountStr = intent.amount?.trim();
  const parsedAmount = amountStr ? parseFloat(amountStr) : NaN;
  if (!amountStr || isNaN(parsedAmount)) {
    ruleResults.push({
      ruleId: 'POL-05',
      ruleName: 'Amount Specification & Precision',
      passed: false,
      verdict: 'CLARIFY',
      reason: 'Transaction amount is missing or not a valid number.',
    });
  } else if (parsedAmount <= 0) {
    ruleResults.push({
      ruleId: 'POL-05',
      ruleName: 'Amount Specification & Precision',
      passed: false,
      verdict: 'BLOCK',
      reason: `Amount (${amountStr}) must be strictly greater than zero.`,
    });
  } else {
    ruleResults.push({
      ruleId: 'POL-05',
      ruleName: 'Amount Specification & Precision',
      passed: true,
      verdict: 'ALLOW',
      reason: `Valid positive transfer amount: ${parsedAmount} ${asset}.`,
    });
  }

  // RULE POL-06: Balance + Fee Reserve Check
  const estGasReserve = 0.0005; // Standard testnet gas buffer in ETH
  const currentNativeBalance = parseFloat(wallet.balances.native || '0');
  if (!isNaN(parsedAmount) && parsedAmount > 0) {
    const totalRequired = parsedAmount + estGasReserve;
    if (totalRequired > currentNativeBalance) {
      ruleResults.push({
        ruleId: 'POL-06',
        ruleName: 'Sufficient Balance & Gas Reserve',
        passed: false,
        verdict: 'BLOCK',
        reason: `Insufficient funds. Transfer (${parsedAmount} ETH) + Gas buffer (${estGasReserve} ETH) exceeds current balance (${currentNativeBalance} ETH).`,
      });
    } else {
      ruleResults.push({
        ruleId: 'POL-06',
        ruleName: 'Sufficient Balance & Gas Reserve',
        passed: true,
        verdict: 'ALLOW',
        reason: `Balance check passed (${currentNativeBalance} ETH covers ${parsedAmount} ETH + ${estGasReserve} ETH gas reserve).`,
      });
    }
  }

  // RULE POL-07: Per-Transaction Spending Cap
  if (!isNaN(parsedAmount) && parsedAmount > 0) {
    const perTxCap = wallet.spendingLimits.perTransactionCapEth;
    if (parsedAmount > perTxCap) {
      ruleResults.push({
        ruleId: 'POL-07',
        ruleName: 'Per-Transaction Spending Cap',
        passed: false,
        verdict: 'BLOCK',
        reason: `Amount of ${parsedAmount} ETH breaches maximum per-transaction security cap (${perTxCap} ETH).`,
      });
    } else {
      ruleResults.push({
        ruleId: 'POL-07',
        ruleName: 'Per-Transaction Spending Cap',
        passed: true,
        verdict: 'ALLOW',
        reason: `Within per-transaction limit (${parsedAmount} <= ${perTxCap} ETH).`,
      });
    }
  }

  // RULE POL-08: Rolling 24-Hour Daily Spending Cap
  if (!isNaN(parsedAmount) && parsedAmount > 0) {
    const dailyCap = wallet.spendingLimits.dailyCapEth;
    const projectedDaily = wallet.spendingLimits.spentTodayEth + parsedAmount;
    if (projectedDaily > dailyCap) {
      ruleResults.push({
        ruleId: 'POL-08',
        ruleName: 'Daily Cumulative Spending Cap',
        passed: false,
        verdict: 'BLOCK',
        reason: `Transaction would increase 24h spending to ${projectedDaily.toFixed(4)} ETH, exceeding daily cap of ${dailyCap} ETH.`,
      });
    } else {
      ruleResults.push({
        ruleId: 'POL-08',
        ruleName: 'Daily Cumulative Spending Cap',
        passed: true,
        verdict: 'ALLOW',
        reason: `Cumulative 24h spend projected at ${projectedDaily.toFixed(4)} / ${dailyCap} ETH.`,
      });
    }
  }

  // RULE POL-09: Permission Passport Tier Enforcement
  const tier = wallet.permissionTier;
  if (tier === 'TIER_0_READ_ONLY') {
    ruleResults.push({
      ruleId: 'POL-09',
      ruleName: 'Permission Passport Tier Constraint',
      passed: false,
      verdict: 'BLOCK',
      reason: 'Current tier is TIER 0 (READ ONLY). On-chain mutations and signing are disabled.',
    });
  } else if (tier === 'TIER_1_SIMULATION') {
    ruleResults.push({
      ruleId: 'POL-09',
      ruleName: 'Permission Passport Tier Constraint',
      passed: true,
      verdict: 'ALLOW',
      reason: 'Current tier is TIER 1 (SIMULATION ONLY). Read & simulation allowed; broadcast forbidden.',
    });
  } else if (tier === 'TIER_2_CONFIRMED_EXECUTION') {
    ruleResults.push({
      ruleId: 'POL-09',
      ruleName: 'Permission Passport Tier Constraint',
      passed: true,
      verdict: 'NEEDS_CONFIRMATION',
      reason: 'TIER 2 requires explicit user signature & authorization of exact canonical proposal hash.',
    });
  } else if (tier === 'TIER_3_LIMITED_AUTOMATION') {
    // Limited automation: only if recipient is on allowlist and amount <= 0.005 ETH
    const isAllowlisted = recipient && wallet.allowlist.some(a => a.toLowerCase() === recipient.toLowerCase());
    const isMicroTx = !isNaN(parsedAmount) && parsedAmount <= 0.005;
    if (isAllowlisted && isMicroTx) {
      ruleResults.push({
        ruleId: 'POL-09',
        ruleName: 'Permission Passport Tier Constraint',
        passed: true,
        verdict: 'ALLOW',
        reason: 'Pre-approved micro-transfer to allowlisted recipient under TIER 3 automation policy.',
      });
    } else {
      ruleResults.push({
        ruleId: 'POL-09',
        ruleName: 'Permission Passport Tier Constraint',
        passed: true,
        verdict: 'NEEDS_CONFIRMATION',
        reason: 'Transfer exceeds limited automation thresholds; escalating to explicit user confirmation.',
      });
    }
  }

  // Compute overall verdict
  const hasBlock = ruleResults.some(r => r.verdict === 'BLOCK');
  const hasClarify = ruleResults.some(r => r.verdict === 'CLARIFY');
  const hasNeedsConfirmation = ruleResults.some(r => r.verdict === 'NEEDS_CONFIRMATION');

  let finalVerdict: PolicyVerdict = 'ALLOW';
  let summary = 'Proposal adheres to all deterministic security policies and limits.';
  let canExecute = true;
  let requiresUserConfirmation = false;

  if (hasBlock) {
    finalVerdict = 'BLOCK';
    const failedRules = ruleResults.filter(r => r.verdict === 'BLOCK').map(r => r.ruleId);
    summary = `Blocked by security policy rules: ${failedRules.join(', ')}.`;
    canExecute = false;
  } else if (hasClarify) {
    finalVerdict = 'CLARIFY';
    summary = 'Additional transaction parameters required before policy evaluation.';
    canExecute = false;
  } else if (tier === 'TIER_1_SIMULATION') {
    finalVerdict = 'ALLOW';
    summary = 'Simulation approved. On-chain broadcast prohibited in Tier 1.';
    canExecute = false;
  } else if (hasNeedsConfirmation || tier === 'TIER_2_CONFIRMED_EXECUTION') {
    finalVerdict = 'NEEDS_CONFIRMATION';
    summary = 'Security verification passed. Explicit authorization required to sign and broadcast.';
    requiresUserConfirmation = true;
    canExecute = true;
  }

  return {
    verdict: finalVerdict,
    canExecute,
    requiresUserConfirmation,
    ruleResults,
    summary,
    evaluatedAt: now,
  };
}
