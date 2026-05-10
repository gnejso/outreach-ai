import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { invokeBedrock, logCost } from "@/lib/bedrock";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { transcript?: string; personaName?: string; level?: number; mode?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { transcript = "", personaName = "Klient", level = 1, mode = "text", locale = "pl" } = body;

  const LOCALE_LANG: Record<string, string> = {
    pl: "Polish", en: "English", de: "German", fr: "French",
    es: "Spanish", it: "Italian", pt: "Portuguese", nl: "Dutch",
    cs: "Czech", uk: "Ukrainian",
  };
  const lang = LOCALE_LANG[locale] ?? "Polish";

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, credits: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.role !== "ADMIN" && user.credits < 10) {
    return NextResponse.json({ error: "Niewystarczające kredyty" }, { status: 402 });
  }

  const prompt = `You are a B2B sales expert. Analyze the following sales conversation simulation and evaluate the salesperson.

Client persona: ${personaName}
Difficulty level: ${level}/6
Mode: ${mode === "voice" ? "Voice" : "Text"}

Transcript:
${transcript.slice(0, 3000)}

Write an evaluation IN ${lang.toUpperCase()} containing:
1. Overall score (1-10) with a one-sentence justification
2. What they did well (2-3 specific points)
3. Biggest mistakes (2-3 specific points)
4. The single most important thing to improve in the next session

Be specific and direct. No vague generalities.`;

  const feedback = await invokeBedrock({
    messages: [{ role: "user", content: prompt }],
    maxTokens: 600,
  });
  logCost("shadow-boxing-feedback", prompt, feedback);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.shadowBoxingSession.create({
        data: {
          userId: user.id,
          mode,
          level,
          personaName,
          transcript: transcript.slice(0, 5000),
          feedback,
          creditsUsed: user.role === "ADMIN" ? 0 : 10,
        },
      });
      if (user.role !== "ADMIN") {
        await tx.user.update({ where: { id: user.id }, data: { credits: { decrement: 10 } } });
        await tx.activity.create({
          data: {
            userId: user.id,
            type: "SHADOW_BOXING",
            description: `Shadow Boxing — ${personaName} (Poziom ${level})`,
            creditsUsed: 10,
          },
        });
      }
    });
  } catch (err) {
    console.error("[shadow-boxing/feedback] DB error:", err);
  }

  return NextResponse.json({ feedback });
}
