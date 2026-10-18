/**
 * Simulated AI Risk Assessment Engine for ClearSpend Agent Wallet
 * Analyzes recipient reputation, transfer volume relative to equity,
 * address history, and smart contract safety indicators with verified entity intelligence.
 */

import { RiskAssessment, RiskFactor, RiskLevel, WalletState } from '../types/wallet';
import { isValidEvmAddress } from './crypto';
import { getEntityByAddress } from './knownEntities';

export function calculateAiRiskAssessment(
  recipient: string,
  amountStr: string,
  asset: string,
  wallet: WalletState
): RiskAssessment {
  const amount = parseFloat(amountStr) || 0;
  const balance = parseFloat(wallet.balances.native) || 1.45;
  const perTxCap = wallet.spendingLimits.perTransactionCapEth || 0.1;
  const isBlocked = wallet.blocklist.some(b => b.toLowerCase() === recipient.toLowerCase());
  const isAllowlisted = wallet.allowlist.some(a => a.toLowerCase() === recipient.toLowerCase());
  const isValid = isValidEvmAddress(recipient);
  const knownEntity = getEntityByAddress(recipient);

  const factors: RiskFactor[] = [];
  let score = 10; // Baseline score for standard EVM testnet

  // 1. Recipient Reputation Analysis
  let recipientStatus: 'TRUSTED' | 'NEW_COUNTERPARTY' | 'THREAT_FLAGGED' = 'NEW_COUNTERPARTY';
  let recipientLabel = knownEntity ? knownEntity.name : 'New Counterparty (Unindexed)';
  let recipientDesc = knownEntity
    ? `${knownEntity.tag}: ${knownEntity.description}`
    : 'Address has 0 prior recorded transfers in your current session.';

  if (isBlocked || (knownEntity && !knownEntity.isSafe)) {
    recipientStatus = 'THREAT_FLAGGED';
    recipientLabel = knownEntity ? `${knownEntity.name} (${knownEntity.tag})` : 'Threat Flagged / Blacklisted';
    recipientDesc = knownEntity
      ? knownEntity.description
      : 'Address matches known phishing registry or reported malicious contract.';
    score += 80;
    factors.push({
      name: 'Counterparty Reputation',
      rating: 'DANGER',
      description: knownEntity ? `Flagged entity: ${knownEntity.name}` : 'Recipient is explicitly cataloged on your threat intelligence blocklist.',
    });
  } else if (isAllowlisted || (knownEntity && knownEntity.isSafe)) {
    recipientStatus = 'TRUSTED';
    recipientLabel = knownEntity ? `${knownEntity.name} [Verified]` : 'Allowlisted / Verified Counterparty';
    recipientDesc = knownEntity
      ? `${knownEntity.tag} – verified safe contact with clean provenance.`
      : 'Verified safe contact with pre-approved identity and clean provenance.';
    score -= 5;
    factors.push({
      name: 'Counterparty Reputation',
      rating: 'SAFE',
      description: knownEntity
        ? `Verified Entity: ${knownEntity.name} (${knownEntity.tag})`
        : 'Counterparty is verified in your trusted allowlist registry.',
    });
  } else if (!isValid) {
    recipientStatus = 'THREAT_FLAGGED';
    recipientLabel = 'Malformed Hex Syntax';
    recipientDesc = 'Invalid EVM checksum or illegal hexadecimal character sequence.';
    score += 65;
    factors.push({
      name: 'Counterparty Reputation',
      rating: 'DANGER',
      description: 'Address failed EVM EIP-55 format validation.',
    });
  } else {
    score += 25;
    factors.push({
      name: 'Counterparty Reputation',
      rating: 'WARNING',
      description: 'First-time interaction with unverified counterparty address.',
    });
  }

  // 2. Amount Exposure Analysis
  const exposurePct = balance > 0 ? (amount / balance) * 100 : 100;
  let amountDesc = '';

  if (amount <= 0) {
    score += 50;
    amountDesc = 'Zero or negative transfer amount requested.';
    factors.push({
      name: 'Amount Exposure',
      rating: 'DANGER',
      description: 'Zero or invalid quantity submitted.',
    });
  } else if (amount > balance) {
    score += 75;
    amountDesc = `Requested ${amount} ${asset} exceeds total wallet balance (${balance.toFixed(4)} ${asset}).`;
    factors.push({
      name: 'Amount Exposure',
      rating: 'DANGER',
      description: `Transfer requires ${exposurePct.toFixed(1)}% of total assets (insufficient funds).`,
    });
  } else if (amount > perTxCap) {
    score += 45;
    amountDesc = `Amount (${amount} ${asset}) breaches configured per-transaction cap (${perTxCap} ${asset}).`;
    factors.push({
      name: 'Amount Exposure',
      rating: 'DANGER',
      description: `Exceeds single-transaction safety cap by ${((amount / perTxCap - 1) * 100).toFixed(0)}%.`,
    });
  } else if (exposurePct > 30) {
    score += 25;
    amountDesc = `Moderate exposure: transfer represents ${exposurePct.toFixed(1)}% of your available liquidity.`;
    factors.push({
      name: 'Amount Exposure',
      rating: 'WARNING',
      description: `High capital concentration (${exposurePct.toFixed(1)}% of wallet).`,
    });
  } else {
    score += 5;
    amountDesc = `Low exposure: transfer represents only ${exposurePct.toFixed(2)}% of wallet liquidity.`;
    factors.push({
      name: 'Amount Exposure',
      rating: 'SAFE',
      description: `Micro-transfer representing <${Math.ceil(exposurePct)}% of total funds.`,
    });
  }

  // 3. Contract & Gas Volatility Factor
  factors.push({
    name: 'Gas & Execution Complexity',
    rating: 'SAFE',
    description: 'Standard EOA native asset transfer (21,000 gas limit; deterministic fee profile).',
  });

  // Clamp score
  const finalScore = Math.max(5, Math.min(99, score));

  // Determine Level & Justification
  let level: RiskLevel = 'LOW_RISK';
  let label = 'Low Risk';
  let justification = '';

  const entityName = knownEntity ? knownEntity.name : recipient.substring(0, 10);

  if (finalScore >= 65 || isBlocked || (knownEntity && !knownEntity.isSafe) || amount > perTxCap || amount > balance || !isValid) {
    level = 'HIGH_RISK';
    label = 'High Risk';
    justification = isBlocked || (knownEntity && !knownEntity.isSafe)
      ? `Blocked: Recipient "${entityName}" is flagged as a confirmed threat (${knownEntity?.tag || 'Blacklist'}).`
      : amount > balance
      ? `High Risk: Insufficient balance. Requesting ${amount} ${asset} when available balance is only ${balance.toFixed(4)} ${asset}.`
      : amount > perTxCap
      ? `High Risk: Transfer amount (${amount} ${asset}) exceeds your maximum per-transaction cap (${perTxCap} ${asset}).`
      : 'High Risk: Counterparty or syntax anomaly detected.';
  } else if (finalScore >= 35 || recipientStatus === 'NEW_COUNTERPARTY') {
    level = 'MEDIUM_RISK';
    label = 'Medium Risk';
    justification = `Caution: Sending to new unindexed address "${entityName}...". Amount (${amount} ${asset}) is within safety limits, but requires user authorization.`;
  } else {
    level = 'LOW_RISK';
    label = 'Low Risk';
    justification = `Safe: Transferring ${amount} ${asset} to verified partner "${entityName}". Represents only ${exposurePct.toFixed(2)}% of wallet liquidity with low gas volatility.`;
  }

  return {
    level,
    score: finalScore,
    label,
    justification,
    recipientReputation: {
      status: recipientStatus,
      label: recipientLabel,
      description: recipientDesc,
    },
    amountAnalysis: {
      exposurePct: Math.round(exposurePct * 100) / 100,
      description: amountDesc,
    },
    factors,
    evaluatedAt: Date.now(),
  };
}
