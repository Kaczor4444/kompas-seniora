# Sesja #18: Senior+ UI rework, MDDPS Kraków, ŚDS ukrycie
**Data:** 16–17 maja 2026  
**Branch:** main  
**Bazuje na:** commit `e4e77a2` (sesja #17 część 2)

---

## Cel sesji

Przebudowa landingu i wyszukiwarki po dodaniu Senior+ do bazy:
- Ukrycie ŚDS z całego UI użytkownika
- Nowa sekcja kafelków typów placówek na landingu
- Warstwa Senior+ na mapie regionalnej
- Przebudowa asystenta wyboru
- Mapa cen DPS per powiat w kalkulatorze
- Poprawa wyszukiwania MOPS (TERYT fallback, disambiguacja)
- Import MDDPS Kraków (miejski odpowiednik Senior+)

---

## Zrealizowane zadania

### 1. ŚDS usunięte z UI użytkownika
ŚDS (Środowiskowe Domy Samopomocy) zostają w bazie i artykułach edukacyjnych, ale są niewidoczne dla użytkownika końcowego.

**Pliki zmodyfikowane:**
- `src/components/hero/HeroSection.tsx` — usunięto chip ŚDS z hero
- `src/components/search/SearchBar.tsx` — usunięto chip ŚDS
- `src/components/search/SearchResults.tsx` — usunięto chip ŚDS z filtrów; inicjalizacja `type=sds` → ŚDS jednak zachowane w URL mapowaniu (nie usuwamy starych linków)
- `src/components/search/FilterPanel.tsx` — usunięto opcję ŚDS z dropdownu
- `src/components/asystent/SupportAssistant.tsx` — przebudowano bez ŚDS (patrz pkt 4)
- `app/page.tsx` — hero bez chipa ŚDS
- `app/kalkulator/page.tsx` — tekst "DPS/ŚDS" → "DPS", usunięto ŚDS z opisu kroków

**Uzasadnienie:** ŚDS wymaga skierowania psychiatrycznego i jest dla innej grupy docelowej niż typowy użytkownik szukający opieki dla seniora. Trudne do wytłumaczenia w UI.

---

### 2. FacilityTypeCards — nowa sekcja landingu
**Plik:** `src/components/home/FacilityTypeCards.tsx` (nowy)

3 kafelki: DPS (emerald) / Klub Seniora (amber) / DD Senior+ (orange)

**Design:**
- Zdjęcie jako tło górnej części karty (h-44) z gradientem overlay
- Na zdjęciu: liczba placówek (badge) + typ + pełna nazwa
- Poniżej zdjęcia: opis 2-3 zdania + CTA "Przeglądaj"
- Kolorowa obramówka (border tylko, bg białe) — subtelny akcent
- Grid 1→2→3 kolumny (responsive)

**Nazwy w UI:**
- `fullName: 'Klub Seniora'` (bez plusa) — obejmuje Kluby Senior+ MRPiPS i miejskie jak MDDPS Kraków

**Dane:** `typeCounts` prop pobierany z server component `app/page.tsx` (query do DB)

---

### 3. RegionalMap — 3 warstwy typów
**Plik:** `src/components/home/RegionalMap.tsx` (przebudowany)

**Warstwy (LAYERS array):**
- DPS: emerald (#10b981) — 5-stopniowa skala
- Klub Senior+: amber (#f59e0b) — 5-stopniowa skala  
- DD Senior+: orange (#f97316) — 5-stopniowa skala

**Interakcja:**
- Pills do przełączania warstwy (`activeLayer` state)
- Tooltip pokazuje typ + liczba placówek w powiecie
- Klik → `/search?powiat=X&type=Y` (lub `?q=miasto&city=true&type=Y` dla miast na prawach powiatu)
- CTA "Znajdź właściwy MOPS/GOPS" — tylko gdy activeLayer === 'DPS'

**Props:**
- `powiatCountsByType: Record<'DPS'|'KlubSenior'|'DDSenior', Record<string, number>>`
- `typeCounts: { DPS, SDS, KlubSenior, DDSenior }`

---

### 4. SupportAssistant — przebudowa
**Plik:** `src/components/asystent/SupportAssistant.tsx`

**Przed:** DPS / ŚDS / MOPS  
**Po:** DPS / Klub Senior+ / Dzienny Dom Senior+ / MOPS

**Logika rekomendacji:**
- `green + day` → `klubSenior`
- `yellow + day` → `ddSenior`
- `red` lub `full` → `DPS`
- `ruchowa` → `DPS` (sprawność ruchowa, nie psychiatryczne)
- Niezdecydowany → `mops`

**Diagnozy usunięte:** psychiatryczne, upośledzenie (zastąpione przez "inne")

**Wynik karty:**
- Klub Senior+: emerald, checklist aktywności
- DD Senior+: orange, checklist opieki dziennej + caveat: lekki Alzheimer może OK (OPS decyduje)
- DPS: granatowy/slate, checklist całodobowej opieki

---

### 5. PriceMap — mapa cen DPS
**Pliki nowe:**
- `src/components/kalkulator/PriceMap.tsx`
- `app/api/powiat-prices/route.ts`

**API:** `GET /api/powiat-prices` → `Record<string, { avg: number; count: number }>`  
Grupuje DPS z ceną po powiecie, zwraca średnią.

**UI:**
- Mapa Małopolski (SVG, bez tła)
- 4 kolory: <7000 / 7000-8000 / 8000-9000 / 9000+ (skala emerald)
- Tooltip: "X zł/mc (Y placówek z ceną)"
- `highlightedPowiat` prop: amber border dla aktywnego powiatu z kalkulatora

---

### 6. MOPS search — TERYT fallback i disambiguacja
**Plik:** `app/api/mops/search/route.ts` (przebudowany)

**2-step search:**
1. Szukaj MopsContact bezpośrednio po `city`, `cityDisplay`, `gmina`
2. Jeśli brak → TerytLocation lookup → znajdź unikalne powiaty dla miejscowości

**Tryby odpowiedzi:**
- `success` — znaleziono bezpośrednio
- `powiat_fallback` — znaleziono przez TERYT (amber banner w UI)
- `ambiguous` — miejscowość w kilku powiatach → chips do wyboru
- `not_found` — brak

**UI disambiguacji (`app/mops/page.tsx`):**
- Chips: "pow. olkuski (1)", "pow. krakowski (2)" itd.
- Klik → `handlePowiatChip(powiat)` → filtruje wyniki

---

### 7. MDDPS Kraków — import
**Źródło:** https://bip.krakow.pl/?dok_id=78643  
**Skrypt:** `scripts/import-mddps-krakow.py`

**Zaimportowano 16 placówek:**
- 6 Miejskich Dziennych Domów Pomocy Społecznej (nr 1–6) → `typ_placowki = 'Dzienny Dom Senior+'`
- 10 Klubów Samopomocy (5 Samopomoc + 4 Aktywizacyjne + 1 Specjalistyczny) → `typ_placowki = 'Klub Senior+'`

**Wspólne pola:**
- `miejscowosc = 'Kraków'`
- `powiat = 'm. Kraków'`
- `jst_nazwa = 'Miasto Kraków (MDDPS)'`
- `email = 'sekretariat@mddps.krakow.pl'`
- Geolokalizacja: 16/16 (Nominatim wymagał usunięcia prefiksu "ul." i rozwinięcia skrótów)

**Kontekst:** Kraków buduje własną infrastrukturę zamiast korzystać z dotacji MRPiPS Senior+. MDDPS nie pojawia się w wykazie MUW, ale jest funkcjonalnie tożsamy.

---

### 8. FacilityTypeCards label
`fullName: 'Klub Senior+'` → `fullName: 'Klub Seniora'`  
`label: 'Klub Senior+'` → `label: 'Klub Seniora'`

Opis zaktualizowany: obejmuje rządowy program Senior+ i miejskie kluby (MDDPS).

---

## Stan bazy po sesji

| Typ | Sesja #17 | Sesja #18 | Źródło dodanego |
|-----|-----------|-----------|-----------------|
| DPS | 95 | 95 | — |
| ŚDS | 97 | 97 | — |
| Klub Senior+ | 79 | 89 | +10 MDDPS Kraków |
| Dzienny Dom Senior+ | 28 | 34 | +6 MDDPS Kraków |
| **ŁĄCZNIE** | **299** | **315** | |

---

## Znane problemy / do poprawy

### Monitoring BIP Kraków (MDDPS)
Strona `bip.krakow.pl/?dok_id=78643&vReg=1` pokazuje datę ostatniej edycji (2023-03-20).  
Można monitorować GitHub Action scrapującym tę datę → Issue gdy zmiana.  
**Priorytet:** niski (ostatnia zmiana 2+ lata temu).

### Tarnów / Nowy Sącz
Niezbadane — czy mają miejskie dzienne domy pomocy poza programem Senior+?

### SDS URL
URL `/search?type=sds` nadal działa (stare linki) — SearchResults mapuje go na `selectedType='ŚDS'`.  
ŚDS wyniki są pokazywane jeśli user wejdzie bezpośrednio przez URL. Decyzja: ok (nie psujemy starych linków).

---

## Następne kroki

- [ ] Dodać `DATABASE_URL` secret w GitHub (blokuje monitoring Senior+)
- [ ] SEO: odblokować robots.txt + layout.tsx `index: false`
- [ ] Monitoring BIP Kraków (GitHub Action)
- [ ] Sprawdzić Tarnów / Nowy Sącz pod kątem miejskich domów seniorów
