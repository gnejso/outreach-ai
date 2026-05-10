import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// GET /api/script-sessions — list all sessions for current user
export async function GET() {
  const session = await getSession();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sessions = await prisma.scriptSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, purpose: true, count: true, creditsUsed: true, createdAt: true },
  });

  return NextResponse.json({ sessions });
}

// GET /api/script-sessions/[id] is in [id]/route.ts
