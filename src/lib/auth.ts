import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import nodemailer from "nodemailer";

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
      from: process.env.EMAIL_FROM ?? "outreachai11@gmail.com",
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const { host } = new URL(url);
        const transport = nodemailer.createTransport(provider.server as any);

        // Extract locale from URL (e.g., /pl/login, /en/login)
        const localeMatch = url.match(/\/(pl|en|de|es|fr|it|pt|nl|cs|uk)\//);
        const locale = localeMatch ? localeMatch[1] : "en";

        // Multilingual content
        const content: Record<string, any> = {
          pl: {
            subject: "Twój link do logowania — OutreachAI",
            greeting: "Cześć!",
            title: "Dokończ logowanie do OutreachAI",
            description: "Dziękujemy, że jesteś z nami. Kliknij przycisk poniżej, aby bezpiecznie zalogować się do swojego konta:",
            button: "Zaloguj się teraz",
            validity: "Link jest ważny przez <strong style='color: #c8d0e0;'>24 godziny</strong>.",
            alternative: "Jeśli przycisk nie działa, użyj poniższego linku:",
            warning: "Uwaga bezpieczeństwa",
            warningText: "Jeśli nie prosiłeś o ten email, zignoruj go. Nigdy nie udostępniaj tego linku innym osobom.",
            footer: "Ten email został wysłany automatycznie z",
          },
          en: {
            subject: "✨ Your login link — OutreachAI",
            greeting: "Hello!",
            title: "Complete your OutreachAI login",
            description: "Thank you for being with us. Click the button below to securely log in to your account:",
            button: "🔐 Log in now",
            validity: "Link is valid for <strong style='color: #c8d0e0;'>24 hours</strong>.",
            alternative: "If the button doesn't work, use the link below:",
            warning: "⚠️ Security notice",
            warningText: "If you didn't request this email, please ignore it. Never share this link with others.",
            footer: "This email was sent automatically from",
          },
          de: {
            subject: "✨ Ihr Login-Link — OutreachAI",
            greeting: "Hallo!",
            title: "Schließen Sie Ihr OutreachAI-Login ab",
            description: "Vielen Dank, dass Sie bei uns sind. Klicken Sie auf die Schaltfläche unten, um sich sicher bei Ihrem Konto anzumelden:",
            button: "🔐 Jetzt anmelden",
            validity: "Der Link ist <strong style='color: #c8d0e0;'>24 Stunden</strong> gültig.",
            alternative: "Wenn die Schaltfläche nicht funktioniert, verwenden Sie den folgenden Link:",
            warning: "⚠️ Sicherheitshinweis",
            warningText: "Wenn Sie diese E-Mail nicht angefordert haben, ignorieren Sie sie bitte. Geben Sie diesen Link niemals an andere weiter.",
            footer: "Diese E-Mail wurde automatisch gesendet von",
          },
          es: {
            subject: "✨ Tu enlace de inicio de sesión — OutreachAI",
            greeting: "¡Hola!",
            title: "Completa tu inicio de sesión en OutreachAI",
            description: "Gracias por estar con nosotros. Haz clic en el botón de abajo para iniciar sesión de forma segura en tu cuenta:",
            button: "🔐 Iniciar sesión ahora",
            validity: "El enlace es válido durante <strong style='color: #c8d0e0;'>24 horas</strong>.",
            alternative: "Si el botón no funciona, usa el siguiente enlace:",
            warning: "⚠️ Aviso de seguridad",
            warningText: "Si no solicitaste este correo, ignóralo. Nunca compartas este enlace con otros.",
            footer: "Este correo fue enviado automáticamente desde",
          },
          fr: {
            subject: "✨ Votre lien de connexion — OutreachAI",
            greeting: "Bonjour !",
            title: "Terminez votre connexion à OutreachAI",
            description: "Merci d'être avec nous. Cliquez sur le bouton ci-dessous pour vous connecter en toute sécurité à votre compte :",
            button: "🔐 Se connecter maintenant",
            validity: "Le lien est valable pendant <strong style='color: #c8d0e0;'>24 heures</strong>.",
            alternative: "Si le bouton ne fonctionne pas, utilisez le lien ci-dessous :",
            warning: "⚠️ Avis de sécurité",
            warningText: "Si vous n'avez pas demandé cet e-mail, veuillez l'ignorer. Ne partagez jamais ce lien avec d'autres personnes.",
            footer: "Cet e-mail a été envoyé automatiquement depuis",
          },
          it: {
            subject: "✨ Il tuo link di accesso — OutreachAI",
            greeting: "Ciao!",
            title: "Completa il tuo accesso a OutreachAI",
            description: "Grazie per essere con noi. Clicca sul pulsante qui sotto per accedere in modo sicuro al tuo account:",
            button: "🔐 Accedi ora",
            validity: "Il link è valido per <strong style='color: #c8d0e0;'>24 ore</strong>.",
            alternative: "Se il pulsante non funziona, usa il link qui sotto:",
            warning: "⚠️ Avviso di sicurezza",
            warningText: "Se non hai richiesto questa email, ignorala. Non condividere mai questo link con altri.",
            footer: "Questa email è stata inviata automaticamente da",
          },
          pt: {
            subject: "✨ Seu link de login — OutreachAI",
            greeting: "Olá!",
            title: "Complete seu login no OutreachAI",
            description: "Obrigado por estar conosco. Clique no botão abaixo para fazer login com segurança em sua conta:",
            button: "🔐 Fazer login agora",
            validity: "O link é válido por <strong style='color: #c8d0e0;'>24 horas</strong>.",
            alternative: "Se o botão não funcionar, use o link abaixo:",
            warning: "⚠️ Aviso de segurança",
            warningText: "Se você não solicitou este e-mail, ignore-o. Nunca compartilhe este link com outras pessoas.",
            footer: "Este e-mail foi enviado automaticamente de",
          },
          nl: {
            subject: "✨ Jouw inloglink — OutreachAI",
            greeting: "Hallo!",
            title: "Voltooi je OutreachAI-login",
            description: "Bedankt dat je bij ons bent. Klik op de knop hieronder om veilig in te loggen op je account:",
            button: "🔐 Nu inloggen",
            validity: "De link is <strong style='color: #c8d0e0;'>24 uur</strong> geldig.",
            alternative: "Als de knop niet werkt, gebruik dan de onderstaande link:",
            warning: "⚠️ Beveiligingswaarschuwing",
            warningText: "Als je deze e-mail niet hebt aangevraagd, negeer deze dan. Deel deze link nooit met anderen.",
            footer: "Deze e-mail is automatisch verzonden vanaf",
          },
          cs: {
            subject: "✨ Váš přihlašovací odkaz — OutreachAI",
            greeting: "Ahoj!",
            title: "Dokončete přihlášení do OutreachAI",
            description: "Děkujeme, že jste s námi. Klikněte na tlačítko níže pro bezpečné přihlášení k vašemu účtu:",
            button: "🔐 Přihlásit se nyní",
            validity: "Odkaz je platný po dobu <strong style='color: #c8d0e0;'>24 hodin</strong>.",
            alternative: "Pokud tlačítko nefunguje, použijte níže uvedený odkaz:",
            warning: "⚠️ Bezpečnostní upozornění",
            warningText: "Pokud jste tento e-mail nepožadovali, ignorujte jej. Nikdy tento odkaz nesdílejte s ostatními.",
            footer: "Tento e-mail byl automaticky odeslán z",
          },
          uk: {
            subject: "✨ Ваше посилання для входу — OutreachAI",
            greeting: "Привіт!",
            title: "Завершіть вхід до OutreachAI",
            description: "Дякуємо, що ви з нами. Натисніть кнопку нижче, щоб безпечно увійти до свого облікового запису:",
            button: "🔐 Увійти зараз",
            validity: "Посилання дійсне протягом <strong style='color: #c8d0e0;'>24 годин</strong>.",
            alternative: "Якщо кнопка не працює, скористайтеся посиланням нижче:",
            warning: "⚠️ Попередження безпеки",
            warningText: "Якщо ви не запитували цей лист, проігноруйте його. Ніколи не діліться цим посиланням з іншими.",
            footer: "Цей лист було автоматично надіслано з",
          },
        };

        const t = content[locale] || content.en;

        const result = await transport.sendMail({
          to: email,
          from: `OutreachAI <${provider.from}>`,
          replyTo: provider.from,
          subject: t.subject,
          headers: {
            'X-Mailer': 'OutreachAI',
            'X-Priority': '1',
            'Importance': 'high',
            'X-MSMail-Priority': 'High',
            'List-Unsubscribe': `<mailto:${provider.from}?subject=unsubscribe>`,
          },
          text: `${t.greeting}\n\n${t.title}\n\n${t.description}\n\n${url}\n\n${t.validity}\n\n${t.warningText}\n\nPozdrawiamy,\nZespół OutreachAI`,
          html: `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <style>
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 20px rgba(42,127,255,0.6); } 50% { box-shadow: 0 0 30px rgba(42,127,255,0.9), 0 0 60px rgba(42,127,255,0.4); } }
    @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  </style>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0a0a0f 0%, #131318 50%, #0a0a0f 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0; min-height: 100vh;">
    <tr>
      <td style="padding: 60px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #131318 0%, #1a1a22 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1) inset; animation: fadeIn 0.6s ease-out;">

          <!-- Animated Header -->
          <tr>
            <td style="padding: 48px 40px 40px; text-align: center; border-bottom: 1px solid #2a2a35; background: linear-gradient(180deg, #1a1a22 0%, #131318 100%);">
              <div style="display: inline-block; position: relative; margin-bottom: 20px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #2A7FFF 0%, #1A5FDD 100%); width: 16px; height: 16px; border-radius: 50%; animation: pulse 2s ease-in-out infinite;"></div>
                <div style="position: absolute; top: -4px; left: -4px; width: 24px; height: 24px; border: 2px solid rgba(42,127,255,0.3); border-radius: 50%;"></div>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; background: linear-gradient(135deg, #ffffff 0%, #a8b8d8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">OutreachAI</h1>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 13px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">Cold Call & SMS Platform</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 48px 40px;">
              <p style="margin: 0 0 8px; color: #8892a8; font-size: 15px; font-weight: 500;">${t.greeting}</p>
              <h2 style="margin: 0 0 20px; color: #e8f0ff; font-size: 24px; font-weight: 700; line-height: 1.3;">
                ${t.title}
              </h2>
              <p style="margin: 0 0 32px; color: #a0a8b8; font-size: 16px; line-height: 1.6;">
                ${t.description}
              </p>

              <!-- Animated CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 36px;">
                <tr>
                  <td style="text-align: center;">
                    <div style="display: inline-block; border-radius: 10px; background: linear-gradient(135deg, #2A7FFF 0%, #1A5FDD 100%); background-size: 200% 200%; padding: 2px; box-shadow: 0 8px 24px rgba(42,127,255,0.35), 0 0 60px rgba(42,127,255,0.15);">
                      <a href="${url}" target="_blank" style="display: block; padding: 18px 56px; background: linear-gradient(135deg, #2A7FFF 0%, #1A5FDD 100%); color: #ffffff; text-decoration: none; font-size: 17px; font-weight: 700; border-radius: 8px; transition: all 0.3s ease;">
                        ${t.button}
                      </a>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="padding: 20px; background: #0f0f14; border: 1px solid #2a2a35; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; color: #6b7280; font-size: 13px; line-height: 1.5;">
                  ⏱️ ${t.validity}
                </p>
              </div>

              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                ${t.alternative}
              </p>
              <div style="padding: 16px; background-color: #0a0a0f; border: 1px solid #2a2a35; border-radius: 8px; word-wrap: break-word;">
                <a href="${url}" style="color: #5a8cff; font-size: 13px; font-family: 'Courier New', monospace; text-decoration: none; word-break: break-all;">${url}</a>
              </div>
            </td>
          </tr>

          <!-- Security Warning Box -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="padding: 20px; background: linear-gradient(135deg, #2a1f0a 0%, #1f1709 100%); border-left: 4px solid #c97e0a; border-radius: 8px;">
                <p style="margin: 0 0 8px; color: #ffa940; font-size: 14px; font-weight: 700;">
                  ${t.warning}
                </p>
                <p style="margin: 0; color: #b89968; font-size: 13px; line-height: 1.6;">
                  ${t.warningText}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: linear-gradient(180deg, #0f0f14 0%, #0a0a0f 100%); border-top: 1px solid #2a2a35;">
              <p style="margin: 0; color: #505868; font-size: 12px; line-height: 1.6; text-align: center;">
                © ${new Date().getFullYear()} <strong style="color: #6b7280;">OutreachAI</strong>. All rights reserved.<br>
                <span style="color: #3a4252;">${t.footer} ${host}</span>
              </p>
            </td>
          </tr>
        </table>

        <!-- Decorative Elements -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 24px auto 0;">
          <tr>
            <td style="text-align: center;">
              <div style="display: inline-block; width: 40px; height: 2px; background: linear-gradient(90deg, transparent 0%, #2A7FFF 50%, transparent 100%);"></div>
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
    async redirect({ url, baseUrl }) {
      // After successful login, redirect to dashboard
      if (url.startsWith("/")) return `${baseUrl}/pl/dashboard`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/pl/dashboard`;
    },
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
