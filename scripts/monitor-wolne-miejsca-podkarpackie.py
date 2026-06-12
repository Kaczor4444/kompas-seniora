#!/usr/bin/env python3
"""
Monitor wolnych miejsc DPS — Podkarpackie.

Pobiera plik XLS z BIP UW Rzeszów, wykrywa zmiany (hash),
parsuje dane i tworzy GitHub Issue z raportem.

Format pliku: jeden snapshot na plik, kolumny:
  Lp | Nazwa i siedziba | Powiat | Ilość miejsc | Wolne wg. {data} | Typ | Tel | Kierownik

Harmonogram: 5. i 20. każdego miesiąca.
"""

import os
import re
import sys
import hashlib
import datetime
import requests
from pathlib import Path

BIP_PAGE_URL = (
    "https://rzeszow.uw.gov.pl/dla-instytucji/pomoc-spoleczna/"
    "wykaz-jednostek-udzielajacych-wsparcia-potrzebujacym/"
    "wykaz-domow-pomocy-spolecznej-ktore-uzyskaly-zezwolenie-wojewody-"
    "prowadzonych-przez-jednostki-samorzadu-terytorialnego-lub-na-zlecenie-"
    "jst-dzialajacych-na-terenie-wojewodztwa-podkarpackieg"
)
FALLBACK_XLS_URL = "https://rzeszow.uw.gov.pl/wp-content/uploads/{year}/{month:02d}/frekwencja-DPS-{year}.xls"

REPO = os.environ.get("GITHUB_REPOSITORY", "Kaczor4444/kompas-seniora")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
RAW_DANE_DIR = Path(__file__).parent.parent / "raw_dane" / "podkarpackie"
HASH_FILE = RAW_DANE_DIR / ".wolne_miejsca_hash"
MONTH_FILE = RAW_DANE_DIR / ".wolne_miejsca_month"
LOG_FILE = RAW_DANE_DIR / "wolne_miejsca_log.md"


# ── helpers ──────────────────────────────────────────────────────────────────

def find_xls_url_from_page(html: str) -> str | None:
    """Szuka linku do aktualnego XLS na stronie BIP."""
    pattern = r'href=["\']([^"\']*frekwencja-DPS-\d{4}\.xls)["\']'
    m = re.search(pattern, html, re.IGNORECASE)
    if m:
        url = m.group(1)
        if url.startswith('/'):
            return 'https://rzeszow.uw.gov.pl' + url
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


def save_file(data: bytes, h: str) -> Path:
    today = datetime.date.today().strftime("%Y-%m-%d")
    path = RAW_DANE_DIR / f"frekwencja-DPS-{today}.xls"
    path.write_bytes(data)
    HASH_FILE.write_text(h)
    return path


# ── XLS parsing ───────────────────────────────────────────────────────────────

