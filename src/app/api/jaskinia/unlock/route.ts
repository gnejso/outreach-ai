import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = await req.json();
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, credits: true, role: true, tier: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const UNLOCK_COST = user.tier === "FREE" ? 6 : 0;

  if (user.role !== "ADMIN" && user.tier === "FREE") {
    if (user.credits < UNLOCK_COST) return NextResponse.json({ error: "Niewystarczające kredyty" }, { status: 402 });
  }

  const existing = await prisma.unlockedStrategy.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
  });
  if (existing) return NextResponse.json({ success: true, alreadyUnlocked: true });

  await prisma.$transaction(async (tx) => {
    await tx.unlockedStrategy.create({ data: { userId: user.id, businessId } });
    if (user.role !== "ADMIN" && UNLOCK_COST > 0) {
      await tx.user.update({ where: { id: user.id }, data: { credits: { decrement: UNLOCK_COST } } });
      await tx.activity.create({
        data: {
          userId: user.id,
          type: "JASKINIA_UNLOCK",
          description: "Odblokowanie strategii w Jaskini Łowcy",
          creditsUsed: UNLOCK_COST,
        },
      });
    }
  });

  return NextResponse.json({ success: true });
}
