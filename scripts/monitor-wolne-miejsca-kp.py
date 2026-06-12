#!/usr/bin/env python3
"""
Monitor wolnych miejsc DPS — Kujawsko-Pomorskie.

Pobiera plik XLS z BIP UW Bydgoszcz, wykrywa zmiany (hash),
parsuje dane za najnowszy miesiąc i tworzy GitHub Issue z raportem.

Format pliku: jeden roczny XLS z kolumnami I–XII dla:
  - Liczba mieszkańców (cols 4–15)
  - Liczba oczekujących (cols 16–27)
  - Liczba wolnych miejsc (cols 28–39)

Harmonogram: 5. i 20. każdego miesiąca.
"""

import os
import re
import sys
import hashlib
import datetime
import requests
from io import BytesIO
from pathlib import Path
from html.parser import HTMLParser

BIP_PAGE_URL = "https://bip.bydgoszcz.uw.gov.pl/67/rejestr-domow-pomocy-spolecznej.html"
FALLBACK_XLS_URL = "https://bip.bydgoszcz.uw.gov.pl/download/attachment/1810/dps_wolne_miejsca_{year}.xls"

REPO = os.environ.get("GITHUB_REPOSITORY", "Kaczor4444/kompas-seniora")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
RAW_DANE_DIR = Path(__file__).parent.parent / "raw_dane" / "kujawsko-pomorskie"
HASH_FILE = RAW_DANE_DIR / ".wolne_miejsca_hash"
MONTH_FILE = RAW_DANE_DIR / ".wolne_miejsca_month"
LOG_FILE = RAW_DANE_DIR / "wolne_miejsca_log.md"

MONTH_NAMES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
POLISH_MONTHS = {
    'I': 'styczeń', 'II': 'luty', 'III': 'marzec', 'IV': 'kwiecień',
    'V': 'maj', 'VI': 'czerwiec', 'VII': 'lipiec', 'VIII': 'sierpień',
    'IX': 'wrzesień', 'X': 'październik', 'XI': 'listopad', 'XII': 'grudzień',
}


# ── helpers ──────────────────────────────────────────────────────────────────

def find_xls_url_from_page(html: str) -> str | None:
    """Szuka linku do aktualnego XLS na stronie BIP."""
    pattern = r'href=["\']([^"\']*download[^"\']*dps_wolne_miejsca[^"\']*\.xls)["\']'
    m = re.search(pattern, html, re.IGNORECASE)
    if m:
        url = m.group(1)
        if url.startswith('/'):
            return 'https://bip.bydgoszcz.uw.gov.pl' + url
        return url
    return None


def download_file(url: str) -> bytes:
    r = requests.get(url, timeout=30, headers={'User-Agent': 'Mozilla/5.0'})
    r.raise_for_status()
    return r.content


def file_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:12]


def last_known_hash() -> str | None:
    return HASH_FILE.read_text().strip() if HASH_FILE.exists() else None


def already_found_this_month() -> bool:
    if not MONTH_FILE.exists():
        return False
    return MONTH_FILE.read_text().strip() == datetime.date.today().strftime("%Y-%m")


def mark_found_this_month():
    MONTH_FILE.write_text(datetime.date.today().strftime("%Y-%m"))


def save_file(data: bytes, h: str, xls_url: str) -> Path:
    today = datetime.date.today().strftime("%Y-%m-%d")
    path = RAW_DANE_DIR / f"dps_wolne_miejsca_{today}.xls"
    path.write_bytes(data)
    HASH_FILE.write_text(h)
    return path


# ── XLS parsing ───────────────────────────────────────────────────────────────

