# SESSION NOTES

---

## ✅ SESJA #15: 2026-05-10 — Import wolnych miejsc + ulepszenia monitorów

### Co zrobiliśmy:

#### 1. Fix importu wolnych miejsc — 88 placówek, 0 niedopasowanych (było 72/26)
Commit: `7db704b`

**Naprawione problemy matchowania:**
- **Gmina Borzęcin/Sękowa/Grybów + Miasto i Gmina Niepołomice** — wchodziły do branchy city_rows (prefix "gmina"/"miasto"), ale `match_city_by_capacity` obsługiwało tylko m. Kraków/NS/Tarnów → brak dopasowania. Fix: detekcja city_rows po powiatu (nie po nazwie), `MANUAL_MAPPINGS_BY_ID` z ID bazy
- **Kraków** — DPS są w bazie z `powiat='krakowski'`, skrypt szukał tylko w `'m. Kraków'`. Fix: address-based matching po `ul./os. + numer` dla wszystkich krakowskich DPS (oba powiaty). Grupowanie wierszy po adresie zamiast po `is_new_facility` — obsługuje multi-typ DPS
- **Miłosierny Samarytanin** — cudzysłów `''` psował klucz w MANUAL_MAPPINGS. Fix: klucz `"miłosierny samarytanin"` bez cudzysłowu
- **Zgromadzenie Sióstr Najświętszej Rodziny** — MANUAL_MAPPING wskazywał na zły DPS (Trójcy zamiast Wadowice ul. Lwowska 31). Naprawione
- **Plik .xls 2023** — openpyxl nie obsługuje starego formatu. Fix: fallback przez pandas + szukanie tytułu w 8 wierszach (nie 3)

**Wyniki:**
- 88 placówek dopasowanych (67 po nazwie + 14 Kraków po adresie + 7 NS/Tarnów po pojemności)
- Historia: **551 rekordów** w `PlacowkaWolneMiejsca` dla 5 dat (2023-04, 2024-02, 2025-05, 2025-10, 2026-04)

#### 2. Cron workflow: 1. i 15. → 8:00 UTC (10:00 polskiego czasu)
Commity: `97553da`, `8553ec8`

#### 3. Issue przy braku nowego pliku (wolne-miejsca monitor)
Commit: `2382390`
- `monitor-dps-pdf.py` już tworzył Issue przy braku zmian — dodano analogicznie do `monitor-wolne-miejsca.py`

#### 4. Cztery ulepszenia monitorów (konsultacja z Opus 4.7)
Commit: `d368ec3`

| # | Zmiana | Skrypt |
|---|--------|--------|
| 1 | Błąd pobierania → otwarty Issue `⚠️` z treścią błędu | oba |
| 2 | Trend wolnych miejsc w raporcie: `📈 +234 vs poprzedni okres` | wolne-miejsca |
| 3 | "Brak zmian" → zamknięty Issue (historia jest, lista czysta) | oba |
| 4 | Gdy nowy plik już pobrany w tym miesiącu → pomija kolejne sprawdzenia + miesięczny marker `.wolne_miejsca_month` | wolne-miejsca |

Cron wolnych miejsc: `1,8,15` każdego miesiąca

#### 5. Stagnacja, walidacja PDF, bezpieczna faza testowa
Commit: `b87c85c`

**#5 — stagnacja XLSX:**
- Przy "brak zmian" Issue teraz pokazuje `(dane sprzed X dni)`
- Jeśli >45 dni bez aktualizacji → otwarty Issue `🟠 brak aktualizacji od X dni`

**#7 — walidacja struktury PDF (gdy MUW zmieni układ kolumn):**
- <80 lub >105 rekordów → `🔴 anomalia struktury PDF`, exit 1, brak SQL patcha
- <30% rekordów z emailem lub <70% z nazwą → alert o możliwej zmianie kolumn
- Nowa funkcja `validate_pdf_rows()` wywoływana przed porównaniem z bazą

**Faza testowa:**
- Import do bazy wyłączony w `monitor-wolne-miejsca.py` (zakomentowany subprocess)
- Plan: 2-3 miesiące obserwacji raportów → odkomentować gdy wszystko OK

**Bonusy techniczne:**
- `datetime.utcnow()` → `datetime.now(timezone.utc)` (deprecated w Python 3.12)
- `concurrency: group` w obu workflow → brak wyścigów przy równoległych runach

