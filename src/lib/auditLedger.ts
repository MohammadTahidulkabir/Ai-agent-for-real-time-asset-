/**
 * Tamper-Evident Cryptographic Audit Ledger
 * Every wallet event is chained with SHA-256 hashes to guarantee provenance and auditability.
 */

import { AuditEvent, AuditEventType } from '../types/wallet';
import { canonicalizeJson, simpleSha256Sync } from './crypto';

const INITIAL_GENESIS_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

class AuditLedger {
  private events: AuditEvent[] = [];
  private lastHash: string = INITIAL_GENESIS_HASH;

  constructor() {
    this.seedGenesis();
  }

  private seedGenesis() {
    const genesisTime = Date.now() - 7200000;
    const genesisDetails = { system: 'ClearSpend Agent Wallet Core', version: '1.0.0', network: 'Sepolia 11155111' };
    const hash = simpleSha256Sync(INITIAL_GENESIS_HASH + genesisTime + 'SYSTEM_INIT' + canonicalizeJson(genesisDetails));
    
    this.events.push({
      id: 'aud-genesis',
      timestamp: genesisTime,
      type: 'SETTINGS_UPDATED',
      actor: 'POLICY_ENGINE',
      action: 'Genesis Ledger Initialized with SHA-256 cryptographic hash-chain',
      details: genesisDetails,
      previousEventHash: INITIAL_GENESIS_HASH,
      eventHash: hash,
    });
    this.lastHash = hash;

    // Seed allowlist configuration
    const t1 = genesisTime + 120000;
    const allowlistDetails = {
      addedEntities: [
        { name: 'Alpha Operations Treasury', address: '0x71C2B9f5189218671183181813F405A5129652a9', role: 'Verified Vendor' },
        { name: 'Uniswap V3 Settlement Gateway', address: '0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97', role: 'DEX Router' },
      ],
    };
    const p1 = `${this.lastHash}|${t1}|SETTINGS_UPDATED|Configured verified vendor allowlist directory|${canonicalizeJson(allowlistDetails)}`;
    const h1 = simpleSha256Sync(p1);
    this.events.push({
      id: 'aud-seed-01',
      timestamp: t1,
      type: 'SETTINGS_UPDATED',
      actor: 'USER',
      action: 'Configured verified vendor allowlist directory (Alpha Operations Treasury, Uniswap Gateway)',
      details: allowlistDetails,
      previousEventHash: this.lastHash,
      eventHash: h1,
    });
    this.lastHash = h1;

    // Seed threat intelligence blocklist
    const t2 = genesisTime + 240000;
    const blocklistDetails = {
      blockedEntities: [
        { name: 'Flagged Phishing Exploit Contract', address: '0x3333333333333333333333333333333333333333', alert: 'CertiK Alert #8821' },
      ],
    };
    const p2 = `${this.lastHash}|${t2}|SECURITY_BREACH_BLOCKED|Threat intelligence blocklist synchronized: Gated malicious phishing address|${canonicalizeJson(blocklistDetails)}`;
    const h2 = simpleSha256Sync(p2);
    this.events.push({
      id: 'aud-seed-02',
      timestamp: t2,
      type: 'SECURITY_BREACH_BLOCKED',
      actor: 'POLICY_ENGINE',
      action: 'Threat intelligence blocklist synchronized: Gated malicious phishing contract (CertiK Alert #8821)',
      details: blocklistDetails,
      previousEventHash: this.lastHash,
      eventHash: h2,
    });
    this.lastHash = h2;
  }

  public recordEvent(
    type: AuditEventType,
    actor: 'USER' | 'AGENT' | 'POLICY_ENGINE' | 'BLOCKCHAIN',
    action: string,
    details: Record<string, unknown>,
    proposalId?: string
  ): AuditEvent {
    const timestamp = Date.now();
    const id = 'aud-' + Math.random().toString(36).substring(2, 9) + '-' + timestamp;
    
    // Hash chain linkage: currentHash = SHA256(lastHash + timestamp + type + action + canonicalJson(details))
    const payload = `${this.lastHash}|${timestamp}|${type}|${action}|${canonicalizeJson(details)}`;
    const eventHash = simpleSha256Sync(payload);

    const event: AuditEvent = {
      id,
      timestamp,
      type,
      proposalId,
      actor,
      action,
      details,
      previousEventHash: this.lastHash,
      eventHash,
    };

    this.events.push(event);
    this.lastHash = eventHash;
    return event;
  }

  public getEvents(): AuditEvent[] {
    return [...this.events].reverse(); // newest first
  }

  public verifyIntegrity(): { isValid: boolean; brokenAtEventId?: string; totalVerified: number } {
    let currentHash = INITIAL_GENESIS_HASH;

    for (const event of this.events) {
      if (event.previousEventHash !== currentHash) {
        return { isValid: false, brokenAtEventId: event.id, totalVerified: this.events.length };
      }
      const payload = `${event.previousEventHash}|${event.timestamp}|${event.type}|${event.action}|${canonicalizeJson(event.details)}`;
      const recalculated = simpleSha256Sync(payload);
      if (recalculated !== event.eventHash) {
        return { isValid: false, brokenAtEventId: event.id, totalVerified: this.events.length };
      }
      currentHash = event.eventHash;
    }

    return { isValid: true, totalVerified: this.events.length };
  }
}

export const auditLedger = new AuditLedger();
