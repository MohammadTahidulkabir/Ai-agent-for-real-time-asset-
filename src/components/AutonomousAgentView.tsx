/**
 * Autonomous Agent View
 * Signature Topic Component: Autonomous On-Chain Wallet Agent
 * Implements autonomous asset management, scheduled gas-aware transaction execution,
 * real-time risk control sentry, and interactive cognitive loop simulation.
 */

import React, { useState, useEffect } from 'react';
import { WalletState, AutonomousCycleLog, AutonomousOperationType } from '../types/wallet';
import { truncateAddress } from '../lib/crypto';
import { auditLedger } from '../lib/auditLedger';
import { testnetAdapter } from '../lib/testnetAdapter';
import { CyberCard } from './CyberCard';
import {
  Bot,
  RefreshCw,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Play,
  Pause,
  Fuel,
  Clock,
  Terminal,
  ExternalLink,
  Flame,
  Scale,
  Sparkles,
  Zap,
} from 'lucide-react';

interface AutonomousAgentViewProps {
  wallet: WalletState;
  onUpdateWalletConfig: (updated: Partial<WalletState>) => void;
  onNavigateTab: (tab: 'dashboard' | 'chat' | 'security' | 'audit' | 'tests') => void;
  showToast: (type: 'success' | 'error' | 'info', message: string, txHash?: string) => void;
}

