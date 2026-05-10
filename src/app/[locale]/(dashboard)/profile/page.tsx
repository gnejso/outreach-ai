import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/dashboard/ProfileClient";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  const user = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, image: true, role: true, tier: true, credits: true, freeScripts: true, createdAt: true },
  }) : null;

  return (
    <ProfileClient
      isGuest={!session?.user?.email}
      user={{
        id: user?.id ?? "",
        name: user?.name ?? null,
        email: user?.email ?? "",
        image: user?.image ?? null,
        role: user?.role ?? "USER",
        tier: user?.tier ?? "FREE",
        credits: user?.credits ?? 0,
        freeScripts: user?.freeScripts ?? 0,
        createdAt: user?.createdAt.toISOString() ?? new Date().toISOString(),
      }}
      locale={locale}
    />
  );
}