def parse_xls(data: bytes) -> dict:
    """
    Parsuje snapshot XLS Podkarpackie. Kolumny:
      0=Lp, 1=Nazwa, 2=Powiat, 3=Ilość miejsc, 4=Wolne wg. {data}, 5=Typ, 6=Tel, 7=Kierownik
    """
    try:
        import xlrd
    except ImportError:
        import subprocess
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'xlrd'], check=True)
        import xlrd

    wb = xlrd.open_workbook(file_contents=data)
    sh = wb.sheets()[0]

    # Row 2: headers — col 4 contains "ilość wolnych miejsc wg. DD.MM.YYYY"
    date_header = str(sh.cell_value(2, 4)).strip()

    rows = []
    powiaty_wolne: dict = {}

    for r in range(3, sh.nrows):
        lp = str(sh.cell_value(r, 0)).strip().rstrip('.')
        if not lp.replace('.', '').isdigit():
            continue

        nazwa = str(sh.cell_value(r, 1)).replace('\n', ' ').strip()[:60]
        powiat = str(sh.cell_value(r, 2)).replace('\n', ' ').strip()
        typ = str(sh.cell_value(r, 5)).replace('\n', ' ').strip()

        def safe_int(v):
            try:
                return int(float(str(v))) if str(v).strip() not in ('', 'None') else 0
            except (ValueError, TypeError):
                return 0

        miejsca = safe_int(sh.cell_value(r, 3))
        wolne = safe_int(sh.cell_value(r, 4))

        rows.append({
            'lp': lp,
            'nazwa': nazwa,
            'powiat': powiat,
            'miejsca': miejsca,
            'wolne': wolne,
            'typ': typ,
        })

        if powiat:
            powiaty_wolne[powiat] = powiaty_wolne.get(powiat, 0) + wolne

    grand_wolne = sum(r['wolne'] for r in rows)
    powiaty_with = sum(1 for v in powiaty_wolne.values() if v > 0)

    return {
        'date_header': date_header,
        'rows': rows,
        'powiaty_wolne': powiaty_wolne,
        'powiaty_with': powiaty_with,
        'grand_total_wolne': grand_wolne,
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
        json={"title": title, "body": body, "labels": ["data-monitoring", "wolne-miejsca-podkarpackie"]},
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

    lines = [
        f"# Raport wolnych miejsc DPS Podkarpackie — {today}",
        "",
        f"**Status:** {status}",
        f"**Dane z pliku:** {parsed['date_header']}",
        f"**Źródło:** [{xls_url}]({xls_url})",
        f"**Strona BIP:** [{BIP_PAGE_URL}]({BIP_PAGE_URL})",
        f"**Hash:** `{h}`",
        "",
        "## Podsumowanie",
        "",
        "| | Wartość |",
        "|---|---|",
        f"| Łącznie wolnych miejsc | **{parsed['grand_total_wolne']}** |",
        f"| Liczba DPS | **{len(parsed['rows'])}** |",
        f"| Powiaty z wolnymi miejscami | **{parsed['powiaty_with']}** |",
        "",
        "## Wolne miejsca wg powiatu",
        "",
        "| Powiat | Wolne |",
        "|---|---|",
    ]
    for powiat, wolne in sorted(parsed['powiaty_wolne'].items(), key=lambda x: -x[1]):
        if wolne > 0:
            lines.append(f"| {powiat} | {wolne} |")

    lines += [
        "",
        "## Szczegóły per placówka",
        "",
        "| Lp | Nazwa | Powiat | Miejsca | Wolne | Typ |",
        "|---|---|---|---|---|---|",
    ]
    for row in parsed['rows']:
        lines.append(f"| {row['lp']} | {row['nazwa']} | {row['powiat']} | {row['miejsca']} | {row['wolne']} | {row['typ']} |")

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
            "# Dziennik monitoringu — wolne miejsca DPS Podkarpackie\n\n"
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
    month = datetime.date.today().month

    if already_found_this_month() and not force:
        print("Nowy plik już pobrany w tym miesiącu — pomijam.")
        create_github_issue(
            f"✅ Wolne miejsca DPS Podkarpackie {today} — dane już aktualne",
            f"Sprawdzono {today} o {now_utc}.\n\nNowy plik XLS już pobrany w tym miesiącu.\n\n- **BIP:** {BIP_PAGE_URL}",
            auto_close=True,
        )
        sys.exit(0)

    # Pobierz stronę BIP i znajdź aktualny link do XLS
    xls_url = FALLBACK_XLS_URL.format(year=year, month=month)
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

    print(f"Pobieranie XLS: {xls_url}")
    try:
        data = download_file(xls_url)
    except Exception as e:
        print(f"❌ Błąd pobierania XLS: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Podkarpackie {today} — błąd pobierania",
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
            f"✅ Wolne miejsca DPS Podkarpackie {today} — brak nowego pliku",
            f"Sprawdzono {today} o {now_utc}.\n\nPlik XLS nie zmienił się.\n\n- **Hash:** `{h}`\n- **URL:** {xls_url}",
            auto_close=True,
        )
        sys.exit(0)

    xls_path = save_file(data, h)
    mark_found_this_month()
    print(f"Zapisano: {xls_path}")

    print("Parsowanie XLS...")
    try:
        parsed = parse_xls(data)
    except Exception as e:
        print(f"❌ Błąd parsowania: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Podkarpackie {today} — błąd parsowania",
            f"Plik pobrany poprawnie, ale nie udało się go sparsować.\n\n```\n{e}\n```",
        )
        sys.exit(1)

    print(f"DPS: {len(parsed['rows'])} | Wolne: {parsed['grand_total_wolne']}")

    report = build_report(parsed, is_new, xls_url, h, today)
    issue_title = f"🆕 Wolne miejsca DPS Podkarpackie {today} — {parsed['grand_total_wolne']} wolnych miejsc"
    issue_url = create_github_issue(issue_title, report)
    update_log(xls_path, h, issue_url)


if __name__ == "__main__":
    main()
