import { CashPosition } from "@/types";

// Mock cash balances by country (USD millions)
// In production: pulled from TMS / ERP / bank reporting
export const CASH_BY_COUNTRY: CashPosition[] = [
  { name: "United States", balance: 847, currency: "USD" },
  { name: "Germany", balance: 318, currency: "EUR" },
  { name: "United Kingdom", balance: 276, currency: "GBP" },
  { name: "Japan", balance: 193, currency: "JPY" },
  { name: "Singapore", balance: 162, currency: "SGD" },
  { name: "Canada", balance: 138, currency: "CAD" },
  { name: "France", balance: 124, currency: "EUR" },
  { name: "Australia", balance: 91, currency: "AUD" },
  { name: "Brazil", balance: 73, currency: "BRL" },
  { name: "China", balance: 58, currency: "CNY" },
];

// Mock cash balances by banking counterparty (USD millions)
// In production: pulled from bank statements / TMS
export const CASH_BY_BANK: CashPosition[] = [
  { name: "JPMorgan Chase", balance: 423 },
  { name: "Bank of America", balance: 314 },
  { name: "Deutsche Bank", balance: 278 },
  { name: "HSBC", balance: 243 },
  { name: "Citibank", balance: 208 },
  { name: "Wells Fargo", balance: 183 },
  { name: "Barclays", balance: 152 },
  { name: "BNP Paribas", balance: 129 },
  { name: "Goldman Sachs", balance: 94 },
  { name: "Mizuho Bank", balance: 83 },
];

// Keywords to match against news items for risk flagging
export const COUNTRY_KEYWORDS: Record<string, string[]> = {
  "United States": ["united states", "u.s.", "us economy", "america", "federal reserve", "fed"],
  Germany: ["germany", "german", "deutsche", "bundesbank", "dax"],
  "United Kingdom": ["united kingdom", "u.k.", "uk", "britain", "british", "bank of england", "ftse"],
  Japan: ["japan", "japanese", "boj", "bank of japan", "nikkei", "yen"],
  Singapore: ["singapore", "mas", "singapore dollar"],
  Canada: ["canada", "canadian", "bank of canada", "cad"],
  France: ["france", "french", "banque de france", "cac"],
  Australia: ["australia", "australian", "rba", "aud"],
  Brazil: ["brazil", "brazilian", "bcb", "real", "brl"],
  China: ["china", "chinese", "pboc", "renminbi", "yuan", "cny"],
};

export const BANK_KEYWORDS: Record<string, string[]> = {
  "JPMorgan Chase": ["jpmorgan", "jp morgan", "jpm"],
  "Bank of America": ["bank of america", "bofa", "bac"],
  "Deutsche Bank": ["deutsche bank", "db"],
  HSBC: ["hsbc"],
  Citibank: ["citibank", "citigroup", "citi"],
  "Wells Fargo": ["wells fargo"],
  Barclays: ["barclays"],
  "BNP Paribas": ["bnp paribas", "bnp"],
  "Goldman Sachs": ["goldman sachs", "goldman", "gs"],
  "Mizuho Bank": ["mizuho"],
};
