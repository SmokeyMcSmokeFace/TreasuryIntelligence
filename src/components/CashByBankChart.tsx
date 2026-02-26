"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { AlertTriangle, Building2 } from "lucide-react";
import { CashPosition } from "@/types";
import { formatUSD } from "@/lib/utils";

interface CashByBankChartProps {
  data: CashPosition[];
}

function getRiskLevel(balance: number, total: number, flagged?: boolean): "news" | "concentrated" | "normal" {
  if (flagged) return "news";
  if (balance / total > 0.2) return "concentrated";
  return "normal";
}

function getBarColor(risk: "news" | "concentrated" | "normal"): string {
  switch (risk) {
    case "news": return "#ef4444";
    case "concentrated": return "#f59e0b";
    default: return "#6366f1";
  }
}

const CustomTooltip = ({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: { payload: CashPosition }[];
  total: number;
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = ((d.balance / total) * 100).toFixed(1);
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-900 dark:text-white font-semibold">{d.name}</p>
      <p className="text-gehc-500 dark:text-gold-400">{formatUSD(d.balance)}</p>
      <p className="text-gray-500 dark:text-slate-400">{pct}% of total exposure</p>
      {d.flagged && (
        <p className="text-red-500 flex items-center gap-1 mt-1">
          <AlertTriangle className="w-3 h-3" /> News risk flagged
        </p>
      )}
      {d.balance / total > 0.2 && !d.flagged && (
        <p className="text-yellow-500 flex items-center gap-1 mt-1">
          <AlertTriangle className="w-3 h-3" /> Concentration risk
        </p>
      )}
    </div>
  );
};

export function CashByBankChart({ data }: CashByBankChartProps) {
  const sorted = [...data].sort((a, b) => b.balance - a.balance);
  const total = data.reduce((s, d) => s + d.balance, 0);
  const flaggedCount = data.filter((d) => d.flagged).length;
  const concentratedCount = data.filter((d) => !d.flagged && d.balance / total > 0.2).length;

  return (
    <div className="border border-gray-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gehc-500 dark:text-gold-400" />
          <span className="text-xs font-semibold text-gray-900 dark:text-white">Cash by Bank</span>
          <span className="text-[10px] text-gray-400 dark:text-slate-600">Counterparty Risk</span>
        </div>
        <div className="flex items-center gap-3">
          {flaggedCount > 0 && (
            <span className="text-[10px] text-red-500 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              {flaggedCount} news risk
            </span>
          )}
          {concentratedCount > 0 && (
            <span className="text-[10px] text-yellow-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {concentratedCount} concentrated
            </span>
          )}
          <span className="text-[10px] text-gray-400 dark:text-slate-500">Total: {formatUSD(total)}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={sorted.length * 30}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}M`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={105}
            interval={0}
          />
          <Tooltip
            content={<CustomTooltip total={total} />}
            cursor={{ fill: "rgba(96,34,166,0.04)" }}
          />
          <ReferenceLine
            x={total * 0.2}
            stroke="#f59e0b"
            strokeDasharray="3 3"
            strokeOpacity={0.4}
            label={{ value: "20%", position: "top", fontSize: 9, fill: "#f59e0b" }}
          />
          <Bar dataKey="balance" radius={[0, 3, 3, 0]} maxBarSize={16}>
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(getRiskLevel(entry.balance, total, entry.flagged))}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400 dark:text-slate-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> News risk</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block" /> &gt;20% conc.</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" /> Normal</span>
      </div>
    </div>
  );
}
