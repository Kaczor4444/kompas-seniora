#!/usr/bin/env python3
"""
Monitor wolnych miejsc DPS — pobiera plik XLSX z MUW Małopolska,
wykrywa zmiany i tworzy GitHub Issue z raportem nowych danych.

Harmonogram: 1., 8. i 15. każdego miesiąca.
- Gdy nowy plik: pełny raport + trend wolnych miejsc + import do bazy.
- Gdy plik bez zmian: zamknięty Issue informacyjny (nie zaśmieca listy).
- Gdy nowy plik już znaleziony w tym miesiącu: pomija sprawdzenie.
- Gdy błąd pobierania: otwarty Issue z alertem.
"""

import os
import sys
import hashlib
import datetime
import requests
import openpyxl
from io import BytesIO
from pathlib import Path

XLSX_URL = "https://www.malopolska.uw.gov.pl/doc/wolne_miejsca_w_dps.xlsx"
REPO = os.environ.get("GITHUB_REPOSITORY", "Kaczor4444/kompas-seniora")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
RAW_DANE_DIR = Path(__file__).parent.parent / "raw_dane" / "malopolskie"
HASH_FILE = RAW_DANE_DIR / ".wolne_miejsca_hash"
MONTH_FILE = RAW_DANE_DIR / ".wolne_miejsca_month"   # przechowuje YYYY-MM ostatniego nowego pliku
LOG_FILE = RAW_DANE_DIR / "wolne_miejsca_log.md"


# ── helpers ──────────────────────────────────────────────────────────────────

def download_file(url: str) -> bytes:
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    r = requests.get(url, timeout=30, verify=False)
    r.raise_for_status()
    return r.content


def file_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:12]


def last_known_hash() -> str | None:
    return HASH_FILE.read_text().strip() if HASH_FILE.exists() else None


def already_found_this_month() -> bool:
    """Czy nowy plik był już pobrany w bieżącym miesiącu?"""
    if not MONTH_FILE.exists():
        return False
    return MONTH_FILE.read_text().strip() == datetime.date.today().strftime("%Y-%m")


def mark_found_this_month():
    MONTH_FILE.write_text(datetime.date.today().strftime("%Y-%m"))


def save_file(data: bytes, h: str) -> Path:
    today = datetime.date.today().strftime("%Y-%m-%d")
    path = RAW_DANE_DIR / f"wolne_miejsca_dps_{today}.xlsx"
    path.write_bytes(data)
    HASH_FILE.write_text(h)
    return path


def parse_xlsx(data: bytes) -> tuple[list[str], list[list], str]:
    """Zwraca (nagłówki, wiersze_danych, tytuł) z pierwszego arkusza XLSX."""
    wb = openpyxl.load_workbook(BytesIO(data))
    ws = wb.active

    all_rows = []
    for row in ws.iter_rows(values_only=True):
        cells = [str(c).strip() if c is not None else "" for c in row]
        all_rows.append(cells)

    if not all_rows:
        return [], [], ""

    title = next((c for row in all_rows[:8] for c in row if "stan na" in c.lower()), "")

    header_idx = 0
    for i, row in enumerate(all_rows[:6]):
        if any("lp" in c.lower() or "powiat" in c.lower() for c in row if c):
            header_idx = i
            break

    headers = all_rows[header_idx]
    rows = [r for r in all_rows[header_idx + 1:] if any(c for c in r)]
    return headers, rows, title


def find_previous_xlsx() -> Path | None:
    files = sorted(RAW_DANE_DIR.glob("wolne_miejsca_dps_*.xlsx"))
    return files[-2] if len(files) >= 2 else (files[0] if files else None)


def get_wolne_total(headers: list, rows: list) -> int | None:
    """Suma wolnych miejsc z wierszy powiatowych (LP = cyfra) — bez podwójnego liczenia."""
    keywords = ["wolne", "miejsc"]
    col_idx = None
    for i, h in enumerate(headers):
        if any(k in h.lower() for k in keywords):
            col_idx = i
            break
    if col_idx is None:
        return None

    total = 0
    for row in rows:
        lp = row[0].rstrip(". ").strip()
        if not lp.isdigit():
            continue
        val = row[col_idx] if col_idx < len(row) else ""
        try:
            total += int(val)
        except (ValueError, TypeError):
            pass
    return total


