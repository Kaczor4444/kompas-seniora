# KOMPAS SENIORA - Dokumentacja Referencyjna Projektu

> Plik do użycia jako kontekst na początku nowych sesji Claude Code.
> Ostatnia aktualizacja: 2026-04-22 (sesja #10 - SEO audit i AI bot tracking)

---

## 🚨 KRYTYCZNE - DO NAPRAWY W NASTĘPNEJ SESJI (2026-04-22)

### ❌ PODWÓJNA BLOKADA CRAWLERÓW - STRONA NIEWIDOCZNA!

**Problem:** Strona jest **całkowicie zablokowana** dla wszystkich crawlerów (Google, Bing, ChatGPT, Claude, Perplexity). Nawet dodany dzisiaj tracking botów AI działa, ale boty **nie mają dostępu do treści**.

**Dwie warstwy blokady:**

1. **robots.txt** (`/public/robots.txt`):
```
User-agent: *
Disallow: /   ← BLOKUJE CAŁĄ STRONĘ!
```

2. **Metadata w layout.tsx** (`/app/layout.tsx:65-72`):
```typescript
robots: {
  index: false,    // ❌ BLOKUJE INDEKSOWANIE
  follow: false,   // ❌ BLOKUJE PODĄŻANIE ZA LINKAMI
}
```

**Efekt:**
- Zero ruchu organicznego z Google
- Boty AI (ChatGPT, Perplexity) nie mogą czytać artykułów
- Strona nie pojawi się w wynikach wyszukiwania
- 184 placówki + 30 artykułów = niewidoczne

---

### 🎯 PLAN NAPRAWY (następna sesja - 30-40 minut roboty):

#### 1. **FIX robots.txt** (5 minut)
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://kompas-seniora.vercel.app/sitemap.xml
```

#### 2. **FIX layout.tsx robots meta** (2 minuty)
Zmienić linijki 65-72 na:
```typescript
robots: {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
  },
},
```

#### 3. **Dodać dynamiczny sitemap.ts** (30 minut)
Utworzyć `/app/sitemap.ts`:
- 184 placówki (z `updatedAt`, priority: 0.7)
- ~30 artykułów MDX (z `publishedAt`, priority: 0.8)
- ~15 static pages (priority: 0.5-0.9)
- Strona główna (priority: 1.0)

**Po tych 3 krokach:** Strona będzie widoczna dla crawlerów! 🚀

---

### 📋 INNE PRIORYTETY (do zrobienia później):

**HIGH (tydzień):**
- [ ] Unique metadata dla 184 placówek - `generateMetadata()` w `/app/placowka/[id]/page.tsx`
- [ ] Canonical URLs (meta alternates)
- [ ] Open Graph images (default + per-page)
- [ ] Metadata dla static pages (`/search`, `/kontakt`, `/ulubione`, etc.)

**MEDIUM (miesiąc):**
- [ ] LocalBusiness schema dla każdej placówki (rich snippets w Google Maps)
- [ ] Breadcrumb schema (rich snippets w wynikach wyszukiwania)
- [ ] Image alt text audit
- [ ] Performance audit (Core Web Vitals)

**Status weryfikacji:** Pełny raport SEO znajduje się w podsumowaniu sesji #10 (kontekst dla claude-code).

---

## ✅ Organization Schema i AI Bot Tracking (2026-04-22)

### 🏢 Structured Data dla SEO

**Lokalizacja:** `/app/layout.tsx` (linijki 87-127)

**Dodano dwa JSON-LD schemas:**

1. **Organization schema:**
```typescript
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Kompas Seniora",
  "url": "https://kompas-seniora.vercel.app",
  "logo": "https://kompas-seniora.vercel.app/logo.png",
  "description": "Wyszukiwarka publicznych placówek opieki dla seniorów...",
  "areaServed": {
    "@type": "State",
    "name": "Małopolskie",
    "containedIn": { "@type": "Country", "name": "Polska" }
  },
  "serviceType": ["Wyszukiwarka domów opieki", "Informacje o placówkach..."],
  "keywords": "dom opieki, senior, DPS, ŚDS, MOPS, Kraków, Małopolska"
}
```

2. **LocalBusiness schema:**
```typescript
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Kompas Seniora",
  "description": "Kompleksowa wyszukiwarka placówek opieki dla seniorów...",
  "areaServed": [
    { "@type": "AdministrativeArea", "name": "Województwo Małopolskie" }
  ],
  "knowsAbout": ["Dom Pomocy Społecznej (DPS)", "Środowiskowy Dom Samopomocy (ŚDS)", ...]
}
```

**Korzyści:**
- Lepsze zrozumienie przez wyszukiwarki czym jest strona
- Rich snippets w wynikach Google
- AI crawlery (ChatGPT, Claude) łatwiej ekstraktują informacje
- Pojawienie się w knowledge panels

---

### 🤖 AI Bot Tracking System

**Architektura:**

**1. Middleware detekcja** (`/middleware.ts`):
- Wykrywa AI boty: ChatGPT, GPTBot, Claude, Perplexity, Google-Extended, Bard, Bytespider, CCBot
- Wykrywa search boty: Googlebot, Bingbot, DuckDuckBot, Baiduspider, YandexBot
- Fire-and-forget tracking (nie spowalnia requestów)
- **Zachowano:** Oryginalną ochronę admin panel (`ADMIN_ENABLED` env var)

**2. API Endpoint** (`/app/api/analytics/bot-track/route.ts`):
- POST endpoint do logowania wizyt botów
- Zapisuje do `AppEvent` table:
  - `eventType`: `bot_visit_ai_bot` lub `bot_visit_search_bot`
  - `metadata`: `{ botName, userAgent, path, referer }`

**3. Admin Dashboard** (`/app/admin/analytics`):
- Nowy komponent: `BotStats.tsx`
- Zaktualizowano: `page.tsx` (dodano import i wyświetlanie)
- Zaktualizowano: `app/api/admin/analytics/route.ts` (query dla botStats)

**Dashboard pokazuje:**
- **Overview cards:**
  - Total bot visits (wszystkie)
  - AI bots visits (% z total)
  - Search bots visits (% z total)
- **Top 10 najczęściej odwiedzających botów** (z nazwami: ChatGPT, Googlebot, etc.)
- **Top 10 najczęściej indeksowanych stron** (które URL-e boty oglądają)
- **Info box** z wyjaśnieniem co trackujemy

**Korzyści:**
- Monitoring jak strona jest indeksowana przez AI i tradycyjne wyszukiwarki
- Rozróżnienie AI bots (ChatGPT, Claude) vs search bots (Googlebot)
- Data-driven decyzje: które strony są crawlowane, które nie
- Gotowość na AI-powered search (Perplexity, ChatGPT search mode)

**Commit:** `d48e3ec` - "feat: Dodano Organization schema i AI bot tracking"

**Zmienione pliki (6):**
- `app/layout.tsx` - dodano Organization + LocalBusiness JSON-LD
- `middleware.ts` - detekcja botów + tracking (zachowano admin protection)
- `app/api/analytics/bot-track/route.ts` - NEW endpoint
- `app/admin/analytics/_components/BotStats.tsx` - NEW komponent
- `app/admin/analytics/page.tsx` - integracja BotStats
- `app/api/admin/analytics/route.ts` - query dla botStats

**⚠️ UWAGA:** Bot tracking działa, ale **boty są blokowane przez robots.txt i robots meta** - nie mają dostępu do contentu! Po naprawie blokad w następnej sesji, tracking pokaże rzeczywiste wizyty z dostępem do treści.

---

## ⚠️ TYMCZASOWE ZMIANY DO USUNIĘCIA PO TESTACH

### 🧪 TEST MODE - Hardcoded geolokalizacja (2026-03-09)

**Lokalizacja:** `/src/components/search/SearchBar.tsx` (linia ~306)

**Problem:** Testowanie geolokalizacji z UK (brak prawdziwego GPS w Polsce)

**Rozwiązanie tymczasowe:**
- Hardcoded lokalizacja: **Kraków** (50.0647°N, 19.9450°E)
- Aktywowany przez `const TEST_MODE = true`

**JAK USUNĄĆ PO TESTACH:**

**Opcja 1 (szybka):**
```typescript
const TEST_MODE = false; // ← zmień true na false
```

**Opcja 2 (czyszczenie):**
Usuń cały blok kodu między komentarzami:
```
// ⚠️ TODO: USUNĄĆ PO TESTACH! ⚠️
...
// KONIEC HARDCODED TEST MODE
```

**Weryfikacja:** Po usunięciu, przycisk "Namierz moją lokalizację" powinien prosić o pozwolenie GPS w przeglądarce.

---

### 📍 Funkcja geolokalizacji - co dodano (2026-03-09)

**Lokalizacja:** `/app/search/page.tsx` (linia ~87, TRYB 3)

**Nowa logika:**
1. **Domyślny promień:** 50km
2. **Auto-rozszerzenie:** Do 100km jeśli < 3 wyniki
3. **Komunikaty:**
   - "Znaleźliśmy X placówek w promieniu 50km od Ciebie"
   - "Znaleźliśmy tylko 2 placówki w promieniu 50km. Pokazujemy także 7 placówek w promieniu 100km"

**Parametry do dostrojenia:**
```typescript
const DEFAULT_RADIUS_KM = 50;    // Domyślny promień
const MIN_RESULTS = 3;            // Próg auto-rozszerzenia
const EXTENDED_RADIUS_KM = 100;  // Rozszerzony promień
```

---

### ✅ Weryfikacja z oficjalnym wykazem województwa (2026-03-16)

**Problem:** Brak weryfikacji czy placówki w bazie są zgodne z oficjalnym rejestrem województwa.

**Rozwiązanie:** Dodano pola weryfikacyjne do modelu `Placowka`:

```prisma
model Placowka {
  // ...
  oficjalne_id      Int?        // l.p. z oficjalnego wykazu wojewódzkiego
  nazwa_oficjalna   String?     // Pełna nazwa z PDF (nazwa + adres)
  // ...
  @@index([oficjalne_id])
}
```

**Źródło danych:** Wykaz DPS województwa małopolskiego (PDF z 18.02.2026)

**Workflow:**
1. ✅ Dodano pola `oficjalne_id` i `nazwa_oficjalna` do schematu
2. ✅ Integracja w panelu admina (`/admin/placowki`)
   - Formularz dodawania/edycji - zielona sekcja "Weryfikacja z oficjalnym wykazem"
   - Kolumna "ID PDF" w tabeli (druga kolumna)
   - Klikalne nagłówki do sortowania (ID bazy ↕ ID oficjalne)
3. ✅ Automatyczne wypełnienie (skrypt `scripts/fill-dps-official-data.js`)
   - 31 DPS auto-matched (pewne dopasowania po powiecie + ulicy)
4. 🔄 Ręczne wypełnienie pozostałych (~49 DPS) - **W TRAKCIE**

**Progress weryfikacji DPS:**
- **36/85 DPS** wypełnione (42%)
  - 31 automatycznie (skrypt)
  - 5 ręcznie (l.p. 1-5)
- **49/85 DPS** do uzupełnienia (58%)

**Kluczowa koncepcja:**
- `oficjalne_id` = **numer rejestru wojewódzkiego** (stały identyfikator)
- `nazwa_oficjalna` = **pełna nazwa z adresem** (do weryfikacji zmian)
- Ten sam `oficjalne_id` łączy dane z różnych źródeł (wykaz placówek, cennik, strony www)

**Plany:**
- [ ] Dokończyć weryfikację DPS (49 placówek)
- [ ] Powtórzyć proces dla ŚDS (95 placówek)
- [ ] Skrypt porównujący nowe wykazy z bazą (automatyczna detekcja zmian)

---

## ✅ Unifikacja systemu artykułów - badge zamiast featured (2026-03-17)

**Problem:** System wyświetlania artykułów był niespójny między stroną główną a stroną `/poradniki`:
- Strona główna (`KnowledgeCenter.tsx`) używała nowego systemu: `badge`, `featuredOrder`, `isActive`
- Strona poradników (`PoradnikiContent.tsx`) używała starego systemu: `featured: boolean`
- Niektóre artykuły w `articles.ts` miały `featured: true`, inne `badge: 'POLECAMY'`

**Rozwiązanie:** Kompletna unifikacja na nowy system `badge` + `featuredOrder` + `isActive`.

**Zmiany:**
1. ✅ Usunięto `featured?: boolean` z typu `Article` (`types/article.ts`)
2. ✅ Usunięto `featured?: boolean` z `ArticleMetadata` (`lib/articleHelpers.ts`)
3. ✅ Usunięto `featured: true` z 15 artykułów w `src/data/articles.ts`
4. ✅ Zaktualizowano `PoradnikiContent.tsx`:
   - Sortowanie popularnych artykułów: priorytet `badge`, potem `featuredOrder`
   - Wyświetlanie badge: wspiera wszystkie typy (POLECAMY, NOWE, NOWY ARTYKUŁ, WKRÓTCE)
   - Animacja pulse dla POLECAMY i NOWY ARTYKUŁ

**Nowy system (jedyny):**
```typescript
{
  slug: 'wybor-placowki',
  sectionId: 'wybor-opieki',
  category: 'Wybór opieki',
  badge: 'POLECAMY',           // Opcjonalny badge
  thumbnail: '/images/...',     // Opcjonalny custom thumbnail
  featuredOrder: 1,            // Kolejność na stronie głównej (niższe = pierwsze)
  isActive: true               // false = pokazuje "WKRÓTCE"
}
```

**Typy badge:**
- `POLECAMY` - zielony bg, animacja pulse
- `NOWE` - niebieski bg
- `NOWY ARTYKUŁ` - zielony bg, animacja pulse
- `WKRÓTCE` - szary bg (automatyczny gdy `isActive: false`)

**Commit:** `01b1d4a` - "feat: Unifikacja systemu wyświetlania artykułów (badge zamiast featured)"

**Zmienione pliki (9):**
- `types/article.ts` - usunięto `featured` z `Article`
- `lib/articleHelpers.ts` - usunięto `featured` z `ArticleMetadata`
- `src/data/articles.ts` - usunięto `featured: true` z 15 artykułów
- `components/poradniki/PoradnikiContent.tsx` - nowa logika sortowania i wyświetlania
- `app/page.tsx`, `src/components/HomeClient.tsx`, `src/components/knowledge/KnowledgeCenter.tsx` - integracja
- `components/articles/ArticleLayout.tsx`, `next.config.mjs` - korekty

**Wynik:**
- ✅ System spójny między stroną główną a stroną poradników
- ✅ Jeden system wyświetlania badge'y
- ✅ Wszystkie typy zgodne
- ✅ Build przechodzi bez błędów

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
│   ├── hooks/              # useAnalytics, useAppAnalytics, useReturnVisitor, useScrollTracking
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
├── components/             # Re-eksporty z src/ (Navbar, Footer, AccessibilityPanel, FacilityMap, ReturnVisitorTracker)
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
- `rodzaj_miejscowosci` (RM): 01=wieś, 96=miasto na prawach powiatu, 98=miasto, 00=część/dzielnica
- `teryt_sym`, `teryt_sympod` - identyfikatory TERYT
- **⚠️ AKTUALNY STAN:** 13,831 lokalizacji (WSZYSTKIE miejscowości włącznie z RM=00)
  - RM=00 (część/dzielnica): 10,606 (77%)
  - RM=01 (wieś): 1,832
  - RM=03 (osada): 1,179
  - RM=96 (miasto PP): 63
  - RM=98 (miasto): 4
- **UWAGA:** Sesja #5 planowała filtrowanie do głównych miejscowości, ale to NIE zostało wykonane

**`SharedList`** - udostępnione listy placówek przez token URL
- `token` (unique), `ids` (string z przecinkami), `views`

**`PlacowkaAnalytics`** - zagregowane statystyki (1:1 z Placowka)
- `totalViews`, `uniqueVisitors`, `phoneClicks`, `emailClicks`, `websiteClicks`
- `favoritesCount`, `comparesCount`, `sharesCount`

**`PlacowkaEvent`** - surowe zdarzenia analityczne
- `eventType`: view | phone_click | email_click | website_click | ...
- `language String?` — `navigator.language` usera (np. "pl-PL", "en-US")

**`AppEvent`** - zdarzenia na poziomie aplikacji (nie powiązane z konkretną placówką)
- `eventType`: empty_results | filter_applied | scroll_depth | return_visit | cross_powiat_view | calculator_start | calculator_result | calculator_no_results | advisor_start | advisor_step | advisor_completed | advisor_abandoned
- `language String?`, `metadata Json?`

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
POST /api/analytics/track     → śledzenie zdarzeń (PlacowkaEvent, per placówka)
POST /api/analytics/app-track → śledzenie zdarzeń aplikacji (AppEvent, allowlist)
GET  /api/admin/analytics     → dane do dashboardu (languageStats + localInsights)
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

**Trust Bar:** "Oficjalne dane BIP" | "180 Placówek Małopolski" (⚠️ hardcoded - trzeba zaktualizować) | "Brak opłat i reklam" (grayscale → kolor na hover)

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
   - **Priorytet exact match** — najpierw szuka dokładnej nazwy, partial tylko gdy 0 wyników
   - **Priorytet "m. {miasto}"** — jeśli jest powiat "m. kraków", używa TYLKO jego (ignoruje wioski "Kraków" w innych powiatach)
   - **Fallback dla powiatu bez danych w DB** — jeśli "m. tarnów" → 0 wyników → partial search → bierze top county który ma placówki
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
- **Główna czcionka (cały projekt):** Lato (400, 700, 900)
- **Serif (dostępna, ale nieużywana):** Playfair Display (700, 900)
- **Mono (dostępna, ale nieużywana):** Geist Mono
- **Dostępne alternatywy:** Quicksand (dla logo), Open Sans, Inter

**Obecnie:** Cały projekt używa Lato jako domyślnej czcionki - senior-friendly, ciepła i czytelna. Zobacz sekcję "10.5 SYSTEM CZCIONEK" poniżej dla szczegółów konfiguracji.

### Konwencje UI
- Border radius: `rounded-xl` / `rounded-2xl` / `rounded-3xl`
- Karty: `bg-white`, border `border-stone-100`, shadow `shadow-sm`
- Focus: `outline: 2px solid #059669`
- DPS badge: `bg-emerald-100 text-emerald-800`
- ŚDS badge: `bg-blue-100 text-blue-800`

