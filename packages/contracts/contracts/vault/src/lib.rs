#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token,
    Address, BytesN, Env, Symbol, Vec,
    crypto::bn254::Bn254Fr,
};
use veilyield_verifier::{Proof, VerifierContractClient};
use veilyield_strategy_trait::StrategyClient;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    ContractPaused = 4,
    InvalidDenomination = 5,
    InvalidStrategy = 6,
    UnknownRoot = 7,
    NullifierAlreadyUsed = 8,
    ProofVerificationFailed = 9,
    TransferFailed = 10,
    InvalidEpoch = 11,
}

pub const DENOM_0_01: i128 = 1_000_000;   // 0.01 tBTC
pub const DENOM_0_1: i128  = 10_000_000;  // 0.10 tBTC
pub const DENOM_1_0: i128  = 100_000_000; // 1.00 tBTC

pub const SCALE: u64 = 10_000; // 1.0000

#[contracttype]
pub enum DataKey {
    Admin,
    Paused,
    Token,
    Verifier,
    StrategyA,
    StrategyB,
    CurrentEpoch,
    EpochStartTimestamp,
    EpochIndex(u32, u64), // (strategy_id, epoch) -> index
    LeafCount,
    Leaf(u32),
    KnownRoot(BytesN<32>),
    CurrentRoot,
    Nullifier(BytesN<32>),
}

#[contract]
pub struct VaultContract;

