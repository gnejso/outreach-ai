"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
  needed: number;
  current: number;
  locale?: string;
}

const PACKS = [
  { name: "Mała", price: "20 PLN", credits: 350, color: "#1A6BDD" },
  { name: "Średnia", price: "48 PLN", credits: 800, color: "#5B4FE8" },
  { name: "Duża", price: "80 PLN", credits: 1800, color: "#C9A84C" },
];

export function LowCreditModal({ open, onClose, needed, current, locale = "pl" }: Props) {
  const router = useRouter();
  const deficit = needed - current;

  const recommended = PACKS.filter((p) => p.credits >= deficit).slice(0, 3);
  const toShow = recommended.length > 0 ? recommended : PACKS.slice(-2);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5,10,20,0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 500,
            padding: "20px",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 500,
              background: "var(--bg-card)",
              border: "1px solid rgba(201,59,59,0.3)",
              borderRadius: "var(--radius-xl)",
              padding: "36px 32px",
              boxShadow: "0 0 60px rgba(201,59,59,0.15)",
            }}
          >
            {/* Icon */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ fontSize: 48, marginBottom: 12 }}
              >
                💎
              </motion.div>
              <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 22,
                color: "var(--text-primary)",
                marginBottom: 8,
              }}>
                Niewystarczające saldo 💎
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Potrzebujesz <strong style={{ color: "var(--danger)" }}>{needed} kredytów</strong>, masz tylko{" "}
                <strong style={{ color: "var(--text-primary)" }}>{current}</strong>
              </p>
            </div>

            {/* Recommended packs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {toShow.map((pack) => (
                <div
                  key={pack.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "var(--bg-elevated)",
                    border: `1px solid ${pack.color}30`,
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 2 }}>
                      {pack.name}
                    </div>
                    <div suppressHydrationWarning style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: pack.color }}>
                      +{pack.credits.toLocaleString()} kredytów
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/${locale}/billing`)}
                    style={{
                      padding: "8px 18px",
                      background: pack.color,
                      border: "none",
                      borderRadius: "var(--radius-md)",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'IBM Plex Sans', sans-serif",
                    }}
                  >
                    {pack.price}
                  </button>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => router.push(`/${locale}/billing`)}
              style={{
                width: "100%",
                padding: "14px",
                background: "var(--accent)",
                border: "none",
                borderRadius: "var(--radius-md)",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'IBM Plex Sans', sans-serif",
                marginBottom: 12,
                boxShadow: "0 0 24px var(--accent-glow)",
              }}
            >
              💳 Doładuj konto
            </button>
            <div style={{ textAlign: "center" }}>
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}
              >
                Anuluj
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
