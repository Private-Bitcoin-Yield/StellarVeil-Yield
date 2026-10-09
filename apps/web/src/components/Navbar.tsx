"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Sparkles, BookOpen, ArrowDownToLine, ArrowUpFromLine, BarChart3 } from "lucide-react";
import { WalletConnect } from "./WalletConnect";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/deposit", label: "Deposit", icon: ArrowDownToLine },
    { href: "/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { href: "/audit", label: "Audit View", icon: Sparkles },
    { href: "/docs", label: "Privacy Docs", icon: BookOpen },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-md">
            <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform duration-200" />
            </div>
          </div>
          <div>
            <span className="text-base font-bold bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Stellar VeilYield
            </span>
            <span className="block text-[10px] font-mono tracking-widest text-gray-400 uppercase">
              Zero-Knowledge BTC Yield
            </span>
          </div>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-white/10 text-white font-semibold"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-400" : "text-gray-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Wallet & Status */}
        <WalletConnect />
      </div>
    </nav>
  );
}
