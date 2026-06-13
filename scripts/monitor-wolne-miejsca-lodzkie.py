#!/usr/bin/env python3
"""
Monitor wolnych miejsc DPS — Łódzkie.

Scrapeuje stronę UW Łódź, szuka aktualnego linku XLS
z wolnymi miejscami, wykrywa zmiany (hash) i tworzy GitHub Issue.

Format pliku: XLS, 4 kolumny:
  Lp. | Powiat | Nazwa i adres | Liczba wolnych miejsc
Ostatnia linia: "SUMA" z sumą wolnych miejsc.

Harmonogram: nieregularny (~kwartalnie). Sprawdzamy 12. i 22. każdego miesiąca.
Strona: https://www.gov.pl/web/uw-lodzki/wolne-miejsca-w-domach-pomocy-spolecznej
"""

import os
import re
import sys
import hashlib
import datetime
import requests
from pathlib import Path

BIP_PAGE_URL = "https://www.gov.pl/web/uw-lodzki/wolne-miejsca-w-domach-pomocy-spolecznej"
# Szukaj linku attachment z tekstem "Wykaz wolnych miejsc"
ATTACHMENT_PATTERN = re.compile(
    r'href="(/attachment/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})"[^>]*>\s*Wykaz wolnych miejsc',
    re.IGNORECASE,
)

REPO = os.environ.get("GITHUB_REPOSITORY", "Kaczor4444/kompas-seniora")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
RAW_DANE_DIR = Path(__file__).parent.parent / "raw_dane" / "lodzkie"
HASH_FILE = RAW_DANE_DIR / ".wolne_miejsca_hash"
MONTH_FILE = RAW_DANE_DIR / ".wolne_miejsca_month"
LOG_FILE = RAW_DANE_DIR / "wolne_miejsca_log.md"

BASE_URL = "https://www.gov.pl"


# ── helpers ──────────────────────────────────────────────────────────────────

