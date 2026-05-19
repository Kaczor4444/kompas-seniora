# SCRAPER — Dokumentacja i dobre praktyki

## Monitory GitHub Actions — pełna tabela

| Workflow | Skrypt | Źródło danych | Metoda | Cron (UTC) | Dzień | Sekrety |
|----------|--------|---------------|--------|------------|-------|---------|
| `dps-pdf-monitor.yml` | `monitor-dps-pdf.py` | MUW Małopolska — Wykaz DPS (PDF) | hash pliku | `0 8 1,15 * *` | 1. i 15. | `DATABASE_URL` |
| `wolne-miejsca-monitor.yml` | `monitor-wolne-miejsca.py` | MUW Małopolska — Wolne miejsca DPS (XLSX) | hash pliku | `0 8 1,8,15 * *` | 1., 8., 15. | `DATABASE_URL` |
| `gus-bdl-monitor.yml` | `monitor-gus-bdl.py` | GUS BDL API — Ludność poprodukcyjna (var. 72293) | JSON API | `0 9 1 * *` | 1. | `GUS_BDL_KEY` |
| `gus-emerytury-monitor.yml` | `monitor-gus-emerytury.py` | GUS BDL API — Przeciętna emerytura ZUS (var. 155058) | JSON API | `30 9 1 * *` | 1. | `GUS_BDL_KEY` |
| `senior-plus-monitor.yml` | `monitor-senior-plus.py` | MUW Małopolska — Ośrodki Senior+ (XLSX) | hash pliku | `30 9 1 * *` | 1. | `DATABASE_URL` |
| `mddps-krakow-monitor.yml` | `monitor-mddps-krakow.py` | BIP Kraków — MDDPS (dziennik zmian) | data edycji | `0 8 5 * *` | 5. | — |
| `slaskie-dps-monitor.yml` | `monitor-dps-slaskie.py` | UW Śląski — Rejestr DPS (PDF) | HTTP headers hash | `0 9 8 * *` | 8. | — |
| `slaskie-mops-monitor.yml` | `monitor-mops-slaskie.py` | UW Śląski — Wykaz OPS (PDF) | HTTP headers hash | `0 9 20 * *` | 20. | — |

### Kalendarz miesięczny

```
Dzień  Godz (UTC)  Workflow
  1.     08:00    dps-pdf-monitor         → MUW Małopolska PDF DPS
  1.     08:00    wolne-miejsca-monitor   → MUW Małopolska XLSX wolne miejsca
  1.     09:00    gus-bdl-monitor         → GUS BDL API ludność poprodukcyjna
  1.     09:30    gus-emerytury-monitor   → GUS BDL API emerytury
  1.     09:30    senior-plus-monitor     → MUW Małopolska XLSX Senior+
  5.     08:00    mddps-krakow-monitor    → BIP Kraków MDDPS
  8.     08:00    wolne-miejsca-monitor   → MUW Małopolska XLSX wolne miejsca
  8.     09:00    slaskie-dps-monitor     → UW Śląski PDF DPS
 15.     08:00    dps-pdf-monitor         → MUW Małopolska PDF DPS
 15.     08:00    wolne-miejsca-monitor   → MUW Małopolska XLSX wolne miejsca
 20.     09:00    slaskie-mops-monitor    → UW Śląski PDF OPS (MOPS/GOPS/CUS)
```

**⚠️ Uwagi o konfliktach:**
- **1. dnia miesiąca** uruchamia się 5 workflowów — GitHub Actions kolejkuje je równolegle, bez problemu
- `gus-emerytury` i `senior-plus` mają identyczny cron (`30 9 1 * *`) — działają równolegle
- `dps-pdf` i `wolne-miejsca` startują o tej samej godzinie 8:00 dnia 1. i 15. — OK

### Sekrety GitHub Actions

| Secret | Używany przez | Gdzie ustawić |
|--------|--------------|---------------|
| `GITHUB_TOKEN` | wszystkie (auto) | automatyczny, bez konfiguracji |
| `DATABASE_URL` | dps-pdf, senior-plus, wolne-miejsca | GitHub → Settings → Secrets → Actions |
| `GUS_BDL_KEY` | gus-bdl, gus-emerytury | GitHub → Settings → Secrets → Actions |

