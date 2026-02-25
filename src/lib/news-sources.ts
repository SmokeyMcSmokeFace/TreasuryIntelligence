import { TreasuryCategory } from "@/types";

export interface RssSource {
  name: string;
  url: string;
  defaultCategory: TreasuryCategory;
}

export interface GoogleNewsQuery {
  query: string;
  category: TreasuryCategory;
  label: string;
}

export const RSS_SOURCES: RssSource[] = [
  {
    name: "Reuters Business",
    url: "https://feeds.reuters.com/reuters/businessNews",
    defaultCategory: "macro",
  },
  {
    name: "CNBC Markets",
    url: "https://www.cnbc.com/id/10000664/device/rss/rss.html",
    defaultCategory: "macro",
  },
  {
    name: "MarketWatch",
    url: "https://feeds.marketwatch.com/marketwatch/topstories/",
    defaultCategory: "macro",
  },
  {
    name: "Financial Times",
    url: "https://www.ft.com/rss/home",
    defaultCategory: "general",
  },
  {
    name: "Barron's",
    url: "https://www.barrons.com/xml/rss/3_7551.xml",
    defaultCategory: "general",
  },
  {
    name: "Investopedia",
    url: "https://www.investopedia.com/feedbuilder/feed/getfeed/?feedName=rss_headline",
    defaultCategory: "general",
  },
];

export const GOOGLE_NEWS_QUERIES: GoogleNewsQuery[] = [
  { query: "treasury+cash+management+liquidity", category: "liquidity", label: "Liquidity & Cash" },
  { query: "capital+markets+corporate+bonds+debt", category: "capital-markets", label: "Capital Markets" },
  { query: "interest+rates+FX+currency+exchange", category: "fx-rates", label: "FX & Rates" },
  { query: "credit+rating+Moodys+SP+Fitch+downgrade", category: "credit-ratings", label: "Credit Ratings" },
  { query: "mergers+acquisitions+M%26A+deal", category: "ma", label: "M&A" },
  { query: "counterparty+risk+bank+failure+systemic", category: "risk", label: "Risk" },
  { query: "federal+reserve+central+bank+inflation+GDP", category: "macro", label: "Macro" },
  { query: "pension+fund+defined+benefit+retirement", category: "pensions", label: "Pensions" },
  { query: "geopolitical+risk+sanctions+regional+conflict", category: "geopolitical", label: "Geopolitical" },
  { query: "insurance+corporate+risk+coverage", category: "risk", label: "Insurance" },
];

export function buildGoogleNewsUrl(query: string): string {
  return `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
}
