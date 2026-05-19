# KOMPAS SENIORA - Dokumentacja dla Claude

## ⚠️ KLUCZOWE INFORMACJE

### 🗄️ BAZA DANYCH
**UWAGA: Aplikacja używa NEON POSTGRESQL w chmurze, NIE lokalnego SQLite!**

- **Provider**: PostgreSQL (Neon)
- **Połączenie**: `.env` → `DATABASE_URL`
- **Total rekordów**: **467 placówek** (produkcja, stan: maj 2026)
  - **Małopolskie: 363**
    - DPS: 95 | ŚDS: 97 | Klub Senior+: 89 | Dzienny Dom Senior+: 34 | UTW: 52
    - MDDPS Kraków: 16 (jst_nazwa='Miasto Kraków (MDDPS)')
  - **Śląskie: 104** (100 nowych DPS z rejestru WUW, sesja #20)
    - DPS: 104 (z rejestru DPS Śląskiego, aktualizacja 12.03.2026)
  - Z ceną: ~90 (tylko DPS Małopolskie, ~26% wszystkich)
  - Z geolokalizacją: 467 (100%)
- **TerytLocation**: 17,818 lokalizacji
  - Małopolskie: 13,831 | Śląskie: 3,987 (WOJ=24, dodano sesja #20)
- **SQLite (`prisma/dev.db`)**: NIEUŻYWANY - tylko stare testowe dane (36 rekordów)
- **UTW**: osobna sekcja `/utw` — nie wliczane do liczników opieki (getMainSearchFilter)

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

#### `Placowka` (299 rekordów - DPS, ŚDS, Klub Senior+, Dzienny Dom Senior+ z Małopolski)
Główna tabela z placówkami opieki.

**Kluczowe pola:**
- `miejscowosc` - nazwa miasta/wsi
- `powiat` - nazwa powiatu (21 powiatów w Małopolsce)
- `wojewodztwo` - województwo
- `typ_placowki` - "DPS", "ŚDS", "Klub Senior+" lub "Dzienny Dom Senior+"
- `koszt_pobytu` - cena miesięczna (49% ma cenę)
- `profil_opieki` - CSV string (A, B, C...)
- `latitude`, `longitude` - geolokalizacja (100% pokrycie)

**Weryfikacja z oficjalnym wykazem (NEW - 2026-03-16):**
- `oficjalne_id` - numer l.p. z oficjalnego wykazu wojewódzkiego (Int?)
- `nazwa_oficjalna` - pełna nazwa z PDF (nazwa + adres + kod pocztowy) (String?)
- `rok_powstania` - rok powstania ośrodka (Int?, tylko Senior+)
- `jst_nazwa` - Jednostka Samorządu Terytorialnego prowadząca ośrodek (String?, tylko Senior+)
- **Status weryfikacji DPS**: 36/85 wypełnione (42%)
  - Skrypt auto-fill: 31 DPS
  - Ręcznie: 5 DPS (l.p. 1-5)
  - Do uzupełnienia: 49 DPS
- **Status weryfikacji ŚDS**: 0/95 wypełnione (0%) - planowane

**Znane problemy danych:**
- ⚠️ Możliwe trailing spaces w `powiat` i `miejscowosc`
- ⚠️ Możliwe Unicode encoding issues (NFD vs NFC)
- ⚠️ Niespójność nazw powiatów: "Kraków" vs "krakowski" vs "m. Kraków"

#### `TerytLocation` (17,818 lokalizacji — Małopolska + Śląskie)
Baza TERYT - miejscowości dla obsługiwanych województw. Źródło: `data/SIMC_Adresowy_20250922.csv`.

**⚠️ UWAGA:** Baza zawiera WSZYSTKIE rodzaje miejscowości (również części/dzielnice RM=00).

**Statystyki (total: 17,818):**
- Małopolskie (WOJ=12): 13,831
- Śląskie (WOJ=24): 3,987 (17 powiatów ziemskich + 19 miast na prawach powiatu)
- RM=00 (część/dzielnica): ~77% wszystkich rekordów

**Skrypty importu:**
- Małopolskie: `scripts/import-teryt-filtered.js` (lub `import-teryt-full.js`)
- Śląskie: `scripts/import-teryt-slaskie.js` (WOJ=24)
- Wzorzec dla nowych województw: `ADDING_VOIVODESHIP.md`

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
- `MopsContact` - kontakty MOPS/GOPS/CUS (**190 rekordów**: 23 Małopolska + 167 Śląskie)
  - Małopolskie: 23 (MOPS/GOPS/CUS, zweryfikowane ręcznie) — `raw_dane/malopolskie/ops_malopolska_geo.csv`
  - Śląskie: 167 (MOPS=42, GOPS=122, CUS=3) — `raw_dane/slaskie/ops_slaskie.csv` + PDF (gitignored)
  - Monitor śląski: `scripts/monitor-mops-slaskie.py` | cron 20. każdego miesiąca
  - API bez filtra woj. — `/api/mops/search` działa dla obu województw

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

### ⚠️ Out-of-region detection (NEW - 2026-03-18):

**Problem:** Users wpisują stolice Polski (Warszawa, Olsztyn...) i dostają błędne wyniki.

**Rozwiązanie - 3 warstwy ochrony:**

1. **Blacklista stolic Polski** (`app/search/page.tsx:8-17`)
   - 40+ największych miast Polski
   - Blokuje gdy user wpisał SAM TEKST (bez wyboru z autocomplete)
   - Jeśli user wybrał z autocomplete (powiat znany) → dozwolone (może być wieś o tej samej nazwie)

2. **Geocoding z Nominatim** (`app/search/page.tsx:30-101`)
   - Sprawdza `address.state` (województwo)
   - **WAŻNE:** Nominatim zwraca "województwo małopolskie" (z prefixem!) - trzeba wyciąć prefix przed porównaniem
   - Zwraca `outOfRegion: true/false`

3. **UI komunikaty:**
   - **EmptyState** - komunikat "Miejscowość poza obsługiwanym regionem"
   - **Żółty banner** - gdy user szukał stolicę ALE wybrał z autocomplete część wsi o tej nazwie:
     ```
     ⚠️ To nie stolica, tylko część wsi!
     Szukana miejscowość "Warszawa" to część wsi w powiecie olkuskim,
     nie stolica Polski.
     ```
   - **Etykieta na mapie** - pulsujący punkt pokazuje "(część wsi)" pod nazwą

**Oznaczenia RM=00 (części wsi):**
- Autocomplete: "Warszawa (część wsi)" - `SearchBar.tsx:72-79`
- ★ dla miast (RM=96/98) - zielona gwiazdka
- Mapa: dwuliniowa etykieta "Warszawa<br/>(część wsi)" - `FacilityMap.tsx:116-159`

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
   - Filtry: typ (DPS/ŚDS/Klub Senior+/Dzienny Dom Senior+), województwo, status weryfikacji
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
# Otwórz model "Placowka" → powinno być 315 (95 DPS + 97 ŚDS + 89 Klub Senior+ + 34 DDS)
```

### Test wyszukiwania
1. Otwórz http://localhost:3000
2. Wpisz "krakow" → kliknij Szukaj
3. Powinno pokazać 9 placówek (powiat krakowski)
4. Filtr powiat powinien pokazywać "krakowski"

---

## 📌 COMMIT HISTORY (ostatnie)

- **01e4b5a** (2026-05-20): feat: MOPS Śląskie — 167 ośrodków + monitor GitHub Action
  - PDF: Wykaz OPS woj. śląskiego (katowice.uw.gov.pl, maj 2026)
  - Typy: MOPS=42, GOPS=122, CUS=3 | GPS: 166/167 | 0 błędów importu
  - `parse-mops-slaskie.py` — PDF → CSV (pypdf, regex parser)
  - `import-mops-slaskie.js` — CSV → DB z geocodingiem Nominatim (167 rekordów)
  - `monitor-mops-slaskie.py` + `slaskie-mops-monitor.yml` — cron 20. każdego miesiąca
  - `/mops` i `/api/mops/search` działają dla Śląska bez zmian w kodzie

- **bf01c24** (2026-05-19): feat: dynamiczny komunikat odległości + ikona samochodu
  - Kliknięcie Katowic → "W promieniu 30 km od Katowic znajduje się 55 placówek. Zwiększ odległość..."
  - Liczba i dystans aktualizują się w czasie rzeczywistym przy przesuwaniu suwaka
  - `CityCard`: dodaje `&cn=Katowice` do URL; serwer oblicza genitivus (GENITIVE_MAP)
  - `SearchResults`: prop `nearCityGenitive`, dynamiczny tekst z `maxDistance` + `facilities.length`
  - `FacilityCard`: ikona `Car` (size 18) za czasem jazdy — `2 min 🚗`

- **01614d6** (2026-05-19): fix: near=true — suwak dystansu działa przy kliknięciu miasta (Śląskie)
  - Serwer wcześniej filtrował do 30km przed odesłaniem → suwak nie miał co rozszerzać
  - Fix: `woj≠'all'` (klik CityCard) → wszystkie placówki woj. posortowane odległościowo (klient filtruje)
  - `woj='all'` (GPS) → zachowane stare zachowanie (filtr 30km na serwerze)
  - Dodano odmiany śląskich miast w dopełniaczu do `getCityGenitive`

- **aca7d05** (2026-05-19): fix: CityCard śląskie — near=true z lat/lng zamiast city=true
  - `city=true` zwracał tylko 3 DPS z Katowic → suwak odległości bezużyteczny
  - Śląskie: `?near=true&lat=50.26&lng=19.02&woj=slaskie` → 104 DPS sortowane odległościowo
  - `POPULAR_CITIES_CONFIG`: dodano lat/lng dla 6 śląskich miast

- **cffa01e** (2026-05-19): fix: CityCard — dodaje woj=slaskie do URL śląskich miast
  - Filtr województwa teraz auto-wybiera "Śląskie" gdy klik na śląskie miasto
  - CityCard otrzymuje prop `voivodeship` i dokłada `?woj=slaskie` do URL

- **a162da3** (2026-05-19): feat: PopularLocations + FacilityTypeCards multi-voivodeship
  - `popular-cities.ts`: +6 śląskich miast (Katowice, Zabrze, Gliwice, Bytom, Częstochowa, Cieszyn)
  - `PopularLocationsSection`: tekst "w Małopolsce" → "w Małopolsce i na Śląsku"
  - `FacilityTypeCards`: typeCounts = suma wszystkich województw (DPS 95+100=195)

- **54547fd** (2026-05-19): sesja #20 — kompletna integracja województwa Śląskiego ✅
  - **Dane:** TerytLocation +3,987 śląskich (WOJ=24) | Placowka +100 DPS (100% geocodowanych)
  - **Skrypty:** `import-teryt-slaskie.js`, `import-dps-slaskie.js`, `monitor-dps-slaskie.py`
  - **GitHub Actions:** `slaskie-dps-monitor.yml` — cron 8. każdego miesiąca
  - **UI wyszukiwarka:** `ENABLED_VOIVODESHIPS` += śląskie | +19 city-county mappings | blacklist fix
  - **UI filtry:** select województwa aktywny (Wszystkie/Małopolskie/Śląskie) | ALL_SLASKIE_POWIATS
  - **Mapa:** `slaskie-counties.ts` (36 SVG paths z GeoJSON) | RegionalMap z pill-toggle 🟢/🔵
  - **Bug fix:** tooltip miast (strip `m. ` prefix w countById lookup)
  - **Docs:** `ADDING_VOIVODESHIP.md` — pełny blueprint z 11 krokami + tabela pułapek
  - **Inne:** FacilityMap "Zapytaj" dla DPS bez ceny | HeroSection "Małopolsce i na Śląsku"
  - Commits: 7d532f6, 4cb19a0, 4e9033c, 54bc80d, 4fca201, 54547fd

- **9af09f4** (2026-05-17): feat: sesja #19 — UTW (Uniwersytety Trzeciego Wieku)
  - 52 UTW zescrapowane z senioralna.malopolska.pl → zaimportowane do bazy (id 324–375)
  - Strona `/utw`: hero fioletowy, filtry, lista kart, mapa Leaflet
  - Landing: 4. kafelek "Uniwersytet Trzeciego Wieku" (violet) w FacilityTypeCards
  - `getMainSearchFilter()` w voivodeship-filter.ts — wyklucza ŚDS i UTW z głównych liczników
  - `SCRAPER.md` — dokumentacja scraperów, User-Agent rules, Nominatim ascii_query fix
  - Nominatim UA zmieniony na `geocoder-research/1.0` we wszystkich skryptach

- **aecc7c9** (2026-05-17): feat: monitoring BIP Kraków — MDDPS (GitHub Action)
  - Cron 5. każdego miesiąca: porównuje datę edycji w BIP dzienniku zmian
  - `raw_dane/krakow/.mddps_last_change` — inicjalna data 2023-03-20
  - GitHub Issue gdy wykryje zmianę (instrukcja ręcznej weryfikacji)
- **9867c4e** (2026-05-17): feat: sesja #18 — Senior+ UI rework, MDDPS Kraków import
  - ŚDS ukryte z całego UI użytkownika (hero, filtry, kafelki, asystent, kalkulator) — zostaje w DB i artykułach
  - FacilityTypeCards: nowa sekcja na landingu (DPS/Klub Seniora/DD Senior+), zdjęcia jako tło
  - RegionalMap: 3 warstwy (DPS/KlubSenior/DDSenior) z przełącznikiem pills + kolory per typ
  - SupportAssistant: przebudowany na DPS/KlubSenior/DDSenior/MOPS (bez ŚDS)
  - MOPS search: 2-step z TERYT fallback + disambiguacja (wieloznaczne miejscowości → chips powiatów)
  - PriceMap: mapa Małopolski ze średnimi cenami DPS per powiat na stronie kalkulatora
  - MDDPS Kraków: 16 placówek dodanych do bazy (6 domów → DD Senior+, 10 klubów → Klub Senior+)
  - FacilityTypeCards label: "Klub Senior+" → "Klub Seniora" (bez plusa, obejmuje też MDDPS)
- **e4e77a2** (2026-05-16): feat: Senior+ — poprawki wyświetlania i danych
  - FacilityCard: badge amber + "DD Senior+" skrót + "Bezpłatne" zamiast "Zapytaj"
  - SearchResults: usunięto błędny type cast `as 'DPS'|'ŚDS'` dla Senior+
  - FacilityMap: "Bezpłatne" zamiast "NFZ" w tooltipie; klaster tri-color (zielony/granatowy/amber)
  - WelcomeWidget: "Free of charge" zamiast "Funded by NFZ"
  - PlacowkaDetails: dodano `rok_powstania`/`jst_nazwa`; sekcja "Jak dołączyć?" dla Senior+; "Bezpłatne" i "Na bieżąco" dla Senior+
  - `scripts/fix-senior-plus-powiat.js`: zaktualizowano `powiat` dla **107 rekordów** Senior+ (JST → powiat administracyjny, np. "Szczurowa" → "brzeski")
- **2991097** (2026-05-16): feat: Ośrodki Senior+ — pełna integracja (baza, UI, monitoring)
  - Prisma: dodano `rok_powstania` i `jst_nazwa` do modelu Placowka
  - Import: 107 ośrodków (79 Klub Senior+ + 28 Dzienny Dom Senior+) z geolokalizacją
  - SearchBar/SearchResults/FilterPanel: nowe chipsy i filtry typów Senior+
  - FacilityMap: złoty marker (#f59e0b) + amber badge dla Senior+
  - GitHub Action: `senior-plus-monitor.yml` (cron 1. każdego miesiąca)
  - `scripts/monitor-senior-plus.py` + `scripts/import-senior-plus.py`
  - **⚠️ TODO:** Dodać `DATABASE_URL` jako secret w GitHub Repo Settings → Secrets
- **d48e3ec** (2026-04-22): feat: Dodano Organization schema i AI bot tracking
  - **Organization + LocalBusiness JSON-LD** w `app/layout.tsx` (SEO structured data)
  - **AI Bot Tracking System:**
    - Middleware detekcja: ChatGPT, Claude, Perplexity, Google-Extended, Googlebot, Bingbot
    - API endpoint: `/api/analytics/bot-track` (zapisuje do AppEvent table)
    - Admin dashboard: nowy komponent `BotStats.tsx` - wyświetla bot statistics
    - Zachowano admin panel protection
  - **⚠️ UWAGA:** Boty są trackowane ALE zablokowane przez robots.txt + robots meta!
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

## 🚨 KRYTYCZNE TODO - NASTĘPNA SESJA

### ✅ Śląskie — pełna integracja (sesja #20, commit 54547fd)
- TERYT, DPS, wyszukiwarka, filtry, mapa SVG z przełącznikiem, monitoring — ZROBIONE
- Blueprint dla kolejnych województw: `ADDING_VOIVODESHIP.md`
- **Kolejne województwo:** Dolnośląskie (WOJ=02) lub Mazowieckie (WOJ=14)

### ❌ SEO — strona nadal niewidoczna dla Google i AI!
1. **`public/robots.txt`** → `Disallow: /` (blokuje wszystko) → zmienić na `Allow: /`, `Disallow: /admin/`
2. **`app/layout.tsx:65-72`** → `robots: { index: false }` → zmienić na `index: true, follow: true`
3. **`app/sitemap.ts`** → dodać dynamiczny sitemap (315 placówek + artykuły)

### ⚠️ Senior+ GitHub Action — wymaga secretu!
- Dodać `DATABASE_URL` jako secret w GitHub → Settings → Secrets → Actions
- Bez tego cron `senior-plus-monitor.yml` nie zaimportuje nowych danych do bazy Neon

### ✅ MDDPS Kraków — ZAIMPORTOWANE (sesja #18)
- 16 placówek: 6 Domy (→ Dzienny Dom Senior+) + 10 Kluby (→ Klub Senior+)
- jst_nazwa = 'Miasto Kraków (MDDPS)' dla wszystkich 16
- Monitoring BIP: `bip.krakow.pl/?dok_id=78643&vReg=1` — ostatnia zmiana 2023-03-20 (nie pali się)
- Skrypt: `scripts/import-mddps-krakow.py`

### ✅ ŚDS usunięte z UI — ZROBIONE (sesja #18)
- Hero, wyszukiwarka, filtry, asystent, kafelki, kalkulator — ŚDS niewidoczne dla użytkownika
- Dane w DB i artykuły edukacyjne — zachowane

### ✅ FacilityTypeCards — ZROBIONE (sesja #18)
- Nowa sekcja landingu: DPS / Klub Seniora / DD Senior+ (3 kafelki, zdjęcia jako tło)
- "Klub Seniora" = etykieta w UI (w DB: typ_placowki='Klub Senior+')

### ✅ Monitoring MDDPS Kraków — ZROBIONE (commit aecc7c9)
- `.github/workflows/mddps-krakow-monitor.yml` — cron 5. każdego miesiąca
- Skrypt: `scripts/monitor-mddps-krakow.py` (tylko `requests`, bez DATABASE_URL)
- Sentinel: `raw_dane/krakow/.mddps_last_change` = `2023-03-20 14:58:55`

### ⚠️ Tarnów / Nowy Sącz — niezbadane
- Czy mają własne miejskie odpowiedniki DD Senior+ poza programem MRPiPS? (jak Kraków MDDPS)

### ✅ UTW (Uniwersytety Trzeciego Wieku) — ZROBIONE (sesja #19, commit 9af09f4)
- **Źródło:** `https://www.senioralna.malopolska.pl/wyszukiwarka-wsparcia-seniorow/`
- **robots.txt:** ✅ dozwolone
- **Baza:** 52 rekordy (id 324–375), typ_placowki='UTW', pole `www` na stronę
- **Strona:** `/utw` — hero fioletowy, szukaj, filtr powiatów, lista/mapa
- **Landing:** 4. kafelek w FacilityTypeCards (violet, GraduationCap icon)
- **Izolacja:** `getMainSearchFilter()` wyklucza UTW z głównej wyszukiwarki i liczników
- **TODO:**
  - [ ] Ręczna weryfikacja danych kontaktowych z witryn UTW
  - [ ] Po weryfikacji: zmienić disclaimer na "dane zweryfikowane bezpośrednio (2026)"
  - [ ] Monitor (GitHub Action — hash HTML tabeli UTW na senioralna.malopolska.pl)

**Pełna dokumentacja scraperów:** `SCRAPER.md`

---

Ostatnia aktualizacja: 2026-05-19 (sesja #20 — finał: PopularLocations + FacilityTypeCards multi-woj)
