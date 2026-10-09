import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "../components/Navbar";

export const metadata: Metadata = {
  title: "Stellar VeilYield | Private Bitcoin Yield with Groth16 ZK Proofs",
  description: "Deposit tBTC into shielded Soroban vaults, earn simulated BTC yields across conservative and turbo strategies, and withdraw privately using Groth16 zero-knowledge proofs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-gray-100 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-white/10 py-6 text-center text-xs text-gray-500">
          <p>Stellar VeilYield • Powered by Soroban Protocol 29 BN254 Groth16 Host Pairings • Testnet Demo</p>
        </footer>
      </body>
    </html>
  );
}
