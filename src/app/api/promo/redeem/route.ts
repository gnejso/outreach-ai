import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const TIER_CREDITS: Record<string, number> = {
  TIER1: 400,
  TIER2: 1500,
  TIER3: 2500,
};

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

    const tierName = promoCode.tier;
    const creditsToAdd = tierName && TIER_CREDITS[tierName] ? TIER_CREDITS[tierName] : promoCode.credits;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const userUpdateData: Record<string, unknown> = {
      credits: { increment: creditsToAdd },
    };
    if (tierName && TIER_CREDITS[tierName]) {
      userUpdateData.tier = tierName;
    }

    const [user] = await prisma.$transaction([
      prisma.user.update({
        where: { email: session.user.email },
        data: userUpdateData,
        select: { credits: true, tier: true },
      }),
      prisma.promoCode.update({
        where: { id: promoCode.id },
        data: {
          usedCount: { increment: 1 },
          usedBy: session.user.email,
          usedAt: new Date(),
          ...(promoCode.maxUses === 1 ? { active: false } : {}),
        },
      }),
    ]);

    const tierLabel = tierName ? ` — aktywowano plan ${tierName}` : "";
    return NextResponse.json({
      success: true,
      credits: user.credits,
      added: creditsToAdd,
      tier: user.tier,
      message: `✅ Dodano ${creditsToAdd} kredytów${tierLabel}!`,
    });
  } catch (error) {
    console.error("Promo code error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
