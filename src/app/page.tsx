"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { CategoryTabs } from "@/components/CategoryTabs";
import { DailyBriefing } from "@/components/DailyBriefing";
import { NewsFeed } from "@/components/NewsFeed";
import { ChatPanel } from "@/components/ChatPanel";
import { CashByCountryChart } from "@/components/CashByCountryChart";
import { CashByBankChart } from "@/components/CashByBankChart";
import { NewsItem, TreasuryCategory, DailyBriefing as BriefingType, CashPosition } from "@/types";
import { CASH_BY_COUNTRY, CASH_BY_BANK, COUNTRY_KEYWORDS, BANK_KEYWORDS } from "@/lib/mock-data";
import { timeAgo } from "@/lib/utils";

// Cross-reference news with cash positions to flag risks
function flagRisks(
  news: NewsItem[],
  countries: CashPosition[],
  banks: CashPosition[]
): { countries: CashPosition[]; banks: CashPosition[] } {
  const allText = news
    .map((n) => `${n.title} ${n.description}`.toLowerCase())
    .join(" ");

  const flaggedCountries = countries.map((c) => ({
    ...c,
    flagged: (COUNTRY_KEYWORDS[c.name] ?? []).some((kw) => allText.includes(kw)),
  }));

  const flaggedBanks = banks.map((b) => ({
    ...b,
    flagged: (BANK_KEYWORDS[b.name] ?? []).some((kw) => allText.includes(kw)),
  }));

  return { countries: flaggedCountries, banks: flaggedBanks };
}

export default function Dashboard() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [briefing, setBriefing] = useState<BriefingType | null>(null);
  const [activeCategory, setActiveCategory] = useState<"all" | TreasuryCategory>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string | undefined>();
  const [countryData, setCountryData] = useState<CashPosition[]>(CASH_BY_COUNTRY);
  const [bankData, setBankData] = useState<CashPosition[]>(CASH_BY_BANK);

  // Load news from cache
  const loadNews = useCallback(async () => {
    setIsNewsLoading(true);
    try {
      const res = await fetch("/api/news/refresh");
      const data = await res.json();
      if (data.items) {
        setNews(data.items);
        // Update risk flags based on news content
        const { countries, banks } = flagRisks(data.items, CASH_BY_COUNTRY, CASH_BY_BANK);
        setCountryData(countries);
        setBankData(banks);
      }
    } catch (err) {
      console.error("Failed to load news:", err);
    } finally {
      setIsNewsLoading(false);
    }
  }, []);

  // Load briefing
  const loadBriefing = useCallback(async (force = false) => {
    setIsBriefingLoading(true);
    try {
      const url = force ? "/api/briefing?force=true" : "/api/briefing";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBriefing(data);
      }
    } catch (err) {
      console.error("Failed to load briefing:", err);
    } finally {
      setIsBriefingLoading(false);
    }
  }, []);

  // Full refresh: fetch new news + AI analysis + regenerate briefing
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/news/refresh", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        console.error("Refresh error:", data.error);
        return;
      }
      setLastRefresh(timeAgo(new Date().toISOString()));
      // Reload news, then regenerate briefing
      await loadNews();
      await loadBriefing(true);
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadNews, loadBriefing]);

  // Initial load
  useEffect(() => {
    loadNews();
    loadBriefing();
  }, [loadNews, loadBriefing]);

  // Compute filtered news
  const filteredNews =
    activeCategory === "all"
      ? news
      : news.filter((n) => n.category === activeCategory);

  // Category counts
  const categoryCounts = news.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  const criticalCount = news.filter((n) => n.urgency >= 4).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#060b18]">
      <Header
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        newsCount={news.length}
        criticalCount={criticalCount}
        lastRefresh={lastRefresh}
      />

      <CategoryTabs
        active={activeCategory}
        onChange={setActiveCategory}
        counts={categoryCounts}
      />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_1fr_300px] gap-4 p-4 max-w-[1600px] mx-auto w-full">
        {/* LEFT COLUMN: Briefing + Charts */}
        <aside className="flex flex-col gap-4 min-w-0">
          <DailyBriefing
            briefing={briefing}
            isLoading={isBriefingLoading}
            onRegenerate={() => loadBriefing(true)}
          />
          <CashByCountryChart data={countryData} />
          <CashByBankChart data={bankData} />
        </aside>

        {/* CENTER: News Feed */}
        <section className="min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Intelligence Feed
              {activeCategory !== "all" && (
                <span className="ml-2 text-gold-400">
                  › {activeCategory.replace("-", " ")}
                </span>
              )}
            </h2>
            <span className="text-xs text-slate-600">
              {filteredNews.length} item{filteredNews.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
            <NewsFeed items={filteredNews} isLoading={isNewsLoading} />
          </div>
        </section>

        {/* RIGHT COLUMN: Chat */}
        <aside className="min-w-0">
          <ChatPanel />
        </aside>
      </main>
    </div>
  );
}
