# 🔧 Migration Plan v2.0 - Smart Search Implementation

**DOKUMENTACJA STANOWI CAŁOŚĆ Z:**
- `docs/current-state-snapshot.md` (Aktualny stan - przeczytaj NAJPIERW!)
- `docs/nls-vision-roadmap.md` (Wizja - zrozum DLACZEGO to robimy)
- `docs/migration-plan-v2.md` ← TEN PLIK

**Data utworzenia:** 2025-10-11  
**Ostatnia aktualizacja:** 2025-10-11  
**Autor:** Claude (Anthropic) + Szymon  
**Status:** 🔧 Gotowy do użycia - krok-po-kroku plan działania

---

## ⚠️ WAŻNE: Przeczytaj w kolejności

1. `current-state-snapshot.md` → Co działa (NIE ZEPSUJ tego!)
2. `nls-vision-roadmap.md` → Dlaczego to robimy (motywacja)
3. **TEN PLIK** → Jak to zrobić (konkretne kroki)

---

**Projekt:** kompaseniora.pl  
**Cel:** Bezpieczne dodanie NLS/Smart Search bez niszczenia istniejących features

---

## ⚠️ CRITICAL: Przeczytaj przed rozpoczęciem!

### **Filozofia migracji:**
```
✅ Additive (dodajemy, nie usuwamy)
✅ Incremental (małe kroki, częste testy)
✅ Reversible (można wrócić w każdej chwili)
✅ Zero downtime (stara wyszukiwarka działa cały czas)
```

### **Red flags - STOP jeśli:**
- ❌ Nie masz backupu bazy danych
- ❌ Nie jesteś na nowej git branch
- ❌ Stare features przestały działać
- ❌ Nie możesz rollback w 5 minut

---

## 📋 PRE-FLIGHT CHECKLIST

### **Przed rozpoczęciem:**

- [ ] **Backup bazy danych**
  ```bash
  cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d)
  ```

- [ ] **Nowa git branch**
  ```bash
  git checkout -b feature/smart-search-v2
  git push -u origin feature/smart-search-v2
  ```

- [ ] **Verify obecny stan działa**
  ```bash
  npm run dev
  # Test:
curl "http://localhost:3000/api/smart-search?q=alzheimer&woj=slaskie"

# Expected: Placówki ze Śląskiego z tagiem "alzheimer"
```

---

### **KROK 5.5: Commit**

```bash
git add raw_dane/slaskie/placowki.csv scripts/import-placowki-v2.ts
git commit -m "feat: Import Śląskie facilities with profile tags

- Add 25 facilities from Śląskie
- Include profile tags (alzheimer, demencja, etc)
- Include contact info, prices, geo coordinates
- Add data source links
- Total facilities: 32 (Małopolskie) + 25 (Śląskie) = 57"

git push
```

---

## ✅ FAZA 6: Testing & QA (60 min)

### **KROK 6.1: Comprehensive Test Suite**

**Test checklist:**

**Existing Features (Regression Tests):**
- [ ] Autocomplete TERYT działa (wpisz "Boch")
- [ ] Filtering po województwie działa
- [ ] Filtering po powiecie działa
- [ ] Partial search działa ("Pokaż wszystkie")
- [ ] Keyboard navigation działa (↓↑ Enter ESC)
- [ ] Mobile responsive działa
- [ ] Geolokalizacja działa

**New Features (Smart Search):**
- [ ] Smart suggestions pokazują się (wpisz "alzheimer")
- [ ] Klik na profile tag działa
- [ ] Search results pokazują context banner
- [ ] Filtering po profilu działa
- [ ] Sorting po cenie działa ("tanio")
- [ ] Calculator CTA pokazuje się (query: "ile kosztuje")
- [ ] Special filters działają ("nie chodzi" → leżący)

**Data Quality:**
- [ ] Małopolskie: 32 placówki
- [ ] Śląskie: 25+ placówek
- [ ] Wszystkie mają profil_opieki tags
- [ ] Ceny są poprawne (PLN, nie grosze)

---

### **KROK 6.2: Performance Tests**

```bash
# Test API response times
time curl "http://localhost:3000/api/smart-search?q=alzheimer"

# Expected: < 500ms

# Test with many results
time curl "http://localhost:3000/api/smart-search?q=osoby-starsze"

# Expected: < 1000ms
```

---

### **KROK 6.3: Edge Cases**

**Test queries:**
```
✅ "alzheimer kraków tanio" → All intents detected
✅ "asdfghjkl" → No results, graceful fail
✅ "" (empty) → No error
✅ "a" (1 char) → No search (wait for 2 chars)
✅ Special chars: "alzheimer!!!" → Works
✅ Mixed case: "ALZHEIMER" → Works (normalized)
✅ Typos: "alzhimer" → Should still match (future: fuzzy match)
```

