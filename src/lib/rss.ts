import Parser from "rss-parser";
import { randomUUID } from "crypto";
import { RSS_SOURCES, GOOGLE_NEWS_QUERIES, buildGoogleNewsUrl } from "./news-sources";
import { NewsItem, TreasuryCategory } from "@/types";

const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent": "TreasuryIntelligencePlatform/1.0 (RSS Reader)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

function cleanDescription(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

async function fetchSource(
  url: string,
  sourceName: string,
  defaultCategory: TreasuryCategory,
  limit = 10
): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(url);
    const fetchedAt = new Date().toISOString();

    return feed.items.slice(0, limit).map((item) => ({
      id: randomUUID(),
      title: item.title?.trim() || "Untitled",
      description: cleanDescription(
        item.contentSnippet || item.summary || item.content || ""
      ),
      url: item.link || item.guid || "",
      source: sourceName,
      publishedAt: item.pubDate || item.isoDate || fetchedAt,
      category: defaultCategory,
      urgency: 3 as const,
      fetchedAt,
    }));
  } catch (err) {
    console.warn(`[RSS] Failed to fetch "${sourceName}": ${(err as Error).message}`);
    return [];
  }
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  const promises: Promise<NewsItem[]>[] = [];

  // Direct RSS sources
  for (const source of RSS_SOURCES) {
    promises.push(fetchSource(source.url, source.name, source.defaultCategory, 10));
  }

  // Google News queries
  for (const { query, category, label } of GOOGLE_NEWS_QUERIES) {
    const url = buildGoogleNewsUrl(query);
    promises.push(fetchSource(url, `Google News – ${label}`, category, 8));
  }

  const results = await Promise.allSettled(promises);
  const allItems: NewsItem[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  return allItems.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}