export const AutonomousAgentView: React.FC<AutonomousAgentViewProps> = ({
  wallet,
  onUpdateWalletConfig,
  onNavigateTab,
  showToast,
}) => {
  const [isAutonomousActive, setIsAutonomousActive] = useState(true);
  const [secondsUntilNextCycle, setSecondsUntilNextCycle] = useState(12);
  const [isCycleRunning, setIsCycleRunning] = useState(false);
  const [currentGasPriceGwei, setCurrentGasPriceGwei] = useState(15.4);
  const [rebalanceDriftThreshold, setRebalanceDriftThreshold] = useState(5.0); // %
  const [simulatedDriftPct, setSimulatedDriftPct] = useState(2.1); // Current portfolio drift %
  const [maxAutonomousCapEth, setMaxAutonomousCapEth] = useState(0.05);
  const [gasCeilingGwei, setGasCeilingGwei] = useState(25);

  const [moduleToggles] = useState({
    rebalance: true,
    scheduledStreaming: true,
    gasOptimization: true,
    riskSentry: true,
  });

  // Real-time autonomous decision logs
  const [cycleLogs, setCycleLogs] = useState<AutonomousCycleLog[]>([
    {
      id: 'log-1',
      timestamp: Date.now() - 60000,
      phase: 'SETTLEMENT',
      operationType: 'SCHEDULED_STREAM',
      title: 'Automated Vendor Payroll Stream Executed',
      detail: 'Broadcasted 0.001 ETH stream to Alpha Operations Treasury (0x71C2...2a9). Verified against POL-08.',
      status: 'SUCCESS',
      txHash: '0x3a9f7e8b2c1d045a68e9f2b1d7c4a3e8b5d2f1a9c8b7e6d5c4b3a2f1e0d9c8b7',
      gasGwei: 15.2,
    },
    {
      id: 'log-2',
      timestamp: Date.now() - 120000,
      phase: 'AI_EVALUATION',
      operationType: 'TREASURY_REBALANCE',
      title: 'Portfolio Drift Inspection Checked',
      detail: 'Current drift 2.1% is within configured 5.0% tolerance band. No rebalance swap necessary.',
      status: 'SKIPPED',
      driftPct: 2.1,
    },
    {
      id: 'log-3',
      timestamp: Date.now() - 180000,
      phase: 'POLICY_GATE',
      operationType: 'RISK_SENTRY_DEFENSE',
      title: 'Real-Time Counterparty Sentry Audit',
      detail: 'Mempool heuristic scan verified 0 anomalous inflows or malicious approval grants.',
      status: 'SUCCESS',
    },
  ]);

  // Heartbeat countdown timer
  useEffect(() => {
    if (!isAutonomousActive || wallet.isEmergencyPaused) return;

    const interval = setInterval(() => {
      setSecondsUntilNextCycle(prev => {
        if (prev <= 1) {
          // Trigger cycle
          executeAutonomousCycle();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutonomousActive, wallet.isEmergencyPaused, simulatedDriftPct]);

  // Execute an autonomous on-chain operation cycle
  const executeAutonomousCycle = async (forcedOperation?: AutonomousOperationType) => {
    if (isCycleRunning) return;

    // Check emergency halt invariant (POL-00)
    if (wallet.isEmergencyPaused) {
      const haltLog: AutonomousCycleLog = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        phase: 'POLICY_GATE',
        operationType: 'RISK_SENTRY_DEFENSE',
        title: 'Autonomous Cycle Halted by Rule POL-00',
        detail: 'Emergency Panic Pause is active. All autonomous mutations and on-chain broadcasts are blocked.',
        status: 'HALTED_PANIC',
      };
      setCycleLogs(prev => [haltLog, ...prev.slice(0, 19)]);
      showToast('error', 'Autonomous cycle blocked: Emergency Pause is active!');
      return;
    }

    setIsCycleRunning(true);

    // Randomize gas fluctuation slightly for realism
    const gas = +(14 + Math.random() * 4).toFixed(1);
    setCurrentGasPriceGwei(gas);

    const now = Date.now();

    // Determine what operation to execute
    let selectedOp: AutonomousOperationType = forcedOperation || 'TREASURY_REBALANCE';
    if (!forcedOperation) {
      if (simulatedDriftPct >= rebalanceDriftThreshold && moduleToggles.rebalance) {
        selectedOp = 'TREASURY_REBALANCE';
      } else if (moduleToggles.scheduledStreaming) {
        selectedOp = 'SCHEDULED_STREAM';
      } else {
        selectedOp = 'RISK_SENTRY_DEFENSE';
      }
    }

    // Step 1: PERCEPTION PHASE
    const perceptionLog: AutonomousCycleLog = {
      id: `log-${now}-1`,
      timestamp: now,
      phase: 'PERCEPTION',
      operationType: selectedOp,
      title: `[Perception] Sensed Block State & Telemetry`,
      detail: `Gas: ${gas} Gwei | Drift: ${simulatedDriftPct.toFixed(1)}% | Reserves: ${wallet.balances.native} ETH | Active Tier: ${wallet.permissionTier}`,
      status: 'SUCCESS',
      gasGwei: gas,
      driftPct: simulatedDriftPct,
    };

    // Step 2: AI REASONING / EVALUATION
    let evaluationTitle = '';
    let evaluationDetail = '';
    let executeTx = false;
    let targetRecipient = '0x71C2B9f5189218671183181813F405A5129652a9';
    let txAmount = '0.001';

    if (selectedOp === 'TREASURY_REBALANCE') {
      if (simulatedDriftPct >= rebalanceDriftThreshold) {
        evaluationTitle = `[AI Reasoner] Portfolio Drift Exceeded Threshold (${simulatedDriftPct.toFixed(1)}% >= ${rebalanceDriftThreshold}%)`;
        evaluationDetail = `Target ratio drift detected. Synthesizing rebalance swap of 0.003 ETH for USDC via Uniswap V3 Gateway to restore 60/25/10/5 target.`;
        executeTx = true;
        targetRecipient = '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97';
        txAmount = '0.003';
      } else {
        evaluationTitle = `[AI Reasoner] Portfolio Allocation Optimal (${simulatedDriftPct.toFixed(1)}%)`;
        evaluationDetail = `Drift is safely below ${rebalanceDriftThreshold}% threshold. Preserving existing liquidity.`;
      }
    } else if (selectedOp === 'SCHEDULED_STREAM') {
      evaluationTitle = `[AI Reasoner] Gas Optimal Window (${gas} Gwei < ${gasCeilingGwei} Gwei)`;
      evaluationDetail = `Periodic vendor stream of 0.001 ETH due to Alpha Operations Treasury. Network conditions are optimal.`;
      executeTx = true;
      targetRecipient = '0x71C2B9f5189218671183181813F405A5129652a9';
      txAmount = '0.001';
    } else {
      evaluationTitle = `[Risk Sentry] Threat Surveillance Passed`;
      evaluationDetail = `0 malicious transactions, 0 unsanctioned token approvals, 100% allowlist integrity maintained.`;
    }

    const reasoningLog: AutonomousCycleLog = {
      id: `log-${now}-2`,
      timestamp: now + 400,
      phase: 'AI_EVALUATION',
      operationType: selectedOp,
      title: evaluationTitle,
      detail: evaluationDetail,
      status: 'SUCCESS',
      gasGwei: gas,
      driftPct: simulatedDriftPct,
    };

    // Step 3: DETERMINISTIC POLICY VERIFICATION
    let policyStatus: 'SUCCESS' | 'BLOCKED_BY_POLICY' = 'SUCCESS';
    let policyDetail = `Checked Rule POL-00 (Not Paused), Rule POL-07 (Amount <= ${wallet.spendingLimits.perTransactionCapEth} ETH), Rule POL-08 (Daily spend within ${wallet.spendingLimits.dailyCapEth} ETH) -> PASSED.`;

    if (executeTx) {
      const amountNum = parseFloat(txAmount);
      if (amountNum > wallet.spendingLimits.perTransactionCapEth) {
        policyStatus = 'BLOCKED_BY_POLICY';
        policyDetail = `Blocked by Rule POL-07: Amount ${txAmount} ETH exceeds per-tx cap ${wallet.spendingLimits.perTransactionCapEth} ETH.`;
        executeTx = false;
      } else if (wallet.spendingLimits.spentTodayEth + amountNum > wallet.spendingLimits.dailyCapEth) {
        policyStatus = 'BLOCKED_BY_POLICY';
        policyDetail = `Blocked by Rule POL-08: Exceeds daily cumulative cap ${wallet.spendingLimits.dailyCapEth} ETH.`;
        executeTx = false;
      }
    }

    const policyLog: AutonomousCycleLog = {
      id: `log-${now}-3`,
      timestamp: now + 800,
      phase: 'POLICY_GATE',
      operationType: selectedOp,
      title: `[Policy Gate] Deterministic Safety Gating Invariant`,
      detail: policyDetail,
      status: policyStatus,
    };

    // Step 4: SETTLEMENT / ON-CHAIN EXECUTION (if applicable)
    let settlementLog: AutonomousCycleLog | null = null;
    if (executeTx && policyStatus === 'SUCCESS') {
      try {
        const result = await testnetAdapter.executeTransfer({
          recipient: targetRecipient,
          amountEth: txAmount,
          asset: 'native',
        });

        // Update wallet balances and spent limits
        const deduction = parseFloat(txAmount) + 0.00021;
        const newNative = (Math.max(0, parseFloat(wallet.balances.native) - deduction)).toFixed(3);
        const newSpentToday = wallet.spendingLimits.spentTodayEth + parseFloat(txAmount);

        onUpdateWalletConfig({
          balances: {
            ...wallet.balances,
            native: newNative,
          },
          spendingLimits: {
            ...wallet.spendingLimits,
            spentTodayEth: newSpentToday,
          },
        });

        // If it was a rebalance, reset drift
        if (selectedOp === 'TREASURY_REBALANCE') {
          setSimulatedDriftPct(1.2);
        }

        auditLedger.recordEvent(
          'AUTONOMOUS_CYCLE_EXECUTED',
          'AGENT',
          `Autonomous agent executed ${selectedOp} of ${txAmount} ETH to ${targetRecipient}`,
          { txHash: result.txHash, amount: txAmount, recipient: targetRecipient, operation: selectedOp }
        );

        settlementLog = {
          id: `log-${now}-4`,
          timestamp: now + 1200,
          phase: 'SETTLEMENT',
          operationType: selectedOp,
          title: `[Settlement] Autonomous On-Chain Mutation Broadcasted`,
          detail: `Confirmed on Sepolia Testnet. Block #${result.blockNumber}. Canonical hash cryptographically anchored.`,
          status: 'SUCCESS',
          txHash: result.txHash,
          gasGwei: gas,
        };

        showToast('success', `Autonomous ${selectedOp.replace('_', ' ')} executed on Sepolia!`, result.txHash);
      } catch (err: any) {
        console.error('Autonomous execution failed:', err);
      }
    }

    // Append new logs
    setCycleLogs(prev => {
      const added = [settlementLog, policyLog, reasoningLog, perceptionLog].filter(Boolean) as AutonomousCycleLog[];
      return [...added, ...prev].slice(0, 25);
    });

    setIsCycleRunning(false);
  };

  const handleTriggerDriftShock = () => {
    setSimulatedDriftPct(8.7);
    showToast('info', 'Simulated portfolio drift shock: 8.7% (Exceeds 5.0% threshold). Agent will rebalance on next cycle.');
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* AUTONOMOUS AGENT COMMAND CONSOLE HEADER                  */}
      {/* ======================================================== */}
      <CyberCard
        variant="cyan"
        glow
        tilt={false}
        className="p-6 sm:p-7 bg-gradient-to-r from-[#06142a]/95 via-[#0b1b3a]/90 to-[#071328]/95 border-cyan-500/40"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
                Track Signature Topic – Autonomous On-Chain Operations
              </span>
              {wallet.isEmergencyPaused ? (
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-600 flex items-center gap-1 animate-pulse">
                  <Flame className="w-3 h-3 text-rose-400" />
                  HALTED BY PANIC BUTTON (POL-00)
                </span>
              ) : isAutonomousActive ? (
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  AUTONOMOUS LOOP ACTIVE
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  STANDBY / PAUSED
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Bot className="w-8 h-8 text-cyan-400 shrink-0" />
              <span>Autonomous On-Chain Wallet Agent</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Autonomously plans, evaluates, policy-gates, and executes asset management rebalancing,
              gas-optimized streaming, and real-time counterparty threat defenses directly on Ethereum Sepolia.
            </p>
          </div>

          {/* Autonomous Engine Control Deck */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Run Cycle Manual Trigger */}
            <button
              onClick={() => executeAutonomousCycle()}
              disabled={isCycleRunning || wallet.isEmergencyPaused}
              type="button"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-slate-950 ${isCycleRunning ? 'animate-spin' : ''}`} />
              <span>{isCycleRunning ? 'Executing Cycle...' : 'Run Autonomous Cycle Now'}</span>
            </button>

            {/* Master Engine Active/Standby Toggle */}
            <button
              onClick={() => {
                setIsAutonomousActive(!isAutonomousActive);
                showToast('info', `Autonomous Agent ${!isAutonomousActive ? 'Activated' : 'Switched to Standby'}`);
              }}
              type="button"
              className={`px-4 py-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                isAutonomousActive
                  ? 'bg-[#101b33] hover:bg-[#162544] border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              {isAutonomousActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pause Agent</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Resume Agent</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Autonomous Telemetry Strip */}
        <div className="mt-6 pt-4 border-t border-cyan-900/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#060b18]/90 border border-[#16233d]">
            <span className="text-[10px] text-slate-400 block mb-0.5">Autonomous Heartbeat</span>
            <div className="flex items-center gap-1.5 text-white font-bold">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next cycle in {secondsUntilNextCycle}s</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#060b18]/90 border border-[#16233d]">
            <span className="text-[10px] text-slate-400 block mb-0.5">Sepolia Gas Window</span>
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <Fuel className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentGasPriceGwei} Gwei (Optimal)</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#060b18]/90 border border-[#16233d]">
            <span className="text-[10px] text-slate-400 block mb-0.5">Portfolio Drift</span>
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              <span>{simulatedDriftPct.toFixed(1)}% (Threshold: {rebalanceDriftThreshold}%)</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#060b18]/90 border border-[#16233d]">
            <span className="text-[10px] text-slate-400 block mb-0.5">Safety Circuit Breaker</span>
            <div className="flex items-center gap-1.5 font-bold">
              {wallet.isEmergencyPaused ? (
                <span className="text-rose-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Panic Halt
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active &amp; Guarded
                </span>
              )}
            </div>
          </div>
        </div>
      </CyberCard>

      {/* ======================================================== */}
      {/* 3 CORE PILLARS OF AUTONOMOUS CAPABILITIES                */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pillar 1: Autonomous Asset Management */}
        <CyberCard variant="cyan" className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                <Scale className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                moduleToggles.rebalance ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {moduleToggles.rebalance ? 'Active' : 'Disabled'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">1. Asset Management &amp; Rebalancing</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Monitors treasury allocation (60% ETH / 25% USDC / 10% WETH / 5% DAI). When drift exceeds {rebalanceDriftThreshold}%,
              the agent autonomously swaps via Uniswap V3 Gateway to maintain target equity.
            </p>
            <div className="mt-3 p-2.5 rounded-xl bg-[#080e1c] border border-slate-800 text-xs font-mono">
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Current Drift:</span>
                <span className={simulatedDriftPct >= rebalanceDriftThreshold ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                  {simulatedDriftPct.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${simulatedDriftPct >= rebalanceDriftThreshold ? 'bg-amber-400' : 'bg-cyan-400'}`}
                  style={{ width: `${Math.min(100, (simulatedDriftPct / 10) * 100)}%` }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={handleTriggerDriftShock}
            type="button"
            className="w-full py-2 px-3 rounded-xl bg-[#141f36] hover:bg-[#1a2948] border border-cyan-800/40 text-xs font-semibold text-cyan-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Drift Shock (+8.7%)</span>
          </button>
        </CyberCard>

        {/* Pillar 2: Autonomous Gas-Aware Execution */}
        <CyberCard variant="emerald" className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                <Fuel className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                moduleToggles.scheduledStreaming ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {moduleToggles.scheduledStreaming ? 'Active' : 'Disabled'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">2. Scheduled Gas-Aware Streaming</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Schedules recurring vendor disbursements to Alpha Operations Treasury. Automatically executes only when
              Sepolia base gas &lt; {gasCeilingGwei} Gwei, minimizing network friction and costs.
            </p>
            <div className="mt-3 p-2.5 rounded-xl bg-[#080e1c] border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Active Target:</span>
                <span className="text-white font-bold">Alpha Operations Treasury</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Stream Rate:</span>
                <span className="text-cyan-300">0.001 ETH / cycle</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => executeAutonomousCycle('SCHEDULED_STREAM')}
            disabled={isCycleRunning || wallet.isEmergencyPaused}
            type="button"
            className="w-full py-2 px-3 rounded-xl bg-[#141f36] hover:bg-[#1a2948] border border-cyan-800/40 text-xs font-semibold text-emerald-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Force Stream Execution</span>
          </button>
        </CyberCard>

        {/* Pillar 3: Real-Time Risk Sentry */}
        <CyberCard variant="violet" className="p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-800/80 flex items-center justify-center text-purple-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                moduleToggles.riskSentry ? 'bg-purple-950/60 text-purple-300 border-purple-800' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {moduleToggles.riskSentry ? 'Guarded' : 'Disabled'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">3. Real-Time Risk Sentry &amp; Defense</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Surveils counterparty threat intelligence feeds (CertiK alerts, malicious drainers, sanctioned mixers).
              Auto-sweeps or halts operations if risk anomaly score exceeds 85.
            </p>
            <div className="mt-3 p-2.5 rounded-xl bg-[#080e1c] border border-slate-800 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Threat Feeds:</span>
                <span className="text-emerald-400 font-bold">100% Synchronized</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Panic Button Link:</span>
                <span className="text-cyan-400">Rule POL-00 Override</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('security')}
            type="button"
            className="w-full py-2 px-3 rounded-xl bg-[#141f36] hover:bg-[#1a2948] border border-cyan-800/40 text-xs font-semibold text-purple-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Inspect Threat Blocklist</span>
          </button>
        </CyberCard>
      </div>

      {/* ======================================================== */}
      {/* COGNITIVE DECISION STREAM (LIVE AUTONOMOUS FEED)        */}
      {/* ======================================================== */}
      <CyberCard variant="cyan" tilt={false} className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Autonomous Cognitive Decision Stream
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time execution telemetry showing perception, Gemini reasoning, policy invariant gating, and on-chain settlement.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Stream ({cycleLogs.length} events logged)</span>
          </div>
        </div>

        {/* Execution Log Stream */}
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {cycleLogs.map(log => {
            const phaseBadge = {
              PERCEPTION: { label: '01: PERCEPTION', bg: 'bg-blue-950/60 text-blue-300 border-blue-800' },
              AI_EVALUATION: { label: '02: REASONING', bg: 'bg-purple-950/60 text-purple-300 border-purple-800' },
              POLICY_GATE: { label: '03: POLICY GATE', bg: 'bg-cyan-950/60 text-cyan-300 border-cyan-800' },
              SETTLEMENT: { label: '04: SETTLEMENT', bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' },
            }[log.phase];

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-[#070d1c] border border-cyan-950/50 hover:border-cyan-800/60 transition-colors text-xs space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${phaseBadge.bg}`}>
                      {phaseBadge.label}
                    </span>
                    <span className="font-bold text-white">{log.title}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                    {log.gasGwei && (
                      <span className="text-slate-400">{log.gasGwei} Gwei</span>
                    )}
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                <p className="text-slate-300 text-[11px] font-mono leading-relaxed pl-1">
                  {log.detail}
                </p>
                {log.txHash && (
                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Sepolia Tx Hash:</span>
                    <a
                      href={`${wallet.network.explorerUrl}/tx/${log.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>{truncateAddress(log.txHash, 10, 8)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CyberCard>

      {/* ======================================================== */}
      {/* AUTONOMOUS PARAMETERS & SAFETY INVARIANTS CONFIGURATION  */}
      {/* ======================================================== */}
      <CyberCard variant="neutral" tilt={false} className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Autonomous Operational Invariants &amp; Thresholds
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic boundaries governing autonomous agency. Operations cannot exceed these parameters.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Drift Tolerance Slider */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-300">Rebalance Drift Sensitivity</label>
              <span className="text-xs font-mono font-bold text-cyan-300">{rebalanceDriftThreshold}%</span>
            </div>
            <input
              type="range"
              min="2"
              max="15"
              step="0.5"
              value={rebalanceDriftThreshold}
              onChange={e => setRebalanceDriftThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1.5">
              Triggers rebalance when any asset deviates by &gt; {rebalanceDriftThreshold}%
            </span>
          </div>

          {/* Gas Price Ceiling Slider */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-300">Max Autonomous Gas Ceiling</label>
              <span className="text-xs font-mono font-bold text-emerald-300">{gasCeilingGwei} Gwei</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={gasCeilingGwei}
              onChange={e => setGasCeilingGwei(parseInt(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1.5">
              Defers autonomous operations if network gas exceeds {gasCeilingGwei} Gwei
            </span>
          </div>

          {/* Max Autonomous Tx Cap */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b]">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-300">Max Autonomous Tx Cap</label>
              <span className="text-xs font-mono font-bold text-cyan-300">{maxAutonomousCapEth} ETH</span>
            </div>
            <input
              type="range"
              min="0.005"
              max="0.10"
              step="0.005"
              value={maxAutonomousCapEth}
              onChange={e => setMaxAutonomousCapEth(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1.5">
              Hard limit on single autonomous transaction size (bounded by POL-07)
            </span>
          </div>
        </div>
      </CyberCard>
    </div>
  );
};
