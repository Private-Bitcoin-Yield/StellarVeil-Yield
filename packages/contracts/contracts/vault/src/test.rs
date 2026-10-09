#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, BytesN, Env,
};

#[test]
fn test_vault_initialize() {
    let env = Env::default();
    let contract_id = env.register(VaultContract, ());
    let client = VaultContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    let verifier = Address::generate(&env);
    let strat_a = Address::generate(&env);
    let strat_b = Address::generate(&env);

    client.initialize(&admin, &token, &verifier, &strat_a, &strat_b);

    assert_eq!(client.get_leaf_count(), 0);
    assert_eq!(client.get_current_epoch(), 1);

    // Initial zero root is known
    let zero_root = BytesN::from_array(&env, &[0u8; 32]);
    assert!(client.is_known_root(&zero_root));
}

#[test]
fn test_vault_update_merkle_root() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(VaultContract, ());
    let client = VaultContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    let verifier = Address::generate(&env);
    let strat_a = Address::generate(&env);
    let strat_b = Address::generate(&env);

    client.initialize(&admin, &token, &verifier, &strat_a, &strat_b);

    let new_root = BytesN::from_array(&env, &[7u8; 32]);
    client.update_merkle_root(&admin, &new_root);

    assert_eq!(client.get_current_root(), new_root);
    assert!(client.is_known_root(&new_root));
}

#[test]
fn test_vault_pause_and_unpause() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(VaultContract, ());
    let client = VaultContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    let verifier = Address::generate(&env);
    let strat_a = Address::generate(&env);
    let strat_b = Address::generate(&env);

    client.initialize(&admin, &token, &verifier, &strat_a, &strat_b);

    client.set_paused(&admin, &true);

    let user = Address::generate(&env);
    let dummy_commit = BytesN::from_array(&env, &[1u8; 32]);
    let res = client.try_deposit(&user, &dummy_commit, &DENOM_0_1, &1);
    assert_eq!(res, Err(Ok(VaultError::ContractPaused)));

    client.set_paused(&admin, &false);
}

#[test]
fn test_vault_rejects_invalid_denomination() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(VaultContract, ());
    let client = VaultContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    let verifier = Address::generate(&env);
    let strat_a = Address::generate(&env);
    let strat_b = Address::generate(&env);

    client.initialize(&admin, &token, &verifier, &strat_a, &strat_b);

    let user = Address::generate(&env);
    let dummy_commit = BytesN::from_array(&env, &[1u8; 32]);
    let res = client.try_deposit(&user, &dummy_commit, &555_555, &1);
    assert_eq!(res, Err(Ok(VaultError::InvalidDenomination)));
}