**⚠️ `DATABASE_URL` i `GUS_BDL_KEY` muszą być ustawione ręcznie** — bez nich trzy monitory
crashują przy próbie importu nowych danych do bazy.

---

## Źródła danych — szczegóły

### MUW Małopolska — DPS (PDF)
- **URL:** `https://www.malopolska.uw.gov.pl/doc/wykaz%20dps.pdf`
- **Format:** PDF — `monitor-dps-pdf.py` parsuje pdfplumber
- **Metoda:** hash całego pliku (SHA-256 pierwsze 64KB jako fallback)
- **Sentinel:** `raw_dane/malopolskie/.dps_malopolska_last_hash` *(lub podobny)*
- **Akcja przy zmianie:** GitHub Issue + próba auto-importu przez DATABASE_URL

### MUW Małopolska — Wolne miejsca DPS (XLSX)
- **URL:** `https://www.malopolska.uw.gov.pl/doc/wolne_miejsca_w_dps.xlsx`
- **Format:** Excel (openpyxl)
- **Metoda:** hash pliku
- **Cron:** 3× miesięcznie (1., 8., 15.) — najczęściej aktualizowany plik
- **Akcja:** GitHub Issue + próba auto-importu

### MUW Małopolska — Senior+ (XLSX)
- **URL:** `https://www.malopolska.uw.gov.pl/Docs/Wykaz%20funkcjonujących%20ośrodków%20Senior%20w%20Małopolsce.xlsx`
- **Format:** Excel (openpyxl)
- **Uwaga:** SSL verify=False (certyfikat MUW ma problemy)
- **Kolumny:** lp, rodzaj, liczba_miejsc, jst, woj, ulica, kod, miasto, tel, email, rok
- **Sentinel:** hash pliku
- **Akcja:** GitHub Issue + próba auto-importu przez DATABASE_URL

### BIP Kraków — MDDPS
- **URL:** `https://bip.krakow.pl/?dok_id=78643&vReg=1`
- **Metoda:** data ostatniej edycji z dziennika zmian (HTML parsing)
- **Sentinel:** `raw_dane/krakow/.mddps_last_change` = `2023-03-20 14:58:55`
- **Akcja:** tylko GitHub Issue (brak auto-importu — dane wymagają ręcznej weryfikacji)

### GUS BDL API — Ludność poprodukcyjna
- **URL:** `https://bdl.stat.gov.pl/api/v1/data/by-variable/72293`
- **Zmienna:** 72293 — Ludność w wieku poprodukcyjnym ogółem
- **Metoda:** JSON API, sprawdza czy pojawiły się dane za rok 2025
- **Klucz:** `GUS_BDL_KEY` (env secret)
- **Akcja:** GitHub Issue

### GUS BDL API — Przeciętna emerytura ZUS
- **URL:** `https://bdl.stat.gov.pl/api/v1/data/by-variable/155058`
- **Zmienna:** 155058 — Przeciętna miesięczna emerytura ZUS brutto per województwo (P2860)
- **Metoda:** JSON API, sprawdza nowe dane za bieżący rok
- **Klucz:** `GUS_BDL_KEY` (env secret)
- **Akcja:** GitHub Issue

### UW Śląski — Rejestr DPS (PDF)
- **URL:** `https://www.katowice.uw.gov.pl/files/146/Rejestr_dom__w_pomocy_spo__ecznej__aktualizacja_z_dnia_12_03_2026.pdf`
- **⚠️ URL zmienia się przy każdej aktualizacji** (data w nazwie pliku)
- **Metoda:** HTTP headers hash (`Last-Modified` + `ETag` + `Content-Length`)
- **Sentinel:** `raw_dane/slaskie/.dps_slaskie_last_hash`
- **Akcja:** GitHub Issue (brak auto-importu — wymaga ręcznego parsowania PDF)

