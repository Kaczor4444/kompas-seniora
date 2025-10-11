# 📸 Current State Snapshot - kompaseniora.pl
**Data:** 2025-10-11  
**Cel:** Pełny backup stanu projektu PRZED wprowadzeniem zmian NLS/Smart Search

---

## ✅ CO DZIAŁA TERAZ (NIE RUSZAĆ!)

### **Funkcjonalności:**
- ✅ **Multi-segment search bar** (miejscowość | województwo | powiat | geolokalizacja | search)
- ✅ **Autocomplete dropdown** z TERYT
  - Debounce 300ms
  - Minimum 2 znaki
  - Keyboard navigation (↓↑ Enter ESC)
  - Click handlers: `onMouseDown` (nie `onClick`!)
- ✅ **Partial search** - przycisk "Pokaż wszystkie"
- ✅ **Tooltips** dla DPS/ŚDS
- ✅ **Responsive design** (desktop + mobile)
- ✅ **Geolokalizacja** użytkownika

### **Dane w bazie:**
- ✅ **13,833 lokalizacji TERYT** (Małopolskie)
- ✅ **32 placówki** (tylko Małopolskie)
- ✅ **0 placówek Śląskie** (TERYT jest, placówki brak)

---

## 🗄️ AKTUALNA STRUKTURA BAZY DANYCH

### **Model: TerytLocation**
```prisma
model TerytLocation {
  id                Int     @id @default(autoincrement())
  nazwa             String
  nazwa_normalized  String  // znormalizowane polskie znaki (ł→l, ą→a)
  wojewodztwo       String  // "małopolskie"
  powiat            String  // "krakowski"
  gmina             String
}
```

**Indeksy:**
- Brak explicit indexes (SQLite auto-index na PK)

**Dane:**
- 13,833 rekordów dla województwa Małopolskie
- Źródło: GUS TERYT SIMC_Adresowy_20250922.csv

---

### **Model: Placowka**
```prisma
model Placowka {
  id                Int      @id @default(autoincrement())
  nazwa             String
  miejscowosc       String   // "Kraków", "Limanowa"
  powiat            String   // "krakowski", "limanowski"
  wojewodztwo       String   // "małopolskie" (z polskimi znakami!)
  typ_placowki      String   // "DPS" | "ŚDS"
  
  // Opcjonalne pola (mogą być NULL)
  cena_min          Float?
  // ... inne pola (TODO: sprawdzić pełną listę w prisma/schema.prisma)
}
```

**Indeksy:**
```prisma
@@index([wojewodztwo])
@@index([powiat])
@@index([miejscowosc])
```

**Dane:**
- 32 rekordy (tylko Małopolskie)
- Źródło: PDFy z MOPSów Małopolska

---

## 🔍 JAK DZIAŁA WYSZUKIWARKA (FLOW)

### **1. Hero Search Bar (HeroSection.tsx)**
```
User wpisuje: "Boch..."
  ↓
Debounce 300ms
  ↓
API Call: /api/teryt/suggest?q=boch&woj=malopolskie&powiat=
  ↓
Dropdown pokazuje: top 5 sugestii TERYT
  ↓
User klika sugestię LUB "Pokaż wszystkie"
  ↓
Navigate to: /search?q=bochnia&woj=malopolskie
```

### **2. API Endpoint: /api/teryt/suggest/route.ts**
```typescript
// Przyjmuje parametry:
q         (query - miejscowość)
woj       (województwo - opcjonalne)
powiat    (powiat - opcjonalny)

// Zwraca:
{
  suggestions: [
    {
      nazwa: "Bochnia",
      powiat: "bocheński", 
      wojewodztwo: "małopolskie",
      facilitiesCount: 3
    }
  ],
  totalCount: 12
}

// Logika:
1. Normalizuje query (małe litery, usuwa polskie znaki)
2. WHERE nazwa_normalized CONTAINS query
3. Filtruje po woj/powiat jeśli podane
4. COUNT placówek dla każdej lokalizacji
5. LIMIT 5 + totalCount
```

### **3. Search Results Page (/search/page.tsx)**
```
Parametry URL:
?q=bochnia&woj=malopolskie&powiat=bocheski&typ=DPS&partial=true

Flow:
1. Parse URL params
2. Mapowanie województw: 'malopolskie' → 'małopolskie' (polskie znaki!)
3. Query do Placowka:
   WHERE wojewodztwo = 'małopolskie'
     AND powiat = 'bocheński'
     AND typ_placowki = 'DPS'
4. Render: SearchResults component + FacilityMap
```