def download_file(url: str) -> bytes:
    r = requests.get(url, timeout=60, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    return r.content


def find_xls_url(html: str) -> str | None:
    matches = ATTACHMENT_PATTERN.findall(html)
    if not matches:
        return None
    path = matches[-1]
    return BASE_URL + path if not path.startswith("http") else path


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


def save_file(data: bytes, h: str, ext: str = ".xls") -> Path:
    today = datetime.date.today().strftime("%Y-%m-%d")
    path = RAW_DANE_DIR / f"wolne_miejsca_{today}{ext}"
    path.write_bytes(data)
    HASH_FILE.write_text(h)
    return path


# ── XLS parsing ───────────────────────────────────────────────────────────────

def cell_int(val: str) -> int:
    """Parse Excel float string ('8.0') to int."""
    v = val.strip()
    try:
        return int(float(v)) if v else 0
    except (ValueError, TypeError):
        return 0


def parse_xls(data: bytes) -> dict:
    """
    Parsuje XLS wolnych miejsc Łódzkie.

    Kolumny: Lp. | Powiat | Nazwa i adres | Liczba wolnych miejsc
    Wiersz nagłówka: zawiera datę stanu w kolumnie 3 (np. "...stan na dzień 31.03.2025 r.")
    Ostatni wiersz: puste Lp., puste Powiat i Nazwa, suma w kolumnie 3.
    """
    try:
        import xlrd
    except ImportError:
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "xlrd"], check=True)
        import xlrd

    workbook = xlrd.open_workbook(file_contents=data)
    sheet = workbook.sheet_by_index(0)

    rows = []
    date_header = ""
    total_wolne = 0

    for row_idx in range(sheet.nrows):
        raw = [str(sheet.cell_value(row_idx, c)) for c in range(sheet.ncols)]
        row = [v.strip() for v in raw]

        # Data stanu — w nagłówku (Lp='Lp') lub w dowolnej komórce
        if not date_header:
            for cell in row:
                m = re.search(r"stan[u]?\s+na\s+(?:dzień\s+)?(\d{1,2}[.\s\n]+\d{1,2}[.\s\n]+\d{4})", cell, re.IGNORECASE)
                if m:
                    date_header = re.sub(r"\s+", "", m.group(1)).strip(".")
                    break

        lp_raw = row[0] if row else ""
        lp_clean = re.sub(r"\.0$", "", lp_raw).strip()

        # Wiersz z danymi: Lp. to liczba naturalna
        if re.match(r"^\d+$", lp_clean):
            powiat = row[1] if len(row) > 1 else ""
            nazwa = row[2] if len(row) > 2 else ""
            wolne = cell_int(row[3]) if len(row) > 3 else 0

            rows.append({
                "lp": lp_clean,
                "powiat": powiat.replace("\n", " "),
                "nazwa": nazwa.replace("\n", " "),
                "wolne": wolne,
            })
            continue

        # Ostatni wiersz — puste Lp., tylko suma w ostatniej kolumnie
        if lp_clean == "" and all(v == "" for v in row[:3]) and row[3] if len(row) > 3 else False:
            total_wolne = cell_int(row[3])

    # Fallback jeśli suma nie znaleziona w osobnym wierszu
    if total_wolne == 0 and rows:
        total_wolne = sum(r["wolne"] for r in rows)

    return {
        "date_header": date_header,
        "rows": rows,
        "total_wolne": total_wolne,
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
        json={"title": title, "body": body, "labels": ["data-monitoring", "wolne-miejsca-lodzkie"]},
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
    status = "🆕 Nowy XLS — dane zaktualizowane" if is_new else "📄 XLS bez zmian"
    dps_with = sum(1 for r in parsed["rows"] if r["wolne"] > 0)

    lines = [
        f"# Raport wolnych miejsc DPS Łódzkie — {today}",
        "",
        f"**Status:** {status}",
        f"**Dane z pliku:** stan na {parsed['date_header']}" if parsed["date_header"] else "",
        f"**Źródło:** [{xls_url}]({xls_url})",
        f"**Strona:** [{BIP_PAGE_URL}]({BIP_PAGE_URL})",
        f"**Hash:** `{h}`",
        "",
        "## Podsumowanie",
        "",
        "| | Wartość |",
        "|---|---|",
        f"| Łącznie wolnych miejsc | **{parsed['total_wolne']}** |",
        f"| DPS z wolnymi miejscami | **{dps_with} / {len(parsed['rows'])}** |",
        f"| Plik zawiera dane z | **{parsed['date_header'] or '?'}** |",
        "",
        "## Szczegóły per placówka",
        "",
        "| # | Powiat | Nazwa DPS | Wolne |",
        "|---|---|---|---|",
    ]
    for row in parsed["rows"]:
        marker = " ✅" if row["wolne"] > 0 else ""
        lines.append(f"| {row['lp']} | {row['powiat']} | {row['nazwa']} | {row['wolne']}{marker} |")

    lines += [
        "",
        "---",
        "*Wygenerowano automatycznie przez GitHub Actions / Kompas Seniora*",
    ]
    return "\n".join(line for line in lines if line is not None)


def update_log(xls_path: Path, h: str, issue_url: str | None):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    issue_link = f"[Issue]({issue_url})" if issue_url else "-"
    entry = f"| {now} | [{xls_path.name}]({xls_path.name}) | `{h}` | {issue_link} |\n"

    if not LOG_FILE.exists():
        LOG_FILE.write_text(
            "# Dziennik monitoringu — wolne miejsca DPS Łódzkie\n\n"
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

    if already_found_this_month() and not force:
        print("Nowy plik już pobrany w tym miesiącu — pomijam.")
        create_github_issue(
            f"✅ Wolne miejsca DPS Łódzkie {today} — dane już aktualne",
            f"Sprawdzono {today} o {now_utc}.\n\nNowy XLS już pobrany w tym miesiącu.\n\n- **Strona:** {BIP_PAGE_URL}",
            auto_close=True,
        )
        sys.exit(0)

    print(f"Pobieram stronę: {BIP_PAGE_URL}")
    try:
        page_data = download_file(BIP_PAGE_URL)
        html = page_data.decode("utf-8", errors="replace")
        xls_url = find_xls_url(html)
    except Exception as e:
        print(f"❌ Błąd pobierania strony: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Łódzkie {today} — błąd pobierania strony",
            f"Sprawdzono {today} o {now_utc}.\n\n```\n{e}\n```\n\n- **Strona:** {BIP_PAGE_URL}",
        )
        sys.exit(1)

    if not xls_url:
        print("❌ Nie znaleziono linku do XLS na stronie")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Łódzkie {today} — nie znaleziono XLS",
            f"Sprawdzono {today} o {now_utc}.\n\nNie znaleziono linku do pliku XLS z wolnymi miejscami.\n\nMoże zmienił się format strony.\n\n- **Strona:** {BIP_PAGE_URL}",
        )
        sys.exit(1)

    print(f"Znaleziono XLS: {xls_url}")

    try:
        data = download_file(xls_url)
    except Exception as e:
        print(f"❌ Błąd pobierania XLS: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Łódzkie {today} — błąd pobierania XLS",
            f"Sprawdzono {today} o {now_utc}.\n\n```\n{e}\n```\n\n- **URL:** {xls_url}",
        )
        sys.exit(1)

    h = file_hash(data)
    known = last_known_hash()
    is_new = h != known
    print(f"Hash: {h} | Poprzedni: {known} | Nowy plik: {is_new}")

    if not is_new and not force:
        print("XLS bez zmian.")
        create_github_issue(
            f"✅ Wolne miejsca DPS Łódzkie {today} — brak nowego XLS",
            f"Sprawdzono {today} o {now_utc}.\n\nPlik XLS nie zmienił się.\n\n- **Hash:** `{h}`\n- **URL:** {xls_url}",
            auto_close=True,
        )
        sys.exit(0)

    # Określ rozszerzenie na podstawie Content-Type lub URL
    ext = ".xlsx" if xls_url.lower().endswith(".xlsx") else ".xls"
    xls_path = save_file(data, h, ext)
    mark_found_this_month()
    print(f"Zapisano: {xls_path}")

    print("Parsowanie XLS...")
    try:
        parsed = parse_xls(data)
    except Exception as e:
        print(f"❌ Błąd parsowania: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Łódzkie {today} — błąd parsowania XLS",
            f"XLS pobrany poprawnie, ale nie udało się go sparsować.\n\n```\n{e}\n```\n\n- **URL:** {xls_url}",
        )
        sys.exit(1)

    print(f"DPS: {len(parsed['rows'])} | Wolne: {parsed['total_wolne']}")

    report = build_report(parsed, is_new, xls_url, h, today)
    issue_title = f"🆕 Wolne miejsca DPS Łódzkie {today} — {parsed['total_wolne']} wolnych miejsc"
    issue_url = create_github_issue(issue_title, report)
    update_log(xls_path, h, issue_url)


if __name__ == "__main__":
    main()
