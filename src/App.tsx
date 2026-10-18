/**
 * ClearSpend Agent Wallet
 * Autonomous On-chain Wallet Agent with Deterministic Policy Gating,
 * Tactical Panic Button, Autonomous Operations Engine, and Real-Time Risk Verification.
 * Cyberpunk Command Center Edition.
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, Header } from './components/Header';
import { SidebarNavigation } from './components/SidebarNavigation';
import { CyberBackground } from './components/CyberBackground';
import { DashboardView } from './components/DashboardView';
import { AutonomousAgentView } from './components/AutonomousAgentView';
import { AgentChatView } from './components/AgentChatView';
import { SecurityCenterView } from './components/SecurityCenterView';
import { AuditTrailView } from './components/AuditTrailView';
import { TestRunnerView } from './components/TestRunnerView';
import { TransactionPreviewModal } from './components/TransactionPreviewModal';
import { TransactionProposal, WalletState } from './types/wallet';
import { testnetAdapter } from './lib/testnetAdapter';
import { auditLedger } from './lib/auditLedger';
import { ShieldCheck, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

const INITIAL_WALLET_STATE: WalletState = {
  address: '0x2b47D9345244Af369528f895c1aF343831bB61f3',
  network: {
    id: 11155111,
    name: 'Ethereum Sepolia Testnet',
    nativeSymbol: 'ETH',
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    isTestnet: true,
  },
  balances: {
    native: '1.450',
    nativeUsd: 3625.00,
    tokens: [
      { symbol: 'USDC', name: 'USD Coin (Testnet)', address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6, balance: '520.00', balanceUsd: 520.00 },
      { symbol: 'DAI', name: 'Dai Stablecoin (Testnet)', address: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357', decimals: 18, balance: '250.00', balanceUsd: 250.00 },
      { symbol: 'WETH', name: 'Wrapped Ether (Testnet)', address: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9', decimals: 18, balance: '0.500', balanceUsd: 1250.00 },
    ],
  },
  permissionTier: 'TIER_2_CONFIRMED_EXECUTION',
  spendingLimits: {
    perTransactionCapEth: 0.10,
    dailyCapEth: 0.50,
    spentTodayEth: 0.042,
  },
  isEmergencyPaused: false,
  allowlist: [
    '0x71C2B9f5189218671183181813F405A5129652a9', // Alpha Operations Treasury (Verified Vendor)
    '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97', // Uniswap V3 Settlement Gateway
    '0x2b47D9345244Af369528f895c1aF343831bB61f3', // ClearSpend Agent Vault (Self)
  ],
  blocklist: [
    '0x3333333333333333333333333333333333333333', // Flagged Phishing Exploit Contract (CertiK Alert #8821)
    '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // External Unregistered Multisig (Restricted)
    '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc', // Sanctioned Privacy Mixer (Tornado Cash Pool)
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [wallet, setWallet] = useState<WalletState>(INITIAL_WALLET_STATE);
  const [activePreviewProposal, setActivePreviewProposal] = useState<TransactionProposal | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    txHash?: string;
  } | null>(null);

  // Sync state from server on startup
  useEffect(() => {
    fetch('/api/wallet/state')
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          setWallet(prev => ({
            ...prev,
            ...data,
          }));
        }
      })
      .catch(err => {
        console.warn('Initial state fetch fallback to local:', err);
      });
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string, txHash?: string) => {
    setToastNotification({ type, message, txHash });
    setTimeout(() => {
      setToastNotification(null);
    }, 6000);
  };

  const handleUpdateWalletConfig = (updated: Partial<WalletState>) => {
    setWallet(prev => {
      const next = { ...prev, ...updated };
      // Sync to server
      fetch('/api/wallet/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(err => console.warn('Failed to sync config to server:', err));
      return next;
    });
  };

  const handleTogglePanic = () => {
    const nextState = !wallet.isEmergencyPaused;
    handleUpdateWalletConfig({ isEmergencyPaused: nextState });
    auditLedger.recordEvent(
      'EMERGENCY_PAUSE_TOGGLED',
      'USER',
      `Panic switch triggered: ${nextState ? 'HALT ENGAGED (POL-00)' : 'DISARMED'}`,
      { isEmergencyPaused: nextState, rule: 'POL-00' }
    );
    showToast(
      nextState ? 'error' : 'success',
      nextState
        ? 'EMERGENCY HALT ARMED! All outgoing transactions and autonomous operations are now blocked (Rule POL-00).'
        : 'Emergency Pause Disarmed. Normal operations resumed.'
    );
  };

  const handleAuthorizeProposal = async (proposal: TransactionProposal) => {
    if (wallet.isEmergencyPaused) {
      showToast('error', 'Cannot authorize: Emergency Pause is active (Rule POL-00).');
      return;
    }

    setIsExecuting(true);
    try {
      // Record approval event in audit log
      auditLedger.recordEvent(
        'PROPOSAL_APPROVED',
        'USER',
        `User confirmed and authorized proposal hash ${proposal.canonicalHash}`,
        { proposalId: proposal.proposalId, canonicalHash: proposal.canonicalHash },
        proposal.proposalId
      );

      // Execute through signing boundary
      const executionResult = await testnetAdapter.broadcastApprovedProposal(
        { ...proposal, status: 'APPROVED' },
        wallet
      );

      // Deduct balance and update spentTodayEth
      const transferAmount = parseFloat(proposal.amount);
      const feeAmount = parseFloat(proposal.estimatedFeeEth);
      const totalDeducted = transferAmount + feeAmount;
      const nextNative = Math.max(0, parseFloat(wallet.balances.native) - totalDeducted).toFixed(4);
      const nextSpentToday = wallet.spendingLimits.spentTodayEth + transferAmount;

      setWallet(prev => ({
        ...prev,
        balances: {
          ...prev.balances,
          native: nextNative,
          nativeUsd: parseFloat(nextNative) * 2500,
        },
        spendingLimits: {
          ...prev.spendingLimits,
          spentTodayEth: nextSpentToday,
        },
      }));

      setActivePreviewProposal(null);
      showToast(
        'success',
        `Transaction confirmed on Sepolia in block #${executionResult.blockNumber}!`,
        executionResult.txHash
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      auditLedger.recordEvent(
        'SECURITY_BREACH_BLOCKED',
        'POLICY_ENGINE',
        `Execution aborted: ${msg}`,
        { proposalId: proposal.proposalId, error: msg },
        proposal.proposalId
      );
      showToast('error', `Execution failed: ${msg}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRejectProposal = (proposal: TransactionProposal, reason: string) => {
    auditLedger.recordEvent(
      'PROPOSAL_REJECTED',
      'USER',
      `Proposal ${proposal.proposalId} rejected by user (${reason})`,
      { proposalId: proposal.proposalId, reason },
      proposal.proposalId
    );
    setActivePreviewProposal(null);
    showToast('info', `Proposal authorization cancelled.`);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      {/* 1. Cyber Ambient Canvas Grid Layer */}
      <CyberBackground />

      {/* 2. Left Collapsible Command Dock */}
      <SidebarNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        walletAddress={wallet.address}
        networkName={wallet.network.name}
        isPaused={wallet.isEmergencyPaused}
        onTogglePanic={handleTogglePanic}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />

      {/* 3. Main Command Center Viewport Container */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out relative z-10 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-72'
        }`}
      >
        {/* Top Contextual Bar */}
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          walletAddress={wallet.address}
          networkName={wallet.network.name}
          permissionTier={wallet.permissionTier}
          isPaused={wallet.isEmergencyPaused}
          onOpenPassport={() => setActiveTab('security')}
          onTogglePanic={handleTogglePanic}
        />

        {/* Dynamic Viewport Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              wallet={wallet}
              onNavigateTab={setActiveTab}
              onTriggerQuickSend={(prompt) => setInitialPrompt(prompt)}
            />
          )}

          {activeTab === 'autonomous' && (
            <AutonomousAgentView
              wallet={wallet}
              onUpdateWalletConfig={handleUpdateWalletConfig}
              onNavigateTab={setActiveTab}
              showToast={showToast}
            />
          )}

          {activeTab === 'chat' && (
            <AgentChatView
              wallet={wallet}
              initialPrompt={initialPrompt}
              onClearInitialPrompt={() => setInitialPrompt(undefined)}
              onOpenPreview={(proposal) => setActivePreviewProposal(proposal)}
            />
          )}

          {activeTab === 'security' && (
            <SecurityCenterView
              wallet={wallet}
              onUpdateWalletConfig={handleUpdateWalletConfig}
              showToast={showToast}
            />
          )}

          {activeTab === 'audit' && (
            <AuditTrailView />
          )}

          {activeTab === 'tests' && (
            <TestRunnerView wallet={wallet} />
          )}
        </main>
      </div>

      {/* Global Cyber Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 max-w-md ${
            toastNotification.type === 'success'
              ? 'bg-[#05141f]/95 border-emerald-500/80 text-emerald-200 shadow-emerald-950/50'
              : toastNotification.type === 'error'
              ? 'bg-[#18050e]/95 border-rose-500/80 text-rose-200 shadow-rose-950/50'
              : 'bg-[#060c1d]/95 border-cyan-500/50 text-cyan-200 shadow-cyan-950/50'
          }`}>
            {toastNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toastNotification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <span className="font-semibold block">{toastNotification.message}</span>
              {toastNotification.txHash && (
                <a
                  href={`${wallet.network.explorerUrl}/tx/${toastNotification.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 text-cyan-400 underline font-mono flex items-center gap-1 hover:text-cyan-300"
                >
                  <span>View on Sepolia Etherscan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Transaction Preview Signing Gate */}
      <TransactionPreviewModal
        proposal={activePreviewProposal}
        wallet={wallet}
        onAuthorize={handleAuthorizeProposal}
        onReject={handleRejectProposal}
        onClose={() => setActivePreviewProposal(null)}
        isExecuting={isExecuting}
      />
    </div>
  );
}
