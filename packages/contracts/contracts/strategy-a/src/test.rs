#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Env,
};

#[test]
fn test_strategy_a_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(StrategyAContract, ());
    let client = veilyield_strategy_trait::StrategyClient::new(&env, &contract_id);

    let vault = Address::generate(&env);
    let admin = Address::generate(&env);

    client.initialize(&vault, &admin, &500); // 5% APY

    assert_eq!(client.get_index(), 10_000);
    assert_eq!(client.get_apy_bps(), 500);

    // Deposit from vault
    let deposited = client.deposit(&vault, &100_000);
    assert_eq!(deposited, 100_000);
    assert_eq!(client.get_total_managed(), 100_000);

    // Advance 30 epochs
    client.advance_epoch(&vault, &30);
    assert!(client.get_index() > 10_000);

    // Withdraw back to vault
    let withdrawn = client.withdraw(&vault, &50_000);
    assert_eq!(withdrawn, 50_000);
    assert_eq!(client.get_total_managed(), 50_000);
}
