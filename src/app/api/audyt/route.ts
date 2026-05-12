import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { invokeBedrock } from "@/lib/bedrock";

export const maxDuration = 120;

const AUDIT_COST = 25;

interface PageData {
  url: string;
  title: string;
  metaDesc: string;
  h1: string[];
  h2: string[];
  phones: string[];
  emails: string[];
  text: string;
}

function extractMeta(html: string): { title: string; metaDesc: string } {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    ?? html.match(/<meta[^>]+content=["']([^"'"]*)["'][^>]+name=["']description["']/i);
  return {
    title: titleMatch?.[1]?.trim() ?? "",
    metaDesc: metaMatch?.[1]?.trim() ?? "",
  };
}

function extractHeadings(html: string, tag: "h1" | "h2"): string[] {
  const results: string[] = [];
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  for (const m of html.matchAll(re)) {
    const text = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 1 && text.length < 200) results.push(text);
  }
  return [...new Set(results)].slice(0, 10);
}

function extractPhones(html: string): string[] {
  const phones = new Set<string>();
  // 1. tel: href links — always reliable
  for (const m of html.matchAll(/href=["']tel:([^"']+)["']/gi)) {
    phones.add(m[1].trim());
  }
  // 2. Strip scripts/styles first, then look for formatted phone patterns only
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ");
  // Only match properly formatted Polish numbers (with spaces or dashes between groups)
  for (const m of stripped.matchAll(/(\+48[\s\-]?)?(\d{3}[\s\-]\d{3}[\s\-]\d{3}|\d{2}[\s\-]\d{3}[\s\-]\d{2}[\s\-]\d{2})/g)) {
    const p = m[0].trim();
    phones.add(p);
  }
  return [...phones].slice(0, 8);
}

function extractEmails(html: string): string[] {
  const emails = new Set<string>();
  for (const m of html.matchAll(/href=["']mailto:([^"'?]+)/gi)) emails.add(m[1].trim());
  for (const m of html.matchAll(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/g)) emails.add(m[0].trim());
  return [...emails].filter(e => !e.includes("example") && !e.includes("domain")).slice(0, 5);
}

function htmlToText(html: string, limit: number): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?(div|section|article|header|footer|nav|main|aside)[^>]*>/gi, "\n")
    .replace(/<\/?(p|li|br|tr|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, limit);
}

async function fetchPage(url: string): Promise<PageData | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OutreachAI-Auditor/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const { title, metaDesc } = extractMeta(html);
    return {
      url,
      title,
      metaDesc,
      h1: extractHeadings(html, "h1"),
      h2: extractHeadings(html, "h2"),
      phones: extractPhones(html),
      emails: extractEmails(html),
      text: htmlToText(html, 20000),
    };
  } catch {
    return null;
  }
}

function extractSubpageLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const links = new Set<string>();

  for (const m of html.matchAll(/href=["']([^"'#?]+)["']/gi)) {
    try {
      const href = m[1];
      let full: string;
      if (href.startsWith("http")) {
        const u = new URL(href);
        if (u.hostname !== base.hostname) continue;
        full = u.origin + u.pathname;
      } else if (href.startsWith("/") && href.length > 1) {
        full = base.origin + href;
      } else continue;

      // Skip files, assets, lang variants with query
      if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|css|js|xml|json|ico)$/i.test(full)) continue;
      if (full === baseUrl || full === base.origin + "/") continue;
      links.add(full.replace(/\/$/, ""));
    } catch {
      // ignore
    }
  }

  const priority = [
    "kontakt", "contact",
    "o-nas", "o-mnie", "about", "about-us",
    "uslugi", "usługi", "services", "oferta", "offer",
    "cennik", "pricing", "ceny",
    "portfolio", "realizacje", "projects",
    "zespol", "team",
  ];

  return [...links].sort((a, b) => {
    const aLow = a.toLowerCase();
    const bLow = b.toLowerCase();
    const aScore = priority.findIndex((p) => aLow.includes(p));
    const bScore = priority.findIndex((p) => bLow.includes(p));
    return (aScore === -1 ? 99 : aScore) - (bScore === -1 ? 99 : bScore);
  }).slice(0, 7);
}

