import { NextResponse } from "next/server";
import { ConverseCommand, type Message } from "@aws-sdk/client-bedrock-runtime";
import { client, MODEL_ID, type ClaudeMessage } from "@/lib/bedrock";
import { getNewsItems, getLatestBriefing } from "@/lib/db";
import { searchNews } from "@/lib/rss";
import { CASH_BY_COUNTRY, CASH_BY_BANK } from "@/lib/mock-data";

const SYSTEM_PROMPT = `You are the Treasury Intelligence Assistant for a Fortune 500 company.
You have access to today's financial news feed, the daily executive briefing, and the company's current cash position data.
Answer questions from the Treasury team with precision and actionable insights.

Company context (mock data — will be replaced with live TMS data):
- Cash by country and banking counterparty data is provided below
- You are speaking to Treasury professionals who understand financial terminology

Guidelines:
- Be concise and direct — these are busy executives
- Ground answers in the provided news and briefing context when relevant
- If you need more current information on a topic, use the search_financial_news tool
- Flag any risks you identify even if not directly asked
- Format key figures and risks in **bold** for scannability
- Reference specific articles or briefing points when answering questions about them`;

const SEARCH_TOOL = {
  toolSpec: {
    name: "search_financial_news",
    description:
      "Search for recent financial news on a specific topic to supplement the current intelligence feed. Use this when the question requires information not covered in today's feed or briefing.",
    inputSchema: {
      json: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              'Search query for financial news — be specific (e.g. "Federal Reserve rate decision March 2025", "Deutsche Bank counterparty risk")',
          },
        },
        required: ["query"],
      },
    },
  },
};

// Run the Converse API loop, executing tool calls as needed (max 4 turns)
async function runChat(messages: Message[], systemPrompt: string): Promise<string> {
  const conversation = [...messages];

  for (let turn = 0; turn < 4; turn++) {
    const command = new ConverseCommand({
      modelId: MODEL_ID,
      messages: conversation,
      system: [{ text: systemPrompt }],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toolConfig: { tools: [SEARCH_TOOL as any] },
      inferenceConfig: { maxTokens: 1200, temperature: 0.5 },
    });

    const response = await client.send(command);
    const outputMsg = response.output?.message;
    if (!outputMsg) throw new Error("No output from Bedrock");

    conversation.push(outputMsg);

    // Done — return text
    if (response.stopReason !== "tool_use") {
      for (const block of outputMsg.content ?? []) {
        if ("text" in block && block.text) return block.text;
      }
      throw new Error("No text in final response");
    }

    // Execute tool calls and add results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolResults: any[] = [];
    for (const block of outputMsg.content ?? []) {
      if (!("toolUse" in block) || !block.toolUse) continue;
      const { toolUseId, name, input } = block.toolUse;

      let result = "Tool not available.";
      try {
        if (name === "search_financial_news") {
          const { query } = input as { query: string };
          result = await searchNews(query);
        }
      } catch (e) {
        result = `Search failed: ${(e as Error).message}`;
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

    // All recent news (age-filtered via getNewsItems)
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
        : "No news items loaded yet. Ask the user to run a news refresh.";

    // Today's daily briefing
    const briefing = getLatestBriefing();
    const briefingContext = briefing
      ? `--- TODAY'S EXECUTIVE BRIEFING (generated ${new Date(briefing.generatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}) ---\n${briefing.content}\n--- END BRIEFING ---`
      : "No daily briefing has been generated yet for today.";

    // Cash position data
    const cashContext = `Cash by Country (USD millions):\n${CASH_BY_COUNTRY.map(
      (c) => `  ${c.name}: $${c.balance}M${c.currency ? ` (${c.currency})` : ""}`
    ).join("\n")}\n\nCash by Banking Counterparty (USD millions):\n${CASH_BY_BANK.map(
      (b) => `  ${b.name}: $${b.balance}M`
    ).join("\n")}\nTotal counterparty exposure: $${CASH_BY_BANK.reduce(
      (s, b) => s + b.balance,
      0
    ).toLocaleString()}M`;

    const contextualSystemPrompt = `${SYSTEM_PROMPT}

--- COMPANY CASH POSITIONS ---
${cashContext}

--- TODAY'S NEWS FEED (${newsItems.length} articles) ---
${newsContext}

${briefingContext}
--- END CONTEXT ---`;

    // Convert messages to Bedrock format
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