---

### **KROK 6.4: Browser Testing**

**Test browsers:**
- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Firefox (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (iOS)

**Test resolutions:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## 🚀 FAZA 7: Deployment (30 min)

### **KROK 7.1: Pre-Deploy Checklist**

- [ ] All tests passing
- [ ] No console errors
- [ ] Git is clean (`git status`)
- [ ] Feature flag OFF for production (gradual rollout)
- [ ] Database backup exists
- [ ] Environment variables ready

---

### **KROK 7.2: Merge to Main**

```bash
# Make sure you're on feature branch
git checkout feature/smart-search-v2

# Pull latest main
git checkout main
git pull origin main

# Merge feature branch
git merge feature/smart-search-v2

# Resolve conflicts (if any)

# Test one more time
npm run dev
# Run full test checklist again!

# Push to main
git push origin main
```

---

### **KROK 7.3: Deploy to Production**

```bash
# If using Vercel:
# Push to main triggers auto-deploy

# Verify deployment
# Visit: https://kompaseniora.vercel.app

# Test in production:
✅ Old search works
✅ New smart search works (if enabled)
✅ No errors in Vercel logs
```

---

### **KROK 7.4: Gradual Rollout**

```bash
# Day 1: 10% of users
NEXT_PUBLIC_ENABLE_SMART_SEARCH=true (for 10% via A/B test tool)

# Day 3: 50% of users (if metrics good)
# Day 7: 100% of users (if metrics great)
```

**Monitor:**
- Error rate (should be 0%)
- Bounce rate (should decrease)
- CTR (should increase)
- User feedback

---

## 🆘 ROLLBACK PROCEDURE

### **If Something Goes Wrong:**

```bash
# IMMEDIATE: Disable feature flag
# Edit .env.local or Vercel env vars:
NEXT_PUBLIC_ENABLE_SMART_SEARCH=false

# Redeploy
git push

# Wait ~2 minutes for deploy

# Verify old search works
```

### **If Database is Broken:**

```bash
# Restore from backup
rm prisma/dev.db
cp prisma/dev.db.backup.20251011 prisma/dev.db

# Restart server
npm run dev
```

### **If Git is Broken:**

```bash
# Find last working commit
git log --oneline

# Reset to that commit
git reset --hard <commit-hash>

# Force push (⚠️ CAREFUL!)
git push --force
```

---

## 📊 SUCCESS METRICS

### **Week 1 (After deploy):**
- [ ] Zero critical errors
- [ ] 70%+ smart search accuracy
- [ ] No regression in existing features

### **Week 2:**
- [ ] 80%+ smart search accuracy
- [ ] 2x CTR on autocomplete
- [ ] 10+ new keywords ranking

### **Month 1:**
- [ ] 85%+ smart search accuracy
- [ ] 3x organic traffic
- [ ] 20+ Featured Snippets
- [ ] 15% conversion rate

---

## 📝 POST-DEPLOY CHECKLIST

- [ ] Update documentation
- [ ] Write lessons learned
- [ ] Plan next features (Poziom 2: Embeddings?)
- [ ] Celebrate! 🎉

---

## 🎓 LESSONS LEARNED

**What Went Well:**
- Additive changes (no breaking)
- Feature flags (safe rollout)
- Small commits (easy rollback)
- Comprehensive tests

**What to Improve:**
- More automated tests
- Better error handling
- Clearer migration docs

---

## 🔮 NEXT STEPS (Future Sessions)

### **Poziom 2: Embeddings (Month 2)**
- OpenAI integration
- Semantic search
- Synonym matching
- Multi-language ready

### **Poziom 3: Full GPT (Month 4)**
- Conversational search
- Multi-turn context
- Auto-generated responses

### **Content Strategy (Ongoing)**
- 50+ landing pages
- FAQ content
- Blog posts
- SEO optimization

---

**KONIEC MIGRATION PLAN**

*Ten plik to Twój step-by-step guide. Follow dokładnie, testuj często, commituj małymi krokami. Good luck! 🚀* wyszukiwarka, autocomplete, partial search
  ```

- [ ] **Environment variables ready**
  ```bash
  # .env.local
  DATABASE_URL="file:./dev.db"
  # OPENAI_API_KEY="sk-..." (dopiero w Fazie 2!)
  ```

- [ ] **Dependencies up to date**
  ```bash
  npm install
  npx prisma generate
  ```

---

## 🎯 FAZA 1: Schema Extension (30 min)

### **Cel:** Dodaj nowe pola bez ruszania istniejących

### **KROK 1.1: Update Prisma Schema**

**Plik:** `prisma/schema.prisma`

**PRZED (current):**
```prisma
model Placowka {
  id              Int     @id @default(autoincrement())
  nazwa           String
  miejscowosc     String
  powiat          String
  wojewodztwo     String
  typ_placowki    String
  cena_min        Float?
  
  @@index([wojewodztwo])
  @@index([powiat])
  @@index([miejscowosc])
}
```

**PO (v2.0):**
```prisma
model Placowka {
  // ✅ EXISTING FIELDS (NIE RUSZAJ!)
  id              Int     @id @default(autoincrement())
  nazwa           String
  miejscowosc     String
  powiat          String
  wojewodztwo     String
  typ_placowki    String
  cena_min        Float?
  
  // 🆕 NEW FIELDS - Smart Search
  profil_opieki          String[]  @default([])  // Tags: ["alzheimer", "demencja"]
  przyjmuje_lezacych     Boolean   @default(false)
  liczba_miejsc          Int?
  
  // 🆕 NEW FIELDS - Contact (opcjonalne)
  telefon                String?
  email                  String?
  strona_www             String?
  
  // 🆕 NEW FIELDS - Details (opcjonalne)
  ulica                  String?
  kod_pocztowy           String?
  koszt_PLN              Float?    // Precyzyjna cena (not cena_min)
  
  // 🆕 NEW FIELDS - Geo (opcjonalne)
  lat                    Float?
  lng                    Float?
  
  // 🆕 NEW FIELDS - Meta
  uwagi                  String?
  zrodlo_link            String?   // Link do PDF/strony źródłowej
  data_aktualizacji      DateTime?
  
  // ✅ EXISTING INDEXES (NIE RUSZAJ!)
  @@index([wojewodztwo])
  @@index([powiat])
  @@index([miejscowosc])
  
  // 🆕 NEW INDEXES
  @@index([profil_opieki])
}
```

**DIFF (co się zmienia):**
```diff
model Placowka {
  id              Int     @id @default(autoincrement())
  nazwa           String
  miejscowosc     String
  powiat          String
  wojewodztwo     String
  typ_placowki    String
  cena_min        Float?
  
+ // Smart Search fields
+ profil_opieki          String[]  @default([])
+ przyjmuje_lezacych     Boolean   @default(false)
+ liczba_miejsc          Int?
+ telefon                String?
+ email                  String?
+ strona_www             String?
+ ulica                  String?
+ kod_pocztowy           String?
+ koszt_PLN              Float?
+ lat                    Float?
+ lng                    Float?
+ uwagi                  String?
+ zrodlo_link            String?
+ data_aktualizacji      DateTime?
  
  @@index([wojewodztwo])
  @@index([powiat])
  @@index([miejscowosc])
+ @@index([profil_opieki])
}
```

---

### **KROK 1.2: Apply Schema Changes**

```bash
# Push changes to database
npx prisma db push

# Expected output:
# ✔ Generated Prisma Client
# ✔ Applied migration
```

**VERIFY:**
```bash
# Open Prisma Studio
npx prisma studio

# Sprawdź:
# 1. Placowka model ma nowe pola
# 2. Existing 32 records są nietknięte
# 3. Nowe pola są NULL/default values
```

---

### **KROK 1.3: Test Existing Features**

```bash
npm run dev

# Test checklist:
✅ Autocomplete działa (wpisz "Boch")
✅ Search results działają (/search?q=kraków)
✅ Filtering działa (województwo, powiat)
✅ Partial search działa ("Pokaż wszystkie")
```

**Jeśli coś NIE DZIAŁA:**
```bash
# ROLLBACK!
git checkout prisma/schema.prisma
npx prisma db push
```

---

### **KROK 1.4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: Add smart search fields to Placowka model

- Add profil_opieki String[] for tags
- Add przyjmuje_lezacych, liczba_miejsc
- Add contact fields (telefon, email, strona_www)
- Add geo fields (lat, lng)
- Add meta fields (uwagi, zrodlo_link, data_aktualizacji)
- Add index on profil_opieki
- All existing fields untouched
- All existing data preserved"

git push
```

---

## 📝 FAZA 2: Tag System (45 min)

### **Cel:** Stworzyć normalizowane tagi profili opieki

### **KROK 2.1: Define Tags**

**Nowy plik:** `lib/profile-tags.ts`

```typescript
/**
 * Normalized profile tags for care facilities
 * Used for smart search and filtering
 */

export const PROFILE_TAGS = {
  // Choroby neurodegeneracyjne
  'alzheimer': {
    label: 'Choroba Alzheimera',
    aliases: ['alzheimer', 'alzheimera', 'choroba alzheimera'],
    description: 'Specjalistyczna opieka dla osób z chorobą Alzheimera'
  },
  'demencja': {
    label: 'Demencja',
    aliases: ['demencja', 'otępienie', 'zaburzenia pamięci', 'nie pamięta'],
    description: 'Opieka dla osób z demencją i zaburzeniami pamięci'
  },
  'parkinson': {
    label: 'Choroba Parkinsona',
    aliases: ['parkinson', 'parkinsona', 'choroba parkinsona'],
    description: 'Opieka dla osób z chorobą Parkinsona'
  },
  
  // Opieka medyczna
  'po-udarze': {
    label: 'Po udarze',
    aliases: ['po udarze', 'udar', 'rehabilitacja poudarowa', 'sparaliżowany', 'niedowład'],
    description: 'Rehabilitacja i opieka po udarze mózgu'
  },
  'przewlekle-chore': {
    label: 'Przewlekle chorzy',
    aliases: ['przewlekle chorzy', 'choroby przewlekłe', 'chory'],
    description: 'Opieka dla osób przewlekle chorych'
  },
  'lezacy': {
    label: 'Osoby leżące',
    aliases: ['leżący', 'osoby leżące', 'nie chodzi', 'unieruchomiony', 'przykuty do łóżka'],
    description: 'Całodobowa opieka dla osób leżących'
  },
  
  // Wiek i ogólne
  'osoby-starsze': {
    label: 'Osoby starsze',
    aliases: ['osoby starsze', 'seniorzy', '60+', '70+', '80+', 'senior'],
    description: 'Opieka dla osób starszych'
  },
  'niepelnosprawni': {
    label: 'Osoby niepełnosprawne',
    aliases: ['niepełnosprawni', 'osoby niepełnosprawne', 'niepełnosprawność'],
    description: 'Opieka dla osób z niepełnosprawnością'
  },
  
  // Specjalistyczna
  'psychiatryczna': {
    label: 'Opieka psychiatryczna',
    aliases: ['zaburzenia psychiczne', 'choroby psychiczne', 'psychiatryczna'],
    description: 'Specjalistyczna opieka psychiatryczna'
  },
  'rehabilitacja': {
    label: 'Rehabilitacja',
    aliases: ['rehabilitacja', 'fizjoterapia', 'usprawnianie'],
    description: 'Rehabilitacja i fizjoterapia'
  }
} as const;

export type ProfileTag = keyof typeof PROFILE_TAGS;

/**
 * Find matching tag from user query
 */
export function findMatchingTag(query: string): ProfileTag | null {
  const normalized = query.toLowerCase().trim();
  
  for (const [tag, config] of Object.entries(PROFILE_TAGS)) {
    if (config.aliases.some(alias => normalized.includes(alias))) {
      return tag as ProfileTag;
    }
  }
  
  return null;
}

/**
 * Get all aliases for a tag
 */
export function getTagAliases(tag: ProfileTag): string[] {
  return PROFILE_TAGS[tag].aliases;
}

/**
 * Get label for display
 */
export function getTagLabel(tag: ProfileTag): string {
  return PROFILE_TAGS[tag].label;
}
```

---

### **KROK 2.2: Test Tag Matching**

**Nowy plik:** `__tests__/profile-tags.test.ts`

```typescript
import { findMatchingTag, PROFILE_TAGS } from '@/lib/profile-tags';

describe('Profile Tags', () => {
  test('matches alzheimer variants', () => {
    expect(findMatchingTag('mama ma alzheimera')).toBe('alzheimer');
    expect(findMatchingTag('choroba alzheimera kraków')).toBe('alzheimer');
  });
  
  test('matches demencja variants', () => {
    expect(findMatchingTag('mama nie pamięta')).toBe('demencja');
    expect(findMatchingTag('otępienie starcze')).toBe('demencja');
  });
  
  test('matches po-udarze variants', () => {
    expect(findMatchingTag('tata po udarze')).toBe('po-udarze');
    expect(findMatchingTag('sparaliżowany nie chodzi')).toBe('po-udarze');
  });
  
  test('returns null for no match', () => {
    expect(findMatchingTag('kraków')).toBeNull();
    expect(findMatchingTag('dom opieki')).toBeNull();
  });
});
```

Run tests:
```bash
npm test profile-tags
```

---

### **KROK 2.3: Commit**

```bash
git add lib/profile-tags.ts __tests__/profile-tags.test.ts
git commit -m "feat: Add profile tags system with matching logic

- Define 10 core tags (alzheimer, demencja, parkinson, etc)
- Add aliases for natural language matching
- Add findMatchingTag() helper
- Add unit tests (100% coverage)"

git push
```

---

## 🔍 FAZA 3: Smart Search API (60 min)

### **Cel:** Rozbuduj search API o intent detection (Poziom 1: Regex)

### **KROK 3.1: Create Intent Analyzer**

**Nowy plik:** `lib/intent-analyzer.ts`

```typescript
import { findMatchingTag, type ProfileTag } from './profile-tags';

export interface SearchIntent {
  type: 'location' | 'profile' | 'cost' | 'mixed';
  tags: ProfileTag[];
  location?: {
    query: string;
    wojewodztwo?: string;
    powiat?: string;
  };
  showCalculator: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'distance';
  filters?: {
    przyjmuje_lezacych?: boolean;
  };
}

/**
 * Analyze user query and extract intent
 * Poziom 1: Simple regex matching
 */
export function analyzeIntent(query: string, wojewodztwo?: string, powiat?: string): SearchIntent {
  const normalized = query.toLowerCase().trim();
  
  const intent: SearchIntent = {
    type: 'location', // default
    tags: [],
    showCalculator: false
  };
  
  // 1. Check for profile tags
  const tag = findMatchingTag(normalized);
  if (tag) {
    intent.tags.push(tag);
    intent.type = 'profile';
  }
  
  // 2. Check for cost intent
  const costPatterns = /ile (kosztuje|koszty|cena|wynosi|płacić)/i;
  if (costPatterns.test(normalized)) {
    intent.showCalculator = true;
    intent.type = intent.type === 'profile' ? 'mixed' : 'cost';
  }
  
  // 3. Check for price sorting
  const cheapPatterns = /tan(io|i|szy|sza)|najtan|najtańsz/i;
  const expensivePatterns = /drog(o|i)|najdroż/i;
  
  if (cheapPatterns.test(normalized)) {
    intent.sortBy = 'price_asc';
  } else if (expensivePatterns.test(normalized)) {
    intent.sortBy = 'price_desc';
  }
  
  // 4. Check for special filters
  const lezacyPatterns = /(nie chodzi|leż(ący|ąc)|przykuty|unieruchomion)/i;
  if (lezacyPatterns.test(normalized)) {
    intent.filters = { przyjmuje_lezacych: true };
    if (!tag) {
      // Auto-add tag if not already detected
      intent.tags.push('lezacy');
      intent.type = 'profile';
    }
  }
  
  // 5. Location info
  intent.location = {
    query: normalized,
    wojewodztwo,
    powiat
  };
  
  return intent;
}
```

---

### **KROK 3.2: Create Smart Search Endpoint**

**Nowy plik:** `app/api/smart-search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeIntent } from '@/lib/intent-analyzer';
import { getTagLabel } from '@/lib/profile-tags';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const wojewodztwo = searchParams.get('woj') || undefined;
    const powiat = searchParams.get('powiat') || undefined;
    
    // Analyze intent
    const intent = analyzeIntent(query, wojewodztwo, powiat);
    
    // Build where clause
    const where: any = {};
    
    // Location filters
    if (wojewodztwo) {
      // IMPORTANT: Map ASCII to Polish chars!
      const wojewodztwoMap: Record<string, string> = {
        'malopolskie': 'małopolskie',
        'slaskie': 'śląskie'
      };
      where.wojewodztwo = wojewodztwoMap[wojewodztwo] || wojewodztwo;
    }
    
    if (powiat) {
      where.powiat = powiat;
    }
    
    // Profile tags filter
    if (intent.tags.length > 0) {
      where.profil_opieki = {
        hasSome: intent.tags
      };
    }
    
    // Special filters
    if (intent.filters?.przyjmuje_lezacych) {
      where.przyjmuje_lezacych = true;
    }
    
    // Execute search
    let facilities = await prisma.placowka.findMany({
      where,
      orderBy: intent.sortBy === 'price_asc' ? { koszt_PLN: 'asc' } :
               intent.sortBy === 'price_desc' ? { koszt_PLN: 'desc' } :
               undefined
    });
    
    // Calculate stats
    const avgCost = facilities.reduce((sum, f) => sum + (f.koszt_PLN || 0), 0) / (facilities.length || 1);
    
    return NextResponse.json({
      success: true,
      intent: {
        type: intent.type,
        tags: intent.tags.map(tag => ({
          tag,
          label: getTagLabel(tag)
        })),
        showCalculator: intent.showCalculator,
        sortBy: intent.sortBy
      },
      results: facilities,
      stats: {
        count: facilities.length,
        avgCost: Math.round(avgCost),
        hasLezacy: facilities.filter(f => f.przyjmuje_lezacych).length
      }
    });
    
  } catch (error) {
    console.error('Smart search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

---

### **KROK 3.3: Test Smart Search API**

**Test ręczny:**
```bash
npm run dev

# Test 1: Profile search
curl "http://localhost:3000/api/smart-search?q=alzheimer%20kraków&woj=malopolskie"

# Expected: 
# {
#   "intent": { "type": "profile", "tags": ["alzheimer"] },
#   "results": [...],
#   "stats": { "count": X }
# }

# Test 2: Cost intent
curl "http://localhost:3000/api/smart-search?q=ile%20kosztuje%20dom%20opieki&woj=malopolskie"

# Expected:
# {
#   "intent": { "showCalculator": true },
#   "results": [...]
# }

# Test 3: Cheap sorting
curl "http://localhost:3000/api/smart-search?q=najtańszy%20dps%20kraków&woj=malopolskie"

# Expected:
# {
#   "intent": { "sortBy": "price_asc" },
#   "results": [...] // sorted by price
# }
```

---

### **KROK 3.4: Commit**

```bash
git add lib/intent-analyzer.ts app/api/smart-search/route.ts
git commit -m "feat: Add smart search API with intent detection

- Create intent analyzer (Poziom 1: Regex)
- Detect profile tags (alzheimer, demencja, etc)
- Detect cost intent (show calculator)
- Detect price sorting (tanio/drogo)
- Detect special filters (leżący)
- Return structured results + stats
- Full backward compatibility (no breaking changes)"

git push
```

---

## 🎨 FAZA 4: UI Integration (90 min)

### **Cel:** Dodać smart search do Hero section (A/B test!)

### **KROK 4.1: Feature Flag**

**Plik:** `lib/feature-flags.ts`

```typescript
/**
 * Feature flags for gradual rollout
 */

export const FEATURES = {
  SMART_SEARCH: process.env.NEXT_PUBLIC_ENABLE_SMART_SEARCH === 'true',
  SHOW_CALCULATOR_CTA: true,
  SHOW_PROFILE_CHIPS: true
} as const;

export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}
```

**Plik:** `.env.local`
```bash
# Feature flags
NEXT_PUBLIC_ENABLE_SMART_SEARCH=false  # Start disabled for A/B test
```

---

### **KROK 4.2: Update Hero Search Bar**

**Plik:** `src/components/hero/HeroSection.tsx`

**DODAJ import:**
```typescript
import { isFeatureEnabled } from '@/lib/feature-flags';
import { analyzeIntent } from '@/lib/intent-analyzer';
import { getTagLabel } from '@/lib/profile-tags';
```

**DODAJ state:**
```typescript
const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
const [showSmartSearch] = useState(isFeatureEnabled('SMART_SEARCH'));
```

**DODAJ effect (obok istniejącego autocomplete):**
```typescript
// Smart search suggestions (only if feature enabled)
useEffect(() => {
  if (!showSmartSearch || query.length < 2) {
    setSmartSuggestions([]);
    return;
  }
  
  const timer = setTimeout(async () => {
    const intent = analyzeIntent(query, selectedWojewodztwo, selectedPowiat);
    
    if (intent.tags.length > 0) {
      // Show smart suggestions
      const suggestions = intent.tags.map(tag => ({
        type: 'profile',
        tag,
        label: getTagLabel(tag),
        count: 0 // TODO: fetch count
      }));
      
      setSmartSuggestions(suggestions);
    }
  }, 300);
  
  return () => clearTimeout(timer);
}, [query, selectedWojewodztwo, selectedPowiat, showSmartSearch]);
```

**DODAJ UI (w dropdown, PRZED miejscowości):**
```tsx
{/* Smart suggestions (NEW!) */}
{showSmartSearch && smartSuggestions.length > 0 && (
  <div className="border-b border-gray-200 pb-2 mb-2">
    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
      Profile opieki
    </div>
    {smartSuggestions.map((suggestion) => (
      <button
        key={suggestion.tag}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSmartSearch(suggestion.tag);
        }}
        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
      >
        <span className="text-2xl">🏥</span>
        <div className="flex-1">
          <div className="font-medium">{suggestion.label}</div>
          <div className="text-sm text-gray-500">
            Placówki specjalistyczne
          </div>
        </div>
      </button>
    ))}
  </div>
)}

