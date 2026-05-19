# Dodawanie nowego województwa — blueprint

Kompletny proces integracji nowego województwa na podstawie Małopolski (WOJ=12) i Śląskiego (WOJ=24).  
Wszystkie kroki w kolejności, z gotowymi fragmentami kodu do skopiowania.

---

## Spis kroków

1. [Weryfikacja kodu WOJ w TERYT](#krok-1--weryfikacja-kodu-woj-w-teryt)
2. [Mapowanie powiatów z SIMC](#krok-2--mapowanie-powiatów-z-simc)
3. [Import TERYT do TerytLocation](#krok-3--import-teryt-do-terytlocation)
4. [Rejestr DPS — pobranie i parsowanie PDF](#krok-4--rejestr-dps--pobranie-i-parsowanie-pdf)
5. [Import DPS do bazy](#krok-5--import-dps-do-bazy)
6. [UI — wyszukiwarka i filtry](#krok-6--ui--wyszukiwarka-i-filtry)
7. [SVG mapa powiatów](#krok-7--svg-mapa-powiatów)
8. [RegionalMap — przełącznik województw](#krok-8--regionalmap--przełącznik-województw)
9. [GitHub Actions — monitoring PDF](#krok-9--github-actions--monitoring-pdf)
10. [Weryfikacja końcowa](#krok-10--weryfikacja-końcowa)
11. [Aktualizacja dokumentacji](#krok-11--aktualizacja-dokumentacji)
12. [MOPS/GOPS/CUS — import i monitoring](#krok-12--mopsgopscus--import-i-monitoring)

---

## Krok 1 — Weryfikacja kodu WOJ w TERYT

⚠️ **AI często podaje błędny kod** (np. dla Śląskiego podał 16 zamiast 24). Zawsze weryfikuj.

Kody TERYT (parzyste, 02–32):
| Kod | Województwo         | | Kod | Województwo          |
|-----|---------------------|-|-----|----------------------|
| 02  | Dolnośląskie        | | 18  | Podkarpackie         |
| 04  | Kujawsko-Pomorskie  | | 20  | Podlaskie            |
| 06  | Lubelskie           | | 22  | Pomorskie            |
| 08  | Lubuskie            | | **24**  | **Śląskie ✅**   |
| 10  | Łódzkie             | | 26  | Świętokrzyskie       |
| **12**  | **Małopolskie ✅**  | | 28  | Warmińsko-Mazurskie  |
| 14  | Mazowieckie         | | 30  | Wielkopolskie        |
| 16  | Opolskie            | | 32  | Zachodniopomorskie   |

**Weryfikacja przez SIMC:**
```bash
python3 -c "
import csv
with open('data/SIMC_Adresowy_20250922.csv', encoding='utf-8-sig') as f:
    for row in csv.DictReader(f, delimiter=';'):
        if 'Katowice' in row['NAZWA'] and row['RM'] == '96':
            print('WOJ:', row['WOJ'], '| POW:', row['POW'], '| nazwa:', row['NAZWA'])
            break
"
# Wynik: WOJ: 24 → śląskie ma kod 24
```

---

## Krok 2 — Mapowanie powiatów z SIMC

```bash
python3 -c "
import csv
found = {}
with open('data/SIMC_Adresowy_20250922.csv', encoding='utf-8-sig') as f:
    for row in csv.DictReader(f, delimiter=';'):
        if row['WOJ'] == 'XX':  # ← wstaw właściwy kod
            pow_code = row['POW']
            rm = row['RM']
            if pow_code not in found or rm in ['96','98']:
                found[pow_code] = row['NAZWA']
for k in sorted(found.keys()):
    print(f'{k}: {found[k]}')
"
```

Wynik dla Śląskiego (WOJ=24):
- `01`–`17` → powiaty ziemskie (np. `01: Będzin` → `'będziński'`)
- `61`–`79` → miasta na prawach powiatu (np. `61: Bielsko-Biała` → `'m. Bielsko-Biała'`)

**Konwencja nazw w bazie:**
- Powiat ziemski: `'będziński'`, `'częstochowski'` (lowercase, z polskimi znakami)
- Miasto na pr. powiatu: `'m. Katowice'`, `'m. Bielsko-Biała'` (prefix `m. ` + wielka litera)

Gotowe mapowanie dla Śląskiego: patrz `scripts/import-teryt-slaskie.js` → `POWIATY_ZIEMSKIE` + `POWIATY_GRODZKIE`.

---

## Krok 3 — Import TERYT do TerytLocation

Skopiuj `scripts/import-teryt-slaskie.js` → `scripts/import-teryt-NAZWA.js`.

**Zmiany do wprowadzenia (4 miejsca):**

```javascript
// 1. Kod WOJ
if (woj !== '24') { skipped++; continue; }
// → if (woj !== 'XX') { ... }

// 2. Powiaty ziemskie
const POWIATY_ZIEMSKIE = { '01': 'będziński', ... };
// → uzupełnij dla nowego woj

// 3. Powiaty grodzkie
const POWIATY_GRODZKIE = { '61': 'm. Bielsko-Biała', ... };
// → uzupełnij dla nowego woj

// 4. Nazwa województwa (2 miejsca)
wojewodztwo: 'śląskie',
where: { wojewodztwo: 'śląskie' }
// → 'nowe-województwo'
```

**Uruchomienie:**
```bash
node scripts/import-teryt-NAZWA.js
# Wynik: "Zaimportowano XXXX lokalizacji" | "Małopolskie: 13831 (niezmienione)"
```

⚠️ Skrypt **appenduje** — nie usuwa innych województw. Usuwa tylko własne przed reimportem.

---

## Krok 4 — Rejestr DPS — pobranie i parsowanie PDF

### Znajdź rejestr

Każde województwo publikuje na stronie urzędu wojewódzkiego:
```
https://www.MIASTO.uw.gov.pl/ → Wydział Polityki Społecznej → Rejestr DPS
```

### Pobierz PDF

```bash
curl -k -L "https://URL_DO_PDF" -o /tmp/rejestr.pdf -A "geocoder-research/1.0"
```

### Wyciągnij tekst z PDF

```bash
python3 -c "
import pypdf
r = pypdf.PdfReader('/tmp/rejestr.pdf')
text = '\n--- STRONA {} ---\n'.join('').join(
    f'\n--- STRONA {i+1} ---\n' + p.extract_text() for i, p in enumerate(r.pages)
)
with open('/tmp/rejestr.txt', 'w') as f: f.write(text)
print('OK:', len(r.pages), 'stron,', len(text), 'znaków')
"
```

### Typowa struktura tabeli rejestru DPS

| Kolumna | Zawartość |
|---------|-----------|
| Lp. | Numer + nr decyzji rejestru |
| Nazwa | Pełna nazwa DPS |
| Adres | ulica, kod, miejscowość, tel |
| Typ | opis profilu opieki (osoby w podeszłym wieku / somatycznie / psychicznie / niepełnosprawni...) |
| Podmiot prowadzący | kto zarządza |
| Liczba miejsc | liczba |
| JST zlecająca | jednostka samorządowa |

### Sekcje rejestru (Śląskie miało 3)

```
SEKCJA 1: Ponadgminne (prowadzone przez powiat/miasto lub zlecone) — lp. 1–87
SEKCJA 2: Miejskie (prowadzone przez miasto/gminę) — lp. M1–M9
SEKCJA 3: Bez zlecenia (stowarzyszenia/fundacje) — lp. B1–B6
```

Każda sekcja ma osobną numerację. Importuj wszystkie — nadaj `oficjalne_id` z literowym prefiksem dla sekcji 2/3 (np. `'M1'`, `'B3'`).

### Mapowanie opisu → profil_opieki

| Opis w PDF | Kod |
|-----------|-----|
| osoby w podeszłym wieku | `E` |
| osoby przewlekle somatycznie chore | `F` |
| osoby przewlekle psychicznie chore | `B` |
| dorośli niepełnosprawni intelektualnie | `A` |
| dzieci i młodzież niepełnosprawna intelektualnie | `G,H` |
| osoby niepełnosprawne fizycznie | `I` |
| kombinacje → złącz kody | np. `E,F` |

**Gotowa funkcja mapująca:**
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

## Krok 5 — Import DPS do bazy

Skopiuj `scripts/import-dps-slaskie.js` → `scripts/import-dps-NAZWA.js`.

**Uzupełnij tablicę danych:**
```javascript
const DPS_NOWE_WOJ = [
  {
    oficjalne_id: 1,            // lp. z rejestru (Number lub String np. 'M1')
    nazwa: 'Dom Pomocy ...',
    ulica: 'ul. Przykładowa 1',
    miejscowosc: 'Miasto',
    kod: '00-000',
    powiat: 'będziński',        // ← z POWIATY_MAP (np. 'będziński' lub 'm. Katowice')
    telefon: '32/123-45-67',
    liczba_miejsc: 100,
    profil_desc: 'osoby w podeszłym wieku', // ← tekst z PDF do mapProfil()
    prowadzacy: 'Powiat X',
    jst_nazwa: 'Powiat X',      // lub null dla bez zlecenia
  },
  // ...
];
```

**Zmień na końcu skryptu:**
```javascript
// Stare:
where: { AND: [{ wojewodztwo: 'śląskie' }, { latitude: null }] }
// Nowe:
where: { AND: [{ wojewodztwo: 'nowe-województwo' }, { latitude: null }] }

// I w create:
wojewodztwo: 'nowe-województwo',
zrodlo_dane: 'Rejestr DPS Woj. X (URL, data)',
```

**Uruchomienie:**
```bash
node scripts/import-dps-NAZWA.js
# ~1.2s na rekord (Nominatim rate limit)
```

### Geocoding — znane pułapki i fix

Import używa Nominatim. Jeśli adresy mają trudne prefiksy, geocoding zwróci 0 wyników pomimo poprawnych danych.

**Skrypt czyści prefiksy automatycznie:**
```javascript
const clean = ulica.replace(/^(ul\.|pl\.|al\.|oś\.|ks\.|bpa\.|dr\.|gen\.)\s*/gi, '').trim();
```

**Jeśli po imporcie są rekordy bez lat/lng (latitude=null):**
```bash
node -e "
require('dotenv').config();
const { PrismaClient } = require('./node_modules/@prisma/client');
const https = require('https');
const prisma = new PrismaClient();

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function geocode(ulica, miejscowosc) {
  // Usuń prefix ul./pl. itd.
  const clean = (ulica||'').replace(/^(ul\.|pl\.|al\.|oś\.|ks\.|bpa\.|dr\.|gen\.)\s*/gi,'').trim();
  const q = encodeURIComponent(clean + ', ' + miejscowosc + ', Polska');
  const url = 'https://nominatim.openstreetmap.org/search?q=' + q + '&format=json&limit=1&countrycodes=pl';
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'geocoder-research/1.0' } }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { const r = JSON.parse(d); resolve(r[0] ? { lat: +r[0].lat, lon: +r[0].lon } : null); }
        catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function main() {
  const missing = await prisma.placowka.findMany({
    where: { AND: [{ wojewodztwo: 'nowe-województwo' }, { latitude: null }] },
    select: { id: true, ulica: true, miejscowosc: true }
  });
  console.log('Do geocodowania:', missing.length);
  let ok = 0;
  for (const p of missing) {
    await sleep(1200);
    const g = await geocode(p.ulica||'', p.miejscowosc);
    if (g) {
      await prisma.placowka.update({ where: { id: p.id }, data: { latitude: g.lat, longitude: g.lon } });
      process.stdout.write('✅'); ok++;
    } else { process.stdout.write('❌'); }
  }
  console.log('\nNaprawiono:', ok, '/', missing.length);
  await prisma.\$disconnect();
}
main().catch(console.error);
"
```

Dla bardzo trudnych adresów (np. `ul. ks. bpa. Kubiny 11`) spróbuj podzielonego zapytania: `'Kubiny 11, Świętochłowice, Polska'`.

---

## Krok 6 — UI — wyszukiwarka i filtry

### 6a. Włącz województwo

```typescript
// lib/voivodeship-filter.ts
export const ENABLED_VOIVODESHIPS = ['małopolskie', 'śląskie', 'nowe-województwo'] as const;
```

### 6b. Mapowanie miast na prawach powiatu

```typescript
// lib/city-county-mapping.ts — funkcja mapCityCountyToPowiat()
// Dodaj przed "// Inne powiaty - bez zmian":
if (normalized === 'm. nowestolice' || normalized === 'nowestolice') return 'm. NoweStolice';
// Powtórz dla każdego miasta na prawach powiatu nowego woj.
```

### 6c. Usuń nowe miasta z blacklisty wyszukiwarki

```typescript
// app/search/page.tsx — CAPITAL_CITIES_BLACKLIST
// ❌ Usun z listy wszystkie miasta nowego województwa!
// Zostawiaj tylko miasta które NIGDY nie będą obsługiwane (Warszawa, Wrocław...)
```

### 6d. Dodaj center coords dla głównych miast

```typescript
// app/search/page.tsx — CITY_CENTER_COORDS
// Dodaj po sekcji "Śląskie":
'nowemiasto': { lat: XX.XXXX, lng: XX.XXXX, wojewodztwo: 'nowe-województwo' },
// ... dla wszystkich miast na prawach powiatu
```

Współrzędne centrum możesz znaleźć w Nominatim:
```bash
curl -s "https://nominatim.openstreetmap.org/search?q=Wroclaw&format=json&limit=1&countrycodes=pl" \
  -H "User-Agent: geocoder-research/1.0" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['lat'],d[0]['lon'])"
```

### 6e. Filtr powiatów w SearchResults

```typescript
// src/components/search/SearchResults.tsx
// Dodaj po ALL_SLASKIE_POWIATS:
const ALL_NOWE_WOJ_POWIATS = [
  // powiaty ziemskie (lowercase)
  'powiat1', 'powiat2', ...
  // miasta na prawach powiatu
  'm. Miasto1', 'm. Miasto2', ...
];

// Zaktualizuj defaultPowiats:
const defaultPowiats = selectedVoivodeship === 'śląskie'
  ? ALL_SLASKIE_POWIATS
  : selectedVoivodeship === 'nowe-województwo'
  ? ALL_NOWE_WOJ_POWIATS
  : ALL_MALOPOLSKA_POWIATS;
```

```tsx
// Dodaj opcję w select województwa:
<option value="nowe-województwo">NoweWojewództwo</option>
```

### 6f. PopularLocationsSection — dodaj miasta nowego województwa

```typescript
// lib/popular-cities.ts — POPULAR_CITIES_CONFIG
// Dodaj po sekcji śląskiej — KONIECZNIE z lat/lng dla non-małopolskich miast!
{ name: 'Wrocław',  slug: 'wroclaw',  voivodeship: 'dolnośląskie', lat: 51.1079, lng: 17.0385 },
{ name: 'Legnica',  slug: 'legnica',  voivodeship: 'dolnośląskie', lat: 51.2070, lng: 16.1619 },
// ... wybierz 4–6 największych miast nowego województwa
```

⚠️ **Dlaczego lat/lng jest krytyczne:** Bez koordynatów CityCard używa `city=true` który filtruje backend do placówek TYLKO w tym mieście. Dla Katowic to 3 DPS. Suwak odległości działa tylko na wynikach z serwera, więc zwiększenie do 100km nic nie zmienia.

Z `lat`/`lng`: CityCard generuje `?near=true&lat=X&lng=Y&woj=slaskie` → serwer zwraca WSZYSTKIE placówki województwa posortowane odległościowo → suwak działa poprawnie.

Liczby placówek są pobierane **dynamicznie** z `/api/stats` — nie musisz ich hardcodować.  
Miasta są wyświetlane posortowane malejąco wg liczby placówek, więc "puste" miasta (0 placówek) odpadają na dół.

Zaktualizuj tekst sekcji:
```tsx
// src/components/home/PopularLocationsSection.tsx
<p className="mt-4 ...">
  Miasta z największą liczbą placówek opieki w Małopolsce, na Śląsku i w NoweWoj.
</p>
```

**CityCard automatycznie doda `woj=XXXX` do URL** — dzięki temu klik na miasto nowego województwa od razu pre-selekcjonuje właściwe województwo w filtrach wyszukiwarki. Upewnij się że `woj` dla nowego województwa jest w mapie w `app/search/page.tsx`:

```typescript
// app/search/page.tsx — wojewodztwoMap
const wojewodztwoMap: Record<string, string> = {
  'malopolskie': 'małopolskie',
  'slaskie': 'śląskie',
  'dolnoslaskie': 'dolnośląskie',  // ← dodaj
  // ...
};
```

I że CityCard obsługuje nowy slug województwa:
```typescript
// src/components/home/CityCard.tsx — getCitySearchUrl()
// Obecna logika: dodaje woj=X dla wszystkich woj != małopolskie
// Wystarczy że voivodeship prop jest przekazane — reszta działa automatycznie
if (voivodeship && voivodeship !== 'małopolskie') {
  params.set('woj', normalizeWojSlug(voivodeship)); // dolnośląskie → dolnoslaskie
}
```

Dodaj normalizację slug jeśli brakuje:
```typescript
function normalizeWojSlug(woj: string): string {
  return woj.toLowerCase()
    .replace(/ą/g,'a').replace(/ę/g,'e').replace(/ó/g,'o').replace(/ś/g,'s')
    .replace(/ź/g,'z').replace(/ż/g,'z').replace(/ń/g,'n').replace(/ł/g,'l')
    .replace(/ć/g,'c');
}
```

### 6g. FacilityTypeCards — zsumuj liczniki ze wszystkich województw

`FacilityTypeCards` pokazuje łączną liczbę placówek każdego typu. Po dodaniu nowego województwa zaktualizuj sumowanie w `HomeClient.tsx`:

```tsx
// src/components/HomeClient.tsx
<FacilityTypeCards typeCounts={{
  DPS:        typeCounts.DPS        + typeCountsSlaskie.DPS        + typeCountsNoweWoj.DPS,
  SDS:        typeCounts.SDS        + typeCountsSlaskie.SDS        + typeCountsNoweWoj.SDS,
  KlubSenior: typeCounts.KlubSenior + typeCountsSlaskie.KlubSenior + typeCountsNoweWoj.KlubSenior,
  DDSenior:   typeCounts.DDSenior   + typeCountsSlaskie.DDSenior   + typeCountsNoweWoj.DDSenior,
  UTW:        typeCounts.UTW        + typeCountsSlaskie.UTW        + typeCountsNoweWoj.UTW,
}} />
```

Dane `typeCountsNoweWoj` oblicz w `app/page.tsx` analogicznie do `typeCountsSlaskie`:
```typescript
const noweWoj = allFacilities.filter(f => f.wojewodztwo === 'nowe-województwo');
const typeCountsNoweWoj = {
  DPS:        noweWoj.filter(f => f.typ_placowki === 'DPS').length,
  SDS:        0,
  KlubSenior: noweWoj.filter(f => f.typ_placowki === 'Klub Senior+').length,
  DDSenior:   noweWoj.filter(f => f.typ_placowki === 'Dzienny Dom Senior+').length,
  UTW:        0,
};
```

I przekaż przez `HomeClient` props (tak jak `typeCountsSlaskie`).

---

## Krok 7 — SVG mapa powiatów

### 7a. Pobierz GeoJSON

```bash
curl -s "https://raw.githubusercontent.com/ppatrzyk/polska-geojson/master/powiaty/powiaty-min.geojson" \
  -o /tmp/powiaty-min.geojson
```

Plik zawiera 380 powiatów całej Polski z polami `id` (numer sekwencyjny) i `nazwa` (np. `'powiat bytomski'`).

### 7b. Wygeneruj SVG paths skryptem Python

Użyj filtrowania **bounding box** (nie po nazwie — zbyt wiele homonimów, np. `bielski` jest w kilku woj.):

```python
# Bounding box dla Śląskiego: lon 17.8..20.2, lat 49.4..51.2
# Dostosuj dla nowego województwa
def in_new_woj_box(geom):
    pts = collect_all_points(geom)
    cx = (min(p[0] for p in pts) + max(p[0] for p in pts)) / 2
    cy = (min(p[1] for p in pts) + max(p[1] for p in pts)) / 2
    return LON_MIN < cx < LON_MAX and LAT_MIN < cy < LAT_MAX
```

**Gotowy skrypt** (dostosuj NAMES i bbox):
```python
import json

with open('/tmp/powiaty-min.geojson') as f:
    data = json.load(f)

# Ustaw bounding box dla nowego województwa (sprawdź w GeoJSON/Google Maps)
LON_MIN, LON_MAX = 17.8, 20.2   # ← zmień
LAT_MIN, LAT_MAX = 49.4, 51.2   # ← zmień

def get_center(geom):
    pts = []
    if geom['type'] == 'Polygon':
        for ring in geom['coordinates']: pts.extend(ring)
    elif geom['type'] == 'MultiPolygon':
        for poly in geom['coordinates']:
            for ring in poly: pts.extend(ring)
    return sum(p[0] for p in pts)/len(pts), sum(p[1] for p in pts)/len(pts)

features_in_box = [f for f in data['features'] if LON_MIN < get_center(f['geometry'])[0] < LON_MAX
                   and LAT_MIN < get_center(f['geometry'])[1] < LAT_MAX]
print(f"Znaleziono {len(features_in_box)} features")

# NAMES: mapowanie "oczyszczona nazwa GeoJSON" → "nazwa powiatu w app + TERYT ID"
NAMES = {
    'będziński': ('będziński', '2401'),
    'bytom': ('m. Bytom', '2462'),
    # ... uzupełnij dla wszystkich powiatów nowego woj
}

def clean(n): return n.lower().replace('powiat ','').replace('miasto ','').strip()

# Projekcja na viewport 600x420
all_pts = []
for f in features_in_box:
    geom = f['geometry']
    if geom['type'] == 'Polygon':
        for ring in geom['coordinates']: all_pts.extend(ring)
    elif geom['type'] == 'MultiPolygon':
        for poly in geom['coordinates']:
            for ring in poly: all_pts.extend(ring)

lons = [p[0] for p in all_pts]; lats = [p[1] for p in all_pts]
min_lon, max_lon = min(lons), max(lons)
min_lat, max_lat = min(lats), max(lats)
VW, VH, PAD = 600, 420, 15

def project(lon, lat):
    x = PAD + (lon-min_lon)/(max_lon-min_lon)*(VW-2*PAD)
    y = VH - PAD - (lat-min_lat)/(max_lat-min_lat)*(VH-2*PAD)
    return round(x,1), round(y,1)

# ... (reszta skryptu jak w generate_slaskie_svg.py który możesz skopiować)
```

Pełny działający skrypt (inline): uruchom `python3 - << 'PYEOF' ... PYEOF` w terminalu — przykład w historii sesji #20.

### 7c. Skopiuj wygenerowany plik

```bash
cp /tmp/nowe-woj-counties.ts src/components/data/nowe-woj-counties.ts
```

### 7d. Struktura pliku counties.ts

Plik musi eksportować:
```typescript
export const NOWE_WOJ_COUNTIES: County[]    // array 36 powiatów z SVG paths
export const MAP_META_NOWE_WOJ              // { viewBox: '0 0 600 420' }
export const DB_NAME_TO_ID_NOWE_WOJ: Record<string, string>  // lookup powiat→id
```

**⚠️ KRYTYCZNA PUŁAPKA — prefix `m.`:**

W bazie powiaty grodzkie są zapisane jako `'m. Katowice'`. W `DB_NAME_TO_ID` wygenerowanym skryptem Python dodawane są warianty **bez** prefiksu (`'katowice'`, `'Katowice'`), ale **nie** z prefiksem `'m. katowice'`.

Lookup w `RegionalMap.tsx` sam stripuje prefix `m. ` przed szukaniem:
```typescript
const lookupName = dbName.startsWith('m. ') ? dbName.slice(3) : dbName;
const normalized = normalizePowiatName(lookupName);
const id = dbToId[normalized] ?? dbToId[lookupName] ?? dbToId[dbName];
```

Jeśli to działa → miasta będą widoczne na mapie.  
Jeśli nie → sprawdź czy `DB_NAME_TO_ID` ma przynajmniej `'katowice'` (bez `m. `) jako klucz.

---

## Krok 8 — RegionalMap — przełącznik województw

### 8a. Dodaj import nowych counties

```typescript
// src/components/home/RegionalMap.tsx
import { NOWE_WOJ_COUNTIES, MAP_META_NOWE_WOJ, DB_NAME_TO_ID_NOWE_WOJ } from '@/src/components/data/nowe-woj-counties';
```

### 8b. Dodaj opcję do tablicy Voivodeship

```typescript
type Voivodeship = 'małopolskie' | 'śląskie' | 'nowe-województwo';
```

### 8c. Rozszerz switch na counties/meta/dbToId

```typescript
const counties = activeVoivodeship === 'śląskie' ? SLASKIE_COUNTIES
  : activeVoivodeship === 'nowe-województwo' ? NOWE_WOJ_COUNTIES
  : MALOPOLSKIE_COUNTIES;

const mapMeta = activeVoivodeship === 'śląskie' ? MAP_META_SLASKIE
  : activeVoivodeship === 'nowe-województwo' ? MAP_META_NOWE_WOJ
  : MAP_META;

const dbToId = activeVoivodeship === 'śląskie' ? DB_NAME_TO_ID_SLASKIE
  : activeVoivodeship === 'nowe-województwo' ? DB_NAME_TO_ID_NOWE_WOJ
  : DB_NAME_TO_ID;

const activePowiatCounts = activeVoivodeship === 'śląskie' ? powiatCountsByTypeSlaskie
  : activeVoivodeship === 'nowe-województwo' ? powiatCountsByTypeNoweWoj
  : powiatCountsByType;
```

### 8d. Dodaj pill w toggle

```tsx
{(['małopolskie', 'śląskie', 'nowe-województwo'] as Voivodeship[]).map(woj => (
  <button key={woj} onClick={() => { setActiveVoivodeship(woj); setHoveredId(null); }}
    className={activeVoivodeship === woj ? 'bg-white shadow...' : 'text-slate-500...'}>
    {woj === 'małopolskie' ? '🟢 Małopolskie'
     : woj === 'śląskie' ? '🔵 Śląskie'
     : '🟡 NoweWoj'}
  </button>
))}
```

### 8e. Dodaj dane w app/page.tsx

```typescript
// Dodaj po bloku dla slaskie:
const noweWoj = allFacilities.filter(f => f.wojewodztwo === 'nowe-województwo');
const typeCountsNoweWoj = { DPS: noweWoj.filter(f => f.typ_placowki === 'DPS').length, ... };
const powiatCountsByTypeNoweWoj = { DPS: {}, KlubSenior: {}, DDSenior: {} };
for (const f of noweWoj) {
  if (f.typ_placowki === 'DPS') powiatCountsByTypeNoweWoj.DPS[f.powiat] = ...
}
```

### 8f. Dodaj props w HomeClient.tsx

```typescript
interface HomeClientProps {
  // ... istniejące
  typeCountsNoweWoj: { DPS: number; ... };
  powiatCountsByTypeNoweWoj: Record<...>;
}
```

---

## Krok 9 — GitHub Actions — monitoring PDF

Skopiuj `scripts/monitor-dps-slaskie.py` → `scripts/monitor-dps-NAZWA.py`:

```python
# Zmień:
PDF_URL = "https://URL_DO_PDF_NOWEGO_WOJ"
SENTINEL_FILE = 'raw_dane/NAZWA/.dps_NAZWA_last_hash'
```

Monitor sprawdza nagłówki HTTP (`Last-Modified`, `ETag`, `Content-Length`) — nie pobiera całego PDF.

Skopiuj `.github/workflows/slaskie-dps-monitor.yml` → `.github/workflows/NAZWA-dps-monitor.yml`:

```yaml
# Zmień schedule — inny dzień żeby nie kolidować:
# Śląskie: 8. każdego miesiąca
# Kolejne woj: 15., 22. itd.
- cron: '0 9 15 * *'

# Zmień steps:
run: python scripts/monitor-dps-NAZWA.py
```

Inicjalizacja sentinela:
```bash
mkdir -p raw_dane/NAZWA
python3 scripts/monitor-dps-NAZWA.py
# Pierwsze uruchomienie: "Inicjalizacja — zapisano hash: XXXX"
```

---

## Krok 10 — Weryfikacja końcowa

```bash
node -e "
require('dotenv').config();
const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();
async function main() {
  const woj = 'nowe-województwo';
  const teryt = await p.terytLocation.count({ where: { wojewodztwo: woj } });
  const dps = await p.placowka.count({ where: { wojewodztwo: woj, typ_placowki: 'DPS' } });
  const noGeo = await p.placowka.count({ where: { wojewodztwo: woj, latitude: null } });
  console.log('TERYT:', teryt, '| DPS:', dps, '| bez geo:', noGeo);
  // Sprawdź rozkład per powiat
  const byPowiat = await p.placowka.groupBy({
    by: ['powiat'], where: { wojewodztwo: woj, typ_placowki: 'DPS' },
    _count: { id: true }, orderBy: { powiat: 'asc' }
  });
  byPowiat.forEach(r => console.log(' ', r.powiat, '->', r._count.id));
  await p.\$disconnect();
}
main();
"
```

**Checklist:**
- [ ] TERYT > 0 lokalizacji
- [ ] DPS total > 0, bez geo = 0
- [ ] Dev server: wyszukaj `http://localhost:3000` → wpisz główne miasto → pojawia się lista
- [ ] Filtr "Województwo" → nowe woj → lista powiatów zmienia się
- [ ] Strona główna → mapa → toggle → mapa nowego woj się wyświetla
- [ ] Tooltip na mapie pokazuje prawidłowe liczby (w tym 0 gdy brak, nie null)
- [ ] Klik na powiat → przejście do wyszukiwarki z filtrem
- [ ] Monitor: `python3 scripts/monitor-dps-NAZWA.py` → "Brak zmian"

---

## Krok 11 — Aktualizacja dokumentacji

### CLAUDE.md

```markdown
- **Total rekordów**: XYZ placówek
  - Małopolskie: 363 | Śląskie: 104 | NoweWoj: XX
- TerytLocation: XX,XXX lokalizacji
  - Małopolskie: 13,831 | Śląskie: 3,987 | NoweWoj: XXXX
```

W sekcji COMMIT HISTORY dodaj commit z opisem.  
W sekcji TODO usuń "nowe woj" jeśli skończone lub zaktualizuj.

### ADDING_VOIVODESHIP.md (ten plik)

Uzupełnij tabelę w sekcji "Gotowe przykłady" poniżej.

---

## Gotowe przykłady

### DPS + TERYT + Mapa

| Województwo   | WOJ | TERYT script                  | DPS script               | Counties file               | Monitor DPS                   |
|---------------|-----|-------------------------------|--------------------------|-----------------------------|-------------------------------|
| Małopolskie   | 12  | `import-teryt-filtered.js`    | *(dane w CSV)*           | `malopolskie-counties.ts`   | `senior-plus-monitor.yml`     |
| **Śląskie**   | 24  | `import-teryt-slaskie.js`     | `import-dps-slaskie.js`  | `slaskie-counties.ts`       | `slaskie-dps-monitor.yml`     |
| Dolnośląskie  | 02  | *(do zrobienia)*              | *(do zrobienia)*         | *(do zrobienia)*            | *(do zrobienia)*              |

### MOPS/GOPS/CUS

| Województwo   | Źródło PDF                                          | Parser               | Import                   | Monitor                      | Cron    |
|---------------|-----------------------------------------------------|----------------------|--------------------------|------------------------------|---------|
| Małopolskie   | MUW Małopolska (CSV RJPS)                           | `import-mops-full.ts`| `import-mops-full.ts`    | *(brak dedykowanego)*        | —       |
| **Śląskie**   | `www.katowice.uw.gov.pl/download/441`               | `parse-mops-slaskie.py` | `import-mops-slaskie.js` | `slaskie-mops-monitor.yml` | 20.     |
| Dolnośląskie  | `https://www.duw.pl/` → Wydział Polityki Społecznej | *(do zrobienia)*     | *(do zrobienia)*         | *(do zrobienia)*             | 25.?    |

---

## Krok 12 — MOPS/GOPS/CUS — import i monitoring

MOPS (i odpowiedniki: GOPS, CUS, MOPR, MGOPS) są odrębną bazą od DPS — trafiają do tabeli
`MopsContact`, nie `Placowka`. Wyszukiwarka `/mops` i `/api/mops/search` nie filtrują po
województwie, więc nowe dane pojawiają się automatycznie po imporcie.

### 12a. Znajdź źródło danych

Każdy UW publikuje wykaz ośrodków pomocy społecznej:
```
https://www.MIASTO.uw.gov.pl/ → Wydział Rodziny i Polityki Społecznej → Wykaz OPS
```

Śląskie: `https://www.katowice.uw.gov.pl/download/441` (stały URL, aktualizowany w miejscu)

**⚠️ Sprawdź z `www.`** — wiele UW ma przekierowanie tylko na subdomenę `www.`:
```bash
curl -I "https://www.MIASTO.uw.gov.pl/download/XXX" -H "User-Agent: geocoder-research/1.0"
# Powinno zwrócić: HTTP 200 | Type: application/pdf
```

### 12b. Pobierz i obejrzyj PDF

```bash
curl -L "https://www.MIASTO.uw.gov.pl/download/XXX" -o raw_dane/NAZWA/ops_NAZWA.pdf \
  -H "User-Agent: geocoder-research/1.0"
python3 -c "
import pypdf
r = pypdf.PdfReader('raw_dane/NAZWA/ops_NAZWA.pdf')
print(f'Stron: {len(r.pages)}')
print(r.pages[0].extract_text()[:800])
"
```

Typowa struktura kolumn PDF:
`Powiat | Gmina | Nazwa | Kod pocztowy | Miejscowość | Ulica | Nr | Telefon | E-mail`

### 12c. Skopiuj i dostosuj parser

```bash
cp scripts/parse-mops-slaskie.py scripts/parse-mops-NAZWA.py
```

**Zmiany do wprowadzenia:**

```python
# 1. Ścieżki plików
PDF_PATH = 'raw_dane/NAZWA/ops_NAZWA.pdf'
CSV_PATH = 'raw_dane/NAZWA/ops_NAZWA.csv'

# 2. Lista powiatów ziemskich nowego województwa
POWIATY_ZIEMSKIE = ['powiat1', 'powiat2', ...]

# 3. Lista powiatów grodzkich (miast na pr. powiatu)
POWIATY_GRODZKIE = ['Miasto1', 'Miasto2', ...]
```

Uruchom i sprawdź wynik:
```bash
python3 scripts/parse-mops-NAZWA.py
# Powinno: "Sparsowano X rekordów z Y stron"
# Sprawdź: czy typy MOPS/GOPS/CUS są dobrze wykryte
# Sprawdź: czy adresy mają "ul." w polu adres
```

**Mapowanie typów** (z nazwy instytucji):
| Nazwa zawiera | Typ w DB |
|---------------|----------|
| `Centrum Usług Społecznych` | `CUS` |
| `Miejski Ośrodek Pomocy Społecznej` | `MOPS` |
| `Miejski Ośrodek Pomocy Rodzinie` | `MOPS` |
| `Miejsko-Gminny OPS` | `GOPS` |
| `Gminno-Miejski OPS` | `GOPS` |
| `Gminny Ośrodek Pomocy Społecznej` | `GOPS` |
| `Ośrodek Pomocy Społecznej` (bez kwalifikatora) | `GOPS` |

### 12d. Skopiuj i dostosuj import

```bash
cp scripts/import-mops-slaskie.js scripts/import-mops-NAZWA.js
```

**Zmień tylko:**
```javascript
// Ścieżki
const csvContent = fs.readFileSync('raw_dane/NAZWA/ops_NAZWA.csv', 'utf-8');
// ...
notes: `Źródło: Wykaz OPS woj. NAZWA (URL, data)`,
// W danych:
wojewodztwo: 'nowe-województwo',
```

**Uruchomienie** (~1.2s × liczba rekordów):
```bash
node scripts/import-mops-NAZWA.js
# Oczekiwane: ✅✅✅... 166/167 geocoded, 0 errors
```

**Weryfikacja w bazie:**
```bash
node -e "
require('dotenv').config();
const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient();
async function main(){
  const total = await p.mopsContact.count({where:{wojewodztwo:'nowe-województwo'}});
  const noGeo = await p.mopsContact.count({where:{wojewodztwo:'nowe-województwo',latitude:null}});
  const byTyp = await p.mopsContact.groupBy({by:['typ'],where:{wojewodztwo:'nowe-województwo'},_count:{id:true}});
  console.log('Total:',total,'| bez GPS:',noGeo);
  byTyp.forEach(r=>console.log(' ',r.typ,'→',r._count.id));
  await p.\$disconnect();
}
main();"
```

### 12e. Monitor + GitHub Action

```bash
cp scripts/monitor-mops-slaskie.py scripts/monitor-mops-NAZWA.py
cp .github/workflows/slaskie-mops-monitor.yml .github/workflows/NAZWA-mops-monitor.yml
```

**W skrypcie monitora zmień:**
```python
PDF_URL = "https://www.MIASTO.uw.gov.pl/download/XXX"
PAGE_URL = "https://www.MIASTO.uw.gov.pl/wydzial/wydzial-rodziny-i-polityki-spolecznej"
SENTINEL_FILE = '...raw_dane/NAZWA/.mops_NAZWA_last_hash'
```

**W workflow zmień:**
```yaml
# Inny dzień niż inne monitory (sprawdź SCRAPER.md → kalendarz)
- cron: '0 9 25 * *'   # np. 25. każdego miesiąca
run: python scripts/monitor-mops-NAZWA.py
git add raw_dane/NAZWA/.mops_NAZWA_last_hash
```

**Inicjalizacja sentinela:**
```bash
python3 scripts/monitor-mops-NAZWA.py
# "✅ Inicjalizacja — zapisano hash: XXXXXXXXXXXXXXXX"
```

### 12f. Checklist MOPS

- [ ] PDF dostępny pod poprawnym URL (z `www.`)
- [ ] Parser: `X rekordów z Y stron` (X > 50 dla typowego województwa)
- [ ] CSV: wszystkie kolumny wypełnione, brak pustych `nazwa`
- [ ] Import: 0 błędów, >95% geocodowanych
- [ ] Baza: `mopsContact.count(where: {wojewodztwo})` > 0
- [ ] `/mops` → wyszukaj miasto z nowego woj → wyniki się pojawiają
- [ ] Monitor: `python3 scripts/monitor-mops-NAZWA.py` → "Brak zmian"
- [ ] GitHub Action: ręczne uruchomienie z `workflow_dispatch` → sukces
- [ ] Kalendarz monitorów (SCRAPER.md) zaktualizowany

---

## Znane pułapki (ze śląskiej integracji)

| # | Problem | Symptom | Fix |
|---|---------|---------|-----|
| 1 | **Zły kod WOJ** | AI podał WOJ=16 zamiast 24 | Zawsze weryfikuj przez SIMC grep |
| 2 | **Geocoding z prefiksem ul.** | 97/100 rekordów bez koordynat | Strip `ul./pl./ks.bpa.` przed zapytaniem |
| 3 | **Geocoding 2-etapowy** | Trudny adres: `ul. dr E. Cyrana 10` | Spróbuj `Cyrana 10, Miasto, Polska` |
| 4 | **prefix `m.` w DB_NAME_TO_ID** | Miasta pokazują 0 na mapie | Lookup stripuje `m. ` przed szukaniem w mapie |
| 5 | **Duplikaty GeoJSON** | `bielski` pasuje do 2 powiatów | Filtruj po bounding box, nie po nazwie |
| 6 | **CAPITAL_CITIES_BLACKLIST** | Katowice/Gliwice dają "poza regionem" | Usuń śląskie miasta z blacklisty |
| 7 | **availablePowiats z terytPowiats** | Filtr powiatów pokazuje stare powiaty po zmianie woj | Używaj `defaultPowiats` zamiast `terytPowiats` |
| 8 | **SSL cert Python** | `urllib.request` nie otwiera HTTPS | Użyj `curl` do pobrania, Python czyta plik lokalnie |
| 9 | **BOM w SIMC CSV** | Pierwszy kolumn = `﻿WOJ` zamiast `WOJ` | `encoding='utf-8-sig'` w Pythonie lub `.replace(/^﻿/, '')` w Node.js |
| 10 | **Filie DPS** | Jedna lp. ma dwa adresy | Importuj jako osobne rekordy z tym samym `oficjalne_id` |
| 11 | **CityCard bez woj=** | Klik na miasto śląskie → filtr województwa pokazuje "Wszystkie" | Przekaż `voivodeship` prop do CityCard — doda `?woj=slaskie` do URL automatycznie |
| 14 | **CityCard city=true dla śląskich** | Klik na Katowice → tylko 3 DPS, suwak odległości nie działa | Dodaj `lat`/`lng` do `POPULAR_CITIES_CONFIG` dla śląskich miast; CityCard użyje `?near=true&lat=X&lng=Y&woj=slaskie` zamiast `city=true` |
| 15 | **near=true suwak bez efektu** | Zwiększenie suwaka do 100km nie dodaje placówek | Serwer (page.tsx) filtrował wyniki do 30km przed odesłaniem do klienta. Fix: gdy `woj≠'all'` (klik z CityCard) zwróć WSZYSTKIE placówki woj. posortowane odległościowo; klient filtruje suwakiem. Gdy `woj='all'` (GPS) — zachowaj stary filtr 30km na serwerze |
| 12 | **FacilityTypeCards stary licznik** | DPS pokazuje tylko Małopolskę (95) zamiast łącznej (195) | Zsumuj `typeCounts + typeCountsSlaskie + ...` w HomeClient.tsx |
| 13 | **PopularLocations brak śląskich miast** | Śląskie miasta nie pojawiają się w sekcji "Największe ośrodki" | Dodaj do `POPULAR_CITIES_CONFIG` + zaktualizuj tekst sekcji |
| 16 | **MOPS: URL bez `www.`** | `katowice.uw.gov.pl/download/441` → 404; monitor hashuje stronę błędu | Zawsze sprawdź z `www.` — `curl -I https://www.MIASTO.uw.gov.pl/download/XXX` |
| 17 | **MOPS: URL DPS Śląskiego zmienia się** | Po aktualizacji PDF nazwa pliku zawiera datę — stary URL zwraca 404 | Monitor wykryje zmianę Content-Length; sprawdź stronę UW ręcznie po Issue |
| 18 | **MOPS: plain OPS bez kwalifikatora** | "Ośrodek Pomocy Społecznej w Chorzowie" — MOPS czy GOPS? | Grodzki powiat (miasto na pr. powiatu) → MOPS; ziemski → GOPS. W `map_typ()` domyślnie GOPS |
| 19 | **MOPS: wieloliniowe telefony w PDF** | Jeden rekord rozbity na 3 linie (multi-phone) | Sklejaj linie buforem aż trafisz na email na końcu (sentinel = email) |
| 20 | **MOPS: adresy bez ulicy (numer-only)** | "Jasienica 845" — brak `ul.`, tylko numer | Geocoding: `{miejscowosc} {numer}, Polska`; ~2-4 rekordy na województwo bez GPS |
| 21 | **CityCard Śląskie: city=true zamiast near=true** | Klik Zabrze pokazywał placówki "w okolicy" zamiast "tylko w Zabrzu" | CityCard używa `?q=Zabrze&city=true&woj=slaskie` — identycznie jak Małopolska |

---

*Ostatnia aktualizacja: 2026-05-20 (sesja #21 — MOPS Śląskie + blueprint Krok 12)*  
*Ostatni commit: 53c0fd6 (SCRAPER.md — 8 cronów + kalendarz)*
