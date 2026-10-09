pragma circom 2.0.0;

// Dual multiplexer: chooses ordering based on path index bit (0 or 1)
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];

    s * (1 - s) === 0;
    out[0] <== (in[1] - in[0]) * s + in[0];
    out[1] <== (in[0] - in[1]) * s + in[1];
}

// Poseidon hasher for 2 inputs
template HashLeftRight() {
    signal input left;
    signal input right;
    signal output hash;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== left;
    hasher.inputs[1] <== right;
    hash <== hasher.out;
}

// Checks binary Merkle tree membership of depth `levels`
template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    signal current[levels + 1];
    current[0] <== leaf;

    component mux[levels];
    component hashers[levels];

    for (var i = 0; i < levels; i++) {
        mux[i] = DualMux();
        mux[i].in[0] <== current[i];
        mux[i].in[1] <== pathElements[i];
        mux[i].s <== pathIndices[i];

        hashers[i] = HashLeftRight();
        hashers[i].left <== mux[i].out[0];
        hashers[i].right <== mux[i].out[1];

        current[i + 1] <== hashers[i].hash;
    }

    root === current[levels];
}
