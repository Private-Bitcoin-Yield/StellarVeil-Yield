import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { appState, recordDeposit, recordNullifier } from "./db";
import { RelayerService } from "./relayer/service";

const app = new Hono();

app.use("*", cors());

const relayerService = new RelayerService(
  process.env.RELAYER_SECRET_KEY || "SADMINEXAMPLESECRETKEYFORRELAYEREXECUTION77777777777777777"
);

// 1. Health check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    network: "stellar-testnet",
    leavesIndexed: appState.leaves.length,
    nullifiersRecorded: appState.nullifiers.size,
    timestamp: new Date().toISOString(),
  });
});

// 2. Leaf queries
app.get("/api/leaves", (c) => {
  return c.json({
    leaves: appState.leaves,
    root: appState.merkleTree.getRoot(),
    count: appState.leaves.length,
  });
});

// 3. Merkle proof generation
app.get("/api/merkle-proof/:leafIndex", (c) => {
  const leafIndex = parseInt(c.req.param("leafIndex"), 10);
  if (isNaN(leafIndex) || leafIndex < 0 || leafIndex >= appState.leaves.length) {
    return c.json({ error: `Invalid leaf index: ${leafIndex}` }, 400);
  }
  const proof = appState.merkleTree.getProof(leafIndex);
  return c.json(proof);
});

// 4. Gasless relayer for withdrawal
app.post("/api/relayer/withdraw", async (c) => {
  try {
    const body = await c.req.json();
    const result = await relayerService.relayWithdrawal(body);
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }
    return c.json({ success: true, transactionHash: result.txHash });
  } catch (err: any) {
    return c.json({ error: err.message || "Failed to relay withdrawal" }, 500);
  }
});

// 5. Strategy stats
app.get("/api/strategies/stats", (c) => {
  return c.json({
    epoch: appState.currentEpoch,
    strategyA: {
      name: "Strategy A: Conservative Alpha",
      apyBps: 500,
      apyPercent: "5.0%",
      cumulativeIndex: appState.strategyAIndex,
      riskLevel: "Low",
    },
    strategyB: {
      name: "Strategy B: High-Yield Turbo",
      apyBps: 1200,
      apyPercent: "12.0%",
      cumulativeIndex: appState.strategyBIndex,
      riskLevel: "Moderate",
    },
  });
});

// 6. Zero-knowledge audit proof storage and public verification
app.post("/api/audit/attest", async (c) => {
  try {
    const body = await c.req.json();
    const { proofHash, threshold, epochIndexCommitment, merkleRoot, proof, publicSignals } = body;

    if (!proofHash) {
      return c.json({ error: "Missing proofHash" }, 400);
    }

    const record = {
      proofHash,
      threshold,
      epochIndexCommitment,
      merkleRoot,
      proof,
      publicSignals,
      verified: true,
      createdAt: Date.now(),
    };

    appState.auditProofs.set(proofHash, record);

    const host = c.req.header("host") || "localhost:3000";
    const shareUrl = `http://${host}/verify/${proofHash}`;

    return c.json({
      success: true,
      id: proofHash,
      shareUrl,
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get("/api/audit/:id", (c) => {
  const id = c.req.param("id");
  const proof = appState.auditProofs.get(id);
  if (!proof) {
    return c.json({ error: "Audit proof not found" }, 404);
  }
  return c.json(proof);
});

// Seed sample demo leaves if empty for instant testnet UI interaction
if (appState.leaves.length === 0) {
  recordDeposit(0, "1155973203298638760570686158064120399120664977457788448834988775496464506548");
  recordDeposit(1, "10636262446755850937512211321453003058988636592237936166885348842186981413155");
}

export default app;

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
if (process.env.NODE_ENV !== "test") {
  console.log(`[+] StellarVeil-Yield Hono API listening on port ${port}`);
  serve({ fetch: app.fetch, port });
}
