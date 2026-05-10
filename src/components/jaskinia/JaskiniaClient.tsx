"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter as useNextRouter } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { handleUnauthorized } from "@/lib/auth-redirect";

interface StrategyCard {
  id: string;
  type: string;
  title: string;
  content: string;
}

interface Business {
  id: string;
  name: string;
  industry: string;
  category: string;
  difficulty: string;
  description: string;
  teaser: string;
  unlocked: boolean;
  strategies: StrategyCard[];
}

interface Props {
  businesses: Business[];
  userCredits: number;
  isAdmin: boolean;
  locale: string;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  "Łatwy": "#0D9E68",
  "Średni": "#C97E0A",
  "Trudny": "#C93B3B",
};

const STRATEGY_NUM_LABEL: Record<string, string> = {
  "1": "1.",
  "2": "2.",
  "3": "3.",
};

export function JaskiniaClient({ businesses, userCredits, isAdmin }: Props) {
  const t = useTranslations("jaskinia");
  const tSb = useTranslations("shadowBoxing");
  const nextRouter = useNextRouter();
  const router = useRouter();

  function diffLabel(diff: string) {
    if (diff === "Łatwy") return tSb("easy");
    if (diff === "Średni") return tSb("medium");
    if (diff === "Trudny") return tSb("hard");
    return diff;
  }
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [credits, setCredits] = useState(userCredits);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [localUnlocked, setLocalUnlocked] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const cats = new Set(businesses.map((b) => b.category));
    return Array.from(cats).sort();
  }, [businesses]);

  const difficulties = ["Łatwy", "Średni", "Trudny"];

  const filtered = useMemo(() => {
    return businesses.filter((b) => {
      const q = search.toLowerCase();
      if (q && !b.name.toLowerCase().includes(q) && !b.industry.toLowerCase().includes(q)) return false;
      if (categoryFilter && b.category !== categoryFilter) return false;
      if (difficultyFilter && b.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [businesses, search, categoryFilter, difficultyFilter]);

  function isUnlocked(b: Business) {
    return b.unlocked || localUnlocked.has(b.id);
  }

  async function unlock(b: Business) {
    if (isUnlocked(b)) {
      setSelectedBusiness({ ...b, unlocked: true });
      return;
    }
    if (!isAdmin && credits < 5) {
      alert(t("insufficientCredits"));
      return;
    }
    setUnlockingId(b.id);
    try {
      const res = await fetch("/api/jaskinia/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: b.id }),
      });
      if (handleUnauthorized(res, nextRouter)) return;
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Błąd");
        return;
      }
      setLocalUnlocked((prev) => new Set([...prev, b.id]));
      if (!isAdmin) setCredits((c) => c - 5);
      setSelectedBusiness({ ...b, unlocked: true });
    } finally {
      setUnlockingId(null);
    }
  }

  function handleGenerateColdCall(content: string) {
    sessionStorage.setItem("jaskinia_prefill_cold_call", content);
    router.push("/cold-call");
  }

  function handleGenerateSms(content: string) {
    sessionStorage.setItem("jaskinia_prefill_sms", content);
    router.push("/sms");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, rgba(26,107,221,0.15) 0%, rgba(42,127,255,0.05) 100%)",
        borderBottom: "1px solid var(--border)",
        padding: "32px 40px 28px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
            {t("title")}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 20 }}>
            {t("subtitle")}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{
              background: "rgba(42,127,255,0.1)",
              border: "1px solid rgba(42,127,255,0.3)",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              color: "var(--accent-bright)",
              fontFamily: "var(--font-jetbrains-mono)",
            }}>
              💎 {isAdmin ? "∞" : credits} kredytów
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{t("costInfo")}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 40px" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 220,
              padding: "10px 14px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontSize: 14,
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <option value="">{t("all")}</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            style={{
              padding: "10px 14px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <option value="">{t("all")}</option>
            {difficulties.map((d) => <option key={d} value={d}>{diffLabel(d)}</option>)}
          </select>
        </div>

        {/* Count */}
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
          {t("found")} {filtered.length} {t("companies")}
        </p>

        {/* Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {filtered.map((b) => {
            const unlocked = isUnlocked(b);
            const isLocking = unlockingId === b.id;
            return (
              <div
                key={b.id}
                onClick={() => unlock(b)}
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${unlocked ? "rgba(42,127,255,0.3)" : "var(--border)"}`,
                  borderRadius: "var(--radius-lg)",
                  padding: 20,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: unlocked ? "0 0 20px rgba(42,127,255,0.07)" : "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = unlocked ? "rgba(42,127,255,0.5)" : "var(--border-bright)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = unlocked ? "rgba(42,127,255,0.3)" : "var(--border)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                {/* Lock overlay for locked cards */}
                {!unlocked && (
                  <div style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(5,10,20,0.45)",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    zIndex: 2,
                    backdropFilter: "blur(2px)",
                  }}>
                    <span style={{ fontSize: 28 }}>🔒</span>
                    <span style={{
                      background: "var(--accent)",
                      color: "white",
                      padding: "6px 16px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                    }}>
                      {isLocking ? t("unlocking") : t("unlockCost")}
                    </span>
                  </div>
                )}

                {/* Card content */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 8 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, flex: 1, filter: unlocked ? "none" : "blur(3px)" }}>
                    {b.name}
                  </h3>
                  {unlocked && <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  <span style={{
                    background: "rgba(42,127,255,0.1)",
                    border: "1px solid rgba(42,127,255,0.2)",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 11,
                    color: "var(--accent-bright)",
                    filter: unlocked ? "none" : "blur(3px)",
                  }}>
                    {b.industry}
                  </span>
                  <span style={{
                    background: `${DIFFICULTY_COLOR[b.difficulty]}20`,
                    border: `1px solid ${DIFFICULTY_COLOR[b.difficulty]}50`,
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 11,
                    color: DIFFICULTY_COLOR[b.difficulty],
                  }}>
                    {diffLabel(b.difficulty)}
                  </span>
                </div>

                <p style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                  filter: unlocked ? "none" : "blur(4px)",
                }}>
                  {unlocked ? b.description : b.teaser}
                </p>

                {unlocked && (
                  <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {b.strategies.length} {t("strategies")} →
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBusiness && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.7)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedBusiness(null); }}
        >
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-bright)",
            borderRadius: "var(--radius-xl)",
            width: "100%",
            maxWidth: 680,
            maxHeight: "85vh",
            overflowY: "auto",
            padding: 32,
            position: "relative",
          }}>
            <button
              onClick={() => setSelectedBusiness(null)}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: "4px 10px",
                fontSize: 18,
                lineHeight: 1,
              }}
            >×</button>

            <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{
                background: "rgba(42,127,255,0.1)",
                border: "1px solid rgba(42,127,255,0.3)",
                borderRadius: 6, padding: "2px 10px",
                fontSize: 12, color: "var(--accent-bright)",
              }}>{selectedBusiness.industry}</span>
              <span style={{
                background: `${DIFFICULTY_COLOR[selectedBusiness.difficulty]}20`,
                border: `1px solid ${DIFFICULTY_COLOR[selectedBusiness.difficulty]}50`,
                borderRadius: 6, padding: "2px 10px",
                fontSize: 12, color: DIFFICULTY_COLOR[selectedBusiness.difficulty],
              }}>{diffLabel(selectedBusiness.difficulty)}</span>
              <span style={{
                background: "rgba(42,127,255,0.06)",
                border: "1px solid var(--border)",
                borderRadius: 6, padding: "2px 10px",
                fontSize: 12, color: "var(--text-secondary)",
              }}>{selectedBusiness.category}</span>
            </div>

            <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
              {selectedBusiness.name}
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              {selectedBusiness.description}
            </p>

            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)", marginBottom: 14, letterSpacing: "0.05em" }}>
              {t("salesStrategies")}
            </h3>

            {/* Generate buttons */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <button
                onClick={() => handleGenerateColdCall(
                  selectedBusiness.strategies.map((s) => `${s.title}\n${s.content}`).join("\n\n")
                )}
                style={{
                  flex: 1, padding: "10px 14px",
                  background: "var(--accent)", color: "white", border: "none",
                  borderRadius: "var(--radius-md)", fontWeight: 600, fontSize: 13,
                  cursor: "pointer",
                }}
              >
                📞 {t("generateColdCall")}
              </button>
              <button
                onClick={() => handleGenerateSms(
                  selectedBusiness.strategies.map((s) => `${s.title}\n${s.content}`).join("\n\n")
                )}
                style={{
                  flex: 1, padding: "10px 14px",
                  background: "transparent", color: "var(--accent-bright)",
                  border: "1px solid rgba(42,127,255,0.4)",
                  borderRadius: "var(--radius-md)", fontWeight: 600, fontSize: 13,
                  cursor: "pointer",
                }}
              >
                💬 {t("generateSms")}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {selectedBusiness.strategies.map((s, idx) => (
                <div key={s.id} style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}>
                  <span style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontWeight: 700,
                    fontSize: 18,
                    color: "var(--accent-bright)",
                    flexShrink: 0,
                    lineHeight: 1.4,
                    minWidth: 24,
                  }}>
                    {STRATEGY_NUM_LABEL[s.type] ?? `${idx + 1}.`}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      lineHeight: 1.5,
                      marginBottom: s.content ? 6 : 0,
                    }}>
                      {s.title}
                    </p>
                    {s.content && (
                      <p style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}>
                        {s.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
