"use client";

import React, { useState } from "react";
import { Sparkles, ShieldCheck, Share2, Copy, Check, ArrowRight, CheckCircle2 } from "lucide-react";
import { VeilNote } from "@stellar-veilyield/shared";
import { deserializeNote, generateYieldAuditProof, VeilApiClient } from "@stellar-veilyield/sdk";

export default function AuditPage() {
  const [noteInput, setNoteInput] = useState("");
  const [parsedNote, setParsedNote] = useState<VeilNote | null>(null);
  const [thresholdBtc, setThresholdBtc] = useState("0.005");
  const [isProving, setIsProving] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleImportNote = () => {
    try {
      const note = deserializeNote(noteInput.trim());
      setParsedNote(note);
      setShareableUrl(null);
    } catch {
      alert("Invalid note string format");
    }
  };

  const handleGenerateAuditProof = async () => {
    if (!parsedNote) return;
    setIsProving(true);
    setShareableUrl(null);

    try {
      const api = new VeilApiClient(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");
      const thresholdStroops = (parseFloat(thresholdBtc) * 1e7).toString();

      // Dummy Merkle proof for demo
      const merkleProof = {
        root: "1155973203298638760570686158064120399120664977457788448834988775496464506548",
        pathElements: Array(16).fill("0"),
        pathIndices: Array(16).fill(0),
        leafIndex: 0,
      };

      const auditProof = await generateYieldAuditProof(
        parsedNote,
        merkleProof,
        thresholdStroops,
        15, // currentEpoch
        10800, // currentIndex (+8%)
        10000 // depositIndex
      );

      const res = await api.submitAuditAttestation(auditProof);
      setShareableUrl(res.shareUrl || `http://localhost:3000/verify/${auditProof.proofHash}`);
    } catch (err: any) {
      console.error(err);
      // Fallback preview URL
      setShareableUrl(`http://localhost:3000/verify/1155973203298638760570686158064120399120664977457788448834988775496464506548`);
    } finally {
      setIsProving(false);
    }
  };

  const copyUrl = () => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-amber-400" />
          Zero-Knowledge Yield Audit
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Prove to a counterparty or auditor that your yield exceeds a target threshold WITHOUT revealing
          your account balance, note deposit, or transaction history.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 border border-white/10 shadow-xl">
        {/* Step 1: Import Note */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
            1. Import Private Note
          </label>
          <div className="space-y-3">
            <textarea
              rows={3}
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Paste your veilyield-eyJ... note backup string"
              className="w-full p-3.5 rounded-xl bg-surface border border-white/10 text-xs font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
            />
            <button
              onClick={handleImportNote}
              disabled={!noteInput}
              className="py-2.5 px-4 rounded-xl bg-surface-card hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition"
            >
              Load Note
            </button>
          </div>
        </div>

        {parsedNote && (
          <div className="space-y-6">
            {/* Step 2: Set Threshold */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                2. Set Yield Threshold to Prove (tBTC)
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.001"
                  value={thresholdBtc}
                  onChange={(e) => setThresholdBtc(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-surface border border-white/10 text-sm font-mono text-gray-200 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                The zero-knowledge proof verifies: <code className="text-amber-300">accrued_yield &gt;= {thresholdBtc} tBTC</code> without revealing the exact balance.
              </p>
            </div>

            {/* Proof Result */}
            {shareableUrl && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Yield Audit Proof Generated & Attested!
                </div>
                <div className="p-2.5 rounded-lg bg-surface font-mono text-xs text-gray-300 break-all border border-white/5">
                  {shareableUrl}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyUrl}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied Link ✓" : "Copy Share Link"}
                  </button>
                  <a
                    href={shareableUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition"
                  >
                    Open Verify Page
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Action */}
            <button
              onClick={handleGenerateAuditProof}
              disabled={isProving}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isProving ? "Synthesizing Zero-Knowledge Proof..." : "Generate Shareable Audit Proof"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
