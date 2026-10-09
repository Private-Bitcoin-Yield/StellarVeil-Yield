pragma circom 2.0.0;

include "commitment.circom";
include "merkle.circom";

// Withdraw circuit with front-running protection via recipient binding
template Withdraw(levels) {
    // Public inputs (revealed on-chain during withdrawal)
    signal input merkle_root;
    signal input nullifier_hash;
    signal input recipient;
    signal input denomination;
    signal input epoch;

    // Private inputs (known only to note owner)
    signal input secret;
    signal input nullifier_secret;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // 1. Prevent front-running by binding recipient into R1CS constraint system
    signal recipient_binding;
    recipient_binding <== recipient * recipient;

    // 2. Verify note commitment and nullifier hash
    component note = NoteCommitment();
    note.secret <== secret;
    note.nullifier_secret <== nullifier_secret;
    note.denomination <== denomination;
    note.epoch <== epoch;

    // Enforce nullifier public input matches computed nullifier hash
    nullifier_hash === note.nullifier_hash;

    // 3. Verify Merkle tree membership of note commitment
    component tree = MerkleTreeChecker(levels);
    tree.leaf <== note.commitment;
    tree.root <== merkle_root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }
}

component main {public [merkle_root, nullifier_hash, recipient, denomination, epoch]} = Withdraw(16);
