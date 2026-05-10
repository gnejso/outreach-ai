"use client";

import { useRouter } from "next/navigation";

export function GuestBanner() {
  const router = useRouter();

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(42,127,255,0.1) 0%, rgba(26,95,221,0.15) 100%)",
        border: "1px solid rgba(42,127,255,0.3)",
        borderRadius: "var(--radius-md)",
        padding: "16px 24px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>👋</span>
        <div>
          <div style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            Przeglądasz jako gość
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Zaloguj się aby używać AI i zapisywać postępy
          </div>
        </div>
      </div>
      <button
        onClick={() => router.push("/login")}
        style={{
          padding: "10px 24px",
          background: "var(--accent)",
          border: "none",
          borderRadius: "var(--radius-md)",
          color: "white",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'IBM Plex Sans', sans-serif",
          boxShadow: "0 0 20px var(--accent-glow)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 24px var(--accent-glow)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 0 20px var(--accent-glow)";
        }}
      >
        🔐 Zaloguj się
      </button>
    </div>
  );
}
