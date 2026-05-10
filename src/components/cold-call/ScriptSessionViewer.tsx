"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ColdCallScript } from "@/types";

interface SessionData {
  id: string;
  purpose: string;
  count: number;
  creditsUsed: number;
  createdAt: string;
  scripts: ColdCallScript[];
}

const SECTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  OTWIERACZ: { label: "Otwieracz", color: "#60a5fa", icon: "👋" },
  HACZYK: { label: "Haczyk", color: "#a78bfa", icon: "🎯" },
  PROPOZYCJA: { label: "Propozycja wartości", color: "#34d399", icon: "💡" },
  CTA: { label: "Call to action", color: "#fbbf24", icon: "📞" },
  OBIEKCJE: { label: "Obiekcje", color: "#f87171", icon: "🛡️" },
  SKRYPT: { label: "Skrypt", color: "var(--text-muted)", icon: "📄" },
};

function parseSections(script: string | undefined | null): Record<string, string> {
  if (!script || typeof script !== "string") return {};
  const tags = ["OTWIERACZ", "HACZYK", "PROPOZYCJA", "CTA", "OBIEKCJE"];
  const result: Record<string, string> = {};
  let current: string | null = null;
  let buffer: string[] = [];
  for (const line of script.split("\n")) {
    const tag = tags.find((t) => line.trim() === `[${t}]`);
    if (tag) {
      if (current) result[current] = buffer.join("\n").trim();
      current = tag;
      buffer = [];
    } else if (current) {
      buffer.push(line);
    }
  }
  if (current) result[current] = buffer.join("\n").trim();
  if (Object.keys(result).length === 0) result["SKRYPT"] = script;
  return result;
}

function RatingBadge({ rating, reviews }: { rating?: number; reviews: number }) {
  if (rating === undefined) {
    return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-muted)" }}>{reviews} opinii</span>;
  }
  const color = rating >= 4.5 ? "#22c55e" : rating >= 3.0 ? "#f59e0b" : "#ef4444";
  const stars = Math.round(rating);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ color, fontSize: 12, letterSpacing: 1 }}>{"★".repeat(stars)}{"☆".repeat(5 - stars)}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color, fontWeight: 700 }}>{rating.toFixed(1)}</span>
      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({reviews} opinii)</span>
    </span>
  );
}

