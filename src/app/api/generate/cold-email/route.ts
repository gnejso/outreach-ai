import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/credits";
import { nanoid } from "nanoid";
import { CREDIT_COSTS } from "@/types";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, credits: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { rows, mapping, purpose, locale } = await req.json();
  if (!rows || !mapping || !purpose) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const totalCost = rows.length * CREDIT_COSTS.EMAIL_CONTENT;
  if (user.role !== "ADMIN" && user.credits < totalCost) {
    return NextResponse.json(
      { error: `Insufficient credits. Need ${totalCost}, have ${user.credits}` },
      { status: 402 }
    );
  }

  // Create session with immediate credit deduction
  const sessionId = nanoid();

  const creditsDeducted = user.role === "ADMIN" ? 0 : totalCost;
  if (creditsDeducted > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: creditsDeducted } },
    });
  }

  // Create session record
  await prisma.scriptSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      sessionType: "EMAIL",
      purpose,
      count: rows.length,
      creditsUsed: creditsDeducted,
      scripts: JSON.stringify({ mapping, rows, locale }),
    },
  });

  await logActivity({
    userId: user.id,
    type: "EMAIL_CONTENT",
    description: `Cold Email Session — ${rows.length} firm`,
    creditsUsed: creditsDeducted,
    metadata: { count: rows.length, sessionId, purpose },
  });

  return NextResponse.json({ sessionId, creditsDeducted });
}
