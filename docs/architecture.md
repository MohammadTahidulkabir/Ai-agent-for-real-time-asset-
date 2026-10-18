# ClearSpend Architecture & Pipeline

## 1. High-Level Architecture Diagram

```
[ User Plain-English Input ]
            │
            ▼
   Intent Parser (Gemini AI + Schema)
   - Strict JSON Output Schema
   - Adversarial Injection Shield
   - Heuristic Fallback Engine
            │
            ▼
   Typed Transaction Proposal
   - Recipient (EVM Address)
   - Asset (native / USDC / DAI)
   - Amount (Decimal String)
   - Chain ID (Sepolia 11155111)
            │
            ▼
   Deterministic Policy Engine (The Security Authority)
   ├─ POL-00: Emergency Global Pause Switch
   ├─ POL-01: Approved Testnet Chain ID
   ├─ POL-02: Recipient Checksum & Syntax Validation
   ├─ POL-03: Exploit & Phishing Blocklist Scan
   ├─ POL-04: Trusted Asset Registry
   ├─ POL-05: Positive Decimal Precision
   ├─ POL-06: Balance + 0.0005 ETH Gas Buffer
   ├─ POL-07: Per-Transaction Cap (0.10 ETH)
   ├─ POL-08: Rolling 24h Daily Cap (0.50 ETH)
   └─ POL-09: Permission Passport Enforcement
            │
   ┌────────┴──────────────────────────┐
   ▼                                   ▼
Verdict: BLOCK + Rule IDs         Verdict: NEEDS_CONFIRMATION / ALLOW
(Aborts execution)                     │
                                       ▼
                  Canonical Proposal Hashing & User Authorization Gate
                  canonicalHash = SHA256(canonicalizeJson(payload))
                  - Single-use Nonce
                  - 60-Second TTL Expiration Timer
                  - User signs exact payload
                                       │
                                       ▼
                           Isolated Signing Boundary
                           - Private keys isolated from model and server logs
                           - Recomputes hash immediately before broadcast
                           - Transmits to approved EVM Testnet RPC
                                       │
                                       ▼
                   Receipt Monitor & Cryptographic Audit Ledger
                   - Tracks block mining & gas used
                   - Produces Etherscan link
                   - Chained into SHA-256 tamper-evident log
```

## 2. Key Modules & Separation of Concerns

1. **`src/types/wallet.ts`**: Unified typed schemas for intents, proposals, policy verdicts, and audit events.
2. **`src/lib/policyEngine.ts`**: Pure deterministic functions that evaluate invariants. Model confidence has ZERO impact on rule decisions.
3. **`src/lib/crypto.ts`**: Canonical deterministic JSON stringifier, SHA-256 calculation, and EVM address format verification.
4. **`src/lib/testnetAdapter.ts`**: Blockchain signing boundary that interfaces with Sepolia testnet RPC and validates proposal state before broadcast.
5. **`src/lib/auditLedger.ts`**: SHA-256 hash-chained log preserving cryptographic provenance for judges.
6. **`server.ts`**: Express backend providing server-side Gemini integration and state synchronization.
