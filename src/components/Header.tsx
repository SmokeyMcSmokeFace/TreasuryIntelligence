"use client";

import { useState, useRef, useEffect } from "react";
import { RefreshCw, Shield, TrendingUp, AlertTriangle, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  newsCount: number;
  criticalCount: number;
  lastRefresh?: string;
}

export function Header({
  onRefresh,
  isRefreshing,
  newsCount,
  criticalCount,
  lastRefresh,
}: HeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const now = new Date();

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="border-b border-slate-800 bg-navy-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Brand + dropdown menu */}
        <div className="flex items-center gap-3">
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex items-center justify-center w-8 h-8 rounded border transition-all ${
                menuOpen
                  ? "bg-gold-500/30 border-gold-500/60"
                  : "bg-gold-500/20 border-gold-500/40 hover:bg-gold-500/30 hover:border-gold-500/60"
              }`}
              title="Menu"
            >
              <Shield className="w-4 h-4 text-gold-400" />
            </button>

            {menuOpen && (
              <div className="absolute top-10 left-0 z-50 w-44 border border-slate-700 rounded-lg bg-[#0d1526] shadow-2xl overflow-hidden">
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-gold-400/70" />
                  Settings
                </Link>
              </div>
            )}
          </div>

          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">
              Treasury Intelligence Platform
            </h1>
            <p className="text-xs text-slate-500">{dateStr}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            <span>
              <span className="text-white font-medium">{newsCount}</span> items
            </span>
          </div>
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 text-xs animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400 font-medium">
                {criticalCount} critical alert{criticalCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          {lastRefresh && (
            <span className="text-xs text-slate-600">Updated {lastRefresh}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded border border-gold-600/50 bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 hover:border-gold-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {isRefreshing ? "Refreshing..." : "Refresh Intel"}
            </span>
          </button>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
