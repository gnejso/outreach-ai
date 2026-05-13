"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { BottomNav } from "@/components/dashboard/BottomNav";

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    credits?: number;
    freeScripts?: number;
  };
  locale: string;
  overdueReminders: number;
  children: React.ReactNode;
}

export function ResponsiveLayout({ user, locale, overdueReminders, children }: Props) {
  return (
    <>
      <style jsx global>{`
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .desktop-main { margin-left: 0 !important; padding: 76px 16px 80px 16px !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .desktop-sidebar { width: 72px !important; }
          .desktop-sidebar .sidebar-text { display: none !important; }
          .desktop-sidebar .sidebar-logo-text { display: none !important; }
          .desktop-sidebar .user-info-text { display: none !important; }
          .desktop-sidebar .credits-box { padding: 8px !important; }
          .desktop-sidebar .nav-item { justify-content: center !important; padding: 12px 0 !important; }
          .desktop-main { margin-left: 72px !important; padding: 24px 24px !important; }
          .mobile-header { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
        }
        @media (min-width: 1024px) {
          .mobile-header { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
        }
        @media (max-width: 767px) {
          .mobile-header { display: flex !important; }
          .mobile-bottom-nav { display: flex !important; }
        }
      `}</style>

      <div className="mobile-header" style={{ display: "none" }}>
        <MobileHeader user={user} />
      </div>

      <div className="desktop-sidebar">
        <Sidebar
          user={user}
          locale={locale}
          overdueReminders={overdueReminders}
        />
      </div>

      <main
        suppressHydrationWarning
        className="desktop-main"
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

      <div className="mobile-bottom-nav" style={{ display: "none" }}>
        <BottomNav overdueReminders={overdueReminders} />
      </div>
    </>
  );
}
