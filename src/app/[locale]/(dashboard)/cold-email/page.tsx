import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ColdEmailClient } from "@/components/cold-email/ColdEmailClient";

export default async function ColdEmailPage() {
  const session = await getSession();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, credits: true, role: true },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ColdEmailClient userEmail={user.email} />
    </div>
  );
}
