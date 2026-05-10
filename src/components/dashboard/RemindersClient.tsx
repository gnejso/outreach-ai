"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Reminder {
  id: string;
  sessionId: string;
  businessName: string;
  status: string;
  note: string | null;
  followUpDate: string;
  followUpDone: boolean;
}

interface Props {
  reminders: Reminder[];
  overdueCount: number;
  todayCount: number;
}

type FilterType = "all" | "today" | "overdue" | "upcoming";

const STATUS_LABELS: Record<string, string> = {
  NEW: "🆕 Nowy",
  IN_PROGRESS: "🔄 W trakcie",
  INTERESTED: "⭐ Zainteresowany",
  CLOSED: "✅ Zamknięty",
  REJECTED: "❌ Odrzucony",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "#334D75",
  IN_PROGRESS: "#2A7FFF",
  INTERESTED: "#C97E0A",
  CLOSED: "#0D9E68",
  REJECTED: "#C93B3B",
};

function formatFollowUpDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((d.getTime() - todayStart.getTime()) / 86400000);
  const timeStr = d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  if (diff < 0) return `${Math.abs(diff)} dni temu`;
  if (diff === 0) return `dziś o ${timeStr}`;
  if (diff === 1) return `jutro o ${timeStr}`;
  return `za ${diff} dni, ${d.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}`;
}

function isOverdue(iso: string): boolean {
  return new Date(iso) < new Date();
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function RemindersClient({ reminders: initialReminders }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [filter, setFilter] = useState<FilterType>("all");

  async function markDone(id: string) {
    const res = await fetch("/api/reminders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: id, action: "done" }),
    });
    if (res.ok) setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  async function postpone(id: string, currentDate: string) {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 3);
    const res = await fetch("/api/reminders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteId: id, action: "reschedule", newDate: newDate.toISOString() }),
    });
    if (res.ok) setReminders((prev) =>
      prev.map((r) => r.id === id ? { ...r, followUpDate: newDate.toISOString() } : r)
    );
  }

  const filtered = reminders.filter((r) => {
    if (filter === "today") return isToday(r.followUpDate);
    if (filter === "overdue") return isOverdue(r.followUpDate) && !isToday(r.followUpDate);
    if (filter === "upcoming") return !isOverdue(r.followUpDate) && !isToday(r.followUpDate);
    return true;
  });

  const overdueCount = reminders.filter((r) => isOverdue(r.followUpDate) && !isToday(r.followUpDate)).length;
  const todayCount = reminders.filter((r) => isToday(r.followUpDate)).length;
  const upcomingCount = reminders.filter((r) => !isOverdue(r.followUpDate) && !isToday(r.followUpDate)).length;

  const tabs: { key: FilterType; label: string; count: number; badgeColor?: string }[] = [
    { key: "all", label: "Wszystkie", count: reminders.length },
    { key: "today", label: "Dziś", count: todayCount, badgeColor: "#C97E0A" },
    { key: "overdue", label: "Przeterminowane", count: overdueCount, badgeColor: "#C93B3B" },
    { key: "upcoming", label: "Nadchodzące", count: upcomingCount, badgeColor: "#2A7FFF" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 32, color: "var(--text-primary)", marginBottom: 8 }}>
          🔔 Follow-upy
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 16 }}>
          Zaplanowane przypomnienia o firmach do kontaktu
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${filter === tab.key ? "var(--accent)" : "var(--border)"}`,
              background: filter === tab.key ? "var(--accent-subtle)" : "var(--bg-card)",
              color: filter === tab.key ? "var(--accent-bright)" : "var(--text-muted)",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'IBM Plex Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: tab.badgeColor ?? "var(--accent)",
                color: "white",
                fontSize: 12,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 10,
                minWidth: 22,
                textAlign: "center",
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            key="empty"
            style={{ textAlign: "center", padding: "80px 40px" }}
          >
            <div style={{ fontSize: 56, marginBottom: 20 }}>📅</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 24, color: "var(--text-primary)", marginBottom: 10 }}>
              Brak zaplanowanych follow-upów
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 16 }}>
              Czas dzwonić! 🚀
            </div>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map((r) => {
              const overdue = isOverdue(r.followUpDate) && !isToday(r.followUpDate);
              const today = isToday(r.followUpDate);
              const borderColor = overdue ? "#C93B3B" : today ? "#C97E0A" : "#2A7FFF";
              const statusColor = STATUS_COLORS[r.status] ?? "#334D75";

              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -60, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.2 }}
                  style={{
                    background: "var(--bg-card)",
                    border: `1px solid ${borderColor}40`,
                    borderLeft: `4px solid ${borderColor}`,
                    borderRadius: "var(--radius-lg)",
                    padding: "24px 28px",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 24,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Business name + status badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 24, color: "var(--text-primary)" }}>
                        {r.businessName}
                      </span>
                      <span style={{
                        fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
                        background: `${statusColor}20`,
                        border: `1px solid ${statusColor}60`,
                        color: statusColor,
                        fontFamily: "'IBM Plex Sans', sans-serif",
                      }}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                      {overdue && (
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                          background: "rgba(201,59,59,0.15)", border: "1px solid rgba(201,59,59,0.4)",
                          color: "#ef4444", fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          PRZETERMINOWANE
                        </span>
                      )}
                      {today && !overdue && (
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
                          background: "rgba(201,126,10,0.15)", border: "1px solid rgba(201,126,10,0.4)",
                          color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          DZIŚ
                        </span>
                      )}
                    </div>

                    {/* Note text */}
                    {r.note && r.note.trim() && (
                      <div style={{
                        color: "var(--text-secondary)", fontSize: 15, marginBottom: 12,
                        fontStyle: "italic", lineHeight: 1.5,
                        borderLeft: "2px solid var(--border)", paddingLeft: 12,
                      }}>
                        „{r.note}"
                      </div>
                    )}

                    {/* Date */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16, color: borderColor }}>📅</span>
                      <span suppressHydrationWarning style={{ fontSize: 16, color: "var(--text-secondary)", fontWeight: 500 }}>
                        {new Date(r.followUpDate).toLocaleString("pl-PL", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span suppressHydrationWarning style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
                        color: borderColor, marginLeft: 4,
                      }}>
                        — {formatFollowUpDate(r.followUpDate)}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 10, flexShrink: 0, flexDirection: "column", alignItems: "stretch" }}>
                    <button
                      onClick={() => postpone(r.id, r.followUpDate)}
                      style={{
                        padding: "12px 20px", background: "var(--bg-elevated)",
                        border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                        color: "var(--text-secondary)", fontSize: 14, fontWeight: 600,
                        cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
                        whiteSpace: "nowrap", textAlign: "center",
                      }}
                    >
                      📅 Odłóż +3 dni
                    </button>
                    <button
                      onClick={() => markDone(r.id)}
                      style={{
                        padding: "12px 20px", background: "rgba(13,158,104,0.12)",
                        border: "1px solid rgba(13,158,104,0.4)", borderRadius: "var(--radius-md)",
                        color: "#0D9E68", fontSize: 14, fontWeight: 700,
                        cursor: "pointer", fontFamily: "'IBM Plex Sans', sans-serif",
                        whiteSpace: "nowrap", textAlign: "center",
                      }}
                    >
                      ✅ Wykonano
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
