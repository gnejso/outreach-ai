# ✅ Deploy Checklist — OutreachAI

Przed deployem upewnij się że:

## 📁 Pliki gotowe:
- [x] `prisma/schema.prisma` - provider = "postgresql"
- [x] `src/lib/prisma.ts` - standardowy PrismaClient (bez SQLite)
- [x] `next.config.ts` - bez serverExternalPackages
- [x] `vercel.json` - buildCommand z prisma generate
- [x] `package.json` - postinstall ma prisma generate
- [x] `.env.vercel.example` - lista wszystkich zmiennych
- [x] `.gitignore` - nie commituje .env* ani dev.db

## 🗄️ Baza danych (Neon):
- [ ] Konto założone na neon.tech
- [ ] Projekt utworzony
- [ ] Connection string skopiowany
- [ ] Region wybrany (Europe/US)

## 📦 GitHub:
- [ ] Repo utworzone na github.com
- [ ] Kod wypchany (`git push`)
- [ ] Wszystkie zmiany commitowane

## ⚙️ Vercel:
- [ ] Konto założone/zalogowane
- [ ] Projekt podłączony do GitHub repo
- [ ] Zmienne środowiskowe ustawione (DATABASE_URL, AUTH_SECRET, AWS credentials)
- [ ] Environment = Production + Preview + Development
- [ ] AUTH_SECRET wygenerowany (`openssl rand -base64 32`)
- [ ] NEXTAUTH_URL ustawiony na Vercel domain

## 🚀 Deploy:
- [ ] Deploy kliknięty
- [ ] Build zakończony sukcesem
- [ ] Strona otwiera się (https://xxx.vercel.app)

## 🛠️ Migracje:
- [ ] `prisma migrate deploy` uruchomione
- [ ] Baza ma wszystkie tabele
- [ ] Opcjonalnie: `prisma db seed` uruchomione

## 🧪 Testowanie:
- [ ] Strona logowania działa
- [ ] Można się zalogować (email lub Google)
- [ ] Dashboard się otwiera
- [ ] AI generowanie działa (Cold Call, SMS)
- [ ] Nie ma błędów w Vercel Runtime Logs

## 🎯 Po deployu:
- [ ] Custom domena dodana (opcjonalnie)
- [ ] DNS skonfigurowany
- [ ] SSL certyfikat aktywny (automatycznie)
- [ ] Google OAuth redirect URI zaktualizowany (jeśli używasz)
- [ ] Email SMTP przetestowany (jeśli używasz)

---

**Wszystko gotowe? Let's go! 🚀**

Następne kroki:
1. Otwórz `DEPLOY_INSTRUKCJA.md` i wykonuj krok po kroku
2. W razie problemów sprawdź sekcję Troubleshooting
3. Po deployu przetestuj wszystkie funkcje

**Powodzenia!**
