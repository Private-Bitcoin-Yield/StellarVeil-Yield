# Vercel Deployment Guide: Stellar-VeilYield

This guide explains how to deploy the **Stellar-VeilYield** monorepo to **Vercel** as two independent projects:
1. **Frontend App (`apps/web`)**: Next.js App Router
2. **Backend API (`apps/api`)**: Hono Serverless API

---

## 1. Prerequisites

- A [Vercel](https://vercel.com) account.
- Vercel CLI installed globally:
  ```bash
  npm i -g vercel
  ```
- Stellar Testnet contracts deployed (run `pnpm run deploy:testnet` to populate `deployments/testnet.json`).

---

## 2. Deploying Backend API (`apps/api`)

### Step 1: Link Project in Vercel
In the root of the monorepo, deploy the API directory:
```bash
cd apps/api
vercel
```
Select:
- **Framework Preset**: Other / None
- **Root Directory**: `apps/api`
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist` (or serverless function entry `/api`)

### Step 2: Configure Environment Variables
Set the following environment variables in Vercel Project Settings:
```ini
PORT=3001
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VAULT_CONTRACT_ID=CD9W7R5ZVEILYIELDVAULTCONTRACT7777777777777777777777777777777
VERIFIER_CONTRACT_ID=CBY4D6WEM6G64O2XZJ7AOVWQLB42P3R6W7P3R7VEILYIELDVERIFIER
RELAYER_SECRET_KEY=SADMINEXAMPLESECRETKEYFORRELAYEREXECUTION77777777777777777
```

Deploy to production:
```bash
vercel --prod
```
Take note of your deployed API URL (e.g., `https://stellar-veilyield-api.vercel.app`).

---

## 3. Deploying Frontend App (`apps/web`)

### Step 1: Link Project in Vercel
```bash
cd apps/web
vercel
```
Select:
- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `pnpm run build`

### Step 2: Configure Environment Variables
Set the following variables in Vercel Project Settings:
```ini
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_VAULT_CONTRACT_ID=CD9W7R5ZVEILYIELDVAULTCONTRACT7777777777777777777777777777777
NEXT_PUBLIC_VERIFIER_CONTRACT_ID=CBY4D6WEM6G64O2XZJ7AOVWQLB42P3R6W7P3R7VEILYIELDVERIFIER
NEXT_PUBLIC_TBTC_TOKEN_ID=CCQ7O26U6L2K63CUBF3PVD5U2Q6R65UOBZ7S24DHYT3VEILYIELDTBTC
NEXT_PUBLIC_STRATEGY_A_ID=CD7K47V5K7Z26Q3A5JVEILYIELDSTRATEGYACONTRACT77777777777777777
NEXT_PUBLIC_STRATEGY_B_ID=CB9Z7X3O5JVEILYIELDSTRATEGYBCONTRACT7777777777777777777777777
NEXT_PUBLIC_AUDIT_ATTESTATION_ID=CA7P3R8W7ZVEILYIELDAUDITATTESTATIONCONTRACT7777777777777777777
NEXT_PUBLIC_API_URL=https://stellar-veilyield-api.vercel.app
```

Deploy to production:
```bash
vercel --prod
```

---

## 4. Automating Environment Variable Sync

Run the provided helper script to automatically pull from `deployments/testnet.json` and generate Vercel CLI import commands:
```bash
pnpm tsx scripts/sync-vercel-env.ts
```

---

## 5. Live Production URLs

- **Web Frontend**: [https://stellar-veil-yield.vercel.app](https://stellar-veil-yield.vercel.app)
- **API Backend**: [https://stellar-veil-yield-api.vercel.app](https://stellar-veil-yield-api.vercel.app)
- **Health Check**: [https://stellar-veil-yield-api.vercel.app/api/health](https://stellar-veil-yield-api.vercel.app/api/health)
