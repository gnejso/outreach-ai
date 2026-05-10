"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { SUBSCRIPTION_TIERS, CREDIT_PACKS } from "@/config/credits";
import { formatPrice, getCurrencyConfig } from "@/config/currency";

interface Props {
  user: { credits: number; tier: string; role: string };
  locale: string;
  transactions: {
    id: string;
    type: string;
    description: string;
    creditsUsed: number;
    createdAt: string;
  }[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, { label: string; color: string }> = {
    FREE: { label: "FREE", color: "#334D75" },
    TIER1: { label: "Starter", color: "#1A6BDD" },
    TIER2: { label: "Professional", color: "#5B4FE8" },
    TIER3: { label: "Enterprise", color: "#C9A84C" },
    ADMIN: { label: "Admin", color: "#C97E0A" },
  };
  const info = map[tier] ?? map["FREE"];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "'IBM Plex Sans', sans-serif",
        letterSpacing: "0.5px",
        background: `${info.color}22`,
        color: info.color,
        border: `1px solid ${info.color}55`,
      }}
    >
      {info.label}
    </span>
  );
}

function TierCard({
  tier,
  currentTier,
  locale,
}: {
  tier: (typeof SUBSCRIPTION_TIERS)[number];
  currentTier: string;
  locale: string;
}) {
  const t = useTranslations("billing");
  const [hovered, setHovered] = useState(false);
  const isCurrent = currentTier === tier.id;
  const isPopular = "popular" in tier && tier.popular === true;
  const hasBadge = "badge" in tier;
  const isGold = tier.id === "TIER3";

  const glowColor = isGold
    ? "rgba(201, 168, 76, 0.25)"
    : isPopular
    ? "rgba(91, 79, 232, 0.25)"
    : "rgba(26, 107, 221, 0.15)";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: "var(--bg-card)",
        border: `1px solid ${
          isCurrent
            ? tier.color
            : isPopular
            ? "#5B4FE855"
            : isGold
            ? "#C9A84C55"
            : "var(--border)"
        }`,
        borderRadius: "var(--radius-lg)",
        padding: "28px 22px 24px",
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 8px 32px ${glowColor}`
          : isCurrent
          ? `0 0 24px ${glowColor}`
          : isPopular
          ? `0 0 16px rgba(91, 79, 232, 0.15)`
          : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top badge */}
      {hasBadge && !isCurrent && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: isGold
              ? "linear-gradient(90deg, #C9A84C, #E8C96B)"
              : tier.color,
            color: isGold ? "#0B1524" : "white",
            fontSize: 10,
            fontWeight: 800,
            padding: "4px 12px",
            borderRadius: 20,
            fontFamily: "'IBM Plex Sans', sans-serif",
            whiteSpace: "nowrap",
            letterSpacing: "0.5px",
            boxShadow: isPopular
              ? "0 0 12px rgba(91,79,232,0.6)"
              : isGold
              ? "0 0 12px rgba(201,168,76,0.5)"
              : "none",
          }}
        >
          {"badge" in tier ? tier.badge : ""}
        </div>
      )}
      {isCurrent && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--success)",
            color: "white",
            fontSize: 10,
            fontWeight: 800,
            padding: "4px 12px",
            borderRadius: 20,
            fontFamily: "'IBM Plex Sans', sans-serif",
            whiteSpace: "nowrap",
            letterSpacing: "0.5px",
          }}
        >
          {t("activePlan")}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>{tier.emoji}</div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 18,
            color: tier.color,
            marginBottom: 4,
          }}
        >
          {tier.name}
        </div>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 34,
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {formatPrice(tier.price, locale)}
          <span
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: "var(--text-secondary)",
              marginLeft: 4,
            }}
          >
            {t("perMonth")}
          </span>
        </div>
        <div
          suppressHydrationWarning
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: tier.color,
            marginTop: 6,
            opacity: 0.9,
          }}
        >
          {tier.credits.toLocaleString()} {t("creditsPerMonth")}
        </div>
        {locale !== "pl" && (
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>
            {t("approxPrices")}
          </div>
        )}
      </div>

      {/* Features yes */}
      <div style={{ flex: 1, marginBottom: 16 }}>
        {tier.features_yes.map((f) => (
          <div
            key={f}
            style={{
              fontSize: 12.5,
              color: "var(--text-secondary)",
              padding: "4px 0",
              lineHeight: 1.5,
            }}
          >
            {f}
          </div>
        ))}
        {tier.features_no.map((f) => (
          <div
            key={f}
            style={{
              fontSize: 12.5,
              color: "var(--text-muted)",
              padding: "4px 0",
              lineHeight: 1.5,
              textDecoration: "line-through",
              opacity: 0.5,
            }}
          >
            {f}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => alert(t("paymentsComingSoon"))}
        style={{
          width: "100%",
          padding: "11px 0",
          background: isCurrent ? `${tier.color}18` : tier.color,
          border: `1px solid ${tier.color}`,
          borderRadius: "var(--radius-md)",
          color: isCurrent ? tier.color : isGold ? "#0B1524" : "white",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "'IBM Plex Sans', sans-serif",
          letterSpacing: "0.3px",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
      >
        {isCurrent ? t("currentPlanBtn") : t("choosePlan", { name: tier.name })}
      </button>
    </div>
  );
}

function PackCard({
  pack,
  locale,
}: {
  pack: (typeof CREDIT_PACKS)[number];
  locale: string;
}) {
  const t = useTranslations("billing");
  const [hovered, setHovered] = useState(false);
  const isBest = "best" in pack && pack.best === true;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: "var(--bg-card)",
        border: `1px solid ${isBest ? "#C9A84C" : hovered ? pack.color + "55" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)",
        padding: "24px 20px",
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isBest
          ? hovered
            ? "0 8px 36px rgba(201,168,76,0.35)"
            : "0 0 20px rgba(201,168,76,0.2)"
          : hovered
          ? `0 6px 24px ${pack.color}22`
          : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Best badge */}
      {isBest && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(90deg, #C9A84C, #E8C96B)",
            color: "#0B1524",
            fontSize: 10,
            fontWeight: 800,
            padding: "4px 12px",
            borderRadius: 20,
            fontFamily: "'IBM Plex Sans', sans-serif",
            whiteSpace: "nowrap",
            letterSpacing: "0.5px",
            boxShadow: "0 0 14px rgba(201,168,76,0.55)",
          }}
        >
          {"badge" in pack ? pack.badge : ""}
        </div>
      )}

      {/* Pack header */}
      <div style={{ fontSize: 26, marginBottom: 8 }}>{pack.emoji}</div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 16,
          color: "var(--text-primary)",
          marginBottom: 2,
        }}
      >
        {pack.name}
      </div>
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: 28,
          color: isBest ? "#C9A84C" : pack.color,
          marginBottom: 4,
          lineHeight: 1.1,
        }}
      >
        {formatPrice(pack.price, locale)}
      </div>
      <div
        suppressHydrationWarning
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: isBest ? "#C9A84C" : pack.color,
          marginBottom: isBest ? 8 : 16,
          opacity: 0.9,
        }}
      >
        +{pack.credits.toLocaleString()} {t("credits")}
      </div>

      {/* Best pack extras */}
      {isBest && "savings" in pack && (
        <div
          style={{
            fontSize: 11,
            color: "#C9A84C",
            marginBottom: 4,
            fontWeight: 600,
          }}
        >
          {pack.savings}
        </div>
      )}
      {isBest && "note" in pack && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-secondary)",
            marginBottom: 12,
          }}
        >
          {pack.note}
        </div>
      )}

      <div style={{ flex: 1 }} />

      <button
        onClick={() => alert(t("paymentsComingSoon"))}
        style={{
          width: "100%",
          padding: "10px 0",
          background: isBest
            ? "linear-gradient(90deg, #C9A84C, #E8C96B)"
            : `${pack.color}22`,
          border: `1px solid ${isBest ? "#C9A84C" : pack.color}`,
          borderRadius: "var(--radius-md)",
          color: isBest ? "#0B1524" : pack.color,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "'IBM Plex Sans', sans-serif",
          marginTop: "auto",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
      >
        {t("buyNow")}
      </button>
    </div>
  );
}

