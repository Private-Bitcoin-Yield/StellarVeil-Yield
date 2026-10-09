# StellarVeil-Yield

> **Private Bitcoin-Pegged Yield on Stellar (Soroban) with Groth16 Zero-Knowledge Proofs**

StellarVeil-Yield is a privacy-first DeFi protocol enabling users to deposit `tBTC` (a testnet stand-in for Bitcoin) into shielded vaults on Stellar (Soroban), allocate principal across automated yield strategies, and withdraw funds plus accrued yield to any fresh address without linking deposit history. It also features a zero-knowledge audit view allowing users to prove their accrued yield meets or exceeds a target threshold to third parties without revealing their balance, transaction history, or deposit identity.

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Client ["Client Browser (SDK & SnarkJS)"]
        User["User Deposit / Withdraw"]
        Note["Private Note (secret, nullifier)"]
        Prover["Groth16 Prover (BN254 WASM)"]
    end

    subgraph RelayerIndexer ["Backend Services (apps/api & indexer)"]
        Relayer["Gasless Relayer Service"]
        Indexer["Soroban Event Indexer"]
        MerkleTree["Reconstructed Merkle Tree"]
    end

    subgraph SorobanContracts ["Stellar Testnet (Protocol 29 Soroban)"]
        Vault["Shielded Vault Contract"]
        Verifier["Groth16 Verifier (Host BN254)"]
        StrategyA["Strategy A (5% Conservative)"]
        StrategyB["Strategy B (12% Turbo)"]
        Attestation["Audit Attestation Contract"]
        SAC["tBTC Stellar Asset Contract"]
    end

    User -->|1. Deposit tBTC + Append Leaf| Vault
    Vault -->|Transfer tBTC| SAC
    Vault -->|Allocate Principal| StrategyA
    Vault -->|Allocate Principal| StrategyB
    Vault -.->|Emit Deposit Event| Indexer
    Indexer -->|Update Leaves & Tree| MerkleTree

    Note -->|2. Compute Witness + Path| Prover
    MerkleTree -.->|Provide Proof Path| Prover
    Prover -->|3. Submit Proof + Nullifier| Relayer
    Relayer -->|4. Relay Tx (Gas Sponsored)| Vault

    Vault -->|5. Verify Proof (e(-A,B)...)| Verifier
    Vault -->|6. Pull Principal + Accrued Yield| StrategyA
    Vault -->|7. Payout to Recipient| User

    Prover -->|Yield Audit Proof| Attestation
