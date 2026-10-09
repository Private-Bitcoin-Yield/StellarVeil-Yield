import { appState, recordDeposit, recordNullifier } from "../db";

export class IndexerService {
  private rpcUrl: string;
  private vaultAddress: string;
  private isPolling: boolean = false;

  constructor(rpcUrl: string, vaultAddress: string) {
    this.rpcUrl = rpcUrl;
    this.vaultAddress = vaultAddress;
  }

  public async syncEvents(): Promise<{ processedDeposits: number; processedWithdrawals: number }> {
    let processedDeposits = 0;
    let processedWithdrawals = 0;

    try {
      // In production Soroban RPC:
      // POST rpcUrl with { method: "getEvents", params: { startLedger: ..., filters: [{ contractIds: [vaultAddress] }] } }
      // The indexer parses contract events:
      // (symbol_short!("deposit"), leaf_index) -> recordDeposit
      // (symbol_short!("withdraw"), nullifier_hash) -> recordNullifier
    } catch (err) {
      console.warn("Event sync error:", err);
    }

    return { processedDeposits, processedWithdrawals };
  }

  public startPolling(intervalMs: number = 5000): void {
    if (this.isPolling) return;
    this.isPolling = true;
    setInterval(() => {
      this.syncEvents().catch(console.error);
    }, intervalMs);
  }
}
