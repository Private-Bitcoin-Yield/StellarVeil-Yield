import fs from "fs";
import path from "path";

function main() {
  const deploymentsPath = path.resolve(__dirname, "../deployments/testnet.json");
  if (!fs.existsSync(deploymentsPath)) {
    console.error("[-] deployments/testnet.json not found. Run pnpm run deploy:testnet first.");
    process.exit(1);
  }

  const d = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  console.log("=== Vercel Environment Variable Sync Commands ===\n");

  console.log("# Run these commands for apps/web project in Vercel:");
  const webEnv = [
    `vercel env add NEXT_PUBLIC_STELLAR_NETWORK production testnet`,
    `vercel env add NEXT_PUBLIC_SOROBAN_RPC_URL production "${d.rpcUrl}"`,
    `vercel env add NEXT_PUBLIC_VAULT_CONTRACT_ID production "${d.vaultAddress}"`,
    `vercel env add NEXT_PUBLIC_VERIFIER_CONTRACT_ID production "${d.verifierAddress}"`,
    `vercel env add NEXT_PUBLIC_TBTC_TOKEN_ID production "${d.tbtcTokenAddress}"`,
    `vercel env add NEXT_PUBLIC_STRATEGY_A_ID production "${d.strategyAAddress}"`,
    `vercel env add NEXT_PUBLIC_STRATEGY_B_ID production "${d.strategyBAddress}"`,
    `vercel env add NEXT_PUBLIC_AUDIT_ATTESTATION_ID production "${d.auditAttestationAddress}"`,
  ];
  webEnv.forEach((cmd) => console.log(cmd));

  console.log("\n# Run these commands for apps/api project in Vercel:");
  const apiEnv = [
    `vercel env add STELLAR_NETWORK production testnet`,
    `vercel env add SOROBAN_RPC_URL production "${d.rpcUrl}"`,
    `vercel env add VAULT_CONTRACT_ID production "${d.vaultAddress}"`,
    `vercel env add VERIFIER_CONTRACT_ID production "${d.verifierAddress}"`,
  ];
  apiEnv.forEach((cmd) => console.log(cmd));

  console.log("\n[✓] Environment sync plan ready.");
}

main();
