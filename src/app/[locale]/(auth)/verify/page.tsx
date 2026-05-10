"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function VerifyPage() {
  const t = useTranslations("auth");

  return (
    <div className="page-bg min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card p-10 w-full max-w-md text-center"
        style={{ position: "relative", zIndex: 1 }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            background: "var(--accent-subtle)",
            border: "1px solid var(--accent)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              stroke="var(--accent-bright)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: "var(--text-primary)",
            marginBottom: 10,
          }}
        >
          {t("checkEmail")}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.6 }}>
          {t("magicLinkSent")} — kliknij link w emailu aby się zalogować.
        </p>
      </motion.div>
    </div>
  );
}
