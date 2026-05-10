# OutreachAI — Cold Call & SMS Automation Platform

Platforma automatyzacji cold call i SMS dla profesjonalistów B2B.

## Stos technologiczny

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4 + CSS Variables (dark premium theme)
- **Animacje:** Framer Motion
- **Auth:** NextAuth.js v5 (Google OAuth + Email magic link via Nodemailer)
- **Baza danych:** PostgreSQL (Neon.tech) + Prisma ORM v7
- **AI:** AWS Bedrock (Claude Haiku 4.5)
- **SMS:** Twilio
- **i18n:** next-intl v4 (10 języków)
- **Płatności:** Stripe (struktura przygotowana, podpinasz później)

## Szybki start

### 1. Zainstaluj zależności

```bash
cd outreach-ai
npm install
```

### 2. Skonfiguruj zmienne środowiskowe

```bash
cp .env.example .env.local
```

Uzupełnij `.env.local`:

| Zmienna | Opis |
|---------|------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Losowy string: `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | [console.cloud.google.com](https://console.cloud.google.com/) |
| `EMAIL_SERVER_HOST/PORT/USER/PASSWORD` | SMTP (np. Gmail App Password) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |
| `TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER` | [console.twilio.com](https://console.twilio.com/) |

### 3. Baza danych

```bash
# Generuj klienta Prisma
npx prisma generate

# Utwórz tabele
npx prisma migrate dev --name init

# Seed — utwórz konto admina
npm run db:seed
```

### 4. Uruchom

```bash
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000) — przekieruje do `/pl/login`.

## Konto admina

Email: `janmikolajczak77@gmail.com`

Przy pierwszym logowaniu tym emailem (lub po seedzie) konto automatycznie otrzymuje:
- `role: ADMIN` · `tier: ADMIN` · `credits: 999999`
- Pełny dostęp, brak pobierania kredytów

## Moduły

| Ścieżka | Opis |
|---------|------|
| `/dashboard` | Statystyki, szybkie akcje, ostatnia aktywność |
| `/cold-call` | Upload arkusza → generowanie skryptów cold call przez AI |
| `/sms` | Upload arkusza → generowanie i wysyłka SMS przez Twilio |
| `/history` | Historia wszystkich operacji z filtrami |
| `/profile` | Profil użytkownika, zmiana języka |
| `/billing` | Plany, paczki kredytów (Stripe — wkrótce) |

## System kredytów

| Akcja | Koszt |
|-------|-------|
| Cold Call Script | 4 kredyty / firma |
| Treść SMS (bez wysyłki) | 3 kredyty / firma |
| Wysyłka SMS przez Twilio | 10 kredytów / szt |

Nowi użytkownicy: **75 kredytów** + **11 darmowych** generowań skryptów.

## Języki

🇵🇱 PL · 🇬🇧 EN · 🇩🇪 DE · 🇫🇷 FR · 🇪🇸 ES · 🇮🇹 IT · 🇵🇹 PT · 🇳🇱 NL · 🇨🇿 CS · 🇺🇦 UA

---

## 🚀 Deploy na Vercel + Neon PostgreSQL

**Gotowy do produkcji?**

📄 **[DEPLOY_PROSTO.md](./DEPLOY_PROSTO.md)** ← **ZACZNIJ TUTAJ** (prosta instrukcja 5 kroków)

Dodatkowe:
- [DEPLOY_INSTRUKCJA.md](./DEPLOY_INSTRUKCJA.md) - Szczegółowa instrukcja z troubleshooting
- [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - Checklist przed deployem

### Szybko:

1. **neon.tech** → Create project → Skopiuj connection string
2. **GitHub** → `git push`
3. **vercel.com** → Podłącz repo → Dodaj zmienne env → Deploy
4. **Terminal** → `npx prisma migrate deploy`
5. **Gotowe!** 🎉
