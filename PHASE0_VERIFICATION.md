# Phase 0: Verification of Assumptions & Cryptographic Spike

This document records the verification of protocol assumptions, cryptographic host functions, and curve compatibility for **Stellar-VeilYield**.

## 1. Network & Protocol Verification

- **Target Network**: Stellar Testnet (`https://soroban-testnet.stellar.org`)
- **Protocol Version Confirmed**: Protocol **29** (Core 29.0.0, well above required Protocol 25 minimum).
- **ZK Cryptographic Primitives**:
  - Stellar Protocol 25+ added native host functions for BN254 (alt_bn128) and BLS12-381 pairings and group operations.
  - `soroban-sdk` exposes `Bn254` via `env.crypto().bn254()` including:
    - `pairing_check(vp1: Vec<Bn254G1Affine>, vp2: Vec<Bn254G2Affine>) -> bool`
    - `g1_msm(vp: Vec<Bn254G1Affine>, vs: Vec<Bn254Fr>) -> Bn254G1Affine`
    - `g1_add`, `g1_mul`, `g1_is_on_curve`
    - Scalar arithmetic in $F_r$: `fr_add`, `fr_sub`, `fr_mul`, `fr_inv`, `fr_pow`

## 2. Cryptographic Spike: Circom BN254 Groth16 vs Soroban Host Functions

### Groth16 Verification Equation
For a Groth16 proof $(A, B, C)$ and public signals $x_1, \dots, x_l$:
$$e(-A, B) \cdot e(\alpha, \beta) \cdot e(L, \gamma) \cdot e(C, \delta) = 1$$
Where:
$$L = IC_0 + \sum_{i=1}^l x_i \cdot IC_i$$

### Encoding Format
1. **$G_1$ Points (`Bn254G1Affine`)**: 64 bytes uncompressed big-endian `[X (32B) || Y (32B)]`.
2. **$G_2$ Points (`Bn254G2Affine`)**: 128 bytes uncompressed big-endian `[X.c1 (32B) || X.c0 (32B) || Y.c1 (32B) || Y.c0 (32B)]`, matching SnarkJS `pi_b` coordinate convention.
3. **Public Signals (`Bn254Fr`)**: 32 bytes big-endian canonical field element ($< r$).

## 3. Merkle Tree & Poseidon Spike Assessment

### Poseidon Permutation Host Function
Soroban Protocol 25+ exposes `poseidon_permutation` and `poseidon2_permutation` host primitives accepting arbitrary parameter tuples `(field, t, d, rounds_f, rounds_p, mds, round_constants)`.

### Honest Testnet Design & Trust Model
1. **Circuit Specification**:
   - Leaf Commitment = $\text{Poseidon}(secret, nullifier\_secret, denomination, epoch)$
   - Merkle Tree Hash = $\text{Poseidon}(left, right)$
   - Nullifier Hash = $\text{Poseidon}(nullifier\_secret)$
2. **On-Chain Merkle Root Management**:
   - The contract maintains a history buffer of valid Merkle roots (`KNOWN_ROOTS`).
   - Every deposit appends the leaf to the on-chain registry and emits an indexed `Deposit` event.
   - For gas efficiency and state throughput on testnet, the Merkle root is either updated incrementally on-chain or committed by the authorized indexer/relayer role upon batching.
   - **Privacy Guarantee**: Any note membership proof verified against ANY known root in the history buffer is valid for withdrawal. Reused nullifiers are rejected by tracking spent nullifier hashes in persistent storage.

## 4. Verification Check Status
- [x] Testnet RPC checked (Protocol 29 active).
- [x] Host function availability confirmed for BN254 pairing and MSM.
- [x] Groth16 verifier structure verified against official `stellar/soroban-examples/groth16_verifier`.
- [x] Merkle root trust model explicitly documented and implemented.