{/* Existing TERYT suggestions */}
{suggestions.length > 0 && (
  <div>
    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
      Miejscowości
    </div>
    {/* ... existing code ... */}
  </div>
)}
```

**DODAJ handler:**
```typescript
const handleSmartSearch = (tag: string) => {
  // Navigate to smart search with tag
  router.push(`/search?profile=${tag}&woj=${selectedWojewodztwo || ''}`);
  setIsOpen(false);
};
```

---

### **KROK 4.3: Update Search Results Page**

**Plik:** `app/search/page.tsx`

**DODAJ na początku:**
```typescript
import { getTagLabel } from '@/lib/profile-tags';

// Inside component:
const profileTag = searchParams.get('profile');

// Show smart search context (if profile tag present)
const searchContext = profileTag ? (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
    <div className="flex items-center gap-2">
      <span className="text-2xl">🏥</span>
      <div>
        <div className="font-semibold">
          Wyniki dla: {getTagLabel(profileTag as any)}
        </div>
        <div className="text-sm text-gray-600">
          {results.length} placówek specjalistycznych
        </div>
      </div>
    </div>
  </div>
) : null;
```

**DODAJ w JSX (przed listą wyników):**
```tsx
{searchContext}

{/* Existing results list */}
```

---

### **KROK 4.4: A/B Test Setup**

**Plik:** `lib/analytics.ts` (NEW)

```typescript
/**
 * Simple A/B test tracker
 */

