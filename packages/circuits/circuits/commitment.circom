pragma circom 2.0.0;

// Commitment computation: Commitment = Poseidon(secret, nullifier_secret, denomination, epoch)
template NoteCommitment() {
    signal input secret;
    signal input nullifier_secret;
    signal input denomination;
    signal input epoch;

    signal output commitment;
    signal output nullifier_hash;

    // Commitment hasher: Poseidon with 4 inputs
    component commitHasher = Poseidon(4);
    commitHasher.inputs[0] <== secret;
    commitHasher.inputs[1] <== nullifier_secret;
    commitHasher.inputs[2] <== denomination;
    commitHasher.inputs[3] <== epoch;

    commitment <== commitHasher.out;

    // Nullifier hasher: Poseidon with 1 input
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier_secret;

    nullifier_hash <== nullifierHasher.out;
}