def count_summary(headers: list, rows: list, prev_total: int | None = None) -> str:
    total = get_wolne_total(headers, rows)
    powiats_with = 0
    powiats_total = 0

    col_idx = None
    for i, h in enumerate(headers):
        if any(k in h.lower() for k in ["wolne", "miejsc"]):
            col_idx = i
            break

    for row in rows:
        lp = row[0].rstrip(". ").strip()
        if not lp.isdigit():
            continue
        powiats_total += 1
        val = row[col_idx] if (col_idx is not None and col_idx < len(row)) else ""
        try:
            if int(val) > 0:
                powiats_with += 1
        except (ValueError, TypeError):
            pass

    if total is None:
        return f"Łącznie wierszy danych: **{len(rows)}**"

    trend = ""
    if prev_total is not None:
        diff = total - prev_total
        sign = "+" if diff >= 0 else ""
        arrow = "📈" if diff > 0 else ("📉" if diff < 0 else "➡️")
        trend = f" {arrow} **{sign}{diff}** vs poprzedni okres"

    return (
        f"Liczba powiatów: **{powiats_total}** | "
        f"Powiaty z wolnymi miejscami: **{powiats_with}** | "
        f"Łączna liczba wolnych miejsc: **{total}**{trend}"
    )


def build_report(headers: list, rows: list, is_new: bool, xlsx_name: str,
                 h: str, prev_count: int | None, title: str = "",
                 prev_total: int | None = None) -> str:
    today = datetime.date.today().strftime("%d.%m.%Y")
    status = "🆕 Nowy plik XLSX — dane zaktualizowane" if is_new else "📄 Plik bez zmian"

    lines = [
        f"# Raport wolnych miejsc DPS Małopolska — {today}",
        "",
        f"**Status:** {status}",
    ]
    if title:
        lines.append(f"**Dane z pliku:** {title}")
    lines += [
        f"**Źródło:** [{XLSX_URL}]({XLSX_URL})",
        f"**Hash:** `{h}`",
        f"**Plik:** `{xlsx_name}`",
        "",
        count_summary(headers, rows, prev_total),
        "",
    ]

    if prev_count is not None:
        diff = len(rows) - prev_count
        sign = "+" if diff >= 0 else ""
        lines.append(f"**Zmiana liczby rekordów:** {sign}{diff}")
        lines.append("")

    if rows:
        lines.append("## Dane z pliku")
        lines.append("")
        lines.append("| " + " | ".join(headers) + " |")
        lines.append("|" + "|".join(["---"] * len(headers)) + "|")
        for row in rows:
            padded = row[:len(headers)] + [""] * max(0, len(headers) - len(row))
            clean = [c.replace("\n", " ") for c in padded]
            lines.append("| " + " | ".join(clean) + " |")
    else:
        lines.append("⚠️ Plik jest pusty lub nie udało się wczytać danych.")

    lines.append("")
    lines.append("---")
    lines.append("*Wygenerowano automatycznie przez GitHub Actions / Kompas Seniora*")
    return "\n".join(lines)


