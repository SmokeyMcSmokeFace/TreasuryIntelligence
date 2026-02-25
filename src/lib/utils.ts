import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function urgencyColor(urgency: number): string {
  switch (urgency) {
    case 5: return "text-red-400 border-red-500 bg-red-950/40";
    case 4: return "text-orange-400 border-orange-500 bg-orange-950/40";
    case 3: return "text-yellow-400 border-yellow-600 bg-yellow-950/30";
    case 2: return "text-blue-400 border-blue-700 bg-blue-950/30";
    default: return "text-slate-400 border-slate-700 bg-slate-900/30";
  }
}

export function urgencyLabel(urgency: number): string {
  switch (urgency) {
    case 5: return "CRITICAL";
    case 4: return "HIGH";
    case 3: return "MEDIUM";
    case 2: return "LOW";
    default: return "INFO";
  }
}

export function formatUSD(millions: number): string {
  if (millions >= 1000) return `$${(millions / 1000).toFixed(1)}B`;
  return `$${millions}M`;
}
