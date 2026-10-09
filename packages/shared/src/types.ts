export interface VeilNote {
  secret: string;
  nullifierSecret: string;
  denomination: string; // in stroops string
  epoch: number;
  strategyId: number;
  commitment: string;
  nullifierHash: string;
  leafIndex?: number;
}

export interface DepositRecord {
  leafIndex: number;
  commitment: string;
  denomination: string;
  epoch: number;
  strategyId: number;
  transactionHash: string;
  timestamp: number;
}

export interface WithdrawalRecord {
  nullifierHash: string;
  recipient: string;
  totalPayout: string;
  depositEpoch: number;
  transactionHash: string;
  timestamp: number;
}

export interface MerkleProofData {
  root: string;
  pathElements: string[];
  pathIndices: number[];
  leafIndex: number;
}

export interface YieldAuditProof {
  proofHash: string;
  threshold: string;
  epochIndexCommitment: string;
  merkleRoot: string;
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
  };
  publicSignals: string[];
  shareableUrl?: string;
  createdAt: number;
}

export interface DeployedContracts {
  network: string;
  adminPublicKey: string;
  tbtcIssuer: string;
  tbtcTokenAddress: string;
  verifierAddress: string;
  strategyAAddress: string;
  strategyBAddress: string;
  auditAttestationAddress: string;
  vaultAddress: string;
  deployedAt: string;
}