def update_log(xlsx_path: Path, h: str, issue_url: str | None = None):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    issue_link = f"[Issue]({issue_url})" if issue_url else "-"
    entry = f"| {now} | [{xlsx_path.name}]({xlsx_path.name}) | `{h}` | {issue_link} |\n"

    if not LOG_FILE.exists():
        LOG_FILE.write_text(
            "# Dziennik monitoringu — wolne miejsca DPS Małopolska\n\n"
            "| Data pobrania | Plik | Hash (SHA-256) | Issue |\n"
            "|---|---|---|---|\n"
            + entry
        )
    else:
        with LOG_FILE.open("a", encoding="utf-8") as f:
            f.write(entry)


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
        json={"title": title, "body": body, "labels": ["data-monitoring", "wolne-miejsca"]},
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
        rc = requests.patch(
            f"https://api.github.com/repos/{REPO}/issues/{number}",
            headers={
                "Authorization": f"Bearer {GITHUB_TOKEN}",
                "Accept": "application/vnd.github+json",
            },
            json={"state": "closed"},
            timeout=15,
        )
        if rc.ok:
            print("Issue zamknięte automatycznie.")
        else:
            print(f"Błąd zamykania Issue: {rc.status_code}")

    return url


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    force = os.environ.get("FORCE_CHECK", "false").lower() == "true"
    today = datetime.date.today().strftime("%d.%m.%Y")
    now_utc = datetime.datetime.utcnow().strftime("%H:%M UTC")

    # #4 — pomiń jeśli nowy plik już znaleziono w tym miesiącu
    if already_found_this_month() and not force:
        print("Nowy plik już pobrany w tym miesiącu — pomijam.")
        create_github_issue(
            f"✅ Wolne miejsca DPS {today} — dane już aktualne w tym miesiącu",
            (
                f"Sprawdzono {today} o {now_utc}.\n\n"
                f"Nowy plik XLSX został już pobrany wcześniej w tym miesiącu.\n"
                f"Następne pełne sprawdzenie: 1. dnia następnego miesiąca.\n\n"
                f"- **Źródło:** {XLSX_URL}"
            ),
            auto_close=True,
        )
        sys.exit(0)

    # #1 — błąd pobierania → otwarty Issue z alertem
    print(f"Pobieranie XLSX: {XLSX_URL}")
    try:
        data = download_file(XLSX_URL)
    except Exception as e:
        print(f"❌ Błąd pobierania: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS {today} — błąd pobierania pliku",
            (
                f"Sprawdzono {today} o {now_utc}.\n\n"
                f"**Nie udało się pobrać pliku XLSX z MUW Małopolska.**\n\n"
                f"```\n{e}\n```\n\n"
                f"- **URL:** {XLSX_URL}\n\n"
                f"Sprawdź czy strona MUW jest dostępna. "
                f"Następna próba: zgodnie z harmonogramem."
            ),
        )
        sys.exit(1)

    h = file_hash(data)
    known = last_known_hash()
    is_new = h != known

    print(f"Hash: {h} | Poprzedni: {known} | Nowy plik: {is_new}")

    # #3 — brak zmian → zamknięty Issue informacyjny
    if not is_new and not force:
        print("Plik bez zmian — tworzę zamknięty Issue informacyjny.")
        create_github_issue(
            f"✅ Wolne miejsca DPS {today} — brak nowego pliku",
            (
                f"Sprawdzono {today} o {now_utc}.\n\n"
                f"Plik XLSX nie zmienił się od ostatniego sprawdzenia.\n\n"
                f"- **Hash (SHA-256):** `{h}`\n"
                f"- **Źródło:** {XLSX_URL}\n\n"
                f"Brak nowych danych o wolnych miejscach w DPS Małopolska."
            ),
            auto_close=True,
        )
        sys.exit(0)

    # Nowy plik — pobierz poprzednie dane do trendu
    prev_total: int | None = None
    prev_count: int | None = None
    prev_path = find_previous_xlsx()
    if prev_path and prev_path.exists():
        try:
            prev_headers, prev_rows, _ = parse_xlsx(prev_path.read_bytes())
            prev_count = len(prev_rows)
            prev_total = get_wolne_total(prev_headers, prev_rows)
            print(f"Poprzedni plik: {prev_path.name} ({prev_count} rekordów, {prev_total} wolnych miejsc)")
        except Exception as e:
            print(f"Nie udało się wczytać poprzedniego pliku: {e}")

    xlsx_path = save_file(data, h)
    mark_found_this_month()   # #4
    print(f"Zapisano: {xlsx_path}")

    print("Parsowanie XLSX...")
    headers, rows, title = parse_xlsx(data)
    curr_total = get_wolne_total(headers, rows)
    print(f"Znaleziono {len(rows)} wierszy | Wolnych miejsc: {curr_total}")

    # #2 — trend w raporcie
    report = build_report(headers, rows, is_new, xlsx_path.name, h,
                          prev_count, title, prev_total)

    issue_title = f"🆕 Wolne miejsca DPS Małopolska {today} — {curr_total} wolnych miejsc"
    issue_url = create_github_issue(issue_title, report)
    update_log(xlsx_path, h, issue_url)

    # Import do bazy
    print("\nImportuję dane do bazy...")
    import subprocess
    result = subprocess.run(
        ["python3", str(Path(__file__).parent / "import-wolne-miejsca.py"), str(xlsx_path)],
        capture_output=True, text=True
    )
    print(result.stdout)
    if result.returncode != 0:
        print(f"⚠️ Błąd importu: {result.stderr[:500]}")


if __name__ == "__main__":
    main()
