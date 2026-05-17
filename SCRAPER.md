# SCRAPER — Dokumentacja i dobre praktyki

## Istniejące skrypty

### Monitory (GitHub Actions, cron)

| Skrypt | Źródło | Metoda detekcji | Cron |
|--------|--------|-----------------|------|
| `monitor-senior-plus.py` | MUW XLSX (ośrodki Senior+) | SHA-256 hash pliku | 1. każdego miesiąca |
| `monitor-dps-pdf.py` | MUW PDF (wykaz DPS) | SHA-256 hash pliku | 1. każdego miesiąca |
| `monitor-mddps-krakow.py` | BIP Kraków (MDDPS) | data z dziennika zmian | 5. każdego miesiąca |
| `monitor-wolne-miejsca.py` | ? | ? | ? |

**Wzorzec monitorów:**
1. Pobierz plik/stronę
2. Porównaj hash / datę z sentinel plikiem w `raw_dane/`
3. Brak zmian → brak akcji
4. Zmiana → GitHub Issue z raportem do ręcznej weryfikacji
5. `FORCE_CHECK=true` wymusza raport bez względu na hash

### Jednorazowe importy

| Skrypt | Co robi |
|--------|---------|
| `import-senior-plus.py` | Import XLSX MUW → PostgreSQL + geocoding |
| `import-mddps-krakow.py` | Hardcoded 16 placówek MDDPS Kraków → PostgreSQL |
| `scrape-utw-malopolska.py` | Scraping 52 UTW z senioralna.malopolska.pl → CSV |

---

## Źródła danych

### senioralna.malopolska.pl
- **URL:** `https://www.senioralna.malopolska.pl/wyszukiwarka-wsparcia-seniorow/`
- **robots.txt:** ✅ dozwolone (tylko `/wp-admin/` zablokowane, sprawdzone 2026-05-17)
- **Typ:** WordPress, dane w tabeli HTML (`<tr class='tematyczne'>`)
- **Liczba wpisów:** 213 (wszystkie w DOM — paginacja tylko JS)
- **Kategorie:** Dom Pomocy Społecznej | Klub Senior+ | Dzienny Dom Senior+ | Uniwersytet Trzeciego Wieku
- **UTW:** 52 placówki

**Struktura HTML listingu (tabela):**
```
td[0] = lp (numer)
td[1] = nazwa
td[2] = typ (np. "Uniwersytet Trzeciego Wieku")
td[3] = powiat
td[4] = gmina/miejscowosc
td[5] = link "SZCZEGÓŁY"
```

**⚠️ WAŻNE: URL podstron używa polskiego ó:**
```
✅ /wyszukiwarka-wsparcia-seniorów/nazwa-placowki/   ← działa
❌ /wyszukiwarka-wsparcia-seniorow/nazwa-placowki/   ← 404
```
Linki z listingu mają `seniorów` (z ó) — requests poprawnie je enkoduje.

**Struktura HTML strony szczegółowej (`<div class='details_map1'>`):**
```html
<li><img alt="adres"> tekst adresu</li>
<li><img alt="numer telefonu"> telefon</li>
<li><img alt="Adres e-mail"> email</li>
<li><img alt="stronie internetowej"> link www</li>
```
Uwaga: `alt="adres"` vs `alt="Adres e-mail"` — nie używaj `in`, tylko `==` lub `startswith`.

### MUW Małopolska — Senior+
- **URL XLSX:** `https://www.malopolska.uw.gov.pl/Docs/Wykaz%20funkcjonujących%20ośrodków%20Senior%20w%20Małopolsce.xlsx`
- **Uwaga:** SSL verify=False (certyfikat MUW ma problemy)
- **Format:** openpyxl, kolumny: lp, rodzaj, liczba_miejsc, jst, woj, ulica, kod, miasto, tel, email, rok

### BIP Kraków — MDDPS
- **URL:** `https://bip.krakow.pl/?dok_id=78643`
- **Dziennik zmian:** `?vReg=1`
- **Sentinel:** `raw_dane/krakow/.mddps_last_change` = `2023-03-20 14:58:55`

---

## User-Agent — zasady

### HTML scraping (senioralna, BIP, strony publiczne)
```python
'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
```
Wygląda jak normalny browser. Używać gdy zależy na niewidoczności.

### Nominatim (geocoding)
```python
'User-Agent': 'geocoder-research/1.0'
```
**NIE używać nazwy projektu ani domeny** — Nominatim ToS wymaga identyfikującego UA,
ale ujawnienie `kompas-seniora.pl` niepotrzebnie łączy geokodowanie z projektem.

