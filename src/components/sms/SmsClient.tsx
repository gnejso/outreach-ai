"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { handleUnauthorized } from "@/lib/auth-redirect";
import type { CompanyRow, ColumnMapping } from "@/types";
import { CREDIT_COSTS } from "@/types";
import { mapColumns } from "@/lib/spreadsheet";

type Step = "upload" | "map" | "confirm" | "results";

export function SmsClient() {
  const t = useTranslations("sms");
  const tc = useTranslations("coldCall");
  const tcommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [step, setStep] = useState<Step>("upload");
  const [purpose, setPurpose] = useState("");
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const [businesses, setBusinesses] = useState<CompanyRow[]>([]);
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [generating, setGenerating] = useState<Set<number>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [creditsNeeded, setCreditsNeeded] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const onDrop = useCallback(async (files: File[]) => {
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
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  async function handleConfirmMapping() {
    if (!mapping.name || !mapping.phone || !mapping.reviews) return;
    const res = await fetch("/api/credits", { method: "GET" });
    if (handleUnauthorized(res, router)) return;
    const data = await res.json();
    setCredits(data.credits);
    const cost = rawRows.length * CREDIT_COSTS.SMS_CONTENT;
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

    const res = await fetch("/api/generate/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: rawRows, mapping, purpose, locale }),
    });
    if (handleUnauthorized(res, router)) return;

    if (!res.ok) {
      alert(tc("generationError"));
      return;
    }

    const data = await res.json();
    setSessionId(data.sessionId);
    setStep("results");
  }

  async function generateMessage(index: number) {
    if (messages[index] !== undefined || generating.has(index) || index >= businesses.length || !sessionId) return;

    setGenerating(prev => new Set(prev).add(index));

    try {
      const res = await fetch("/api/generate/sms/single", {
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
      setMessages(prev => ({ ...prev, [index]: data.message }));
    } catch (err) {
      console.error("Generate error:", err);
      setMessages(prev => ({ ...prev, [index]: `[${tc("generationError")}]` }));
    } finally {
      setGenerating(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }

  useEffect(() => {
    if (sessionId && businesses.length > 0) {
      generateMessage(currentIdx);
      generateMessage(currentIdx + 1);
    }
  }, [currentIdx, sessionId, businesses.length]);

  useEffect(() => {
    if (sessionId && businesses.length > 0) {
      generateMessage(0);
      generateMessage(1);
    }
  }, [sessionId]);

  function handlePrev() {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  }

  function handleNext() {
    if (currentIdx < businesses.length - 1) setCurrentIdx(currentIdx + 1);
  }

  function copyMessage() {
    const msg = messages[currentIdx];
    if (msg) {
      navigator.clipboard.writeText(msg);
      setCopiedIdx(currentIdx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  }

  const currentBusiness = businesses[currentIdx];
  const currentMessage = messages[currentIdx];
  const isGenerating = generating.has(currentIdx);

  if (step === "upload") {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          {t("title")}
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 32, fontSize: 14 }}>
          {t("subtitle")}
        </p>

        <div
          {...getRootProps()}
          style={{
            border: "2px dashed var(--border)",
            borderRadius: 12,
            padding: 60,
            textAlign: "center",
            cursor: "pointer",
            background: isDragActive ? "var(--bg-elevated)" : "var(--bg-card)",
            transition: "all 0.2s",
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{tc("upload")}</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{tc("uploadDesc")}</p>
        </div>
      </div>
    );
  }

  if (step === "map") {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button onClick={() => setStep("upload")} style={{ marginBottom: 20, padding: "8px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}>
          ← {tcommon("back")}
        </button>

        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{tc("mapColumns")}</h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
          {tc("assignColumns")}
        </p>

        <div style={{ marginBottom: 32 }}>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: "block" }}>
            {tc("callPurpose")} *
          </label>
          <textarea
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            placeholder={tc("callPurposeExample")}
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
          { key: "name", label: tc("columnName"), required: true },
          { key: "phone", label: tc("columnPhone"), required: true },
          { key: "reviews", label: tc("columnReviews"), required: true },
          { key: "rating", label: tc("rating"), required: false },
          { key: "industry", label: tc("columnIndustry"), required: false },
          { key: "website", label: tc("columnWebsite"), required: false },
        ].map(({ key, label, required }) => (
          <div key={key} style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: "block" }}>
              {label} {required && "*"}
            </label>
            <select
              value={(mapping as Record<string, string>)[key] || ""}
              onChange={e => setMapping({ ...mapping, [key]: e.target.value })}
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
              <option value="">{tc("selectColumn")}</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        ))}

        <button
          onClick={handleConfirmMapping}
          disabled={!mapping.name || !mapping.phone || !mapping.reviews}
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
            opacity: (!mapping.name || !mapping.phone || !mapping.reviews) ? 0.5 : 1,
          }}
        >
          {tc("nextStep")}
        </button>
      </div>
    );
  }

  if (step === "confirm") {
    const cost = rawRows.length * CREDIT_COSTS.SMS_CONTENT;
    return (
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <button onClick={() => setStep("map")} style={{ marginBottom: 20, padding: "8px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}>
          ← {tcommon("back")}
        </button>

        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>{tc("summary")}</h2>

        <div style={{ background: "var(--bg-card)", padding: 24, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{tc("firmsToGenerate")}</span>
            <span style={{ fontSize: 24, fontWeight: 800, marginLeft: 12 }}>{rawRows.length}</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{tc("cost")}</span>
            <span style={{ fontSize: 20, fontWeight: 700, marginLeft: 12, color: "var(--danger)" }}>
              -{cost} {tc("credits")}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{tc("balanceAfter")}</span>
            <span style={{ fontSize: 20, fontWeight: 700, marginLeft: 12, color: "var(--accent-bright)" }}>
              {(credits ?? 0) - cost} {tc("credits")}
            </span>
          </div>
        </div>

        {insufficientCredits ? (
          <div style={{ background: "rgba(201,59,59,0.1)", border: "1px solid var(--danger)", padding: 20, borderRadius: 12, marginBottom: 20 }}>
            <p style={{ color: "var(--danger)", fontWeight: 600, marginBottom: 8 }}>{tc("insufficientCredits")}</p>
            <p style={{ fontSize: 13 }}>{tc("needCredits", { n: creditsNeeded })}</p>
            <button
              onClick={() => window.location.href = `/${locale}/billing`}
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
              {tc("topUp")}
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
            {t("generateButton")}
          </button>
        )}
      </div>
    );
  }

  if (step === "results") {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, padding: "16px 20px", background: "var(--bg-card)", borderRadius: 12 }}>
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
            ← {tc("previous")}
          </button>

          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {tc("firmXofY", { current: currentIdx + 1, total: businesses.length })}
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
            {tc("next")} →
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
                📞 {currentBusiness.phone}
              </span>
              <span style={{ padding: "4px 12px", background: "var(--bg-elevated)", borderRadius: 6, fontSize: 13 }}>
                ⭐ {currentBusiness.reviews} {tc("reviews")}
              </span>
            </div>
          </div>
        )}

        <div style={{ background: "var(--bg-card)", padding: 24, borderRadius: 12, minHeight: 300 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>SMS Message</h3>
          {isGenerating ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
              <p style={{ fontSize: 16, color: "var(--text-secondary)" }}>{tc("generatingScript")}</p>
            </div>
          ) : currentMessage ? (
            <div>
              <div style={{ padding: 20, background: "var(--bg-elevated)", borderRadius: 8, marginBottom: 16 }}>
                <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0 }}>{currentMessage}</p>
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                  {t("length")}: {currentMessage.length} {t("characters")}
                </div>
              </div>
              <button
                onClick={copyMessage}
                style={{
                  padding: "10px 20px",
                  background: copiedIdx === currentIdx ? "var(--success)" : "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {copiedIdx === currentIdx ? `✓ ${tc("copied")}` : tc("copy")}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, color: "var(--text-muted)" }}>
              {tc("loadingDots")}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
