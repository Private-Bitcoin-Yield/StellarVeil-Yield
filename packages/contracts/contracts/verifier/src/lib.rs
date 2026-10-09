#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, vec, Address, Env,
    Symbol, Vec,
    crypto::bn254::{Bn254Fr, Bn254G1Affine, Bn254G2Affine},
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VerifierError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    MalformedVerifyingKey = 4,
    VkNotFound = 5,
    VerificationFailed = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerificationKey {
    pub alpha: Bn254G1Affine,
    pub beta: Bn254G2Affine,
    pub gamma: Bn254G2Affine,
    pub delta: Bn254G2Affine,
    pub ic: Vec<Bn254G1Affine>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Proof {
    pub a: Bn254G1Affine,
    pub b: Bn254G2Affine,
    pub c: Bn254G1Affine,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Vk(Symbol),
}

#[contract]
pub struct VerifierContract;

#[contractimpl]
impl VerifierContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), VerifierError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(VerifierError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    pub fn set_vk(env: Env, caller: Address, circuit_id: Symbol, vk: VerificationKey) -> Result<(), VerifierError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(VerifierError::NotInitialized)?;
        caller.require_auth();
        if caller != admin {
            return Err(VerifierError::Unauthorized);
        }
        if vk.ic.is_empty() {
            return Err(VerifierError::MalformedVerifyingKey);
        }
        env.storage().instance().set(&DataKey::Vk(circuit_id), &vk);
        Ok(())
    }

    pub fn get_vk(env: Env, circuit_id: Symbol) -> Result<VerificationKey, VerifierError> {
        env.storage().instance().get(&DataKey::Vk(circuit_id)).ok_or(VerifierError::VkNotFound)
    }

    pub fn verify(env: Env, circuit_id: Symbol, proof: Proof, public_inputs: Vec<Bn254Fr>) -> Result<bool, VerifierError> {
        let vk: VerificationKey = env
            .storage()
            .instance()
            .get(&DataKey::Vk(circuit_id))
            .ok_or(VerifierError::VkNotFound)?;
        Self::verify_with_vk(&env, &vk, &proof, &public_inputs)
    }

    pub fn verify_with_vk(
        env: &Env,
        vk: &VerificationKey,
        proof: &Proof,
        public_inputs: &Vec<Bn254Fr>,
    ) -> Result<bool, VerifierError> {
        if public_inputs.len() + 1 != vk.ic.len() {
            return Err(VerifierError::MalformedVerifyingKey);
        }

        let bn = env.crypto().bn254();
        let mut vk_x = vk.ic.get(0).unwrap();
        for (signal, point) in public_inputs.iter().zip(vk.ic.iter().skip(1)) {
            let term = bn.g1_mul(&point, &signal);
            vk_x = bn.g1_add(&vk_x, &term);
        }

        let neg_a = -proof.a.clone();
        let lhs = vec![env, neg_a, vk.alpha.clone(), vk_x, proof.c.clone()];
        let rhs = vec![
            env,
            proof.b.clone(),
            vk.beta.clone(),
            vk.gamma.clone(),
            vk.delta.clone(),
        ];

        Ok(bn.pairing_check(lhs, rhs))
    }
}

#[cfg(test)]
mod test;
