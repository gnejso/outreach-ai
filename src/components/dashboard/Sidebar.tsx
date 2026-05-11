"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link, useRouter } from "@/i18n/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { useState } from "react";
import { routing } from "@/i18n/routing";

const LOCALES = [
  { code: "pl", label: "PL", flag: "🇵🇱" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "de", label: "DE", flag: "🇩🇪" },
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "it", label: "IT", flag: "🇮🇹" },
  { code: "pt", label: "PT", flag: "🇵🇹" },
  { code: "nl", label: "NL", flag: "🇳🇱" },
  { code: "cs", label: "CS", flag: "🇨🇿" },
  { code: "uk", label: "UA", flag: "🇺🇦" },
];

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    credits?: number;
    freeScripts?: number;
  };
  locale: string;
  overdueReminders?: number;
}

export function Sidebar({ user, locale, overdueReminders = 0 }: SidebarProps) {
  const t = useTranslations("nav");
  const tc = useTranslations("credits");
  const pathname = usePathname();
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);

  const isAdmin = user.role === "ADMIN";
  const credits = user.credits ?? 0;
  const freeScripts = user.freeScripts ?? 0;

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: <DashIcon /> },
    { href: "/cold-call", label: t("coldCall"), icon: <CallIcon /> },
    { href: "/sms", label: t("sms"), icon: <SmsIcon /> },
    { href: "/scraper", label: t("findCompanies"), icon: <ScraperIcon /> },
    { href: "/reminders", label: t("followUps"), icon: <BellIcon />, badge: true },
    { href: "/jaskinia", label: t("jaskinia"), icon: <LionIcon /> },
    { href: "/audyt", label: t("audyt"), icon: <AuditIcon /> },
    { href: "/shadow-boxing", label: t("shadowBoxing"), icon: <BoxingIcon /> },
    { href: "/oferta", label: t("oferta"), icon: <DocumentIcon /> },
    { href: "/history", label: t("history"), icon: <HistoryIcon /> },
    { href: "/profile", label: t("profile"), icon: <ProfileIcon /> },
    { href: "/billing", label: t("billing"), icon: <BillingIcon /> },
  ];

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  function switchLocale(newLocale: string) {
    router.replace(pathname, { locale: newLocale as typeof routing.locales[number] });
    setLangOpen(false);
  }

  return (
    <aside
      suppressHydrationWarning
      style={{
        width: 240,
        minHeight: "100vh",
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "24px 0",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div suppressHydrationWarning style={{ padding: "0 20px 24px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div suppressHydrationWarning style={{ width: 8, height: 8, borderRadius: "50%", background: "#2A7FFF", boxShadow: "0 0 8px #2A7FFF", flexShrink: 0 }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "var(--text-primary)", letterSpacing: "-0.5px", textShadow: "0 0 20px rgba(42,127,255,0.5)" }}>
            OutreachAI
          </span>
        </Link>
      </div>

      {/* User Info */}
      <div suppressHydrationWarning style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div suppressHydrationWarning style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div
            suppressHydrationWarning
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--accent-subtle)",
              border: "1px solid var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--accent-bright)" }}>
                {(user.name ?? user.email ?? "?")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div suppressHydrationWarning style={{ overflow: "hidden" }}>
            <div suppressHydrationWarning style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110 }}>
                {user.name ?? user.email?.split("@")[0] ?? "User"}
              </span>
              {isAdmin && (
                <span
                  style={{
                    background: "rgba(42,127,255,0.15)",
                    border: "1px solid var(--accent)",
                    color: "var(--accent-bright)",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: 4,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.5px",
                  }}
                >
                  ADMIN
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Credits */}
        <div
          suppressHydrationWarning
          style={{
            background: "rgba(42,127,255,0.06)",
            border: "1px solid rgba(42,127,255,0.2)",
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          <div suppressHydrationWarning style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <div suppressHydrationWarning style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, letterSpacing: "0.06em" }}>
              💎 {tc("label")}
            </div>
            <div
              suppressHydrationWarning
            style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: 16,
                color: isAdmin ? "var(--warning)" : "var(--accent-bright)",
              }}
            >
              {credits.toLocaleString()}
            </div>
          </div>
          {!isAdmin && (
            <>
              <div style={{ height: 3, background: "var(--bg-hover)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min((credits / 500) * 100, 100)}%`,
                  background: credits < 50 ? "var(--danger)" : "var(--accent)",
                  borderRadius: 2,
                  boxShadow: credits > 0 ? "0 0 6px var(--accent-glow)" : "none",
                }} />
              </div>
              {freeScripts > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: "var(--success)", fontWeight: 600 }}>
                  + {freeScripts} darmowych Cold Call
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href as Parameters<typeof Link>[0]["href"]}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                textDecoration: "none",
                color: isActive ? "#E8F0FF" : "var(--text-secondary)",
                background: isActive ? "rgba(42,127,255,0.1)" : "transparent",
                borderLeft: isActive ? "2px solid #2A7FFF" : "2px solid transparent",
                boxShadow: isActive ? "inset 4px 0 20px rgba(42,127,255,0.06)" : "none",
                transition: "all 0.15s",
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
              }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
            >
              <span style={{ color: isActive ? "var(--accent-bright)" : "var(--text-muted)", flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && overdueReminders > 0 && (
                <span
                  style={{
                    background: "var(--danger, #c93b3b)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: "1px 6px",
                    borderRadius: 10,
                    minWidth: 18,
                    textAlign: "center",
                    lineHeight: "16px",
                    flexShrink: 0,
                  }}
                >
                  {overdueReminders}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Language + Logout */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }} suppressHydrationWarning>
        {/* Language Switcher */}
        <div suppressHydrationWarning style={{ position: "relative", marginBottom: 10 }}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-secondary)",
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{currentLocale.flag}</span>
            <span style={{ flex: 1, textAlign: "left" }}>{currentLocale.label}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ transform: langOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {langOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                position: "absolute",
                bottom: "100%",
                left: 0,
                right: 0,
                marginBottom: 4,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-bright)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                boxShadow: "0 -8px 24px rgba(0,0,0,0.3)",
              }}
            >
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => switchLocale(l.code)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: l.code === locale ? "var(--accent-subtle)" : "transparent",
                    border: "none",
                    color: l.code === locale ? "var(--text-primary)" : "var(--text-secondary)",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    textAlign: "left",
                  }}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-muted)",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--danger)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}

function DashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CallIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.18 19.79 19.79 0 01.01 4.52 2 2 0 012 2.36h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SmsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <polyline points="9 11 12 14 22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BillingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
      <line x1="1" y1="10" x2="23" y2="10" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ScraperIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LionIcon() {
  return <span style={{ fontSize: 14, lineHeight: 1 }}>🦁</span>;
}

function AuditIcon() {
  return <span style={{ fontSize: 14, lineHeight: 1 }}>🔍</span>;
}

function BoxingIcon() {
  return <span style={{ fontSize: 14, lineHeight: 1 }}>🥊</span>;
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="10 9 9 9 8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
