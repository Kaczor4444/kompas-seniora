# KOMPAS SENIORA - Dokumentacja dla Claude

## ⚠️ KLUCZOWE INFORMACJE

### 🗄️ BAZA DANYCH
**UWAGA: Aplikacja używa NEON POSTGRESQL w chmurze, NIE lokalnego SQLite!**

- **Provider**: PostgreSQL (Neon)
- **Połączenie**: `.env` → `DATABASE_URL`
- **Total rekordów**: **184 placówki** (produkcja, stan: marzec 2026)
  - DPS: 89
  - ŚDS: 95
  - Małopolskie: 180
  - Śląskie: 4
  - Z ceną: 90 (49%)
  - Z geolokalizacją: 184 (100%)
- **SQLite (`prisma/dev.db`)**: NIEUŻYWANY - tylko stare testowe dane (36 rekordów)

**Aby zmodyfikować dane produkcyjne:**
1. Użyj `npx prisma studio` (GUI)
2. Lub SQL przez: `psql $DATABASE_URL`
3. Lub migracja Prisma

---

## 🛠️ TECH STACK

### Frontend
- **Framework**: Next.js 16.0.8 (App Router)
- **React**: 19.2.1
- **Styling**: Tailwind CSS 4
- **UI Components**:
  - Headless UI
  - Heroicons
  - Lucide React
  - Framer Motion
- **Maps**: Leaflet + React Leaflet

### Backend
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma 6.16.2
- **API**: Next.js API Routes

### Inne
- **TypeScript**: 5.x
- **Analytics**: Vercel Analytics
- **Forms**: React Hook Form + Zod
- **PDF**: jsPDF
- **CSV**: PapaParse
- **Search**: Fuse.js (fuzzy search)

---

## 📁 STRUKTURA PROJEKTU

```
kompas-seniora/
├── app/                    # Next.js App Router
│   ├── search/            # Strona wyszukiwania
│   ├── placowka/[id]/     # Szczegóły placówki
│   ├── admin/             # Panel admina
│   ├── kalkulator/        # Kalkulator kosztów
│   ├── poradniki/         # System artykułów MDX
│   └── api/               # API endpoints
│
├── components/            # Główne komponenty (re-exports)
│   ├── articles/          # Komponenty artykułów (Layout, TOC, etc.)
│   └── poradniki/         # PoradnikiContent
├── src/
│   ├── components/        # Prawdziwe komponenty
│   │   ├── search/        # Komponenty wyszukiwania
│   │   └── knowledge/     # KnowledgeCenter (karuzela artykułów)
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Utility functions
│   ├── data/              # articles.ts - organizacja artykułów
│   └── lib/               # Libraries
│
├── prisma/
│   ├── schema.prisma      # Model bazy danych
│   └── dev.db             # ❌ NIEUŻYWANY SQLite
│
├── lib/                   # Serverside utilities
│   └── articleHelpers.ts  # Wzbogacanie artykułów metadanymi z MDX
├── types/
│   └── article.ts         # Typy Article, Section, ArticleWithMetadata
├── content/articles/      # Pliki MDX artykułów (5 sekcji)
├── scripts/               # Import/migracja danych
├── public/                # Statyczne pliki
└── data/                  # Dane pomocnicze

```

---

## 🗂️ MODEL BAZY DANYCH

### Główne tabele:

#### `Placowka` (184 rekordy - wszystkie DPS i ŚDS z Małopolski)
Główna tabela z placówkami opieki.

**Kluczowe pola:**
- `miejscowosc` - nazwa miasta/wsi
- `powiat` - nazwa powiatu (21 powiatów w Małopolsce)
- `wojewodztwo` - województwo
- `typ_placowki` - "DPS" lub "ŚDS"
- `koszt_pobytu` - cena miesięczna (49% ma cenę)
- `profil_opieki` - CSV string (A, B, C...)
- `latitude`, `longitude` - geolokalizacja (100% pokrycie)

