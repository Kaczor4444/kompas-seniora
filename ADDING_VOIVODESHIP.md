# Dodawanie nowego województwa — poradnik

Dokument opisuje kompletny proces integracji nowego województwa na podstawie doświadczeń z Małopolską (WOJ=12) i Śląskim (WOJ=24).

---

## Przegląd architektury

Aplikacja obsługuje wiele województw przez:
- **`ENABLED_VOIVODESHIPS`** w `lib/voivodeship-filter.ts` — lista aktywnych województw
- **`TerytLocation`** — baza miejscowości dla autocomplete wyszukiwarki
- **`Placowka`** — tabela placówek (DPS, ŚDS, Senior+, UTW)
- **`CITY_CENTER_COORDS`** i **`CAPITAL_CITIES_BLACKLIST`** w `app/search/page.tsx` — geocoding i out-of-region detection
- **`city-county-mapping.ts`** — mapowanie miast na prawach powiatu

---

## Krok 1 — Znajdź kod WOJ w TERYT

Kody TERYT województw (parzysty układ, 02–32):
| Kod | Województwo        |
|-----|--------------------|
| 02  | Dolnośląskie       |
| 04  | Kujawsko-Pomorskie |
| 06  | Lubelskie          |
| 08  | Lubuskie           |
| 10  | Łódzkie            |
| 12  | **Małopolskie** ✅ |
| 14  | Mazowieckie        |
| 16  | Opolskie           |
| 18  | Podkarpackie       |
| 20  | Podlaskie          |
| 22  | Pomorskie          |
| 24  | **Śląskie** ✅     |
| 26  | Świętokrzyskie     |
| 28  | Warmińsko-Mazurskie|
| 30  | Wielkopolskie      |
| 32  | Zachodniopomorskie |

⚠️ Agent AI może się mylić z kodami (np. podał WOJ=16 dla Śląskiego — błąd!). Zawsze weryfikuj przez plik SIMC:
```bash
grep "NazwaMiasta" data/SIMC_Adresowy_20250922.csv | head -3
# Kolumna 1 (WOJ) = kod województwa
```

---

## Krok 2 — Znajdź kody powiatów

```bash
python3 -c "
import csv
found = {}
with open('data/SIMC_Adresowy_20250922.csv', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        if row['WOJ'] == 'XX':  # zamień XX na kod nowego woj
            pow_code = row['POW']
            rm = row['RM']
            if pow_code not in found or rm in ['96','98']:
                found[pow_code] = row['NAZWA']
for k in sorted(found.keys()):
    print(f'{k}: {found[k]}')
"
```

Zbuduj `POWIATY_MAP`:
- Kody `01`–`nn` → powiaty ziemskie (np. `'01': 'będziński'`)
- Kody `61`–`nn` → miasta na prawach powiatu (np. `'61': 'm. Bielsko-Biała'`)

---

## Krok 3 — Import TERYT

Skopiuj `scripts/import-teryt-slaskie.js` jako `scripts/import-teryt-NAZWA.js`.

Zmień:
```javascript
// Stare:
if (woj !== '24') { skipped++; continue; }
// Nowe (podaj właściwy kod):
if (woj !== 'XX') { skipped++; continue; }

// Stare:
wojewodztwo: 'śląskie',
// Nowe:
wojewodztwo: 'nowe-województwo',

// Stare:
where: { wojewodztwo: 'śląskie' }
// Nowe:
where: { wojewodztwo: 'nowe-województwo' }
```

Oraz uzupełnij `POWIATY_ZIEMSKIE` i `POWIATY_GRODZKIE` mapami dla nowego województwa.

Uruchom:
```bash
node scripts/import-teryt-NAZWA.js
```

Skrypt **appenduje** do TerytLocation (nie usuwa innych województw).

---

## Krok 4 — Pobierz i sparsuj rejestr DPS

### Znajdź rejestr

Każde województwo publikuje rejestr DPS na stronie urzędu wojewódzkiego. Najczęściej:
- `https://www.MIASTO.uw.gov.pl/` → Wydział Polityki Społecznej → Rejestr DPS
- Format: **PDF** (tabela wielokolumnowa)

### Pobierz PDF

```bash
curl -k -L "URL_DO_PDF" -o /tmp/rejestr_nowe_woj.pdf -A "geocoder-research/1.0"
```

### Wyciągnij tekst

```bash
python3 -c "
import pypdf
r = pypdf.PdfReader('/tmp/rejestr_nowe_woj.pdf')
text = '\n'.join(p.extract_text() for p in r.pages)
with open('/tmp/rejestr_nowe_woj.txt', 'w') as f: f.write(text)
print('OK,', len(text), 'chars')
"
```