export function BillingClient({ user, locale, transactions }: Props) {
  const t = useTranslations("billing");
  const currencyConfig = getCurrencyConfig(locale);
  const firstRowPacks = CREDIT_PACKS.slice(0, 3);
  const secondRowPacks = CREDIT_PACKS.slice(3);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: 1100, margin: "0 auto" }}
    >
      {/* Page header */}
      <motion.div variants={itemVariants} style={{ marginBottom: 40 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 30,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            {t("plansTitle")}
          </h1>
          <TierBadge tier={user.tier} />
        </div>

        {/* Balance display */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 22 }}>💎</span>
          <span
            suppressHydrationWarning
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              fontSize: 42,
              color: "var(--accent-bright)",
              textShadow: "0 0 24px var(--accent-glow)",
              lineHeight: 1,
            }}
          >
            {user.credits.toLocaleString()}
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 16,
              color: "var(--text-secondary)",
              fontWeight: 400,
            }}
          >
            {t("creditsAvailable")}
          </span>
          {locale !== "pl" && (
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: "var(--text-muted)",
                marginLeft: 12,
                padding: "2px 8px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: 6,
              }}
            >
              {currencyConfig.currency}
            </span>
          )}
        </div>
      </motion.div>

      {/* Subscription tiers */}
      <motion.section variants={itemVariants} style={{ marginBottom: 44 }}>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--text-primary)",
            marginBottom: 20,
            marginTop: 0,
          }}
        >
          {t("subscriptionsTitle")}
        </h2>
        <motion.div
          variants={containerVariants}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {SUBSCRIPTION_TIERS.map((tier) => (
            <motion.div key={tier.id} variants={itemVariants}>
              <TierCard tier={tier} currentTier={user.tier} locale={locale} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Anchoring text */}
      <motion.div
        variants={itemVariants}
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid #C9A84C33",
          borderRadius: "var(--radius-lg)",
          padding: "16px 22px",
          marginBottom: 44,
          color: "#C9A84C",
          fontSize: 14,
          fontStyle: "italic",
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontWeight: 500,
          lineHeight: 1.5,
        }}
      >
        {t("enterpriseTip")}
      </motion.div>

      {/* Credit packs */}
      <motion.section variants={itemVariants} style={{ marginBottom: 44 }}>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--text-primary)",
            marginBottom: 20,
            marginTop: 0,
          }}
        >
          {t("creditPacksTitle")}
        </h2>

        {/* Row 1: 3 packs */}
        <motion.div
          variants={containerVariants}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            marginBottom: 20,
          }}
        >
          {firstRowPacks.map((pack) => (
            <motion.div key={pack.id} variants={itemVariants}>
              <PackCard pack={pack} locale={locale} />
            </motion.div>
          ))}
        </motion.div>

        {/* Row 2: 2 packs centered */}
        <motion.div
          variants={containerVariants}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          <div />
          {secondRowPacks.map((pack) => (
            <motion.div key={pack.id} variants={itemVariants}>
              <PackCard pack={pack} locale={locale} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Transaction history */}
      <motion.section variants={itemVariants}>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "var(--text-primary)",
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          {t("historyTitle")}
        </h2>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "160px 1fr 1fr 110px 90px",
              padding: "12px 20px",
              background: "var(--bg-elevated)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {([t("colDate"), t("colType"), t("colDescription"), t("colCredits"), t("colStatus")] as string[]).map((col) => (
              <div
                key={col}
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                }}
              >
                {col}
              </div>
            ))}
          </div>

          {transactions.length === 0 ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 14,
              }}
            >
              {t("noTransactionsMsg")}
            </div>
          ) : (
            transactions.map((tx, i) => {
              const isCredit = tx.creditsUsed < 0;
              return (
                <div
                  key={tx.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 1fr 1fr 110px 90px",
                    padding: "14px 20px",
                    borderBottom:
                      i < transactions.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                    alignItems: "center",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "var(--bg-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      "transparent";
                  }}
                >
                  {/* Date */}
                  <div
                    suppressHydrationWarning
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {new Date(tx.createdAt).toLocaleDateString(undefined, {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                    <div suppressHydrationWarning style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                      {new Date(tx.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  {/* Type */}
                  <div
                    style={{
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    {tx.type === "CREDITS_PURCHASE"
                      ? t("creditsPurchase")
                      : tx.type === "SUBSCRIPTION_RENEWAL"
                      ? t("subscriptionRenewal")
                      : tx.type}
                  </div>

                  {/* Description */}
                  <div
                    style={{
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: 13,
                      color: "var(--text-primary)",
                    }}
                  >
                    {tx.description}
                  </div>

                  {/* Credits */}
                  <div
                    suppressHydrationWarning
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14,
                      fontWeight: 600,
                      color: isCredit ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    {isCredit ? "+" : ""}
                    {Math.abs(tx.creditsUsed).toLocaleString()} kr.
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        background: "rgba(13, 158, 104, 0.12)",
                        color: "var(--success)",
                        border: "1px solid rgba(13, 158, 104, 0.25)",
                      }}
                    >
                      OK
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