**Weryfikacja z oficjalnym wykazem (NEW - 2026-03-16):**
- `oficjalne_id` - numer l.p. z oficjalnego wykazu wojewódzkiego (Int?)
- `nazwa_oficjalna` - pełna nazwa z PDF (nazwa + adres + kod pocztowy) (String?)
- **Status weryfikacji DPS**: 36/85 wypełnione (42%)
  - Skrypt auto-fill: 31 DPS
  - Ręcznie: 5 DPS (l.p. 1-5)
  - Do uzupełnienia: 49 DPS
- **Status weryfikacji ŚDS**: 0/95 wypełnione (0%) - planowane

**Znane problemy danych:**
- ⚠️ Możliwe trailing spaces w `powiat` i `miejscowosc`
- ⚠️ Możliwe Unicode encoding issues (NFD vs NFC)
- ⚠️ Niespójność nazw powiatów: "Kraków" vs "krakowski" vs "m. Kraków"

#### `TerytLocation` (13,831 lokalizacji - WSZYSTKIE miejscowości Małopolski)
Baza TERYT - miejscowości dla Małopolski i Śląskiego.

**⚠️ UWAGA:** Baza zawiera WSZYSTKIE rodzaje miejscowości (również części/dzielnice RM=00).
Dokumentacja wspominała filtrowanie do ~1,901 głównych miejscowości, ale **to NIE zostało wykonane**.

**Statystyki:**
- Wszystkie lokalizacje: 13,831
- RM=00 (część/dzielnica): 10,606 (77%)
- RM=01 (wieś): 1,832
- RM=03 (osada): 1,179
- RM=96 (miasto na prawach powiatu): 63
- RM=98 (miasto): 4
- Inne (02,04,05,07): 147

**Pola:**
- `nazwa_normalized` - bez polskich znaków
- `rodzaj_miejscowosci` (RM) - kluczowe dla filtrowania
- `teryt_sym`, `teryt_sympod` - hierarchia TERYT

#### Inne tabele:
- `PlacowkaAnalytics` - statystyki wyświetleń
- `PlacowkaEvent` - eventy użytkowników
- `AppEvent` - eventy app-level
- `SharedList` - udostępnione listy
- `PlacowkaCena` - historia cen
- `MopsContact` - kontakty MOPS

---

## 🔍 SYSTEM WYSZUKIWANIA

### Pliki kluczowe:
- **Server Component**: `app/search/page.tsx`
- **Client Component**: `src/components/search/SearchResults.tsx`
- **SearchBar**: `src/components/search/SearchBar.tsx`
- **FilterPanel**: `src/components/search/FilterPanel.tsx`
- **API autocomplete**: `app/api/teryt/suggest/route.ts`

### 5 trybów wyszukiwania:
1. **GEOLOCATION** - user kliknął "W pobliżu"
2. **POWIAT ONLY** - klik z mapy Małopolski
3. **WOJEWÓDZTWO ONLY** - wybór z RegionModal
4. **Z QUERY + TERYT** - wpisanie miejscowości (Małopolska/Śląsk)
5. **Z QUERY BEZ TERYT** - fallback dla innych województw

### Auto-select miejscowości (commit bf33d05):
- **Client-side**: gdy 1 sugestia lub exact match → auto-wybiera
- **Server-side**: fallback gdy user kliknie Enter bardzo szybko
- **Priorytetyzacja**: miasta na prawach powiatu (RM=96,98)

### Mapowania miast na prawach powiatu:
```typescript
"m. Kraków" → "krakowski"
"m. Nowy Sącz" → "nowosądecki"
"m. Tarnów" → "tarnowski"
```

---

## 🎯 ZNANE PROBLEMY I TODO

### Problemy wydajnościowe:
1. **N+1 queries** w `/api/teryt/suggest` - pobiera wszystkie placówki dla każdej lokalizacji
2. **Brak paginacji** - pobiera wszystkie placówki naraz
3. **Geokodowanie blokuje SSR** - Nominatim API może spowolnić stronę
4. **Zduplikowana logika** - `normalizePolish()` w 3 miejscach

### Problemy danych:
1. Trailing spaces w polach `powiat` i `miejscowosc` (PostgreSQL!)
2. Różne encoding (NFD vs NFC) dla polskich znaków
3. Niespójność nazw powiatów dla miast na prawach powiatu

