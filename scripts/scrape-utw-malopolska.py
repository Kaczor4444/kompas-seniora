#!/usr/bin/env python3
"""
Scraper UTW (Uniwersytety Trzeciego Wieku) z senioralna.malopolska.pl.
Zbiera 52 placówki UTW z Małopolski i zapisuje do raw_dane/utw_malopolska.csv.

Uruchomienie:
  python3 scripts/scrape-utw-malopolska.py

Wynik:
  raw_dane/utw_malopolska.csv  — dane gotowe do przejrzenia i importu

Restart: skrypt pomija już zapisane URLe — bezpieczne uruchamianie wielokrotne.
"""

import csv
import random
import re
import sys
import time
import unicodedata
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BASE_URL    = "https://www.senioralna.malopolska.pl"
LISTING_URL = f"{BASE_URL}/wyszukiwarka-wsparcia-seniorow/"
OUTPUT_CSV  = Path(__file__).resolve().parent.parent / 'raw_dane' / 'utw_malopolska.csv'

BROWSER_HEADERS = {
    'User-Agent':              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept':                  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language':         'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding':         'gzip, deflate',  # bez br — requests nie dekoduje Brotli
    'Connection':              'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest':          'document',
    'Sec-Fetch-Mode':          'navigate',
    'Sec-Fetch-User':          '?1',
    'sec-ch-ua':               '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile':        '?0',
    'sec-ch-ua-platform':      '"macOS"',
}

NOMINATIM_HEADERS = {'User-Agent': 'geocoder-research/1.0'}

CSV_FIELDS = [
    'nazwa', 'typ_placowki', 'ulica', 'miejscowosc', 'kod_pocztowy',
    'powiat', 'wojewodztwo', 'telefon', 'email', 'strona_www',
    'latitude', 'longitude', 'zrodlo_url',
]

# Normalizacja powiatów z listingu senioralna.malopolska.pl → format bazy
POWIAT_MAP = {
    'miasto kraków':    'm. Kraków',
    'miasto tarnów':    'm. Tarnów',
    'miasto nowy sącz': 'm. Nowy Sącz',
    'kraków':           'm. Kraków',
    'tarnów':           'm. Tarnów',
    'nowy sącz':        'm. Nowy Sącz',
}


# ── Helpers ────────────────────────────────────────────────────────────────

def human_delay():
    time.sleep(random.uniform(3.0, 7.0))

def long_break():
    t = random.uniform(15.0, 30.0)
    print(f"  ☕ przerwa {t:.0f}s...")
    time.sleep(t)

def normalize_powiat(raw: str) -> str:
    key = raw.strip().lower()
    return POWIAT_MAP.get(key, raw.strip())

def load_done_urls() -> set[str]:
    """Wczytaj URLe już zapisane w CSV — do pominięcia przy restarcie."""
    if not OUTPUT_CSV.exists():
        return set()
    with open(OUTPUT_CSV, newline='', encoding='utf-8') as f:
        return {row['zrodlo_url'] for row in csv.DictReader(f) if row.get('zrodlo_url')}


# ── Krok 1: listing ────────────────────────────────────────────────────────

def fetch_listing(session: requests.Session) -> list[dict]:
    print("📋 Pobieranie listingu...")
    session.headers['Sec-Fetch-Site'] = 'none'  # pierwsze wejście — brak referer
    r = session.get(LISTING_URL, timeout=15)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, 'html.parser')

    rows = soup.find_all('tr', class_='tematyczne')
    if not rows:
        sys.exit("❌ Brak wierszy w listingu — strona mogła zmienić strukturę lub zwróciła błąd.")

    utw = []
    for row in rows:
        cells = row.find_all('td')
        if len(cells) < 6:
            continue
        if cells[2].get_text(strip=True) != 'Uniwersytet Trzeciego Wieku':
            continue
        link_tag = row.find('a', href=lambda h: h and 'wyszukiwarka-wsparcia-senior' in h)
        if not link_tag:
            continue
        utw.append({
            'nazwa':       cells[1].get_text(strip=True),
            'powiat':      normalize_powiat(cells[3].get_text(strip=True)),
            'miejscowosc': cells[4].get_text(strip=True),
            'url':         link_tag['href'],
        })

    if not utw:
        sys.exit("❌ Listing załadowany, ale 0 UTW — sprawdź filtr typu.")

    print(f"  {len(rows)} wierszy łącznie, {len(utw)} UTW")
    return utw


