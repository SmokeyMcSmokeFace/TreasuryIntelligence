import { NextResponse } from "next/server";
import { ConverseCommand, type Message } from "@aws-sdk/client-bedrock-runtime";
import { client, MODEL_ID, type ClaudeMessage } from "@/lib/bedrock";
import { getNewsItems, getLatestBriefing } from "@/lib/db";
import { searchNews } from "@/lib/rss";
import { loadGEHCSnapshot, formatSnapshotText, lookupCompanyOnDemand } from "@/lib/edgar";
import { CASH_BY_COUNTRY, CASH_BY_BANK } from "@/lib/mock-data";

const SYSTEM_PROMPT = `You are the Treasury Intelligence Assistant for a Fortune 500 company.
You have access to today's financial news feed, the daily executive briefing, the company's cash positions, and a detailed financial snapshot of GE HealthCare Technologies (GEHC).

Guidelines:
- Be concise and direct — these are busy executives
- Ground answers in the provided context (news, briefing, company snapshot) when relevant
- Format key figures and risks in **bold** for scannability
- Reference specific articles or briefing points when answering questions about them

GE HealthCare (GEHC) is the default company for financial questions:
- The GEHC financial snapshot is always provided in context — use it to answer debt, revenue, maturity, and liquidity questions directly
- For GEHC data NOT in the snapshot (e.g. individual bond terms, pension details, specific line items), explain what's missing and ask the user if they want you to look it up on SEC EDGAR using the edgar_lookup tool. Only call edgar_lookup after the user confirms.
- When calling edgar_lookup for deeper GEHC data, use ticker "GEHC" and the appropriate data_type

Other companies:
- If the user explicitly asks about a different company (not GEHC), confirm the company name/ticker with them before calling edgar_lookup
- Do not assume a company unless clearly specified

Tools available:
- search_financial_news: search for news on a topic beyond today's feed — use proactively when useful
- edgar_lookup: fetch financial data from SEC EDGAR — always ask user first unless they've already confirmed`;

const TOOLS = [
  {
    toolSpec: {
      name: "search_financial_news",
      description:
        "Search for recent financial news on a specific topic to supplement the current intelligence feed.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Specific financial news search query",
            },
          },
          required: ["query"],
        },
      },
    },
  },
  {
    toolSpec: {
      name: "edgar_lookup",
      description:
        "Fetch financial data from SEC EDGAR for a company. For GEHC, use when data is not in the snapshot. For other companies, use when user explicitly requests. Always confirm with user before calling.",
      inputSchema: {
        json: {
          type: "object",
          properties: {
            ticker_or_name: {
              type: "string",
              description: "Company ticker (e.g. 'GEHC', 'AAPL') or full name",
            },
            data_type: {
              type: "string",
              enum: ["balance_sheet", "debt_maturity", "income_statement", "cash_flow", "full_snapshot"],
              description: "Which financial data to retrieve",
            },
          },
          required: ["ticker_or_name", "data_type"],
        },
      },
    },
  },
];

async function runChat(messages: Message[], systemPrompt: string): Promise<string> {
  const conversation = [...messages];

  for (let turn = 0; turn < 5; turn++) {
    const command = new ConverseCommand({
      modelId: MODEL_ID,
      messages: conversation,
      system: [{ text: systemPrompt }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toolConfig: { tools: TOOLS as any },
      inferenceConfig: { maxTokens: 1500, temperature: 0.5 },
    });

    const response = await client.send(command);
    const outputMsg = response.output?.message;
    if (!outputMsg) throw new Error("No output from Bedrock");

    conversation.push(outputMsg);

    if (response.stopReason !== "tool_use") {
      for (const block of outputMsg.content ?? []) {
        if ("text" in block && block.text) return block.text;
      }
      throw new Error("No text in final response");
    }

    // Execute tool calls
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolResults: any[] = [];
    for (const block of outputMsg.content ?? []) {
      if (!("toolUse" in block) || !block.toolUse) continue;
      const { toolUseId, name, input } = block.toolUse;
      const inp = input as Record<string, string>;

      let result = "Tool not available.";
      try {
        if (name === "search_financial_news") {
          result = await searchNews(inp.query);
        } else if (name === "edgar_lookup") {
          result = await lookupCompanyOnDemand(inp.ticker_or_name, inp.data_type as never);
        }
      } catch (e) {
        result = `Lookup failed: ${(e as Error).message}`;
      }

      toolResults.push({
        toolResult: { toolUseId, content: [{ text: result }], status: "success" },
      });
    }

    conversation.push({ role: "user", content: toolResults });
  }

  throw new Error("Chat exceeded maximum tool-use turns");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages }: { messages: ClaudeMessage[] } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    // ── Build context ────────────────────────────────────────────────────────

    // GEHC financial snapshot
    const gehcSnapshot = loadGEHCSnapshot();
    const gehcContext = gehcSnapshot
      ? formatSnapshotText(gehcSnapshot)
      : "GE HealthCare snapshot not yet loaded. Run a Refresh Intel to initialize it.";

    // All recent news
    const newsItems = getNewsItems({ limit: 150 });
    const newsContext =
      newsItems.length > 0
        ? newsItems
            .map(
              (item) =>
                `• [${item.category} | U${item.urgency}] ${item.title}${
                  item.aiSummary ? ` — ${item.aiSummary}` : ""
                }`
            )
            .join("\n")
        : "No news items loaded yet. Run a Refresh Intel first.";

    // Today's daily briefing
    const briefing = getLatestBriefing();
    const briefingContext = briefing
      ? `--- TODAY'S EXECUTIVE BRIEFING (${new Date(briefing.generatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}) ---\n${briefing.content}\n--- END BRIEFING ---`
      : "No daily briefing generated yet.";

    // Cash positions
    const cashContext = `Cash by Country (USD millions):\n${CASH_BY_COUNTRY.map(
      (c) => `  ${c.name}: $${c.balance}M${c.currency ? ` (${c.currency})` : ""}`
    ).join("\n")}\n\nCash by Banking Counterparty (USD millions):\n${CASH_BY_BANK.map(
      (b) => `  ${b.name}: $${b.balance}M`
    ).join("\n")}\nTotal counterparty exposure: $${CASH_BY_BANK.reduce(
      (s, b) => s + b.balance,
      0
    ).toLocaleString()}M`;

    const contextualSystemPrompt = `${SYSTEM_PROMPT}

--- COMPANY CASH POSITIONS (mock data) ---
${cashContext}

--- TODAY'S NEWS FEED (${newsItems.length} articles) ---
${newsContext}

${briefingContext}

${gehcContext}
--- END CONTEXT ---`;

    const bedrockMessages: Message[] = messages.map((m) => ({
      role: m.role,
      content: [{ text: m.content }],
    }));

    const reply = await runChat(bedrockMessages, contextualSystemPrompt);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[Chat]", err);
    return NextResponse.json(
      { error: "Chat failed", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
