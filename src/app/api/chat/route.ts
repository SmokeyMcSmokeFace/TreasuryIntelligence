import { NextResponse } from "next/server";
import { getNewsItems } from "@/lib/db";
import { callClaude, ClaudeMessage } from "@/lib/bedrock";
import { CASH_BY_COUNTRY, CASH_BY_BANK } from "@/lib/mock-data";

const SYSTEM_PROMPT = `You are the Treasury Intelligence Assistant for a Fortune 500 company.
You have access to today's financial news feed and the company's current cash position data.
Answer questions from the Treasury team with precision and actionable insights.

Company context (mock data — will be replaced with live TMS data):
- Cash by country and banking counterparty data is provided in each query
- You are speaking to Treasury professionals who understand financial terminology

Guidelines:
- Be concise and direct — these are busy executives
- Always ground answers in the provided news context when relevant
- Flag any risks you identify even if not directly asked
- If you don't have enough context to answer confidently, say so clearly
- Format key figures and risks in bold for scannability`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages }: { messages: ClaudeMessage[] } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    // Build context from news and mock data
    const newsItems = getNewsItems({ limit: 40 });

    const newsContext =
      newsItems.length > 0
        ? newsItems
            .slice(0, 30)
            .map(
              (item) =>
                `• [${item.category} | urgency ${item.urgency}] ${item.title}${item.aiSummary ? ` — ${item.aiSummary}` : ""}`
            )
            .join("\n")
        : "No news items loaded yet. Ask the user to run a news refresh.";

    const cashContext = `
Cash by Country (USD millions):
${CASH_BY_COUNTRY.map((c) => `  ${c.name}: $${c.balance}M ${c.currency ? `(${c.currency})` : ""}`).join("\n")}

Cash by Banking Counterparty (USD millions):
${CASH_BY_BANK.map((b) => `  ${b.name}: $${b.balance}M`).join("\n")}
Total counterparty exposure: $${CASH_BY_BANK.reduce((s, b) => s + b.balance, 0).toLocaleString()}M`;

    const contextualSystemPrompt = `${SYSTEM_PROMPT}

--- COMPANY CASH POSITIONS (as of today) ---
${cashContext}

--- TODAY'S NEWS FEED (${newsItems.length} items) ---
${newsContext}
--- END CONTEXT ---`;

    const reply = await callClaude(messages, contextualSystemPrompt, {
      maxTokens: 1024,
      temperature: 0.5,
    });

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[Chat]", err);
    return NextResponse.json(
      { error: "Chat failed", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
