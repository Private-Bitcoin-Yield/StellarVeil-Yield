export const DENOMINATIONS = [
  { id: "0.01", label: "0.01 tBTC", stroops: "1000000", btc: 0.01 },
  { id: "0.1", label: "0.10 tBTC", stroops: "10000000", btc: 0.1 },
  { id: "1.0", label: "1.00 tBTC", stroops: "100000000", btc: 1.0 },
] as const;

export const STRATEGIES = [
  {
    id: 1,
    name: "Strategy A: Conservative Alpha",
    description: "Low-volatility yield simulated via algorithmic lending rate",
    apyBps: 500,
    apyPercent: "5.0%",
    riskLevel: "Low",
  },
  {
    id: 2,
    name: "Strategy B: High-Yield Turbo",
    description: "Enhanced yield simulated via cross-protocol basis spreads",
    apyBps: 1200,
    apyPercent: "12.0%",
    riskLevel: "Moderate",
  },
] as const;

export const NETWORK_CONFIG = {
  network: "testnet",
  rpcUrl: "https://soroban-testnet.stellar.org",
  horizonUrl: "https://horizon-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  merkleTreeDepth: 16,
  yieldScale: 10000,
  assetCode: "tBTC",
} as const;
