import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  if (!session?.user?.email) {
    redirect(`/${locale}/login`);
  }

  const user = session.user as {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    credits?: number;
    freeScripts?: number;
  };

  let overdueReminders = 0;
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });
    if (dbUser) {
      overdueReminders = await prisma.businessNote.count({
        where: {
          userId: dbUser.id,
          followUpDate: { not: null, lte: new Date() },
          followUpDone: false,
        },
      });
    }
  } catch {
    // non-critical — sidebar badge simply shows 0
  }

  return (
    <div suppressHydrationWarning className="page-bg" style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          credits: user.credits,
          freeScripts: user.freeScripts,
        }}
        locale={locale}
        overdueReminders={overdueReminders}
      />
      <main
        suppressHydrationWarning
        style={{
          marginLeft: 240,
          flex: 1,
          padding: "32px 40px",
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}
