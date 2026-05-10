# Sesja: Raport Dostępności DPS w Małopolsce
**Data:** 11 maja 2026  
**Branch:** main  
**Commity sesji:** `0efb6e4` → `8614ad0`

---

## ✅ Co osiągnęliśmy

### 1. Nowa strona `/raport` — od zera do produkcji

**Dane:**
- Pobrano z GUS BDL: populacja 80+ per powiat (zmienne 76024+76025), lata 2015–2024
- Pobrano z GUS BDL: prognozy 65+ i 80+ na 2025/2030/2035/2040 (subject P4359)
- Pobrano z GUS BDL: emerytury ZUS per województwo 2015–2025 (zmienna 155058, P2860)
- Wyliczono wskaźnik dostępności DPS: miejsca/10k seniorów 80+ per powiat (22 powiaty)
- Wyliczono lukę finansową: nominalną i systemową (art. 61 ups — 70% rule)

**Strona `/raport` zawiera:**
- Hero z ciemnym tłem, gradient przejście do jasnej treści
- 4 KPI karty z **animowanymi licznikami** (easeOutCubic, staggered fade-in)
- Top 3 najgorsze / najlepsze powiaty ziemskie
- **Mapa choropletyczna** Małopolski (reużyty SVG ze strony głównej) — 5 poziomów koloru
- Toggle 2024 ↔ 2035 na mapie (scenariusz braku inwestycji)
- Top 5 / Bottom 5 obok mapy
- Wykres rankingowy — 22 powiaty, linia referencyjna średniej Małopolski
- Wykres luki systemowej (art. 61 ups) z oznaczeniem N<3
- Wykres trendu emerytur 2020–2025 z linią referencyjną min. DPS
- Tabela surowych danych z wszystkimi 22 powiatami
- Sekcja pobierania CSV (CC BY 4.0)
- Metodologia z 4 kartami źródeł (miejsca DPS, koszty, populacja, emerytura)
- Uwagi interpretacyjne (5 disclaimerów)
- Footer CTA

**SEO / techniczne:**
- `opengraph-image.tsx` — dynamiczny OG image (1200×630, edge runtime)
- `metadata.openGraph` + `metadata.twitter`
- JSON-LD `Dataset` schema (creator, license CC-BY-4.0, distribution CSV)
- CSV skopiowane do `public/data/` (dostępne do pobrania)
- Link w nawigacji desktop i mobile (ikona BarChart2)

---

### 2. Poprawki metodologiczne (po audycie Opus 4.7)

| Problem | Przed | Po |
|---------|-------|-----|
| Populacja bazowa | wiek poprodukcyjny (60+K/65+M) | **80+** (właściwa dla DPS) |
| Konwencja wskaźnika | seniorów/miejsce | **miejsc/10k seniorów** (standard) |
| Tylko DPS | DPS + ŚDS | **tylko DPS** (ŚDS to nie tylko seniorzy) |
| Luka finansowa | nominalna (mediana − emerytura) | **systemowa** (mediana − 70% emerytury, art. 61 ups) |
| KPI dysproporcja | krakowski vs chrzanowski (outlier!) | **miechowski vs chrzanowski = 8×** |
| Filtr outlierów | tylko krakowski | **krakowski + m.Kraków + m.Tarnów + m.Nowy Sącz** |
| Filtr case-sensitive | `r.powiat !== 'krakowski'` | `.toLowerCase()` — m. Kraków nie prześlizgiwał się |
| Prognoza 2035 | "prognoza" | **"scenariusz braku inwestycji"** |
| Emerytura | bez dopisku | **brutto** (kwota netto większa luka) |
| N<3 w luce | ukryte | oznaczone ⚠ + przezroczyste słupki |

### 3. Naprawione błędy merytoryczne

- **Insight emerytura:** "emerytura zrównała się z min. DPS" → NIEPRAWDA. Emerytura 4 085 zł, min. DPS ~4 500 zł — **brakuje 415 zł/mies.**
- **KPI 4 luka:** N=1 olkuski (nierzetelne) → **limanowski N=5 (63 tys. zł/rok)**
- **Top 3 najlepsze:** krakowski 2068 (outlier) → **miechowski 1365, limanowski 1077, proszowicki 975**
- **Top 3 najgorsze:** m. Kraków jako #3 (miasto ≠ powiat ziemski) → **nowotarski 208**
- **Filtr ceny w wyszukiwarce:** max 10 000 zł ucinał 9 najdroższych DPS (10 001–12 400 zł) → **max 13 000 zł**

### 4. Poprawki UX / design