function CrmSection({ sessionId, businessName, businessIndex = 0 }: { sessionId: string; businessName: string; businessIndex?: number }) {
  const [status, setStatus] = useState<string>("NEW");
  const [note, setNote] = useState<string>("");
  const [followUp, setFollowUp] = useState<boolean>(false);
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [saved, setSaved] = useState<boolean>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef<boolean>(false);

  useEffect(() => {
    loadedRef.current = false;
    fetch(`/api/business-notes?sessionId=${encodeURIComponent(sessionId)}&businessName=${encodeURIComponent(businessName)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.note) {
          setStatus(d.note.status ?? "NEW");
          setNote(d.note.note ?? "");
          if (d.note.followUpDate) {
            setFollowUp(true);
            setFollowUpDate(d.note.followUpDate.slice(0, 16));
          } else {
            setFollowUp(false);
            setFollowUpDate("");
          }
        }
        loadedRef.current = true;
      })
      .catch(() => { loadedRef.current = true; });
  }, [sessionId, businessName]);

  async function save(overrides?: Partial<{ status: string; note: string; followUpDate: string | null }>) {
    const payload = {
      sessionId,
      businessName,
      businessIndex,
      status: overrides?.status ?? status,
      note: overrides?.note !== undefined ? overrides.note : note,
      followUpDate: overrides?.followUpDate !== undefined ? overrides.followUpDate : (followUp && followUpDate ? followUpDate : null),
    };

    console.log("[ScriptSessionViewer] Saving CRM:", payload);

    try {
      const res = await fetch("/api/business-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("[ScriptSessionViewer] Saved successfully:", data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        const error = await res.json();
        console.error("[ScriptSessionViewer] Save failed:", error);
        alert("Błąd zapisywania: " + (error.error || "Unknown error"));
      }
    } catch (err) {
      console.error("[ScriptSessionViewer] Save error:", err);
      alert("Błąd połączenia z serwerem");
    }
  }

  function handleNoteChange(val: string) {
    setNote(val);
    if (!loadedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save({ note: val }), 1500);
  }

  async function handleStatusChange(s: string) {
    setStatus(s);
    await save({ status: s });
  }

  async function handleFollowUpToggle(on: boolean) {
    setFollowUp(on);
    if (!on) await save({ followUpDate: null });
  }

  async function handleFollowUpDateChange(val: string) {
    setFollowUpDate(val);
    await save({ followUpDate: val || null });
  }

  const statuses = [
    { key: "NEW", label: "🆕 Nowy", color: "#334D75", bg: "#334D7520" },
    { key: "IN_PROGRESS", label: "🔄 W trakcie", color: "#2A7FFF", bg: "#2A7FFF20" },
    { key: "INTERESTED", label: "⭐ Zainteresowany", color: "#C97E0A", bg: "#C97E0A20" },
    { key: "CLOSED", label: "✅ Zamknięty", color: "#0D9E68", bg: "#0D9E6820" },
    { key: "REJECTED", label: "❌ Odrzucony", color: "#C93B3B", bg: "#C93B3B20" },
  ];

  return (
    <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
        CRM
      </div>

      {/* Status */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {statuses.map((s) => (
          <button
            key={s.key}
            onClick={() => handleStatusChange(s.key)}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              border: `1px solid ${status === s.key ? s.color : s.color + "40"}`,
              background: status === s.key ? s.bg : "transparent",
              color: status === s.key ? s.color : "var(--text-muted)",
              fontSize: 12,
              fontWeight: status === s.key ? 700 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Note */}
      <div style={{ marginBottom: 14 }}>
        <textarea
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="Jak poszła rozmowa? Co powiedział klient? Co ustaliliście?"
          rows={3}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "var(--bg-primary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
            fontSize: 13,
            fontFamily: "'IBM Plex Sans', sans-serif",
            resize: "vertical",
            outline: "none",
          }}
        />
        {saved && (
          <div style={{ fontSize: 11, color: "var(--success)", marginTop: 4 }}>Zapisano ✓</div>
        )}
      </div>

      {/* Follow-up toggle */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: followUp ? 10 : 0 }}>
          <input
            type="checkbox"
            checked={followUp}
            onChange={(e) => handleFollowUpToggle(e.target.checked)}
            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)" }}
          />
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "'IBM Plex Sans', sans-serif" }}>
            🔔 Przypomnij mi o tej firmie
          </span>
        </label>
        {followUp && (
          <input
            type="datetime-local"
            value={followUpDate}
            onChange={(e) => handleFollowUpDateChange(e.target.value)}
            style={{
              padding: "8px 12px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontSize: 13,
              fontFamily: "'IBM Plex Sans', sans-serif",
              outline: "none",
              width: "100%",
            }}
          />
        )}
      </div>
    </div>
  );
}

interface Props {
  sessionId: string;
  onClose: () => void;
}

export function ScriptSessionViewer({ sessionId, onClose }: Props) {
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [generating, setGenerating] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLoading(true);
    setIdx(0);
    fetch(`/api/script-sessions/${sessionId}`)
      .then((r) => r.json())
      .then((d) => { setData(d.session); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  async function generateMissingScript(index: number) {
    if (!data || generating.has(index) || data.scripts[index].script) return;

    setGenerating(prev => new Set(prev).add(index));

    try {
      const res = await fetch("/api/generate/cold-call/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          businessIndex: index,
          business: {
            name: data.scripts[index].company.name,
            phone: data.scripts[index].company.phone,
            reviews: data.scripts[index].company.reviews,
            rating: data.scripts[index].company.rating,
            industry: data.scripts[index].company.industry,
            website: data.scripts[index].company.hasWebsite ? "yes" : undefined,
          },
          purpose: data.purpose,
          locale: "pl",
        }),
      });

      const result = await res.json();
      setData(prev => {
        if (!prev) return prev;
        const updated = { ...prev };
        updated.scripts = [...prev.scripts];
        updated.scripts[index] = {
          ...updated.scripts[index],
          script: result.script,
        };
        return updated;
      });
    } catch (err) {
      console.error("Generate error:", err);
    } finally {
      setGenerating(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }

  useEffect(() => {
    if (!data || loading) return;
    // Generate current and next script if missing
    if (!data.scripts[idx]?.script) generateMissingScript(idx);
    if (idx + 1 < data.scripts.length && !data.scripts[idx + 1]?.script) {
      generateMissingScript(idx + 1);
    }
  }, [idx, data, loading]);

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,10,20,0.85)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 300,
        padding: "32px 20px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 1000,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 28px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 2 }}>
              Sesja skryptów
            </div>
            {data && (
              <div suppressHydrationWarning style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 12 }}>
                <span>🎯 <span style={{ color: "var(--accent-bright)" }}>{data.purpose}</span></span>
                <span>📋 {data.count} firm</span>
                <span>💳 {data.creditsUsed} kr.</span>
                <span>📅 {new Date(data.createdAt).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>

        {loading && (
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-muted)" }}>
            Ładowanie...
          </div>
        )}

        {!loading && data && data.scripts.length > 0 && (
          <>
            {/* Navigation */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 28px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <button
                onClick={() => setIdx((i) => Math.max(0, i - 1))}
                disabled={idx === 0}
                className="btn-secondary"
                style={{ padding: "8px 18px", fontSize: 16, opacity: idx === 0 ? 0.3 : 1, minWidth: 44 }}
              >
                ←
              </button>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                  {idx + 1} / {data.scripts.length}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>firm</span>
              </div>
              <button
                onClick={() => setIdx((i) => Math.min(data.scripts.length - 1, i + 1))}
                disabled={idx === data.scripts.length - 1}
                className="btn-secondary"
                style={{ padding: "8px 18px", fontSize: 16, opacity: idx === data.scripts.length - 1 ? 0.3 : 1, minWidth: 44 }}
              >
                →
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                style={{ display: "grid", gridTemplateColumns: "260px 1fr" }}
              >
                {/* Left panel */}
                <div
                  style={{
                    background: "var(--bg-elevated)",
                    borderRight: "1px solid var(--border)",
                    padding: "24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 17, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 3 }}>
                      {data.scripts[idx].company.name}
                    </div>
                    {data.scripts[idx].company.industry && (
                      <div style={{ fontSize: 11, color: "var(--accent-bright)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {data.scripts[idx].company.industry}
                      </div>
                    )}
                  </div>
                  <div style={{ height: 1, background: "var(--border)" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>📞 Telefon</div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{data.scripts[idx].company.phone}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Opinie Google</div>
                      <RatingBadge reviews={data.scripts[idx].company.reviews} rating={data.scripts[idx].company.rating} />
                    </div>
                    {data.scripts[idx].company.hasWebsite !== undefined && (
                      <div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Strona www</div>
                        <div style={{ fontSize: 13, color: data.scripts[idx].company.hasWebsite ? "var(--text-secondary)" : "#ef4444" }}>
                          {data.scripts[idx].company.hasWebsite ? "🌐 posiada" : "❌ brak strony"}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ height: 1, background: "var(--border)" }} />
                  <button
                    onClick={() => copyText(data.scripts[idx].script, "__full__")}
                    className="btn-secondary"
                    style={{ padding: "9px 14px", fontSize: 12, width: "100%" }}
                  >
                    {copiedSection === "__full__" ? "✓ Skopiowano!" : "📋 Kopiuj cały skrypt"}
                  </button>
                </div>

                {/* Right panel */}
                <div style={{ padding: "24px 28px", overflowY: "auto", maxHeight: "65vh" }}>
                  {generating.has(idx) ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                      <p style={{ fontSize: 16, color: "var(--text-secondary)" }}>Generuję skrypt...</p>
                    </div>
                  ) : !data.scripts[idx].script ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300, color: "var(--text-muted)" }}>
                      Ładowanie...
                    </div>
                  ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    {Object.entries(parseSections(data.scripts[idx].script)).map(([key, text]) => {
                      const meta = SECTION_LABELS[key] ?? { label: key, color: "var(--text-muted)", icon: "•" };
                      return (
                        <div key={key}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <span style={{ fontSize: 15 }}>{meta.icon}</span>
                              <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 10,
                                fontWeight: 700,
                                color: meta.color,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                background: `${meta.color}18`,
                                border: `1px solid ${meta.color}40`,
                                borderRadius: 4,
                                padding: "2px 7px",
                              }}>
                                {meta.label}
                              </span>
                            </div>
                            <button
                              onClick={() => copyText(text, key)}
                              style={{
                                background: "none",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-sm)",
                                padding: "2px 9px",
                                fontSize: 10,
                                color: copiedSection === key ? "var(--accent-bright)" : "var(--text-muted)",
                                cursor: "pointer",
                              }}
                            >
                              {copiedSection === key ? "✓ OK" : "kopiuj"}
                            </button>
                          </div>
                          <div style={{
                            background: "var(--bg-elevated)",
                            border: `1px solid ${meta.color}30`,
                            borderLeft: `3px solid ${meta.color}`,
                            borderRadius: "0 var(--radius-md) var(--radius-md) 0",
                            padding: "12px 16px",
                            whiteSpace: "pre-wrap",
                            color: "var(--text-primary)",
                            fontSize: 13,
                            lineHeight: 1.8,
                            fontFamily: "'IBM Plex Sans', sans-serif",
                          }}>
                            {text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                  {/* CRM Section - only show if script is loaded */}
                  {data.scripts[idx].script && !generating.has(idx) && (
                    <CrmSection
                      sessionId={sessionId}
                      businessName={data.scripts[idx].company.name}
                      businessIndex={idx}
                    />
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dot navigation */}
            {data.scripts.length > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "14px 0", borderTop: "1px solid var(--border)" }}>
                {data.scripts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    style={{
                      width: i === idx ? 20 : 7,
                      height: 7,
                      borderRadius: 4,
                      background: i === idx ? "var(--accent)" : "var(--border)",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