# ── Krok 2: szczegóły ─────────────────────────────────────────────────────

def fetch_with_retry(session: requests.Session, url: str, max_retries: int = 3) -> requests.Response:
    for attempt in range(1, max_retries + 1):
        r = session.get(url, timeout=15)
        if r.status_code == 429:
            wait = 30 * attempt
            print(f"  ⏳ 429 rate limit — czekam {wait}s (próba {attempt}/{max_retries})")
            time.sleep(wait)
            continue
        if r.status_code >= 500:
            wait = 10 * attempt
            print(f"  ⚠️  {r.status_code} błąd serwera — czekam {wait}s (próba {attempt}/{max_retries})")
            time.sleep(wait)
            continue
        r.raise_for_status()
        return r
    raise RuntimeError(f"Nie udało się pobrać {url} po {max_retries} próbach")

def parse_details(soup) -> dict:
    adres = telefon = email = strona_www = None
    details = soup.find('div', class_='details_map1')
    if not details:
        return {}
    for li in details.find_all('li'):
        img = li.find('img')
        a   = li.find('a')
        if not img or not a:
            continue
        alt  = img.get('alt', '').strip().lower()
        text = a.get_text(strip=True)
        href = a.get('href', '')
        if alt == 'adres':
            adres = text
        elif alt == 'numer telefonu':
            telefon = text
        elif 'e-mail' in alt:
            email = text
        elif 'stroni' in alt or 'internet' in alt:
            strona_www = href if href.startswith('http') else text
    return {'adres': adres, 'telefon': telefon, 'email': email, 'strona_www': strona_www}

def parse_address(adres: str | None) -> tuple[str | None, str | None, str | None]:
    """'ul. Szkolna 43, 32-410 Dobczyce' → (ulica, kod, miasto)"""
    if not adres:
        return None, None, None
    m = re.match(r'^(.+?),\s*(\d{2}-\d{3})\s+(.+)$', adres.strip())
    if m:
        return m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
    return adres, None, None


# ── Krok 3: geocoding ─────────────────────────────────────────────────────

def clean_street(ulica: str) -> str:
    """Usuwa śmieci z pola ulicy przed geocodingiem."""
    original = ulica
    # Jeśli zaczyna się od kodu pocztowego (np. "32-600 Oświęcim, ul. Foo 1")
    # — wyciągnij ul./al. fragment z oryginału
    if re.match(r'^\d{2}-\d{3}', ulica.strip()):
        m = re.search(r'(ul\.|os\.|al\.|pl\.)\s*[\w\s]+\s+[\d\w/]+', ulica, re.IGNORECASE)
        return m.group(0).strip() if m else ''
    # Usuń numery pokojów, piętra, opisy
    ulica = re.sub(r'\s*(pok\.?|pokój|piętro|parter|p\.)\s*[\w\d\-/]*', '', ulica, flags=re.IGNORECASE)
    # Usuń kody pocztowe w środku/na końcu (np. "ul. Foo 1 32-600 Kraków")
    ulica = re.sub(r'\s*\d{2}-\d{3}.*$', '', ulica)
    # Usuń opisy za średnikiem lub w nawiasach
    ulica = re.sub(r'\s*[;(].*$', '', ulica)
    # Jeśli nadal jest "Dom Kultury X ul. Foo 1" — wyciągnij ul./al. fragment
    m = re.search(r'(ul\.|os\.|al\.|pl\.)\s*[\w\s]+\s+[\d\w/]+', ulica, re.IGNORECASE)
    if m:
        ulica = m.group(0)
    return ulica.strip() or original.strip()

def ascii_query(s: str) -> str:
    """Nominatim nie radzi sobie z polskimi znakami — normalizuj przed zapytaniem."""
    s = s.replace('ł', 'l').replace('Ł', 'L')
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode('ascii')