### Accessibility Panel (12 opcji w localStorage)
`isHighContrast`, `isLargeFont`, `linksUnderlined`, `reduceMotion`, `dyslexiaFriendly`, `textSpacing`, `hideImages`, `bigCursor`, `lineHeight`, `textAlignLeft`, `saturation`, `tooltips`

---

## 10.5. SYSTEM CZCIONEK - KONFIGURACJA I MIEJSCA UŻYCIA

### Aktualny stan (2026-02-20)
**Cały projekt używa Lato jako jedynej czcionki.** Lato wybrano po testach senior-friendly - jest ciepła, przyjazna i bardzo czytelna dla osób starszych.

### Miejsca konfiguracji czcionek

#### 1. `app/layout.tsx` - Ładowanie czcionek
```typescript
import { Quicksand, Playfair_Display, Geist, Geist_Mono } from "next/font/google";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Body tag:
<body className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${quicksand.variable} ...`}>
```

#### 2. `app/globals.css` - Konfiguracja Tailwind
```css
@theme inline {
  --font-sans: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-serif: 'Playfair Display', serif;
  --font-lato: 'Lato', sans-serif;
  --font-quicksand: 'Quicksand', sans-serif;
  --font-open-sans: 'Open Sans', sans-serif;
  --font-inter: 'Inter', sans-serif;
  ...
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-lato), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

