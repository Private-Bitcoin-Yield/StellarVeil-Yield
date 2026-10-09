#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
    Symbol, Vec,
    crypto::bn254::Bn254Fr,
};
use veilyield_verifier::{Proof, VerifierContractClient};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum AttestationError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidProof = 3,
    AlreadyAttested = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AttestationRecord {
    pub proof_hash: BytesN<32>,
    pub attested_at: u64,
    pub verified: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Verifier,
    Attestation(BytesN<32>),
}

#[contract]
pub struct AuditAttestationContract;

#[contractimpl]
impl AuditAttestationContract {
    pub fn initialize(env: Env, admin: Address, verifier: Address) -> Result<(), AttestationError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(AttestationError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Verifier, &verifier);
        Ok(())
    }

    pub fn attest_yield_proof(
        env: Env,
        proof_hash: BytesN<32>,
        proof: Proof,
        public_signals: Vec<Bn254Fr>,
    ) -> Result<bool, AttestationError> {
        if env.storage().persistent().has(&DataKey::Attestation(proof_hash.clone())) {
            return Err(AttestationError::AlreadyAttested);
        }

        let verifier_address: Address = env
            .storage()
            .instance()
            .get(&DataKey::Verifier)
            .ok_or(AttestationError::NotInitialized)?;

        let verifier_client = VerifierContractClient::new(&env, &verifier_address);
        let circuit_id = Symbol::new(&env, "yield_audit");

        let is_valid = verifier_client
            .verify(&circuit_id, &proof, &public_signals);

        if !is_valid {
            return Err(AttestationError::InvalidProof);
        }

        let now = env.ledger().timestamp();
        let record = AttestationRecord {
            proof_hash: proof_hash.clone(),
            attested_at: now,
            verified: true,
        };

        env.storage().persistent().set(&DataKey::Attestation(proof_hash.clone()), &record);

        // Emit privacy-preserving attestation event: only proof_hash and timestamp, NO note secrets
        env.events().publish(
            (symbol_short!("attested"), proof_hash),
            now,
        );

        Ok(true)
    }

    pub fn get_attestation(env: Env, proof_hash: BytesN<32>) -> Option<AttestationRecord> {
        env.storage().persistent().get(&DataKey::Attestation(proof_hash))
    }
}

#[cfg(test)]
mod test;
