import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
} from "@aws-sdk/client-bedrock-runtime";

export const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        sessionToken: process.env.AWS_SESSION_TOKEN,
      }
    : undefined, // falls back to default credential chain (IAM role, ~/.aws/credentials, etc.)
});

// Verify your model ID in the AWS Bedrock console under "Model access"
// Cross-region inference profile format: us.anthropic.claude-{model}-{date}-v{n}:{n}
export const MODEL_ID =
  process.env.BEDROCK_MODEL_ID ||
  "us.anthropic.claude-sonnet-4-5-20250514-v1:0";

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export async function callClaude(
  messages: ClaudeMessage[],
  systemPrompt?: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const bedrockMessages: Message[] = messages.map((m) => ({
    role: m.role,
    content: [{ text: m.content }],
  }));

  const command = new ConverseCommand({
    modelId: MODEL_ID,
    messages: bedrockMessages,
    ...(systemPrompt && { system: [{ text: systemPrompt }] }),
    inferenceConfig: {
      maxTokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.3,
    },
  });

  const response = await client.send(command);
  const text = response.output?.message?.content?.[0]?.text;

  if (!text) throw new Error("No text output from Bedrock response");
  return text;
}

export async function callClaudeJson<T>(
  messages: ClaudeMessage[],
  systemPrompt?: string,
  options?: { maxTokens?: number }
): Promise<T> {
  const text = await callClaude(messages, systemPrompt, {
    maxTokens: options?.maxTokens ?? 4096,
    temperature: 0.1, // low temp for structured output
  });

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Failed to parse JSON from Claude response: ${cleaned.slice(0, 200)}`);
  }
}