### Wagi czcionek w projekcie
Używane wagi Lato:
- `font-normal` (400) - dla body text, paragrafów
- `font-bold` (700) - dla nagłówków średnich, wyróżnień
- `font-black` (900) - dla głównych nagłówków H1/H2 + `tracking-tight` dla lepszego wyglądu

### Dlaczego Lato?
Po testach z seniorami wybrano Lato, ponieważ:
- ✅ Ciepła, przyjazna atmosfera (mniej "korporacyjna" niż Open Sans)
- ✅ Duży x-height = małe litery dobrze widoczne
- ✅ Wyraźne różnice między literami (a, o, e rozpoznawalne)
- ✅ Świetna czytelność w długich tekstach
- ✅ Dostępne wagi: 400 (regular), 700 (bold), 900 (black)

### Jak zmienić czcionkę w przyszłości

Jeśli chcesz zmienić czcionkę na inną (np. z Quicksand na Montserrat):

**Krok 1: Dodaj nową czcionkę w `app/layout.tsx`**
```typescript
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  display: "swap",
});

// Dodaj do body className
<body className={`... ${montserrat.variable} ...`}>
```

**Krok 2: Zmień w `app/globals.css`**
```css
@theme inline {
  --font-sans: 'Montserrat', -apple-system, ...;
  --font-montserrat: 'Montserrat', sans-serif;
}

body {
  font-family: var(--font-montserrat), -apple-system, ...;
}
```

