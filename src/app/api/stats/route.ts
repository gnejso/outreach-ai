import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const [
      totalBusinesses,
      byStatusRaw,
      creditsToday,
      followUpsToday,
      recentActivities,
    ] = await Promise.all([
      prisma.businessNote.count({ where: { userId: user.id } }),
      prisma.businessNote.groupBy({
        by: ["status"],
        where: { userId: user.id },
        _count: { status: true },
      }),
      prisma.activity.aggregate({
        where: { userId: user.id, createdAt: { gte: todayStart, lt: todayEnd } },
        _sum: { creditsUsed: true },
      }),
      prisma.businessNote.count({
        where: {
          userId: user.id,
          followUpDate: { gte: todayStart, lt: todayEnd },
          followUpDone: false,
        },
      }),
      prisma.activity.findMany({
        where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, type: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of byStatusRaw) {
      byStatus[row.status] = row._count.status;
    }

    const zainteresowany = byStatus["INTERESTED"] ?? 0;
    const zamkniety = byStatus["CLOSED"] ?? 0;
    const conversionRate = totalBusinesses > 0
      ? Math.round(((zainteresowany + zamkniety) / totalBusinesses) * 100)
      : 0;

    // Build last 30 days activity chart data
    const chartMap: Record<string, number> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      chartMap[key] = 0;
    }
    for (const a of recentActivities) {
      if (a.type === "COLD_CALL_SCRIPT" || a.type === "SMS_SEND" || a.type === "SMS_CONTENT") {
        const key = a.createdAt.toISOString().slice(0, 10);
        if (key in chartMap) chartMap[key]++;
      }
    }
    const activityLast30Days = Object.entries(chartMap).map(([date, count]) => ({ date, count }));

    return NextResponse.json({
      totalBusinesses,
      byStatus: {
        NEW: byStatus["NEW"] ?? 0,
        IN_PROGRESS: byStatus["IN_PROGRESS"] ?? 0,
        INTERESTED: zainteresowany,
        CLOSED: zamkniety,
        REJECTED: byStatus["REJECTED"] ?? 0,
      },
      conversionRate,
      creditsUsedToday: creditsToday._sum.creditsUsed ?? 0,
      followUpsToday,
      activityLast30Days,
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({
      totalBusinesses: 0,
      byStatus: { NEW: 0, IN_PROGRESS: 0, INTERESTED: 0, CLOSED: 0, REJECTED: 0 },
      conversionRate: 0,
      creditsUsedToday: 0,
      followUpsToday: 0,
      activityLast30Days: [],
    });
  }
}