### Commity tej sesji:
- `7db704b` — fix: import wolnych miejsc — 88 placówek, 0 niedopasowanych
- `97553da` — chore: workflow cron 2x w miesiącu — 1. i 15.
- `8553ec8` — chore: workflow cron 10:00 czasu polskiego
- `2382390` — fix: wolne miejsca monitor — Issue także przy braku nowego pliku
- `d368ec3` — feat: monitory — 4 ulepszenia
- `b87c85c` — feat: monitory — stagnacja, walidacja PDF, bezpieczna faza testowa

### Stan bazy po sesji:
- **DPS Małopolska:** 91 placówek
- **ŚDS:** 95 placówek
- **Łącznie:** 186 placówek
- **PlacowkaWolneMiejsca:** 551 rekordów (5 dat: 2023-04, 2024-02, 2025-05, 2025-10, 2026-04)
- **PlacowkaCena:** 338 rekordów (2023–2026)

---

## 🚨 TODO — NASTĘPNA SESJA (priorytety)

### KRYTYCZNE — SEO (strona niewidoczna dla Google i AI!)
1. **`public/robots.txt`** — zmienić z `Disallow: /` na `Allow: /`, `Disallow: /admin/`
2. **`app/layout.tsx`** — zmienić `robots: { index: false }` na `index: true`
3. **`app/sitemap.ts`** — dodać dynamiczny sitemap (186 placówek + artykuły)

### CONTENT — Artykuł gotowy do publikacji
- `drafts/koszty-dps-kto-placi-2026-05-07.md` — ~2800 słów, status: DRAFT
- Do zrobienia: `/scrub` → `/optimize` → dodać do `src/data/articles.ts` → stworzyć MDX

### MONITORY — Po fazie testowej (lipiec/sierpień 2026)
- Odkomentować import do bazy w `monitor-wolne-miejsca.py`
- Dodać `DATABASE_URL` jako secret w GitHub Actions dla wolne-miejsca workflow
- Rozważyć #2 (trend z bazy), #6 (fallback NS/Tarnów), #8 (walidacja SQL patch)

### INNE
- Metadata dla 186 placówek (`generateMetadata()` w `/app/placowka/[id]/page.tsx`)
- Canonical URLs

---

## ✅ SESJA #14: 2026-05-09 — Wolne miejsca DPS + profil opieki na karcie placówki

### Co zrobiliśmy:

#### 1. Profil opieki na karcie placówki (`PlacowkaDetails.tsx`)
- **Problem:** profil niewidoczny bo DPS ma pełny tekst w `profil_opieki` (np. "dla osób przewlekle somatycznie chorych"), nie kody jak ŚDS ("A,B")
- Nowa funkcja `parseDpsProfile()` — obsługuje oba formaty, czyści liczby miejsc z tekstu ("90 miejsc" → ""), wieloliniowe wpisy
- Profil wyświetlany jako niebieskie pill-badges bezpośrednio pod adresem w nagłówku
- Fix: `getProfileOpiekiNazwyDPS` / `getProfileOpiekiNazwySDS` zamiast generic `getProfileOpiekiNazwy`
- Fix: NFZ → "Zapytaj" (DPS bez ceny) / "Bezpłatne" (ŚDS) w quick stats i sidebarze

#### 2. Monitor wolnych miejsc DPS — GitHub Actions
- Nowy plik: `scripts/monitor-wolne-miejsca.py`
  - Pobiera `wolne_miejsca_w_dps.xlsx` z MUW Małopolska (SSL disabled)
  - Hash SHA-256 — Issue tworzone TYLKO gdy plik się zmienił (zero spamu)
  - Parsuje multi-row nagłówki XLSX (format MUW)
  - Liczy wolne miejsca per powiat (bez podwójnego liczenia — tylko wiersze LP)
- Nowy workflow: `.github/workflows/wolne-miejsca-monitor.yml`
  - Cron: 1. każdego miesiąca o 9:00 UTC
  - `workflow_dispatch` z opcją force
  - Po wykryciu nowego pliku → automatycznie wywołuje `import-wolne-miejsca.py`
- Pierwszy pobrany plik: **stan na 30.04.2026, 7482 wolnych miejsc w Małopolsce**

