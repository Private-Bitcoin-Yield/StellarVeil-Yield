#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Env,
};

#[test]
fn test_attestation_initialization() {
    let env = Env::default();
    let contract_id = env.register(AuditAttestationContract, ());
    let client = AuditAttestationContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let verifier = Address::generate(&env);

    client.initialize(&admin, &verifier);

    let res = client.try_initialize(&admin, &verifier);
    assert_eq!(res, Err(Ok(AttestationError::AlreadyInitialized)));
}