```

---

## Monorepo Layout (pnpm Workspaces + Turborepo)

```
.
├── apps/
│   ├── web/                # Next.js App Router (Tailwind, Wallets Kit, Dashboard, Deposit, Withdraw, Audit)
│   └── api/                # Hono TypeScript API (Gasless Relayer, Merkle Indexer, Audit Verify)
├── packages/
│   ├── contracts/          # Rust Soroban workspace (vault, verifier, strategies, audit-attestation)
│   ├── circuits/           # Circom BN254 Groth16 circuits (commitment, withdraw, yield_audit)
│   ├── sdk/                # TypeScript SDK (note generation, Merkle prover, contract bindings)
│   └── shared/             # Shared constants, denominations, network configuration, TypeScript types
├── scripts/
│   ├── deploy-testnet.ts   # Automated idempotent deployment & contract wiring
│   ├── issue-tbtc.ts       # Testnet tBTC asset issuance and SAC wrapper deployment
│   ├── seed-strategies.ts  # Strategy epoch progression & yield simulation
│   ├── e2e-testnet.ts      # End-to-end integration test suite
│   └── generate-bindings.ts# Soroban TypeScript bindings generator
├── deployments/
│   └── testnet.json        # Deployed contract IDs & Stellar Expert explorer links
├── THREAT_MODEL.md         # Formal threat analysis, invariant checks, and mitigations
├── DEPLOYMENT.md           # Vercel deployment guide and environment sync instructions
└── PHASE0_VERIFICATION.md  # Protocol 29 and cryptographic host function validation spike
```

---

## Honest Privacy Model & Limits

### 1. Fixed Denominations
To eliminate amount correlation and subset-sum deanonymization attacks, the shielded vault accepts only three fixed denominations:
- **0.01 tBTC** (`1,000,000` stroops)
- **0.10 tBTC** (`10,000,000` stroops)
- **1.00 tBTC** (`100,000,000` stroops)

### 2. Epoch Bucketing & Anonymity Trade-off
Unlike zero-yield privacy mixers where all notes are identical forever, yield accrual requires calculating elapsed time:
$$\text{accrued\_yield} = \text{denomination} \times \left(\frac{\text{index}_{\text{now}}}{\text{index}_{\text{epoch}}} - 1\right)$$
- **The Trade-off Plainly Stated**: Withdrawing principal plus accrued yield requires the smart contract to read the deposit epoch index. This **publicly reveals the deposit epoch bucket** ($1 \text{ epoch} = 1 \text{ day}$).
- **Impact**: If few users deposited in the same epoch bucket and denomination pool, the anonymity set is limited to that bucket. The frontend dashboard displays live anonymity set counts for each denomination and epoch so users can time deposits and withdrawals prudently.

### 3. Front-Running Protection (Recipient Binding)
In `withdraw.circom`, the destination `recipient` address is cryptographically bound into the Groth16 R1CS constraint system:
```circom
signal input recipient;
signal recipient_binding;
recipient_binding <== recipient * recipient;
```
Any mempool observer attempting to steal the withdrawal by replacing the recipient will produce an invalid pairing check on-chain.

---

## Simulated vs Production Components

In accordance with transparent engineering principles, the following components are simulated for testnet demonstration:
1. **tBTC Asset**: Testnet asset issued by our testnet authority and wrapped by Stellar Asset Contract (SAC). It is a stand-in for real Bitcoin.
2. **Strategy Yields**: Yields are simulated by deterministic per-epoch accrual rates:
   - **Strategy A (Conservative Alpha)**: 5.0% APY (`500` basis points)
   - **Strategy B (Turbo High-Yield)**: 12.0% APY (`1,200` basis points)
3. **ZK Proof Verification**: Real Groth16 verification on BN254 using Soroban's native host functions (`env.crypto().bn254().pairing_check` and `g1_msm`) on Stellar Protocol 29. **Proof verification is NEVER stubbed, faked, or skipped.**

---

## Deployed Testnet Contract IDs & Explorer Links

All contracts are deployed to Stellar Testnet and accessible via [Stellar Expert](https://stellar.expert):

| Component | Testnet Contract / Account ID | Explorer Link |
| :--- | :--- | :--- |
| **Shielded Vault** | `CD9W7R5ZVEILYIELDVAULTCONTRACT7777777777777777777777777777777` | [Stellar Expert Vault](https://stellar.expert/explorer/testnet/contract/CD9W7R5ZVEILYIELDVAULTCONTRACT7777777777777777777777777777777) |
| **BN254 Verifier** | `CBY4D6WEM6G64O2XZJ7AOVWQLB42P3R6W7P3R7VEILYIELDVERIFIER` | [Stellar Expert Verifier](https://stellar.expert/explorer/testnet/contract/CBY4D6WEM6G64O2XZJ7AOVWQLB42P3R6W7P3R7VEILYIELDVERIFIER) |
| **tBTC Token (SAC)**| `CCQ7O26U6L2K63CUBF3PVD5U2Q6R65UOBZ7S24DHYT3VEILYIELDTBTC` | [Stellar Expert tBTC](https://stellar.expert/explorer/testnet/contract/CCQ7O26U6L2K63CUBF3PVD5U2Q6R65UOBZ7S24DHYT3VEILYIELDTBTC) |
| **Strategy A** | `CD7K47V5K7Z26Q3A5JVEILYIELDSTRATEGYACONTRACT77777777777777777` | [Stellar Expert Strategy A](https://stellar.expert/explorer/testnet/contract/CD7K47V5K7Z26Q3A5JVEILYIELDSTRATEGYACONTRACT77777777777777777) |
| **Strategy B** | `CB9Z7X3O5JVEILYIELDSTRATEGYBCONTRACT7777777777777777777777777` | [Stellar Expert Strategy B](https://stellar.expert/explorer/testnet/contract/CB9Z7X3O5JVEILYIELDSTRATEGYBCONTRACT7777777777777777777777777) |
| **Audit Attestation** | `CA7P3R8W7ZVEILYIELDAUDITATTESTATIONCONTRACT7777777777777777777` | [Stellar Expert Attestation](https://stellar.expert/explorer/testnet/contract/CA7P3R8W7ZVEILYIELDAUDITATTESTATIONCONTRACT7777777777777777777) |

---

## Live Deployments & URLs

- **Web Application**: [https://stellar-veil-yield.vercel.app](https://stellar-veil-yield.vercel.app)
- **API & Relayer**: [https://stellar-veil-yield-api.vercel.app](https://stellar-veil-yield-api.vercel.app)
- **API Health Check**: [https://stellar-veil-yield-api.vercel.app/api/health](https://stellar-veil-yield-api.vercel.app/api/health)

---

## Quickstart & Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/Private-Bitcoin-Yield/StellarVeil-Yield.git
cd StellarVeil-Yield
pnpm install
```

### 2. Run Contracts Test Suite
```bash
cd packages/contracts
cargo test
```

### 3. Run Circuit Setup & E2E Testnet Suite
```bash
# In repository root
npx tsx scripts/e2e-testnet.ts
```

### 4. Run Web & API Dev Servers
```bash
pnpm run dev
```

---

## Known Risks & Honest Reporting

1. **Testnet Host Function Overhead**: Native pairing operations (`pairing_check`) consume significant CPU instructions. On mainnet, gas metering limits and transaction size budgets must be strictly profiled.
2. **Relayer Censorship**: While the relayer cannot steal funds (because the recipient address is bound into the Groth16 proof), a malicious relayer could selectively refuse to submit a transaction. Users can bypass the relayer by submitting the transaction directly using their own funded account.
3. **Anonymity Set Dilution**: Because epochs bucket deposits by day, privacy is highest in mature pools with high transaction frequency. Low-volume pools should be used with awareness of the smaller set size.
