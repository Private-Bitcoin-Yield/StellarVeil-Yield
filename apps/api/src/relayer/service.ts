import { z } from "zod";
import { appState, isNullifierSpent, recordNullifier } from "../db";

export const WithdrawRequestSchema = z.object({
  proof: z.object({
    a: z.array(z.string()).length(2),
    b: z.array(z.array(z.string()).length(2)).length(2),
    c: z.array(z.string()).length(2),
  }),
  publicSignals: z.array(z.string()).min(5),
  merkleRoot: z.string().min(1),
  nullifierHash: z.string().min(1),
  recipient: z.string().startsWith("G").length(56),
  denomination: z.string(),
  epoch: z.number().int().positive(),
});

export type WithdrawRequest = z.infer<typeof WithdrawRequestSchema>;

export class RelayerService {
  private relayerSecretKey: string;
  private submissionRateMap = new Map<string, number>();

  constructor(relayerSecretKey: string) {
    this.relayerSecretKey = relayerSecretKey;
  }

  public async relayWithdrawal(request: WithdrawRequest): Promise<{ success: boolean; txHash?: string; error?: string }> {
    // 1. Zod input validation
    const parsed = WithdrawRequestSchema.safeParse(request);
    if (!parsed.success) {
      return { success: false, error: `Invalid payload: ${parsed.error.message}` };
    }

    const { nullifierHash, recipient, merkleRoot } = parsed.data;

    // 2. Rate limiting check (max 1 request per recipient per 5 seconds)
    const now = Date.now();
    const lastSub = this.submissionRateMap.get(recipient) || 0;
    if (now - lastSub < 5000) {
      return { success: false, error: "Rate limit exceeded. Please wait a moment." };
    }
    this.submissionRateMap.set(recipient, now);

    // 3. Double-spend prevention check
    if (isNullifierSpent(nullifierHash)) {
      return { success: false, error: "Nullifier has already been spent. Double withdrawal rejected." };
    }

    // 4. Mark nullifier spent in indexer state
    recordNullifier(nullifierHash);

    // 5. Build and submit transaction with relayer paying gas fees
    // In production, relayer signs and submits transaction via Horizon/Soroban RPC
    const dummyTxHash = "0x" + Buffer.from(nullifierHash + recipient + Date.now().toString()).toString("hex").slice(0, 64);

    return {
      success: true,
      txHash: dummyTxHash,
    };
  }
}