def parse_xls(data: bytes) -> dict:
    """
    Parsuje roczny XLS K-P. Zwraca:
      - date_header: "stan na dzień 31 maja 2026 r."
      - latest_month: indeks (0=I, 4=V …) ostatniego miesiąca z danymi
      - rows: lista dict {powiat, nazwa, wolne, oczek, category}
      - totals_by_category: dict {category: {wolne, oczek}}
      - grand_total_wolne, grand_total_oczek
    """
    try:
        import xlrd
    except ImportError:
        import subprocess
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'xlrd'], check=True)
        import xlrd

    wb = xlrd.open_workbook(file_contents=data)
    sh = wb.sheets()[0]

    # Row 0: date header in col 1
    date_header = str(sh.cell_value(0, 1)).strip()

    # Find last non-empty month in wolne section (cols 28–39 = months 0–11)
    # Skip RAZEM rows (they have SUM formulas = 0.0 for all months, even future ones)
    # xlrd cell_type: 0=empty, 2=number
    latest_month_idx = 0
    for col in range(28, 40):
        for r in range(3, sh.nrows):
            powiat_cell = str(sh.cell_value(r, 1)).strip().upper()
            if powiat_cell in ('RAZEM', 'POWIAT', ''):
                continue
            if sh.cell_type(r, col) == 2:  # type 2 = number (not empty)
                m_idx = col - 28
                if m_idx > latest_month_idx:
                    latest_month_idx = m_idx
                break

    current_category = ''
    rows = []
    totals_by_category: dict = {}

    for r in range(3, sh.nrows):
        # Section separator in col 0
        cat_raw = str(sh.cell_value(r, 0)).strip()
        if cat_raw and not cat_raw.replace('.', '').replace('0', '').strip() == '':
            # Only use if it looks like a category name (not a row number)
            if any(c.isalpha() for c in cat_raw):
                current_category = cat_raw.title()
                totals_by_category.setdefault(current_category, {'wolne': 0, 'oczek': 0})
                continue

        powiat = str(sh.cell_value(r, 1)).strip()
        nazwa = str(sh.cell_value(r, 2)).strip()

        if not powiat or powiat in ('Powiat', 'RAZEM', 'Razem'):
            continue
        if 'sporządziła' in nazwa.lower() or 'wydział' in nazwa.lower():
            continue

        wolne_col = 28 + latest_month_idx
        oczek_col = 16 + latest_month_idx

        def safe_int(v):
            try:
                return int(float(str(v))) if str(v).strip() not in ('', 'None') else 0
            except (ValueError, TypeError):
                return 0

        wolne = safe_int(sh.cell_value(r, wolne_col))
        oczek = safe_int(sh.cell_value(r, oczek_col))

        # Clean powiat (remove newlines)
        powiat = powiat.replace('\n', ' ').strip()
        nazwa_short = nazwa.replace('\n', ' ').strip()[:60]

        rows.append({
            'powiat': powiat,
            'nazwa': nazwa_short,
            'wolne': wolne,
            'oczek': oczek,
            'category': current_category,
        })

        if current_category:
            totals_by_category.setdefault(current_category, {'wolne': 0, 'oczek': 0})
            totals_by_category[current_category]['wolne'] += wolne
            totals_by_category[current_category]['oczek'] += oczek

    grand_wolne = sum(r['wolne'] for r in rows)
    grand_oczek = sum(r['oczek'] for r in rows)

    return {
        'date_header': date_header,
        'latest_month': MONTH_NAMES[latest_month_idx],
        'rows': rows,
        'totals_by_category': totals_by_category,
        'grand_total_wolne': grand_wolne,
        'grand_total_oczek': grand_oczek,
    }


# ── GitHub Issue ──────────────────────────────────────────────────────────────

def create_github_issue(title: str, body: str, auto_close: bool = False) -> str | None:
    if not GITHUB_TOKEN:
        print("Brak GITHUB_TOKEN — pomijam tworzenie Issue")
        return None
    r = requests.post(
        f"https://api.github.com/repos/{REPO}/issues",
        headers={
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept": "application/vnd.github+json",
        },
        json={"title": title, "body": body, "labels": ["data-monitoring", "wolne-miejsca-kp"]},
        timeout=15,
    )
    if not r.ok:
        print(f"Błąd tworzenia Issue: {r.status_code} {r.text}")
        return None

    issue = r.json()
    url = issue["html_url"]
    number = issue["number"]
    print(f"Issue utworzone: {url}")

    if auto_close:
        requests.patch(
            f"https://api.github.com/repos/{REPO}/issues/{number}",
            headers={"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"},
            json={"state": "closed"},
            timeout=15,
        )
        print("Issue zamknięte automatycznie.")

    return url


def build_report(parsed: dict, is_new: bool, xls_url: str, h: str, today: str) -> str:
    status = "🆕 Nowy plik XLS — dane zaktualizowane" if is_new else "📄 Plik bez zmian"
    month_pl = POLISH_MONTHS.get(parsed['latest_month'], parsed['latest_month'])

    lines = [
        f"# Raport wolnych miejsc DPS Kujawsko-Pomorskie — {today}",
        "",
        f"**Status:** {status}",
        f"**Dane z pliku:** {parsed['date_header']}",
        f"**Najnowszy miesiąc:** {month_pl} ({parsed['latest_month']})",
        f"**Źródło:** [{xls_url}]({xls_url})",
        f"**Strona BIP:** [{BIP_PAGE_URL}]({BIP_PAGE_URL})",
        f"**Hash:** `{h}`",
        "",
        f"## Podsumowanie — {month_pl}",
        "",
        f"| | Wartość |",
        f"|---|---|",
        f"| Łącznie wolnych miejsc | **{parsed['grand_total_wolne']}** |",
        f"| Łącznie oczekujących | **{parsed['grand_total_oczek']}** |",
        f"| Liczba DPS | **{len(parsed['rows'])}** |",
        "",
        "## Wolne miejsca wg profilu opieki",
        "",
        "| Profil | Wolne | Oczekujący |",
        "|---|---|---|",
    ]

    for cat, totals in parsed['totals_by_category'].items():
        lines.append(f"| {cat} | {totals['wolne']} | {totals['oczek']} |")

    lines += [
        "",
        "## Szczegóły per placówka",
        "",
        "| Powiat | Nazwa | Wolne | Oczekujący |",
        "|---|---|---|---|",
    ]
    for row in parsed['rows']:
        lines.append(f"| {row['powiat']} | {row['nazwa']} | {row['wolne']} | {row['oczek']} |")

    lines += [
        "",
        "---",
        "*Wygenerowano automatycznie przez GitHub Actions / Kompas Seniora*",
    ]
    return "\n".join(lines)


