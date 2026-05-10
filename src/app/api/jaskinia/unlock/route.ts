import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { businessId } = await req.json();
  if (!businessId) return NextResponse.json({ error: "Missing businessId" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, credits: true, role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.role !== "ADMIN") {
    if (user.credits < 5) return NextResponse.json({ error: "Niewystarczające kredyty" }, { status: 402 });
  }

  const existing = await prisma.unlockedStrategy.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
  });
  if (existing) return NextResponse.json({ success: true, alreadyUnlocked: true });

  await prisma.$transaction(async (tx) => {
    await tx.unlockedStrategy.create({ data: { userId: user.id, businessId } });
    if (user.role !== "ADMIN") {
      await tx.user.update({ where: { id: user.id }, data: { credits: { decrement: 5 } } });
      await tx.activity.create({
        data: {
          userId: user.id,
          type: "JASKINIA_UNLOCK",
          description: "Odblokowanie strategii w Jaskini Łowcy",
          creditsUsed: 5,
        },
      });
    }
  });

  return NextResponse.json({ success: true });
}
