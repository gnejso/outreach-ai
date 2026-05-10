import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { streamBedrock, logCost } from "@/lib/bedrock";

const LOCALE_LANG: Record<string, string> = {
  pl: "Polish", en: "English", de: "German", fr: "French",
  es: "Spanish", it: "Italian", pt: "Portuguese", nl: "Dutch",
  cs: "Czech", uk: "Ukrainian",
};

function buildSystemPrompt(basePrompt: string, level: number, locale: string): string {
  const lang = LOCALE_LANG[locale] ?? "Polish";
  const aggression =
    level <= 2
      ? "You are open to conversation but evaluate every word."
      : level <= 4
      ? "You are demanding. When the salesperson is vague — you ask for specifics and numbers."
      : "You are ruthless. If the salesperson doesn't hit your specific problem in the first 2 turns — you end the call.";

  return `CRITICAL: You MUST reply ONLY in ${lang.toUpperCase()}. Every single message must be in ${lang}. No exceptions.

${basePrompt}

RULES (absolute):
- Wait for the salesperson to write first — you do NOT start the conversation.
- Read the LAST message carefully and respond to IT directly.
- If they gave a specific argument or number — react to that specific argument.
- If they used vague phrases — ask for specifics or reject briefly.
- Do NOT repeat the same objection twice in this conversation.
- LANGUAGE: Reply ONLY in ${lang.toUpperCase()}. Maximum 2-3 sentences.
- ${aggression}`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages, personaPrompt, level = 1, locale = "pl" } = await req.json();
  if (!messages?.length || !personaPrompt) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(personaPrompt, level, locale);
  const encoder = new TextEncoder();
  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamBedrock({
          system: systemPrompt,
          messages,
          maxTokens: 200,
        })) {
          fullResponse += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        logCost(
          "shadow-boxing-battle",
          systemPrompt + messages.map((m: { content: string }) => m.content).join(" "),
          fullResponse
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[shadow-boxing/battle] BEDROCK ERROR:", msg);
        controller.enqueue(encoder.encode(`[ERROR: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
