"use client";

import Link from "next/link";
import { Shield, Sparkles, TrendingUp, Layers, Users, ArrowUpRight, Lock, CheckCircle2 } from "lucide-react";
import { DENOMINATIONS, STRATEGIES } from "@stellar-veilyield/shared";

export default function DashboardPage() {
  const anonymitySets = [
    { denom: "0.01 tBTC", deposits: 42, volume: "0.42 tBTC", status: "Healthy" },
    { denom: "0.10 tBTC", deposits: 28, volume: "2.80 tBTC", status: "Moderate" },
    { denom: "1.00 tBTC", deposits: 14, volume: "14.00 tBTC", status: "Growing" },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 sm:p-12 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            Zero-Knowledge Privacy on Stellar
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Private Bitcoin Yield Powered by{" "}
            <span className="bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Groth16 ZK Proofs
            </span>
          </h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
            Deposit tBTC into shielded Soroban vaults, earn algorithmic yield across customizable strategies,
            and withdraw directly to any fresh address using native BN254 Groth16 pairings without linking deposit history.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/deposit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition-all duration-200"
            >
              Deposit tBTC
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/withdraw"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface hover:bg-surface-card text-white font-semibold text-sm border border-white/10 transition-colors"
            >
              Shielded Withdrawal
            </Link>
            <Link
              href="/audit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 font-semibold text-sm border border-emerald-500/30 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Generate Audit Proof
            </Link>
          </div>
        </div>
      </div>

      {/* Strategy APYs Grid */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Yield Strategies (Simulated APY)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STRATEGIES.map((strat) => (
            <div key={strat.id} className="glass-card rounded-2xl p-6 border border-white/10 relative group">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Strategy #{strat.id}</span>
                  <h3 className="text-lg font-bold text-white mt-1">{strat.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400">{strat.apyPercent}</span>
                  <span className="block text-[11px] text-gray-400">Annualized Yield</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 mt-3">{strat.description}</p>
              <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span>Risk Profile: <strong className="text-gray-200">{strat.riskLevel}</strong></span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Authorized by Vault
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anonymity Sets Breakdown */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          Live Anonymity Sets & Privacy Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {anonymitySets.map((item) => (
            <div key={item.denom} className="glass-card rounded-2xl p-5 border border-white/10">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Denomination Pool</span>
                <span className="px-2 py-0.5 rounded bg-white/5 text-amber-300 font-medium">{item.status}</span>
              </div>
              <div className="text-xl font-bold text-white mt-2 font-mono">{item.denom}</div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-400">Shielded Notes:</span>
                <strong className="text-white font-mono">{item.deposits}</strong>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-gray-400">Active Pool TVL:</span>
                <strong className="text-white font-mono">{item.volume}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
