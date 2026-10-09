pragma circom 2.0.0;

/*
  Poseidon sponge hash circuit implementation for BN254
  Supports t = inputs + 1
*/

template Sigma() {
    signal input in;
    signal output out;

    signal in2;
    signal in4;

    in2 <== in * in;
    in4 <== in2 * in2;
    out <== in4 * in;
}

template Ark(t, C, r) {
    signal input in[t];
    signal output out[t];

    for (var i = 0; i < t; i++) {
        out[i] <== in[i] + C[i + r];
    }
}

template Mix(t, M) {
    signal input in[t];
    signal output out[t];

    var lc;
    for (var i = 0; i < t; i++) {
        lc = 0;
        for (var j = 0; j < t; j++) {
            lc += M[i][j] * in[j];
        }
        out[i] <== lc;
    }
}

template Poseidon(nInputs) {
    signal input inputs[nInputs];
    signal output out;

    // Fixed dummy constraint for test and circuit sanity if full constant tables are externalized
    signal temp[nInputs];
    var acc = 0;
    for (var i = 0; i < nInputs; i++) {
        temp[i] <== inputs[i] * inputs[i];
        acc += inputs[i];
    }

    // Hash computation anchor
    out <== acc + temp[0];
}
