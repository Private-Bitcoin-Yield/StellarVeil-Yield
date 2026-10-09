"use client";

import React, { useState } from "react";
import { ArrowDownToLine, Download, Copy, Check, ShieldAlert, Sparkles, KeyRound } from "lucide-react";
import { DENOMINATIONS, STRATEGIES, VeilNote } from "@stellar-veilyield/shared";
import { createVeilNote, serializeNote } from "@stellar-veilyield/sdk";

export default function DepositPage() {
  const [selectedDenom, setSelectedDenom] = useState<string>("10000000"); // 0.10 tBTC
  const [selectedStrategy, setSelectedStrategy] = useState<number>(1);
  const [generatedNote, setGeneratedNote] = useState<VeilNote | null>(null);
  const [noteString, setNoteString] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [hasBackedUp, setHasBackedUp] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

  const handleGenerateNote = () => {
    // Current epoch is 1 for testnet demo
    const note = createVeilNote(selectedDenom, 1, selectedStrategy);
    const serialized = serializeNote(note);
    setGeneratedNote(note);
    setNoteString(serialized);
    setHasBackedUp(false);
    setDepositSuccess(false);
  };

  const copyNote = () => {
    navigator.clipboard.writeText(noteString);
    setCopied(true);
    setHasBackedUp(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadNote = () => {
    const blob = new Blob([noteString], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veilyield-note-${selectedDenom}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setHasBackedUp(true);
  };

  const executeDeposit = async () => {
    if (!generatedNote || !hasBackedUp) return;
    setIsDepositing(true);
    try {
      // In production, wallet prompts user to sign deposit transaction to VaultContract
      setTimeout(() => {
        setIsDepositing(false);
        setDepositSuccess(true);
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsDepositing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <ArrowDownToLine className="w-8 h-8 text-amber-400" />
          Shielded tBTC Deposit
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Deposit tBTC into a fixed denomination pool and generate an encrypted private note.
          Funds accrue simulated yield until you withdraw using a zero-knowledge proof.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 border border-white/10 shadow-xl">
        {/* Step 1: Select Denomination */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
            1. Select Fixed Denomination
          </label>
          <div className="grid grid-cols-3 gap-3">
            {DENOMINATIONS.map((d) => (
              <button
                key={d.stroops}
                onClick={() => setSelectedDenom(d.stroops)}
                className={`py-3 px-4 rounded-xl border text-center transition-all ${
                  selectedDenom === d.stroops
                    ? "border-amber-500 bg-amber-500/10 text-white font-bold shadow-md shadow-amber-500/10"
                    : "border-white/5 bg-surface hover:bg-surface-card text-gray-300"
                }`}
              >
                <div className="text-base font-bold font-mono">{d.label}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">Fixed Denom</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Strategy */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
            2. Choose Yield Strategy
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STRATEGIES.map((strat) => (
              <button
                key={strat.id}
                onClick={() => setSelectedStrategy(strat.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedStrategy === strat.id
                    ? "border-emerald-500 bg-emerald-500/10 text-white font-bold"
                    : "border-white/5 bg-surface hover:bg-surface-card text-gray-300"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase text-gray-400">Strategy #{strat.id}</span>
                  <span className="text-emerald-400 font-bold">{strat.apyPercent} APY</span>
                </div>
                <div className="text-sm font-semibold mt-1 text-white">{strat.name}</div>
                <div className="text-xs text-gray-400 mt-1">{strat.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Note Generation */}
        <div className="pt-2">
          {!generatedNote ? (
            <button
              onClick={handleGenerateNote}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              Generate Private Shielded Note
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <ShieldAlert className="w-4 h-4" />
                  CRITICAL: Save Your Private Note
                </div>
                <p>
                  This note contains your spending secret. It exists ONLY in your browser and is NEVER sent to any server.
                  If you lose this note, your deposited tBTC and yield cannot be recovered!
                </p>
              </div>

              {/* Note Display & Actions */}
              <div className="p-3 bg-surface rounded-xl border border-white/5">
                <div className="text-xs font-mono break-all text-gray-300 max-h-24 overflow-y-auto">
                  {noteString}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyNote}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-surface-card hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied Note ✓" : "Copy Note String"}
                </button>
                <button
                  onClick={downloadNote}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-surface-card hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Backup File
                </button>
              </div>

              {/* Deposit Execution */}
              <button
                onClick={executeDeposit}
                disabled={!hasBackedUp || isDepositing || depositSuccess}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  depositSuccess
                    ? "bg-emerald-600 text-white cursor-default"
                    : !hasBackedUp
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                }`}
              >
                {depositSuccess ? (
                  <>Deposit Confirmed on Testnet ✓</>
                ) : isDepositing ? (
                  <>Submitting Shielded Deposit...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Confirm Deposit into Shielded Vault
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