#### 3. Przycisk w panelu admina
- Nowy endpoint: `app/api/admin/trigger-wolne-miejsca/route.ts`
- Nowy komponent: `app/admin/WolneMiejscaMonitorButton.tsx` (zielony, checkbox force)
- Admin page: nowy blok pod PDF monitorem

#### 4. Schemat bazy danych — `PlacowkaWolneMiejsca`
```prisma
model PlacowkaWolneMiejsca {
  placowkaId, data_stanu, typ_opieki  ← unique constraint
  liczba_miejsc, wolne_ogolem, wolne_kobiety, wolne_mezczyzni
  oczekujacych, czas_oczekiwania_dni
}
```
- Historia jak `PlacowkaCena` — wiele wpisów per placówka per data
- `npx prisma db push` (baza była out-of-sync z migration history)

#### 5. Skrypt importu `scripts/import-wolne-miejsca.py`
- Match po nazwie (fuzzy, score≥0.75) dla placówek poza miastami — **61 dopasowanych**
- Match po **sumie pojemności** dla Kraków/Nowy Sącz/Tarnów (grupuje wieloliniowe wpisy, np. 52+28=80) — **9 dopasowanych**
- Ręczne mapowania dla 4 trudnych przypadków
- Wynik pierwszego importu: **81 rekordów, 74 wolne miejsca (stan 30.04.2026)**
- Upsert — bezpieczny przy ponownym uruchomieniu

#### 6. Frontend — sekcja "Dostępność miejsc"
Wyświetlana między "O placówce" a "Jak złożyć wniosek?" — tylko gdy są dane.
- Grid 4 kafelków: wolne ogółem (zielony/szary) · kobiety (różowy) · mężczyźni (niebieski) · czas oczekiwania (bursztynowy)
- Czas oczekiwania: "ok. X miesięcy" / "ok. X,X roku" / "X dni"
- Oczekujący łączony z czasem w jednym kafelku
- Typ opieki "dzieci i młodzieży" → "dla dziewcząt" / "dla chłopców"
- Zielony badge "stan na kwiecień 2026"
- Stopka: źródło MUW + potwierdź telefonicznie

#### 7. Fix: wykres cen pokazuje 2025
- `page.tsx`: usunięto `verified: true` z query → ceny 2025 (verified=false) też widoczne

### Commity tej sesji:
- `9fdcab8` — feat: monitor wolnych miejsc DPS + profil na karcie placówki
- `ffcca38` — feat: przycisk "Sprawdź wolne miejsca" w panelu admina
- `82cf4e7` — feat: wolne miejsca DPS — historia w bazie + sekcja na stronie placówki
- `b3313e9` — fix: grupowanie wierszy miast po pojemności + redesign sekcji wolnych miejsc
- `7fb19e2` — fix: drobne poprawki UI placówki

### Stan bazy po sesji:
- **DPS Małopolska:** 91 placówek
- **ŚDS:** 95 placówek
- **Łącznie:** 186 placówek
- **PlacowkaCena:** 338 rekordów (2023–2026)
- **PlacowkaWolneMiejsca:** 81 rekordów (stan 30.04.2026)

### Niezmatowane placówki w imporcie wolnych miejsc (do poprawy):
| Problem | Opis |
|---------|------|
| Gmina Borzęcin, Gmina Grybów, Gmina Sękowa | XLSX używa nazwy operatora (gminy) zamiast nazwy DPS |
| DPS Zgromadzenie Sióstr... | Długa nazwa prowadzącego zamiast krótkiej nazwy DPS |
| DPS "Miłosierny Samarytanin" | Cudzysłów w nazwie psuje fuzzy match |
| Kraków (wiele) | Wiele placówek ma tę samą pojemność per typ → ambiguous match |

---

## 🚨 TODO — NASTĘPNA SESJA (priorytety)

### KRYTYCZNE — SEO (strona niewidoczna dla Google i AI!)
1. **`public/robots.txt`** — zmienić z `Disallow: /` na `Allow: /`, `Disallow: /admin/`
2. **`app/layout.tsx`** — zmienić `robots: { index: false }` na `index: true`
3. **`app/sitemap.ts`** — dodać dynamiczny sitemap (186 placówek + artykuły)
   - Szacowany czas: 30–40 minut

### CONTENT — Artykuł gotowy do publikacji
- `drafts/koszty-dps-kto-placi-2026-05-07.md` — ~2800 słów, status: DRAFT
- Research brief: `research/brief-koszty-dps-kto-placi-2026-05-07.md`
- Do zrobienia: `/scrub` → `/optimize` → dodać do `src/data/articles.ts` → stworzyć MDX