### UW Śląski — Wykaz OPS/MOPS/GOPS/CUS (PDF)
- **URL:** `https://www.katowice.uw.gov.pl/download/441`
- **⚠️ Wymaga `www.`** — bez www. zwraca 404
- **Strona nadrzędna:** `https://www.katowice.uw.gov.pl/wydzial/wydzial-rodziny-i-polityki-spolecznej`
- **Metoda:** HTTP headers hash (`Last-Modified: 2023-07-19`, `Content-Length: 94795`)
- **Sentinel:** `raw_dane/slaskie/.mops_slaskie_last_hash` = `5b4f52bd8bc75aaf`
- **Akcja:** GitHub Issue z instrukcją: pobierz PDF → `parse-mops-slaskie.py` → diff CSV → `import-mops-slaskie.js`

### senioralna.malopolska.pl — UTW
- **URL:** `https://www.senioralna.malopolska.pl/wyszukiwarka-wsparcia-seniorow/`
- **robots.txt:** ✅ dozwolone (tylko `/wp-admin/` zablokowane, sprawdzone 2026-05-17)
- **Typ:** WordPress, dane w tabeli HTML (`<tr class='tematyczne'>`)
- **Liczba wpisów:** 213 (wszystkie w DOM — paginacja tylko JS)

**Struktura HTML listingu:**
```
td[0] = lp | td[1] = nazwa | td[2] = typ | td[3] = powiat | td[4] = gmina | td[5] = link "SZCZEGÓŁY"
```

**⚠️ URL podstron używa polskiego ó:**
```
✅ /wyszukiwarka-wsparcia-seniorów/nazwa-placowki/  ← działa
❌ /wyszukiwarka-wsparcia-seniorow/nazwa-placowki/  ← 404
```

**Struktura HTML strony szczegółowej (`<div class='details_map1'>`):**
```html
<li><img alt="adres"> tekst adresu</li>
<li><img alt="numer telefonu"> telefon</li>
<li><img alt="Adres e-mail"> email</li>
<li><img alt="stronie internetowej"> link www</li>
```
Uwaga: używaj `==` lub `startswith`, nie `in` dla pola `alt`.

---

## Jednorazowe skrypty importu

| Skrypt | Co robi | Źródło |
|--------|---------|--------|
| `parse-mops-slaskie.py` | PDF OPS Śląskie → CSV (pypdf + regex) | `raw_dane/slaskie/ops_slaskie.pdf` |
| `import-mops-slaskie.js` | CSV → MopsContact DB z geocodingiem | `raw_dane/slaskie/ops_slaskie.csv` |
| `import-dps-slaskie.js` | Hardcoded 100 DPS Śląskie → DB | PDF UW Śląski |
| `import-teryt-slaskie.js` | SIMC CSV → TerytLocation (WOJ=24) | `data/SIMC_Adresowy_20250922.csv` |
| `import-senior-plus.py` | XLSX MUW → Placowka DB + geocoding | MUW Małopolska XLSX |
| `import-mddps-krakow.py` | Hardcoded 16 placówek MDDPS → DB | BIP Kraków |
| `scrape-utw-malopolska.py` | Scraping 52 UTW → CSV | senioralna.malopolska.pl |

---

## User-Agent — zasady

### HTML scraping (senioralna, BIP, strony publiczne)
```python
'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
```

### Nominatim (geocoding)
```python
'User-Agent': 'geocoder-research/1.0'
```
**NIE używać nazwy projektu ani domeny** — Nominatim ToS wymaga identyfikującego UA,
ale ujawnienie `kompas-seniora.pl` niepotrzebnie łączy geokodowanie z projektem.

### Monitory rządowe (MUW PDF/XLSX, UW PDF, BIP)
```python
'User-Agent': 'geocoder-research/1.0'
```
Transparentny dostęp do publicznych danych instytucjonalnych.

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
time.sleep(1.2)  # przed każdym geocodingiem
```

### Sesja z nagłówkami
```python
session = requests.Session()
session.headers.update({
    'User-Agent': '...',
    'Accept': 'text/html,...',
    'Accept-Language': 'pl-PL,pl;q=0.9',
    'Referer': LISTING_URL,
})
```

### Zapis inkrementalny — nie czekaj do końca
```python
with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for entry in entries:
        result = scrape(entry)
        writer.writerow(result)
        f.flush()  # ← zapisuje natychmiast po każdym wpisie
