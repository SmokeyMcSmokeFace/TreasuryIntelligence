"use client";

import { TreasuryCategory, CATEGORY_META } from "@/types";

const ALL_CATEGORIES: { key: "all" | TreasuryCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "liquidity", label: "Liquidity" },
  { key: "capital-markets", label: "Capital Mkts" },
  { key: "fx-rates", label: "FX & Rates" },
  { key: "credit-ratings", label: "Credit" },
  { key: "risk", label: "Risk" },
  { key: "macro", label: "Macro" },
  { key: "ma", label: "M&A" },
  { key: "geopolitical", label: "Geopolitical" },
  { key: "pensions", label: "Pensions" },
];

interface CategoryTabsProps {
  active: "all" | TreasuryCategory;
  onChange: (cat: "all" | TreasuryCategory) => void;
  counts: Record<string, number>;
}

export function CategoryTabs({ active, onChange, counts }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-1 px-6 py-2 border-b border-slate-800/60 overflow-x-auto scrollbar-none">
      {ALL_CATEGORIES.map(({ key, label }) => {
        const count = key === "all" ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[key] ?? 0);
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all ${
              isActive
                ? "bg-gold-500/20 text-gold-400 border border-gold-600/50"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent"
            }`}
          >
            <span>{label}</span>
            {count > 0 && (
              <span
                className={`text-[10px] px-1 py-0.5 rounded ${
                  isActive
                    ? "bg-gold-500/30 text-gold-300"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