### WOLNE MIEJSCA — Ulepszenia importu
- Obsługa Gmina Borzęcin/Grybów/Sękowa (operator zamiast nazwy DPS)
- Kraków — wiele placówek o tej samej pojemności (potrzebna inna strategia)
- Rozważyć: ręczna tabela mapowań dla ~15 niezmatowanych

### INNE
- Dodać nowe DPS Śląskie (4 placówki w bazie, brak danych)
- Metadata dla 186 placówek (`generateMetadata()` w `/app/placowka/[id]/page.tsx`)
- Canonical URLs

---

## ✅ SESJA #13: 2026-05-09 — Monitor DPS — naprawa workflow + ceny 2026 + historia cen

### Co zrobiliśmy:

#### 1. Naprawa GitHub Actions workflow (monitor PDF)
- **Problem 401:** stary GITHUB_PAT był zamaskowany w `.env` → wygenerowano nowy fine-grained PAT
  - Uprawnienia: Only `kompas-seniora`, Actions: Read and write
- **Problem SSL:** `malopolska.uw.gov.pl` ma certyfikat nieufany przez GitHub Actions → `verify=False` w `requests.get()`
- **Problem IndexError:** `row[6]` w parsowaniu PDF → bezpieczny dostęp przez `cell(idx)`
- **Problem trailing newline:** `DATABASE_URL` w GitHub Secret miał `\n` na końcu → `.strip()` w skrypcie
- **Problem zły URL:** skrypt używał pliku kosztów zamiast wykazu DPS → poprawiono na `wykaz%20dps.pdf`
- **Wynik końcowy:** workflow działa ✅ — 1 rozbieżność (telefon l.p. 85) → zostawione świadomie

#### 2. Dziennik pobrań PDF (`raw_dane/malopolskie/pobrane.md`)
- Nowa funkcja `update_download_log()` w skrypcie Python
- Dopisuje wpis po każdym pobraniu: data, plik, hash SHA-256, link do Issue
- Retroaktywnie dodano wpisy dla plików z 18.02.26 i 27.03.26

#### 3. Automatyczny SQL patch w GitHub Issue
- Nowa funkcja `generate_sql_patch()` — generuje gotowy SQL na podstawie wykrytych różnic
- SQL dołączany na końcu każdego Issue z raportem
- Kategorie: UPDATE dla nazw/telefonów/emaili/miejsc, komentarze dla brakujących/extra

#### 4. Porównanie pliku kosztów z wykazem DPS
- Plik kosztów vs wykaz 27.03.26: 7 różnic — wszystkie formatowanie + zamiana kolejności l.p. 39/40/41
- DB nazwy vs wykaz DPS: **91/91 zgodnych** ✅ — baza ma pełne nazwy z wykazu, nie skrócone z kosztów

#### 5. Import cen 2026 do bazy
- Parsowanie `do publikacji koszt dps-2026.pdf`
- 87 cen wstawionych do `PlacowkaCena` (rok=2026, data_obowiazuje=2026-04-01)
- `koszt_pobytu` i `data_zrodla_cena` w `Placowka` zaktualizowane
- Historia 2025 zachowana w `PlacowkaCena`

#### 6. Import historycznych cen 2023 i 2024
- PDFy: `średni miesięczny koszt utrzymania w dps 2023/2024 r..pdf`
- Matchowanie po nazwie (nie l.p.) — zmiana numeracji między latami
- **2023:** 81/91 zaimportowano | **2024:** 81/91 zaimportowano
- Pominięto: Radziwiłłowska 8 i im. Władysława Godynia (nie istnieją w aktualnej bazie — wykreślone z rejestru)
- Łącznie w `PlacowkaCena`: 2023: 81 | 2024: 81 | 2025: 89 | 2026: 87

#### 7. Podstawa prawna cen DPS (art. 60 ust. 2 ustawy o pomocy społecznej)
- Ogłaszane: do 31 marca każdego roku
- Wejście w życie: od 1. dnia miesiąca po publikacji → **od 1 kwietnia**
- Obowiązują do ogłoszenia nowych (nie do końca roku kalendarzowego)