- Kolorystyka: z 4 kolorów (biały/czerwony/amber/orange) → **3 neutralne + 1 alarmowy (red)**
- Kontrast: `bg-white/5` (przeźroczyste, niewidoczne) → **`bg-slate-800`** (solidne)
- Tekst: `text-slate-400` → **`text-slate-300`** w hero, `text-white` w Top 3
- Mapa: `max-w-lg` na środku → **mapa + Top 5/Bottom 5 obok** (2 kolumny)
- Wykres rankingowy: height 400px → **560px** (czytelność mobile)
- Insight bary: szare tło → **lewy border emerald** (lepsza hierarchia)
- Metodologia: 3 karty → **4 karty** (dodano koszty DPS z podstawą prawną art. 60 ups)
- Liczby w Top 3: kolorowe → **pill `bg-slate-700`** (czytelne, nie krzykliwe)

---

## 🔄 Co zostało do zrobienia

### Raport #1 (dostępność) — do domknięcia
- [ ] Trend cen DPS 2023→2026 — mamy dane w `PlacowkaCena`, nie dodany do /raport
- [ ] Benchmark emerytur: Małopolskie vs inne województwa (dane są w CSV, filtrowany tylko jeden region)
- [ ] Mapa a11y: `tabIndex`, `onFocus`, `aria-label` z wartością na `<path>` (nawigacja klawiaturą)
- [ ] Scatter plot: korelacja cena vs dostępność per powiat (z istniejących danych)
- [ ] Link "Szukaj placówki w tym powiecie" w tooltipie mapy
- [ ] ZUS per powiat — dane niedostępne przez API; opcja: wniosek do statystyka@zus.pl

### Raport #2 — koszty DPS 2023–2026
- [ ] Nowa podstrona `/raport/koszty`
- [ ] Trend cen per powiat (tempo wzrostu)
- [ ] Porównanie z inflacją
- [ ] Dane do pobrania

### SEO — KRYTYCZNE (strona nadal zablokowana!)
- [ ] `public/robots.txt` — zmienić `Disallow: /` na `Allow: /`, `Disallow: /admin/`
- [ ] `app/layout.tsx` — `robots: { index: false }` → `index: true`
- [ ] `app/sitemap.ts` — dynamiczny sitemap (186 placówek + artykuły + /raport)

### Content
- [ ] Artykuł `drafts/koszty-dps-kto-placi-2026-05-07.md` — gotowy do `/scrub` → `/optimize` → publikacji
- [ ] `generateMetadata()` dla 186 placówek w `/app/placowka/[id]/page.tsx`

### Monitory (lipiec/sierpień 2026)
- [ ] Odkomentować import do bazy w `monitor-wolne-miejsca.py` (po fazie testowej)
- [ ] Dodać `DATABASE_URL` jako secret GitHub Actions dla wolne-miejsca workflow

---

## 📊 Stan danych po sesji

| Plik | Rekordy | Opis |
|------|---------|------|
| `data/wskaznik_nasycenia_malopolska.csv` | 22 powiaty | Wskaźnik dostępności + luka finansowa |
| `data/gus_populacja_malopolska.csv` | 616 rekordów | 80+ per powiat, historia + prognozy |
| `data/gus_emerytury_wojewodztwa.csv` | 528 rekordów | Emerytury ZUS per województwo 2015–2025 |
| `public/data/wskaznik_nasycenia_malopolska.csv` | = | Publiczny download (CC BY 4.0) |
| `public/data/gus_populacja_malopolska.csv` | = | Publiczny download |

**Kluczowe liczby raportu:**
- Najgorszy powiat: **chrzanowski** — 171 miejsc/10k seniorów 80+
- Najlepszy powiat (ziemski): **miechowski** — 1365/10k
- Dysproporcja: **8×**
- Emerytura Małopolska 2025: **4 085 zł** brutto
- Min. DPS: **~4 500 zł** → brakuje 415 zł/mies.
- Luka systemowa (art. 61): **63 tys. zł/rok** (limanowski, N=5)

---

## 🔧 Nowe pliki sesji

```
app/raport/
├── page.tsx              — server component, dane z CSV
├── RaportCharts.tsx      — wykresy (recharts + framer motion)
├── RaportMap.tsx         — mapa choropletyczna SVG
├── KpiHero.tsx           — animowane KPI karty (client)
├── AnimatedCounter.tsx   — licznik easeOutCubic (client)
└── opengraph-image.tsx   — OG image (edge runtime)

scripts/
├── fetch-gus-bdl.py      — pobiera populację 80+ z GUS BDL API
├── fetch-gus-emerytury.py — pobiera emerytury z GUS BDL API
├── calculate-saturation-index.py — liczy wskaźnik nasycenia
├── monitor-gus-bdl.py    — monitor nowych danych populacji
└── monitor-gus-emerytury.py — monitor nowych danych emerytur

.github/workflows/
├── gus-bdl-monitor.yml   — cron 1. każdego miesiąca 9:00 UTC
└── gus-emerytury-monitor.yml — cron 1. każdego miesiąca 9:30 UTC
```
