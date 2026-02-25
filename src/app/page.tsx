"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, TrendingUp, MessageSquare } from "lucide-react";
import { Header } from "@/components/Header";
import { CategoryTabs } from "@/components/CategoryTabs";
import { DailyBriefing } from "@/components/DailyBriefing";
import { NewsFeed } from "@/components/NewsFeed";
import { ChatPanel } from "@/components/ChatPanel";
import { CashByCountryChart } from "@/components/CashByCountryChart";
import { CashByBankChart } from "@/components/CashByBankChart";
import { ResizableColumns } from "@/components/ResizableColumns";
import { NewsItem, TreasuryCategory, DailyBriefing as BriefingType, CashPosition } from "@/types";
import { CASH_BY_COUNTRY, CASH_BY_BANK, COUNTRY_KEYWORDS, BANK_KEYWORDS } from "@/lib/mock-data";
import { timeAgo } from "@/lib/utils";

type MobileTab = "briefing" | "feed" | "chat";

const MOBILE_TABS: { id: MobileTab; label: string; icon: React.ElementType }[] = [
  { id: "briefing", label: "Briefing", icon: FileText },
  { id: "feed",     label: "Feed",     icon: TrendingUp },
  { id: "chat",     label: "Chat",     icon: MessageSquare },
];

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
  const [mobileTab, setMobileTab] = useState<MobileTab>("feed");

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

  const leftPanel = (
    <div className="flex flex-col gap-4">
      <DailyBriefing
        briefing={briefing}
        isLoading={isBriefingLoading}
        onRegenerate={() => loadBriefing(true)}
      />
      <CashByCountryChart data={countryData} />
      <CashByBankChart data={bankData} />
    </div>
  );

  const centerPanel = (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3 shrink-0">
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
      <div className="flex-1 overflow-y-auto pr-1">
        <NewsFeed items={filteredNews} isLoading={isNewsLoading} />
      </div>
    </div>
  );

  const rightPanel = <ChatPanel />;

  return (
    <div className="h-screen flex flex-col bg-[#060b18] overflow-hidden">
      <Header
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        newsCount={news.length}
        criticalCount={criticalCount}
        lastRefresh={lastRefresh}
      />

      {/* Category tabs: always on desktop, only on Feed tab on mobile */}
      <div className={mobileTab === "feed" ? "block" : "hidden lg:block"}>
        <CategoryTabs
          active={activeCategory}
          onChange={setActiveCategory}
          counts={categoryCounts}
        />
      </div>

      {/* ── Desktop: resizable three-column layout ── */}
      <main className="hidden lg:flex flex-1 min-h-0 overflow-hidden">
        <ResizableColumns
          left={leftPanel}
          center={centerPanel}
          right={rightPanel}
        />
      </main>

      {/* ── Mobile: scrollable panel — padding-bottom clears the fixed nav ── */}
      <div
        className="flex lg:hidden flex-1 overflow-x-hidden overflow-y-auto p-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 4.5rem)" }}
      >
        {mobileTab === "briefing" && leftPanel}
        {mobileTab === "feed"     && centerPanel}
        {mobileTab === "chat"     && <ChatPanel />}
      </div>

      {/* ── Mobile: fixed bottom tab bar — anchored to viewport, never scrolls ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t-2 border-slate-700 bg-[#060b18]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex">
          {MOBILE_TABS.map(({ id, label, icon: Icon }) => {
            const isActive = mobileTab === id;
            const hasBadge = id === "feed" && criticalCount > 0;
            return (
              <button
                key={id}
                onClick={() => setMobileTab(id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 px-2 text-xs font-medium transition-colors relative ${
                  isActive ? "text-gold-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-gold-400 rounded-full" />
                )}
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
