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
  if (!session?.user?.email) redirect(`/${locale}/login`);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, credits: true, tier: true, role: true },
  });
  if (!user) redirect(`/${locale}/login`);

  const transactions = await prisma.activity.findMany({
    where: {
      userId: user.id,
      type: { in: ["CREDITS_PURCHASE", "SUBSCRIPTION_RENEWAL"] },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <BillingClient
      user={{ credits: user.credits, tier: user.tier, role: user.role }}
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
