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
  if (flagged) return "#ef4444"; // red if news risk
  if (balance >= 500) return "#f59e0b"; // gold for large
  if (balance >= 200) return "#3b82f6"; // blue for medium
  return "#22c55e"; // green for small
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: CashPosition }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-semibold">{d.name}</p>
      <p className="text-gold-400">{formatUSD(d.balance)}</p>
      {d.currency && <p className="text-slate-500">Local: {d.currency}</p>}
      {d.flagged && (
        <p className="text-red-400 flex items-center gap-1 mt-1">
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
    <div className="border border-slate-800 rounded-lg bg-slate-900/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gold-400" />
          <span className="text-xs font-semibold text-white">Cash by Country</span>
          <span className="text-[10px] text-slate-600">Regional Risk</span>
        </div>
        <div className="flex items-center gap-3">
          {flaggedCount > 0 && (
            <span className="text-[10px] text-red-400 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              {flaggedCount} at risk
            </span>
          )}
          <span className="text-[10px] text-slate-500">Total: {formatUSD(total)}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}M`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
          <Bar dataKey="balance" radius={[0, 3, 3, 0]} maxBarSize={16}>
            {sorted.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.balance, entry.flagged)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-600">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> News risk</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-gold-500 inline-block" /> &gt;$500M</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" /> &gt;$200M</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" /> &lt;$200M</span>
      </div>
    </div>
  );
}
