"use client";

import { useState } from "react";

interface AuditRecord {
  id: string;
  url: string;
  score: number;
  createdAt: string;
  report: string;
}

interface Props {
  userCredits: number;
  isAdmin: boolean;
  locale: string;
  recentAudits: AuditRecord[];
}

const INDUSTRIES = [
  "Restauracja / Gastronomia",
  "E-commerce / Sklep online",
  "Usługi budowlane / Remonty",
  "Medycyna / Klinika / Gabinet",
  "Salon beauty / Fryzjer / Kosmetyka",
  "Kancelaria / Prawnik / Księgowość",
  "Nieruchomości / Deweloper",
  "Edukacja / Szkolenia / Kursy",
  "Fitness / Siłownia / Sport",
  "Motoryzacja / Auto serwis",
  "IT / Software / Technologia",
  "Marketing / Agencja reklamowa",
  "Inna branża",
];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 7 ? "#0D9E68" : score >= 5 ? "#C97E0A" : "#C93B3B";
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      borderRadius: "50%",
      background: `${color}22`,
      border: `2px solid ${color}`,
      color,
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 700,
      fontSize: 13,
    }}>
      {score}
    </span>
  );
}

function ReportView({ report, onClose }: { report: string; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.75)",
      zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-bright)",
        borderRadius: "var(--radius-xl)",
        width: "100%",
        maxWidth: 720,
        maxHeight: "88vh",
        overflowY: "auto",
        padding: 32,
        position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "var(--bg-elevated)", border: "1px solid var(--border)",
          borderRadius: 8, color: "var(--text-secondary)",
          cursor: "pointer", padding: "4px 10px", fontSize: 18,
        }}>×</button>
        <pre style={{
          fontSize: 13.5,
          lineHeight: 1.8,
          color: "var(--text-primary)",
          whiteSpace: "pre-wrap",
          fontFamily: "'IBM Plex Sans', sans-serif",
          margin: 0,
        }}>{report}</pre>
      </div>
    </div>
  );
}

export function AudytClient({ userCredits, isAdmin, locale, recentAudits }: Props) {
  const [url, setUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState(userCredits);
  const [history, setHistory] = useState(recentAudits);
  const [viewingReport, setViewingReport] = useState<string | null>(null);

  async function handleAudit() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    setScore(null);

    try {
      const res = await fetch("/api/audyt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), industry: industry || undefined, locale }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Błąd audytu");
        return;
      }
      setReport(data.report);
      setScore(data.score);
      if (!isAdmin) setCredits((c) => c - 25);
      setHistory((prev) => [{
        id: data.auditId,
        url: url.trim(),
        score: data.score,
        createdAt: new Date().toISOString(),
        report: data.report,
      }, ...prev.slice(0, 4)]);
    } catch {
      setError("Błąd połączenia");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "var(--font-syne)", fontSize: 28, fontWeight: 800,
          color: "var(--text-primary)", margin: "0 0 8px",
        }}>
          🔍 Audyt Strony WWW
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
          Wklej link i otrzymaj pełną analizę strony — 25 kredytów za raport
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        {/* LEFT: Form */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          padding: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}>
          <span style={{ fontSize: 64 }}>🔍</span>
          <div style={{ width: "100%", textAlign: "center" }}>
            <h2 style={{
              fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 700,
              color: "var(--text-primary)", margin: "0 0 8px",
            }}>
              Audyt Strony WWW
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
              Wklej link i otrzymaj pełną analizę strony
            </p>
          </div>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.stronatwojegoklienta.pl"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 16px",
                fontSize: 15,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                boxSizing: "border-box",
              }}
            />
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: 14,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                color: industry ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">Branża klienta (opcjonalne)</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>

            <button
              onClick={handleAudit}
              disabled={loading || !url.trim() || (!isAdmin && credits < 25)}
              style={{
                width: "100%",
                padding: "14px 0",
                background: loading || !url.trim() || (!isAdmin && credits < 25)
                  ? "var(--bg-hover)"
                  : "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: 15,
                fontWeight: 700,
                cursor: loading || !url.trim() || (!isAdmin && credits < 25) ? "not-allowed" : "pointer",
                opacity: loading || !url.trim() || (!isAdmin && credits < 25) ? 0.6 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {loading ? "⏳ Analizuję stronę..." : "🔍 Analizuj stronę — 25 kredytów"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              background: "rgba(42,127,255,0.1)",
              border: "1px solid rgba(42,127,255,0.3)",
              borderRadius: 8, padding: "4px 12px",
              fontSize: 12, color: "var(--accent-bright)",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              💎 {isAdmin ? "∞" : credits} kredytów
            </span>
          </div>

          {!isAdmin && credits < 25 && (
            <div style={{
              padding: "10px 14px",
              background: "rgba(201,59,59,0.1)",
              border: "1px solid rgba(201,59,59,0.3)",
              borderRadius: 8, fontSize: 13,
              color: "#C93B3B", textAlign: "center",
            }}>
              Potrzebujesz 25 kredytów aby wykonać audyt
            </div>
          )}

          <p style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center", margin: 0 }}>
            Otrzymasz pełny raport z oceną i konkretnymi poprawkami
          </p>

          {error && (
            <div style={{
              width: "100%", padding: "10px 14px",
              background: "rgba(201,59,59,0.1)",
              border: "1px solid rgba(201,59,59,0.3)",
              borderRadius: 8, fontSize: 13, color: "#C93B3B",
            }}>
              {error}
            </div>
          )}
        </div>

        {/* RIGHT: Result */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          minHeight: 400,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {loading ? (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16, padding: 40,
            }}>
              <div style={{
                width: 48, height: 48, border: "3px solid var(--border)",
                borderTopColor: "var(--accent)", borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
                Analizuję stronę... to może chwilę potrwać
              </p>
            </div>
          ) : report ? (
            <div style={{ padding: 28, overflowY: "auto", flex: 1 }}>
              {score !== null && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  marginBottom: 20, padding: "12px 16px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
                }}>
                  <ScoreBadge score={score} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      Ocena ogólna: {score}/10
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {url}
                    </div>
                  </div>
                </div>
              )}
              <pre style={{
                fontSize: 13,
                lineHeight: 1.8,
                color: "var(--text-primary)",
                whiteSpace: "pre-wrap",
                fontFamily: "'IBM Plex Sans', sans-serif",
                margin: 0,
              }}>
                {report}
              </pre>
            </div>
          ) : (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 16, padding: 40,
            }}>
              <span style={{ fontSize: 56, opacity: 0.3 }}>📊</span>
              <p style={{ color: "var(--text-muted)", fontSize: 15, margin: 0, textAlign: "center" }}>
                Wyniki pojawią się tutaj
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0, textAlign: "center" }}>
                Wklej URL strony i kliknij analizuj
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Audit History */}
      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{
            fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700,
            color: "var(--text-primary)", marginBottom: 16,
          }}>
            Ostatnie audyty
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((audit) => (
              <div key={audit.id} style={{
                display: "flex", alignItems: "center", gap: 16,
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "14px 20px",
              }}>
                <ScoreBadge score={audit.score} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: "var(--text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {audit.url}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {new Date(audit.createdAt).toLocaleDateString("pl-PL", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                </div>
                <button
                  onClick={() => setViewingReport(audit.report)}
                  style={{
                    padding: "6px 16px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                    color: "var(--text-secondary)", cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Zobacz raport
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewingReport && (
        <ReportView report={viewingReport} onClose={() => setViewingReport(null)} />
      )}
    </div>
  );
}
