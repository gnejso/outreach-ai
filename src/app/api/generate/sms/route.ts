import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { mapColumns } from "@/lib/spreadsheet";
import { CREDIT_COSTS } from "@/types";
import type { ColumnMapping } from "@/types";

export const maxDuration = 60;

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

    let body: { rows: Record<string, string>[]; mapping: ColumnMapping; purpose?: string; city?: string; locale?: string };
    try {
      body = await request.json();
    } catch (e) {
      console.error("[sms/route] Failed to parse body:", e);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { rows, mapping, purpose, locale = "pl" } = body;

    if (!rows?.length || !mapping) {
      return NextResponse.json({ error: "Missing rows or mapping" }, { status: 400 });
    }

    const globalPurpose = (purpose ?? "").trim() || "ogólna propozycja";

    const companies = mapColumns(rows, mapping);
    const totalCost = companies.length * CREDIT_COSTS.SMS_CONTENT;

    // Check credits upfront
    if (user.role !== "ADMIN" && user.credits < totalCost) {
      return NextResponse.json(
        { error: "Insufficient credits", needed: totalCost - user.credits },
        { status: 402 }
      );
    }

    // Deduct ALL credits immediately
    if (user.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: totalCost } },
      });
    }

    // Create session with all businesses data
    const savedSession = await prisma.scriptSession.create({
      data: {
        userId: user.id,
        sessionType: "SMS",
        purpose: globalPurpose,
        count: companies.length,
        creditsUsed: totalCost,
        scripts: JSON.stringify(companies), // Store all businesses for lazy loading
      },
    });

    await logActivity({
      userId: user.id,
      type: "SMS_CONTENT",
      description: `SMS Session — ${companies.length} firm`,
      creditsUsed: totalCost,
      metadata: { count: companies.length, sessionId: savedSession.id, purpose: globalPurpose },
    });

    return NextResponse.json({
      sessionId: savedSession.id,
      count: companies.length,
      creditsDeducted: totalCost,
    });
  } catch (err) {
    console.error("[sms/route] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
