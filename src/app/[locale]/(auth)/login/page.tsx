"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) ?? "pl";

  // In mock mode, skip login entirely and go straight to dashboard
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_MOCK_AUTH === "true") {
      router.replace(`/${locale}/dashboard`);
    }
  }, [locale, router]);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("nodemailer", { email, redirect: false });
    setEmailSent(true);
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    await signIn("google", { callbackUrl: `/${locale}/dashboard` });
  }

  return (
    <div suppressHydrationWarning className="page-bg min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div
              style={{
                width: 40,
                height: 40,
                background: "var(--accent)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px var(--accent-glow)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 24,
                color: "var(--text-primary)",
                letterSpacing: "-0.5px",
              }}
            >
              OutreachAI
            </span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            {t("subtitle")}
          </p>
        </div>

        {/* Card */}
        <div
          suppressHydrationWarning
          className="card p-8"
          style={{ position: "relative", zIndex: 1 }}
        >
          {emailSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: "var(--success-glow)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  border: "1px solid var(--success)",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="var(--success)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 20,
                  color: "var(--text-primary)",
                  marginBottom: 8,
                }}
              >
                {t("checkEmail")}
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                {t("magicLinkSent")}{" "}
                <span style={{ color: "var(--text-primary)" }}>{email}</span>
              </p>
            </motion.div>
          ) : (
            <>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 22,
                  color: "var(--text-primary)",
                  marginBottom: 24,
                  textAlign: "center",
                }}
              >
                {t("title")}
              </h1>

              {/* Google Button */}
              <button
                onClick={handleGoogleSignIn}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-bright)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontWeight: 500,
                  fontSize: 15,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "background 0.2s, border-color 0.2s",
                  marginBottom: 16,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-hover)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-bright)";
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t("loginWithGoogle")}
              </button>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{ flex: 1, height: 1, background: "var(--border)" }}
                />
                <span
                  style={{ color: "var(--text-muted)", fontSize: 13 }}
                >
                  {t("or")}
                </span>
                <div
                  style={{ flex: 1, height: 1, background: "var(--border)" }}
                />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSubmit}>
                <div suppressHydrationWarning style={{ marginBottom: 12 }}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      fontSize: 15,
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: 15,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? "..." : t("sendMagicLink")}
                </button>
              </form>

              {/* Terms */}
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 20,
                  lineHeight: 1.6,
                }}
              >
                {t("terms")}
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
