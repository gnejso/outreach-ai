import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { invokeBedrock } from "@/lib/bedrock";

export const maxDuration = 60;

const AUDIT_COST = 25;

// Fetch a page and return clean text (strip scripts/styles/tags)
async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OutreachAI-Auditor/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Remove scripts, styles, SVG, comments
    const clean = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{3,}/g, "\n")
      .trim();
    return clean.slice(0, 6000);
  } catch {
    return "";
  }
}

// Extract internal links from homepage HTML
function extractSubpageLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const matches = html.matchAll(/href=["']([^"'#?]+)["']/gi);
  const links = new Set<string>();

  for (const m of matches) {
    try {
      const href = m[1];
      if (href.startsWith("http")) {
        const u = new URL(href);
        if (u.hostname === base.hostname && u.pathname !== "/" && u.pathname !== "") {
          links.add(u.origin + u.pathname);
        }
      } else if (href.startsWith("/") && href.length > 1) {
        links.add(base.origin + href);
      }
    } catch {
      // ignore invalid
    }
  }

  // Prioritize: /kontakt, /o-nas, /uslugi, /oferta, /cennik, /about, /contact, /services, /pricing
  const priority = [
    "kontakt", "contact", "o-nas", "about", "uslugi", "services",
    "oferta", "offer", "cennik", "pricing", "portfolio", "realizacje",
  ];
  const sorted = [...links].sort((a, b) => {
    const aScore = priority.findIndex((p) => a.toLowerCase().includes(p));
    const bScore = priority.findIndex((p) => b.toLowerCase().includes(p));
    return (aScore === -1 ? 99 : aScore) - (bScore === -1 ? 99 : bScore);
  });

  return sorted.slice(0, 4); // max 4 subpages
}

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

  // 1. Fetch homepage HTML (raw, for link extraction)
  let homepageHtml = "";
  try {
    const res = await fetch(cleanUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OutreachAI-Auditor/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) homepageHtml = await res.text();
  } catch {
    // proceed without
  }

  const homepageText = homepageHtml
    ? homepageHtml
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<svg[\s\S]*?<\/svg>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{3,}/g, "\n")
        .trim()
        .slice(0, 6000)
    : "";

  // 2. Find subpage links and fetch them in parallel
  const subpageUrls = homepageHtml ? extractSubpageLinks(homepageHtml, cleanUrl) : [];
  const subpageTexts = await Promise.all(subpageUrls.map((u) => fetchPageText(u)));

  // 3. Build context string
  let pagesContext = `=== STRONA GŁÓWNA (${cleanUrl}) ===\n${homepageText || "(nie udało się pobrać)"}\n\n`;
  subpageUrls.forEach((u, i) => {
    if (subpageTexts[i]) {
      pagesContext += `=== PODSTRONA: ${u} ===\n${subpageTexts[i]}\n\n`;
    }
  });

  const pagesScanned = 1 + subpageUrls.filter((_, i) => !!subpageTexts[i]).length;

  const prompt = `Masz do przeanalizowania treść ${pagesScanned} strony/stron serwisu: ${cleanUrl}
${industry ? `Branża klienta: ${industry}` : ""}

POBRANE TREŚCI STRON:
${pagesContext}

Na podstawie POWYŻSZYCH TREŚCI (nie wymyślaj — bazuj tylko na tym co jest w tekście) napisz szczegółowy raport audytu. Pisz po polsku.

Struktura raportu (użyj dokładnie tych nagłówków):

OCENA OGÓLNA
Ocena: X/10
[2-3 zdania podsumowania — konkretne obserwacje z treści]

✅ CO DZIAŁA DOBRZE
[5-7 konkretnych pozytywów widocznych w treści]

❌ KRYTYCZNE PROBLEMY
[5-7 konkretnych problemów które szkodzą konwersji lub UX]

📱 MOBILE & SZYBKOŚĆ
[Wnioski na podstawie struktury strony]

🎯 CTA I KONWERSJA
[Czy są numery telefonów? Formularze? Przyciski kontaktowe? Konkretne przykłady z treści]

🔍 SEO PODSTAWY
[Title, nagłówki H1/H2, słowa kluczowe widoczne w treści]

💡 TOP 5 POPRAWEK
[5 najważniejszych zmian — od najważniejszej]

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
      maxTokens: 2500,
      system: "Jesteś ekspertem od audytów stron internetowych, UX i konwersji. Analizujesz wyłącznie to co faktycznie jest w dostarczonych treściach stron — nie wymyślasz ani nie zgadujesz.",
    });
  } catch (err) {
    console.error("[audyt] Bedrock error:", err);
    return NextResponse.json({ error: "Błąd generowania audytu" }, { status: 500 });
  }

  const scoreMatch = report.match(/OCENA OGÓLNA[\s\S]*?Ocena:\s*(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

  const [audit] = await prisma.$transaction([
    prisma.webAudit.create({
      data: {
        userId: user.id,
        url: cleanUrl,
        industry: industry || null,
        report: `Przeskanowano ${pagesScanned} stron (${[cleanUrl, ...subpageUrls].join(", ")})\n\n${report}`,
        score,
      },
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
          description: `Audyt strony: ${cleanUrl} (${pagesScanned} stron)`,
          creditsUsed: AUDIT_COST,
        },
      }),
    ] : []),
  ]);

  return NextResponse.json({ report: audit.report, score, auditId: audit.id, pagesScanned });
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