### Struktura tabeli rejestru DPS (typowa dla polskich urzędów)

Kolumny w PDF:
1. Lp. + Nr decyzji
2. Nazwa, adres, telefon
3. **Typ** (osoby w podeszłym wieku / przewlekle somatycznie chore / psychicznie chore / niepełnosprawni intelektualnie / dzieci i młodzież / niepełnosprawni fizycznie)
4. Podmiot prowadzący
5. **Liczba miejsc**
6. Czas zezwolenia
7. Nr decyzji i data
8. JST zlecająca

### Mapowanie typów DPS → profil_opieki (kody aplikacji)

| Opis w PDF | Kod w aplikacji |
|-----------|----------------|
| osoby w podeszłym wieku | `E` |
| osoby przewlekle somatycznie chore | `F` |
| osoby przewlekle psychicznie chore | `B` |
| dorośli niepełnosprawni intelektualnie | `A` |
| dzieci i młodzież niepełnosprawna intelektualnie | `G,H` |
| osoby niepełnosprawne fizycznie | `I` |
| kombinacje (np. podeszły wiek + somatycznie) | `E,F` |

Funkcja mapująca (gotowa do skopiowania):
```javascript
function mapProfil(desc) {
  const d = (desc || '').toLowerCase();
  const codes = [];
  if (d.includes('podeszł')) codes.push('E');
  if (d.includes('somatycznie')) codes.push('F');
  if (d.includes('psychicznie')) codes.push('B');
  if (d.includes('dorosł') && d.includes('intelektualnie')) codes.push('A');
  if (d.includes('dzieci') && d.includes('intelektualnie')) codes.push('G');
  if (d.includes('młodzież') && d.includes('intelektualnie')) codes.push('H');
  if (d.includes('fizycznie')) codes.push('I');
  return codes.join(',') || null;
}
```

---

## Krok 5 — Utwórz skrypt importu DPS

Skopiuj `scripts/import-dps-slaskie.js` jako `scripts/import-dps-NAZWA.js`.

Uzupełnij tablicę `DPS_NOWE_WOJ` na podstawie PDF:
```javascript
const DPS_NOWE_WOJ = [
  {
    oficjalne_id: 1,          // lp. z PDF
    nazwa: 'Dom Pomocy ...',
    ulica: 'ul. Przykładowa 1',
    miejscowosc: 'Miasto',
    kod: '00-000',
    powiat: 'nazwaPowiatu',   // z POWIATY_MAP (np. 'krakowski' lub 'm. Kraków')
    telefon: '12/345-67-89',
    liczba_miejsc: 100,
    profil_desc: 'osoby w podeszłym wieku',  // oryginalny tekst z PDF
    prowadzacy: 'Powiat ...',
    jst_nazwa: 'Powiat ...',
  },
  // ...
];
```

### Ważne: geocoding

Skrypt używa Nominatim (1req/s). Jeśli adresy mają prefiksy `ul./pl./al.` — Nominatim może nie znajdować wyników.

**Rozwiązanie:** skrypt automatycznie usuwa prefiksy przed zapytaniem:
```javascript
const clean = ulica.replace(/^(ul\.|pl\.|al\.|oś\.|ks\.|bpa\.|dr\.|gen\.)\s*/gi, '').trim();
```

Jeśli po imporcie są rekordy bez geocodingu (latitude=null), uruchom skrypt naprawczy:
```javascript
// Sprawdź ile bez koordynat:
const noGeo = await prisma.placowka.count({
  where: { AND: [{ wojewodztwo: 'nowe-województwo' }, { latitude: null }] }
});

// Dla trudnych adresów — spróbuj tylko nazwę ulicy i miasto:
geocode('Cyranka 10', 'Lubliniec'); // bez "ul. dr E."
```

Uruchom import:
```bash
node scripts/import-dps-NAZWA.js
```

---

## Krok 6 — Zaktualizuj UI

### 6a. Włącz województwo w voivodeship-filter.ts

```typescript
// lib/voivodeship-filter.ts
export const ENABLED_VOIVODESHIPS = ['małopolskie', 'śląskie', 'nowe-województwo'] as const;
```

### 6b. Dodaj mapowania miast na prawach powiatu

```typescript
// lib/city-county-mapping.ts — w funkcji mapCityCountyToPowiat()
if (normalized === 'm. nowestolice' || normalized === 'nowestolice') return 'm. NoweStolice';
// ... dla każdego miasta na prawach powiatu nowego województwa
```

