#!/usr/bin/env python3
"""
Monitor zmian na BIP Kraków — wykaz MDDPS (Miejskie Dzienne Domy Pomocy Społecznej).

Sprawdza datę ostatniej edycji w dzienniku zmian dokumentu.
Gdy data jest nowsza niż zapamiętana → tworzy GitHub Issue do ręcznej weryfikacji.

Strona: https://bip.krakow.pl/?dok_id=78643
Dziennik: https://bip.krakow.pl/?dok_id=78643&vReg=1

Uruchomienie lokalne:
  export GITHUB_TOKEN=... GITHUB_REPOSITORY=Kaczor4444/kompas-seniora
  python3 scripts/monitor-mddps-krakow.py
"""

import os
import re
import sys
import json
import requests

BIP_URL = 'https://bip.krakow.pl/?dok_id=78643&vReg=1'
BIP_DOC_URL = 'https://bip.krakow.pl/?dok_id=78643'
HASH_FILE = 'raw_dane/krakow/.mddps_last_change'

GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN', '')
GITHUB_REPOSITORY = os.environ.get('GITHUB_REPOSITORY', '')
FORCE_CHECK = os.environ.get('FORCE_CHECK', 'false').lower() == 'true'


def fetch_last_change() -> str | None:
    """Pobiera datę ostatniej zmiany z dziennika BIP."""
    headers = {
        'User-Agent': 'KompasSeniora/1.0 (kompas-seniora.pl)',
        'Accept': 'text/html,application/xhtml+xml',
    }
    try:
        r = requests.get(BIP_URL, headers=headers, timeout=15)
        r.raise_for_status()
        # Szukaj dat w formacie YYYY-MM-DD HH:MM:SS
        dates = re.findall(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}', r.text)
        if dates:
            return sorted(dates, reverse=True)[0]
        print('⚠️  Brak dat na stronie BIP — format mógł się zmienić')
        return None
    except requests.RequestException as e:
        print(f'❌ Błąd pobierania BIP: {e}')
        return None


def read_stored_date() -> str:
    try:
        with open(HASH_FILE) as f:
            return f.read().strip()
    except FileNotFoundError:
        return ''


def write_stored_date(date: str) -> None:
    os.makedirs(os.path.dirname(HASH_FILE), exist_ok=True)
    with open(HASH_FILE, 'w') as f:
        f.write(date + '\n')


def create_github_issue(old_date: str, new_date: str) -> None:
    if not GITHUB_TOKEN or not GITHUB_REPOSITORY:
        print('⚠️  Brak GITHUB_TOKEN/GITHUB_REPOSITORY — pomijam tworzenie Issue')
        return

    title = f'[MDDPS Kraków] Zmiana na BIP — {new_date[:10]}'
    body = f"""## Wykryto zmianę w wykazie MDDPS Kraków

Strona BIP z wykazem Miejskich Dziennych Domów Pomocy Społecznej w Krakowie została zaktualizowana.

| | |
|---|---|
| **Poprzednia zmiana** | `{old_date}` |
| **Nowa zmiana** | `{new_date}` |
| **Strona BIP** | [{BIP_DOC_URL}]({BIP_DOC_URL}) |
| **Dziennik zmian** | [{BIP_URL}]({BIP_URL}) |

## Co sprawdzić ręcznie

1. Otwórz [stronę BIP]({BIP_DOC_URL}) i porównaj listę placówek z aktualną bazą
2. Nowe placówki → uruchom `scripts/import-mddps-krakow.py` po aktualizacji listy w skrypcie
3. Zamknięte placówki → usuń lub zdezaktywuj w bazie przez Prisma Studio
4. Zmiany adresów/telefonów → zaktualizuj ręcznie w bazie

## Kontekst

MDDPS Kraków to 16 placówek finansowanych przez Miasto Kraków (poza programem MRPiPS Senior+):
- 6 Miejskich Dziennych Domów Pomocy Społecznej (nr 1–6)
- 10 Klubów Samopomocy (samopomocy + aktywizacyjne + specjalistyczny)

Ostatnia zmiana przed tą: 2023-03-20 (ponad 2 lata stabilności).

---
*Wygenerowane automatycznie przez `scripts/monitor-mddps-krakow.py`*
"""
    url = f'https://api.github.com/repos/{GITHUB_REPOSITORY}/issues'
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github+json',
    }
    payload = {
        'title': title,
        'body': body,
        'labels': ['dane', 'monitoring', 'mddps-krakow'],
    }
    r = requests.post(url, headers=headers, json=payload, timeout=15)
    if r.status_code == 201:
        issue_url = r.json().get('html_url', '')
        print(f'✅ Issue utworzone: {issue_url}')
    else:
        print(f'❌ Błąd tworzenia Issue: {r.status_code} — {r.text}')


def main() -> None:
    print(f'Sprawdzam: {BIP_URL}')

    current = fetch_last_change()
    if current is None:
        print('Nie można pobrać daty — kończę bez akcji')
        sys.exit(0)

    stored = read_stored_date()
    print(f'Zapamiętana data: {stored or "(brak)"}')
    print(f'Aktualna data:    {current}')

    if current == stored and not FORCE_CHECK:
        print('✅ Brak zmian')
        sys.exit(0)

    if current != stored:
        print(f'🔔 Wykryto zmianę! {stored} → {current}')
        create_github_issue(stored, current)
        write_stored_date(current)
        print(f'Zapisano nową datę do {HASH_FILE}')
    elif FORCE_CHECK:
        print('ℹ️  FORCE_CHECK=true — tworzę Issue mimo braku zmiany')
        create_github_issue(stored, current)


if __name__ == '__main__':
    main()