#### 8. Frontend — karta placówki (strona szczegółów)
- Nagłówek ceny: `Szacunkowy koszt miesięczny` → `Koszt miesięczny`
- Usunięto tekst "Dofinansowanie dostępne"
- Dodano etykietę `Cena obowiązuje od IV 2026` (z `data_zrodla_cena`)
- Mini wykres słupkowy historii cen 2023–2026:
  - Aktualny rok wyróżniony zielonym (`bg-emerald-400`)
  - Tooltip na hover: sama cena bez roku
  - Słupki px-based (16–48px), container 64px

#### 9. Pliki zmienione
- `scripts/monitor-dps-pdf.py` — SSL fix, IndexError fix, strip URL, generate_sql_patch, update_download_log
- `.github/workflows/dps-pdf-monitor.yml` — bez zmian
- `raw_dane/malopolskie/pobrane.md` — nowy dziennik pobrań
- `lib/public-placowka-fields.ts` — dodano `data_zrodla_cena`
- `src/components/search/SearchResults.tsx` — `data_zrodla_cena` w typie
- `src/components/search/FacilityCard.tsx` — `priceDate` prop (nie używany na kafelkach)
- `src/components/placowka/PlacowkaDetails.tsx` — wykres, tooltip, etykieta daty, nowy nagłówek
- `app/placowka/[id]/page.tsx` — include `ceny` w zapytaniu

### Commity:
- `e64c8c4` — fix: SSL + dziennik pobrań PDF
- `0bf2a52` — fix: bezpieczny dostęp do komórek tabeli PDF
- `6dc8edb` — fix: strip DATABASE_URL
- `8be02ac` — fix: poprawny URL wykazu DPS
- `4860045` — feat: automatyczny SQL patch w Issue
- `0529eb1` — feat: cena 2026 + etykieta 'obowiązuje od IV 2026'
- `535d6af` — feat: etykieta na stronie szczegółów placówki
- `8c5191b` — fix: nowy nagłówek ceny + usunięcie "Dofinansowanie dostępne"
- `37ef82c` — feat: wykres historii cen 2023–2026
- `f53c339` — fix: aktualny rok zielony, bez liczb nad słupkami
- `3eaac49` — fix: słupki px-based, widoczne
- `fb0e1c6` — feat: tooltip z samą ceną na hover

### Stan bazy po sesji:
- **DPS Małopolska:** 91 placówek ✅
- **ŚDS:** 95 placówek (bez zmian)
- **Łącznie:** 186 placówek
- **PlacowkaCena:** 338 rekordów (2023: 81, 2024: 81, 2025: 89, 2026: 87)

---

# SESSION NOTES - 2026-05-08

## ✅ SESJA #12: Synchronizacja bazy DPS z wykazem PDF + Monitor automatyczny

### Co zrobiliśmy:

#### 1. Porównanie bazy z wykazem DPS Małopolska (27.03.2026)
- PDF: 91 placówek | Baza przed: 89 placówek
- **Brakujące:** l.p. 39 (Skrzydlna), l.p. 57 (Mogilno) → dodane ręcznie przez użytkownika
- **Błędy nazw (3):** naprawione automatycznie
  - l.p. 9: `DomDom` → `Dom`
  - l.p. 17: błędna nazwa (adres urzędu) → prawidłowa nazwa DPS
  - l.p. 62: brak spacji `SpołecznejBraci` → `Społecznej Braci`
- **Wynik końcowy:** 91/91 zgodnych ✅

#### 2. DPS bez ceny — logika "bez zlecenia"
- l.p. 39 Skrzydlna: prowadzony przez stowarzyszenie bez zlecenia samorządu
- l.p. 57 Mogilno: prowadzony przez osobę fizyczną
- Oba: `koszt_pobytu = null`, `data_zrodla_cena = 2026`, `notatki` z podstawą prawną (art. 60 ust. 2)

#### 3. Fix wyświetlania ceny na frontendzie
- **Przed:** `null` → "NFZ" (błędne!)
- **Po:** 3 stany:
  - DPS z ceną → `4 500 zł / mies.`
  - DPS bez ceny (null) → `Zapytaj` (szary)
  - ŚDS (zawsze null) → `Bezpłatne` (zielony)
- Pliki: `FacilityCard.tsx`, `SearchResults.tsx`

