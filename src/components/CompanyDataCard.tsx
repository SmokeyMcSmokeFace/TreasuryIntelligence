"use client";

import { Building2, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { CompanySnapshot } from "@/lib/edgar";

interface Props {
  snapshot: CompanySnapshot | null;
}

function fmt(val: number | null, decimals = 1): string {
  if (val == null) return "—";
  const b = val / 1e9;
  if (Math.abs(b) >= 1) return `$${b.toFixed(decimals)}B`;
  return `$${(val / 1e6).toFixed(0)}M`;
}

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[10px] text-gray-400 dark:text-slate-500">{label}</span>
      <span className="text-xs font-medium text-gray-800 dark:text-slate-200">
        {value}
        {sub && <span className="text-[10px] text-gray-400 dark:text-slate-500 ml-1">{sub}</span>}
      </span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#0d1526] border border-gray-100 dark:border-slate-700 rounded px-2 py-1.5 text-[10px] shadow-sm">
      <p className="text-gray-500 dark:text-slate-400">{payload[0].payload.year}</p>
      <p className="text-gehc-500 dark:text-gold-400 font-medium">{fmt(payload[0].value)}</p>
    </div>
  );
}

export function CompanyDataCard({ snapshot }: Props) {
  if (!snapshot) {
    return (
      <div className="border border-gray-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-gehc-500 dark:text-gold-400" />
          <span className="text-xs font-semibold text-gray-900 dark:text-white">GE HealthCare (GEHC)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500 py-4 justify-center">
          <RefreshCw className="w-3.5 h-3.5" />
          Run Refresh Intel to load financial data
        </div>
      </div>
    );
  }

  const { maturityLadder, periodEnd } = snapshot;
  const baseYear = parseInt(periodEnd?.slice(0, 4) ?? "2025");

  const maturityData = [
    { year: String(baseYear + 1), value: maturityLadder.year1 ?? 0 },
    { year: String(baseYear + 2), value: maturityLadder.year2 ?? 0 },
    { year: String(baseYear + 3), value: maturityLadder.year3 ?? 0 },
    { year: String(baseYear + 4), value: maturityLadder.year4 ?? 0 },
    { year: String(baseYear + 5), value: maturityLadder.year5 ?? 0 },
    { year: `>${baseYear + 5}`, value: maturityLadder.afterYear5 ?? 0 },
  ].filter((d) => d.value > 0);

  const netDebt =
    snapshot.longTermDebt != null && snapshot.cash != null
      ? snapshot.longTermDebt - snapshot.cash
      : null;

  const ebitda =
    snapshot.operatingIncome != null && snapshot.amortization != null
      ? snapshot.operatingIncome + snapshot.amortization
      : null;

  const periodLabel =
    snapshot.filingType === "10-K"
      ? `FY${baseYear}`
      : `${snapshot.periodEnd} ${snapshot.filingType}`;

  return (
    <div className="border border-gray-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gehc-500 dark:text-gold-400" />
          <span className="text-xs font-semibold text-gray-900 dark:text-white">GE HealthCare (GEHC)</span>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-slate-600">{periodLabel} · {snapshot.filingType}</span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Key metrics */}
        <div className="space-y-1.5">
          <MetricRow label="Revenue" value={fmt(snapshot.revenue)} />
          <MetricRow label="Net Income" value={fmt(snapshot.netIncome)} />
          <MetricRow label="EBITDA (est)" value={fmt(ebitda)} />
          <MetricRow label="Operating CF" value={fmt(snapshot.operatingCashFlow)} />
          <div className="border-t border-gray-100 dark:border-slate-800/60 my-1.5" />
          <MetricRow label="Cash" value={fmt(snapshot.cash)} />
          <MetricRow label="Total Debt" value={fmt(snapshot.longTermDebt)} />
          <MetricRow label="Net Debt" value={fmt(netDebt)} />
          <MetricRow label="Interest Expense" value={fmt(snapshot.interestExpense)} />
        </div>

        {/* Maturity ladder chart */}
        {maturityData.length > 0 && (
          <>
            <div className="border-t border-gray-100 dark:border-slate-800/60 pt-2">
              <p className="text-[10px] text-gray-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                Debt Maturity Ladder
              </p>
              <ResponsiveContainer width="100%" height={90}>
                <BarChart data={maturityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 9, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(96,34,166,0.04)" }} />
                  <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={28}>
                    {maturityData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.value > 1_500_000_000
                            ? "#ef4444"
                            : entry.value > 800_000_000
                            ? "#f59e0b"
                            : "#6022a6"
                        }
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Footer */}
        <p className="text-[9px] text-gray-300 dark:text-slate-700 pt-1 border-t border-gray-100 dark:border-slate-800/40">
          SEC EDGAR · auto-refreshed on new filing · filed {snapshot.filingDate}
        </p>
      </div>
    </div>
  );
}
