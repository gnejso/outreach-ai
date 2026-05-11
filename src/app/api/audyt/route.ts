import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { invokeBedrock } from "@/lib/bedrock";

export const maxDuration = 60;

const AUDIT_COST = 25;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, credits: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.role !== "ADMIN" && user.credits < AUDIT_COST) {
    return NextResponse.json({ error: "Niewystarczające kredyty (potrzebujesz 25)" }, { status: 402 });
  }

  const { url, industry, locale = "pl" } = await req.json();
  if (!url) return NextResponse.json({ error: "Brak URL" }, { status: 400 });

  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;

  const prompt = `Odwiedź tę stronę internetową: ${cleanUrl}
${industry ? `Branża klienta: ${industry}` : ""}
Przeanalizuj stronę dokładnie i napisz szczegółowy raport w języku polskim.

Struktura raportu (użyj dokładnie tych nagłówków):

OCENA OGÓLNA
Ocena: X/10
[2-3 zdania podsumowania]

✅ CO DZIAŁA DOBRZE
[5-7 konkretnych obserwacji z przykładami]

❌ KRYTYCZNE PROBLEMY
[5-7 konkretnych problemów które szkodzą konwersji lub UX]

📱 MOBILE & SZYBKOŚĆ
[Analiza przyjazności mobilnej i wskaźników szybkości ładowania]

🎯 CTA I KONWERSJA
[Czy są wyraźne wezwania do działania? Widoczny numer telefonu? Formularz kontaktowy? Lead capture?]

🔍 SEO PODSTAWY
[Title tags, meta descriptions, struktura nagłówków, sygnały lokalnego SEO]

💡 TOP 5 POPRAWEK
[Lista 5 najważniejszych poprawek według priorytetu]

📊 PODSUMOWANIE OCEN
Design: X/10
UX: X/10
SEO: X/10
Konwersja: X/10
Treść: X/10`;

  let report: string;
  try {
    report = await invokeBedrock({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2000,
      system: "Jesteś ekspertem od audytów stron internetowych, UX i konwersji. Analizujesz strony pod kątem sprzedaży i generowania leadów.",
    });
  } catch (err) {
    console.error("[audyt] Bedrock error:", err);
    return NextResponse.json({ error: "Błąd generowania audytu" }, { status: 500 });
  }

  // Extract score from report
  const scoreMatch = report.match(/OCENA OGÓLNA[\s\S]*?Ocena:\s*(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

  // Save audit and deduct credits in transaction
  const [audit] = await prisma.$transaction([
    prisma.webAudit.create({
      data: { userId: user.id, url: cleanUrl, industry: industry || null, report, score },
    }),
    ...(user.role !== "ADMIN" ? [
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: AUDIT_COST } },
      }),
      prisma.activity.create({
        data: {
          userId: user.id,
          type: "WEB_AUDIT",
          description: `Audyt strony: ${cleanUrl}`,
          creditsUsed: AUDIT_COST,
        },
      }),
    ] : []),
  ]);

  return NextResponse.json({ report, score, auditId: audit.id });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const audits = await prisma.webAudit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, url: true, score: true, createdAt: true, report: true },
  });

  return NextResponse.json({ audits });
}
