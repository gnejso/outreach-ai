"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import type { ActivityType } from "@/types";
import { ScriptSessionViewer } from "@/components/cold-call/ScriptSessionViewer";

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  creditsUsed: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface ScriptSession {
  id: string;
  purpose: string;
  count: number;
  creditsUsed: number;
  createdAt: string;
  sessionType?: string;
}

interface Props {
  activities: Activity[];
  stats: {
    creditsUsedMonth: number;
    totalScripts: number;
    totalSms: number;
  };
  scriptSessions: ScriptSession[];
}

const TYPE_ICONS: Record<ActivityType, string> = {
  COLD_CALL_SCRIPT: "📞",
  SMS_CONTENT: "💬",
  SMS_SEND: "📤",
  EMAIL_CONTENT: "📧",
  CREDITS_PURCHASE: "💳",
  SUBSCRIPTION_RENEWAL: "🔄",
  STATUS_CHANGE: "🏷️",
  NOTE_SAVED: "📝",
  SCRAPER_USE: "🗺️",
  OFERTA_UMOWA: "📄",
  JASKINIA_UNLOCK: "🦁",
  WEB_AUDIT: "🔍",
};

const ALL_TYPES: ActivityType[] = [
  "COLD_CALL_SCRIPT",
  "SMS_CONTENT",
  "SMS_SEND",
  "EMAIL_CONTENT",
  "SCRAPER_USE",
  "OFERTA_UMOWA",
  "JASKINIA_UNLOCK",
  "WEB_AUDIT",
  "CREDITS_PURCHASE",
  "SUBSCRIPTION_RENEWAL",
  "STATUS_CHANGE",
  "NOTE_SAVED",
];

type Tab = "sessions" | "activity";

