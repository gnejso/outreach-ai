"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { handleUnauthorized } from "@/lib/auth-redirect";

type Mode = "scraper" | "file";

interface ScrapedBusiness {
  name: string;
  phone: string;
  rating: string;
  reviewCount: number;
  address: string;
  website: string;
  category: string;
}

const INDUSTRIES = [
  "stolarz", "restauracja", "hydraulik", "elektryk", "mechanik samochodowy",
  "fryzjer", "kosmetyczka", "dentysta", "prawnik", "księgowy", "firma budowlana",
  "malarz", "kafelkarz", "ogrodnik", "fotograf", "ślusarz", "spawacz",
  "wulkanizator", "serwis komputerowy", "agencja marketingowa",
  "projektant wnętrz", "biuro rachunkowe", "kancelaria prawna", "gabinet lekarski",
  "fizjoterapeuta", "dietetyk", "psycholog", "weterynarz", "hotel", "pensjonat",
  "sklep meblowy", "sklep spożywczy", "piekarnia", "cukiernia", "bar",
  "kawiarnia", "pizzeria", "sushi", "kebab", "optyk",
  "apteka", "kwiaciarnia", "sklep zoologiczny", "agencja nieruchomości",
];

const CITIES = [
  "Warszawa", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin",
  "Bydgoszcz", "Lublin", "Białystok", "Katowice", "Gdynia", "Częstochowa",
  "Radom", "Sosnowiec", "Toruń", "Kielce", "Rzeszów", "Gliwice", "Zabrze",
  "Olsztyn", "Bielsko-Biała", "Bytom", "Zielona Góra", "Rybnik", "Ruda Śląska",
  "Tychy", "Opole", "Elbląg", "Płock", "Dąbrowa Górnicza", "Wałbrzych",
  "Włocławek", "Tarnów", "Chorzów", "Koszalin", "Kalisz", "Legnica",
  "Grudziądz", "Słupsk", "Jaworzno", "Jastrzębie-Zdrój", "Nowy Sącz",
  "Jelenia Góra", "Siedlce", "Mysłowice", "Konin", "Piotrków Trybunalski",
  "Lubin", "Inowrocław", "Ostrów Wielkopolski", "Suwałki", "Stargard",
  "Gniezno", "Ostrowiec Świętokrzyski", "Siemianowice Śląskie", "Głogów",
  "Pabianice", "Zamość", "Żory", "Mielec",
];

function parseReviewData(cellValue: string): { count: number; rating: number | null } {
  if (!cellValue || cellValue.trim() === "") return { count: 0, rating: null };
  const s = cellValue.trim();
  const combined = s.match(/\((\d+)\)\s*([\d.,]+)/);
  if (combined) return { count: parseInt(combined[1], 10), rating: parseFloat(combined[2].replace(",", ".")) };
  const justParens = s.match(/^\((\d+)\)$/);
  if (justParens) return { count: parseInt(justParens[1], 10), rating: null };
  if (s.includes(".") || s.includes(",")) {
    const num = parseFloat(s.replace(",", "."));
    if (!isNaN(num) && num <= 5) return { count: 0, rating: num };
  }
  const num = parseInt(s, 10);
  if (!isNaN(num)) return { count: num, rating: null };
  return { count: 0, rating: null };
}

function hasWebsite(value: string): boolean {
  if (!value || value.trim() === "") return false;
  const v = value.toLowerCase().trim();
  if (["nie", "no", "brak", "-", "n/a", "nd"].includes(v)) return false;
  return /https?:|www\.|\.pl|\.com|\.eu|\.net|\.io/.test(v);
}

interface Props {
  userTier: string;
  userRole: string;
  userCredits: number;
  dailyLimit: number;
  usedToday: number;
}

