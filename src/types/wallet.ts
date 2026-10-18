/**
 * Core type definitions for ClearSpend Agent Wallet
 * Autonomous On-chain Wallet Agent with Deterministic Policy Gating
 */

export type PermissionTier = 
  | 'TIER_0_READ_ONLY'
  | 'TIER_1_SIMULATION'
  | 'TIER_2_CONFIRMED_EXECUTION'
  | 'TIER_3_LIMITED_AUTOMATION';

export interface ChainConfig {
  id: number;
  name: string;
  nativeSymbol: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  balance: string; // Decimal string
  balanceUsd: number;
}

export interface WalletState {
  address: string;
  network: ChainConfig;
  balances: {
    native: string; // e.g. "1.450"
    nativeUsd: number;
    tokens: TokenBalance[];
  };
  permissionTier: PermissionTier;
  spendingLimits: {
    perTransactionCapEth: number; // e.g. 0.05
    dailyCapEth: number; // e.g. 0.20
    spentTodayEth: number; // tracks rolling spend
  };
  isEmergencyPaused: boolean;
  allowlist: string[]; // Approved recipient addresses
  blocklist: string[]; // Known malicious / phishing addresses
}

export type ActionType = 'transfer' | 'balance_inquiry' | 'simulate_transfer' | 'clarify_request';

export interface TransactionIntent {
  action: ActionType;
  chainId?: number;
  asset: string; // 'native' | 'USDC' | 'DAI'
  recipient?: string;
  amount?: string; // Decimal string representation, e.g. "0.002"
  missingFields?: string[];
  rawQuery: string;
  explanation: string;
  confidence: number;
  potentialThreat?: string;
}

export type PolicyVerdict = 
  | 'ALLOW'
  | 'NEEDS_CONFIRMATION'
  | 'BLOCK'
  | 'CLARIFY';

export interface PolicyRuleResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  verdict: PolicyVerdict;
  reason: string;
}

export interface PolicyEvaluation {
  verdict: PolicyVerdict;
  canExecute: boolean;
  requiresUserConfirmation: boolean;
  ruleResults: PolicyRuleResult[];
  summary: string;
  evaluatedAt: number;
}

export type RiskLevel = 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';

export interface RiskFactor {
  name: string;
  rating: 'SAFE' | 'WARNING' | 'DANGER';
  description: string;
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0 to 100 (lower is safer)
  label: string; // 'Low Risk' | 'Medium Risk' | 'High Risk'
  justification: string;
  recipientReputation: {
    status: 'TRUSTED' | 'NEW_COUNTERPARTY' | 'THREAT_FLAGGED';
    label: string;
    description: string;
  };
  amountAnalysis: {
    exposurePct: number;
    description: string;
  };
  factors: RiskFactor[];
  evaluatedAt: number;
}

export interface TransactionProposal {
  proposalId: string;
  createdAt: number;
  expiresAt: number;
  nonce: number;
  chainId: number;
  asset: string;
  recipient: string;
  recipientLabel?: string;
  amount: string; // Decimal string
  estimatedFeeEth: string;
  gasLimit: number;
  canonicalHash: string; // SHA-256 of canonical proposal payload
  policyEvaluation: PolicyEvaluation;
  riskAssessment?: RiskAssessment;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'CONFIRMED' | 'FAILED' | 'EXPIRED';
  txHash?: string;
  blockNumber?: number;
  executedAt?: number;
  rejectionReason?: string;
}

export type AuditEventType = 
  | 'INTENT_PARSED'
  | 'POLICY_EVALUATED'
  | 'PROPOSAL_CREATED'
  | 'PROPOSAL_APPROVED'
  | 'PROPOSAL_REJECTED'
  | 'TRANSACTION_BROADCAST'
  | 'TRANSACTION_CONFIRMED'
  | 'SECURITY_BREACH_BLOCKED'
  | 'EMERGENCY_PAUSE_TOGGLED'
  | 'SETTINGS_UPDATED'
  | 'AUTONOMOUS_CYCLE_EXECUTED'
  | 'AUTONOMOUS_REBALANCE_TRIGGERED'
  | 'AUTONOMOUS_DEFENSE_TRIGGERED'
  | 'WALLET_BACKUP_EXPORTED'
  | 'WALLET_RECOVERY_ACCESSED';

export type AutonomousOperationType = 
  | 'TREASURY_REBALANCE'
  | 'SCHEDULED_STREAM'
  | 'GAS_OPTIMIZED_EXEC'
  | 'RISK_SENTRY_DEFENSE';

export interface AutonomousCycleLog {
  id: string;
  timestamp: number;
  phase: 'PERCEPTION' | 'AI_EVALUATION' | 'POLICY_GATE' | 'SETTLEMENT';
  operationType: AutonomousOperationType;
  title: string;
  detail: string;
  status: 'SUCCESS' | 'BLOCKED_BY_POLICY' | 'SKIPPED' | 'HALTED_PANIC';
  txHash?: string;
  driftPct?: number;
  gasGwei?: number;
}

export interface AutonomousAgentConfig {
  isActive: boolean;
  frequencySec: number;
  rebalanceDriftThresholdPct: number;
  maxAutonomousTxEth: number;
  targetGasCeilingGwei: number;
  enabledModules: {
    treasuryRebalance: boolean;
    scheduledStreaming: boolean;
    gasOptimization: boolean;
    riskSentryDefense: boolean;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  type: AuditEventType;
  proposalId?: string;
  actor: 'USER' | 'AGENT' | 'POLICY_ENGINE' | 'BLOCKCHAIN';
  action: string;
  details: Record<string, unknown>;
  previousEventHash: string;
  eventHash: string; // SHA-256 tamper-evident link
}

export interface AcceptanceTestCase {
  id: string; // e.g. "AT-01"
  name: string;
  scenario: string;
  inputDescription: string;
  expectedBehavior: string;
  passCondition: string;
  category: 'CORE_WORKFLOW' | 'SECURITY_GATING' | 'ADVERSARIAL_DEFENSE' | 'SYSTEM_INTEGRITY';
  status: 'IDLE' | 'RUNNING' | 'PASSED' | 'FAILED';
  executionLogs: string[];
  actualOutput?: string;
  durationMs?: number;
  txHash?: string;
}
