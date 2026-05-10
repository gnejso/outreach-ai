import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OfertaClient } from "@/components/oferta/OfertaClient";

export default async function OfertaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [{ locale }, session] = await Promise.all([
    params,
    getSession(),
  ]);

  if (!session?.user?.email) redirect(`/${locale}/login`);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { credits: true, role: true },
  });

  if (!user) redirect(`/${locale}/login`);

  return (
    <OfertaClient
      userCredits={user.credits}
      isAdmin={user.role === "ADMIN"}
    />
  );
}
