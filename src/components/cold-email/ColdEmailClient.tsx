"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { handleUnauthorized } from "@/lib/auth-redirect";
import { CREDIT_COSTS } from "@/types";

interface CrmDraft {
  status: string;
  note: string;
  followUp: boolean;
  followUpDate: string;
  followUpTime: string;
}

interface Props {
  userEmail?: string | null;
}

type Step = "upload" | "map" | "confirm" | "results";

interface Business {
  name: string;
  email: string;
  reviews: number;
  rating?: number;
  industry?: string;
  website?: string;
}

interface ColumnMapping {
  name: string;
  email: string;
  reviews: string;
  rating?: string;
  industry?: string;
  website?: string;
}

function mapColumns(rows: Record<string, string>[], mapping: ColumnMapping): Business[] {
  return rows.map((row) => ({
    name: row[mapping.name] || "",
    email: row[mapping.email] || "",
    reviews: parseInt(row[mapping.reviews] || "0", 10),
    rating: mapping.rating ? parseFloat(row[mapping.rating]) : undefined,
    industry: mapping.industry ? row[mapping.industry] : undefined,
    website: mapping.website ? row[mapping.website] : undefined,
  }));
}

function parseEmail(email: string): { subject: string; body: string } {
  const lines = email.split("\n");
  let subject = "";
  const bodyLines: string[] = [];
  let foundSubject = false;

  for (const line of lines) {
    if (!foundSubject && /^Subject:/i.test(line)) {
      subject = line.replace(/^Subject:\s*/i, "").trim();
      foundSubject = true;
    } else if (foundSubject && line.trim()) {
      bodyLines.push(line);
    }
  }

  return { subject, body: bodyLines.join("\n").trim() };
}

