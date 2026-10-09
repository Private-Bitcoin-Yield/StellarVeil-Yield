import { VeilMerkleTree } from "@stellar-veilyield/sdk";

// Robust in-memory state store backing indexer and relayer (with optional DB sync)
export interface InMemoryState {
  leaves: string[];
  merkleTree: VeilMerkleTree;
  nullifiers: Set<string>;
  auditProofs: Map<string, any>;
  currentEpoch: number;
  strategyAIndex: number;
  strategyBIndex: number;
}

export const appState: InMemoryState = {
  leaves: [],
  merkleTree: new VeilMerkleTree(16, []),
  nullifiers: new Set(),
  auditProofs: new Map(),
  currentEpoch: 1,
  strategyAIndex: 10000,
  strategyBIndex: 10000,
};

export function recordDeposit(leafIndex: number, commitment: string) {
  if (appState.leaves.length === leafIndex) {
    appState.leaves.push(commitment);
    appState.merkleTree.insert(commitment);
  } else if (!appState.leaves.includes(commitment)) {
    appState.leaves.push(commitment);
    appState.merkleTree.insert(commitment);
  }
}

export function recordNullifier(nullifierHash: string) {
  appState.nullifiers.add(nullifierHash);
}

export function isNullifierSpent(nullifierHash: string): boolean {
  return appState.nullifiers.has(nullifierHash);
}