---

## ⚠️ KLUCZOWE TECHNICAL DETAILS (CRITICAL!)

### **1. Mapowanie województw (POLSKIE ZNAKI!)**
```typescript
// WAŻNE: URL używa ASCII, baza używa UTF-8
const wojewodztwoMap: Record<string, string> = {
  'malopolskie': 'małopolskie',
  'slaskie': 'śląskie',
  'mazowieckie': 'mazowieckie',
  // ...
};

// W API endpoint:
terytWhere.wojewodztwo = wojewodztwoMap[wojewodztwo] || wojewodztwo;
```

**Dlaczego:** Bez tego filtrowanie po województwie daje 0 wyników!

---

### **2. Click Handlers w Dropdown (React)**
```typescript
// ❌ BŁĄD - dropdown zamyka się PRZED kliknięciem:
<button onClick={() => handleClick(item)}>

// ✅ POPRAWNIE - onMouseDown fires PRZED blur:
<button 
  onMouseDown={(e) => {
    e.preventDefault();
    e.stopPropagation();
    handleClick(item);
  }}
>
```

**Dlaczego:** `onMouseDown` → `blur` → `onClick`, ale blur zamyka dropdown!

---

### **3. Partial Search Logic**
```typescript
// URL param: partial=true
// Oznacza: user kliknął "Pokaż wszystkie" w autocomplete

if (partial === 'true') {
  // Wyszukaj wszystkie miejscowości zaczynające się od query
  WHERE nazwa_normalized LIKE 'boch%'  // prefix match
} else {
  // Normalne wyszukiwanie (exact match)
  WHERE nazwa = 'Bochnia'
}
```

---

### **4. CSS Positioning dla Dropdown**
```typescript
// Dropdown MUSI mieć:
style={{ 
  zIndex: 10000,           // Powyżej wszystkiego
  position: 'absolute'     // Nie relative!
}}

// Parent MUSI mieć:
className="relative"       // Anchor point
```

**Dlaczego:** Bez tego dropdown jest clipped przez overflow:hidden parents

---

### **5. Normalizacja polskich znaków**
```typescript
function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z');
}

// Używane w:
- TERYT import (nazwa_normalized field)
- Search query parsing
- Autocomplete matching
```

---

## 📁 STRUKTURA PLIKÓW (KLUCZOWE)

```
kompas-seniora/
├── app/
│   ├── api/
│   │   └── teryt/
│   │       └── suggest/
│   │           └── route.ts          ⭐ Autocomplete API
│   ├── search/
│   │   └── page.tsx                  ⭐ Search results page
│   └── page.tsx                      (Homepage)
│
├── src/components/
│   └── hero/
│       └── HeroSection.tsx           ⭐ Search bar + autocomplete UI
│
├── prisma/
│   ├── schema.prisma                 ⭐ Database schema
│   └── dev.db                        (SQLite database - gitignored)
│
├── scripts/
│   ├── import-teryt-full.js          (TERYT import)
│   └── import-csv.ts                 (Placówki import)
│
├── docs/
│   ├── lessons-learned-autocomplete.md  ⭐ Technical lessons
│   └── next_session_prompt.md          (Session context)
│
└── raw_dane/
    └── malopolskie/
        └── (CSV files z placówkami)
```

---

## 🔧 TECH STACK

### **Framework & Libraries:**
- Next.js 15.5.4
- TypeScript
- Tailwind CSS
- Prisma ORM
- React Leaflet (mapy)
- SQLite (dev) → PostgreSQL (production planned)

### **Dependencies:**
```json
{
  "next": "15.5.4",
  "react": "^18",
  "prisma": "latest",
  "@prisma/client": "latest",
  "leaflet": "^1.9",
  "react-leaflet": "^4"
}
```

---

## 🚫 NIE RUSZAĆ (Working Features)

### **Kod:**
- ❌ `wojewodztwoMap` mapping (app/api/teryt/suggest/route.ts)
- ❌ `onMouseDown` handlers (src/components/hero/HeroSection.tsx)
- ❌ `partial` search logic (app/search/page.tsx)
- ❌ `getPluralForm` function (polska gramatyka)
- ❌ Normalizacja polskich znaków

