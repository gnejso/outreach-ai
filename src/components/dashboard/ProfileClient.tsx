"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { routing } from "@/i18n/routing";

const LOCALES = [
  { code: "pl", label: "Polski", flag: "🇵🇱" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "cs", label: "Čeština", flag: "🇨🇿" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
];

const TIER_LABELS: Record<string, string> = {
  FREE: "Free",
  TIER1: "Tier 1",
  TIER2: "Tier 2",
  TIER3: "Tier 3",
  ADMIN: "Admin",
};

interface Props {
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role: string;
    tier: string;
    credits: number;
    freeScripts: number;
    createdAt: string;
  };
  locale: string;
}

export function ProfileClient({ user, locale }: Props) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const isAdmin = user.role === "ADMIN";

  function handleLocaleChange(newLocale: string) {
    router.replace("/profile", { locale: newLocale as typeof routing.locales[number] });
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32, color: "var(--text-primary)", marginBottom: 36 }}>
        {t("title")}
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
        {/* Left: User Info */}
        <div className="card" style={{ padding: 36 }}>
          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid var(--border)" }}>
            <div style={{
              width: 100, height: 100, borderRadius: "50%",
              background: "var(--accent-subtle)",
              border: `3px solid ${isAdmin ? "var(--accent)" : "var(--border-bright)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, overflow: "hidden",
              boxShadow: isAdmin ? "0 0 32px var(--accent-glow)" : "none",
            }}>
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 38, color: "var(--accent-bright)" }}>
                  {initials}
                </span>
              )}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32, color: "var(--text-primary)" }}>
                  {user.name ?? user.email.split("@")[0]}
                </span>
                {isAdmin && (
                  <span style={{
                    background: "rgba(42,127,255,0.15)", border: "1px solid var(--accent)",
                    color: "var(--accent-bright)", fontSize: 11, fontWeight: 700,
                    padding: "3px 10px", borderRadius: 4,
                    fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.5px",
                  }}>
                    ADMIN
                  </span>
                )}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: 18 }}>{user.email}</div>
            </div>
          </div>

          {/* Credits — hero number */}
          <div style={{
            textAlign: "center", padding: "24px 20px", marginBottom: 28,
            background: "var(--accent-subtle)", borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(42,127,255,0.2)",
          }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              {t("credits")}
            </div>
            <div suppressHydrationWarning style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 56, fontWeight: 800, color: isAdmin ? "var(--warning)" : "var(--accent-bright)", lineHeight: 1 }}>
              💎 {user.credits.toLocaleString()}
            </div>
          </div>

          {/* Info rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <ProfileRow label={t("tier")} value={
              <span style={{ fontWeight: 700, fontSize: 18, color: "var(--text-primary)" }}>{TIER_LABELS[user.tier] ?? user.tier}</span>
            } />
            <ProfileRow label={t("joined")} value={
              <span suppressHydrationWarning style={{ fontSize: 18 }}>{new Date(user.createdAt).toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" })}</span>
            } />
            {!isAdmin && (
              <ProfileRow label="Darmowe skrypty" value={
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: user.freeScripts > 0 ? "var(--success)" : "var(--danger)" }}>
                  {user.freeScripts} pozostało
                </span>
              } />
            )}
          </div>
        </div>

        {/* Right: Language + Save */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="card" style={{ padding: 32 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: "var(--text-primary)", marginBottom: 24 }}>
              {t("language")}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {LOCALES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLocaleChange(l.code)}
                  style={{
                    height: 60,
                    padding: "0 16px",
                    background: l.code === locale ? "var(--accent-subtle)" : "var(--bg-elevated)",
                    border: `2px solid ${l.code === locale ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "var(--radius-md)",
                    color: l.code === locale ? "var(--text-primary)" : "var(--text-secondary)",
                    fontSize: 15,
                    fontWeight: l.code === locale ? 700 : 400,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    transition: "all 0.15s",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="btn-primary"
            style={{ padding: "18px 28px", fontSize: 17, fontWeight: 700 }}
          >
            {saved ? t("saved") : t("save")}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "16px 0", borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ color: "var(--text-secondary)", fontSize: 16 }}>{label}</span>
      <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
