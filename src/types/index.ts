export type TreasuryCategory =
  | "liquidity"
  | "capital-markets"
  | "fx-rates"
  | "credit-ratings"
  | "ma"
  | "risk"
  | "macro"
  | "pensions"
  | "geopolitical"
  | "general";

export const CATEGORY_META: Record<
  TreasuryCategory,
  { label: string; color: string; bgColor: string }
> = {
  liquidity: { label: "Liquidity & Cash", color: "text-cyan-400", bgColor: "bg-cyan-900/30 border-cyan-800" },
  "capital-markets": { label: "Capital Markets", color: "text-blue-400", bgColor: "bg-blue-900/30 border-blue-800" },
  "fx-rates": { label: "FX & Rates", color: "text-purple-400", bgColor: "bg-purple-900/30 border-purple-800" },
  "credit-ratings": { label: "Credit & Ratings", color: "text-orange-400", bgColor: "bg-orange-900/30 border-orange-800" },
  ma: { label: "M&A", color: "text-pink-400", bgColor: "bg-pink-900/30 border-pink-800" },
  risk: { label: "Risk & Insurance", color: "text-red-400", bgColor: "bg-red-900/30 border-red-800" },
  macro: { label: "Macro & Markets", color: "text-green-400", bgColor: "bg-green-900/30 border-green-800" },
  pensions: { label: "Pensions", color: "text-teal-400", bgColor: "bg-teal-900/30 border-teal-800" },
  geopolitical: { label: "Geopolitical", color: "text-yellow-400", bgColor: "bg-yellow-900/30 border-yellow-800" },
  general: { label: "General", color: "text-slate-400", bgColor: "bg-slate-800/30 border-slate-700" },
};

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  category: TreasuryCategory;
  urgency: 1 | 2 | 3 | 4 | 5;
  fetchedAt: string;
  aiSummary?: string;
}

export interface DailyBriefing {
  date: string;
  content: string;
  generatedAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CashPosition {
  name: string;
  balance: number; // USD millions
  currency?: string;
  flagged?: boolean; // true if relevant news found
}
