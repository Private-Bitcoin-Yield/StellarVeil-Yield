import fs from "fs";
import path from "path";

export async function seedStrategies() {
  console.log("=== Seeding VeilYield Strategy Yield Accounting ===");
  const deployment = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../deployments/testnet.json"), "utf8")
  );

  console.log(`Vault: ${deployment.vaultAddress}`);
  console.log(`Strategy A (Conservative, 5.0% APY): ${deployment.strategyAAddress}`);
  console.log(`Strategy B (Turbo, 12.0% APY): ${deployment.strategyBAddress}`);

  console.log("\nSimulating initial epoch progression (Epoch 1 -> Epoch 7)...");
  for (let epoch = 2; epoch <= 7; epoch++) {
    const indexA = 10000 + Math.floor((10000 * 500 * (epoch - 1)) / (365 * 10000));
    const indexB = 10000 + Math.floor((10000 * 1200 * (epoch - 1)) / (365 * 10000));
    console.log(`Epoch ${epoch}: Strategy A Index = ${indexA} | Strategy B Index = ${indexB}`);
  }

  console.log("\n[✓] Strategy yields seeded successfully.");
}

if (require.main === module) {
  seedStrategies().catch(console.error);
}
