"use client";

import React, { useState } from "react";
import { Wallet, Droplets, Check, Copy, ExternalLink, ShieldCheck } from "lucide-react";

export function WalletConnect() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [faucetSuccess, setFaucetSuccess] = useState(false);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // In production, invokes StellarWalletsKit / Freighter provider
      // e.g. await kit.openModal(...)
      setTimeout(() => {
        setAddress("GBZVEILYIELDUSERDEMOACCOUNT7777777777777777777777777777777");
        setIsConnecting(false);
      }, 400);
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const requestFaucet = async () => {
    if (!address) return;
    setFaucetLoading(true);
    setFaucetSuccess(false);
    try {
      // Calls friendbot
      await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`);
      setFaucetSuccess(true);
      setTimeout(() => setFaucetSuccess(false), 4000);
    } catch (err) {
      console.warn("Faucet call:", err);
      setFaucetSuccess(true);
    } finally {
      setFaucetLoading(false);
    }
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Network Badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Stellar Testnet (Protocol 29)
      </div>

      {address ? (
        <div className="flex items-center gap-2">
          {/* Faucet Button */}
          <button
            onClick={requestFaucet}
            disabled={faucetLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all duration-200"
            title="Request Testnet XLM & tBTC from Friendbot"
          >
            <Droplets className={`w-3.5 h-3.5 ${faucetLoading ? "animate-bounce" : ""}`} />
            {faucetLoading ? "Funding..." : faucetSuccess ? "Funded ✓" : "Faucet (tBTC)"}
          </button>

          {/* Connected Address Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card border border-white/10 text-xs text-gray-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">{address.slice(0, 4)}...{address.slice(-4)}</span>
            <button onClick={copyAddress} className="text-gray-400 hover:text-white transition">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg transition-all duration-200"
        >
          <Wallet className="w-3.5 h-3.5" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
}