def geocode(ulica: str | None, miejscowosc: str) -> tuple[float | None, float | None]:
    time.sleep(1.1)  # Nominatim: max 1 req/s
    city  = ascii_query(re.sub(r'\s*,.*$', '', miejscowosc).strip())
    queries = []
    if ulica:
        clean = ascii_query(clean_street(ulica))
        if clean:
            queries.append(f"{clean}, {city}, Poland")
    queries.append(f"{city}, Poland")  # fallback

    for query in queries:
        try:
            r = requests.get(
                'https://nominatim.openstreetmap.org/search',
                params={'q': query, 'format': 'json', 'limit': 1, 'countrycodes': 'pl'},
                headers=NOMINATIM_HEADERS,
                timeout=10,
            )
            data = r.json()
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
        except Exception as e:
            print(f"    ⚠️  geocoding error ({query[:40]}): {e}")
        time.sleep(1.1)

    return None, None


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)

    # Sesja wspólna dla całego scrapingu (cookies, keep-alive)
    session = requests.Session()
    session.headers.update(BROWSER_HEADERS)

    utw_list  = fetch_listing(session)
    done_urls = load_done_urls()

    todo = [e for e in utw_list if e['url'] not in done_urls]
    if not todo:
        print("✅ Wszystkie UTW już zapisane w CSV.")
        return

    if done_urls:
        print(f"  ↩️  Wznawianie — pominięto {len(done_urls)} już zapisanych, pozostało {len(todo)}")

    random.shuffle(todo)

    # Otwórz CSV w trybie append — zapis po każdym wpisie
    is_new = not OUTPUT_CSV.exists() or OUTPUT_CSV.stat().st_size == 0
    with open(OUTPUT_CSV, 'a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        if is_new:
            writer.writeheader()

        for i, entry in enumerate(todo, 1):
            print(f"\n[{i}/{len(todo)}] {entry['nazwa'][:60]}")

            if i > 1 and (i - 1) % 10 == 0:
                long_break()

            human_delay()

            # Pobierz szczegóły
            details = {}
            try:
                session.headers['Referer']       = LISTING_URL
                session.headers['Sec-Fetch-Site'] = 'same-origin'  # klik z listingu
                r = fetch_with_retry(session, entry['url'])
                soup = BeautifulSoup(r.text, 'html.parser')
                details = parse_details(soup)
            except Exception as e:
                print(f"  ❌ błąd pobierania: {e}")

            ulica, kod_pocztowy, miasto_z_adresu = parse_address(details.get('adres'))
            miejscowosc = miasto_z_adresu or entry['miejscowosc']

            print(f"  ulica: {ulica} | miasto: {miejscowosc} | tel: {details.get('telefon')}")

            # Geocoding (bez dodatkowego human_delay — geocode() ma własny sleep)
            lat, lon = geocode(ulica, miejscowosc)
            print(f"  geo: {lat:.4f}, {lon:.4f}" if lat else "  ⚠️  brak geolokalizacji")

            row = {
                'nazwa':        entry['nazwa'],
                'typ_placowki': 'UTW',
                'ulica':        ulica        or '',
                'miejscowosc':  miejscowosc,
                'kod_pocztowy': kod_pocztowy or '',
                'powiat':       entry['powiat'],
                'wojewodztwo':  'małopolskie',
                'telefon':      details.get('telefon') or '',
                'email':        details.get('email')   or '',
                'strona_www':   details.get('strona_www') or '',
                'latitude':     lat or '',
                'longitude':    lon or '',
                'zrodlo_url':   entry['url'],
            }
            writer.writerow(row)
            f.flush()  # zapisz natychmiast na dysk

    # Podsumowanie
    with open(OUTPUT_CSV, newline='', encoding='utf-8') as f:
        all_rows = list(csv.DictReader(f))

    print(f"\n{'='*60}")
    print(f"✅ CSV: {len(all_rows)} UTW w {OUTPUT_CSV.name}")
    print(f"   Geolokalizacja: {sum(1 for r in all_rows if r['latitude'])}/{len(all_rows)}")
    print(f"   Telefon:        {sum(1 for r in all_rows if r['telefon'])}/{len(all_rows)}")
    print(f"   Email:          {sum(1 for r in all_rows if r['email'])}/{len(all_rows)}")
    print(f"   WWW:            {sum(1 for r in all_rows if r['strona_www'])}/{len(all_rows)}")


if __name__ == '__main__':
    main()