**To wszystko!** Wszystkie komponenty automatycznie przełączą się na nową czcionkę.

### Pliki gdzie NIGDY nie występuje `font-serif` ani inne czcionki

Po czyszczeniu z 2026-02-20, **wszystkie komponenty używają domyślnej czcionki** (Quicksand przez Tailwind). Nie ma już żadnych:
- `font-serif` (stara czcionka Playfair Display)
- `font-mono`
- inline `font-family`

Jeśli chcesz zmienić czcionkę w konkretnych komponentach (np. nagłówki serif, body sans), musisz ręcznie dodać klasy Tailwind:
- `className="font-serif"` dla Playfair Display
- `className="font-mono"` dla Geist Mono

### Historia zmian czcionek
- **2026-02-20 (późniejsza aktualizacja):** Zmiana na Lato po testach senior-friendly - priorytet czytelność dla seniorów
- **2026-02-20 (rano):** Przejście z mieszanki Playfair Display (nagłówki) + Geist Sans (body) na 100% Quicksand dla spójności z logo
- **Przed 2026-02-20:** Playfair Display dla nagłówków (`font-serif`), Geist Sans dla body

### Dostępne czcionki alternatywne
W `layout.tsx` załadowane są również:
- **Quicksand** - dla ewentualnego użycia w logo/nagłówkach (geometryczna, zaokrąglona)
- **Open Sans** - bardzo czytelna, neutralna alternatywa
- **Inter** - nowoczesna, zaprojektowana dla UI/ekranów
- **Playfair Display** - serif dla akcentów (jeśli potrzeba)

Zmiana między nimi wymaga tylko edycji `globals.css` (2 linie).

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

