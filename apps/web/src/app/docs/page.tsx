import { BookOpen, Shield, AlertTriangle, Layers, Lock, Cpu } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-amber-400" />
          Privacy Model & Cryptographic Limits
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          An honest, transparent breakdown of the privacy assumptions, anonymity set trade-offs, and simulation constraints in Stellar VeilYield.
        </p>
      </div>

      {/* 1. Anonymity Model & Fixed Denominations */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 space-y-4 border border-white/10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          1. Fixed Denominations & Anonymity Sets
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          Arbitrary deposit amounts destroy privacy through amount-matching heuristics.
          To eliminate this vector, Stellar VeilYield enforces three fixed pool denominations:
        </p>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="p-3 bg-surface-card rounded-xl border border-white/5 font-mono text-amber-400 font-bold">
            0.01 tBTC
          </div>
          <div className="p-3 bg-surface-card rounded-xl border border-white/5 font-mono text-amber-400 font-bold">
            0.10 tBTC
          </div>
          <div className="p-3 bg-surface-card rounded-xl border border-white/5 font-mono text-amber-400 font-bold">
            1.00 tBTC
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Your anonymity set is strictly defined by the number of other unspent notes in the same denomination pool.
        </p>
      </section>

      {/* 2. Epoch Bucketing & Anonymity Trade-off */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 space-y-4 border border-amber-500/20 bg-amber-950/10">
        <h2 className="text-lg font-bold text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          2. Honest Privacy Trade-off: Epoch Bucketing
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          Unlike zero-yield privacy mixers where all notes are fungible forever, yield accumulation requires knowing the deposit timeframe to compute accrued interest:
        </p>
        <div className="p-4 rounded-xl bg-surface font-mono text-xs text-emerald-300 border border-white/5">
          accrued_yield = denomination * (index_now / index_at_epoch - 1)
        </div>
        <div className="space-y-2 text-xs text-amber-200/90 leading-relaxed">
          <p>
            <strong>The Trade-off Plainly Stated:</strong> When withdrawing funds plus accrued yield, the smart contract must read the deposit epoch index. This publicly reveals which <em>epoch bucket</em> (1 epoch = 1 day) the note originated from.
          </p>
          <p>
            Consequently, an observer knows your note was deposited on Epoch <em>k</em>. If only 2 people deposited 0.1 tBTC during Epoch <em>k</em>, your anonymity set is 2. The dashboard displays live anonymity set counts so users can time deposits and withdrawals prudently.
          </p>
        </div>
      </section>

      {/* 3. Front-Running Protection */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 space-y-4 border border-white/10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-teal-400" />
          3. Front-Running Protection via Recipient Binding
        </h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          In naive privacy systems, an attacker observing a relayer transaction in the mempool could duplicate the zero-knowledge proof and substitute their own payout address.
        </p>
        <p className="text-xs text-gray-300 leading-relaxed">
          Stellar VeilYield prevents front-running by binding the recipient address directly into the R1CS public constraint system:
          <code className="block mt-2 p-3 bg-surface rounded-xl font-mono text-emerald-400 border border-white/5">
            signal input recipient;<br />
            signal recipient_binding;<br />
            recipient_binding &lt;== recipient * recipient;
          </code>
          The Groth16 proof is mathematically invalid for any recipient other than the intended destination.
        </p>
      </section>

      {/* 4. Simulated Aspects */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 space-y-4 border border-white/10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          4. Simulated vs Production Primitives
        </h2>
        <ul className="space-y-3 text-xs text-gray-300 list-disc list-inside">
          <li>
            <strong>tBTC Asset:</strong> Testnet asset issued by our testnet issuer keypair and wrapped by the Stellar Asset Contract (SAC). This is a stand-in for real Bitcoin.
          </li>
          <li>
            <strong>Yield Rates:</strong> Strategy yields are simulated via configurable per-epoch interest accrual (Strategy A = 5.0% APY, Strategy B = 12.0% APY) to demonstrate cross-epoch mathematical accounting without external DeFi dependency risk on testnet.
          </li>
          <li>
            <strong>ZK Proof Verification:</strong> Verifier contracts use Soroban native BN254 host functions (<code className="text-emerald-300">pairing_check</code> and <code className="text-emerald-300">g1_msm</code>) on Stellar Protocol 29 testnet. Real cryptographic verification is enforced on-chain.
          </li>
        </ul>
      </section>
    </div>
  );
}
