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

  const user = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, credits: true, role: true },
  }) : null;

  return (
    <ShadowBoxingClient
      userCredits={user?.credits ?? 0}
      isAdmin={user?.role === "ADMIN"}
      locale={locale}
      userEmail={session?.user?.email}
    />
  );
}
