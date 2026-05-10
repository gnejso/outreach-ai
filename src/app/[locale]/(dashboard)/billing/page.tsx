import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BillingClient } from "@/components/billing/BillingClient";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  const user = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, credits: true, tier: true, role: true },
  }) : null;

  const transactions = user ? await prisma.activity.findMany({
    where: {
      userId: user.id,
      type: { in: ["CREDITS_PURCHASE", "SUBSCRIPTION_RENEWAL"] },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  }) : [];

  return (
    <BillingClient
      user={{ credits: user?.credits ?? 0, tier: user?.tier ?? "FREE", role: user?.role ?? "USER" }}
      locale={locale}
      transactions={transactions.map((t) => ({
        id: t.id,
        type: t.type,
        description: t.description,
        creditsUsed: t.creditsUsed,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  );
}
