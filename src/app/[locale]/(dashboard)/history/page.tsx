import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { HistoryClient } from "@/components/dashboard/HistoryClient";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session?.user?.email) redirect(`/${locale}/login`);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) redirect(`/${locale}/login`);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [activities, monthlyStats, scriptCount, smsCount, scriptSessions] = await Promise.all([
    prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.activity.aggregate({
      where: { userId: user.id, createdAt: { gte: startOfMonth } },
      _sum: { creditsUsed: true },
    }),
    prisma.activity.count({
      where: { userId: user.id, type: "COLD_CALL_SCRIPT" },
    }),
    prisma.activity.count({
      where: { userId: user.id, type: "SMS_SEND" },
    }),
    prisma.scriptSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, purpose: true, count: true, creditsUsed: true, createdAt: true },
    }),
  ]);

  return (
    <HistoryClient
      activities={activities.map((a) => ({
        id: a.id,
        type: a.type as import("@/types").ActivityType,
        description: a.description,
        creditsUsed: a.creditsUsed,
        metadata: (() => { try { return a.metadata ? JSON.parse(a.metadata as string) as Record<string, unknown> : null; } catch { return null; } })(),
        createdAt: a.createdAt.toISOString(),
      }))}
      stats={{
        creditsUsedMonth: monthlyStats._sum.creditsUsed ?? 0,
        totalScripts: scriptCount,
        totalSms: smsCount,
      }}
      scriptSessions={scriptSessions.map((s) => ({
        id: s.id,
        purpose: s.purpose,
        count: s.count,
        creditsUsed: s.creditsUsed,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
