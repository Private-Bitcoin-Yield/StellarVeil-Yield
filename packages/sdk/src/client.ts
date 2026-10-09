import { MerkleProofData, YieldAuditProof } from "@stellar-veilyield/shared";
import { WithdrawProofResult } from "./prover";

export interface RelayerResponse {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class VeilApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3001") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  public async getLeaves(): Promise<{ leaves: string[]; root: string; count: number }> {
    const res = await fetch(`${this.baseUrl}/api/leaves`);
    if (!res.ok) throw new Error(`Failed to fetch leaves: ${res.statusText}`);
    return res.json();
  }

  public async getMerkleProof(leafIndex: number): Promise<MerkleProofData> {
    const res = await fetch(`${this.baseUrl}/api/merkle-proof/${leafIndex}`);
    if (!res.ok) throw new Error(`Failed to fetch merkle proof for leaf ${leafIndex}`);
    return res.json();
  }

  public async submitWithdrawal(payload: WithdrawProofResult): Promise<RelayerResponse> {
    const res = await fetch(`${this.baseUrl}/api/relayer/withdraw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  public async submitAuditAttestation(proof: YieldAuditProof): Promise<{ success: boolean; id: string; shareUrl: string }> {
    const res = await fetch(`${this.baseUrl}/api/audit/attest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proof),
    });
    return res.json();
  }

  public async getAuditProof(proofHash: string): Promise<YieldAuditProof | null> {
    const res = await fetch(`${this.baseUrl}/api/audit/${proofHash}`);
    if (!res.ok) return null;
    return res.json();
  }

  public async getStrategyStats(): Promise<{ strategyA: any; strategyB: any; epoch: number }> {
    const res = await fetch(`${this.baseUrl}/api/strategies/stats`);
    if (!res.ok) throw new Error("Failed to fetch strategy stats");
    return res.json();
  }
}