```

### Wzorzec monitora (HTTP headers hash)
```python
def get_file_hash(url):
    r = requests.head(url, headers=HEADERS, timeout=20, verify=False, allow_redirects=True)
    parts = []
    for h in ['Last-Modified', 'ETag', 'Content-Length']:
        v = r.headers.get(h, '')
        if v: parts.append(f"{h}:{v}")
    if parts:
        return hashlib.sha256('\n'.join(parts).encode()).hexdigest()[:16]
    # Fallback: pobierz pierwsze 64KB
    r2 = requests.get(url, headers={**HEADERS, 'Range': 'bytes=0-65535'}, ...)
    return hashlib.sha256(chunk).hexdigest()[:16]
```

---

## Geocoding — Nominatim

**Polityka:** max 1 req/s, wymagany identyfikujący User-Agent.

```python
import unicodedata

def ascii_query(s):
    """⚠️ KLUCZOWE: Nominatim nie radzi sobie z polskimi znakami w query!"""
    s = s.replace('ł', 'l').replace('Ł', 'L')
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii')

def geocode(ulica, miejscowosc):
    time.sleep(1.2)
    city  = ascii_query(miejscowosc)
    # Usuń prefiksy ul./pl./al. przed zapytaniem
    clean = re.sub(r'^(ul\.|pl\.|al\.|oś\.|ks\.|bpa\.|dr\.|gen\.)\s*', '', ulica or '', flags=re.I)
    clean = ascii_query(clean.strip())
    queries = [f"{clean}, {city}, Poland"] if clean else []
    queries.append(f"{city}, Poland")  # fallback
    for q in queries:
        r = requests.get('https://nominatim.openstreetmap.org/search',
            params={'q': q, 'format': 'json', 'limit': 1, 'countrycodes': 'pl'},
            headers={'User-Agent': 'geocoder-research/1.0'}, timeout=10)
        data = r.json()
        if data:
            return float(data[0]['lat']), float(data[0]['lon'])
        time.sleep(1.2)
    return None, None
```

**⚠️ `Chrzanów, Małopolska, Polska` → 0 wyników. `Chrzanow, Poland` → działa.**
Zawsze normalizuj i używaj `Poland` zamiast `Polska`.

**Prefiksy do wyczyszczenia przed geocodingiem:**
`ul. | pl. | al. | oś. | os. | ks. | bpa. | dr. | gen. | rynek `
Bez czyszczenia: 97% rekordów bez GPS (błąd z Śląskiego importu DPS).

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

### Parser tabeli PDF (wzorzec Śląski OPS)
Gdy PDF to tabela bez separatorów — użyj kodu pocztowego jako anchora:
```python
pc = re.search(r'\b(\d{2}-\d{3})\b', line)
before_pc = line[:pc.start()]   # powiat + gmina + nazwa
after_pc  = line[pc.end():]     # miejscowosc + adres + telefon + email
email = re.search(r'(\S+@\S+\.\S+)\s*$', line)
```
Szczegółowy parser: `scripts/parse-mops-slaskie.py`

---

## TODO

- [ ] Monitor UTW Małopolska (`monitor-utw-malopolska.py`) — hash HTML tabeli z senioralna.malopolska.pl
- [ ] Zapis inkrementalny w `scrape-utw-malopolska.py`
- [ ] Ustawić `DATABASE_URL` secret w GitHub → Settings → Secrets → Actions (wymagane przez 3 monitory)
- [ ] Ustawić `GUS_BDL_KEY` secret (wymagane przez gus-bdl i gus-emerytury)
- [ ] URL Śląskiego DPS zmienia się przy każdej aktualizacji — po wykryciu zmiany sprawdzić stronę UW ręcznie
