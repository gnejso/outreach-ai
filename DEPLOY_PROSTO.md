# 🚀 Deploy OutreachAI - PROSTA INSTRUKCJA

## KROK 1 - Baza danych (5 minut)

1. Wejdź na **https://neon.tech**
2. Kliknij **"Sign up"** (zaloguj przez GitHub)
3. Kliknij **"Create a project"**
4. Nazwij: `outreachai`
5. **SKOPIUJ** tekst który zaczyna się od `postgresql://...` 
6. **ZAPISZ GO** - będziesz potrzebować za chwilę

---

## KROK 2 - Wrzuć na GitHub (2 minuty)

```bash
# W folderze projektu
git add .
git commit -m "ready for deploy"
git push
```

**Jeśli nie masz jeszcze repo na GitHub:**
1. Wejdź na github.com
2. Kliknij "New repository"
3. Nazwij: `outreach-ai`
4. Kliknij "Create"
5. Skopiuj 3 komendy z ekranu i wklej w terminal

---

## KROK 3 - Vercel (10 minut)

### A) Połącz z GitHub:
1. Wejdź na **https://vercel.com**
2. Kliknij **"Continue with GitHub"**
3. Kliknij **"Add New Project"**
4. Wybierz repo **outreach-ai**
5. **NIE KLIKAJ JESZCZE DEPLOY!**

### B) Dodaj zmienne (Environment Variables):

Kliknij **"Environment Variables"** i dodaj te 6 rzeczy:

```
DATABASE_URL
Wklej ten tekst z Neon (krok 1) który zaczyna się od postgresql://...

AUTH_SECRET
Otwórz terminal i wpisz: openssl rand -base64 32
Skopiuj wynik i wklej tutaj

NEXTAUTH_URL
Wpisz: https://twoja-nazwa-projektu.vercel.app
(zmień "twoja-nazwa-projektu" na nazwę twojego projektu)

AWS_ACCESS_KEY_ID
Wpisz: [twój AWS Access Key ID]

AWS_SECRET_ACCESS_KEY
Wpisz: [twój AWS Secret Access Key]

ADMIN_EMAIL
Wpisz: janmikolajczak77@gmail.com
```

**Przy każdej zmiennej zaznacz:** Production + Preview + Development (wszystkie 3)

### C) Deploy:
1. Kliknij **"Deploy"**
2. Poczekaj 3 minuty
3. Dostaniesz link: `https://twoja-nazwa.vercel.app`

---

## KROK 4 - Uruchom bazę (2 minuty)

W terminalu na swoim komputerze:

```bash
# Ustaw połączenie do Neon (wklej swój connection string)
$env:DATABASE_URL = "postgresql://..." 

# Uruchom migracje
npx prisma migrate deploy
```

**Gotowe!** 🎉

---

## KROK 5 - Testuj

Otwórz link z Vercel (krok 3) w przeglądarce.

Powinieneś zobaczyć stronę logowania.

---

## ❌ Jeśli coś nie działa:

**"Database connection error"**
- Sprawdź czy w Vercel (Environment Variables) masz DATABASE_URL z Neon
- Connection string musi kończyć się na `?sslmode=require`

**"Auth error"**
- Sprawdź czy AUTH_SECRET jest ustawiony w Vercel
- Wygeneruj nowy: `openssl rand -base64 32`

**"AI nie działa"**
- Sprawdź czy AWS credentials są dokładnie takie jak powyżej

**Inne błędy:**
- Vercel → Project → Deployments → [latest] → Runtime Logs
- Zobacz co tam jest napisane

---

## 🎯 Po deployu - dodaj custom domenę (OPCJONALNIE)

1. Vercel → Settings → Domains
2. Wpisz swoją domenę (np. `outreachai.pl`)
3. Ustaw DNS u swojego providera zgodnie z tym co pokazuje Vercel
4. W Vercel Environment Variables zmień `NEXTAUTH_URL` na nową domenę

---

**To wszystko! Aplikacja działa! 🚀**

Wejdź na swój link Vercel i zaloguj się.
