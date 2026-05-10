import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ShadowBoxingClient } from "@/components/shadow-boxing/ShadowBoxingClient";

export default async function ShadowBoxingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session?.user?.email) redirect(`/${locale}/login`);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, credits: true, role: true },
  });
  if (!user) redirect(`/${locale}/login`);

  return (
    <ShadowBoxingClient
      userCredits={user.credits}
      isAdmin={user.role === "ADMIN"}
      locale={locale}
    />
  );
}
