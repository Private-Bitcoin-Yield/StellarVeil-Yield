# Threat Model & Security Architecture: Stellar-VeilYield

This document defines the formal threat model, security invariants, cryptographic assumptions, and residual risks for **Stellar-VeilYield**.

---

## 1. System Overview & Assets

Stellar-VeilYield enables privacy-preserving yield generation on Stellar Testnet for a simulated Bitcoin-pegged asset (`tBTC`).

### Assets Protected
1. **User Principal & Yield**: `tBTC` tokens deposited into the shielded vault.
2. **Note Secrets & Anonymity**: `(secret, nullifier_secret)` pairs held client-side.
3. **Anonymity Set Integrity**: The unlinkability between depositor address and withdrawal recipient.
4. **Attestation Integrity**: Authenticity of zero-knowledge yield threshold attestations without revealing balances.

---

## 2. Threat Actors & Capabilities

| Actor | Trust Level | Capabilities / Vector | Mitigations |
| :--- | :--- | :--- | :--- |
| **Mev / Front-Runner** | Untrusted | Observes mempool/RPC; attempts to copy withdrawal proof and substitute own recipient. | **Recipient Binding**: The recipient address is hashed into the R1CS public inputs. A proof cannot verify for any recipient other than the bound address. |
| **Double Spender** | Untrusted | Submits the same withdrawal proof or note nullifier multiple times. | **Persistent Nullifier Registry**: Nullifiers are checked and marked spent *before* external token transfers using the Checks-Effects-Interactions pattern. |
| **Malicious Depositor** | Untrusted | Attempts non-standard denominations, malicious calldata, or corrupt commitments. | **Strict Denomination Whitelist**: Vault accepts only 0.01, 0.1, and 1.0 tBTC. Proof verifier rejects invalid field elements. |
| **Rogue Relayer** | Semi-trusted | Relays transactions to pay gas for recipients; sees raw public proofs and inputs. | Note secrets never touch relayer. Relayer cannot divert funds because recipient address is bound in the Groth16 proof. |
| **Corrupt Admin** | Privileged | Controls pause switch and Merkle root updates. | Can pause deposits/withdrawals, but cannot forge Groth16 proofs or steal funds without cryptographic keys. Transition path to Timelock/Multisig. |

---

## 3. Cryptographic Invariants & Defenses

### Invariant 1: Checks-Effects-Interactions
In `VaultContract::withdraw`:
1. Check Merkle root is in `KnownRoot` set.
2. Check `nullifier_hash` is unspent.
3. **Effect**: Record `nullifier_hash` as spent immediately.
4. **Interaction**: Verify Groth16 proof via Verifier contract, calculate yield, pull from strategy, and transfer tokens to `recipient`.

### Invariant 2: Front-Running Resistance via Cryptographic Binding
In `withdraw.circom`:
```circom
signal input recipient;
signal recipient_binding;
recipient_binding <== recipient * recipient;
```
Because `recipient` is an explicit public signal verified against on-chain calldata, any attempt by a front-running bot to replace `recipient` will cause the elliptic curve pairing check $e(-A, B) \cdot e(\alpha, \beta) \cdot e(L, \gamma) \cdot e(C, \delta) = 1$ to fail.

### Invariant 3: Anonymity Set & Epoch Bucketing Trade-offs
- **Fixed Denominations**: By restricting pool values to 0.01, 0.1, and 1.0 tBTC, amount correlation analysis is eliminated.
- **Epoch Bucketing**: Notes earn yield based on deposit epoch ($1 \text{ epoch} = 1 \text{ day}$). Withdrawal reveals the deposit epoch bucket to calculate cumulative index yield ($index_{now} - index_{epoch}$).
- **Trade-off Disclosure**: Users with deposits in low-volume epochs have smaller anonymity sets. This is clearly presented in the UI with live anonymity set counters per bucket.

### Invariant 4: Bounded Storage & TTL Management
- All contract storage entries use Soroban's `instance()` and `persistent()` storage models with explicit TTL extensions (`extend_ttl(50_000, 100_000)`).
- Nullifiers and leaf records are bounded 32-byte hashes, preventing state exhaustion attacks.

---

## 4. Testnet Assumptions & Simulated Aspects

1. **tBTC Asset**: Testnet asset issued by our issuer account and wrapped by the Stellar Asset Contract (SAC). Not real Bitcoin.
2. **Strategy Yield**: Yield accrual is simulated via configurable deterministic basis-point APYs (5% for Strategy A, 12% for Strategy B).
3. **Merkle Root Synchronization**: The Merkle root is updated on-chain on deposit or synced by the relayer/indexer role from reconstructed event trees. Both modes are guarded by the `KnownRoot` ring buffer.
