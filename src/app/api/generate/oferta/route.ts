import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { invokeBedrock } from "@/lib/bedrock";
import { CREDIT_COSTS } from "@/config/credits";

export const maxDuration = 60;

interface RequestBody {
  kraj: string;
  twojaFirma: string;
  firmaKlienta: string;
  branza: string;
  usluga: string;
  cena: number;
  waluta: string;
  szczegoly?: string;
  dataWystawienia: string;
  dataZawarcia: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true, credits: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body: RequestBody = await request.json();
    const { kraj, twojaFirma, firmaKlienta, branza, usluga, cena, waluta, szczegoly, dataWystawienia, dataZawarcia } = body;

    // Validate required fields
    if (!kraj || !twojaFirma || !firmaKlienta || !branza || !usluga || !cena || !waluta || !dataWystawienia || !dataZawarcia) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cost = CREDIT_COSTS.OFERTA_UMOWA;

    // Check credits upfront
    if (user.role !== "ADMIN" && user.credits < cost) {
      return NextResponse.json(
        { error: "Insufficient credits", needed: cost - user.credits },
        { status: 402 }
      );
    }

    // Deduct credits immediately
    if (user.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: cost } },
      });
    }

    // Build prompt
    const userPrompt = `Jesteś ekspertem od sprzedaży B2B i prawa handlowego. Wygeneruj profesjonalny dokument składający się z dwóch części: oferty handlowej i szkicu umowy B2B.

Kraj: ${kraj}
Twoja firma / imię: ${twojaFirma}
Firma klienta: ${firmaKlienta}
Branża klienta: ${branza}
Oferowana usługa: ${usluga}
Cena: ${cena} ${waluta}
Data wystawienia oferty: ${dataWystawienia}
Data zawarcia umowy: ${dataZawarcia}
Dodatkowe szczegóły: ${szczegoly || "Brak"}

Wygeneruj dokument w języku odpowiednim dla podanego kraju (jeśli kraj = Polska → po polsku, Niemcy → po niemiecku, UK/USA → po angielsku itd.).

CZĘŚĆ 1 — OFERTA HANDLOWA:
- Nagłówek z nazwami firm i datą wystawienia (${dataWystawienia})
- Krótkie wprowadzenie (1-2 zdania o problemie klienta i rozwiązaniu)
- Zakres usługi (3-5 punktów)
- Cena i warunki płatności
- Termin realizacji (jeśli podano w szczegółach)
- Dlaczego warto (2-3 zdania o wartości)
- Call to action

CZĘŚĆ 2 — SZKIC UMOWY B2B:
- Nagłówek z datą zawarcia umowy (${dataZawarcia})
- Strony umowy
- Przedmiot umowy
- Wynagrodzenie i warunki płatności
- Prawa autorskie / własność intelektualna
- Poufność
- Klauzula wypowiedzenia
- Prawo właściwe (dostosowane do kraju: dla Polski → prawo polskie i Kodeks Cywilny, dla Niemiec → BGB, dla UK → English law itd.)

Na końcu dokumentu dodaj wyraźny disclaimer:
"⚠️ WAŻNE: Ten dokument jest szablonem pomocniczym wygenerowanym przez AI. Przed podpisaniem skonsultuj go z prawnikiem. Nie stanowi porady prawnej."

Formatuj czytelnie używając nagłówków i akapitów. Nie używaj tabelek.`;

    // Call Bedrock Haiku (same model as SMS/Cold Call/Shadow Boxing)
    const result = await invokeBedrock({
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 3000,
      temperature: 0.7,
    });

    // Log activity
    await logActivity({
      userId: user.id,
      type: "OFERTA_UMOWA",
      description: `Wygenerowano ofertę dla: ${firmaKlienta}`,
      creditsUsed: cost,
      metadata: {
        kraj,
        twojaFirma,
        firmaKlienta,
        branza,
        cena,
        waluta,
      },
    });

    return NextResponse.json({
      result,
      creditsDeducted: cost,
    });
  } catch (err) {
    console.error("[oferta/route] Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[oferta/route] Error details:", errorMessage);
    return NextResponse.json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined
    }, { status: 500 });
  }
}