export function HistoryClient({ activities, stats, scriptSessions }: Props) {
  const t = useTranslations("history");
  const [tab, setTab] = useState<Tab>(scriptSessions.length > 0 ? "sessions" : "activity");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ActivityType | "ALL">("ALL");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  const filteredActivities = activities.filter((a) => {
    const matchesType = typeFilter === "ALL" || a.type === typeFilter;
    const matchesSearch = !search || a.description.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredSessions = scriptSessions.filter((s) =>
    !search || s.purpose.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "var(--text-primary)", marginBottom: 6 }}>
          {t("title")}
        </h1>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}
      >
        {[
          { label: t("totalCreditsUsed"), value: stats.creditsUsedMonth.toLocaleString(), color: "var(--accent-bright)" },
          { label: t("scriptsCount"), value: stats.totalScripts.toString(), color: "var(--success)" },
          { label: t("smsCount"), value: stats.totalSms.toString(), color: "var(--warning)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: "16px 20px" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 8 }}>{label}</div>
            <div suppressHydrationWarning style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, color, fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </motion.div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
        {([
          { key: "sessions" as Tab, label: `📱 Sesje generowania (${scriptSessions.length})` },
          { key: "activity" as Tab, label: `📋 Wszystkie zdarzenia (${activities.length})` },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "10px 20px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === key ? "var(--accent)" : "transparent"}`,
              color: tab === key ? "var(--accent-bright)" : "var(--text-muted)",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: tab === key ? 600 : 400,
              fontFamily: "'IBM Plex Sans', sans-serif",
              transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          style={{ padding: "10px 14px", fontSize: 14, flex: "1 1 200px" }}
        />
        {tab === "activity" && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ActivityType | "ALL")}
            style={{ padding: "10px 14px", fontSize: 14, flex: "0 0 auto" }}
          >
            <option value="ALL">{t("allTypes")}</option>
            {ALL_TYPES.map((type) => (
              <option key={type} value={type}>{TYPE_ICONS[type]} {t(type as Parameters<typeof t>[0])}</option>
            ))}
          </select>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Sessions tab ── */}
        {tab === "sessions" && (
          <motion.div key="sessions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {filteredSessions.length === 0 ? (
              <div className="card" style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
                {search ? t("noResults") : "Brak zapisanych sesji. Wygeneruj skrypty Cold Call lub SMS aby je tutaj zobaczyć."}
              </div>
            ) : (
              <div className="card" style={{ overflow: "hidden" }}>
                {/* Header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "130px 1fr 80px 80px 90px",
                    gap: 12,
                    padding: "10px 20px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 10,
                    color: "var(--text-muted)",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.5px",
                  }}
                >
                  <span>DATA</span>
                  <span>CEL ROZMOWY</span>
                  <span>FIRM</span>
                  <span>KREDYTY</span>
                  <span></span>
                </div>

                {filteredSessions.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "130px 1fr 80px 80px 90px",
                      gap: 12,
                      padding: "14px 20px",
                      borderBottom: i < filteredSessions.length - 1 ? "1px solid var(--border)" : "none",
                      alignItems: "center",
                    }}
                  >
                    <div suppressHydrationWarning style={{ color: "var(--text-muted)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(s.createdAt).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15 }}>{(s as any).sessionType === "SMS" ? "💬" : "📞"}</span>
                        <span style={{ color: "var(--text-primary)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.purpose}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--text-secondary)" }}>
                      {s.count} firm
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--danger)" }}>
                      -{s.creditsUsed}
                    </div>
                    <button
                      onClick={() => setOpenSessionId(s.id)}
                      style={{
                        padding: "6px 14px",
                        background: "var(--accent-subtle)",
                        border: "1px solid var(--accent)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--accent-bright)",
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Otwórz →
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Activity tab ── */}
        {tab === "activity" && (
          <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card" style={{ overflow: "hidden" }}>
              {filteredActivities.length === 0 ? (
                <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>{t("noResults")}</div>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "140px 1fr auto auto",
                      gap: 12,
                      padding: "10px 20px",
                      borderBottom: "1px solid var(--border)",
                      fontSize: 10,
                      color: "var(--text-muted)",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <span>{t("date").toUpperCase()}</span>
                    <span>{t("description").toUpperCase()}</span>
                    <span>{t("credits").toUpperCase()}</span>
                    <span></span>
                  </div>

                  {filteredActivities.map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "140px 1fr auto auto",
                        gap: 12,
                        padding: "14px 20px",
                        borderBottom: i < filteredActivities.length - 1 ? "1px solid var(--border)" : "none",
                        alignItems: "center",
                      }}
                    >
                      <div suppressHydrationWarning style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                        {new Date(activity.createdAt).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 15 }}>{TYPE_ICONS[activity.type]}</span>
                          <span style={{ color: "var(--text-primary)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {activity.description}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--danger)", whiteSpace: "nowrap" }}>
                        -{activity.creditsUsed}
                      </div>
                      {/* Show "Open" for cold call activities that have a sessionId in metadata */}
                      {activity.type === "COLD_CALL_SCRIPT" && activity.metadata?.sessionId ? (
                        <button
                          onClick={() => setOpenSessionId(activity.metadata!.sessionId as string)}
                          style={{
                            padding: "5px 12px",
                            background: "var(--accent-subtle)",
                            border: "1px solid var(--accent)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--accent-bright)",
                            fontSize: 11,
                            cursor: "pointer",
                            fontFamily: "'IBM Plex Sans', sans-serif",
                          }}
                        >
                          Otwórz →
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedActivity(activity)}
                          style={{
                            padding: "5px 10px",
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--text-muted)",
                            fontSize: 11,
                            cursor: "pointer",
                            fontFamily: "'IBM Plex Sans', sans-serif",
                          }}
                        >
                          {t("details")}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity details modal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(5,10,20,0.8)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 200,
              padding: 20,
            }}
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="card"
              style={{ padding: 28, maxWidth: 540, width: "100%" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{TYPE_ICONS[selectedActivity.type]}</div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
                    {t(selectedActivity.type as Parameters<typeof t>[0])}
                  </h3>
                </div>
                <button onClick={() => setSelectedActivity(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <InfoRow label={t("date")} value={new Date(selectedActivity.createdAt).toLocaleString("pl-PL")} />
                <InfoRow label={t("description")} value={selectedActivity.description} />
                <InfoRow label={t("credits")} value={`-${selectedActivity.creditsUsed}`} />
                {selectedActivity.metadata != null && (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Metadata</div>
                    <pre style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 14px",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      fontFamily: "'JetBrains Mono', monospace",
                      overflow: "auto",
                      maxHeight: 150,
                    }}>
                      {JSON.stringify(selectedActivity.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Script session viewer modal */}
      <AnimatePresence>
        {openSessionId && (
          <ScriptSessionViewer
            sessionId={openSessionId}
            onClose={() => setOpenSessionId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
      <span style={{ color: "var(--text-muted)", fontSize: 13, flexShrink: 0 }}>{label}</span>
      <span suppressHydrationWarning style={{ color: "var(--text-primary)", fontSize: 13, textAlign: "right" }}>{value}</span>
    </div>
  );
}
