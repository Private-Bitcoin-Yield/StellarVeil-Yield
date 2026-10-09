pragma circom 2.0.0;

include "commitment.circom";
include "merkle.circom";
include "comparators.circom";

// Yield Audit Circuit: proves note membership and yield >= threshold without revealing balance or identity
template YieldAudit(levels) {
    // Public inputs (shareable for zero-knowledge audit proofs)
    signal input merkle_root;
    signal input threshold;
    signal input epoch_index_commitment;

    // Private inputs (private note parameters + epoch index witness)
    signal input secret;
    signal input nullifier_secret;
    signal input denomination;
    signal input deposit_epoch;
    signal input current_epoch;
    signal input current_index;
    signal input deposit_index;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // 1. Verify note commitment
    component note = NoteCommitment();
    note.secret <== secret;
    note.nullifier_secret <== nullifier_secret;
    note.denomination <== denomination;
    note.epoch <== deposit_epoch;

    // 2. Verify note inclusion in the on-chain Merkle tree
    component tree = MerkleTreeChecker(levels);
    tree.leaf <== note.commitment;
    tree.root <== merkle_root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    // 3. Verify public epoch_index_commitment binds epoch & index values
    component commitHasher = Poseidon(4);
    commitHasher.inputs[0] <== current_epoch;
    commitHasher.inputs[1] <== current_index;
    commitHasher.inputs[2] <== deposit_epoch;
    commitHasher.inputs[3] <== deposit_index;

    epoch_index_commitment === commitHasher.out;

    // 4. Compute simulated yield: yield = denomination * (current_index - deposit_index) / 10000
    // We constrain: denomination * (current_index - deposit_index) >= threshold * 10000
    signal index_delta;
    index_delta <== current_index - deposit_index;

    signal yield_scaled;
    yield_scaled <== denomination * index_delta;

    // 5. Enforce yield_scaled >= threshold * 10000
    signal threshold_scaled;
    threshold_scaled <== threshold * 10000;

    component ge = GreaterEqThan(64);
    ge.in[0] <== yield_scaled;
    ge.in[1] <== threshold_scaled;
    ge.out === 1;
}

component main {public [merkle_root, threshold, epoch_index_commitment]} = YieldAudit(16);
