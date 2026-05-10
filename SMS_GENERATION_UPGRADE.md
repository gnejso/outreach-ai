# ✅ SMS Generation - Upgrade Completed

## Co zostało zmienione

### 1. System Prompt - Bardziej profesjonalny
**Było:**
```
You are an expert SMS marketer.
Write short, personalized, human SMS messages.
```

**Jest:**
```
You are an expert B2B sales SMS writer with 10 years of experience in direct outreach.
You write multi-sentence SMS messages that are professional, specific, and conversion-focused.
```

### 2. User Prompt - Szczegółowa struktura krok po kroku

**KROK 1 - OPENING (1 zdanie):**
- Jeśli firma ma 20+ opinii → pogratuluj ich osiągnięcia
- Jeśli ma mniej → wspomnij że znalazłeś ich online
- Jeśli 0 opinii → profesjonalne przedstawienie

**KROK 2 - PROBLEM (1-2 zdania):**
- Brak strony www → klienci szukają online i nie mogą ich znaleźć
- Ma stronę → konkretny problem bazując na PURPOSE (SEO, social media, etc)
- KONKRETNY problem dla ICH branży

**KROK 3 - ROZWIĄZANIE (1 zdanie):**
- Dokładnie jak PURPOSE rozwiązuje ICH problem
- Nie ogólniki - konkretne korzyści
- Dopasowane do branży

**KROK 4 - CALL TO ACTION (1 zdanie):**
- Pytanie zachęcające do odpowiedzi
- "Zainteresowani szczegółami?"
- "Mogę wysłać przykłady?"
- "Warto poświęcić 10 minut na rozmowę?"

### 3. Parametry AI - Dłuższe i bardziej przemyślane SMS

**maxTokens: 100 → 350**
- Pozwala na 3-5 zdań zamiast 1 zdania
- SMS ma 300-500 znaków (zamiast max 160)

**temperature: 0.7 → 0.9**
- Więcej kreatywności
- Każdy SMS bardziej unikalny
- AI głębiej myśli o kontekście

### 4. Przykłady w prompcie

Dodane 2 pełne przykłady dobrego SMS:

**Przykład 1 (brak strony):**
```
"[Firma] - widzę że macie 45 opinii na Google, świetna robota! Problem jest taki, 
że większość Waszych potencjalnych klientów szuka online, a Wy nie macie strony www. 
Tracicie dziesiątki zapytań miesięcznie na rzecz konkurencji. Specjalizuję się 
w prostych stronach dla firm z branży [branża]. Mogę wysłać przykłady?"
```

**Przykład 2 (ma stronę, problem SEO):**
```
"Dzień dobry [Firma]. Pomagam firmom z branży [branża] zwiększać ilość zapytań 
przez Google. Obecnie konkurencja wyświetla się powyżej Was w wynikach wyszukiwania 
i zabiera klientów. Mam sprawdzony system, który stawia firmy na pierwszej stronie Google. 
Zainteresowani szczegółami?"
```

## Jak to działa teraz

1. **Haiku dostaje WSZYSTKIE dane:**
   - Nazwa firmy
   - Branża
   - Liczba opinii i rating
   - Czy ma stronę www
   - Miasto
   - PURPOSE (co sprzedajesz)

2. **Haiku MYŚLI krok po kroku:**
   - Analizuje ile mają opinii
   - Sprawdza czy mają stronę
   - Czyta PURPOSE i rozumie CO sprzedajesz
   - Dostosowuje każde zdanie do ICH sytuacji

3. **Haiku pisze 3-5 zdań:**
   - Zdanie 1: Pogratulowanie/przedstawienie
   - Zdania 2-3: Konkretny problem który mają
   - Zdanie 4: Jak TY to rozwiązujesz
   - Zdanie 5: Pytanie zachęcające do odpowiedzi

4. **Każdy SMS jest inny:**
   - Temperature 0.9 = więcej kreatywności
   - System zapamiętuje ostatnie 10 początków SMS
   - Nigdy nie zacznie 2 SMS tak samo

## Model AI

**AWS Bedrock Haiku 4.5:**
- Model: `us.anthropic.claude-haiku-4-5-20251001-v1:0`
- Region: us-east-1
- Ten sam model co w Shadow Boxing (sprawdzony, działa)
- Credentials: z `.env.local`

## Format SMS

**Długość:** 300-500 znaków (3-5 zdań)
**Ton:** Profesjonalny ale konwersacyjny
**Język:** Polski (lub wybrany język)
**Struktura:** Opening → Problem → Solution → CTA

## Testowanie

Otwórz: **http://localhost:3000/pl/sms**

1. Wgraj plik Excel z firmami
2. Zmapuj kolumny
3. Wpisz PURPOSE: np. "Oferuję tworzenie stron internetowych dla małych firm"
4. Kliknij "Generuj"
5. Nawiguj strzałkami → każdy SMS generuje się za pomocą AWS Bedrock
6. Każdy SMS jest 3-5 zdań, przemyślany, dostosowany do firmy