**Sekcje:** Dashboard, Lista placówek (CRUD), Ceny (import CSV, eksport Excel), Analytics (funnel, geograficzne, temporalne, język, lokalne insighty), Security log.

### Analytics Dashboard — komponenty
- **`LanguageStats`** (`app/admin/analytics/_components/LanguageStats.tsx`) — wykres słupkowy rozkładu języków przeglądarki; wyróżnia języki niepolskie jako "sygnał diasporyczny"
- **`LocalInsights`** (`app/admin/analytics/_components/LocalInsights.tsx`) — 6 paneli lokalnych insightów:
  1. **Cross-powiat** — kiedy kliknięta placówka jest z innego powiatu niż wybrany filtr
  2. **Puste wyniki** — kombinacje filtrów które nie dały wyników ("białe plamy")
  3. **Ścieżka do kontaktu** — ile placówek user obejrzał zanim zadzwonił/napisał
  4. **Scroll depth** — jak głęboko użytkownicy scrollują listę wyników (25/50/75/100%)
  5. **Powracający użytkownicy** — via localStorage (bez cookies), dni między wizytami
  6. **Popularne kombinacje filtrów** — co najczęściej łączone (powiat+profil)

### Śledzenie zdarzeń (GDPR-safe)
- Nie przechowujemy IP dla userów (tylko dla logów /admin)
- `navigator.language` — GDPR-safe, bez consent
- Identyfikacja powracających przez `localStorage` — nie wymaga cookies
- Śledzenie sesji przez `sessionStorage` — nie persystuje

### Hooki analityczne
- **`useAnalytics`** — zdarzenia per placówka (view, phone/email/website click, z `language`)
- **`useAppAnalytics`** — 5 metod: `trackEmptyResults`, `trackFilterApplied`, `trackScrollDepth`, `trackReturnVisit`, `trackCrossPowiatView`
- **`useReturnVisitor`** — localStorage key `kompas-seniora-last-visit`, auto-fire `return_visit`
- **`useScrollTracking`** — milestones 25/50/75/100%, Set do deduplikacji

---

## 13. CO JEST GOTOWE / CO W TOKU

### Gotowe i działające
- Baza danych (PostgreSQL + Prisma, dane Małopolska + Śląsk)
- Strona główna z HeroSection + wszystkie sekcje
- Wyszukiwarka (4 tryby, filtry, sortowanie, mapa Leaflet)
- Strony placówek
- Ulubione + notatki + oceny + porównanie + sharing
- Kalkulator 70/30 z MOPS contact + tracking zdarzeń
- Asystent (Doradca) 4-krokowy + tracking zdarzeń
- Panel dostępności (12 opcji)
- Artykuły MDX (5 kategorii)
- Panel administracyjny + rozszerzony analytics dashboard
- Cookie banner, strony prawne
- Analytics: język usera, 6 lokalnych insightów (cross-powiat, puste wyniki, ścieżka do kontaktu, scroll depth, powracający, kombinacje filtrów)
- Vercel Analytics (`@vercel/analytics`) w layout
- Mapa: custom SVG piny (DPS=zielony, ŚDS=ciemnoniebieski), uproszczony popup z profilem opieki i ceną

### Placeholdery / w przygotowaniu
- `/narzedzia/checklista-dokumentow` - "wkrótce"
- `/narzedzia/ocena-potrzeb` - "wkrótce"
- Wiele artykułów MDX - "w przygotowaniu"
- TERYT dla pozostałych województw
- Trust Bar: hardkodowane "180 Placówek Małopolski" (było "36" - nieaktualne)

### Znane problemy / technical debt
- `typescript.ignoreBuildErrors: true` w next.config.mjs
- Liczne `console.log('🔍 DEBUG ...')` w kodzie produkcyjnym
- `robots: { index: false }` - strona NIE jest indeksowana przez Google
- Pliki `.backup`, `.backup2` w repo
- `typeFilter` potencjalnie niezdefiniowany w search/page.tsx fallback
- Zdjęcia placówek: placeholder Unsplash, brak prawdziwych
- **TERYT: 13,831 lokalizacji zamiast ~1,901** - baza zawiera WSZYSTKIE miejscowości (77% to RM=00 części/dzielnice), dokumentacja sesji #5 wspominała filtrowanie, ale nie zostało wykonane

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

### Sesja #9 — 2026-03-17

**Temat:** Unifikacja systemu wyświetlania artykułów - przejście z `featured: boolean` na system `badge` + `featuredOrder` + `isActive`.

**Problem:**
Projekt miał dwa różne systemy wyświetlania artykułów:
- **KnowledgeCenter.tsx** (strona główna) - używał nowego systemu z `badge`, `featuredOrder`, `isActive`
- **PoradnikiContent.tsx** (strona `/poradniki`) - używał starego systemu z `featured: boolean`
- W `articles.ts` część artykułów miała `featured: true`, część miała `badge: 'POLECAMY'`

To powodowało niezgodności w wyświetlaniu i sortowaniu artykułów.

**Rozwiązanie:**
Kompletna unifikacja na nowy system - usunięto całkowicie `featured` i wszędzie zastosowano `badge` + `featuredOrder`.

**Zmienione pliki:**
1. **`types/article.ts`** - usunięto `featured?: boolean` z typu `Article`
2. **`lib/articleHelpers.ts`** - usunięto `featured` z `ArticleMetadata` i `getPlaceholderMetadata()`
3. **`src/data/articles.ts`** - usunięto `featured: true` z 15 artykułów:
   - `wybor-opieki`: rodzaje-opieki, wybor-placowki, typy-dps, proces-przyjecia-dps, zgoda-seniora
   - `dla-opiekuna`: organizacja-opieki, wsparcie-demencja, udogodnienia-dom
   - `dla-seniora`: internet-bezpieczenstwo, zdrowie-po-70
   - `finanse-prawne`: dodatek-pielegnacyjny, zasilek-opiekunczy, dofinansowania-2025, prawa-mieszkancow, umowy-placowki
