import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Find promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      return NextResponse.json({ error: "Nieprawidłowy kod" }, { status: 404 });
    }

    if (!promoCode.active) {
      return NextResponse.json({ error: "Kod wygasł" }, { status: 400 });
    }

    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      return NextResponse.json({ error: "Kod wygasł" }, { status: 400 });
    }

    if (promoCode.usedCount >= promoCode.maxUses) {
      return NextResponse.json({ error: "Kod został już wykorzystany" }, { status: 400 });
    }

    // Add credits to user and increment usage
    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { email: session.user.email },
        data: { credits: { increment: promoCode.credits } },
        select: { credits: true },
      }),
      prisma.promoCode.update({
        where: { id: promoCode.id },
        data: { usedCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      credits: user.credits,
      added: promoCode.credits,
    });
  } catch (error) {
    console.error("Promo code error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
