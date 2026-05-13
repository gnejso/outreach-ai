"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export function ColdEmailInfoSection() {
  const t = useTranslations("coldEmailInfo");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      style={{ marginTop: 40 }}
    >
      {/* Two cards side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <InfoCard icon="✉️" title={t("card1Title")} text={t("card1Text")} />
        <InfoCard icon="🔬" title={t("card2Title")} text={t("card2Text")} />
      </div>

      {/* Full width comparison table card */}
      <div className="info-card" style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 24,
        backdropFilter: "blur(8px)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
        <h3 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 20,
        }}>
          {t("card3Title")}
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
          }}>
            <thead>
              <tr style={{ background: "rgba(42, 127, 255, 0.15)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-primary)", fontWeight: 600 }}></th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-primary)", fontWeight: 600 }}>Cold SMS</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--text-primary)", fontWeight: 600 }}>Cold Email</th>
              </tr>
            </thead>
            <tbody>
              <TableRow label={t("tableLength")} sms={t("tableLengthSms")} email={t("tableLengthEmail")} />
              <TableRow label={t("tableTone")} sms={t("tableToneSms")} email={t("tableToneEmail")} odd />
              <TableRow label={t("tableResponse")} sms={t("tableResponseSms")} email={t("tableResponseEmail")} />
              <TableRow label={t("tableBestFor")} sms={t("tableBestForSms")} email={t("tableBestForEmail")} odd />
              <TableRow label={t("tableCost")} sms={t("tableCostSms")} email={t("tableCostEmail")} />
            </tbody>
          </table>
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

function TableRow({ label, sms, email, odd = false }: { label: string; sms: string; email: string; odd?: boolean }) {
  return (
    <tr style={{ background: odd ? "var(--bg-elevated)" : "transparent" }}>
      <td style={{ padding: "12px 16px", color: "var(--text-primary)", fontWeight: 600, borderTop: "1px solid var(--border)" }}>{label}</td>
      <td style={{ padding: "12px 16px", color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}>{sms}</td>
      <td style={{ padding: "12px 16px", color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}>{email}</td>
    </tr>
  );
}
