import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const DEPLOYMENTS_PATH = path.resolve(__dirname, "../deployments/testnet.json");
const OUTPUT_DIR = path.resolve(__dirname, "../packages/sdk/src/bindings");

export function generateContractBindings() {
  console.log("=== Generating TypeScript Contract Bindings ===");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (!fs.existsSync(DEPLOYMENTS_PATH)) {
    console.warn("Deployments file not found, skipping binding generation.");
    return;
  }

  const deployments = JSON.parse(fs.readFileSync(DEPLOYMENTS_PATH, "utf-8"));
  console.log(`Target Vault Contract: ${deployments.vaultAddress}`);
  console.log(`Target Verifier Contract: ${deployments.verifierAddress}`);

  // Create generated bindings index
  const bindingsIndex = `// Auto-generated Soroban TypeScript Contract Bindings for StellarVeil-Yield
export const CONTRACT_ADDRESSES = {
  vault: "${deployments.vaultAddress}",
  verifier: "${deployments.verifierAddress}",
  strategyA: "${deployments.strategyAAddress}",
  strategyB: "${deployments.strategyBAddress}",
  auditAttestation: "${deployments.auditAttestationAddress}",
  tbtcToken: "${deployments.tbtcTokenAddress}",
} as const;

export const NETWORK_PASSPHRASE = "${deployments.networkPassphrase}";
export const RPC_URL = "${deployments.rpcUrl}";
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.ts"), bindingsIndex);
  console.log(`[✓] Generated contract bindings at: ${OUTPUT_DIR}/index.ts`);
}

if (require.main === module) {
  generateContractBindings();
}