### Monitory rządowe (MUW PDF/XLSX, BIP)
```python
'User-Agent': 'KompasSeniora/1.0 (kompas-seniora.pl)'
```
Transparentny dostęp do publicznych danych instytucjonalnych — OK.

---

## Dobre praktyki scrapingu

### Opóźnienia
```python
import random, time

def human_delay():
    time.sleep(random.uniform(3.0, 7.0))   # między requestami

def long_break():
    time.sleep(random.uniform(15.0, 30.0)) # co 10 wpisów

# Nominatim wymaga max 1 req/s
time.sleep(1.1)  # przed każdym geocodingiem
```

### Sesja z nagłówkami (wygląda jak browser)
```python
session = requests.Session()
session.headers.update({
    'User-Agent': '...',
    'Accept': 'text/html,...',
    'Accept-Language': 'pl-PL,pl;q=0.9',
    'Referer': LISTING_URL,  # ustawiaj przed każdym requestem "kliknięcia"
})
```

### Losowa kolejność
```python
random.shuffle(utw_list)  # nie scrapuj alfabetycznie
```

### Zapis inkrementalny — nie czekaj do końca
```python
# Otwórz CSV na początku, zapisuj po każdym wpisie
with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for entry in entries:
        result = scrape(entry)
        writer.writerow(result)
        f.flush()   # ← kluczowe, zapisuje natychmiast
```
Jeśli skrypt padnie w połowie — masz wszystko co do tej pory zebrane.

### Sprawdź robots.txt przed startem
```bash
curl https://example.com/robots.txt
```

### Normalizacja powiatów z listingów
Senioralna.malopolska.pl zwraca np. `"miasto Kraków"` zamiast `"m. Kraków"`.
Mapowanie (`lib/city-county-mapping.ts`) i funkcja `normalizePolish()` są po stronie TS/JS —
w skryptach Python trzeba to powtórzyć ręcznie lub zostawić do poprawki w imporcie.

---

## Geocoding — Nominatim

**Polityka:** max 1 req/s, wymagany identyfikujący User-Agent, atrybucja w produkcie.

```python
import unicodedata

def ascii_query(s):
    """⚠️ KLUCZOWE: Nominatim nie radzi sobie z polskimi znakami w query!"""
    s = s.replace('ł', 'l').replace('Ł', 'L')
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii')

def geocode(ulica, miejscowosc):
    time.sleep(1.1)
    city  = ascii_query(miejscowosc)
    clean = ascii_query(ulica) if ulica else ''
    queries = [f"{clean}, {city}, Poland"] if clean else []
    queries.append(f"{city}, Poland")  # fallback
    for q in queries:
        r = requests.get('https://nominatim.openstreetmap.org/search',
            params={'q': q, 'format': 'json', 'limit': 1, 'countrycodes': 'pl'},
            headers={'User-Agent': 'geocoder-research/1.0'}, timeout=10)
        data = r.json()
        if data:
            return float(data[0]['lat']), float(data[0]['lon'])
        time.sleep(1.1)
    return None, None
```

**⚠️ WAŻNE: Nominatim + polskie znaki = brak wyników!**
`Chrzanów, Małopolska, Polska` → 0 wyników. `Chrzanow, Poland` → działa.
Zawsze normalizuj polskie znaki przez `ascii_query()` przed wysłaniem do Nominatim.
Używaj `Poland` zamiast `Polska` w query.

**Uwaga UTW:** UTW często spotykają się w domach kultury/szkołach — adres to adres
gospodarza, nie UTW. Geocoding trafia w budynek, nie "siedzibę" UTW. Akceptowalne.

---

## Parsowanie adresów

```python
import re

def parse_address(adres):
    # "ul. Szkolna 43, 32-410 Dobczyce" → ("ul. Szkolna 43", "32-410", "Dobczyce")
    m = re.match(r'^(.+?),\s*(\d{2}-\d{3})\s+(.+)$', adres.strip())
    if m:
        return m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
    return adres, None, None
```

---

## TODO

- [ ] Dodać zapis inkrementalny do `scrape-utw-malopolska.py`
- [ ] Dodać normalizację powiatów (`"miasto Kraków"` → `"m. Kraków"`) do skryptu UTW
- [ ] Napisać `monitor-utw-malopolska.py` (cron, hash HTML tabeli UTW → GitHub Issue)
- [ ] Sprawdzić czy monitory w `.github/workflows/` mają ustawiony `DATABASE_URL` secret
