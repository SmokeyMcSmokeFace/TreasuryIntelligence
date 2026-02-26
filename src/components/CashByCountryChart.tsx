"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AlertTriangle, Globe } from "lucide-react";
import { CashPosition } from "@/types";
import { formatUSD } from "@/lib/utils";

interface CashByCountryChartProps {
  data: CashPosition[];
}

function getBarColor(balance: number, flagged?: boolean): string {
  if (flagged) return "#ef4444";
  if (balance >= 500) return "#f59e0b";
  if (balance >= 200) return "#3b82f6";
  return "#22c55e";
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: CashPosition }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-gray-900 dark:text-white font-semibold">{d.name}</p>
      <p className="text-gehc-500 dark:text-gold-400">{formatUSD(d.balance)}</p>
      {d.currency && <p className="text-gray-400 dark:text-slate-500">Local: {d.currency}</p>}
      {d.flagged && (
        <p className="text-red-500 flex items-center gap-1 mt-1">
          <AlertTriangle className="w-3 h-3" /> News risk flagged
        </p>
      )}
    </div>
  );
};

export function CashByCountryChart({ data }: CashByCountryChartProps) {
  const sorted = [...data].sort((a, b) => b.balance - a.balance);
  const flaggedCount = data.filter((d) => d.flagged).length;
  const total = data.reduce((s, d) => s + d.balance, 0);

  return (
    <div className="border border-gray-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/40 shadow-sm dark:shadow-none p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gehc-500 dark:text-gold-400" />
          <span className="text-xs font-semibold text-gray-900 dark:text-white">Cash by Country</span>
          <span className="text-[10px] text-gray-400 dark:text-slate-600">Regional Risk</span>
        </div>
        <div className="flex items-center gap-3">
          {flaggedCount > 0 && (
            <span className="text-[10px] text-red-500 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              {flaggedCount} at risk
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(96,34,166,0.04)" }} />
          <Bar dataKey="balance" radius={[0, 3, 3, 0]} maxBarSize={16}>
            {sorted.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.balance, entry.flagged)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400 dark:text-slate-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> News risk</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block" /> &gt;$500M</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" /> &gt;$200M</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" /> &lt;$200M</span>
      </div>
    </div>
  );
}
