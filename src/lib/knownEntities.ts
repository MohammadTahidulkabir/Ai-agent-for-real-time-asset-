/**
 * Verified Known Entities & Registry for ClearSpend Agent Wallet
 * Replaces anonymous addresses with proper corporate, protocol, and threat entity names.
 */

export interface KnownEntity {
  address: string;
  name: string;
  tag: string;
  category: 'treasury' | 'defi' | 'infrastructure' | 'exploit' | 'sanctioned';
  isSafe: boolean;
  reputationScore: number; // 0 (malicious) to 100 (trusted)
  description: string;
}

export const KNOWN_ENTITIES: Record<string, KnownEntity> = {
  '0x2b47d9345244af369528f895c1af343831bb61f3': {
    address: '0x2b47D9345244Af369528f895c1aF343831bB61f3',
    name: 'ClearSpend Agent Vault (Self)',
    tag: 'Primary Agent Vault',
    category: 'treasury',
    isSafe: true,
    reputationScore: 100,
    description: 'Autonomous primary agent wallet managed with deterministic safety boundaries.',
  },
  '0x71c2b9f5189218671183181813f405a5129652a9': {
    address: '0x71C2B9f5189218671183181813F405A5129652a9',
    name: 'Alpha Operations Treasury',
    tag: 'Verified Vendor Treasury',
    category: 'treasury',
    isSafe: true,
    reputationScore: 98,
    description: 'Corporate liquidity partner and verified vendor treasury on Ethereum Sepolia.',
  },
  '0x4838b106fce9647bdf1e7877bf73ce8b0bad5f97': {
    address: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97',
    name: 'Uniswap V3 Settlement Gateway',
    tag: 'DEX Liquidity Router',
    category: 'defi',
    isSafe: true,
    reputationScore: 95,
    description: 'Canonical decentralized exchange settlement contract for automated swaps.',
  },
  '0x000000000022d473030f116ddee9f6b43ac78ba3': {
    address: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
    name: 'Permit2 Smart Contract Router',
    tag: 'Token Allowance Protocol',
    category: 'infrastructure',
    isSafe: true,
    reputationScore: 96,
    description: 'Next-generation signature-based token allowance contract by Uniswap Labs.',
  },
  '0x3333333333333333333333333333333333333333': {
    address: '0x3333333333333333333333333333333333333333',
    name: 'Flagged Phishing Exploit Contract',
    tag: 'CertiK Threat Alert #8821',
    category: 'exploit',
    isSafe: false,
    reputationScore: 0,
    description: 'Confirmed malicious wallet address associated with drainer exploits and phishing campaigns.',
  },
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045': {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    name: 'External Unregistered Multisig',
    tag: 'Restricted High-Value Vault',
    category: 'treasury',
    isSafe: false,
    reputationScore: 35,
    description: 'Third-party high-value address blocked from automated agent interaction without dual-signatory approval.',
  },
  '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc': {
    address: '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc',
    name: 'Sanctioned Privacy Mixer (Tornado Cash Pool)',
    tag: 'OFAC Sanctioned / Prohibited',
    category: 'sanctioned',
    isSafe: false,
    reputationScore: 0,
    description: 'Anonymizing mixer contract strictly prohibited by automated compliance policies.',
  },
};

export function getEntityByAddress(address?: string): KnownEntity | null {
  if (!address) return null;
  const normalized = address.toLowerCase().trim();
  return KNOWN_ENTITIES[normalized] || null;
}

export function getEntityDisplayName(address?: string, fallbackTruncate: boolean = true): string {
  if (!address) return 'Unknown Counterparty';
  const entity = getEntityByAddress(address);
  if (entity) return entity.name;
  return fallbackTruncate ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : address;
}