#### 4. Dodatkowe porównanie: telefony, emaile, profile, miejsca
- **Profil — 4 uszkodzone rekordy** (wartości "F", "E", "C", "A") → naprawione
- **Telefony — 7 rozbieżności** → zaktualizowane z PDF
- **Emaile — 15 rozbieżności** → zaktualizowane z PDF
- **Miejsca — 1 rozbieżność** (l.p. 82: 72→70) → naprawione

#### 5. GitHub Actions — automatyczny monitor PDF
- Workflow: `.github/workflows/dps-pdf-monitor.yml`
  - Cron: 1. każdego miesiąca o 8:00 UTC
  - `workflow_dispatch` do ręcznego odpalenia
  - Pobiera PDF, porównuje z bazą, tworzy GitHub Issue z raportem
- Skrypt: `scripts/monitor-dps-pdf.py` (Python: pdfplumber + psycopg2)
- API: `/api/admin/trigger-pdf-check` — wyzwala workflow przez GitHub API
- Panel admina: przycisk "Sprawdź teraz" + checkbox "Wymuś porównanie"
- Wymaga: `GITHUB_PAT` w `.env` i Vercel, `DATABASE_URL` jako GitHub Secret

### Commity:
- `2be69bf` — fix: Poprawne wyświetlanie ceny (ŚDS/DPS null/DPS z ceną)
- `d6cd1da` — chore: Aktualizacja linków raw_dane + usunięcie advisor.png
- `3a510ac` — feat: Monitor DPS PDF (GitHub Actions + admin panel)

### Stan bazy po sesji:
- **DPS Małopolska:** 91 placówek (zsynchronizowane z wykazem 27.03.2026 ✅)
- **ŚDS:** 95 placówek (bez zmian)
- **Łącznie:** 186 placówek

---

# SESSION NOTES - 2026-03-18

## ✅ SESJA #10: Fix out-of-region detection - KOMPLETNY

### Problem z poprzedniej sesji:
- Warszawa (wieś w Małopolsce) pokazywała się jako stolica ❌
- Olsztyn na mapie nie był blokowany ❌
- Brak jasnego komunikatu dla usera

---

## Co zrobiliśmy dziś:

### 1. ✅ Blacklista 40+ stolic Polski

**Implementacja:**
- `app/search/page.tsx:8-17` - lista `CAPITAL_CITIES_BLACKLIST`
- 40+ największych miast Polski (Warszawa, Łódź, Wrocław, Poznań, Gdańsk, Olsztyn...)

**Logika:**
```typescript
if (CAPITAL_CITIES_BLACKLIST.includes(normalizedCity) && !powiat) {
  return { lat: 0, lng: 0, outOfRegion: true }; // Blokuj TYLKO bez kontekstu powiatu
}
```

**Kluczowa zmiana:** Blokuje TYLKO gdy user wpisał sam tekst (bez wyboru z autocomplete).
- ✅ "warszawa" + Enter → **blokowane** (brak powiatu = na pewno stolica)
- ✅ "warszawa" → wybór "Warszawa (część wsi)" z autocomplete → **dozwolone** (powiat znany)

---

### 2. ✅ Console.log w geocodeCity() - szczegółowe debugowanie

**Dodano logi:**
```typescript
🌍 GEOCODING: "Warszawa" (powiat: olkuski, woj: brak)
📍 Nominatim result: {
  display_name: "...",
  state: "województwo małopolskie",  // ← ODKRYLIŚMY PROBLEM!
  county: "powiat olkuski",
  ...
}
🔍 State check: "województwo małopolskie" → wytnij prefix → "małopolskie" → outOfRegion: false
```

---

### 3. ✅ FIX KRYTYCZNY: Normalizacja województwa

**Problem znaleziony:**
Nominatim zwraca `"województwo małopolskie"` (z prefixem), ale `ENABLED_VOIVODESHIPS = ['małopolskie']` (bez prefixu).

Porównanie:
- `"wojewodztwo malopolskie"` ≠ `"malopolskie"` → **ZAWSZE outOfRegion=true!** ❌

**Rozwiązanie:**
```typescript
// app/search/page.tsx:83-85
let stateName = state.toLowerCase().replace(/^województwo\s+/, ''); // Wytnij prefix
const normalizedState = normalizePolish(stateName);
```

**Wynik:**
- `"województwo małopolskie"` → wytnij → `"małopolskie"` → normalized → `"malopolskie"` ✅

---

