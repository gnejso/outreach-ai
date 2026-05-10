import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "mock",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "mock",
    }),
    Nodemailer({
      server: {
        host: process.env.EMAIL_SERVER_HOST ?? "localhost",
        port: Number(process.env.EMAIL_SERVER_PORT ?? 1025),
        auth: {
          user: process.env.EMAIL_SERVER_USER ?? "",
          pass: process.env.EMAIL_SERVER_PASSWORD ?? "",
        },
      },
      from: process.env.EMAIL_FROM ?? "noreply@outreachai.app",
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const { host } = new URL(url);
        const transport = provider.server;

        if (!transport) {
          throw new Error("Email transport not configured");
        }

        const result = await transport.sendMail({
          to: email,
          from: {
            name: "OutreachAI",
            address: provider.from,
          },
          subject: "Twój link do logowania — OutreachAI",
          text: `Zaloguj się do OutreachAI\n\nKliknij poniższy link aby zalogować się do swojego konta:\n${url}\n\nLink wygasa za 24 godziny.\n\nJeśli nie prosiłeś o ten email, zignoruj go.\n\nPozdrawiamy,\nZespół OutreachAI`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #131318; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 32px; text-align: center; border-bottom: 1px solid #1f1f28;">
              <div style="display: inline-block; background: linear-gradient(135deg, #2A7FFF 0%, #1A5FDD 100%); width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 20px rgba(42,127,255,0.6); margin-bottom: 16px;"></div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 0 30px rgba(42,127,255,0.3);">OutreachAI</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #e8f0ff; font-size: 22px; font-weight: 700; line-height: 1.3;">
                Zaloguj się do swojego konta
              </h2>
              <p style="margin: 0 0 32px; color: #a0a8b8; font-size: 16px; line-height: 1.6;">
                Kliknij przycisk poniżej, aby bezpiecznie zalogować się do OutreachAI. Link jest ważny przez <strong style="color: #c8d0e0;">24 godziny</strong>.
              </p>

              <!-- Login Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 8px; background: linear-gradient(135deg, #2A7FFF 0%, #1A5FDD 100%); box-shadow: 0 4px 20px rgba(42,127,255,0.4);">
                    <a href="${url}" target="_blank" style="display: inline-block; padding: 16px 48px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 8px; transition: all 0.2s;">
                      🔐 Zaloguj się teraz
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Jeśli przycisk nie działa, skopiuj i wklej ten link w przeglądarce:
              </p>
              <p style="margin: 8px 0 0; padding: 12px; background-color: #1a1a22; border: 1px solid #2a2a35; border-radius: 6px; color: #8892a8; font-size: 13px; font-family: monospace; word-break: break-all;">
                ${url}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #0f0f14; border-top: 1px solid #1f1f28;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding-bottom: 16px;">
                    <p style="margin: 0; color: #c97e0a; font-size: 13px; line-height: 1.5;">
                      <strong>⚠️ Uwaga bezpieczeństwa:</strong>
                    </p>
                    <p style="margin: 4px 0 0; color: #8892a8; font-size: 13px; line-height: 1.5;">
                      Jeśli nie prosiłeś o ten email, zignoruj go. Nigdy nie udostępniaj tego linku innym osobom.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px; border-top: 1px solid #1f1f28;">
                    <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5; text-align: center;">
                      © ${new Date().getFullYear()} OutreachAI. Wszystkie prawa zastrzeżone.<br>
                      <span style="color: #505868;">Ten email został wysłany z ${host}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `,
        });

        if (result.rejected.length) {
          throw new Error(`Email send failed: ${result.rejected.join(", ")}`);
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, tier: true, credits: true, freeScripts: true },
        });
        if (dbUser) {
          const u = session.user as typeof session.user & {
            role: string; tier: string; credits: number; freeScripts: number;
          };
          u.role = dbUser.role;
          u.tier = dbUser.tier;
          u.credits = dbUser.credits;
          u.freeScripts = dbUser.freeScripts;
        }
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.email) return true;
      const adminEmail = process.env.ADMIN_EMAIL;
      if (user.email === adminEmail) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          select: { role: true },
        });
        if (existing && existing.role !== "ADMIN") {
          await prisma.user.update({
            where: { email: user.email },
            data: { role: "ADMIN", tier: "ADMIN", credits: 999999 },
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
    error: "/login",
  },
  session: { strategy: "database" },
});
