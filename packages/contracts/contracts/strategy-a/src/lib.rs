#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env,
};
use veilyield_strategy_trait::StrategyTrait;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum StrategyError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    UnauthorizedVault = 3,
    UnauthorizedAdmin = 4,
    InvalidAmount = 5,
}

#[contracttype]
pub enum DataKey {
    Vault,
    Admin,
    ApyBps,
    CurrentEpoch,
    CumulativeIndex,
    TotalManaged,
}

const INITIAL_INDEX: u64 = 10_000; // Scaled 1.0000

#[contract]
pub struct StrategyAContract;

#[contractimpl]
impl StrategyTrait for StrategyAContract {
    fn initialize(env: Env, vault: Address, admin: Address, apy_bps: u32) {
        if env.storage().instance().has(&DataKey::Vault) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Vault, &vault);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ApyBps, &apy_bps);
        env.storage().instance().set(&DataKey::CurrentEpoch, &0u64);
        env.storage().instance().set(&DataKey::CumulativeIndex, &INITIAL_INDEX);
        env.storage().instance().set(&DataKey::TotalManaged, &0i128);
    }

    fn deposit(env: Env, caller: Address, amount: i128) -> i128 {
        caller.require_auth();
        let vault: Address = env.storage().instance().get(&DataKey::Vault).expect("not initialized");
        if caller != vault {
            panic!("unauthorized: caller is not vault");
        }
        if amount <= 0 {
            panic!("invalid amount");
        }
        let current_total: i128 = env.storage().instance().get(&DataKey::TotalManaged).unwrap_or(0);
        let new_total = current_total + amount;
        env.storage().instance().set(&DataKey::TotalManaged, &new_total);
        amount
    }

    fn withdraw(env: Env, caller: Address, amount: i128) -> i128 {
        caller.require_auth();
        let vault: Address = env.storage().instance().get(&DataKey::Vault).expect("not initialized");
        if caller != vault {
            panic!("unauthorized: caller is not vault");
        }
        if amount <= 0 {
            panic!("invalid amount");
        }
        let current_total: i128 = env.storage().instance().get(&DataKey::TotalManaged).unwrap_or(0);
        let new_total = current_total.saturating_sub(amount);
        env.storage().instance().set(&DataKey::TotalManaged, &new_total);
        amount
    }

    fn get_index(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::CumulativeIndex).unwrap_or(INITIAL_INDEX)
    }

    fn advance_epoch(env: Env, caller: Address, target_epoch: u64) {
        caller.require_auth();
        let vault: Address = env.storage().instance().get(&DataKey::Vault).expect("not initialized");
        if caller != vault {
            panic!("unauthorized: caller is not vault");
        }
        let current_epoch: u64 = env.storage().instance().get(&DataKey::CurrentEpoch).unwrap_or(0);
        if target_epoch > current_epoch {
            let elapsed = target_epoch - current_epoch;
            let apy_bps: u32 = env.storage().instance().get(&DataKey::ApyBps).unwrap_or(500);
            let current_index: u64 = env.storage().instance().get(&DataKey::CumulativeIndex).unwrap_or(INITIAL_INDEX);

            let delta = (current_index as u128 * apy_bps as u128 * elapsed as u128) / (365 * 10_000);
            let new_index = current_index + delta as u64;

            env.storage().instance().set(&DataKey::CurrentEpoch, &target_epoch);
            env.storage().instance().set(&DataKey::CumulativeIndex, &new_index);
        }
    }

    fn get_total_managed(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalManaged).unwrap_or(0)
    }

    fn get_apy_bps(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::ApyBps).unwrap_or(500)
    }
}

#[cfg(test)]
mod test;