### 4. ✅ NIE pokazuj searchCenter gdy outOfRegion=true

**Implementacja:**
```typescript
// app/search/page.tsx:668-669
const validSearchCenter = searchCenter && !searchCenter.outOfRegion ? searchCenter : null;
```

**Rezultat:**
- Olsztyn nie pokazuje pulsującego punktu na mapie ✅
- Warszawa (stolica) nie pokazuje punktu ✅

---

### 5. ✅ Oznaczenie RM=00 jako "(część wsi)" w autocomplete

**UI Update:**
```typescript
// src/components/search/SearchBar.tsx:72-79
{suggestion.rodzaj_miejscowosci === '00' && (
  <span className="text-slate-500 font-normal">
    {suggestion.parentLocationName
      ? ` (część wsi ${suggestion.parentLocationName})`
      : ' (część wsi)'}
  </span>
)}
```

**Bonus:**
- ★ dla miast (RM=96/98) - zielona gwiazdka emerald-600

---

### 6. ✅ Żółty banner ostrzegawczy dla części wsi o nazwie stolicy

**Implementacja:**
```typescript
// app/search/page.tsx:673-676
const isCapitalCity = CAPITAL_CITIES_BLACKLIST.includes(normalizedQuery);
const capitalCityWarning = isCapitalCity && powiatParam && sortedResults.length > 0
  ? { cityName: query, powiat: powiatParam }
  : undefined;
```

**UI:**
```
┌─────────────────────────────────────────────────┐
│ ⚠️  To nie stolica, tylko część wsi!            │
│                                                 │
│ Szukana miejscowość "Warszawa" to część wsi    │
│ w powiecie olkuskim, nie stolica Polski.       │
│ Stolica Warszawa nie znajduje się w            │
│ obsługiwanym regionie (Małopolska).            │
└─────────────────────────────────────────────────┘
```

- 🟡 Żółte tło (amber-50)
- 🔶 Pomarańczowa ramka (amber-300)
- ⚠️ Ikona ostrzeżenia
- 📝 Jasny komunikat wyjaśniający

**Lokalizacja:** `src/components/search/SearchResults.tsx:1023-1040`

---

### 7. ✅ Etykieta "(część wsi)" na pulsującym punkcie mapy

**Implementacja:**
```typescript
// components/FacilityMap.tsx:116-159
function createSearchCenterIcon(cityName: string, isPartOfVillage?: boolean) {
  const label = isPartOfVillage
    ? `${cityName}<br/><span style="font-size:8px;color:#92400e">(część wsi)</span>`
    : cityName;
  // ...
}
```

**Propagacja flagi:**
```typescript
// app/search/page.tsx:683
searchCenter: validSearchCenter ? {
  ...validSearchCenter,
  name: query,
  isPartOfVillage: isCapitalCity && !!powiatParam // ← Flaguj część wsi
} : undefined
```

**Wynik na mapie:**
```
┌────────────────┐
│   Warszawa     │
│ (część wsi)    │
└────────────────┘
```

---

## 🐛 Bugi naprawione (2 krytyczne):

### Bug #1: Blacklista blokowała za szeroko
**Było:** Blokuje "warszawa" ZAWSZE (nawet gdy user wybrał z autocomplete)
**Jest:** Blokuje TYLKO gdy brak kontekstu powiatu (user wpisał sam tekst)

### Bug #2: Normalizacja województwa
**Było:** Nominatim zwraca "województwo małopolskie" → porównanie z "małopolskie" → zawsze FALSE
**Jest:** Wycinamy prefix "województwo " przed porównaniem

---

## 📁 Zmienione pliki (4):

1. **`app/search/page.tsx`**
   - Dodano `CAPITAL_CITIES_BLACKLIST` (40+ stolic)
   - Blacklista z warunkiem `&& !powiat`
   - Console.log w `geocodeCity()`
   - Fix normalizacji: `.replace(/^województwo\s+/, '')`
   - `validSearchCenter` - blokada gdy outOfRegion=true
   - `capitalCityWarning` - wykrywanie części wsi o nazwie stolicy
   - `isPartOfVillage` - flaga do mapy

2. **`src/components/search/SearchResults.tsx`**
   - Nowy prop: `capitalCityWarning?: { cityName, powiat }`
   - Żółty banner ostrzegawczy (linie 1023-1040)
   - Aktualizacja typu `searchCenter` - dodano `isPartOfVillage?: boolean`

