import { NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/rss";
import { saveNewsItems, getNewsItems, updateNewsItems } from "@/lib/db";
import { callClaudeJson } from "@/lib/bedrock";
import { NewsItem, TreasuryCategory } from "@/types";

const SYSTEM_PROMPT = `You are a senior Treasury analyst at a Fortune 500 company.
Analyze financial news items and classify each for a corporate Treasury executive dashboard.

Treasury categories:
- liquidity: cash management, money markets, funding, short-term borrowing
- capital-markets: bonds, debt issuance, equity, IPO, credit facilities
- fx-rates: foreign exchange, currency moves, interest rates, central bank policy
- credit-ratings: rating agency actions, downgrades, upgrades, credit outlook
- ma: mergers, acquisitions, divestitures, deal activity
- risk: counterparty risk, bank risk, systemic risk, insurance
- macro: GDP, inflation, employment, broad market moves, recession signals
- pensions: pension funds, defined benefit, retirement assets
- geopolitical: sanctions, political risk, regional instability, trade policy
- general: other financial news

Urgency scale (Treasury impact):
5 = CRITICAL: Immediate action required (major bank failure, currency crisis, surprise rate move, sovereign default)
4 = HIGH: Significant risk signal (rating downgrade, >2% market move, major counterparty news, regional crisis)
3 = MEDIUM: Important to monitor (Fed meeting, key economic data, sector developments, deal announcements)
2 = LOW: Background awareness (general commentary, minor market moves, routine data)
1 = MINIMAL: Minimal Treasury relevance`;

interface AnalysisItem {
  id: string;
  category: TreasuryCategory;
  urgency: 1 | 2 | 3 | 4 | 5;
  aiSummary: string;
}

async function analyzeNewsBatch(items: NewsItem[]): Promise<AnalysisItem[]> {
  const input = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description.slice(0, 200),
  }));

  const prompt = `Analyze these ${items.length} news items and return a JSON array.

Each object must have exactly these fields:
- id: string (copy from input, do not change)
- category: one of: liquidity, capital-markets, fx-rates, credit-ratings, ma, risk, macro, pensions, geopolitical, general
- urgency: integer 1-5
- aiSummary: string, 1-2 sentences on Treasury implications

Return ONLY a valid JSON array. No markdown, no explanation.

News items:
${JSON.stringify(input, null, 2)}`;

  return callClaudeJson<AnalysisItem[]>(
    [{ role: "user", content: prompt }],
    SYSTEM_PROMPT,
    { maxTokens: 4096 }
  );
}

export async function POST() {
  try {
    // 1. Fetch news from all RSS sources
    const rawItems = await fetchAllNews();

    if (rawItems.length === 0) {
      return NextResponse.json({ error: "No news items fetched" }, { status: 503 });
    }

    // 2. Save raw items first (so we have them even if AI analysis fails)
    saveNewsItems(rawItems);

    // 3. Get items that need AI analysis (newly saved ones without aiSummary)
    const toAnalyze = getNewsItems({ limit: 80 }).filter((i) => !i.aiSummary);

    // 4. Analyze in batches of 20 to stay within token limits
    const BATCH_SIZE = 20;
    const allUpdates: AnalysisItem[] = [];

    for (let i = 0; i < toAnalyze.length; i += BATCH_SIZE) {
      const batch = toAnalyze.slice(i, i + BATCH_SIZE);
      try {
        const results = await analyzeNewsBatch(batch);
        allUpdates.push(...results);
      } catch (err) {
        console.error(`[AI] Batch ${i / BATCH_SIZE + 1} failed:`, err);
        // Continue with remaining batches
      }
    }

    // 5. Persist AI analysis results
    if (allUpdates.length > 0) {
      updateNewsItems(allUpdates);
    }

    return NextResponse.json({
      fetched: rawItems.length,
      analyzed: allUpdates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[News Refresh]", err);
    return NextResponse.json(
      { error: "Failed to refresh news", detail: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const items = getNewsItems({ limit: 100 });
  return NextResponse.json({ items, count: items.length });
}
