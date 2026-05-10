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

  const user = session?.user?.email ? await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { credits: true, role: true },
  }) : null;

  return (
    <OfertaClient
      userCredits={user?.credits ?? 0}
      isAdmin={user?.role === "ADMIN"}
      userEmail={session?.user?.email}
    />
  );
}
