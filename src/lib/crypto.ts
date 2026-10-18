/**
 * Cryptographic and formatting utilities for ClearSpend Agent Wallet
 * Ensures canonical proposal hashing, tamper detection, and address verification.
 */

import { ethers } from 'ethers';

/**
 * Standardizes a proposal payload into canonical deterministic JSON
 * Keys are strictly sorted so that the resulting string is reproducible across client and server.
 */
export function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  const items = keys.map(key => {
    const val = (obj as Record<string, unknown>)[key];
    return JSON.stringify(key) + ':' + canonicalizeJson(val);
  });
  return '{' + items.join(',') + '}';
}

/**
 * Computes SHA-256 hash string (hex format)
 */
export async function sha256Hex(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Synchronous fallback hash for deterministic local simulations
 */
export function simpleSha256Sync(str: string): string {
  // Use ethers keccak256 or sha256
  try {
    return ethers.keccak256(ethers.toUtf8Bytes(str));
  } catch {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
  }
}

/**
 * Validates if a string is a valid EVM address format
 */
export function isValidEvmAddress(address: string | undefined): boolean {
  if (!address) return false;
  try {
    return ethers.isAddress(address);
  } catch {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

/**
 * Truncates an address for display: 0x1234...5678
 */
export function truncateAddress(address: string, lead = 6, tail = 4): string {
  if (!address || address.length < lead + tail) return address || '';
  return `${address.substring(0, lead)}...${address.substring(address.length - tail)}`;
}

/**
 * Truncates a tx hash for display: 0xabcd...1234
 */
export function truncateHash(hash: string, lead = 10, tail = 8): string {
  if (!hash || hash.length < lead + tail) return hash || '';
  return `${hash.substring(0, lead)}...${hash.substring(hash.length - tail)}`;
}

/**
 * Formats token or ether amount with sensible precision
 */
export function formatAmount(val: string | number, maxDecimals = 4): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  });
}
