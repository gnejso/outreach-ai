import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session?.user?.email) redirect(`/${locale}/login`);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, role: true, credits: true, freeScripts: true, createdAt: true, tier: true },
  });
  if (!user) redirect(`/${locale}/login`);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    monthlyStats,
    recentActivities,
    scriptCount,
    smsCount,
    statusGroups,
    creditsToday,
    followUpsToday,
    activityByDate,
  ] = await Promise.all([
    prisma.activity.aggregate({
      where: { userId: user.id, createdAt: { gte: startOfMonth } },
      _sum: { creditsUsed: true },
    }),
    prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, type: true, description: true, creditsUsed: true, createdAt: true, metadata: true },
    }),
    prisma.activity.count({
      where: { userId: user.id, type: "COLD_CALL_SCRIPT", createdAt: { gte: startOfMonth } },
    }),
    prisma.activity.count({
      where: { userId: user.id, type: "SMS_SEND", createdAt: { gte: startOfMonth } },
    }),
    prisma.businessNote.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: true,
    }),
    prisma.activity.aggregate({
      where: { userId: user.id, createdAt: { gte: startOfToday } },
      _sum: { creditsUsed: true },
    }),
    prisma.businessNote.count({
      where: { userId: user.id, followUpDate: { gte: startOfToday, lt: new Date(startOfToday.getTime() + 86400000) }, followUpDone: false },
    }),
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Activity"
      WHERE "userId" = ${user.id}
        AND "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
  ]);

  const byStatus = { NEW: 0, IN_PROGRESS: 0, INTERESTED: 0, CLOSED: 0, REJECTED: 0 };
  for (const g of statusGroups) {
    if (g.status in byStatus) byStatus[g.status as keyof typeof byStatus] = g._count;
  }
  const totalBusinesses = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const conversionRate = totalBusinesses > 0 ? Math.round((byStatus.CLOSED / totalBusinesses) * 100) : 0;

  const activityLast30Days = activityByDate.map((r) => ({
    date: r.date,
    count: Number(r.count),
  }));

  return (
    <DashboardClient
      user={{
        name: user.name,
        role: user.role,
        credits: user.credits,
        tier: user.tier,
        createdAt: user.createdAt.toISOString(),
      }}
      stats={{
        creditsUsedMonth: monthlyStats._sum.creditsUsed ?? 0,
        scriptsMonth: scriptCount,
        smsMonth: smsCount,
        totalBusinesses,
        byStatus,
        conversionRate,
        creditsUsedToday: creditsToday._sum.creditsUsed ?? 0,
        followUpsToday,
        activityLast30Days,
      }}
      recentActivities={recentActivities.map((a) => ({
        id: a.id,
        type: a.type as import("@/types").ActivityType,
        description: a.description,
        creditsUsed: a.creditsUsed,
        createdAt: a.createdAt.toISOString(),
        metadata: (() => { try { return a.metadata ? JSON.parse(a.metadata as string) : null; } catch { return null; } })(),
      }))}
    />
  );
}
