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
  if (!session?.user?.email) redirect(`/${locale}/login`);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, name: true, email: true, image: true, role: true, tier: true, credits: true, freeScripts: true, createdAt: true },
  });
  if (!user) redirect(`/${locale}/login`);

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        tier: user.tier,
        credits: user.credits,
        freeScripts: user.freeScripts,
        createdAt: user.createdAt.toISOString(),
      }}
      locale={locale}
    />
  );
}
