import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

const MODEL_HAIKU = "us.anthropic.claude-haiku-4-5-20251001-v1:0";

const REGION = process.env.AWS_BEDROCK_REGION ?? "us-east-1";
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID ?? "";
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY ?? "";

function getClient(): BedrockRuntimeClient {
  const g = globalThis as unknown as { __bedrockClient?: BedrockRuntimeClient };
  if (!g.__bedrockClient) {
    g.__bedrockClient = new BedrockRuntimeClient({
      region: REGION,
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
      },
    });
  }
  return g.__bedrockClient;
}

export interface BedrockMessage {
  role: "user" | "assistant";
  content: string;
}

interface InvokeOptions {
  system?: string;
  messages: BedrockMessage[];
  maxTokens?: number;
  temperature?: number;
}

// Single non-streaming call — returns full text
export async function invokeBedrock(opts: InvokeOptions): Promise<string> {
  const client = getClient();
  const modelId = MODEL_HAIKU;

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: opts.maxTokens ?? 512,
    ...(opts.system ? { system: opts.system } : {}),
    messages: opts.messages,
    ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  const response = await client.send(command);
  const decoded = JSON.parse(new TextDecoder().decode(response.body));
  const text = decoded.content?.[0]?.text;
  if (!text) throw new Error("Empty Bedrock response");
  return text;
}

// Streaming call — yields text chunks. Caller handles SSE/stream building.
export async function* streamBedrock(opts: InvokeOptions): AsyncGenerator<string> {
  const client = getClient();
  const modelId = MODEL_HAIKU;

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: opts.maxTokens ?? 512,
    ...(opts.system ? { system: opts.system } : {}),
    messages: opts.messages,
  };

  const command = new InvokeModelWithResponseStreamCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  const response = await client.send(command);
  if (!response.body) return;

  for await (const event of response.body) {
    if (!event.chunk?.bytes) continue;
    const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
    if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
      yield chunk.delta.text as string;
    }
  }
}

// Estimate token cost for logging — rough approximation (1 token ≈ 4 chars)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function logCost(label: string, inputText: string, outputText: string) {
  const inputTokens = estimateTokens(inputText);
  const outputTokens = estimateTokens(outputText);
  // Bedrock Haiku 4.5 pricing per 1K tokens (us-east-1, 2025)
  const rates = { in: 0.00025, out: 0.00125 };
  const cost = (inputTokens / 1000) * rates.in + (outputTokens / 1000) * rates.out;
  console.log(`[bedrock:${label}] ~${inputTokens}in/${outputTokens}out tokens | ~$${cost.toFixed(5)}`);
}
