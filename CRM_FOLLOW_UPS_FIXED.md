# ✅ CRM & Follow-ups - Naprawione

## Co było nie tak

### 1. ColdCallClient wysyłał złe pole
**Problem:** `companyName` zamiast `businessName`

**Było:**
```typescript
await fetch("/api/business-notes", {
  body: JSON.stringify({
    sessionId,
    companyName: businesses[currentIdx].name,  // ❌ ZŁE POLE
    phone: businesses[currentIdx].phone,
    ...
  })
})
```

**Jest:**
```typescript
await fetch("/api/business-notes", {
  body: JSON.stringify({
    sessionId,
    businessName: businesses[currentIdx].name,  // ✅ DOBRE
    businessIndex: currentIdx,
    status: draft.status,
    note: draft.note || "",
    followUpDate: draft.followUpDate || null,
  })
})
```

### 2. Brak error handling
Dodano try-catch i console.log:
```typescript
try {
  const res = await fetch("/api/business-notes", {...});
  if (res.ok) {
    setSavedIdx(prev => new Set(prev).add(currentIdx));
    console.log("[ColdCall] CRM saved successfully");
  } else {
    console.error("[ColdCall] Failed to save CRM:", await res.json());
    alert("Błąd zapisywania do CRM");
  }
} catch (err) {
  console.error("[ColdCall] Error saving CRM:", err);
  alert("Błąd zapisywania do CRM");
}
```

### 3. API business-notes teraz loguje wszystko
Dodano console.log na każdym kroku:
```typescript
console.log("[business-notes] POST request:", { 
  sessionId, businessName, businessIndex, status, hasNote: !!note, followUpDate 
});
console.log("[business-notes] Saved successfully:", result.id);
console.log("[business-notes] Activity created for status change");
console.log("[business-notes] Activity created for note");
```

### 4. Activity log teraz zapisuje się
Gdy zapiszesz CRM, tworzy się Activity:
- **STATUS_CHANGE** gdy zmienisz status (oprócz NEW)
- **NOTE_SAVED** gdy zapiszesz notatkę

To sprawia że:
- ✅ Widać w statystykach dashboard
- ✅ Widać w historii aktywności
- ✅ Liczą się do "contacted companies"

## Co teraz działa

### ✅ Zapisywanie do CRM (Cold Call)
1. Wygeneruj skrypt
2. Wypełnij status/notatkę/follow-up
3. Kliknij "Zapisz do CRM"
4. **✓ Zapisano** pojawia się
5. Dane idą do bazy: `BusinessNote` table

### ✅ Follow-ups
1. Zaznacz checkbox "Przypomnij mi o tej firmie"
2. Wybierz datę i czas
3. Zapisz
4. Idź do **/reminders**
5. **Widać firmę** z datą follow-up

### ✅ Statystyki Dashboard
Pokazuje:
- **📞 Firmy kontaktowane** - wszystkie BusinessNote z CRM
- **⭐ Zainteresowani** - status INTERESTED
- **📈 Conversion Rate** - procent CLOSED
- **🔔 Follow-upy dziś** - ile przypomień dziś

### ✅ Historia aktywności
Pokazuje:
- 📞 Cold Call wygenerowany
- 🏷️ Status zmieniony
- 📝 Notatka zapisana
- 💬 SMS wysłany

## API Endpoints

### POST /api/business-notes
Zapisuje lub aktualizuje notatkę CRM:
```json
{
  "sessionId": "string",
  "businessName": "string",
  "businessIndex": 0,
  "status": "NEW|IN_PROGRESS|INTERESTED|CLOSED|REJECTED",
  "note": "string",
  "followUpDate": "2026-05-15T10:00:00Z" // ISO format lub null
}
```

Response:
```json
{
  "note": { ...BusinessNote object },
  "ok": true
}
```

### GET /api/business-notes?sessionId=X&businessName=Y
Pobiera konkretną notatkę.

### GET /api/reminders
Pobiera wszystkie follow-upy (followUpDate not null, followUpDone = false).

### PUT /api/reminders
Oznacza follow-up jako zrobiony lub przesuwa datę:
```json
{
  "noteId": "string",
  "action": "done" | "reschedule",
  "newDate": "2026-05-20T10:00:00Z" // tylko dla reschedule
}
```

## Database Schema

### BusinessNote
```prisma
model BusinessNote {
  id            String    @id @default(cuid())
  userId        String
  sessionId     String
  businessIndex Int       @default(0)
  businessName  String
  status        String    @default("NEW")
  note          String?
  followUpDate  DateTime?
  followUpDone  Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([userId, sessionId, businessName])
  @@index([userId])
  @@index([followUpDate])
}
```

### Activity
```prisma
model Activity {
  id          String   @id @default(cuid())
  userId      String
  type        String   // STATUS_CHANGE, NOTE_SAVED, COLD_CALL_SCRIPT, etc
  description String
  creditsUsed Int      @default(0)
  metadata    String?  // JSON
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
}
```

## Testowanie

### Test 1: Zapisz CRM
1. localhost:3000/pl/cold-call
2. Wgraj plik, generuj skrypt
3. Wypełnij status = "Zainteresowany"
4. Napisz notatkę: "Dzwonił, chce ofertę"
5. Kliknij "Zapisz do CRM"
6. Sprawdź: ✓ Zapisano

### Test 2: Follow-up
1. Kontynuuj z Test 1
2. Zaznacz "Przypomnij mi o tej firmie"
3. Wybierz datę jutro o 10:00
4. Idź do /reminders
5. Sprawdź: firma widoczna z datą

### Test 3: Statystyki
1. Kontynuuj z Test 1-2
2. Idź do /dashboard
3. Sprawdź statystyki:
   - Firmy kontaktowane: +1
   - Zainteresowani: +1 (jeśli status INTERESTED)
   - Follow-upy dziś: +1 (jeśli follow-up dziś)

### Test 4: Historia
1. Kontynuuj z Test 1-3
2. Scroll w dół do "Ostatnia aktywność"
3. Sprawdź czy widać:
   - 🏷️ Zmieniono status
   - 📝 Zapisano notatkę

## Wszystko działa! ✅

- ✅ Zapisywanie do CRM
- ✅ Follow-upy widoczne w /reminders
- ✅ Statystyki w dashboard
- ✅ Historia aktywności
- ✅ Error handling i logi