### Planowane funkcje:
- [ ] Podpowiedź "Zawęź do miasta" dla Krakowa i Gorlic
- [ ] Optymalizacja autocomplete (batch queries)
- [ ] Paginacja wyników
- [ ] Geokodowanie client-side

---

## 🔐 ZMIENNE ŚRODOWISKOWE (.env)

```bash
# Produkcyjna baza PostgreSQL (Neon)
DATABASE_URL="postgresql://neondb_owner:...@ep-orange-feather-ah5c17d5-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Admin Panel
ADMIN_PASSWORD=KompasSeniora2025!
```

---

## 📝 NAJWAŻNIEJSZE FUNKCJE POMOCNICZE

### Normalizacja polskich znaków
```typescript
// app/search/page.tsx, suggest/route.ts, SearchResults.tsx
function normalizePolish(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
```

### Mapowanie miast → powiaty
```typescript
// SearchResults.tsx:58-69
const mapCityCountyToPowiat = (powiat: string): string => {
  const normalized = normalizePolish(powiat);
  if (normalized === 'm. krakow') return 'krakowski';
  if (normalized === 'm. nowy sacz') return 'nowosądecki';
  if (normalized === 'm. tarnow') return 'tarnowski';
  return powiat;
};
```

---

## 👨‍💼 PANEL ADMINA

### Dostęp:
- **URL**: `/admin/placowki`
- **Auth**: Cookie-based (ADMIN_PASSWORD z .env)

### Funkcje:
1. **Lista placówek** z filtrowaniem:
   - Wyszukiwanie (nazwa, miejscowość, ulica)
   - Filtry: typ (DPS/ŚDS), województwo, status weryfikacji
   - Geolokalizacja (tylko z GPS)
   - **Sortowanie** (klikalne nagłówki):
     - ID bazy danych ↕
     - ID oficjalne (PDF) ↕

2. **Dodawanie placówki** (`/admin/placowki/dodaj`)
   - Pełny formularz z walidacją Zod
   - Sekcja weryfikacji (oficjalne_id + nazwa_oficjalna)

3. **Edycja placówki** (`/admin/placowki/[id]/edytuj`)
   - Edycja wszystkich pól
   - Zielona sekcja "Weryfikacja z oficjalnym wykazem województwa"

4. **Eksport**:
   - CSV (wszystkie dane)
   - Template CSV (pusty szablon)

### Kolumny tabeli:
- ID (baza) - klikalne sortowanie
- **ID PDF** (oficjalne_id) - klikalne sortowanie, zielony gdy wypełnione
- Nazwa
- Typ (DPS/ŚDS)
- Ulica
- Miejscowość
- Powiat
- Geo (ikona mapy)
- Verified (ikona checkmark)
- Akcje (edytuj/usuń)

---

## 🚀 KOMENDY

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Build
npm run build           # Production build
npm start               # Start production server

# Database
npx prisma studio       # GUI do bazy (⚠️ używa DATABASE_URL!)
npx prisma migrate dev  # Nowa migracja
npx prisma generate     # Regeneruj Prisma Client

# Data import
npm run import          # Import CSV data
```

---

## ⚡ SZYBKIE SPRAWDZENIE

### Która baza jest używana?
```bash
# Sprawdź .env
cat .env | grep DATABASE_URL

