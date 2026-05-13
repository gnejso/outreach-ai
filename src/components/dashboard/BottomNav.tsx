"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  overdueReminders?: number;
}

export function BottomNav({ overdueReminders = 0 }: Props) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: <DashIcon /> },
    { href: "/cold-call", label: "Scripts", icon: <CallIcon /> },
    { href: "/sms", label: "SMS", icon: <SmsIcon /> },
    { href: "/cold-email", label: "Email", icon: <EmailIcon /> },
  ];

  const moreItems: NavItem[] = [
    { href: "/scraper", label: "Znajdź firmy", icon: <ScraperIcon /> },
    { href: "/reminders", label: "Follow-upy", icon: <BellIcon /> },
    { href: "/jaskinia", label: "Jaskinia", icon: <LionIcon /> },
    { href: "/audyt", label: "Audyt", icon: <AuditIcon /> },
    { href: "/shadow-boxing", label: "Shadow Boxing", icon: <BoxingIcon /> },
    { href: "/oferta", label: "Oferta & Umowa", icon: <DocumentIcon /> },
    { href: "/history", label: "Historia", icon: <HistoryIcon /> },
    { href: "/profile", label: "Profil", icon: <ProfileIcon /> },
    { href: "/billing", label: "Płatności", icon: <BillingIcon /> },
  ];

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 100,
          padding: "0 8px",
        }}
      >
        {primaryItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href as Parameters<typeof Link>[0]["href"]}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "8px 12px",
                textDecoration: "none",
                color: isActive ? "var(--accent-bright)" : "var(--text-muted)",
                fontSize: 11,
                fontWeight: isActive ? 600 : 400,
                flex: 1,
                maxWidth: 80,
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          onClick={() => setMoreOpen(!moreOpen)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "8px 12px",
            background: "transparent",
            border: "none",
            color: moreOpen ? "var(--accent-bright)" : "var(--text-muted)",
            fontSize: 11,
            fontWeight: moreOpen ? 600 : 400,
            cursor: "pointer",
            flex: 1,
            maxWidth: 80,
          }}
        >
          <span style={{ fontSize: 20 }}>⋯</span>
          <span>Więcej</span>
        </button>
      </div>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 99,
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{
                position: "fixed",
                bottom: 64,
                left: 0,
                right: 0,
                maxHeight: "60vh",
                background: "var(--bg-elevated)",
                borderTop: "1px solid var(--border-bright)",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: "20px 0 8px",
                zIndex: 100,
                overflowY: "auto",
                boxShadow: "0 -4px 24px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "0 16px" }}>
                {moreItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const isReminders = item.href === "/reminders";
                  return (
                    <Link
                      key={item.href}
                      href={item.href as Parameters<typeof Link>[0]["href"]}
                      onClick={() => setMoreOpen(false)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        padding: "16px 8px",
                        textDecoration: "none",
                        color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 400,
                        background: isActive ? "var(--accent-subtle)" : "transparent",
                        borderRadius: 12,
                        position: "relative",
                      }}
                    >
                      <span style={{ fontSize: 24, color: isActive ? "var(--accent-bright)" : "var(--text-muted)" }}>
                        {item.icon}
                      </span>
                      <span style={{ textAlign: "center", lineHeight: 1.3 }}>{item.label}</span>
                      {isReminders && overdueReminders > 0 && (
                        <span
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            background: "var(--danger)",
                            color: "white",
                            fontSize: 10,
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            padding: "2px 6px",
                            borderRadius: 10,
                            minWidth: 18,
                            textAlign: "center",
                          }}
                        >
                          {overdueReminders}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function DashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CallIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.18 19.79 19.79 0 01.01 4.52 2 2 0 012 2.36h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SmsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <polyline points="9 11 12 14 22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BillingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
      <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ScraperIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LionIcon() {
  return <span style={{ fontSize: 18, lineHeight: 1 }}>🦁</span>;
}

function AuditIcon() {
  return <span style={{ fontSize: 18, lineHeight: 1 }}>🔍</span>;
}

function BoxingIcon() {
  return <span style={{ fontSize: 18, lineHeight: 1 }}>🥊</span>;
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
