import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { checkAndDeductCredits, logActivity } from "@/lib/credits";
import { mapColumns } from "@/lib/spreadsheet";
import { CREDIT_COSTS } from "@/types";
import type { ColumnMapping } from "@/types";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, credits: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const {
    rows,
    mapping,
    purpose: globalPurpose,
    locale = "pl",
  }: { rows: Record<string, string>[]; mapping: ColumnMapping; purpose?: string; locale?: string } = body;

  if (!rows?.length || !mapping) {
    return NextResponse.json({ error: "Missing rows or mapping" }, { status: 400 });
  }

  if (!globalPurpose?.trim()) {
    return NextResponse.json({ error: "Missing call purpose" }, { status: 400 });
  }

  const companies = mapColumns(rows, mapping);
  const totalCost = companies.length * CREDIT_COSTS.COLD_CALL_SCRIPT;

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
      purpose: globalPurpose,
      count: companies.length,
      creditsUsed: totalCost,
      scripts: JSON.stringify(companies), // Store all businesses for lazy loading
    },
  });

  await logActivity({
    userId: user.id,
    type: "COLD_CALL_SCRIPT",
    description: `Cold Call Session — ${companies.length} firm`,
    creditsUsed: totalCost,
    metadata: { count: companies.length, sessionId: savedSession.id, purpose: globalPurpose },
  });

  return NextResponse.json({
    sessionId: savedSession.id,
    count: companies.length,
    creditsDeducted: totalCost,
  });
}