# Jeśli: postgresql:// → Neon PostgreSQL ✅
# Jeśli: file:./prisma/dev.db → SQLite ❌ (stare!)
```

### Ile rekordów w produkcji?
```bash
npx prisma studio
# Otwórz model "Placowka" → powinno być 184 (89 DPS + 95 ŚDS)
```

### Test wyszukiwania
1. Otwórz http://localhost:3000
2. Wpisz "krakow" → kliknij Szukaj
3. Powinno pokazać 9 placówek (powiat krakowski)
4. Filtr powiat powinien pokazywać "krakowski"

---

## 📌 COMMIT HISTORY (ostatnie)

- **4530199** (2026-03-16): feat: Weryfikacja z oficjalnym wykazem DPS i sortowanie w panelu admina
  - Dodano `oficjalne_id` i `nazwa_oficjalna` do modelu Placowka
  - Panel admina: kolumna "ID PDF", klikalne nagłówki sortowania
  - Auto-fill: 31/85 DPS (skrypt `scripts/fill-dps-official-data.js`)
  - Filtrowanie województw: frontend pokazuje tylko Małopolskie
  - Poprawki cen: 2026→2025, ŚDS NULL=bezpłatnie
- **bf33d05**: feat: Auto-select miejscowości (client + server fallback)
- **b571c85**: fix: Czyszczenie SQLite (❌ TO BYŁA POMYŁKA - nie wpływa na aplikację!)
- **4d3f973**: fix: Liczby placówek i filtry dla miast na prawach powiatu

---

## 📰 SYSTEM ARTYKUŁÓW (HYBRID MDX)

### Architektura
System używa **hybrydowego podejścia**:
- **Organizacja** (slug, kategoria, sekcja) → `src/data/articles.ts`
- **Treść** (title, excerpt, readTime) → pliki `.mdx` w `content/articles/`

### Pliki kluczowe:
- **`src/data/articles.ts`** - lista wszystkich artykułów z metadanymi organizacyjnymi
- **`lib/articleHelpers.ts`** - funkcje do wzbogacania artykułów o dane z MDX
- **`types/article.ts`** - typy TypeScript
- **`content/articles/[section]/[slug].mdx`** - treść artykułów

### Nowy system wyświetlania (2026-03-17):
Artykuły używają **systemu badge + featuredOrder + isActive**:

```typescript
{
  slug: 'wybor-placowki',
  sectionId: 'wybor-opieki',
  category: 'Wybór opieki',
  badge: 'POLECAMY',                    // Badge wyświetlany na karcie
  thumbnail: '/images/senior_opiekunka.webp',  // Opcjonalny thumbnail
  featuredOrder: 1,                     // Kolejność na stronie głównej (niższe = pierwsze)
  isActive: true                        // false = pokazuje "WKRÓTCE"
}
```

**Typy badge:**
- `POLECAMY` - zielony z animacją pulse
- `NOWE` - niebieski
- `NOWY ARTYKUŁ` - zielony z animacją pulse
- `WKRÓTCE` - szary (automatyczny gdy isActive=false)

**⚠️ WAŻNE:** Stara właściwość `featured: boolean` została usunięta (commit 01b1d4a, 2026-03-17).

### Komponenty:
1. **`KnowledgeCenter.tsx`** - karuzela na stronie głównej (pokazuje artykuły z `badge`)
2. **`PoradnikiContent.tsx`** - pełna strona `/poradniki` (grid wszystkich artykułów)
3. **`ArticleLayout.tsx`** - layout pojedynczego artykułu
4. **`app/poradniki/[section]/[slug]/page.tsx`** - dynamiczny routing artykułów

### Dodawanie nowego artykułu:
1. Dodaj wpis do `src/data/articles.ts`:
   ```typescript
   {
     slug: 'nowy-artykul',
     sectionId: 'wybor-opieki',
     category: 'Wybór opieki',
     badge: 'NOWE',           // opcjonalne
     featuredOrder: 5,        // opcjonalne
   }
   ```
2. Utwórz plik MDX: `content/articles/wybor-opieki/nowy-artykul.mdx`
3. Dodaj frontmatter:
   ```yaml
   ---
   title: "Tytuł artykułu"
   excerpt: "Krótki opis..."
   category: "Wybór opieki"
   readTime: 8
   publishedAt: "2026-03-17"
   ---
   ```

### Sekcje artykułów:
- `wybor-opieki` - Wybór opieki (Building2 icon)
- `dla-opiekuna` - Dla opiekuna (Heart icon)
- `dla-seniora` - Dla seniora (Users icon)
- `finanse-prawne` - Finanse i prawo (Wallet + Scale icon)

---

## 🆘 GDY COŚ NIE DZIAŁA

1. **Sprawdź którą bazę używasz** - powinien być PostgreSQL!
2. **Restart dev server** - cache może pokazywać stare dane
3. **Hard refresh przeglądarki** - Cmd+Shift+R
4. **Sprawdź console** - błędy API/bazy
5. **Prisma Studio** - zweryfikuj dane w produkcji

---

Ostatnia aktualizacja: 2026-03-17
