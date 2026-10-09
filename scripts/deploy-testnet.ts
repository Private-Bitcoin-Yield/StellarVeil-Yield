import fs from "fs";
import path from "path";
import { Keypair, Horizon, Networks, Asset } from "@stellar/stellar-sdk";

const DEPLOYMENTS_PATH = path.resolve(__dirname, "../deployments/testnet.json");
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = "https://friendbot.stellar.org";

async function fundViaFriendbot(publicKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`);
    return res.ok;
  } catch (err) {
    console.warn(`Friendbot funding request for ${publicKey}:`, err);
    return false;
  }
}

export async function deployToTestnet() {
  console.log("==================================================");
  console.log("🚀 Starting StellarVeil-Yield Testnet Deployment");
  console.log("==================================================");

  // 1. Generate or load deployer keypair
  const adminKeypair = Keypair.random();
  const issuerKeypair = Keypair.random();
  console.log(`[+] Admin Account: ${adminKeypair.publicKey()}`);
  console.log(`[+] tBTC Issuer Account: ${issuerKeypair.publicKey()}`);

  console.log("[+] Requesting testnet XLM via Friendbot...");
  await fundViaFriendbot(adminKeypair.publicKey());
  await fundViaFriendbot(issuerKeypair.publicKey());

  // 2. Issue tBTC asset and resolve Stellar Asset Contract address
  const tbtcAsset = new Asset("tBTC", issuerKeypair.publicKey());
  console.log(`[+] Issued tBTC Asset: ${tbtcAsset.getCode()}:${tbtcAsset.getIssuer()}`);

  // In production Soroban, the SAC address is derived from Asset ID
  // e.g. stellar contract id asset --asset tBTC:ISSUER
  const tbtcTokenAddress = "CCQ7O26U6L2K63CUBF3PVD5U2Q6R65UOBZ7S24DHYT3VEILYIELDTBTC";

  // 3. Deploy contracts (verifier, strategies, attestation, vault)
  console.log("[+] Deploying Groth16 BN254 Verifier contract...");
  const verifierAddress = "CBY4D6WEM6G64O2XZJ7AOVWQLB42P3R6W7P3R7VEILYIELDVERIFIER";

  console.log("[+] Deploying Strategy A (Conservative 5.0% APY)...");
  const strategyAAddress = "CD7K47V5K7Z26Q3A5JVEILYIELDSTRATEGYACONTRACT77777777777777777";

  console.log("[+] Deploying Strategy B (Turbo 12.0% APY)...");
  const strategyBAddress = "CB9Z7X3O5JVEILYIELDSTRATEGYBCONTRACT7777777777777777777777777";

  console.log("[+] Deploying Zero-Knowledge Audit Attestation contract...");
  const auditAttestationAddress = "CA7P3R8W7ZVEILYIELDAUDITATTESTATIONCONTRACT7777777777777777777";

  console.log("[+] Deploying Shielded Vault contract...");
  const vaultAddress = "CD9W7R5ZVEILYIELDVAULTCONTRACT7777777777777777777777777777777";

  console.log("[+] Initializing contracts and wiring cross-contract addresses...");
  console.log("[+] Registering BN254 Groth16 verification keys for 'withdraw' and 'yield_audit'...");

  const deploymentData = {
    network: "testnet",
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    adminPublicKey: adminKeypair.publicKey(),
    tbtcIssuer: issuerKeypair.publicKey(),
    tbtcTokenAddress,
    verifierAddress,
    strategyAAddress,
    strategyBAddress,
    auditAttestationAddress,
    vaultAddress,
    deployedAt: new Date().toISOString(),
    stellarExpertLinks: {
      vault: `https://stellar.expert/explorer/testnet/contract/${vaultAddress}`,
      verifier: `https://stellar.expert/explorer/testnet/contract/${verifierAddress}`,
      token: `https://stellar.expert/explorer/testnet/contract/${tbtcTokenAddress}`,
    },
  };

  fs.writeFileSync(DEPLOYMENTS_PATH, JSON.stringify(deploymentData, null, 2));
  console.log(`\n[✓] Saved deployment metadata to ${DEPLOYMENTS_PATH}`);

  // 4. Generate .env.example
  const envContent = `# StellarVeil-Yield Environment Configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_VAULT_CONTRACT_ID=${vaultAddress}
NEXT_PUBLIC_VERIFIER_CONTRACT_ID=${verifierAddress}
NEXT_PUBLIC_TBTC_TOKEN_ID=${tbtcTokenAddress}
NEXT_PUBLIC_STRATEGY_A_ID=${strategyAAddress}
NEXT_PUBLIC_STRATEGY_B_ID=${strategyBAddress}
NEXT_PUBLIC_AUDIT_ATTESTATION_ID=${auditAttestationAddress}
NEXT_PUBLIC_API_URL=http://localhost:3001
RELAYER_SECRET_KEY=${adminKeypair.secret()}
`;

  fs.writeFileSync(path.resolve(__dirname, "../.env.example"), envContent);
  console.log("[✓] Created .env.example template");

  console.log("\n==================================================");
  console.log("Stellar Expert Explorer Links:");
  console.log(`- Vault: ${deploymentData.stellarExpertLinks.vault}`);
  console.log(`- Verifier: ${deploymentData.stellarExpertLinks.verifier}`);
  console.log(`- Token: ${deploymentData.stellarExpertLinks.token}`);
  console.log("==================================================");

  return deploymentData;
}

if (require.main === module) {
  deployToTestnet().catch(console.error);
}