export function ScraperClient({ userTier, userRole, userCredits, dailyLimit, usedToday }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("scraper");
  // Scraper state
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [targetCount, setTargetCount] = useState(50);
  const [scraping, setScraping] = useState(false);

  // Pre-filters for scraping
  const [filterNoWebsite, setFilterNoWebsite] = useState(false);
  const [filterWithWebsite, setFilterWithWebsite] = useState(false);
  const [filterLowReviews, setFilterLowReviews] = useState(false);
  const [scraped, setScraped] = useState<ScrapedBusiness[]>([]);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  // File state
  const [fileRows, setFileRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [colMap, setColMap] = useState<Record<string, string>>({});
  // Common
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filterPhone, setFilterPhone] = useState(false);
  const [filterWebsite, setFilterWebsite] = useState(false);
  const [minRating, setMinRating] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [showPurpose, setShowPurpose] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationType, setGenerationType] = useState<"cold-call" | "sms">("cold-call");

  const REQUIRED_COLS = ["name", "phone", "reviews", "rating", "website", "industry", "city"];
  const COL_LABELS: Record<string, string> = {
    name: "Nazwa firmy", phone: "Numer telefonu", reviews: "Liczba opinii",
    rating: "Ocena", website: "Strona www", industry: "Branża", city: "Miasto",
  };

  function autoDetect(hdrs: string[]): Record<string, string> {
    const map: Record<string, string> = {};
    for (const hdr of hdrs) {
      const h = hdr.toLowerCase();
      if (!map.name && (h.includes("nazwa") || h.includes("name") || h.includes("firma"))) map.name = hdr;
      else if (!map.phone && (h.includes("tel") || h.includes("phone") || h.includes("kom") || h.includes("numer"))) map.phone = hdr;
      else if (!map.reviews && (h.includes("opini") || h.includes("review") || h.includes("ocen") || h.includes("recenz"))) map.reviews = hdr;
      else if (!map.rating && (h.includes("ocena") || h.includes("rating") || h.includes("stars"))) map.rating = hdr;
      else if (!map.website && (h.includes("stron") || h.includes("web") || h.includes("url") || h.includes("www"))) map.website = hdr;
      else if (!map.industry && (h.includes("branż") || h.includes("industry") || h.includes("kategor"))) map.industry = hdr;
      else if (!map.city && (h.includes("miasto") || h.includes("city") || h.includes("location") || h.includes("miej"))) map.city = hdr;
    }
    return map;
  }

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    const XLSX = await import("xlsx");
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
      if (json.length > 0) {
        const hdrs = Object.keys(json[0]);
        setHeaders(hdrs);
        setFileRows(json);
        setColMap(autoDetect(hdrs));
        setSelected(new Set());
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    noClick: true,
    multiple: false,
  });

  async function startScraping() {
    if (!industry.trim() || !city.trim()) return;
    setScraping(true);
    setScraped([]);
    setScrapeError(null);
    setSelected(new Set());

    try {
      const res = await fetch("/api/scraper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: industry.trim(), city: city.trim(), count: targetCount }),
      });
      if (handleUnauthorized(res, router)) return;

      const data = await res.json();

      // Show mock mode info
      if (data.mock) {
        console.log("[Scraper] MOCK MODE - używam przykładowych danych (brak Google Places API key)");
      }

      if (!res.ok) {
        if (data.error === "NO_API_KEY") {
          setScrapeError("Scraper nie jest skonfigurowany. Skontaktuj się z administratorem.");
        } else if (data.error === "INVALID_API_KEY") {
          setScrapeError("Błąd konfiguracji scrapera. Skontaktuj się z administratorem.");
        } else if (data.error === "TIMEOUT") {
          setScrapeError("Zapytanie przekroczyło limit czasu. Spróbuj ponownie.");
        } else if (data.error === "INSUFFICIENT_CREDITS") {
          setScrapeError(data.message || `Brak kredytów. Potrzebujesz ${data.needed} kredytów. Wykup subskrypcję lub dokup kredyty.`);
        } else if (data.error === "DAILY_LIMIT_EXCEEDED") {
          setScrapeError(data.message || `Osiągnięto dzienny limit scrapera. Pozostało: ${(data.limit ?? 0) - (data.used ?? 0)} firm.`);
        } else {
          setScrapeError("Błąd podczas wyszukiwania firm. Spróbuj ponownie.");
        }
        return;
      }

      let results = data.results ?? [];

      // Apply pre-filters
      if (filterNoWebsite) {
        results = results.filter((r: ScrapedBusiness) => !r.website || r.website.trim() === "");
      }
      if (filterWithWebsite) {
        results = results.filter((r: ScrapedBusiness) => r.website && r.website.trim() !== "");
      }
      if (filterLowReviews) {
        results = results.filter((r: ScrapedBusiness) => r.reviewCount < 5);
      }

      setScraped(results);
      if (results.length === 0) {
        setScrapeError(`Nie znaleziono firm spełniających kryteria dla "${industry}" w "${city}".`);
      }
    } catch {
      setScrapeError("Błąd połączenia z serwerem. Spróbuj ponownie.");
    } finally {
      setScraping(false);
    }
  }

  const displayRows: { name: string; phone: string; reviews: number; rating: number | null; website: string; industry: string; city: string }[] =
    mode === "scraper"
      ? scraped.map((b) => ({ name: b.name, phone: b.phone, reviews: b.reviewCount, rating: b.rating ? parseFloat(b.rating) : null, website: b.website, industry: b.category, city }))
      : fileRows.map((row) => {
          const rv = parseReviewData(row[colMap.reviews ?? ""] ?? "");
          const rv2 = parseReviewData(row[colMap.rating ?? ""] ?? "");
          return {
            name: row[colMap.name ?? ""] ?? "",
            phone: row[colMap.phone ?? ""] ?? "",
            reviews: rv.count || 0,
            rating: rv.rating ?? rv2.rating ?? null,
            website: row[colMap.website ?? ""] ?? "",
            industry: row[colMap.industry ?? ""] ?? "",
            city: row[colMap.city ?? ""] ?? "",
          };
        });

  const filteredRows = displayRows.filter((r) => {
    if (filterPhone && !r.phone) return false;
    if (filterWebsite && !hasWebsite(r.website)) return false;
    if (minRating && (r.rating === null || r.rating < parseFloat(minRating))) return false;
    if (tableSearch && !r.name.toLowerCase().includes(tableSearch.toLowerCase()) && !r.phone.includes(tableSearch)) return false;
    return true;
  });

  function toggleSelect(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filteredRows.length) setSelected(new Set());
    else setSelected(new Set(filteredRows.map((_, i) => i)));
  }

  function ratingColor(r: number | null): string {
    if (r === null) return "var(--text-muted)";
    if (r >= 4.5) return "#22c55e";
    if (r >= 3.0) return "#f59e0b";
    return "#ef4444";
  }

  async function exportToExcel() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(filteredRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Firmy");
    XLSX.writeFile(wb, `firmy_${industry || "lista"}_${city || "export"}.xlsx`);
  }

  const selectedRows = filteredRows.filter((_, i) => selected.has(i));

  const isFree = dailyLimit === 0 && userRole !== "ADMIN";
  const remaining = dailyLimit - usedToday;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "var(--text-primary)", marginBottom: 6 }}>
          📍 Znajdź Firmy
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Użyj scrapera Google Maps lub wgraj własny plik</p>

        {/* Scraper usage info */}
        {mode === "scraper" && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: 13 }}>
            {isFree ? (
              <span style={{ color: "var(--text-secondary)" }}>
                💳 <strong>FREE tier:</strong> 2 kredyty za firmę. Masz {userCredits} kredytów. <a href="/billing" style={{ color: "var(--accent-bright)", textDecoration: "underline" }}>Wykup subskrypcję</a> dla darmowego scrapera.
              </span>
            ) : userRole === "ADMIN" ? (
              <span style={{ color: "var(--success)" }}>👑 <strong>Admin:</strong> Nielimitowany dostęp do scrapera</span>
            ) : (
              <span style={{ color: remaining > 10 ? "var(--success)" : remaining > 0 ? "var(--warning)" : "var(--danger)" }}>
                🗺️ <strong>Dzienny limit:</strong> {usedToday}/{dailyLimit} firm ({remaining} pozostało)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        {([["scraper", "🗺️", "Google Maps Scraper", "Znajdź firmy automatycznie"], ["file", "📄", "Wgraj plik", "Excel lub CSV"]] as const).map(([id, icon, title, desc]) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            style={{
              minHeight: 200, padding: "32px 28px", textAlign: "left",
              borderRadius: "var(--radius-lg)", cursor: "pointer",
              background: mode === id ? "var(--accent-subtle)" : "var(--bg-card)",
              border: `2px solid ${mode === id ? "var(--accent)" : "var(--border)"}`,
              transition: "all 0.2s",
              display: "flex", flexDirection: "column", justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 14 }}>{icon}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "var(--text-primary)", marginBottom: 6 }}>{title}</div>
            <div style={{ fontSize: 16, color: "var(--text-muted)" }}>{desc}</div>
            {mode === id && <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: "var(--accent-bright)", fontFamily: "'JetBrains Mono', monospace" }}>[AKTYWNY]</div>}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === "scraper" ? (
          <motion.div key="scraper" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card" style={{ padding: 36, marginBottom: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
                <div>
                  <label style={{ fontSize: 16, color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: 10 }}>Branża</label>
                  <input
                    list="industries"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="np. hydraulik, restauracja..."
                    style={{ width: "100%", padding: "14px 16px", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: 16, fontFamily: "'IBM Plex Sans', sans-serif", outline: "none" }}
                  />
                  <datalist id="industries">{INDUSTRIES.map(i => <option key={i} value={i} />)}</datalist>
                </div>
                <div>
                  <label style={{ fontSize: 16, color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: 10 }}>Miasto</label>
                  <input
                    list="cities"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="np. Warszawa, Kraków..."
                    style={{ width: "100%", padding: "14px 16px", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: 16, fontFamily: "'IBM Plex Sans', sans-serif", outline: "none" }}
                  />
                  <datalist id="cities">{CITIES.map(c => <option key={c} value={c} />)}</datalist>
                </div>
              </div>
              <div style={{ marginBottom: 28 }}>
                <label style={{ fontSize: 16, color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: 10 }}>
                  Ilość firm: <strong style={{ color: "var(--accent-bright)", fontSize: 20 }}>{targetCount}</strong>
                </label>
                <input
                  type="range" min={10} max={100} step={10} value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "var(--accent)", height: 6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  <span>10</span><span>100</span>
                </div>
              </div>

              {/* Pre-filters */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 16, color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: 10 }}>
                  Filtry (opcjonalne)
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "var(--text-primary)" }}>
                    <input
                      type="checkbox"
                      checked={filterNoWebsite}
                      onChange={(e) => {
                        setFilterNoWebsite(e.target.checked);
                        if (e.target.checked) setFilterWithWebsite(false);
                      }}
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--accent)" }}
                    />
                    <span>🚫 Tylko firmy <strong>bez strony internetowej</strong></span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "var(--text-primary)" }}>
                    <input
                      type="checkbox"
                      checked={filterWithWebsite}
                      onChange={(e) => {
                        setFilterWithWebsite(e.target.checked);
                        if (e.target.checked) setFilterNoWebsite(false);
                      }}
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--accent)" }}
                    />
                    <span>🌐 Tylko firmy <strong>ze stroną internetową</strong></span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "var(--text-primary)" }}>
                    <input
                      type="checkbox"
                      checked={filterLowReviews}
                      onChange={(e) => setFilterLowReviews(e.target.checked)}
                      style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--accent)" }}
                    />
                    <span>⭐ Tylko firmy z <strong>mniej niż 5 opinii</strong></span>
                  </label>
                </div>
              </div>
              {scraping ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", height: 60 }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    style={{ width: 24, height: 24, border: "3px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 16, color: "var(--text-primary)", fontWeight: 600 }}>
                    🔍 Szukam firm na Google Maps...
                  </span>
                </div>
              ) : (
                <button
                  onClick={startScraping}
                  disabled={!industry.trim() || !city.trim()}
                  style={{
                    width: "100%", height: 60,
                    background: (!industry.trim() || !city.trim()) ? "var(--bg-elevated)" : "var(--accent)",
                    border: "none", borderRadius: "var(--radius-md)",
                    color: (!industry.trim() || !city.trim()) ? "var(--text-muted)" : "white",
                    fontSize: 18, fontWeight: 800,
                    cursor: (!industry.trim() || !city.trim()) ? "not-allowed" : "pointer",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    boxShadow: (!industry.trim() || !city.trim()) ? "none" : "0 0 28px var(--accent-glow)",
                  }}
                >
                  🔍 Szukaj firm na Google Maps
                </button>
              )}
              {scrapeError && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(201,59,59,0.1)", border: "1px solid rgba(201,59,59,0.3)", borderRadius: "var(--radius-md)", color: "#ef4444", fontSize: 13 }}>
                  ⚠️ {scrapeError}
                </div>
              )}
              {!scraping && scraped.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--success)" }}>
                  ✓ Znaleziono {scraped.length} firm
                  <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-muted)" }}>
                    ℹ️ Używam przykładowych danych (brak Google API key)
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div key="file" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="card" style={{ padding: 28, maxWidth: 700, marginBottom: 24 }}>
              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "var(--radius-lg)", padding: "40px 28px", textAlign: "center",
                  background: isDragActive ? "var(--accent-subtle)" : "var(--bg-elevated)", transition: "all 0.2s", marginBottom: 20,
                }}
              >
                <input {...getInputProps()} />
                <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 6 }}>
                  {fileName ? `✓ ${fileName}` : "Przeciągnij plik Excel lub CSV tutaj"}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 14 }}>— lub —</div>
                <button onClick={open} style={{ padding: "10px 22px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  📂 Kliknij aby wybrać plik
                </button>
                <div style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 10 }}>Akceptowane: .xlsx .xls .csv</div>
              </div>

              {headers.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, color: "var(--success)", fontWeight: 600, marginBottom: 14 }}>
                    ✓ Wykryto {fileRows.length} firm w pliku
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {REQUIRED_COLS.map((col) => (
                      <div key={col}>
                        <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{COL_LABELS[col]}</label>
                        <select
                          value={colMap[col] ?? ""}
                          onChange={(e) => setColMap((prev) => ({ ...prev, [col]: e.target.value }))}
                          style={{ width: "100%", padding: "7px 10px", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: 12, fontFamily: "'IBM Plex Sans', sans-serif" }}
                        >
                          <option value="">— wybierz kolumnę —</option>
                          {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results table */}
      {filteredRows.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
            <input
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Szukaj w wynikach..."
              style={{ padding: "7px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: 13, width: 200, fontFamily: "'IBM Plex Sans', sans-serif", outline: "none" }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}>
              <input type="checkbox" checked={filterPhone} onChange={(e) => setFilterPhone(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
              Tylko z telefonem
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}>
              <input type="checkbox" checked={filterWebsite} onChange={(e) => setFilterWebsite(e.target.checked)} style={{ accentColor: "var(--accent)" }} />
              Tylko ze stroną
            </label>
            <input
              type="number" min="0" max="5" step="0.5" value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              placeholder="Ocena min."
              style={{ padding: "7px 10px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: 13, width: 110, fontFamily: "'IBM Plex Sans', sans-serif", outline: "none" }}
            />
            <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: "auto" }}>
              Znaleziono {filteredRows.length} firm
            </span>
          </div>

          <div style={{ overflowX: "auto", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", width: 36 }}>
                    <input type="checkbox" checked={selected.size === filteredRows.length && filteredRows.length > 0} onChange={toggleAll} style={{ accentColor: "var(--accent)" }} />
                  </th>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>#</th>
                  {["Nazwa firmy", "Telefon", "Opinie", "Ocena", "Adres", "Strona www", "Branża"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)", background: selected.has(i) ? "var(--accent-subtle)" : "transparent", cursor: "pointer" }} onClick={() => toggleSelect(i)}>
                    <td style={{ padding: "9px 12px" }}>
                      <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} onClick={(e) => e.stopPropagation()} style={{ accentColor: "var(--accent)" }} />
                    </td>
                    <td style={{ padding: "9px 12px", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>{i + 1}</td>
                    <td style={{ padding: "9px 12px", color: "var(--text-primary)", fontWeight: 600, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</td>
                    <td style={{ padding: "9px 12px", color: "var(--text-secondary)", fontFamily: "'JetBrains Mono', monospace" }}>{row.phone || "—"}</td>
                    <td style={{ padding: "9px 12px", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>{row.reviews || "—"}</td>
                    <td style={{ padding: "9px 12px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: ratingColor(row.rating) }}>{row.rating?.toFixed(1) ?? "—"}</td>
                    <td style={{ padding: "9px 12px", color: "var(--text-muted)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.city || "—"}</td>
                    <td style={{ padding: "9px 12px" }}>
                      {hasWebsite(row.website) ? (
                        <a href={row.website.startsWith("http") ? row.website : `https://${row.website}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: "var(--accent-bright)", fontSize: 11, textDecoration: "none" }}>
                          🌐 {row.website.replace(/^https?:\/\/(www\.)?/, "").slice(0, 20)}
                        </a>
                      ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td style={{ padding: "9px 12px", color: "var(--text-muted)" }}>{row.industry || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => { if (selected.size > 0) setShowPurpose(true); }}
              disabled={selected.size === 0}
              style={{
                padding: "11px 20px", background: selected.size > 0 ? "var(--accent)" : "var(--bg-elevated)",
                border: "none", borderRadius: "var(--radius-md)", color: selected.size > 0 ? "white" : "var(--text-muted)",
                fontSize: 13, fontWeight: 600, cursor: selected.size > 0 ? "pointer" : "not-allowed",
                fontFamily: "'IBM Plex Sans', sans-serif",
                boxShadow: selected.size > 0 ? "0 0 20px var(--accent-glow)" : "none",
              }}
            >
              🚀 Generuj skrypty dla zaznaczonych ({selected.size})
            </button>
            <button
              onClick={exportToExcel}
              style={{ padding: "11px 18px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              📤 Eksportuj do Excel
            </button>
          </div>

          <AnimatePresence>
            {showPurpose && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: 20, padding: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
                {/* Generation Type Selector */}
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 12 }}>
                  Co chcesz wygenerować?
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <button
                    onClick={() => setGenerationType("cold-call")}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: generationType === "cold-call" ? "var(--accent)" : "var(--bg-elevated)",
                      border: `1px solid ${generationType === "cold-call" ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: "var(--radius-md)",
                      color: generationType === "cold-call" ? "white" : "var(--text-secondary)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      transition: "all 0.15s",
                    }}
                  >
                    📞 Skrypty Cold Call
                  </button>
                  <button
                    onClick={() => setGenerationType("sms")}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: generationType === "sms" ? "var(--accent)" : "var(--bg-elevated)",
                      border: `1px solid ${generationType === "sms" ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: "var(--radius-md)",
                      color: generationType === "sms" ? "white" : "var(--text-secondary)",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      transition: "all 0.15s",
                    }}
                  >
                    💬 Wiadomości SMS
                  </button>
                </div>

                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 12 }}>
                  {generationType === "cold-call" ? "W jakim celu dzwonisz do tych firm?" : "Co chcesz im zaproponować?"}
                </div>
                <input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder={generationType === "cold-call"
                    ? "np. sprzedaż strony internetowej, AI receptionist, pozycjonowanie SEO..."
                    : "np. Oferuję profesjonalne strony www, AI dla recepcji, SEO..."}
                  style={{ width: "100%", padding: "11px 14px", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: 14, fontFamily: "'IBM Plex Sans', sans-serif", outline: "none", marginBottom: 12 }}
                />
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
                  {selected.size} firm × {generationType === "cold-call" ? "4" : "3"} kredyty = <strong style={{ color: "var(--accent-bright)" }}>{selected.size * (generationType === "cold-call" ? 4 : 3)} kredytów</strong>
                </div>
                <button
                  onClick={async () => {
                    if (!purpose.trim()) return;
                    setGenerating(true);
                    const rows = selectedRows.map((r) => ({
                      Nazwa: r.name, Telefon: r.phone, Opinie: r.reviews, Ocena: r.rating ?? "",
                      Strona: r.website, Branża: r.industry, Miasto: r.city,
                    }));
                    const mapping = { name: "Nazwa", phone: "Telefon", reviews: "Opinie", rating: "Ocena", hasWebsite: "Strona", industry: "Branża", city: "Miasto" };
                    const endpoint = generationType === "cold-call" ? "/api/generate/cold-call" : "/api/generate/sms";
                    const res = await fetch(endpoint, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ rows, mapping, purpose }),
                    });
                    if (handleUnauthorized(res, router)) return;
                    if (res.ok) {
                      window.location.href = "/history";
                    } else {
                      alert("Błąd generowania. Sprawdź saldo kredytów.");
                    }
                    setGenerating(false);
                  }}
                  disabled={!purpose.trim() || generating}
                  style={{
                    padding: "12px 24px", background: purpose.trim() ? "var(--accent)" : "var(--bg-elevated)",
                    border: "none", borderRadius: "var(--radius-md)", color: purpose.trim() ? "white" : "var(--text-muted)",
                    fontSize: 14, fontWeight: 700, cursor: purpose.trim() ? "pointer" : "not-allowed",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                >
                  {generating ? "Generuję..." : `✅ Potwierdź i generuj ${generationType === "cold-call" ? "skrypty" : "SMS"}`}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