4. **`components/poradniki/PoradnikiContent.tsx`**:
   - Zaktualizowano sortowanie popularnych artykułów (linia 96-107): priorytet `badge`, potem `featuredOrder`
   - Zaktualizowano wyświetlanie badge (linia 236-249): wspiera wszystkie typy badge z odpowiednimi kolorami i animacją

**Nowy system (jedyny poprawny):**
```typescript
{
  slug: 'wybor-placowki',
  sectionId: 'wybor-opieki',
  category: 'Wybór opieki',
  badge: 'POLECAMY',                    // Opcjonalny badge (POLECAMY|NOWE|NOWY ARTYKUŁ|WKRÓTCE)
  thumbnail: '/images/senior_opiekunka.webp',  // Opcjonalny custom thumbnail
  featuredOrder: 1,                     // Kolejność na stronie głównej (niższe = pierwsze)
  isActive: true                        // false = automatyczny badge "WKRÓTCE"
}
```

**Typy badge:**
- `POLECAMY` - zielony bg (`bg-green-500`), animacja `animate-pulse`
- `NOWE` - niebieski bg (`bg-blue-500`)
- `NOWY ARTYKUŁ` - zielony bg (`bg-green-500`), animacja `animate-pulse`
- `WKRÓTCE` - szary bg (`bg-gray-500` lub `bg-blue-500`), automatyczny gdy `isActive: false`

**Wynik:**
- ✅ System spójny między KnowledgeCenter (strona główna) a PoradnikiContent (strona `/poradniki`)
- ✅ Jeden sposób definiowania priorytetów artykułów
- ✅ Wszystkie typy TypeScript zgodne
- ✅ Build przechodzi bez błędów
- ✅ Badge'y wyświetlają się poprawnie z animacjami

**Commit:** `01b1d4a` - "feat: Unifikacja systemu wyświetlania artykułów (badge zamiast featured)"

---

### Sesja #8 — 2026-03-16

**Temat:** Weryfikacja z oficjalnym wykazem DPS województwa małopolskiego.

