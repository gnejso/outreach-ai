# 🚀 Instrukcja Deploy OutreachAI na Vercel + Neon PostgreSQL

## 📋 KROK 1 — Przygotuj bazę danych (Neon PostgreSQL)

1. **Idź na https://neon.tech**
2. Zaloguj się (przez GitHub/Google) - konto darmowe
3. Kliknij **"Create a project"**
4. Wybierz:
   - **Project name:** `outreach-ai-production`
   - **Region:** Europe (Frankfurt) lub US East (bliżej użytkowników)
   - **PostgreSQL version:** 16 (najnowszy)
5. Kliknij **"Create project"**
6. Na ekranie połączenia:
   - Skopiuj **Connection string** (zaznacz "Pooled connection")
   - Przykład: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`
   - **ZAPISZ TO** - będziesz potrzebować w Vercel

---

## 📋 KROK 2 — Wgraj projekt na GitHub

**Jeśli projekt NIE JEST jeszcze na GitHub:**

```bash
# W folderze projektu (C:\Users\antos\outreach-ai)
git init
git add .
git commit -m "Initial commit - OutreachAI ready for deployment"

# Stwórz repo na GitHub.com (New Repository)
# Nazwa: outreach-ai
# Private/Public: wybierz
# NIE dodawaj README/gitignore (już masz)

# Podłącz i wypchnij
git remote add origin https://github.com/TWOJA_NAZWA/outreach-ai.git
git branch -M main
git push -u origin main
```

**Jeśli projekt JUŻ JEST na GitHub:**

```bash
# Upewnij się że wszystkie zmiany są commitowane
git add .
git commit -m "Deploy preparation: Vercel + Neon PostgreSQL"
git push
```

---

## 📋 KROK 3 — Podłącz GitHub do Vercel

1. **Idź na https://vercel.com**
2. Zaloguj się przez GitHub
3. Kliknij **"Add New..." → Project**
4. Wybierz repozytorium **outreach-ai**
5. **Configure Project:**
   - **Framework Preset:** Next.js (automatycznie wykryte)
   - **Root Directory:** ./
   - **Build Command:** zostaw domyślne (vercel.json nadpisze)
   - **Output Directory:** zostaw domyślne

6. **NIE KLIKAJ JESZCZE "Deploy"** — najpierw ustaw zmienne środowiskowe!

---

## 📋 KROK 4 — Ustaw zmienne środowiskowe w Vercel

Kliknij **"Environment Variables"** i dodaj:

### ✅ WYMAGANE (bez nich nie zadziała):

```bash
# BAZA DANYCH
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
# ☝️ Wklej connection string z Neon (KROK 1)

# NEXTAUTH
AUTH_SECRET=WYGENERUJ_TO_W_TERMINALU_PONIŻEJ
NEXTAUTH_URL=https://twoja-nazwa-projektu.vercel.app
# ☝️ Zmień na swoją domenę Vercel (lub custom domain później)

# AWS BEDROCK (AI)
AWS_ACCESS_KEY_ID=[twój AWS Access Key ID]
AWS_SECRET_ACCESS_KEY=[twój AWS Secret Access Key]
AWS_REGION=us-east-1
AWS_BEDROCK_REGION=us-east-1

# ADMIN
ADMIN_EMAIL=janmikolajczak77@gmail.com
# ☝️ Twój email - automatycznie dostaniesz ADMIN role przy pierwszym logowaniu
```

**Wygeneruj AUTH_SECRET w terminalu:**
```bash
openssl rand -base64 32
```

### 🟡 OPCJONALNE (możesz dodać później):

**Google OAuth (jeśli chcesz logowanie przez Google):**
```bash
AUTH_GOOGLE_ID=twoj-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=twoj-secret
# Jak uzyskać: https://console.cloud.google.com → Credentials → Create OAuth Client
# Authorized redirect URI: https://twoja-domena.vercel.app/api/auth/callback/google
```

**Email SMTP (do magic linków):**
```bash
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=twoj-sendgrid-api-key
EMAIL_FROM=noreply@twoja-domena.com
# Możesz użyć: SendGrid (darmowe 100 emaili/dzień), Resend.com, AWS SES
```

**Google Places API (scraper firm):**
```bash
GOOGLE_PLACES_KEY=AIza...
# Jak uzyskać: https://console.cloud.google.com → Enable "Places API (New)" → Create API Key
```

**⚠️ WAŻNE:** Dla każdej zmiennej ustaw **Environment:** `Production, Preview, Development` (zaznacz wszystkie 3)

---

## 📋 KROK 5 — Deploy!

1. Kliknij **"Deploy"**
2. Poczekaj 2-3 minuty (first build trwa dłużej)
3. Gdy się skończy, dostaniesz link: `https://twoja-nazwa-projektu.vercel.app`

