"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import { useRouter } from "next/navigation";
import { handleUnauthorized } from "@/lib/auth-redirect";

interface Props {
  userCredits: number;
  isAdmin: boolean;
  userEmail?: string | null;
}

export function OfertaClient({ userCredits, isAdmin, userEmail }: Props) {
  const router = useRouter();
  const isGuest = !userEmail;
  const [credits, setCredits] = useState(userCredits);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [kraj, setKraj] = useState("Polska");
  const [twojaFirma, setTwojaFirma] = useState("");
  const [firmaKlienta, setFirmaKlienta] = useState("");
  const [branza, setBranza] = useState("");
  const [usluga, setUsluga] = useState("");
  const [cena, setCena] = useState<number | "">("");
  const [waluta, setWaluta] = useState("PLN");
  const [szczegoly, setSzczegoly] = useState("");

  // Dates with default values
  const today = new Date().toISOString().split("T")[0];
  const [dataWystawienia, setDataWystawienia] = useState(today);
  const [dataZawarcia, setDataZawarcia] = useState(today);

  const [showLowCreditModal, setShowLowCreditModal] = useState(false);

  const canGenerate = kraj && twojaFirma && firmaKlienta && branza && usluga && cena && dataWystawienia && dataZawarcia;

  async function handleGenerate() {
    if (isGuest) {
      alert("Zaloguj się aby użyć tej funkcji");
      return;
    }
    if (!canGenerate) return;

    const cost = 25;
    if (!isAdmin && credits < cost) {
      setShowLowCreditModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/generate/oferta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kraj,
          twojaFirma,
          firmaKlienta,
          branza,
          usluga,
          cena,
          waluta,
          szczegoly: szczegoly.trim() || undefined,
          dataWystawienia,
          dataZawarcia,
        }),
      });
      if (handleUnauthorized(res, router)) return;

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "Insufficient credits") {
          setShowLowCreditModal(true);
        } else {
          setError(data.error || "Błąd generowania dokumentu");
        }
        return;
      }

      setResult(data.result);
      if (!isAdmin) setCredits((prev) => prev - cost);
    } catch (err) {
      console.error("Error generating offer:", err);
      setError("Błąd połączenia z serwerem");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPDF() {
    if (!result) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Configure font and margins
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper to add text with word wrap
      function addText(text: string, fontSize: number, isBold: boolean = false) {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");

        const lines = doc.splitTextToSize(text, maxWidth);

        for (const line of lines) {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        }
        yPosition += 3;
      }

      // Parse and format the document
      const sections = result.split(/\n\n+/);

      for (const section of sections) {
        const trimmed = section.trim();
        if (!trimmed) continue;

        // Detect headers (lines in CAPS or starting with special chars)
        if (trimmed.match(/^[A-ZĘÓĄŚŁŻŹĆŃ\s\-—]+$/) || trimmed.startsWith("===") || trimmed.startsWith("CZĘŚĆ")) {
          addText(trimmed, 14, true);
        } else if (trimmed.startsWith("⚠️")) {
          // Warning/disclaimer
          doc.setTextColor(200, 100, 0);
          addText(trimmed, 10, false);
          doc.setTextColor(0, 0, 0);
        } else {
          // Regular text
          addText(trimmed, 11, false);
        }
      }

      // Save PDF
      doc.save(`oferta-${firmaKlienta.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Błąd generowania PDF. Spróbuj skopiować tekst.");
    }
  }

  function handleDownloadTxt() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `oferta-${firmaKlienta.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    setResult(null);
    setError(null);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "var(--text-primary)", marginBottom: 6 }}>
          📄 Generator Ofert i Umów
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Wygeneruj profesjonalną ofertę handlową i szkic umowy B2B
        </p>
      </div>

      {/* Credits display */}
      <div style={{ marginBottom: 24, padding: "12px 16px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", display: "inline-block" }}>
        <span style={{ color: "var(--text-muted)", fontSize: 13, marginRight: 8 }}>Dostępne kredyty:</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 600, color: credits < 25 ? "var(--danger)" : "var(--accent-bright)" }}>
          {credits}
        </span>
      </div>

      {!result ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: 32, maxWidth: 800 }}>
          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Kraj */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Kraj <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={kraj}
                onChange={(e) => setKraj(e.target.value)}
                placeholder="np. Polska, Niemcy, UK..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              />
            </div>

            {/* Twoja firma */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Twoja nazwa firmy / imię i nazwisko <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={twojaFirma}
                onChange={(e) => setTwojaFirma(e.target.value)}
                placeholder="np. Jan Kowalski / Firma ABC Sp. z o.o."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              />
            </div>

            {/* Firma klienta */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Nazwa firmy klienta <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={firmaKlienta}
                onChange={(e) => setFirmaKlienta(e.target.value)}
                placeholder="np. Restauracja Pod Strzechą"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              />
            </div>

            {/* Branża */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Branża klienta <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                type="text"
                value={branza}
                onChange={(e) => setBranza(e.target.value)}
                placeholder="np. restauracja, salon fryzjerski, mechanik..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              />
            </div>

            {/* Usługa */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Opis Twojej usługi <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <textarea
                value={usluga}
                onChange={(e) => setUsluga(e.target.value)}
                placeholder="np. Tworzenie profesjonalnej strony internetowej z systemem rezerwacji online..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Cena i waluta */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                  Cena <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="number"
                  value={cena}
                  onChange={(e) => setCena(e.target.value ? Number(e.target.value) : "")}
                  placeholder="np. 5000"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                  Waluta
                </label>
                <select
                  value={waluta}
                  onChange={(e) => setWaluta(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                >
                  <option value="PLN">PLN</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
            </div>

            {/* Daty */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                  Data wystawienia oferty <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="date"
                  value={dataWystawienia}
                  onChange={(e) => setDataWystawienia(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                  Data zawarcia umowy <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="date"
                  value={dataZawarcia}
                  onChange={(e) => setDataZawarcia(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-primary)",
                    fontSize: 14,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                />
              </div>
            </div>

            {/* Szczegóły */}
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Dodatkowe szczegóły (opcjonalne)
              </label>
              <textarea
                value={szczegoly}
                onChange={(e) => setSzczegoly(e.target.value)}
                placeholder="np. płatność w 2 ratach, termin realizacji 3 tygodnie, hosting na 1 rok gratis..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: 14,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{ padding: "12px 16px", background: "rgba(201,59,59,0.1)", border: "1px solid var(--danger)", borderRadius: "var(--radius-md)", color: "var(--danger)", fontSize: 14 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || loading || isGuest}
              style={{
                width: "100%",
                padding: "14px 24px",
                background: canGenerate && !loading && !isGuest ? "var(--accent)" : "var(--bg-elevated)",
                border: "none",
                borderRadius: "var(--radius-md)",
                color: canGenerate && !loading && !isGuest ? "white" : "var(--text-muted)",
                fontSize: 15,
                fontWeight: 700,
                cursor: canGenerate && !loading && !isGuest ? "pointer" : "not-allowed",
                fontFamily: "'IBM Plex Sans', sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: canGenerate && !loading && !isGuest ? "0 0 20px var(--accent-glow)" : "none",
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ width: 20, height: 20, border: "3px solid white", borderTopColor: "transparent", borderRadius: "50%" }}
                  />
                  <span>Generuję dokument...</span>
                </>
              ) : isGuest ? (
                <span>🔒 Zaloguj się aby wygenerować dokument</span>
              ) : (
                <>
                  <span>📄 Generuj Ofertę i Umowę</span>
                  <span style={{ opacity: 0.7 }}>— 25 kredytów</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Result display */}
          <div className="card" style={{ padding: 32, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: "var(--text-primary)" }}>
                ✅ Wygenerowano dokument
              </h2>
              <button
                onClick={handleReset}
                style={{
                  padding: "8px 16px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ← Nowy dokument
              </button>
            </div>

            {/* Document text */}
            <div
              style={{
                padding: 24,
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                marginBottom: 20,
                maxHeight: 600,
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--text-primary)",
              }}
            >
              {result}
            </div>

            {/* Disclaimer */}
            <div style={{ padding: "12px 16px", background: "rgba(201,126,10,0.1)", border: "1px solid var(--warning)", borderRadius: "var(--radius-md)", color: "var(--warning)", fontSize: 13, marginBottom: 20 }}>
              ⚠️ <strong>WAŻNE:</strong> Ten dokument jest szablonem pomocniczym wygenerowanym przez AI. Przed podpisaniem skonsultuj go z prawnikiem. Nie stanowi porady prawnej.
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={handleCopy}
                style={{
                  flex: "1 1 150px",
                  padding: "12px 20px",
                  background: copied ? "var(--success)" : "var(--accent)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  transition: "all 0.2s",
                }}
              >
                {copied ? "✓ Skopiowano" : "📋 Kopiuj tekst"}
              </button>
              <button
                onClick={handleDownloadPDF}
                style={{
                  flex: "1 1 150px",
                  padding: "12px 20px",
                  background: "var(--accent)",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  boxShadow: "0 0 20px var(--accent-glow)",
                }}
              >
                📄 Pobierz PDF
              </button>
              <button
                onClick={handleDownloadTxt}
                style={{
                  flex: "1 1 150px",
                  padding: "12px 20px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                }}
              >
                💾 Pobierz TXT
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Low Credit Modal */}
      <AnimatePresence>
        {showLowCreditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLowCreditModal(false)}
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
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card"
              style={{ padding: 32, maxWidth: 400, width: "100%", textAlign: "center" }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 20, color: "var(--text-primary)", marginBottom: 12 }}>
                Za mało kredytów
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
                Potrzebujesz 25 kredytów aby wygenerować ofertę i umowę. Aktualnie masz {credits} kredytów.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setShowLowCreditModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-secondary)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Anuluj
                </button>
                <a
                  href="/billing"
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    background: "var(--accent)",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    color: "white",
                    fontSize: 14,
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Doładuj
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