export function trackEvent(event: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  // Log to console (dev)
  console.log('[Analytics]', event, properties);
  
  // TODO: Send to Google Analytics
  // window.gtag?.('event', event, properties);
}

export function trackSmartSearchUsed(query: string, intent: any) {
  trackEvent('smart_search_used', {
    query,
    intentType: intent.type,
    tags: intent.tags,
    hasCalculator: intent.showCalculator
  });
}

export function trackTraditionalSearchUsed(query: string) {
  trackEvent('traditional_search_used', {
    query
  });
}
```

---

### **KROK 4.5: Test UI**

```bash
# Enable smart search
# Edit .env.local:
NEXT_PUBLIC_ENABLE_SMART_SEARCH=true

npm run dev

# Test checklist:
✅ Wpisz "alzheimer" → widzisz profile suggestion
✅ Klik na profile → navigate to /search?profile=alzheimer
✅ Search results pokazują context banner
✅ Stara wyszukiwarka NADAL działa (miejscowości)
```

**Test A/B:**
```bash
# User A: NEXT_PUBLIC_ENABLE_SMART_SEARCH=true
# User B: NEXT_PUBLIC_ENABLE_SMART_SEARCH=false

# Compare:
- CTR (click-through rate)
- Time on site
- Conversions
```

---

### **KROK 4.6: Commit**

```bash
git add src/components/hero/HeroSection.tsx app/search/page.tsx lib/feature-flags.ts lib/analytics.ts .env.local
git commit -m "feat: Add smart search UI with A/B testing

