import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ResponsiveLayout } from "@/components/dashboard/ResponsiveLayout";
import { GuestBanner } from "@/components/dashboard/GuestBanner";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();

  const user = session?.user
    ? (session.user as {
        id?: string;
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
        credits?: number;
        freeScripts?: number;
      })
    : {
        name: "Guest",
        email: null,
        image: null,
        role: "USER",
        credits: 0,
        freeScripts: 0,
      };

  let overdueReminders = 0;
  if (session?.user?.email) {
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
  }

  return (
    <div suppressHydrationWarning className="page-bg" style={{ display: "flex", minHeight: "100vh" }}>
      <ResponsiveLayout
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
      >
        {!session?.user && <GuestBanner />}
        {children}
      </ResponsiveLayout>
    </div>
  );
}