function pageToContext(p: PageData, label: string): string {
  const lines: string[] = [`=== ${label}: ${p.url} ===`];
  if (p.title) lines.push(`Title: ${p.title}`);
  if (p.metaDesc) lines.push(`Meta description: ${p.metaDesc}`);
  if (p.h1.length) lines.push(`H1: ${p.h1.join(" | ")}`);
  if (p.h2.length) lines.push(`H2: ${p.h2.slice(0, 6).join(" | ")}`);
  if (p.phones.length) lines.push(`📞 Telefony: ${p.phones.join(", ")}`);
  if (p.emails.length) lines.push(`📧 Emaile: ${p.emails.join(", ")}`);
  lines.push("", p.text);
  return lines.join("\n");
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

  let cleanUrl = url.trim().replace(/\/$/, "");
  if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;

  // 1. Fetch homepage
  let homepageHtml = "";
  const homepagePage = await fetchPage(cleanUrl);
  try {
    const res = await fetch(cleanUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OutreachAI-Auditor/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) homepageHtml = await res.text();
  } catch { /* proceed without */ }

  // 2. Extract and fetch subpages in parallel
  const subpageUrls = homepageHtml ? extractSubpageLinks(homepageHtml, cleanUrl) : [];
  const subpageResults = await Promise.all(subpageUrls.map((u) => fetchPage(u)));
  const subpages = subpageResults.filter((p): p is PageData => p !== null);

  // 3. Build context
  const allPages = [
    ...(homepagePage ? [pageToContext(homepagePage, "STRONA GŁÓWNA")] : [`=== STRONA GŁÓWNA: ${cleanUrl} ===\n(nie udało się pobrać)`]),
    ...subpages.map((p) => pageToContext(p, "PODSTRONA")),
  ];

  const pagesScanned = (homepagePage ? 1 : 0) + subpages.length;
  const allUrls = [cleanUrl, ...subpages.map((p) => p.url)];

  // Collect all phones/emails across all pages for summary
  const allPhones = [...new Set([
    ...(homepagePage?.phones ?? []),
    ...subpages.flatMap((p) => p.phones),
  ])];
  const allEmails = [...new Set([
    ...(homepagePage?.emails ?? []),
    ...subpages.flatMap((p) => p.emails),
  ])];

  const contactSummary = [
    allPhones.length ? `Znalezione numery telefonu: ${allPhones.join(", ")}` : "Brak numerów telefonu na żadnej stronie.",
    allEmails.length ? `Znalezione emaile: ${allEmails.join(", ")}` : "Brak adresów email.",
  ].join("\n");

  const prompt = `Analizujesz serwis: ${cleanUrl}
${industry ? `Branża: ${industry}` : ""}
Przeskanowano ${pagesScanned} stron: ${allUrls.join(", ")}

DANE KONTAKTOWE (wyekstrahowane z HTML):
${contactSummary}

TREŚCI STRON:
${allPages.join("\n\n")}

Na podstawie POWYŻSZYCH TREŚCI napisz szczegółowy raport audytu po polsku. Bazuj WYŁĄCZNIE na dostarczonych danych — jeśli coś jest, napisz to wprost (np. podaj znaleziony numer telefonu). Jeśli czegoś nie ma, napisz że nie znaleziono.

Struktura raportu (użyj dokładnie tych nagłówków):

OCENA OGÓLNA
Ocena: X/10
[2-3 zdania podsumowania — konkretne obserwacje]

✅ CO DZIAŁA DOBRZE
[5-7 konkretnych pozytywów z treści]

❌ KRYTYCZNE PROBLEMY
[5-7 konkretnych problemów szkodzących konwersji lub UX]

📱 MOBILE & SZYBKOŚĆ
[Wnioski na podstawie struktury HTML]

🎯 CTA I KONWERSJA
[Podaj konkretne numery telefonów/emaile jeśli znaleziono. Opisz formularze i przyciski CTA widoczne w treści.]

🔍 SEO PODSTAWY
[Title tagu, nagłówki H1/H2, meta description — podaj konkretne wartości z treści]

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
      maxTokens: 3500,
      system: "Jesteś ekspertem od audytów stron internetowych, UX i konwersji. Analizujesz wyłącznie dostarczone dane. Jeśli w danych są numery telefonów lub emaile — wymieniaj je wprost. Nigdy nie twierdzisz że czegoś nie ma jeśli jest w dostarczonych danych.",
    });
  } catch (err) {
    console.error("[audyt] Bedrock error:", err);
    return NextResponse.json({ error: "Błąd generowania audytu" }, { status: 500 });
  }

  const scoreMatch = report.match(/OCENA OGÓLNA[\s\S]*?Ocena:\s*(\d+)/i);
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

  const fullReport = `Przeskanowano ${pagesScanned} stron (${allUrls.join(", ")})\n\n${report}`;

  const [audit] = await prisma.$transaction([
    prisma.webAudit.create({
      data: { userId: user.id, url: cleanUrl, industry: industry || null, report: fullReport, score },
    }),
    ...(user.role !== "ADMIN" ? [
      prisma.user.update({ where: { id: user.id }, data: { credits: { decrement: AUDIT_COST } } }),
      prisma.activity.create({
        data: { userId: user.id, type: "WEB_AUDIT", description: `Audyt strony: ${cleanUrl} (${pagesScanned} stron)`, creditsUsed: AUDIT_COST },
      }),
    ] : []),
  ]);

  return NextResponse.json({ report: audit.report, score, auditId: audit.id, pagesScanned });
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const audits = await prisma.webAudit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, url: true, score: true, createdAt: true, report: true },
  });

  return NextResponse.json({ audits });
}
