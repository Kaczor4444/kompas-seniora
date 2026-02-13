# KOMPAS SENIORA - Dokumentacja Referencyjna Projektu

> Plik do użycia jako kontekst na początku nowych sesji Claude Code.
> Ostatnia aktualizacja: 2026-02-13 (sesja #2)

---

## 1. CZYM JEST PROJEKT

**Kompas Seniora** to portal informacyjny Next.js skierowany do rodzin osób starszych, pomagający znaleźć **publiczne placówki opieki** w Polsce:
- **DPS** - Domy Pomocy Społecznej (całodobowe)
- **ŚDS** - Środowiskowe Domy Samopomocy (dzienne)

**Zasady projektu:** dane z oficjalnych źródeł BIP/MOPS, bez reklam, bez rejestracji, wszystkie dane użytkownika lokalnie w przeglądarce (localStorage).

**Aktualny zasięg danych:** Małopolska + Śląsk (TERYT). Inne województwa - planowane.

**Deployment:** Vercel, domena `kompas-seniora.vercel.app`

---

## 2. TECH STACK

| Warstwa | Technologia |
|---------|------------|
| Framework | Next.js ~16 (App Router, TypeScript) |
| UI | React 19, Tailwind CSS v4 |
| Baza danych | PostgreSQL + Prisma ORM |
| Animacje | Framer Motion |
| Mapy | React-Leaflet + OpenStreetMap |
| Ikony | Lucide React + Heroicons |
| Formularze | React Hook Form + Zod |
| Search | Fuse.js (fuzzy) |
| PDF | jsPDF + jspdf-autotable |
| Email | Resend |
| Artykuły | MDX (next-mdx-remote) |
| Powiadomienia | react-hot-toast |
| Daty | date-fns |

---

## 3. STRUKTURA KATALOGÓW

```
/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Strona główna (Server Component)
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Style globalne + Tailwind v4 theme (@theme)
│   ├── admin/              # Panel administracyjny (chroniony middleware)
│   ├── api/                # API Routes
│   ├── asystent/           # Asystent wyboru opieki (4-krokowy questionnaire)
│   ├── faq/
│   ├── kalkulator/         # Kalkulator kosztów 70/30
│   ├── kontakt/
│   ├── misja/
│   ├── narzedzia/          # Checklista, ocena potrzeb (PLACEHOLDER - wkrótce)
│   ├── o-nas/
│   ├── placowka/[id]/      # Dynamiczne strony placówek
│   ├── poradniki/          # Baza artykułów MDX
│   ├── s/[token]/          # Udostępnianie list (shared links)
│   ├── search/             # Wyszukiwarka
│   └── ulubione/           # Ulubione + porównanie
├── src/
│   ├── components/
│   │   ├── hero/           # HeroSection, RegionModal, TypeTooltip
│   │   ├── home/           # RegionalMap, PopularLocationsSection, CityCard
│   │   ├── search/         # SearchResults, FacilityCard, FilterPanel
│   │   ├── filters/        # FilterSidebar, MobileFilterDrawer, PriceFilter
│   │   ├── placowka/       # PlacowkaDetails
│   │   ├── asystent/       # SupportAssistant
│   │   ├── faq/            # FAQAccordion, MiniFAQSection, faqData
│   │   ├── knowledge/      # KnowledgeCenter
│   │   ├── newsletter/     # NewsletterSection
│   │   ├── mobile/         # MobileStickyBar
│   │   └── compare/        # NoteModal
│   ├── data/               # Dane statyczne (profileopieki, miejscowosci, poland-regions)
│   ├── hooks/              # useAnalytics
│   ├── lib/                # profileLabels
│   └── utils/              # favorites, facilityNotes, generatePDF, distance
├── lib/                    # Utilities serwerowe
│   ├── prisma.ts
│   ├── teryt.ts            # Logika TERYT + scoring
│   ├── analytics.ts
│   ├── admin-security.ts
│   ├── facility-stats.ts
│   ├── popular-cities.ts
│   └── powiat-to-city.ts   # Mapowanie powiat → miasto powiatowe (dla MOPS)
├── content/articles/       # Artykuły MDX (5 kategorii)
├── prisma/schema.prisma    # Schemat bazy danych
├── components/             # Re-eksporty z src/ (Navbar, Footer, AccessibilityPanel, FacilityMap)
├── data/                   # Pliki CSV/TERYT
├── scripts/                # Skrypty importu
├── middleware.ts            # Ochrona /admin
└── tailwind.config.js
```

---

## 4. BAZA DANYCH - SCHEMAT PRISMA

### Kluczowe modele

**`Placowka`** (główna tabela)
- `id`, `nazwa`, `typ_placowki` (DPS|ŚDS)
- `ulica`, `miejscowosc`, `kod_pocztowy`, `gmina`, `powiat`, `wojewodztwo`
- `telefon`, `email`, `www`, `facebook`
- `liczba_miejsc`, `koszt_pobytu` (Float, nullable)
- `profil_opieki` (kody A-I oddzielone przecinkami)
- `latitude`, `longitude`
- `verified`, `data_aktualizacji`
- Relacje: `analytics` (1:1), `events` (1:N), `snapshots` (1:N), `ceny` (1:N)

**`TerytLocation`** - baza miejscowości TERYT (Małopolska + Śląsk)
- `nazwa`, `nazwa_normalized` (bez polskich znaków)
- `gmina`, `powiat`, `wojewodztwo`

**`SharedList`** - udostępnione listy placówek przez token URL
- `token` (unique), `ids` (string z przecinkami), `views`

**`PlacowkaAnalytics`** - zagregowane statystyki (1:1 z Placowka)
- `totalViews`, `uniqueVisitors`, `phoneClicks`, `emailClicks`, `websiteClicks`
- `favoritesCount`, `comparesCount`, `sharesCount`

**`PlacowkaEvent`** - surowe zdarzenia analityczne
- `eventType`: view | phone_click | email_click | website_click | ...

**`MopsContact`** - dane kontaktowe MOPS/OPS per miasto
- `city` (unique), `name`, `phone`, `email`, `address`, `website`

**`PlacowkaCena`** - historia cen per rok (2024, 2025, 2026)
- `kwota`, `typ_kosztu` (podstawowy|maksymalny), `zrodlo`, `verified`

**`WojewodztwoStats`** - zagregowane statystyki per województwo + rok

**`PartnerInquiry`** - zapytania o współpracę (tabela: `partner_inquiries`)

**`AdminSecurityLog`** - logi bezpieczeństwa /admin

---

## 5. ROUTING I API

### Strony (App Router)
```
/                          → Server Component → HomeClient
/search                    → SSR z pełnym filtrowaniem serwerowym
/placowka/[id]             → SSR z Prisma
/ulubione                  → Client (localStorage)
/ulubione/porownaj         → Client, 2-5 placówek
/asystent                  → SupportAssistant questionnaire
/kalkulator                → Kalkulator 70/30 + MOPS contact
/poradniki                 → Lista artykułów MDX
/poradniki/[section]/[slug]→ Artykuł MDX
/faq                       → FAQ
/s/[token]                 → Udostępniona lista
/admin/*                   → Panel admin (chroniony cookie + middleware)
```

### API Routes
```
GET  /api/search              → główne wyszukiwanie (4 tryby)
GET  /api/teryt/suggest       → autocomplete z TERYT
GET  /api/placowki            → lista placówek
GET  /api/placowki/counts     → liczniki per typ/region
GET  /api/stats               → statystyki (popular cities)
GET  /api/facilities/[id]/prices → historia cen
GET  /api/mops                → kontakt MOPS dla miasta
GET  /api/recommendations     → rekomendacje
POST /api/share               → tworzenie shared link
GET  /api/share/[token]       → odczyt shared list
POST /api/analytics/track     → śledzenie zdarzeń
GET  /api/geocode             → geokodowanie
POST /api/wspolpraca          → formularz współpracy (Resend email)
```

---

## 6. AKTUALNA STRONA GŁÓWNA — COMMAND CENTER HUB

### Struktura `app/page.tsx`
Server Component - pobiera `totalFacilities` z Prisma (revalidacja co godzinę), renderuje `<HomeClient>`.

### Sekcje `HomeClient` (w kolejności od góry)
1. **HeroSection** - główny widget wyszukiwania
2. **RegionalMap** - mapa SVG Polski (16 województw, 2 aktywne)
3. **"Jak znaleźć opiekę?"** - 3 kroki
4. **CTA Asystent** - "4 pytania w 2 minuty"
5. **KnowledgeCenter** - karuzela artykułów MDX
6. **PopularLocationsSection** - popularne miasta z licznikami
7. **MiniFAQSection** - najczęstsze pytania
8. **NewsletterSection** - ciemny motyw

### HeroSection (`src/components/hero/HeroSection.tsx`)
**Layout:** białe tło, radial gradient siatka + emerald gradient, max-w-4xl wyśrodkowany.

**Nagłówek:** H1 "Szukasz opieki / dla seniora?" (Playfair Display, 4xl/6xl), podtytuł dynamiczny per zakładka.

**Command Center Hub** - **3 zakładki** z animowanym sliderem (bg-slate-900, płynne CSS transition):

- **"Wyszukiwarka"** (domyślna):
  - TypeChip selektor: Wszystkie | DPS Całodobowe | ŚDS Dzienne
  - Input z autocomplete TERYT (debounce 300ms, min 2 znaki, max 5 sugestii, keyboard nav)
  - Walidacja: idle | valid (zielony check) | invalid (amber alert)
  - Przycisk "Szukaj" + link "Namierz moją lokalizację" (Geolocation API)
  - Szybkie skróty: Kraków, Tarnów, Nowy Sącz

- **"Kalkulator"** (nowa zakładka, środkowa):
  - Dwa pola: dochód seniora (PLN) + miejscowość (opcjonalne)
  - Wynik 70/30 pojawia się **natychmiast** bez API — czysta matematyka
  - Wizualizacja: pasek emerald (70% senior) + amber (30% na rękę) + kwoty
  - CTA: "Sprawdź DPS w [miasto] →" lub "Pełna analiza z listą placówek →"
  - Przekierowuje do `/kalkulator?income=X&city=Y`

- **"Doradca"**: CTA → `/asystent?start=true`

**Trust Bar:** "Oficjalne dane BIP" | "36 Placówek Małopolski" | "Brak opłat i reklam" (grayscale → kolor na hover)

---

## 7. KALKULATOR KOSZTÓW (`/kalkulator`)

Symulator reguły 70/30:
- **Wejście:** dochód miesięczny netto + miejscowość + województwo
- **Logika:** 70% dochodu = wkład seniora (max do kosztu DPS); 30% = "na rękę"
- Progi ustawowe: samotna ~2328 zł, w rodzinie ~1800 zł (300% kryterium dochodowego)
- Kategoryzuje DPS na: "w pełni pokryte z dochodu" vs "potrzebna dopłata gminy/rodziny"
- Wizualizacja paska (emerald=senior 70%, amber=gmina)
- Automatyczny kontakt MOPS dla wybranego miasta (`/api/mops`)
- Integracja z ulubionymi i porównaniem
- CTA → `/search?q=...&maxPrice=...`

**Pre-fill z hero kalkulatora:**
- Odczytuje URL params `?income=` i `?city=` przez `useSearchParams()`
- Gdy oba params obecne → auto-trigger `handleCalculate()` po 500ms (user ląduje i widzi wyniki od razu)
- Strona opakowana w `<Suspense>` (wymóg Next.js dla `useSearchParams` przy SSG)

**Disclaimer (double-visible):**
- Stały baner `border-2 border-amber-300` **nad formularzem** — zawsze widoczny
- Wzmocniony baner w wynikach — amber-100 bg, ikona w żółtym kwadracie, uppercase bold

---

## 8. WYSZUKIWARKA (`/search`)

### Parametry URL
`q`, `type` (dps|śds|all), `woj`, `powiat`, `partial`, `min`, `max`, `free`, `care` (kody A-I), `sort`, `lat`, `lng`, `near`

### 4 tryby (priorytetyzacja)
1. **Geoloc** (`near=true`) - pobiera wszystkie, sortuje haversine
2. **Województwo** (`woj=...` bez `q`) - filtruje po województwie
3. **TERYT** - szuka w `TerytLocation.nazwa_normalized` → pobiera powiaty → filtruje `Placowka.powiat`
4. **Fallback** - dla województw bez TERYT, filtruje po `miejscowosc`

### Sortowanie
`name_asc` | `name_desc` | `price_asc` (null na koniec) | `price_desc` | `distance`

---

## 9. PROFILE OPIEKI - KODY

| Kod | DPS | ŚDS |
|-----|-----|-----|
| A | Niepełnosprawność intelektualna | Niepełnosprawność intelektualna |
| B | - | Zaburzenia psychiczne |
| C | Przewlekle psychicznie chorzy | Niepełnosprawność fizyczna |
| D | - | Podeszły wiek |
| E | Podeszły wiek | Niewidomi i słabowidzący |
| F | Przewlekle somatycznie chorzy | Niesłyszący i słabosłyszący |
| G | Dzieci niepełnosprawne intelektualnie | - |
| H | Młodzież niepełnosprawna intelektualnie | - |
| I | Niepełnosprawni fizycznie | - |

---

## 10. DESIGN SYSTEM

### Paleta kolorów (Tailwind v4 `@theme` w globals.css)
- **Primary Emerald:** `#059669` (główny brand), skala 50-800
- **Secondary Blue:** `#2563eb`
- **Accent Coral:** `#F43F5E`
- **Neutral Stone:** 50=`#FAFAF9`, 100=`#F5F5F4`, 900=`#1C1917`
- **Warning Amber:** `#F59E0B`

### Typografia
- **Serif (headings, logo):** Playfair Display (700, 900)
- **Sans (base):** Geist Sans (next/font)
- **Mono:** Geist Mono

### Konwencje UI
- Border radius: `rounded-xl` / `rounded-2xl` / `rounded-3xl`
- Karty: `bg-white`, border `border-stone-100`, shadow `shadow-sm`
- Focus: `outline: 2px solid #059669`
- DPS badge: `bg-emerald-100 text-emerald-800`
- ŚDS badge: `bg-blue-100 text-blue-800`

### Accessibility Panel (12 opcji w localStorage)
`isHighContrast`, `isLargeFont`, `linksUnderlined`, `reduceMotion`, `dyslexiaFriendly`, `textSpacing`, `hideImages`, `bigCursor`, `lineHeight`, `textAlignLeft`, `saturation`, `tooltips`

---

## 11. LOCALSTORAGE - DANE UŻYTKOWNIKA

| Klucz | Dane | Limit |
|-------|------|-------|
| `kompas-seniora-favorites` | Ulubione placówki (FavoriteFacility[]) | max 5 |
| `facility-notes` | Notatki + oceny gwiazdkowe (FacilityNote{}) | brak |
| `accessibility-settings` | Ustawienia dostępności | - |
| `asystent-checklist-*` | Checklisty z asystenta | - |

Synchronizacja między komponentami przez `CustomEvent('favoritesChanged')` i `CustomEvent('facilityNotesChanged')`.

---

## 12. PANEL ADMINISTRACYJNY

Chroniony przez:
1. `middleware.ts`: `ADMIN_ENABLED=true` w env, inaczej 404
2. Cookie `admin-auth=true`

**Sekcje:** Dashboard, Lista placówek (CRUD), Ceny (import CSV, eksport Excel), Analytics (funnel, geograficzne, temporalne), Security log.

---

## 13. CO JEST GOTOWE / CO W TOKU

### Gotowe i działające
- Baza danych (PostgreSQL + Prisma, dane Małopolska + Śląsk)
- Strona główna z HeroSection + wszystkie sekcje
- Wyszukiwarka (4 tryby, filtry, sortowanie, mapa Leaflet)
- Strony placówek
- Ulubione + notatki + oceny + porównanie + sharing
- Kalkulator 70/30 z MOPS contact
- Asystent 4-krokowy
- Panel dostępności (12 opcji)
- Artykuły MDX (5 kategorii)
- Panel administracyjny
- Cookie banner, strony prawne

### Placeholdery / w przygotowaniu
- `/narzedzia/checklista-dokumentow` - "wkrótce"
- `/narzedzia/ocena-potrzeb` - "wkrótce"
- Wiele artykułów MDX - "w przygotowaniu"
- TERYT dla pozostałych województw
- Trust Bar: hardkodowane "36 Placówek Małopolski"

### Znane problemy / technical debt
- `typescript.ignoreBuildErrors: true` w next.config.mjs
- Liczne `console.log('🔍 DEBUG ...')` w kodzie produkcyjnym
- `robots: { index: false }` - strona NIE jest indeksowana przez Google
- Pliki `.backup`, `.backup2` w repo
- `typeFilter` potencjalnie niezdefiniowany w search/page.tsx fallback
- Zdjęcia placówek: placeholder Unsplash, brak prawdziwych

---

## 14. ZMIENNE ŚRODOWISKOWE (potrzebne)

```
DATABASE_URL=         # PostgreSQL connection string
ADMIN_ENABLED=true    # Włączenie panelu admin
RESEND_API_KEY=       # Wysyłanie emaili
NEXT_PUBLIC_GA_ID=    # Google Analytics
ADMIN_PASSWORD=       # (lub inna forma auth admin)
```

---

## 15. KONTEKST BIZNESOWY

**Docelowi użytkownicy:**
- Dzieci/rodziny szukające opieki dla starzejącego się rodzica
- Sami seniorzy (stąd panel dostępności jako priorytet)
- Opiekunowie prawni/nieformalni

**Propozycja wartości:**
- Jedyne źródło agregujące oficjalne dane z BIP/MOPS bez reklam
- Transparentny kalkulator kosztów (reguła 70/30 - prawna)
- Bez rejestracji - prywatność użytkownika

**Monetyzacja:** Na razie brak (non-profit w założeniu). Potencjalnie: współpraca z MOPS/gminami, dotacje NGO.

---

## 16. HISTORIA ZMIAN (changelog sesji)

### Sesja #2 — 2026-02-13

**Decyzja strategiczna:** Kalkulator 70/30 jako "lead magnet" zamiast zastępowania wyszukiwarki. Wyszukiwarka zostaje, kalkulator dołącza jako 3. zakładka w Command Center Hub.

**Zmiany:**

1. **`src/components/hero/HeroSection.tsx`** — 3 zakładki w Command Center Hub:
   - `activeTab` type: `'search' | 'calculator' | 'assistant'`
   - Nowa zakładka **"Kalkulator"** (inline, bez API, instant 70/30)
   - Animowany slider tabs przeliczony na 3 pozycje
   - Placeholder text `slate-300 → slate-400 + font-medium` (lepiej widoczny)
   - Ikony w polach kalkulatora `slate-300 → slate-400`

2. **`app/kalkulator/page.tsx`** — integracja z hero:
   - `useSearchParams()` odczytuje `?income=` i `?city=` z URL
   - `useEffect` auto-trigger `handleCalculate()` po 500ms gdy oba params obecne
   - Opakowanie w `<Suspense>` (wymóg Next.js)
   - Stały disclaimer `border-2 border-amber-300` nad formularzem
   - Wzmocniony disclaimer w wynikach (amber-100, ikona w kwadracie)

3. **`package.json`** — `next-mdx-remote` v5.0.0 → v6.0.0 (Vercel blokował CVE)

4. **`PROJEKT_DOKUMENTACJA.md`** — ten plik (dokumentacja referencyjna)

---

*Ten plik jest dokumentacją referencyjną do użycia na początku nowych sesji.*