---

## 📋 KROK 6 — Uruchom migracje bazy danych

**OPCJA A: Przez Vercel CLI (REKOMENDOWANE)**

```bash
# Zainstaluj Vercel CLI
npm install -g vercel

# Zaloguj się
vercel login

# Linkuj lokalny projekt do Vercel
vercel link

# Uruchom migracje w produkcji
vercel env pull .env.production
npx prisma migrate deploy
```

**OPCJA B: Przez terminal z podłączeniem do Neon**

```bash
# Ustaw DATABASE_URL lokalnie (tylko na chwilę)
$env:DATABASE_URL = "postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# Uruchom migracje
npx prisma migrate deploy

# Opcjonalnie: seeduj bazę (dodaj admina + example data)
npx prisma db seed
```

**OPCJA C: Przez Neon SQL Editor (manualne)**

1. Idź na neon.tech → Twój projekt → **SQL Editor**
2. Skopiuj zawartość pliku `prisma/migrations/*/migration.sql`
3. Wklej i uruchom każdy migration

---

## ✅ KROK 7 — Testowanie

1. Otwórz swoją domenę: `https://twoja-nazwa-projektu.vercel.app`
2. Powinieneś zobaczyć stronę logowania
3. Zaloguj się przez email (magic link) lub Google OAuth (jeśli ustawione)
4. Sprawdź czy wszystko działa:
   - Dashboard
   - Cold Call generator
   - SMS generator
   - Shadow Boxing
   - Jaskinia Łowcy
   - Generator Ofert

---

## 🔧 Troubleshooting

### Problem: "Database connection error"
- Sprawdź czy `DATABASE_URL` w Vercel jest poprawny
- Sprawdź czy zawiera `?sslmode=require` na końcu
- Sprawdź czy baza Neon jest uruchomiona (neon.tech → project → Active)

### Problem: "Auth error" / "Callback error"
- Sprawdź czy `AUTH_SECRET` jest ustawiony
- Sprawdź czy `NEXTAUTH_URL` jest poprawny (https://twoja-domena.vercel.app)
- Dla Google OAuth: sprawdź redirect URI w Google Console

### Problem: "Prisma Client not found"
- Vercel automatycznie uruchamia `prisma generate` (jest w vercel.json)
- Jeśli dalej błąd: `vercel env pull` i lokalnie `npm run build` żeby sprawdzić

### Problem: "AI nie działa"
- Sprawdź czy AWS credentials są poprawne
- Sprawdź czy masz dostęp do Bedrock w regionie `us-east-1`
- Sprawdź logs w Vercel: Project → Deployments → [latest] → Runtime Logs

---

## 🎯 Po deployu

### Dodaj custom domenę (opcjonalnie):
1. Vercel → Project Settings → Domains
2. Dodaj swoją domenę (np. `outreachai.pl`)
3. Ustaw DNS zgodnie z instrukcjami
4. Zaktualizuj `NEXTAUTH_URL` na nową domenę

### Monitoring:
- Vercel Analytics: automatycznie włączone
- Error logs: Vercel → Runtime Logs
- Database metrics: Neon → Project → Monitoring

### Backup bazy:
```bash
# Eksportuj bazę Neon (przez pgdump)
pg_dump "postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require" > backup.sql
```

---

## 📞 Wsparcie

Jeśli coś nie działa:
1. Sprawdź Runtime Logs w Vercel
2. Sprawdź czy wszystkie zmienne env są ustawione
3. Sprawdź czy migracje się uruchomiły (`prisma migrate deploy`)
4. GitHub Issues: https://github.com/TWOJA_NAZWA/outreach-ai/issues

---

**Gotowe! Twoja aplikacja jest live! 🚀**