### 6c. Usuń nowe miasta z blacklisty

```typescript
// app/search/page.tsx — CAPITAL_CITIES_BLACKLIST
// ❌ NIE dodawaj tu miast z obsługiwanych województw!
// Tylko miasta które nigdy nie będą obsługiwane (Warszawa, Łódź, Wrocław...)
```

### 6d. Dodaj hardcoded center coords dla głównych miast

```typescript
// app/search/page.tsx — CITY_CENTER_COORDS
'nowemiasto': { lat: XX.XXXX, lng: XX.XXXX, wojewodztwo: 'nowe-województwo' },
```

### 6e. Dodaj powiaty do SearchResults (chip filtru)

```typescript
// src/components/search/SearchResults.tsx
const ALL_NOWE_WOJ_POWIATS = [
  'powiat1', 'powiat2', ...
];
```

Sprawdź jak jest zaimplementowany filtr powiatów — może wymagać warunkowego wyboru listy na podstawie aktywnego województwa.

---

## Krok 7 — GitHub Actions monitor

Skopiuj `scripts/monitor-dps-slaskie.py` jako `scripts/monitor-dps-NAZWA.py`.

Zmień:
```python
PDF_URL = "https://URL_DO_PDF_NOWEGO_WOJ"
SENTINEL_FILE = 'raw_dane/NAZWA/.dps_NAZWA_last_hash'
```

Skopiuj `.github/workflows/slaskie-dps-monitor.yml` jako `.github/workflows/NAZWA-dps-monitor.yml`.

Zmień schedule (inny dzień żeby nie kolidować):
```yaml
- cron: '0 9 15 * *'  # 15. każdego miesiąca
```

Zainicjalizuj sentinel:
```bash
mkdir -p raw_dane/NAZWA
python3 scripts/monitor-dps-NAZWA.py  # pierwsze uruchomienie zapisze hash
```

---

## Krok 8 — Weryfikacja

```bash
# Sprawdź TERYT
node -e "
require('dotenv').config();
const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();
p.terytLocation.count({ where: { wojewodztwo: 'nowe-województwo' } })
  .then(n => console.log('TERYT:', n))
  .finally(() => p.\$disconnect());
"

# Sprawdź DPS
node -e "
require('dotenv').config();
const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();
async function main() {
  const total = await p.placowka.count({ where: { wojewodztwo: 'nowe-województwo' } });
  const noGeo = await p.placowka.count({ where: { wojewodztwo: 'nowe-województwo', latitude: null } });
  console.log('DPS total:', total, '| bez geocodingu:', noGeo);
  await p.\$disconnect();
}
main();
"

# Test wyszukiwarki
# Otwórz http://localhost:3000 i wpisz nazwę głównego miasta nowego województwa
```

---

## Gotowe przykłady

| Województwo | WOJ  | Skrypt TERYT | Skrypt DPS | Monitor |
|-------------|------|-------------|-----------|---------|
| Małopolskie | `12` | `import-teryt-filtered.js` | *(dane w CSV)* | `senior-plus-monitor.yml` |
| **Śląskie** | `24` | `import-teryt-slaskie.js` | `import-dps-slaskie.js` | `slaskie-dps-monitor.yml` |
| Dolnośląskie | `02` | *(do zrobienia)* | *(do zrobienia)* | *(do zrobienia)* |

---

## Znane pułapki

1. **Kod WOJ** — agent AI może podać błędny. Zawsze weryfikuj przez SIMC CSV.
2. **Geocoding z prefiksami** — Nominatim nie lubi `ul.`, `ks. bpa.`, `dr.`. Skrypt czyści je automatycznie, ale dla bardzo trudnych adresów próbuj tylko ulicę + miasto.
3. **Filie** — niektóre DPS mają filie pod innym adresem. Importuj je jako osobne rekordy z tym samym `oficjalne_id`.
4. **Encoding SIMC** — plik ma BOM (`﻿`). Użyj `utf-8-sig` w Pythonie lub usuń BOM w Node.js przez `.replace(/^﻿/, '')`.
5. **Powiaty grodzkie** — w bazie jako `'m. Katowice'` (nie `'katowicki'`). Mapowanie w `city-county-mapping.ts`.
6. **Nominatim rate limit** — max 1 req/s. Delay co najmniej 1200ms między requestami.
7. **CAPITAL_CITIES_BLACKLIST** — usuń z niej wszystkie miasta nowego województwa przed włączeniem go w `ENABLED_VOIVODESHIPS`.

---

*Ostatnia aktualizacja: 2026-05-19 (sesja #20 — integracja Śląskiego)*
