import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ScraperClient } from "@/components/scraper/ScraperClient";
import { SCRAPER_LIMITS } from "@/config/credits";

export default async function ScraperPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  const user = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, tier: true, credits: true, role: true },
  }) : null;

  const tierLimit = SCRAPER_LIMITS[user?.tier as keyof typeof SCRAPER_LIMITS] ?? 0;

  // Get today's usage
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayScraperUse = user ? await prisma.activity.aggregate({
    where: {
      userId: user?.id,
      type: "SCRAPER_USE",
      createdAt: { gte: today },
    },
    _sum: { creditsUsed: true },
  }) : { _sum: { creditsUsed: 0 } };

  const usedToday = todayScraperUse._sum.creditsUsed ?? 0;

  return (
    <ScraperClient
      userTier={user?.tier ?? "FREE"}
      userRole={user?.role ?? "USER"}
      userCredits={user?.credits ?? 0}
      dailyLimit={tierLimit}
      usedToday={usedToday}
      userEmail={session?.user?.email}
    />
  );
}
