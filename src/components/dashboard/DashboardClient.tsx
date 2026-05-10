"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { ActivityType } from "@/types";

const BarChartLazy = dynamic(() => import("./DashboardBarChart"), { ssr: false });

interface Props {
  user: { name?: string | null; role: string; credits: number; tier: string; createdAt: string };
  stats: {
    creditsUsedMonth: number;
    scriptsMonth: number;
    smsMonth: number;
    totalBusinesses: number;
    byStatus: { NEW: number; IN_PROGRESS: number; INTERESTED: number; CLOSED: number; REJECTED: number };
    conversionRate: number;
    creditsUsedToday: number;
    followUpsToday: number;
    activityLast30Days: { date: string; count: number }[];
  };
  recentActivities: { id: string; type: ActivityType; description: string; creditsUsed: number; createdAt: string; metadata?: Record<string, unknown> | null }[];
}

const ACTIVITY_ICONS: Record<string, string> = {
  COLD_CALL_SCRIPT: "📞",
  SMS_CONTENT: "💬",
  SMS_SEND: "📤",
  CREDITS_PURCHASE: "💳",
  SUBSCRIPTION_RENEWAL: "🔄",
  STATUS_CHANGE: "🏷️",
  NOTE_SAVED: "📝",
};

const ACTIVITY_COLORS: Record<string, string> = {
  COLD_CALL_SCRIPT: "#2A7FFF",
  SMS_CONTENT: "#0FA86E",
  SMS_SEND: "#0FA86E",
  CREDITS_PURCHASE: "#F5A623",
  SUBSCRIPTION_RENEWAL: "#F5A623",
  STATUS_CHANGE: "#a78bfa",
  NOTE_SAVED: "#64748b",
};

