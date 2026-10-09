#![no_std]

use soroban_sdk::{contractclient, Address, Env};

#[contractclient(name = "StrategyClient")]
pub trait StrategyTrait {
    /// Initializes strategy with designated vault and administrator
    fn initialize(env: Env, vault: Address, admin: Address, apy_bps: u32);

    /// Deposit principal from vault into strategy
    fn deposit(env: Env, caller: Address, amount: i128) -> i128;

    /// Withdraw principal + accrued yield back to vault
    fn withdraw(env: Env, caller: Address, amount: i128) -> i128;

    /// Get current cumulative index for yield accounting (scaled by 10,000)
    fn get_index(env: Env) -> u64;

    /// Progress strategy accounting to target epoch
    fn advance_epoch(env: Env, caller: Address, epoch: u64);

    /// Get total managed assets under strategy
    fn get_total_managed(env: Env) -> i128;

    /// Get simulated APY in basis points (e.g. 500 = 5.00%)
    fn get_apy_bps(env: Env) -> u32;
}