3. **`src/components/search/SearchBar.tsx`**
   - Oznaczenie RM=00 jako "(część wsi)" w UI (linie 72-79)
   - Bonus: ★ dla miast RM=96/98

4. **`components/FacilityMap.tsx`**
   - `createSearchCenterIcon()` - nowy parametr `isPartOfVillage`
   - Dwuliniowa etykieta: nazwa + "(część wsi)"
   - Propagacja `isPartOfVillage` przez `effectiveSearchCenter`
   - Aktualizacja typu `FacilityMapProps.searchCenter`

---

## 🧪 Testy wykonane:

### Test 1: Warszawa (część wsi) ✅
1. Wpisz "warszawa" → autocomplete pokazuje "Warszawa (część wsi)" - powiat olkuski
2. Wybierz z autocomplete → Kliknij Szukaj
3. **Rezultat:**
   - ✅ Żółty banner: "To nie stolica, tylko część wsi!"
   - ✅ Pulsujący punkt na mapie: "Warszawa<br/>(część wsi)"
   - ✅ Wyniki placówek z okolicy (0 placówek w samej wsi, ale pokazuje okoliczne)
   - ✅ Brak błędnego komunikatu "poza regionem"

### Test 2: Warszawa (stolica) - user NIE wybiera z autocomplete ✅
1. Wpisz "warszawa" → Kliknij Szukaj BEZ wyboru
2. **Rezultat:**
   - ✅ Komunikat: "Miejscowość poza obsługiwanym regionem"
   - ✅ Brak pulsującego punktu na mapie
   - ✅ Blacklista zadziałała

### Test 3: Olsztyn na mapie ✅
1. Widok mapy → wpisz "olsztyn" → Kliknij Szukaj
2. **Rezultat:**
   - ✅ Komunikat: "Miejscowość poza obsługiwanym regionem"
   - ✅ Mapa zostaje na Małopolsce (NIE przeskakuje do Olsztyna)
   - ✅ Brak pulsującego punktu
   - ✅ Blacklista + `woj=malopolskie` zadziałały

### Test 4: Kraków (normalny flow) ✅
1. Wpisz "kraków" → wybierz z autocomplete
2. **Rezultat:**
   - ✅ Lista placówek (44 placówki w powiecie krakowskim)
   - ✅ Pulsujący punkt na mapie: "Kraków" (bez "(część wsi)")
   - ✅ Brak żółtego bannera
   - ✅ Normalny wynik

---

## 📊 Statystyki:

- **Blacklista:** 40+ stolic Polski
- **Console.log:** 6 nowych logów w `geocodeCity()`
- **UX improvement:** 2 nowe komunikaty wizualne (banner + etykieta mapy)
- **Linijek kodu:** ~150 dodanych, ~20 zmienionych
- **Bugi naprawione:** 2 krytyczne (blacklista za szeroka + normalizacja województwa)

---

## 🎯 Rezultat:

**Wszystkie 3 scenariusze działają poprawnie:**
1. ✅ Stolice Polski (Warszawa, Olsztyn...) - blokowane
2. ✅ Części wsi o nazwie stolicy (Warszawa w olkuskim) - dozwolone + komunikaty wyjaśniające
3. ✅ Normalne miejscowości (Kraków) - działają bez zmian

**User experience:**
- Jasne komunikaty dlaczego coś nie działa
- Wyjaśnienie różnicy między stolicą a częścią wsi
- Wizualne oznaczenia na mapie i w wynikach

---

## 📝 TODO na przyszłość:

- [ ] Usunąć console.log z produkcji (gdy debugging zakończony)
- [ ] Rozważyć dodanie więcej miast do blacklisty (miasta wojewódzkie poza obsługiwanym regionem)
- [ ] Monitoring: jak często users szukają stolic spoza regionu? (analytics)

---

## Commity z tej sesji:

(Do stworzenia)

---

## Stan projektu:

- **Baza:** PostgreSQL (Neon), 184 placówki (89 DPS + 95 ŚDS)
- **Województwa:** tylko Małopolskie (+ 4 Śląskie w bazie)
- **TERYT:** 13,831 lokalizacji (wszystkie miejscowości Małopolski, w tym RM=00)
- **Branch:** main
- **Ostatni commit:** (pending)
- **Status:** Out-of-region detection w pełni działa ✅
1