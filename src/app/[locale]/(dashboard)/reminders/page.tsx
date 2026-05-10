import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RemindersClient } from "@/components/dashboard/RemindersClient";

export default async function RemindersPage({
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

  const now = new Date();
  const notes = await prisma.businessNote.findMany({
    where: {
      userId: user.id,
      followUpDate: { not: null },
      followUpDone: false,
    },
    orderBy: { followUpDate: "asc" },
    select: {
      id: true,
      sessionId: true,
      businessName: true,
      status: true,
      note: true,
      followUpDate: true,
      followUpDone: true,
    },
  });

  const reminders = notes.map((n) => ({
    id: n.id,
    sessionId: n.sessionId,
    businessName: n.businessName,
    status: n.status,
    note: n.note,
    followUpDate: n.followUpDate!.toISOString(),
    followUpDone: n.followUpDone,
  }));

  const overdueCount = reminders.filter((r) => new Date(r.followUpDate) < now && r.followUpDate.slice(0, 10) !== now.toISOString().slice(0, 10)).length;
  const todayCount = reminders.filter((r) => r.followUpDate.slice(0, 10) === now.toISOString().slice(0, 10)).length;

  return (
    <RemindersClient
      reminders={reminders}
      overdueCount={overdueCount}
      todayCount={todayCount}
    />
  );
}