export function DashboardClient({ user, stats, recentActivities }: Props) {
  const t = useTranslations("dashboard");
  const tBilling = useTranslations("billing");

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("timeJustNow");
    if (mins < 60) return t("timeMinutesAgo", { n: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t("timeHoursAgo", { n: hrs });
    const days = Math.floor(hrs / 24);
    if (days === 1) return t("timeYesterday");
    return t("timeDaysAgo", { n: days });
  }

  const statCards = [
    { icon: "📞", label: t("contactedCompanies"), value: stats.totalBusinesses, color: "#FF4D6D" },
    { icon: "⭐", label: t("interested"), value: stats.byStatus.INTERESTED, color: "#F5A623" },
    { icon: "📈", label: "CONVERSION RATE", value: stats.conversionRate, suffix: "%", color: "#0FA86E" },
    { icon: "💎", label: t("creditsToday"), value: stats.creditsUsedToday, color: "#2A7FFF" },
    { icon: "🔔", label: t("followUpsToday"), value: stats.followUpsToday, color: "#FF6B35", link: "/reminders" },
  ];

  const pipeline = [
    { key: "NEW", label: t("pipelineNew"), color: "#334D75" },
    { key: "IN_PROGRESS", label: t("pipelineInProgress"), color: "#2A7FFF" },
    { key: "INTERESTED", label: t("pipelineInterested"), color: "#C97E0A" },
    { key: "CLOSED", label: t("pipelineClosed"), color: "#0D9E68" },
  ];

  const total = stats.totalBusinesses;
  const hasAnyData = total > 0 || stats.scriptsMonth > 0;
  const tierCredits: Record<string, number> = { FREE: 75, TIER1: 400, TIER2: 1500, TIER3: 2500, ADMIN: 999999 };
  const maxCredits = tierCredits[user.tier] ?? 75;

  return (
    <motion.div suppressHydrationWarning initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }} suppressHydrationWarning>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32, color: "var(--text-primary)", marginBottom: 4, textShadow: "0 0 40px rgba(42,127,255,0.2)" }}>
          {t("hello")} {user.name?.split(" ")[0] ?? "User"} 👋
        </h1>
        <p suppressHydrationWarning style={{ color: "var(--text-secondary)", fontSize: 15 }}>
          {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* 5 Stat Cards */}
      <div suppressHydrationWarning style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
        {statCards.map((card) => {
          const inner = (
            <div
              suppressHydrationWarning
              className="card"
              style={{
                padding: "24px 20px 20px",
                cursor: card.link ? "pointer" : "default",
                transition: "transform 0.2s, box-shadow 0.2s",
                borderTop: `2px solid ${card.color}`,
                background: `linear-gradient(160deg, ${card.color}0a 0%, var(--bg-card) 50%)`,
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = `inset 0 0 0 1px ${card.color}40, 0 8px 24px ${card.color}18`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "";
              }}
            >
              <div suppressHydrationWarning style={{
                width: 44, height: 44, borderRadius: "50%",
                background: `${card.color}18`,
                border: `1px solid ${card.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, marginBottom: 16,
              }}>{card.icon}</div>
              <div suppressHydrationWarning style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 40, fontWeight: 700, color: card.color, lineHeight: 1, marginBottom: 10 }}>
                {card.value.toLocaleString()}{card.suffix ?? ""}
              </div>
              <div suppressHydrationWarning style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 500, letterSpacing: "0.5px" }}>{card.label}</div>
            </div>
          );
          return card.link ? (
            <Link key={card.label} href={card.link as Parameters<typeof Link>[0]["href"]} style={{ textDecoration: "none" }}>
              {inner}
            </Link>
          ) : (
            <div suppressHydrationWarning key={card.label}>{inner}</div>
          );
        })}
      </div>

      {/* Empty state */}
      {!hasAnyData && (
        <div className="card" style={{ padding: "48px 40px", textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", marginBottom: 8 }}>
            {t("welcomeTitle")}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
            {t("welcomeSubtitle")}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/scraper" style={{ textDecoration: "none", padding: "12px 24px", background: "var(--accent)", borderRadius: "var(--radius-md)", color: "white", fontWeight: 600, fontSize: 14 }}>
              {t("useScraper")}
            </Link>
            <Link href="/cold-call" style={{ textDecoration: "none", padding: "12px 24px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontWeight: 600, fontSize: 14 }}>
              {t("uploadExcel")}
            </Link>
          </div>
        </div>
      )}

      {/* Pipeline */}
      {hasAnyData && (
        <div suppressHydrationWarning style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 14, borderLeft: "3px solid var(--accent)", paddingLeft: 12 }}>
            {t("salesPipeline")}
          </h2>
          <div suppressHydrationWarning className="card" style={{ padding: "20px 24px" }}>
            <div suppressHydrationWarning style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {pipeline.map((stage) => {
                const count = stats.byStatus[stage.key as keyof typeof stats.byStatus] ?? 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div suppressHydrationWarning key={stage.key} style={{ textAlign: "center" }}>
                    <div suppressHydrationWarning style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{stage.label}</div>
                    <div suppressHydrationWarning style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 48, fontWeight: 800, color: stage.color, marginBottom: 4, lineHeight: 1, textShadow: count > 0 ? `0 0 24px ${stage.color}70` : "none" }}>
                      {count}
                    </div>
                    <div suppressHydrationWarning style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>{pct}%</div>
                    <div suppressHydrationWarning style={{ height: 4, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
                      <div suppressHydrationWarning style={{ height: "100%", width: `${pct}%`, background: stage.color, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div suppressHydrationWarning style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>
        {/* Chart */}
        <div suppressHydrationWarning>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 14, borderLeft: "3px solid var(--accent)", paddingLeft: 12 }}>
            {t("activityChart")}
          </h2>
          <div suppressHydrationWarning className="card" style={{ padding: "20px 16px" }}>
            <BarChartLazy data={stats.activityLast30Days} />
          </div>
        </div>

        {/* Right column */}
        <div suppressHydrationWarning style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Credits widget */}
          <div suppressHydrationWarning className="card" style={{ padding: "20px 20px" }}>
            <div suppressHydrationWarning style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div suppressHydrationWarning style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("creditsBalance")}</div>
              <span style={{ fontSize: 10, padding: "2px 8px", background: "var(--accent-subtle)", border: "1px solid var(--accent)", borderRadius: 10, color: "var(--accent-bright)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{user.tier}</span>
            </div>
            <div suppressHydrationWarning style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 36, fontWeight: 700, color: "var(--accent-bright)", marginBottom: 8 }}>
              💎 {user.credits.toLocaleString()}
            </div>
            {user.role !== "ADMIN" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ height: 6, background: "var(--bg-elevated)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min((user.credits / maxCredits) * 100, 100)}%`, background: user.credits < maxCredits * 0.2 ? "var(--danger)" : "var(--accent)", borderRadius: 3 }} />
                </div>
                <div suppressHydrationWarning style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{user.credits} / {maxCredits} {tBilling("credits")}</div>
              </div>
            )}
            <Link href="/billing" style={{ textDecoration: "none", display: "block", textAlign: "center", padding: "10px", background: "var(--accent)", borderRadius: "var(--radius-md)", color: "white", fontSize: 13, fontWeight: 600 }}>
              {t("topUpCredits")}
            </Link>
          </div>

          {/* Recent activity */}
          <div suppressHydrationWarning className="card" style={{ overflow: "hidden" }}>
            <div suppressHydrationWarning style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
              {t("recentActivity")}
            </div>
            {recentActivities.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>{t("noActivity")}</div>
            ) : (
              recentActivities.map((a, i) => {
                const dotColor = ACTIVITY_COLORS[a.type] ?? "#334D75";
                return (
                  <div
                    suppressHydrationWarning
                    key={a.id}
                    style={{
                      padding: "11px 16px",
                      borderBottom: i < recentActivities.length - 1 ? "1px solid var(--border)" : "none",
                      display: "flex", alignItems: "flex-start", gap: 10,
                      transition: "background 0.15s",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                  >
                    <div suppressHydrationWarning style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: `${dotColor}18`, border: `1px solid ${dotColor}35`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, flexShrink: 0, marginTop: 1,
                    }}>{ACTIVITY_ICONS[a.type] ?? "•"}</div>
                    <div suppressHydrationWarning style={{ flex: 1, overflow: "hidden" }}>
                      <div suppressHydrationWarning style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.description}</div>
                      <div suppressHydrationWarning style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}>
                        {timeAgo(a.createdAt)}
                      </div>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--danger)", flexShrink: 0, fontWeight: 600 }}>-{a.creditsUsed}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
