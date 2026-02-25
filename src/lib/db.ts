import fs from "fs";
import path from "path";
import { NewsItem, DailyBriefing } from "@/types";
import { getSettings } from "./settings";

const DATA_DIR = path.join(process.cwd(), "data");
const NEWS_FILE = path.join(DATA_DIR, "news.json");
const BRIEFINGS_FILE = path.join(DATA_DIR, "briefings.json");
const MAX_STORED_ITEMS = 500;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(file: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(file)) return defaultValue;
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return defaultValue;
  }
}

function writeJson(file: string, data: unknown) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── News Items ──────────────────────────────────────────────────────────────

export function saveNewsItems(items: NewsItem[]): void {
  const existing = readJson<NewsItem[]>(NEWS_FILE, []);
  const existingUrls = new Set(existing.map((i) => i.url));
  const newItems = items.filter((i) => i.url && !existingUrls.has(i.url));

  // Apply age cutoff — also purges old articles already in cache
  const { newsFeedDays } = getSettings();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - newsFeedDays);

  const combined = [...newItems, ...existing]
    .filter((i) => new Date(i.publishedAt) >= cutoff)
    .slice(0, MAX_STORED_ITEMS);
  writeJson(NEWS_FILE, combined);
}

export function getNewsItems(options?: {
  category?: string;
  limit?: number;
  search?: string;
}): NewsItem[] {
  let items = readJson<NewsItem[]>(NEWS_FILE, []);

  if (options?.category && options.category !== "all") {
    items = items.filter((i) => i.category === options.category);
  }

  if (options?.search) {
    const q = options.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.source.toLowerCase().includes(q)
    );
  }

  // Apply age cutoff
  const { newsFeedDays } = getSettings();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - newsFeedDays);
  items = items.filter((i) => new Date(i.publishedAt) >= cutoff);

  // Sort: urgency desc, then recency desc
  items.sort((a, b) => {
    if (b.urgency !== a.urgency) return b.urgency - a.urgency;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  if (options?.limit) items = items.slice(0, options.limit);
  return items;
}

export function updateNewsItems(updates: { id: string; category?: string; urgency?: number; aiSummary?: string }[]): void {
  const items = readJson<NewsItem[]>(NEWS_FILE, []);
  const updateMap = new Map(updates.map((u) => [u.id, u]));

  const updated = items.map((item) => {
    const u = updateMap.get(item.id);
    if (!u) return item;
    return {
      ...item,
      ...(u.category && { category: u.category as NewsItem["category"] }),
      ...(u.urgency && { urgency: u.urgency as NewsItem["urgency"] }),
      ...(u.aiSummary && { aiSummary: u.aiSummary }),
    };
  });

  writeJson(NEWS_FILE, updated);
}

export function getNewsCount(): number {
  return readJson<NewsItem[]>(NEWS_FILE, []).length;
}

// Returns only items that have not yet been analyzed by Claude
export function getUncategorizedItems(limit = 200): NewsItem[] {
  const items = readJson<NewsItem[]>(NEWS_FILE, []);
  return items.filter((i) => !i.aiSummary).slice(0, limit);
}

// ── Daily Briefings ─────────────────────────────────────────────────────────

export function saveBriefing(briefing: DailyBriefing): void {
  const existing = readJson<DailyBriefing[]>(BRIEFINGS_FILE, []);
  const idx = existing.findIndex((b) => b.date === briefing.date);
  if (idx >= 0) existing[idx] = briefing;
  else existing.unshift(briefing);
  writeJson(BRIEFINGS_FILE, existing.slice(0, 30)); // keep 30 days
}

export function getLatestBriefing(): DailyBriefing | null {
  const briefings = readJson<DailyBriefing[]>(BRIEFINGS_FILE, []);
  return briefings[0] ?? null;
}

export function getBriefingByDate(date: string): DailyBriefing | null {
  const briefings = readJson<DailyBriefing[]>(BRIEFINGS_FILE, []);
  return briefings.find((b) => b.date === date) ?? null;
}
