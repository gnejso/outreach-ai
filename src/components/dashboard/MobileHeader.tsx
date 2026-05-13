"use client";

import { Link } from "@/i18n/navigation";

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    credits?: number;
  };
}

export function MobileHeader({ user }: Props) {
  const isAdmin = user.role === "ADMIN";
  const credits = user.credits ?? 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2A7FFF", boxShadow: "0 0 8px #2A7FFF", flexShrink: 0 }} />
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
          OutreachAI
        </span>
      </Link>

      {/* Credits + Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(42,127,255,0.08)",
            border: "1px solid rgba(42,127,255,0.25)",
            borderRadius: 20,
            padding: "6px 12px",
          }}
        >
          <span style={{ fontSize: 14 }}>💎</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: 14,
              color: isAdmin ? "var(--warning)" : "var(--accent-bright)",
            }}
          >
            {credits.toLocaleString()}
          </span>
        </div>

        <Link href="/profile" style={{ textDecoration: "none" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--accent-subtle)",
              border: "1px solid var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--accent-bright)" }}>
                {(user.name ?? user.email ?? "?")[0].toUpperCase()}
              </span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