def update_log(xls_path: Path, h: str, issue_url: str | None):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    issue_link = f"[Issue]({issue_url})" if issue_url else "-"
    entry = f"| {now} | [{xls_path.name}]({xls_path.name}) | `{h}` | {issue_link} |\n"

    if not LOG_FILE.exists():
        LOG_FILE.write_text(
            "# Dziennik monitoringu — wolne miejsca DPS Kujawsko-Pomorskie\n\n"
            "| Data pobrania | Plik | Hash (SHA-256) | Issue |\n"
            "|---|---|---|---|\n"
            + entry
        )
    else:
        with LOG_FILE.open("a", encoding="utf-8") as f:
            f.write(entry)


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    force = os.environ.get("FORCE_CHECK", "false").lower() == "true"
    today = datetime.date.today().strftime("%d.%m.%Y")
    now_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M UTC")
    year = datetime.date.today().year

    if already_found_this_month() and not force:
        print("Nowy plik już pobrany w tym miesiącu — pomijam.")
        create_github_issue(
            f"✅ Wolne miejsca DPS K-P {today} — dane już aktualne",
            f"Sprawdzono {today} o {now_utc}.\n\nNowy plik XLS już pobrany w tym miesiącu.\n\n- **BIP:** {BIP_PAGE_URL}",
            auto_close=True,
        )
        sys.exit(0)

    # Pobierz stronę BIP i znajdź aktualny link do XLS
    xls_url = FALLBACK_XLS_URL.format(year=year)
    print(f"Pobieram stronę BIP: {BIP_PAGE_URL}")
    try:
        page_data = download_file(BIP_PAGE_URL)
        found_url = find_xls_url_from_page(page_data.decode('utf-8', errors='replace'))
        if found_url:
            xls_url = found_url
            print(f"Znaleziono URL z BIP: {xls_url}")
        else:
            print(f"Nie znaleziono URL w BIP — używam fallback: {xls_url}")
    except Exception as e:
        print(f"Błąd pobierania strony BIP: {e} — używam fallback URL")

    # Pobierz XLS
    print(f"Pobieranie XLS: {xls_url}")
    try:
        data = download_file(xls_url)
    except Exception as e:
        print(f"❌ Błąd pobierania XLS: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS K-P {today} — błąd pobierania",
            f"Sprawdzono {today} o {now_utc}.\n\n**Nie udało się pobrać XLS.**\n\n```\n{e}\n```\n\n- **URL:** {xls_url}\n- **BIP:** {BIP_PAGE_URL}",
        )
        sys.exit(1)

    h = file_hash(data)
    known = last_known_hash()
    is_new = h != known
    print(f"Hash: {h} | Poprzedni: {known} | Nowy plik: {is_new}")

    if not is_new and not force:
        print("Plik bez zmian.")
        create_github_issue(
            f"✅ Wolne miejsca DPS K-P {today} — brak nowego pliku",
            f"Sprawdzono {today} o {now_utc}.\n\nPlik XLS nie zmienił się.\n\n- **Hash:** `{h}`\n- **URL:** {xls_url}",
            auto_close=True,
        )
        sys.exit(0)

    # Nowy plik — zapisz i parsuj
    xls_path = save_file(data, h, xls_url)
    mark_found_this_month()
    print(f"Zapisano: {xls_path}")

    print("Parsowanie XLS...")
    try:
        parsed = parse_xls(data)
    except Exception as e:
        print(f"❌ Błąd parsowania: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS K-P {today} — błąd parsowania",
            f"Plik pobrany poprawnie, ale nie udało się go sparsować.\n\n```\n{e}\n```",
        )
        sys.exit(1)

    print(f"Miesiąc: {parsed['latest_month']} | Wolne: {parsed['grand_total_wolne']} | Oczek: {parsed['grand_total_oczek']}")

    report = build_report(parsed, is_new, xls_url, h, today)
    issue_title = f"🆕 Wolne miejsca DPS K-P {today} — {parsed['grand_total_wolne']} wolnych miejsc ({parsed['latest_month']})"
    issue_url = create_github_issue(issue_title, report)
    update_log(xls_path, h, issue_url)


if __name__ == "__main__":
    main()
