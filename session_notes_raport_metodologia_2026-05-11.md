# Sesja: Raport metodologia + kierunek projektu
**Data:** 11 maja 2026  
**Branch:** main  
**Tag:** `v1-raport-metodologia`  
**Commity sesji:** `0d7d330` → `96a5102`

---

## ✅ Co osiągnęliśmy

### 1. Poprawki metodologiczne raportu (odpowiedź na 4 recenzje: Gemini, ChatGPT x2, Claude-like)

| Zmiana | Plik |
|--------|------|
| KPI 4: "Luka systemowa 63k" → **"132% emerytury"** (brutto, netto ~152%) | `KpiHero.tsx` |
| Emerytura netto ~87% jako linia przerywana na 2 wykresach | `RaportCharts.tsx` |
| Top5/Bottom5 przy mapie: krakowski i miasta wykluczone | `RaportCharts.tsx` |
| N=1 w tabeli: kolor amber + etykieta "(jedyna)" | `page.tsx` |
| Insight wykresu cena DPS: % zamiast "luka wzrosła o 400 zł" | `RaportCharts.tsx` |
| Sekcja "Dla mediów" — 6 twardych faktów z podanymi źródłami | `page.tsx` |
| Benchmark OECD/Eurostat z **disclaimerem metodologicznym** (różne mianowniki) | `page.tsx` |
| Wzmocniony disclaimer luki (art. 61 ups, rola gminy) | `page.tsx` |
| Koszt inwestycyjny: 400k → **400–900k zł/miejsce** (widełki z uzasadnieniem) | `RaportCharts.tsx` |
| Legenda progów kolorystycznych w metodologii | `page.tsx` |
| Obłożenie **98,3%** (101 wolnych / 6013 miejsc, 167 oczekujących, kwiecień 2026) | `page.tsx` |
| Kolumna **% emerytury** w tabeli danych | `page.tsx` |
| Nota o profilach DPS (A-F) pod wykresem rankingu | `RaportCharts.tsx` |
| Nota "scenariusz poglądowy, nie kosztorys" przy 3135 miejscach | `RaportCharts.tsx` |
| Hero: disclaimer "tylko publiczne DPS z MUW" | `page.tsx` |
| Hero: callout **"Raport pokazuje rozmieszczenie infrastruktury DPS — nie mierzy zapotrzebowania na opiekę"** | `page.tsx` |
| Sekcja **"Czy więcej DPS to jedyne rozwiązanie?"** (deinstytucjonalizacja, RPDI) | `page.tsx` |
| Metodologia: **KRUS** (powiaty wiejskie, emerytury 30–40% niższe) | `page.tsx` |
| Metodologia: **mediana vs średnia** emerytura — profesjonalne wyjaśnienie | `page.tsx` |

### 2. Nowy wykres: Scenariusz inwestycyjny

- 17 powiatów z deficytem do 2035 (cel: śr. Małopolski 556/10k)
- ~3 135 nowych miejsc, ~1,25–2,8 mld zł (widełki 400–900k)
- Tooltip z aktualnym wskaźnikiem, projekcją 2035 i kosztem
- m. Kraków oznaczony `*` jako outlier (DPS ponadlokalne)

### 3. Nowy wykres: Małopolska na tle 16 województw

- Dane GUS BDL zmienna 10412 (miejsca stacjonarne) + populacja 80+
- Małopolska: **798/10k = 6. miejsce z 16** (poniżej średniej Polski 867/10k)
- Amber disclaimer: GUS liczy DPS+ŚDS+inne (≠ 556/10k z raportu)
- Plik: `data/gus_stacjonarne_wojewodztwa.csv`

### 4. Print/PDF

- `@media print` w globals.css — wykresy nie rozdzielane, tabela pełna
- `print:hidden` na Navbar, CookieBanner, FloatingCookieButton
- Framer Motion: wymuszenie opacity:1 przy druku
- Stopka "www.kompas-seniora.pl" na każdej stronie
- Puppeteer skrypt `/tmp/generate-pdf.js` — pełny render z animacjami

