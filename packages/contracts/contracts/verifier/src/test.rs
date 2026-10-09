#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, BytesN, Env, Symbol, Vec,
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
};

fn dummy_g1(env: &Env) -> Bn254G1Affine {
    Bn254G1Affine::from_bytes(BytesN::from_array(env, &[0u8; 64]))
}

fn dummy_g2(env: &Env) -> Bn254G2Affine {
    Bn254G2Affine::from_bytes(BytesN::from_array(env, &[0u8; 128]))
}

fn dummy_fr(env: &Env) -> Bn254Fr {
    Bn254Fr::from_bytes(BytesN::from_array(env, &[0u8; 32]))
}

#[test]
fn test_initialize_and_admin() {
    let env = Env::default();
    let contract_id = env.register(VerifierContract, ());
    let client = VerifierContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    // Re-initialization should fail
    let res = client.try_initialize(&admin);
    assert_eq!(res, Err(Ok(VerifierError::AlreadyInitialized)));
}

#[test]
fn test_set_and_get_vk() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(VerifierContract, ());
    let client = VerifierContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let mut ic = Vec::new(&env);
    ic.push_back(dummy_g1(&env));
    ic.push_back(dummy_g1(&env));

    let vk = VerificationKey {
        alpha: dummy_g1(&env),
        beta: dummy_g2(&env),
        gamma: dummy_g2(&env),
        delta: dummy_g2(&env),
        ic,
    };

    let circuit_id = Symbol::new(&env, "withdraw");
    client.set_vk(&admin, &circuit_id, &vk);

    let stored_vk = client.get_vk(&circuit_id);
    assert_eq!(stored_vk.ic.len(), 2);
}

#[test]
fn test_signal_count_mismatch_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(VerifierContract, ());
    let client = VerifierContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let mut ic = Vec::new(&env);
    ic.push_back(dummy_g1(&env));
    ic.push_back(dummy_g1(&env));

    let vk = VerificationKey {
        alpha: dummy_g1(&env),
        beta: dummy_g2(&env),
        gamma: dummy_g2(&env),
        delta: dummy_g2(&env),
        ic,
    };

    let circuit_id = Symbol::new(&env, "withdraw");
    client.set_vk(&admin, &circuit_id, &vk);

    let proof = Proof {
        a: dummy_g1(&env),
        b: dummy_g2(&env),
        c: dummy_g1(&env),
    };

    // Public inputs length should be vk.ic.len() - 1 = 1, but we provide 2
    let mut inputs = Vec::new(&env);
    inputs.push_back(dummy_fr(&env));
    inputs.push_back(dummy_fr(&env));

    let result = client.try_verify(&circuit_id, &proof, &inputs);
    assert_eq!(result, Err(Ok(VerifierError::MalformedVerifyingKey)));
}