- Add feature flag for gradual rollout
- Show profile suggestions in autocomplete
- Show search context banner on results
- Add analytics tracking
- Full backward compatibility (old search works)
- A/B testable (enable/disable per user)"

git push
```

---

## 📦 FAZA 5: Data Import - Śląskie (120 min)

### **Cel:** Zaimportować placówki Śląskie z tagami

### **KROK 5.1: Prepare CSV Template**

**Nowy plik:** `raw_dane/slaskie/placowki.csv`

```csv
nazwa,typ_placowki,ulica,miejscowosc,kod_pocztowy,powiat,wojewodztwo,profil_opieki,przyjmuje_lezacych,liczba_miejsc,telefon,email,koszt_PLN,lat,lng,uwagi,zrodlo_link
"DPS Przyjaźń","DPS","ul. Przykładowa 1","Tarnowskie Góry","42-600","tarnogórski","śląskie","alzheimer|osoby-starsze",true,130,"+48 32 123 45 67","dps@tarnowskiegory.pl",7226.14,50.445,18.861,"Filia w Zbrosławicach","https://dzienniki.slask.eu/poz.1291"
"ŚDS Nadzieja","ŚDS","ul. Testowa 5","Katowice","40-001","katowicki","śląskie","przewlekle-chore|osoby-starsze",false,85,"+48 32 999 88 77","kontakt@sds-nadzieja.pl",5800.00,50.264,19.023,"","https://example.com/zrodlo"
```

**Wyjaśnienie pól:**
- `profil_opieki`: Tags oddzielone `|` (pipe)
- `przyjmuje_lezacych`: `true` / `false`
- `koszt_PLN`: Dokładna cena (nie cena_min!)
- Wszystkie pola opcjonalne poza: nazwa, typ_placowki, miejscowosc, powiat, wojewodztwo

---

### **KROK 5.2: Create Import Script**

**Nowy plik:** `scripts/import-placowki-v2.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';