### 5. Nowe dane

| Plik | Opis |
|------|------|
| `data/gus_stacjonarne_wojewodztwa.csv` | 16 województw, miejsca stacjonarne / 10k seniorów 80+ |
| `raw_dane/wolne miejsca w dps/malopolska/` | 5 snapshotów 2023–2026 |

---

## 🔄 Punkt zwrotny — nowy kierunek projektu

**Tag:** `v1-raport-metodologia` na commit `96a5102`

### Kluczowa obserwacja:

Użytkownik uzmysłowił sobie że ścieżka decyzyjna szukającego DPS wygląda tak:

1. Widzi cenę "7 500 zł/mies" → myśli "za drogo" → **wychodzi**
2. Nie wie że senior płaci max 70% dochodu (art. 61 ups) = ~2 450 zł
3. Resztę pokrywa gmina/rodzina (ale zależy od sytuacji)
4. Jeśli rodzina musi dużo dopłacić → szuka prywatnego domu
5. Jeśli prywatny też za drogi → opieka domowa

### Dotychczasowy kierunek:
- Eksponowanie kosztów utrzymania (stawki MUW) jako "ceny"
- Raport jako główny content

### Nowy kierunek (do implementacji):
- **Kalkulator jako krok zero** w ścieżce użytkownika
- Koszt utrzymania MUW ≠ cena którą płaci rodzina
- Na karcie DPS z ceną: "przy emeryturze X senior płaci Y, rodzina/gmina Z"
- Kalkulator już istnieje (`/kalkulator`) ale jest zakopany jako osobna strona
- Żaden konkurent nie ma kalkulatora DPS w Polsce

### Konkurencja (research):
- domy.dps.pl, domyseniora.pl, domyopieki.pl, senioralna.malopolska.pl
- **Nikt nie ma kalkulatora** — to jest przewaga Kompas Seniora

---

## 📊 Stan danych wolnych miejsc

| Data | Wolne | Oczekujący | Ratio |
|------|-------|------------|-------|
| 04/2023 | 237 | 90 | 0.4× |
| 02/2024 | 202 | 118 | 0.6× |
| 05/2025 | 115 | 154 | 1.3× |
| 10/2025 | 97 | 236 | 2.4× |
| 04/2026 | **101** | **167** | **1.65×** |

Trend: wolnych −57% w 3 lata, oczekujących +86%. Monitor GitHub Actions zbiera dane co miesiąc — trend gotowy jesienią 2026.

---

## 🔧 Nowe pliki sesji

```
data/
└── gus_stacjonarne_wojewodztwa.csv   — ranking 16 województw GUS

/tmp/
└── generate-pdf.js                   — puppeteer PDF generator (lokalny)
```

---

## 🚨 Do zrobienia w następnej sesji

### Priorytet: Redesign kalkulatora w ścieżce użytkownika
- [ ] Kalkulator jako krok przed wynikami wyszukiwania (lub nad nimi)
- [ ] Mini-kalkulator na karcie każdej placówki z ceną
- [ ] Logika: "wpisz emeryturę → zobaczysz swoją realną dopłatę"

### Dane do pobrania
- [ ] Mediana emerytur ZUS — PSZ.ZUS.PL ręcznie lub UDIP (statystyki@zus.pl)
- [ ] GUS prognoza per powiat 2040 (XLSX 32MB, stat.gov.pl)
- [ ] ROPS OZPS 2024 PDF — cross-check naszych wskaźników

### SEO (nadal zablokowane!)
- [ ] robots.txt → Allow: /
- [ ] layout.tsx → robots: index: true
- [ ] sitemap.ts dynamiczny

### Monitory
- [ ] Odkomentować import do bazy w monitor-wolne-miejsca.py (po fazie testowej)
- [ ] Dodać DATABASE_URL jako secret GitHub Actions

Ostatnia aktualizacja: 2026-05-11
