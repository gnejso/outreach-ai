"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function ColdCallInfoSection() {
  const t = useTranslations("coldCallInfo");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      style={{ marginTop: 40 }}
    >
      {/* Two cards side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <InfoCard icon="⚡" title={t("card1Title")} text={t("card1Text")} />
        <InfoCard icon="🎯" title={t("card2Title")} text={t("card2Text")} />
      </div>

      {/* Full width stats card */}
      <div className="info-card" style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 24,
        backdropFilter: "blur(8px)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
        <h3 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 20,
        }}>
          {t("card3Title")}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          <StatColumn number={t("stat1Number")} label={t("stat1Label")} />
          <StatColumn number={t("stat2Number")} label={t("stat2Label")} />
          <StatColumn number={t("stat3Number")} label={t("stat3Label")} last />
        </div>
      </div>

      <style jsx>{`
        .info-card:hover {
          border-color: var(--border-bright);
          box-shadow: 0 0 20px rgba(42, 127, 255, 0.06);
        }
        @media (max-width: 767px) {
          .info-card {
            padding: 20px !important;
          }
        }
      `}</style>
    </motion.div>
  );
}

function InfoCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="info-card" style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 24,
      backdropFilter: "blur(8px)",
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <h3 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 18,
        fontWeight: 700,
        color: "var(--text-primary)",
        marginBottom: 12,
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 14,
        lineHeight: 1.7,
        color: "var(--text-secondary)",
        margin: 0,
      }}>
        {text}
      </p>
    </div>
  );
}

function StatColumn({ number, label, last = false }: { number: string; label: string; last?: boolean }) {
  return (
    <div style={{
      textAlign: "center",
      borderRight: last ? "none" : "1px solid var(--border)",
      padding: "0 12px",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 36,
        fontWeight: 800,
        color: "var(--accent-bright)",
        marginBottom: 8,
      }}>
        {number}
      </div>
      <div style={{
        fontSize: 12,
        color: "var(--text-muted)",
        lineHeight: 1.4,
      }}>
        {label}
      </div>
    </div>
  );
}