*[Zawartość sesji #8 bez zmian]*

---

### Sesja #5 — 2026-02-20

**⚠️ UWAGA:** Ta sesja opisuje planowane zmiany, ale **filtrowanie TERYT NIE zostało wykonane w produkcji**.
Aktualnie baza zawiera 13,831 lokalizacji (wszystkie RM).

**Temat:** Reimport TERYT z filtrowaniem RM (rodzaj miejscowości) - usunięcie "części" miejscowości z bazy TERYT.

**Problem:**
Baza TERYT zawierała wszystkie miejscowości z GUS (~13,833), w tym:
- **Główne miejscowości** (RM=01 wsie, RM=96 miasta PP, RM=98 miasta): 1,901 szt
- **Części miejscowości** (RM=00 - kolonie, dzielnice, przysiółki): 11,932 szt

To powodowało że wyszukiwanie pokazywało np. 12 powiatów dla "zarzecze" (gdy w rzeczywistości są tylko 2 wsie o tej nazwie). Reszta to części/dzielnice innych miejscowości.

**Rozwiązanie:**
1. Zaktualizowano schemat Prisma - dodano kolumny do `TerytLocation`:
   - `rodzaj_miejscowosci` (String?) - kod RM z SIMC
   - `teryt_sym` (String?) - symbol TERYT
   - `teryt_sympod` (String?) - symbol nadrzędny TERYT

2. Utworzono nowy skrypt `scripts/import-teryt-filtered.js`:
   - Importuje tylko RM=01, 96, 98 (główne miejscowości)
   - Pomija RM=00 (części/kolonie) - 11,932 wpisów
   - Dodaje metadane TERYT dla przyszłej geolokalizacji

3. Zreimportowano dane TERYT:
   - **Przed:** ~13,833 lokalizacji (wszystkie)
   - **Po:** 1,901 lokalizacji (tylko główne)
   - Przykład "zarzecze": z 12 powiatów → **2 powiaty** (zgodnie z GUS)

**Zmienione pliki:**
- `prisma/schema.prisma` — dodano 3 kolumny do TerytLocation
- `scripts/import-teryt-filtered.js` — nowy skrypt z filtrowaniem RM

**Weryfikacja:**
```javascript
// Test query pokazał poprawne działanie:
SELECT nazwa, powiat, rodzaj_miejscowosci
FROM TerytLocation
WHERE nazwa_normalized = 'zarzecze';

// Wynik: 2 wiersze (olkuski RM=01, nowosądecki RM=01)
```

**Znane ograniczenie:**
1 placówka (DPS w Nowym Dworze, powiat krakowski) ma miejscowość będącą "częścią" (RM=00). Autocomplete nie zasugeruje tej lokalizacji. Planowane rozwiązanie: **OPCJA 1b** - import wszystkich RM, ale priorytetyzacja głównych w UI.

**Następne kroki (zaplanowane):**
- Reimport WSZYSTKICH miejscowości (RM=00 włącznie)
- Autocomplete: pokazuj główne na górze, części na dole
- Multi-powiat banner: agreguj tylko po głównych miejscowościach

---

### Sesja #4 — 2026-02-20

**Temat:** Unifikacja czcionek - przejście na czcionkę senior-friendly (Lato).

**Kontekst:**
Projekt używał wcześniej mieszanki czcionek: Playfair Display (serif) dla nagłówków i Geist Sans dla body. W pierwszej iteracji zmieniono na Quicksand (dla spójności z logo), ale po testach okazało się że Quicksand (geometric sans) jest mniej czytelna dla seniorów przy długich tekstach. Po porównaniu 3 opcji (Open Sans, Lato, Inter) wybrano **Lato** - ciepłą, przyjazną czcionkę z doskonałą czytelnością.

**Zmienione pliki:**
1. `app/globals.css` — dodano `--font-sans: 'Quicksand'` w `@theme`, zmieniono `body { font-family }` na Quicksand
2. `src/components/knowledge/KnowledgeCenter.tsx` — usunięto `font-serif` z tytułów kafelków artykułów
3. `components/poradniki/PoradnikiContent.tsx` — zmiana `font-serif` → `font-black` + `tracking-tight` w nagłówku "Potrzebujesz pomocy w opiece?" i tytułach artykułów
4. `app/faq/page.tsx` — wszystkie nagłówki z `font-serif` → `font-black`
5. `app/misja/client.tsx` — wszystkie nagłówki z `font-serif` → `font-black`
6. `app/ulubione/porownaj/page.tsx` — usunięto `font-serif`
7. `app/ulubione/page.tsx` — usunięto `font-serif`
8. `components/AccessibilityPanel.tsx` — usunięto `font-serif`
9. `src/components/FacilityNotesDisplay.tsx` — usunięto `font-serif`
10. `src/components/asystent/SupportAssistant.tsx` — usunięto `font-serif`
11. `src/components/FacilityNotesModal.tsx` — usunięto `font-serif`
12. `src/components/placowka/PlacowkaDetails.tsx` — usunięto `font-serif`
13. `app/kontakt/page.tsx` — dostosowano style do landing page (emerald zamiast primary, font-black zamiast font-serif)

**Nowa dokumentacja:**
- Dodano sekcję **10.5 SYSTEM CZCIONEK** w `PROJEKT_DOKUMENTACJA.md` z instrukcjami jak zmienić czcionkę w przyszłości

**Testowane czcionki:**
- Quicksand (geometric, zaokrąglona) - spójna z logo, ale mniej czytelna dla seniorów
- Open Sans (neutralna, uniwersalna) - bardzo dobra, bezpieczny wybór
- Lato (ciepła, przyjazna) - **wybrana** ✓
- Inter (nowoczesna, UI-focused) - doskonała dla interfejsów

**Wynik:**
- Cały projekt używa teraz jednej, spójnej czcionki: **Lato** (senior-friendly, ciepła, bardzo czytelna)
- Usuniętych ~30+ wystąpień `font-serif` z aktywnych komponentów
- Dodane alternatywne czcionki do layout.tsx (Quicksand, Open Sans, Inter) - gotowe do szybkiej zmiany
- Zaktualizowana dokumentacja z mapą konfiguracji czcionek i uzasadnieniem wyboru

---

### Sesja #3 — 2026-02-15

**Temat:** Analytics (język + lokalne insighty), tracking Kalkulatora i Doradcy, redesign mapy, naprawa wyszukiwarki.

**Krytyczny bugfix:**
- `POST /api/analytics/track` — brak handlera POST (był tylko GET), żadne zdarzenia nie były zapisywane do DB. Naprawione.

**Nowe modele Prisma:**
- `PlacowkaEvent.language String?` — język przeglądarki usera
- `AppEvent` — zdarzenia aplikacyjne (nie per placówka), z allowlistą typów

**Nowe pliki:**
- `app/api/analytics/app-track/route.ts` — endpoint AppEvent z allowlistą
- `app/admin/analytics/_components/LanguageStats.tsx` — rozkład języków w panelu
- `app/admin/analytics/_components/LocalInsights.tsx` — 6 lokalnych insightów
- `components/ReturnVisitorTracker.tsx` — null-render client component w layout
- `src/hooks/useAppAnalytics.ts` — 5 metod trackowania app-level
- `src/hooks/useReturnVisitor.ts` — localStorage, auto-fire po powrocie
- `src/hooks/useScrollTracking.ts` — milestones 25/50/75/100%

**Zmienione pliki:**
1. `app/api/analytics/track/route.ts` — dodano POST handler
2. `src/hooks/useAnalytics.ts` — `navigator.language` w każdym evencie
3. `app/api/admin/analytics/route.ts` — `languageStats` + `localInsights` (6 query)
4. `app/admin/analytics/page.tsx` — `LanguageStats` + `LocalInsights` w UI
5. `app/layout.tsx` — `<Analytics />` (Vercel) + `<ReturnVisitorTracker />`
6. `src/components/search/SearchResults.tsx` — empty results tracking, filter combos, scroll depth, cross-powiat click
7. `src/components/placowka/PlacowkaDetails.tsx` — `sessionStorage` counter `kompas-session-views`, `viewsInSession` w eventach kontaktowych
8. `app/kalkulator/page.tsx` — `calculator_start/result/no_results` events, `getIncomeBracket()` helper
9. `src/components/asystent/SupportAssistant.tsx` — `advisor_start/step/completed/abandoned` events
10. `components/FacilityMap.tsx`:
    - Custom SVG pin icons przez `L.divIcon` (DPS `#10b981` zielony, ŚDS `#1e3a8a` ciemnoniebieski)
    - Klastry: gradient zielony↔ciemnoniebieski (zamiast czerwony↔niebieski)
    - Popup uproszczony: typ + nazwa + profile opieki (kolorowe pills) + cena (DPS only) + przycisk
    - `profil_opieki` dodane do interface Facility
11. `app/search/page.tsx` — naprawa TERYT: exact match first → priorytet "m. {miasto}" → fallback partial gdy 0 wyników w DB

**Kontekst decyzji:**
- Język usera (GDPR-safe) jako sygnał diasporyczny (Polacy za granicą szukający opieki)
- `AppEvent` oddzielony od `PlacowkaEvent` żeby nie robić `placowkaId` nullable
- `localStorage` dla powracających (bez cookies, bez consent)
- Mapa: DPS zielony / ŚDS granatowy — spójność z design systemem strony

---

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

## 21. MIASTA NA PRAWACH POWIATU - MAPOWANIE POWIATÓW

**Problem:** W Polsce istnieją miasta na prawach powiatu (powiaty grodzkie), które mają odrębne nazwy w systemie TERYT, ale w bazie placówek są przypisane do powiatów ziemskich (land counties).

### Przykład: Kraków

**W bazie TERYT:**
- `m. Kraków` (miasto na prawach powiatu, rodzaj_miejscowosci: 96)
- `Kraków` w powiecie `tarnowski` (wieś o tej samej nazwie)

**W bazie placówek (Postgres):**
- Wszystkie placówki w Krakowie mają `powiat = "krakowski"` (powiat ziemski)

### Problem wyszukiwania

Gdy użytkownik:
1. Wpisuje "Kraków" → autocomplete pokazuje "Kraków (Powiat m. Kraków)"
2. Klika na sugestię → URL: `/search?q=Kraków&powiat=m.+Kraków`
3. Bez mapowania → brak wyników (bo w bazie jest "krakowski", nie "m. Kraków")

### Rozwiązanie (sesja #6, 2026-03-01)

**Dodano mapowanie w `app/search/page.tsx`:**

```typescript
// TRYB 1 (z query) - linia ~190
if (powiatParam) {
  let mappedPowiat = powiatParam;
  const normalized = normalizePolish(powiatParam);

  // Kraków: "m. Kraków", "Kraków" → "krakowski"
  if (normalized === 'm. krakow' || normalized === 'krakow') {
    mappedPowiat = 'krakowski';
  }
  // Nowy Sącz: "m. Nowy Sącz", "Nowy Sącz" → "nowosądecki"
  else if (normalized === 'm. nowy sacz' || normalized === 'nowy sacz') {
    mappedPowiat = 'nowosądecki';
  }
  // Tarnów: "m. Tarnów", "Tarnów" → "tarnowski"
  else if (normalized === 'm. tarnow' || normalized === 'tarnow') {
    mappedPowiat = 'tarnowski';
  }

  uniquePowiaty = [normalizePolish(mappedPowiat)];
}

// TRYB 5 (powiat only) - linia ~95
// Analogiczne mapowanie dla wyszukiwania tylko po powiecie (bez query)
```

**Usunięto z hardcoded listy powiatów w `src/components/search/SearchResults.tsx`:**
- Usunięto: `"Kraków", "Nowy Sącz", "Tarnów"` (linia 151)
- Uzasadnienie: miasta na prawach powiatu są automatycznie mapowane na odpowiadające im powiaty ziemskie

### Miasta na prawach powiatu w Małopolsce

| Miasto TERYT | Powiat TERYT | Mapowanie na powiat w bazie |
|--------------|--------------|------------------------------|
| m. Kraków | m. Kraków | → krakowski |
| m. Nowy Sącz | m. Nowy Sącz | → nowosądecki |
| m. Tarnów | m. Tarnów | → tarnowski |

### Wnioski

1. **Zawsze mapuj miasta na prawach powiatu** w logice wyszukiwania (zarówno TRYB 1 jak i TRYB 5)
2. **Nie dodawaj nazw miast** do listy powiatów w dropdown - użyj tylko nazw powiatów ziemskich
3. **Użyj normalizacji** (`normalizePolish()`) aby obsłużyć różne warianty: "m. Kraków", "Kraków", "m. Krakow", "Krakow"
4. **Sprawdź inne województwa** kiedy będą dodawane - inne miasta na prawach powiatu będą wymagały podobnego mapowania

### Testowanie

Po wprowadzeniu poprawek, wszystkie następujące wyszukiwania powinny dawać te same wyniki:
- `/search?q=Kraków&powiat=m.+Kraków` ✅
- `/search?q=Kraków&powiat=Kraków` ✅
- `/search?q=Kraków&powiat=krakowski` ✅
- `/search?powiat=m.+Kraków` (bez query) ✅
- `/search?powiat=Kraków` (bez query) ✅
- `/search?powiat=krakowski` (bez query) ✅

---

## 22. AKTUALNY STAN BAZY DANYCH (MARZEC 2026)

### 📊 Podsumowanie statystyk

**Placówki: 184 (wszystkie DPS i ŚDS z Małopolski)**
- DPS: 89
- ŚDS: 95
- Województwa: Małopolskie (180), Śląskie (4)
- Powiaty w Małopolsce: 21
- Z ceną: 90 (49%)
- Z geolokalizacją: 184 (100%)

**Top 5 powiatów (Małopolska):**
1. krakowski - 44 placówki
2. tarnowski - 16 placówek
3. wielicki - 11 placówek
4. wadowicki - 10 placówek
5. miechowski - 10 placówek

**TERYT: 13,831 lokalizacji (WSZYSTKIE miejscowości Małopolski)**
- RM=00 (część/dzielnica): 10,606 (77%)
- RM=01 (wieś): 1,832
- RM=03 (osada): 1,179
- RM=96 (miasto na prawach powiatu): 63
- RM=98 (miasto): 4
- Inne: 147

### ⚠️ Różnice z dokumentacją

1. **Liczba placówek:** 184 (↑ z 147) - dodano wszystkie placówki z Małopolski
2. **TERYT nie przefiltrowany:** Sesja #5 planowała filtrowanie do ~1,901 głównych miejscowości, ale to NIE zostało wykonane - baza ma WSZYSTKIE 13,831 lokalizacji
3. **Trust Bar nieaktualny:** UI pokazuje "36 Placówek" - powinno być 180+

### 🔄 Zaktualizowane pliki dokumentacji
- `CLAUDE.md` - zaktualizowano statystyki
- `PROJEKT_DOKUMENTACJA.md` - ten plik (sekcja 22 dodana marzec 2026)

---

*Ten plik jest dokumentacją referencyjną do użycia na początku nowych sesji.*
