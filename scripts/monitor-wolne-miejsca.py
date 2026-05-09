#!/usr/bin/env python3
"""
Monitor wolnych miejsc DPS — pobiera plik XLSX z MUW Małopolska,
wykrywa zmiany i tworzy GitHub Issue z raportem nowych danych.
Issue tworzony TYLKO gdy plik się zmienił — brak spamu przy braku zmian.
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


def save_file(data: bytes, h: str) -> Path:
    today = datetime.date.today().strftime("%Y-%m-%d")
    path = RAW_DANE_DIR / f"wolne_miejsca_dps_{today}.xlsx"
    path.write_bytes(data)
    HASH_FILE.write_text(h)
    return path


def parse_xlsx(data: bytes) -> tuple[list[str], list[list], str]:
    """Zwraca (nagłówki, wiersze_danych, tytuł) z pierwszego arkusza XLSX.
    Obsługuje format MUW: wiersz 0 = tytuł z datą, wiersz 1+ = nagłówki kolumn."""
    wb = openpyxl.load_workbook(BytesIO(data))
    ws = wb.active

    all_rows = []
    for row in ws.iter_rows(values_only=True):
        cells = [str(c).strip() if c is not None else "" for c in row]
        all_rows.append(cells)

    if not all_rows:
        return [], [], ""

    # Wiersz 0 często zawiera tytuł/datę (np. "Rejestr wolnych miejsc... stan na dzień X")
    title = next((c for c in all_rows[0] if c), "")

    # Szukaj wiersza z właściwymi nagłówkami (zawiera "LP" lub "Powiat")
    header_idx = 0
    for i, row in enumerate(all_rows[:6]):
        if any("lp" in c.lower() or "powiat" in c.lower() for c in row if c):
            header_idx = i
            break

    headers = all_rows[header_idx]
    rows = [r for r in all_rows[header_idx + 1:] if any(c for c in r)]
    return headers, rows, title


def find_previous_xlsx() -> Path | None:
    """Szuka najnowszego poprzedniego pliku XLSX w raw_dane/malopolskie/."""
    files = sorted(RAW_DANE_DIR.glob("wolne_miejsca_dps_*.xlsx"))
    return files[-2] if len(files) >= 2 else (files[0] if files else None)


def count_summary(headers: list, rows: list) -> str:
    """Liczy wolne miejsca tylko z wierszy powiatowych (LP = cyfra) — bez podwójnego liczenia."""
    keywords = ["wolne", "miejsc"]
    col_idx = None
    for i, h in enumerate(headers):
        if any(k in h.lower() for k in keywords):
            col_idx = i
            break

    if col_idx is None:
        return f"Łącznie wierszy danych: **{len(rows)}**"

    total = 0
    powiats_with_places = 0
    powiats_total = 0

    for row in rows:
        # Liczymy tylko wiersze powiatów (LP = "1.", "2.", ...) — agregaty bez podwójnego liczenia
        lp = row[0].rstrip(". ").strip()
        if not lp.isdigit():
            continue
        powiats_total += 1
        val = row[col_idx] if col_idx < len(row) else ""
        try:
            n = int(val)
            total += n
            if n > 0:
                powiats_with_places += 1
        except (ValueError, TypeError):
            pass

    return (
        f"Liczba powiatów: **{powiats_total}** | "
        f"Powiaty z wolnymi miejscami: **{powiats_with_places}** | "
        f"Łączna liczba wolnych miejsc: **{total}**"
    )


def build_report(headers: list, rows: list, is_new: bool, xlsx_name: str,
                 h: str, prev_count: int | None, title: str = "") -> str:
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
        count_summary(headers, rows),
        "",
    ]

    if prev_count is not None:
        diff = len(rows) - prev_count
        sign = "+" if diff >= 0 else ""
        lines.append(f"**Zmiana liczby rekordów względem poprzedniego pliku:** {sign}{diff}")
        lines.append("")

    if rows:
        lines.append("## Dane z pliku")
        lines.append("")
        # Tabela markdown — GitHub Issue ma limit ~65KB, przy 91 DPS to nie problem
        lines.append("| " + " | ".join(headers) + " |")
        lines.append("|" + "|".join(["---"] * len(headers)) + "|")
        for row in rows:
            padded = row[:len(headers)] + [""] * max(0, len(headers) - len(row))
            # Zamień nowe linie w komórkach na spację
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


def create_github_issue(title: str, body: str) -> str | None:
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
    if r.ok:
        url = r.json()["html_url"]
        print(f"Issue utworzone: {url}")
        return url
    print(f"Błąd tworzenia Issue: {r.status_code} {r.text}")
    return None


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    force = os.environ.get("FORCE_CHECK", "false").lower() == "true"

    print(f"Pobieranie XLSX: {XLSX_URL}")
    data = download_file(XLSX_URL)
    h = file_hash(data)
    known = last_known_hash()
    is_new = h != known

    print(f"Hash: {h} | Poprzedni: {known} | Nowy plik: {is_new}")

    if not is_new and not force:
        print("Plik bez zmian — kończę bez Issue i bez commita.")
        sys.exit(0)

    # Policz rekordy z poprzedniego pliku (do porównania w raporcie)
    prev_count: int | None = None
    prev_path = find_previous_xlsx()
    if prev_path and prev_path.exists():
        try:
            _, prev_rows, _ = parse_xlsx(prev_path.read_bytes())
            prev_count = len(prev_rows)
            print(f"Poprzedni plik: {prev_path.name} ({prev_count} rekordów)")
        except Exception as e:
            print(f"Nie udało się wczytać poprzedniego pliku: {e}")

    xlsx_path = save_file(data, h)
    print(f"Zapisano: {xlsx_path}")

    print("Parsowanie XLSX...")
    headers, rows, title = parse_xlsx(data)
    print(f"Znaleziono {len(rows)} wierszy, {len(headers)} kolumn")
    if headers:
        print(f"Kolumny: {headers[:5]}...")  # pierwsze 5 kolumn

    report = build_report(headers, rows, is_new, xlsx_path.name, h, prev_count, title)

    today = datetime.date.today().strftime("%d.%m.%Y")
    title = f"🆕 Wolne miejsca DPS Małopolska {today} — {len(rows)} rekordów"

    issue_url = create_github_issue(title, report)
    update_log(xlsx_path, h, issue_url)

    # Importuj dane do bazy
    print("\nImportuję dane do bazy...")
    import subprocess
    result = subprocess.run(
        ["python3", str(Path(__file__).parent / "import-wolne-miejsca.py"), str(xlsx_path)],
        capture_output=True, text=True
    )
    print(result.stdout)
    if result.returncode != 0:
        print(f"⚠️ Błąd importu: {result.stderr[:500]}")

    print(f"\nRaport:\n{report[:2000]}...")  # print pierwsze 2000 znaków


if __name__ == "__main__":
    main()
