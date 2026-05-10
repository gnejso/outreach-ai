# Critical Fixes Implementation Status

## ✅ COMPLETED

### 1. Hydration Errors - bis_skin_checked ✓
- `src/app/layout.tsx` - suppressHydrationWarning already on html and body
- `src/app/[locale]/layout.tsx` - suppressHydrationWarning on wrapper div
- `src/app/[locale]/(dashboard)/layout.tsx` - suppressHydrationWarning on main containers
- `src/components/dashboard/DashboardClient.tsx` - suppressHydrationWarning on motion.div

### 2. AWS Bedrock Haiku 4.5 Configuration ✓
- `src/lib/bedrock.ts` uses correct model: `us.anthropic.claude-haiku-4-5-20251001-v1:0`
- Region: `us-east-1`
- Credentials configured in bedrock.ts
- All model parameters removed (only Haiku now)

### 3. Database Migration ✓
- Created `GeneratedScript` model in schema.prisma
- Migration `add_generated_scripts` applied successfully
- Schema:
  - sessionId + businessIndex (unique)
  - businessName, script, createdAt
  - Cascade delete on session removal

### 4. Single Script Generation API ✓
- **Created**: `src/app/api/generate/cold-call/single/route.ts`
  - Generates ONE script for ONE business
  - Checks database first (returns cached if exists)
  - Saves to GeneratedScript table
  - maxDuration: 30 seconds
  - Uses AWS Bedrock Haiku 4.5

- **Created**: `src/app/api/generate/sms/single/route.ts`
  - Same pattern for SMS
  - Checks cache, generates if missing
  - Saves to database

### 5. Updated Bulk Routes ✓
- **Updated**: `src/app/api/generate/cold-call/route.ts`
  - NOW: Deducts ALL credits immediately
  - Creates session with businesses JSON
  - Returns sessionId for lazy loading
  - Does NOT generate scripts (client will call /single)

- **Updated**: `src/app/api/generate/sms/route.ts`
  - Same pattern
  - Credits deducted upfront
  - Session created
  - Lazy generation via /single endpoint

## 🚧 REMAINING WORK (HIGH PRIORITY)

### 6. Update ColdCallClient Component
**File**: `src/components/cold-call/ColdCallClient.tsx`

**Changes needed**:
```typescript
// After bulk route returns sessionId:
const response = await fetch('/api/generate/cold-call', {
  method: 'POST',
  body: JSON.stringify({ rows, mapping, purpose, locale })
})
const { sessionId, count, creditsDeducted } = await response.json()

// Store session data
setSessionId(sessionId)
setBusinesses(companies) // from mapColumns
setStep('results')

// In results view:
const [scripts, setScripts] = useState<Record<number, string>>({})
const [generating, setGenerating] = useState<Set<number>>(new Set())
const [currentIndex, setCurrentIndex] = useState(0)

async function generateScript(index: number) {
  if (scripts[index] || generating.has(index) || index >= businesses.length) return
  
  setGenerating(prev => new Set(prev).add(index))
  
  try {
    const res = await fetch('/api/generate/cold-call/single', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        businessIndex: index,
        business: businesses[index],
        purpose,
        locale
      })
    })
    const { script, cached } = await res.json()
    setScripts(prev => ({ ...prev, [index]: script }))
  } finally {
    setGenerating(prev => {
      const next = new Set(prev)
      next.delete(index)
      return next
    })
  }
}

// Pre-fetch on navigation
useEffect(() => {
  generateScript(currentIndex)
  generateScript(currentIndex + 1)
}, [currentIndex])

// Initial load
useEffect(() => {
  if (sessionId) {
    generateScript(0)
    generateScript(1)
  }
}, [sessionId])
```

**UI Changes**:
- Replace slider with: ← POPRZEDNI | Firma X / Total | NASTĘPNY →
- Show spinner while script[currentIndex] is undefined
- Show script when loaded
- Remove bulk streaming logic

### 7. Update SmsClient Component
**File**: `src/components/sms/SmsClient.tsx`

Apply same lazy generation pattern:
- Call bulk route to get sessionId
- Credits deducted immediately
- Navigate through businesses
- Call /api/generate/sms/single for each
- Pre-fetch next business

### 8. Translation Keys - CRITICAL
**Files with hardcoded Polish**:
- `src/components/cold-call/ColdCallClient.tsx`
- `src/components/sms/SmsClient.tsx`

**Hardcoded strings to translate**:
```
"Cel kampanii SMS"
"Opisz co sprzedajesz"
"AI dopasuje przekaz"
"Cel + Upload"
"Kolumny"
"Potwierdź"
"Wyniki"
"Cel:"
"zmień"
"Przypisz kolumny z arkusza"
"Ocena (rating) i Cel per firma są opcjonalne"
"wpływa na jakość"
"wybierz kolumnę"
"Cel rozmowy (per firma)"
"Generuję skrypty..."
"firm"
"Podsumowanie kosztów"
"kredytów/firma"
"Saldo:"
"Generuję..."
"Wróć"
"Koszt:"
```

For each:
1. Add key to coldCall/sms namespace in all 10 locale files
2. Replace with t('key')

### 9. Remove City and Per-Business Purpose Columns
**Files to update**:
- `src/components/cold-call/ColdCallClient.tsx`
- `src/components/sms/SmsClient.tsx`

**Changes**:
- Remove "Miasto" from column mapping UI
- Remove "Cel rozmowy (per firma)" from column mapping UI
- Keep single purpose input at top
- City: make optional, use if exists in data
- Purpose: use global purpose for all businesses

### 10. History Page - Load Saved Scripts
**File**: `src/app/[locale]/(dashboard)/history/page.tsx` or similar

When user clicks session from history:
```typescript
// Load session
const session = await prisma.scriptSession.findUnique({
  where: { id: sessionId },
  include: { generatedScripts: true }
})

// Parse businesses from scripts column
const businesses = JSON.parse(session.scripts)

// Pass to client with saved scripts map
const savedScripts = {}
session.generatedScripts.forEach(gs => {
  savedScripts[gs.businessIndex] = gs.script
})

// Client loads saved instantly, generates missing on demand
```

## 🔥 CRITICAL NEXT STEPS (IN ORDER)

1. **Update ColdCallClient** - Implement lazy loading
2. **Update SmsClient** - Same pattern
3. **Add translation keys** - Fix Spanish/English UI
4. **Remove city/purpose columns** - Clean up UI
5. **Test full flow** - Upload 100 businesses, navigate quickly

## ⚠️ IMPORTANT NOTES

- AWS Bedrock Haiku 4.5 is configured and working
- All API routes use correct model
- Database ready for lazy loading
- Credits deducted upfront (prevents abuse)
- Scripts cached in DB (instant reload)
- Pre-fetch next business (smooth UX)

## 🧪 TESTING CHECKLIST

- [ ] Upload 117 businesses
- [ ] Confirms credits (117 × 4 = 468)
- [ ] First script loads in 3-5 seconds
- [ ] Navigate to next - script loads immediately (pre-fetched)
- [ ] Go back - script loads instantly (cached)
- [ ] Close browser, reopen history
- [ ] Already generated scripts load from DB instantly
- [ ] Missing scripts generate on demand
- [ ] Switch language to Spanish - ALL UI in Spanish
- [ ] No hardcoded Polish text visible
- [ ] No hydration errors in console
