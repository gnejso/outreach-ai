import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AudytClient } from "@/components/audyt/AudytClient";

export default async function AudytPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  const user = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, credits: true, role: true },
  }) : null;

  const recentAudits = user ? await prisma.webAudit.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, url: true, score: true, createdAt: true, report: true },
  }) : [];

  return (
    <AudytClient
      userCredits={user?.credits ?? 0}
      isAdmin={user?.role === "ADMIN"}
      locale={locale}
      userEmail={session?.user?.email}
      recentAudits={recentAudits.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  );
}
