#!/usr/bin/env python3
"""
Monitor rejestru DPS województwa Śląskiego.
Sprawdza czy strona katowice.uw.gov.pl zmieniła datę/link do PDF.
Wzorowany na monitor-mddps-krakow.py.

Uruchamiany przez GitHub Actions: .github/workflows/slaskie-dps-monitor.yml
"""

import os
import re
import sys
import hashlib
import requests

# Strona z linkiem do PDF (sprawdzamy nagłówki HTTP żeby wykryć zmianę pliku)
PDF_URL = "https://www.katowice.uw.gov.pl/files/146/Rejestr_dom__w_pomocy_spo__ecznej__aktualizacja_z_dnia_12_03_2026.pdf"
# Strona nadrzędna do sprawdzenia nowego linku jeśli PDF zmieni URL
PAGE_URL = "https://www.katowice.uw.gov.pl"
SENTINEL_FILE = os.path.join(os.path.dirname(__file__), '..', 'raw_dane', 'slaskie', '.dps_slaskie_last_hash')
HEADERS = {'User-Agent': 'geocoder-research/1.0'}

GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GITHUB_REPO = os.environ.get('GITHUB_REPOSITORY', 'Kaczor4444/kompas-seniora')
FORCE_CHECK = os.environ.get('FORCE_CHECK', '').lower() in ('1', 'true', 'yes')


def get_pdf_hash(url: str) -> str | None:
    """
    Sprawdza nagłówki HTTP pliku PDF (Last-Modified, Content-Length, ETag).
    Jeśli nagłówki niedostępne — pobiera pierwsze 64KB i hashuje.
    """
    try:
        # Najpierw HEAD request (szybkie, bez pobierania)
        r = requests.head(url, headers=HEADERS, timeout=20, verify=False, allow_redirects=True)
        sig_parts = []
        for h in ['Last-Modified', 'ETag', 'Content-Length']:
            val = r.headers.get(h, '')
            if val:
                sig_parts.append(f"{h}:{val}")
                print(f"   {h}: {val}")

        if sig_parts:
            return hashlib.sha256('\n'.join(sig_parts).encode()).hexdigest()[:16]

        # Fallback: pobierz pierwsze 64KB PDF i hashuj
        print("   (nagłówki niedostępne — pobieranie fragmentu PDF)")
        r2 = requests.get(url, headers={**HEADERS, 'Range': 'bytes=0-65535'},
                          timeout=30, verify=False, stream=True)
        chunk = b''
        for c in r2.iter_content(65536):
            chunk += c
            break
        return hashlib.sha256(chunk).hexdigest()[:16]
    except Exception as e:
        print(f"❌ Błąd sprawdzania PDF: {e}")
        return None


def read_sentinel() -> str | None:
    try:
        with open(SENTINEL_FILE) as f:
            return f.read().strip()
    except FileNotFoundError:
        return None


def write_sentinel(value: str):
    os.makedirs(os.path.dirname(SENTINEL_FILE), exist_ok=True)
    with open(SENTINEL_FILE, 'w') as f:
        f.write(value)


def create_github_issue(current_hash: str, previous_hash: str):
    if not GITHUB_TOKEN:
        print("⚠️  Brak GITHUB_TOKEN — nie tworzę Issue")
        return

    title = "🔄 Zmiana w rejestrze DPS Śląskiego — sprawdź aktualizację"
    body = f"""## Wykryto zmianę w rejestrze DPS województwa śląskiego

**Strona monitorowana:** {MONITOR_URL}

**Hash poprzedni:** `{previous_hash}`
**Hash obecny:** `{current_hash}`

## Co zrobić

1. Otwórz stronę: {MONITOR_URL}
2. Pobierz nowy PDF rejestru DPS
3. Porównaj z poprzednią wersją (sprawdź nowe wpisy, zmiany adresów, tel.)
4. Jeśli są nowe DPS — zaktualizuj `scripts/import-dps-slaskie.js` i uruchom import
5. Zaktualizuj plik sentinel: `raw_dane/slaskie/.dps_slaskie_last_hash`

## Skrypt importu

```bash
node scripts/import-dps-slaskie.js
```

---
*Wygenerowane automatycznie przez GitHub Actions — slaskie-dps-monitor.yml*
"""

    resp = requests.post(
        f"https://api.github.com/repos/{GITHUB_REPO}/issues",
        headers={
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github+json',
        },
        json={'title': title, 'body': body, 'labels': ['data-update', 'slaskie']},
        timeout=30,
    )
    if resp.status_code == 201:
        print(f"✅ Issue utworzone: {resp.json()['html_url']}")
    else:
        print(f"❌ Błąd tworzenia Issue: {resp.status_code} {resp.text}")


def main():
    print(f"🔍 Sprawdzam PDF rejestru DPS Śląskiego:")
    print(f"   {PDF_URL}")

    current_hash = get_pdf_hash(PDF_URL)
    if not current_hash:
        print("❌ Nie udało się pobrać strony")
        sys.exit(1)

    previous_hash = read_sentinel()
    print(f"   Hash poprzedni: {previous_hash or 'BRAK (pierwsze uruchomienie)'}")
    print(f"   Hash obecny:    {current_hash}")

    if previous_hash is None:
        write_sentinel(current_hash)
        print(f"✅ Inicjalizacja — zapisano hash: {current_hash}")
        return

    if current_hash == previous_hash and not FORCE_CHECK:
        print("✅ Brak zmian — rejestr aktualny")
        return

    if FORCE_CHECK and current_hash == previous_hash:
        print("⚡ FORCE_CHECK — symulacja zmiany")

    print(f"🔔 WYKRYTO ZMIANĘ! Tworzę GitHub Issue...")
    create_github_issue(current_hash, previous_hash)
    write_sentinel(current_hash)
    print(f"✅ Sentinel zaktualizowany: {current_hash}")


if __name__ == '__main__':
    main()
