#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Env,
};

#[test]
fn test_strategy_b_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StrategyBContract, ());
    let client = veilyield_strategy_trait::StrategyClient::new(&env, &contract_id);

    let vault = Address::generate(&env);
    let admin = Address::generate(&env);

    client.initialize(&vault, &admin, &1200); // 12% APY

    assert_eq!(client.get_index(), 10_000);
    assert_eq!(client.get_apy_bps(), 1200);

    // Deposit from vault
    let deposited = client.deposit(&vault, &250_000);
    assert_eq!(deposited, 250_000);

    // Advance 60 epochs
    client.advance_epoch(&vault, &60);
    assert!(client.get_index() > 10_000);

    // Withdraw back to vault
    let withdrawn = client.withdraw(&vault, &100_000);
    assert_eq!(withdrawn, 100_000);
    assert_eq!(client.get_total_managed(), 150_000);
}