export function ColdEmailClient({ userEmail }: Props) {
  const t = useTranslations("coldCall"); // Reuse translations
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const isGuest = !userEmail;

  const [step, setStep] = useState<Step>("upload");
  const [purpose, setPurpose] = useState("");
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [emails, setEmails] = useState<Record<number, string>>({});
  const [generating, setGenerating] = useState<Set<number>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [creditsNeeded, setCreditsNeeded] = useState(0);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [crmDrafts, setCrmDrafts] = useState<Record<number, CrmDraft>>({});
  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set());

  const onDrop = useCallback(async (files: File[]) => {
    if (isGuest) {
      window.location.href = "/pl/login";
      return;
    }
    const file = files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (handleUnauthorized(res, router)) return;
    const data = await res.json();
    if (data.rows) {
      setRawRows(data.rows);
      setColumns(data.columns);
      setStep("map");
    }
  }, [isGuest, router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
    disabled: isGuest,
  });

  async function handleConfirmMapping() {
    if (!mapping.name || !mapping.email || !mapping.reviews) return;
    const res = await fetch("/api/credits", { method: "GET" });
    if (handleUnauthorized(res, router)) return;
    const data = await res.json();
    setCredits(data.credits);
    const cost = rawRows.length * CREDIT_COSTS.EMAIL_CONTENT;
    if (data.role !== "ADMIN" && data.credits < cost) {
      setInsufficientCredits(true);
      setCreditsNeeded(cost - data.credits);
    } else {
      setInsufficientCredits(false);
    }
    setStep("confirm");
  }

  async function handleGenerate() {
    const mappedBusinesses = mapColumns(rawRows, mapping as ColumnMapping);
    setBusinesses(mappedBusinesses);

    const res = await fetch("/api/generate/cold-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: rawRows, mapping, purpose, locale }),
    });
    if (handleUnauthorized(res, router)) return;

    if (!res.ok) {
      alert("Błąd generowania");
      return;
    }

    const data = await res.json();
    setSessionId(data.sessionId);
    setStep("results");
  }

  async function generateEmail(index: number) {
    if (emails[index] !== undefined || generating.has(index) || index >= businesses.length || !sessionId) return;

    setGenerating((prev) => new Set(prev).add(index));

    try {
      const res = await fetch("/api/generate/cold-email/single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          businessIndex: index,
          business: businesses[index],
          purpose,
          locale,
        }),
      });
      if (handleUnauthorized(res, router)) return;

      const data = await res.json();
      setEmails((prev) => ({ ...prev, [index]: data.email }));
    } catch (err) {
      console.error("Generate error:", err);
      setEmails((prev) => ({ ...prev, [index]: "[Błąd generowania]" }));
    } finally {
      setGenerating((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }

  useEffect(() => {
    if (sessionId && businesses.length > 0) {
      generateEmail(currentIdx);
      generateEmail(currentIdx + 1);
    }
  }, [currentIdx, sessionId, businesses.length]);

  useEffect(() => {
    if (sessionId && businesses.length > 0) {
      generateEmail(0);
      generateEmail(1);
    }
  }, [sessionId]);

  async function saveCrm(idx: number, overrideStatus?: string) {
    if (!sessionId || idx >= businesses.length) return;
    const draft = crmDrafts[idx];
    const status = overrideStatus ?? draft?.status ?? "NEW";
    const followUpDateTime = draft?.followUpDate && draft?.followUpTime
      ? `${draft.followUpDate}T${draft.followUpTime}:00`
      : draft?.followUpDate
      ? `${draft.followUpDate}T09:00:00`
      : null;
    try {
      const res = await fetch("/api/business-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          businessName: businesses[idx].name,
          businessIndex: idx,
          status,
          note: draft?.note || "",
          followUpDate: followUpDateTime,
        }),
      });
      if (handleUnauthorized(res, router)) return;
      if (res.ok) setSavedIdx((prev) => new Set(prev).add(idx));
    } catch {
      /* silent */
    }
  }

  function handlePrev() {
    if (currentIdx > 0) {
      if (!savedIdx.has(currentIdx)) saveCrm(currentIdx);
      setCurrentIdx(currentIdx - 1);
    }
  }

  function handleNext() {
    if (currentIdx < businesses.length - 1) {
      if (!savedIdx.has(currentIdx)) saveCrm(currentIdx);
      setCurrentIdx(currentIdx + 1);
    }
  }

  function handleStatusChange(idx: number, status: string) {
    const updated = { ...crmDrafts, [idx]: { ...crmDrafts[idx], status } as CrmDraft };
    setCrmDrafts(updated);
    saveCrm(idx, status);
  }

  async function handleSaveCrm() {
    await saveCrm(currentIdx);
  }

  function copyText(text: string, section: string) {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  }

  const currentBusiness = businesses[currentIdx];
  const currentEmail = emails[currentIdx];
  const isGenerating = generating.has(currentIdx);
  const parsed = currentEmail ? parseEmail(currentEmail) : { subject: "", body: "" };

  if (step === "upload") {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }} suppressHydrationWarning>
        <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          📧 Cold Email
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 14 }}>
          Generuj profesjonalne cold emaile spersonalizowane dla każdej firmy
        </p>

        <div
          {...getRootProps()}
          style={{
            border: "2px dashed var(--border)",
            borderRadius: 12,
            padding: 60,
            textAlign: "center",
            cursor: isGuest ? "not-allowed" : "pointer",
            background: isDragActive ? "var(--bg-elevated)" : "var(--bg-card)",
            transition: "all 0.2s",
            opacity: isGuest ? 0.6 : 1,
          }}
          onClick={(e) => {
            if (isGuest) {
              e.stopPropagation();
              window.location.href = "/pl/login";
            }
          }}
        >
          <input {...getInputProps()} disabled={isGuest} />
          <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Wgraj plik z firmami</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {isGuest ? "🔐 Zaloguj się aby wgrać plik" : "Przeciągnij lub kliknij aby wybrać plik .xlsx, .xls, .csv"}
          </p>
        </div>
      </div>
    );
  }

  if (step === "map") {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button
          onClick={() => setStep("upload")}
          style={{
            marginBottom: 20,
            padding: "8px 16px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          ← {tc("back")}
        </button>

        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Dopasuj kolumny</h2>

        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: "block" }}>
            Cel emaila — co oferujesz? *
          </label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="np. sprzedaż strony internetowej, oferta SEO, AI receptionist..."
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: 14,
              minHeight: 80,
              resize: "vertical",
            }}
          />
        </div>

        {[
          { key: "name", label: "Nazwa firmy", required: true },
          { key: "email", label: "Email firmowy", required: true },
          { key: "reviews", label: "Liczba opinii Google", required: true },
          { key: "rating", label: "Ocena Google", required: false },
          { key: "industry", label: "Branża", required: false },
          { key: "website", label: "Strona www", required: false },
        ].map(({ key, label, required }) => (
          <div key={key} style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: "block" }}>
              {label} {required && "*"}
            </label>
            <select
              value={(mapping as Record<string, string>)[key] || ""}
              onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                fontSize: 14,
              }}
            >
              <option value="">Wybierz kolumnę</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button
          onClick={handleConfirmMapping}
          disabled={!mapping.name || !mapping.email || !mapping.reviews}
          style={{
            width: "100%",
            padding: 14,
            background: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            opacity: !mapping.name || !mapping.email || !mapping.reviews ? 0.5 : 1,
          }}
        >
          Dalej
        </button>
      </div>
    );
  }

  if (step === "confirm") {
    const cost = rawRows.length * CREDIT_COSTS.EMAIL_CONTENT;
    return (
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <button
          onClick={() => setStep("map")}
          style={{
            marginBottom: 20,
            padding: "8px 16px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          ← {tc("back")}
        </button>

        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Potwierdzenie</h2>

        <div style={{ background: "var(--bg-card)", padding: 24, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Liczba firm do wygenerowania:</span>
            <span style={{ fontSize: 24, fontWeight: 800, marginLeft: 12 }}>{rawRows.length}</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Koszt:</span>
            <span style={{ fontSize: 20, fontWeight: 700, marginLeft: 12, color: "var(--danger)" }}>
              -{cost} kredytów
            </span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Saldo po operacji:</span>
            <span style={{ fontSize: 20, fontWeight: 700, marginLeft: 12, color: "var(--accent-bright)" }}>
              {(credits ?? 0) - cost} kredytów
            </span>
          </div>
        </div>

        {insufficientCredits ? (
          <div
            style={{
              background: "rgba(201,59,59,0.1)",
              border: "1px solid var(--danger)",
              padding: 20,
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <p style={{ color: "var(--danger)", fontWeight: 600, marginBottom: 8 }}>Niewystarczające kredyty</p>
            <p style={{ fontSize: 13 }}>Potrzebujesz {creditsNeeded} kredytów więcej</p>
            <button
              onClick={() => (window.location.href = `/${locale}/billing`)}
              style={{
                marginTop: 12,
                padding: "10px 20px",
                background: "var(--accent)",
                color: "white",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Doładuj konto
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            style={{
              width: "100%",
              padding: 16,
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Potwierdź i generuj
          </button>
        )}
      </div>
    );
  }

  if (step === "results") {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
            padding: "16px 20px",
            background: "var(--bg-card)",
            borderRadius: 12,
          }}
        >
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            style={{
              padding: "10px 20px",
              background: currentIdx === 0 ? "var(--bg-elevated)" : "var(--accent)",
              color: currentIdx === 0 ? "var(--text-muted)" : "white",
              border: "none",
              borderRadius: 8,
              cursor: currentIdx === 0 ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            ← Poprzedni
          </button>

          <div style={{ fontSize: 18, fontWeight: 700 }}>
            Firma {currentIdx + 1} / {businesses.length}
          </div>

          <button
            onClick={handleNext}
            disabled={currentIdx === businesses.length - 1}
            style={{
              padding: "10px 20px",
              background: currentIdx === businesses.length - 1 ? "var(--bg-elevated)" : "var(--accent)",
              color: currentIdx === businesses.length - 1 ? "var(--text-muted)" : "white",
              border: "none",
              borderRadius: 8,
              cursor: currentIdx === businesses.length - 1 ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            Następny →
          </button>
        </div>

        {currentBusiness && (
          <div style={{ background: "var(--bg-card)", padding: 24, borderRadius: 12, marginBottom: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{currentBusiness.name}</h2>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {currentBusiness.industry && (
                <span style={{ padding: "4px 12px", background: "var(--bg-elevated)", borderRadius: 6, fontSize: 13 }}>
                  {currentBusiness.industry}
                </span>
              )}
              <span style={{ padding: "4px 12px", background: "var(--bg-elevated)", borderRadius: 6, fontSize: 13 }}>
                ⭐ {currentBusiness.reviews} opinii
              </span>
              <span style={{ padding: "4px 12px", background: "var(--bg-elevated)", borderRadius: 6, fontSize: 13 }}>
                📧 {currentBusiness.email}
              </span>
            </div>
          </div>
        )}

        <div style={{ background: "var(--bg-card)", padding: 24, borderRadius: 12, marginBottom: 20, minHeight: 400 }}>
          {isGenerating ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <p style={{ fontSize: 16, color: "var(--text-secondary)" }}>Generuję email...</p>
            </div>
          ) : currentEmail ? (
            <div>
              {/* Subject */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-bright)" }}>Temat</h3>
                  <button
                    onClick={() => copyText(parsed.subject, "subject")}
                    style={{
                      padding: "6px 12px",
                      background: copiedSection === "subject" ? "var(--success)" : "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {copiedSection === "subject" ? "✓ Skopiowano" : "📋 Kopiuj"}
                  </button>
                </div>
                <div
                  style={{
                    padding: 16,
                    background: "var(--accent-glow)",
                    border: "1px solid var(--accent)",
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {parsed.subject}
                </div>
              </div>

              {/* Body */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-bright)" }}>Treść</h3>
                  <button
                    onClick={() => copyText(parsed.body, "body")}
                    style={{
                      padding: "6px 12px",
                      background: copiedSection === "body" ? "var(--success)" : "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {copiedSection === "body" ? "✓ Skopiowano" : "📋 Kopiuj"}
                  </button>
                </div>
                <div
                  style={{
                    padding: 16,
                    background: "var(--bg-elevated)",
                    borderRadius: 8,
                    whiteSpace: "pre-wrap",
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {parsed.body}
                </div>
              </div>

              {/* Copy all */}
              <button
                onClick={() => copyText(currentEmail, "all")}
                style={{
                  width: "100%",
                  padding: 12,
                  background: copiedSection === "all" ? "var(--success)" : "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copiedSection === "all" ? "✓ Skopiowano całość" : "📋 Kopiuj całość (temat + treść)"}
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
                color: "var(--text-muted)",
              }}
            >
              Ładowanie...
            </div>
          )}
        </div>

        {/* CRM */}
        <div style={{ background: "var(--bg-card)", padding: 24, borderRadius: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Notatki CRM</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: "block" }}>Status</label>
              <select
                value={crmDrafts[currentIdx]?.status || "NEW"}
                onChange={(e) => handleStatusChange(currentIdx, e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="NEW">Nowy</option>
                <option value="IN_PROGRESS">W trakcie</option>
                <option value="INTERESTED">Zainteresowany</option>
                <option value="CLOSED">Zamknięty</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: "block" }}>Data</label>
              <input
                type="date"
                value={crmDrafts[currentIdx]?.followUpDate || ""}
                onChange={(e) =>
                  setCrmDrafts({
                    ...crmDrafts,
                    [currentIdx]: { ...crmDrafts[currentIdx], followUpDate: e.target.value, followUp: !!e.target.value } as CrmDraft,
                  })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: "block" }}>Godzina</label>
              <input
                type="time"
                value={crmDrafts[currentIdx]?.followUpTime || ""}
                onChange={(e) =>
                  setCrmDrafts({
                    ...crmDrafts,
                    [currentIdx]: { ...crmDrafts[currentIdx], followUpTime: e.target.value } as CrmDraft,
                  })
                }
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-elevated)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>
          <textarea
            value={crmDrafts[currentIdx]?.note || ""}
            onChange={(e) =>
              setCrmDrafts({ ...crmDrafts, [currentIdx]: { ...crmDrafts[currentIdx], note: e.target.value } as CrmDraft })
            }
            placeholder="Notatki..."
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              fontSize: 14,
              minHeight: 100,
              marginBottom: 12,
            }}
          />
          <button
            onClick={handleSaveCrm}
            style={{
              width: "100%",
              padding: 12,
              background: savedIdx.has(currentIdx) ? "var(--success)" : "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {savedIdx.has(currentIdx) ? "✓ Zapisano" : "✅ Zapisz do CRM"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