### **Baza danych:**
- ❌ TerytLocation (13,833 records)
- ❌ Placowka schema fields: `wojewodztwo`, `powiat`, `miejscowosc`
- ❌ Indexes na wojewodztwo/powiat/miejscowosc

---

## ✅ TESTY AKCEPTACYJNE (Przed merge do main)

### **Test 1: Autocomplete działa**
```
1. Wpisz "Boch" w search bar
2. ✅ Dropdown pokazuje się po 2 znakach
3. ✅ Pokazuje top 5 sugestii
4. ✅ Pokazuje liczbę placówek
5. ✅ Klik na sugestię → navigate to /search
```

### **Test 2: Filtrowanie działa**
```
1. Wybierz województwo "Małopolskie"
2. Wybierz powiat "bocheński"
3. Kliknij Search
4. ✅ Pokazuje placówki TYLKO z powiatu bocheńskiego
```

### **Test 3: Partial search działa**
```
1. Wpisz "kra" (3 znaki)
2. Dropdown pokazuje > 5 wyników
3. Kliknij "Pokaż wszystkie (X)"
4. ✅ /search?q=kra&partial=true
5. ✅ Pokazuje wszystkie miejscowości zaczynające się od "kra"
```

### **Test 4: Mobile responsive**
```
1. Otwórz na telefonie (lub DevTools mobile view)
2. ✅ Search bar stack vertically
3. ✅ Dropdown full-width
4. ✅ Buttons clickable (44px min)
```

### **Test 5: Keyboard navigation**
```
1. Focus na search input
2. Wpisz "boch"
3. ✅ Strzałka w dół → highlight first item
4. ✅ Enter → navigate
5. ✅ ESC → close dropdown
```

---

## 📊 AKTUALNE METRYKI

### **Performance:**
- Autocomplete API: ~100-200ms response time
- Search results: ~300-500ms load time
- Database queries: indexed (fast)

### **Data Quality:**
- TERYT: 100% coverage Małopolska
- Placówki: 32/~50 expected (64% coverage)
- Data freshness: 2025-10-10

---

## 🔗 DEPENDENCIES & CONSTRAINTS

### **Critical Dependencies:**
- Prisma schema MUSI być kompatybilna z SQLite i PostgreSQL
- Polish characters MUSZĄ być handled w encoding (UTF-8)
- URL params używają ASCII (bez polskich znaków)

### **Known Issues:**
- ⚠️ Import cen pokazuje 5,6,7 zamiast 5000,6000,7000 (bug w parsowaniu - naprawimy później)
- ⚠️ Console.logi są aktywne (celowo - dla debugowania)
- ⚠️ Brak placówek Śląskie (tylko TERYT, brak danych)

---

## 💾 BACKUP CHECKLIST

Przed jakimikolwiek zmianami:

- [ ] `git status` - sprawdź czy wszystko commitowane
- [ ] `git checkout -b feature/nazwa-zmian` - nowa branch
- [ ] `cp prisma/dev.db prisma/dev.db.backup` - backup bazy
- [ ] `git commit -am "Snapshot before changes"` - commit przed zmianami
- [ ] Test że obecne features działają (run checklist powyżej)

---

## 🆘 ROLLBACK PROCEDURE

Jeśli coś pójdzie nie tak:

```bash
# 1. Wróć do poprzedniego commita
git log --oneline  # znajdź hash ostatniego working commit
git checkout <hash>

# 2. Przywróć bazę danych
rm prisma/dev.db
cp prisma/dev.db.backup prisma/dev.db

# 3. Reinstall dependencies (jeśli zmieniłeś package.json)
npm install

# 4. Restart dev server
npm run dev

# 5. Verify że działa (run acceptance tests)
```

---

## 📝 NOTATKI

### **Last Working Commit:**
- Hash: `c165ad3` (według docs/next_session_prompt.md)
- Branch: `main`
- Date: 2025-10-10

### **Contact dla rollback:**
- Repository: https://github.com/Kaczor4444/kompas-seniora
- Owner: Iwona (Kaczor4444)

---

**KONIEC SNAPSHOTA**  
*Ten plik jest świętym zapisem tego co działa. Używaj go jako reference point przed każdą większą zmianą.*