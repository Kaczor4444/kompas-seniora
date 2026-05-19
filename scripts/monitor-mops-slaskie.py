#!/usr/bin/env python3
"""
Monitor wykazu OPS województwa śląskiego (katowice.uw.gov.pl).
Sprawdza nagłówki HTTP PDF — jeśli zmienione, tworzy GitHub Issue.

Uruchamiany przez GitHub Actions: .github/workflows/slaskie-mops-monitor.yml
Cron: 20. każdego miesiąca o 9:00 UTC

Uruchomienie ręczne:
  python3 scripts/monitor-mops-slaskie.py
"""
import os
import sys
import hashlib
import requests

# Strona z wykazem OPS śląskiego
PDF_URL = "https://katowice.uw.gov.pl/download/441"
PAGE_URL = "https://katowice.uw.gov.pl"
SENTINEL_FILE = os.path.join(
    os.path.dirname(__file__), '..', 'raw_dane', 'slaskie', '.mops_slaskie_last_hash'
)
HEADERS = {'User-Agent': 'geocoder-research/1.0'}

GITHUB_TOKEN     = os.environ.get('GITHUB_TOKEN')
GITHUB_REPO      = os.environ.get('GITHUB_REPOSITORY', 'Kaczor4444/kompas-seniora')
FORCE_CHECK      = os.environ.get('FORCE_CHECK', '').lower() in ('1', 'true', 'yes')


def get_file_hash(url: str) -> str | None:
    """Sprawdza nagłówki HTTP lub pobiera fragment do hasha."""
    try:
        r = requests.head(url, headers=HEADERS, timeout=20, verify=False, allow_redirects=True)
        parts = []
        for h in ['Last-Modified', 'ETag', 'Content-Length']:
            v = r.headers.get(h, '')
            if v:
                parts.append(f"{h}:{v}")
                print(f"   {h}: {v}")

        if parts:
            return hashlib.sha256('\n'.join(parts).encode()).hexdigest()[:16]

        # Fallback: pierwsze 64KB
        print("   (nagłówki niedostępne — pobieranie fragmentu)")
        r2 = requests.get(url, headers={**HEADERS, 'Range': 'bytes=0-65535'},
                          timeout=30, verify=False, stream=True)
        chunk = b''
        for c in r2.iter_content(chunk_size=8192):
            chunk += c
            if len(chunk) >= 65536:
                break
        return hashlib.sha256(chunk).hexdigest()[:16]

    except Exception as e:
        print(f"   ⚠️  Błąd: {e}")
        return None


def read_sentinel() -> str | None:
    try:
        with open(SENTINEL_FILE) as f:
            return f.read().strip()
    except FileNotFoundError:
        return None


def write_sentinel(h: str):
    os.makedirs(os.path.dirname(SENTINEL_FILE), exist_ok=True)
    with open(SENTINEL_FILE, 'w') as f:
        f.write(h)


def create_github_issue(old_hash: str, new_hash: str):
    if not GITHUB_TOKEN:
        print("   ⚠️  Brak GITHUB_TOKEN — pomijam tworzenie issue")
        return
    title = "🔔 Wykaz OPS Śląskiego — wykryto zmianę pliku!"
    body = f"""## Zmiana wykazu OPS województwa śląskiego

**URL:** {PDF_URL}
**Hash poprzedni:** `{old_hash}`
**Hash nowy:** `{new_hash}`

### Co zrobić:
1. Pobierz nowy PDF: [{PDF_URL}]({PDF_URL})
2. Skopiuj do `raw_dane/slaskie/ops_slaskie.pdf`
3. Uruchom parser: `python3 scripts/parse-mops-slaskie.py`
4. Sprawdź diff CSV: `git diff raw_dane/slaskie/ops_slaskie.csv`
5. Uruchom import: `node scripts/import-mops-slaskie.js`
6. Zaktualizuj sentinel i zrób commit

### Zmiany mogą zawierać:
- Nowe ośrodki (nowe gminy lub przekształcenia)
- Zmienione adresy, telefony, emaile
- Zmiany typów (GOPS → CUS itp.)

🤖 Automatycznie wykryto przez `monitor-mops-slaskie.py`
"""
    resp = requests.post(
        f"https://api.github.com/repos/{GITHUB_REPO}/issues",
        headers={
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json',
        },
        json={'title': title, 'body': body, 'labels': ['data-update', 'slaskie']},
        timeout=30,
    )
    if resp.status_code == 201:
        print(f"   ✅ Issue utworzone: {resp.json()['html_url']}")
    else:
        print(f"   ⚠️  Błąd issue: {resp.status_code} {resp.text[:200]}")


def main():
    print(f"🔍 Monitor MOPS Śląskiego")
    print(f"   URL: {PDF_URL}")

    current_hash = get_file_hash(PDF_URL)
    if not current_hash:
        print("❌ Nie udało się pobrać hasha — przerywam")
        sys.exit(1)

    prev_hash = read_sentinel()

    if prev_hash is None:
        write_sentinel(current_hash)
        print(f"✅ Inicjalizacja — zapisano hash: {current_hash}")
        return

    print(f"   Hash poprzedni: {prev_hash}")
    print(f"   Hash aktualny:  {current_hash}")

    if current_hash == prev_hash and not FORCE_CHECK:
        print("✅ Brak zmian — wykaz OPS bez zmian")
        return

    print("🚨 WYKRYTO ZMIANĘ!")
    create_github_issue(prev_hash, current_hash)
    write_sentinel(current_hash)
    print(f"   Sentinel zaktualizowany → {current_hash}")


if __name__ == '__main__':
    main()
