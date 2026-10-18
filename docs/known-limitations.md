# ClearSpend Known Limitations & Roadmap

## Known Limitations of MVP Prototype

1. **EVM-Focused Prototype**:
   - Currently optimized for EVM testnets (Ethereum Sepolia, Base Sepolia, Holesky). Non-EVM chains (e.g. Solana, Bitcoin) require separate chain adapters.

2. **Native & Standard ERC-20 Support**:
   - Complex arbitrary multi-contract transactions (e.g., flash loans, nested DeFi routers) are out of scope for the student prototype and intentionally restricted by rule POL-04 to preserve security.

3. **Hardware Signer Integration**:
   - Uses an isolated software signing boundary and browser-based testnet wallet adapter. Hardware wallet (Ledger/Trezor) WebHID integration is designed for future production release.

## Future Engineering Roadmap

- **Phase 1 (Post-FinTechathon):** ERC-4337 Account Abstraction and Paymaster sponsorship for gasless transactions.
- **Phase 2:** Multi-agent consensus policy: requiring dual-agent agreement before dispatching proposals above 1 ETH.
- **Phase 3:** Automated smart contract formal verification simulation using Slither and Mythril pre-flight checks.