#[contractimpl]
impl VaultContract {
    /// Initializes Vault contract with admin, token, verifier, and strategies
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        verifier: Address,
        strategy_a: Address,
        strategy_b: Address,
    ) -> Result<(), VaultError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(VaultError::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        env.storage().instance().set(&DataKey::StrategyA, &strategy_a);
        env.storage().instance().set(&DataKey::StrategyB, &strategy_b);
        env.storage().instance().set(&DataKey::CurrentEpoch, &1u64);
        env.storage().instance().set(&DataKey::EpochStartTimestamp, &env.ledger().timestamp());
        env.storage().instance().set(&DataKey::LeafCount, &0u32);

        // Record initial epoch 1 index for both strategies (1.0000)
        env.storage().instance().set(&DataKey::EpochIndex(1, 1), &SCALE);
        env.storage().instance().set(&DataKey::EpochIndex(2, 1), &SCALE);

        // Set initial empty root (32 zero bytes)
        let zero_root = BytesN::from_array(&env, &[0u8; 32]);
        env.storage().persistent().set(&DataKey::KnownRoot(zero_root.clone()), &true);
        env.storage().instance().set(&DataKey::CurrentRoot, &zero_root);

        Ok(())
    }

    /// Deposits a fixed denomination into shielded pool and appends commitment leaf
    pub fn deposit(
        env: Env,
        from: Address,
        commitment: BytesN<32>,
        denomination: i128,
        strategy_id: u32,
    ) -> Result<u32, VaultError> {
        from.require_auth();
        Self::check_not_paused(&env)?;

        // Validate denomination
        if denomination != DENOM_0_01 && denomination != DENOM_0_1 && denomination != DENOM_1_0 {
            return Err(VaultError::InvalidDenomination);
        }

        // Validate strategy
        if strategy_id != 1 && strategy_id != 2 {
            return Err(VaultError::InvalidStrategy);
        }

        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_address);

        // 1. Checks-Effects-Interactions: Transfer token from user to Vault
        token_client.transfer(&from, &env.current_contract_address(), &denomination);

        // 2. Deposit into strategy
        let strategy_address = Self::get_strategy_address(&env, strategy_id)?;
        let strategy_client = StrategyClient::new(&env, &strategy_address);
        strategy_client.deposit(&env.current_contract_address(), &denomination);

        // 3. Store commitment leaf
        let leaf_count: u32 = env.storage().instance().get(&DataKey::LeafCount).unwrap_or(0);
        env.storage().persistent().set(&DataKey::Leaf(leaf_count), &commitment);
        let new_count = leaf_count + 1;
        env.storage().instance().set(&DataKey::LeafCount, &new_count);

        let current_epoch: u64 = env.storage().instance().get(&DataKey::CurrentEpoch).unwrap_or(1);

        // Extend storage TTLs
        env.storage().instance().extend_ttl(50_000, 100_000);
        env.storage().persistent().extend_ttl(&DataKey::Leaf(leaf_count), 50_000, 100_000);

        // 4. Emit Deposit event
        env.events().publish(
            (symbol_short!("deposit"), leaf_count),
            (commitment, denomination, current_epoch, strategy_id),
        );

        Ok(leaf_count)
    }

    /// Withdraws note by verifying Groth16 proof, checking root, nullifier, and paying out principal + yield
    pub fn withdraw(
        env: Env,
        proof: Proof,
        public_signals: Vec<Bn254Fr>,
        merkle_root: BytesN<32>,
        nullifier_hash: BytesN<32>,
        recipient: Address,
        denomination: i128,
        deposit_epoch: u64,
        strategy_id: u32,
    ) -> Result<i128, VaultError> {
        Self::check_not_paused(&env)?;

        // 1. Verify Merkle root is in known valid roots
        if !Self::is_known_root(&env, merkle_root.clone()) {
            return Err(VaultError::UnknownRoot);
        }

        // 2. Verify nullifier has NOT been spent
        if env.storage().persistent().has(&DataKey::Nullifier(nullifier_hash.clone())) {
            return Err(VaultError::NullifierAlreadyUsed);
        }

        // 3. Mark nullifier as spent IMMEDIATELY (Checks-Effects-Interactions pattern)
        env.storage().persistent().set(&DataKey::Nullifier(nullifier_hash.clone()), &true);
        env.storage().persistent().extend_ttl(&DataKey::Nullifier(nullifier_hash.clone()), 50_000, 100_000);

        // 4. Verify Groth16 ZK proof using on-chain verifier contract
        let verifier_address: Address = env.storage().instance().get(&DataKey::Verifier).unwrap();
        let verifier_client = VerifierContractClient::new(&env, &verifier_address);
        let circuit_id = Symbol::new(&env, "withdraw");

        let is_valid = verifier_client.verify(&circuit_id, &proof, &public_signals);
        if !is_valid {
            return Err(VaultError::ProofVerificationFailed);
        }

        // 5. Calculate accrued yield from chosen strategy
        let strategy_address = Self::get_strategy_address(&env, strategy_id)?;
        let strategy_client = StrategyClient::new(&env, &strategy_address);

        let current_index = strategy_client.get_index();
        let deposit_index: u64 = env
            .storage()
            .instance()
            .get(&DataKey::EpochIndex(strategy_id, deposit_epoch))
            .unwrap_or(SCALE);

        let mut accrued_yield: i128 = 0;
        if current_index > deposit_index {
            let index_delta = (current_index - deposit_index) as i128;
            accrued_yield = (denomination * index_delta) / (SCALE as i128);
        }

        let total_payout = denomination + accrued_yield;

        // 6. Withdraw principal + yield from strategy
        strategy_client.withdraw(&env.current_contract_address(), &total_payout);

        // 7. Transfer funds to recipient address
        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &recipient, &total_payout);

        // 8. Emit privacy-preserving Withdraw event
        env.events().publish(
            (symbol_short!("withdraw"), nullifier_hash),
            (recipient, total_payout, deposit_epoch),
        );

        Ok(total_payout)
    }

    /// Admin updates the current Merkle root and adds it to known roots history
    pub fn update_merkle_root(
        env: Env,
        caller: Address,
        new_root: BytesN<32>,
    ) -> Result<(), VaultError> {
        caller.require_auth();
        Self::check_admin(&env, &caller)?;

        env.storage().persistent().set(&DataKey::KnownRoot(new_root.clone()), &true);
        env.storage().instance().set(&DataKey::CurrentRoot, &new_root);
        env.storage().persistent().extend_ttl(&DataKey::KnownRoot(new_root.clone()), 50_000, 100_000);

        env.events().publish((symbol_short!("new_root"),), new_root);
        Ok(())
    }

    /// Progresses epoch and updates strategy indices
    pub fn advance_epoch(env: Env, caller: Address) -> Result<u64, VaultError> {
        caller.require_auth();
        Self::check_admin(&env, &caller)?;

        let current_epoch: u64 = env.storage().instance().get(&DataKey::CurrentEpoch).unwrap_or(1);
        let next_epoch = current_epoch + 1;

        // Advance Strategy A
        let strat_a_addr = Self::get_strategy_address(&env, 1)?;
        let strat_a_client = StrategyClient::new(&env, &strat_a_addr);
        strat_a_client.advance_epoch(&env.current_contract_address(), &next_epoch);
        let index_a = strat_a_client.get_index();
        env.storage().instance().set(&DataKey::EpochIndex(1, next_epoch), &index_a);

        // Advance Strategy B
        let strat_b_addr = Self::get_strategy_address(&env, 2)?;
        let strat_b_client = StrategyClient::new(&env, &strat_b_addr);
        strat_b_client.advance_epoch(&env.current_contract_address(), &next_epoch);
        let index_b = strat_b_client.get_index();
        env.storage().instance().set(&DataKey::EpochIndex(2, next_epoch), &index_b);

        env.storage().instance().set(&DataKey::CurrentEpoch, &next_epoch);

        env.events().publish(
            (symbol_short!("epoch_adv"), next_epoch),
            (index_a, index_b),
        );

        Ok(next_epoch)
    }

    pub fn set_paused(env: Env, caller: Address, paused: bool) -> Result<(), VaultError> {
        caller.require_auth();
        Self::check_admin(&env, &caller)?;
        env.storage().instance().set(&DataKey::Paused, &paused);
        env.events().publish((symbol_short!("pause_set"),), paused);
        Ok(())
    }

    pub fn is_known_root(env: &Env, root: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::KnownRoot(root))
    }

    pub fn is_nullifier_spent(env: Env, nullifier_hash: BytesN<32>) -> bool {
        env.storage().persistent().has(&DataKey::Nullifier(nullifier_hash))
    }

    pub fn get_current_root(env: Env) -> BytesN<32> {
        env.storage().instance().get(&DataKey::CurrentRoot).unwrap_or(BytesN::from_array(&env, &[0u8; 32]))
    }

    pub fn get_leaf_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::LeafCount).unwrap_or(0)
    }

    pub fn get_leaf(env: Env, index: u32) -> Option<BytesN<32>> {
        env.storage().persistent().get(&DataKey::Leaf(index))
    }

    pub fn get_current_epoch(env: Env) -> u64 {
        env.storage().instance().get(&DataKey::CurrentEpoch).unwrap_or(1)
    }

    fn check_not_paused(env: &Env) -> Result<(), VaultError> {
        let paused: bool = env.storage().instance().get(&DataKey::Paused).unwrap_or(false);
        if paused {
            return Err(VaultError::ContractPaused);
        }
        Ok(())
    }

    fn check_admin(env: &Env, caller: &Address) -> Result<(), VaultError> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).ok_or(VaultError::NotInitialized)?;
        if caller != &admin {
            return Err(VaultError::Unauthorized);
        }
        Ok(())
    }

    fn get_strategy_address(env: &Env, strategy_id: u32) -> Result<Address, VaultError> {
        match strategy_id {
            1 => env.storage().instance().get(&DataKey::StrategyA).ok_or(VaultError::InvalidStrategy),
            2 => env.storage().instance().get(&DataKey::StrategyB).ok_or(VaultError::InvalidStrategy),
            _ => Err(VaultError::InvalidStrategy),
        }
    }
}

#[cfg(test)]
mod test;