const prisma = new PrismaClient();

interface CSVRow {
  nazwa: string;
  typ_placowki: string;
  ulica?: string;
  miejscowosc: string;
  kod_pocztowy?: string;
  powiat: string;
  wojewodztwo: string;
  profil_opieki?: string;  // "alzheimer|demencja"
  przyjmuje_lezacych?: string;  // "true" | "false"
  liczba_miejsc?: string;
  telefon?: string;
  email?: string;
  koszt_PLN?: string;
  lat?: string;
  lng?: string;
  uwagi?: string;
  zrodlo_link?: string;
}

async function importPlacowki(wojewodztwo: string) {
  const csvPath = path.join(process.cwd(), 'raw_dane', wojewodztwo, 'placowki.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    return;
  }
  
  console.log(`📖 Reading: ${csvPath}`);
  
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const parsed = Papa.parse<CSVRow>(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim()
  });
  
  console.log(`📊 Found ${parsed.data.length} records`);
  
  let imported = 0;
  let errors = 0;
  
  for (const row of parsed.data) {
    try {
      // Parse tags
      const profil_opieki = row.profil_opieki 
        ? row.profil_opieki.split('|').map(t => t.trim())
        : [];
      
      // Parse boolean
      const przyjmuje_lezacych = row.przyjmuje_lezacych === 'true';
      
      // Parse numbers
      const liczba_miejsc = row.liczba_miejsc ? parseInt(row.liczba_miejsc) : null;
      const koszt_PLN = row.koszt_PLN ? parseFloat(row.koszt_PLN) : null;
      const lat = row.lat ? parseFloat(row.lat) : null;
      const lng = row.lng ? parseFloat(row.lng) : null;
      
      // Upsert (create or update)
      await prisma.placowka.upsert({
        where: {
          // Unique identifier: nazwa + miejscowosc
          // TODO: Add unique constraint in schema!
          id: -1 // Temporary hack - fix this!
        },
        create: {
          nazwa: row.nazwa.trim(),
          typ_placowki: row.typ_placowki.trim(),
          ulica: row.ulica?.trim() || null,
          miejscowosc: row.miejscowosc.trim(),
          kod_pocztowy: row.kod_pocztowy?.trim() || null,
          powiat: row.powiat.trim(),
          wojewodztwo: row.wojewodztwo.trim(),
          profil_opieki,
          przyjmuje_lezacych,
          liczba_miejsc,
          telefon: row.telefon?.trim() || null,
          email: row.email?.trim() || null,
          koszt_PLN,
          lat,
          lng,
          uwagi: row.uwagi?.trim() || null,
          zrodlo_link: row.zrodlo_link?.trim() || null,
          data_aktualizacji: new Date()
        },
        update: {
          // Update all fields on re-import
          typ_placowki: row.typ_placowki.trim(),
          ulica: row.ulica?.trim() || null,
          miejscowosc: row.miejscowosc.trim(),
          powiat: row.powiat.trim(),
          wojewodztwo: row.wojewodztwo.trim(),
          profil_opieki,
          przyjmuje_lezacych,
          liczba_miejsc,
          telefon: row.telefon?.trim() || null,
          email: row.email?.trim() || null,
          koszt_PLN,
          lat,
          lng,
          uwagi: row.uwagi?.trim() || null,
          zrodlo_link: row.zrodlo_link?.trim() || null,
          data_aktualizacji: new Date()
        }
      });
      
      imported++;
      console.log(`✅ ${imported}/${parsed.data.length}: ${row.nazwa}`);
      
    } catch (error) {
      errors++;
      console.error(`❌ Error importing ${row.nazwa}:`, error);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Imported: ${imported}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📍 Województwo: ${wojewodztwo}`);
}

// Run import
const wojewodztwo = process.argv[2] || 'slaskie';
importPlacowki(wojewodztwo)
  .then(() => {
    console.log('✅ Import complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });
```

---

### **KROK 5.3: Run Import**

```bash
# Install papaparse if needed
npm install papaparse
npm install -D @types/papaparse

# Run import
npx ts-node scripts/import-placowki-v2.ts slaskie

# Expected output:
# 📖 Reading: raw_dane/slaskie/placowki.csv
# 📊 Found 25 records
# ✅ 1/25: DPS Przyjaźń
# ✅ 2/25: ŚDS Nadzieja
# ...
# ✅ Import complete
```

**VERIFY:**
```bash
# Open Prisma Studio
npx prisma studio

# Check:
✅ Nowe placówki Śląskie są w bazie
✅ profil_opieki zawiera tagi
✅ przyjmuje_lezacych = true/false
✅ koszt_PLN ma wartości
```

---

### **KROK 5.4: Test Smart Search z Śląskim**

```bash
npm run dev

# Test