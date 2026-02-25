import { NextResponse } from "next/server";
import { getNewsItems, saveBriefing, getBriefingByDate } from "@/lib/db";
import { callClaude } from "@/lib/bedrock";

const SYSTEM_PROMPT = `You are the Chief Treasury Officer's senior intelligence advisor at a Fortune 500 company.
Write concise, actionable daily briefings for a corporate Treasurer.
Focus on: liquidity risk, counterparty risk, FX/rate exposure, capital markets, credit, and geopolitical risk.
Tone: Senior executive briefing — direct, no filler, high signal-to-noise ratio.
Format responses in clean Markdown.`;

export async function GET(request: Request) {
  const today = new Date().toISOString().split("T")[0];
  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";

  // Return cached briefing unless forced regeneration
  if (!force) {
    const cached = getBriefingByDate(today);
    if (cached) return NextResponse.json(cached);
  }

  // Build briefing from today's top news
  const items = getNewsItems({ limit: 50 });

  if (items.length === 0) {
    return NextResponse.json(
      { error: "No news items available. Run a news refresh first." },
      { status: 404 }
    );
  }

  const newsContext = items
    .slice(0, 40)
    .map(
      (item, i) =>
        `${i + 1}. [${item.category.toUpperCase()} | Urgency ${item.urgency}] ${item.title}\n   ${item.aiSummary || item.description}`
    )
    .join("\n\n");

  const prompt = `Today is ${new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}.

Based on today's financial news, write the daily Treasury Intelligence Briefing.

Structure it exactly as follows:

## Executive Summary
2-3 sentences capturing the single most important Treasury insight today.

## 🚨 Critical Alerts
Bullet points for any urgency-4 or urgency-5 items requiring immediate attention. If none, write "No critical alerts today."

## Market & Rate Environment
Key developments in rates, FX, and capital markets relevant to Treasury operations.

## Risk Signals
- **Counterparty/Banking**: Any news about financial institutions
- **Liquidity**: Funding market conditions, credit spreads
- **Geopolitical**: Regional risks affecting treasury operations

## Key Themes Today
3-5 numbered themes from today's news landscape.

## Watch List
2-3 forward-looking items to monitor in the coming days.

---
Today's news feed (${items.length} items):

${newsContext}`;

  try {
    const content = await callClaude(
      [{ role: "user", content: prompt }],
      SYSTEM_PROMPT,
      { maxTokens: 1500, temperature: 0.4 }
    );

    const briefing = {
      date: today,
      content,
      generatedAt: new Date().toISOString(),
    };

    saveBriefing(briefing);
    return NextResponse.json(briefing);
  } catch (err) {
    console.error("[Briefing]", err);
    return NextResponse.json(
      { error: "Failed to generate briefing", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
