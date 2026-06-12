#!/usr/bin/env python3
"""
Monitor wolnych miejsc DPS — Wielkopolskie.

Scrapeuje stronę UW Poznań, szuka aktualnego linku PDF
z wolnymi miejscami, wykrywa zmiany (hash) i tworzy GitHub Issue.

Format pliku: PDF (kilka stron), tabela (pdfplumber table extraction):
  Lp. | Jednostka | Typ | Adres | Liczba miejsc | Powiat | Organ | Liczba wolnych miejsc
Brak wiersza SUMA — sumy obliczane z wierszy.

Harmonogram: 12. i 22. każdego miesiąca (PDF wychodzi ~10. bieżącego miesiąca).
"""

import os
import re
import sys
import hashlib
import datetime
import requests
from pathlib import Path

BIP_PAGE_URL = "https://poznan.uw.gov.pl/domy-pomocy-spolecznej"
PDF_URL_PATTERN = re.compile(
    r'(?:https://poznan\.uw\.gov\.pl)?(/system/files/zalaczniki/wolne_miejsca_w_dps[^"\'>\s]+\.pdf)',
    re.IGNORECASE,
)

REPO = os.environ.get("GITHUB_REPOSITORY", "Kaczor4444/kompas-seniora")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
RAW_DANE_DIR = Path(__file__).parent.parent / "raw_dane" / "wielkopolskie"
HASH_FILE = RAW_DANE_DIR / ".wolne_miejsca_hash"
MONTH_FILE = RAW_DANE_DIR / ".wolne_miejsca_month"
LOG_FILE = RAW_DANE_DIR / "wolne_miejsca_log.md"

BASE_URL = "https://poznan.uw.gov.pl"


# ── helpers ──────────────────────────────────────────────────────────────────

def download_file(url: str) -> bytes:
    r = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"}, verify=False)
    r.raise_for_status()
    return r.content


def find_pdf_url(html: str) -> str | None:
    matches = PDF_URL_PATTERN.findall(html)
    if not matches:
        return None
    path = matches[-1]
    return path if path.startswith("http") else BASE_URL + path


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
    path = RAW_DANE_DIR / f"wolne_miejsca_{today}.pdf"
    path.write_bytes(data)
    HASH_FILE.write_text(h)
    return path


# ── PDF parsing ───────────────────────────────────────────────────────────────

def extract_wolne(raw: str) -> int:
    """Parse wolne miejsca — handles both simple numbers and combined cells like 'DPS A: 3; DPS B: 0'."""
    if not raw:
        return 0
    nums = re.findall(r'\d+', raw)
    return sum(int(n) for n in nums) if nums else 0


def pdf_title_month(data: bytes) -> str:
    """Extract month/year from PDF metadata title field."""
    try:
        import pdfplumber
        from io import BytesIO
        with pdfplumber.open(BytesIO(data)) as pdf:
            title = pdf.metadata.get("Title", "") or ""
            return title.strip()
    except Exception:
        return ""


def parse_pdf(data: bytes) -> dict:
    """
    Parsuje PDF wolnych miejsc Wielkopolskie.

    PDF ma tabelę z wyraźnymi komórkami — używamy pdfplumber table extraction.
    Kolumny: Lp. | Jednostka | Typ | Adres | Liczba miejsc | Powiat | Organ | Liczba wolnych miejsc
    Brak wiersza SUMA — sumujemy sami.
    """
    try:
        import pdfplumber
    except ImportError:
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "pdfplumber"], check=True)
        import pdfplumber

    from io import BytesIO

    rows = []
    date_header = pdf_title_month(data)

    with pdfplumber.open(BytesIO(data)) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for tbl in tables:
                for row in tbl:
                    if not row or not any(row):
                        continue

                    lp = (row[0] or "").strip()
                    # Skip header rows (no numeric Lp)
                    if not re.match(r"^\d+\.?$", lp):
                        continue

                    nazwa_raw = row[1] if len(row) > 1 else ""
                    miejsca_raw = row[4] if len(row) > 4 else ""
                    powiat_raw = row[5] if len(row) > 5 else ""
                    wolne_raw = row[7] if len(row) > 7 else ""

                    nazwa = (nazwa_raw or "").replace("\n", " ").strip()
                    powiat = (powiat_raw or "").replace("\n", " ").strip()

                    try:
                        miejsca = int(str(miejsca_raw).strip())
                    except (ValueError, TypeError):
                        miejsca = 0

                    wolne = extract_wolne(str(wolne_raw or ""))

                    rows.append({
                        "lp": lp,
                        "nazwa": nazwa,
                        "powiat": powiat,
                        "miejsca": miejsca,
                        "wolne": wolne,
                    })

    total_miejsca = sum(r["miejsca"] for r in rows)
    total_wolne = sum(r["wolne"] for r in rows)

    return {
        "date_header": date_header,
        "rows": rows,
        "total_miejsca": total_miejsca,
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
        json={"title": title, "body": body, "labels": ["data-monitoring", "wolne-miejsca-wielkopolskie"]},
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


def build_report(parsed: dict, is_new: bool, pdf_url: str, h: str, today: str) -> str:
    status = "🆕 Nowy PDF — dane zaktualizowane" if is_new else "📄 PDF bez zmian"
    dps_with = sum(1 for r in parsed["rows"] if r["wolne"] > 0)

    lines = [
        f"# Raport wolnych miejsc DPS Wielkopolskie — {today}",
        "",
        f"**Status:** {status}",
        f"**Dane z pliku:** {parsed['date_header']}",
        f"**Źródło:** [{pdf_url}]({pdf_url})",
        f"**Strona:** [{BIP_PAGE_URL}]({BIP_PAGE_URL})",
        f"**Hash:** `{h}`",
        "",
        "## Podsumowanie",
        "",
        "| | Wartość |",
        "|---|---|",
        f"| Łącznie wolnych miejsc | **{parsed['total_wolne']}** |",
        f"| Łącznie miejsc ogółem | **{parsed['total_miejsca']}** |",
        f"| DPS z wolnymi miejscami | **{dps_with} / {len(parsed['rows'])}** |",
        "",
        "## Szczegóły per placówka",
        "",
        "| # | Nazwa DPS | Powiat | Miejsca | Wolne |",
        "|---|---|---|---|---|",
    ]
    for row in parsed["rows"]:
        marker = " ✅" if row["wolne"] > 0 else ""
        lines.append(f"| {row['lp']} | {row['nazwa']} | {row['powiat']} | {row['miejsca']} | {row['wolne']}{marker} |")

    lines += [
        "",
        "---",
        "*Wygenerowano automatycznie przez GitHub Actions / Kompas Seniora*",
    ]
    return "\n".join(lines)


def update_log(pdf_path: Path, h: str, issue_url: str | None):
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    issue_link = f"[Issue]({issue_url})" if issue_url else "-"
    entry = f"| {now} | [{pdf_path.name}]({pdf_path.name}) | `{h}` | {issue_link} |\n"

    if not LOG_FILE.exists():
        LOG_FILE.write_text(
            "# Dziennik monitoringu — wolne miejsca DPS Wielkopolskie\n\n"
            "| Data pobrania | Plik | Hash (SHA-256) | Issue |\n"
            "|---|---|---|---|\n"
            + entry
        )
    else:
        with LOG_FILE.open("a", encoding="utf-8") as f:
            f.write(entry)


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    force = os.environ.get("FORCE_CHECK", "false").lower() == "true"
    today = datetime.date.today().strftime("%d.%m.%Y")
    now_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M UTC")

    if already_found_this_month() and not force:
        print("Nowy plik już pobrany w tym miesiącu — pomijam.")
        create_github_issue(
            f"✅ Wolne miejsca DPS Wielkopolskie {today} — dane już aktualne",
            f"Sprawdzono {today} o {now_utc}.\n\nNowy PDF już pobrany w tym miesiącu.\n\n- **Strona:** {BIP_PAGE_URL}",
            auto_close=True,
        )
        sys.exit(0)

    print(f"Pobieram stronę: {BIP_PAGE_URL}")
    try:
        page_data = download_file(BIP_PAGE_URL)
        html = page_data.decode("utf-8", errors="replace")
        pdf_url = find_pdf_url(html)
    except Exception as e:
        print(f"❌ Błąd pobierania strony: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Wielkopolskie {today} — błąd pobierania strony",
            f"Sprawdzono {today} o {now_utc}.\n\n```\n{e}\n```\n\n- **Strona:** {BIP_PAGE_URL}",
        )
        sys.exit(1)

    if not pdf_url:
        print("❌ Nie znaleziono linku do PDF na stronie")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Wielkopolskie {today} — nie znaleziono PDF",
            f"Sprawdzono {today} o {now_utc}.\n\nNie znaleziono linku do PDF z wolnymi miejscami.\n\nMoże zmienił się format strony.\n\n- **Strona:** {BIP_PAGE_URL}",
        )
        sys.exit(1)

    print(f"Znaleziono PDF: {pdf_url}")

    try:
        data = download_file(pdf_url)
    except Exception as e:
        print(f"❌ Błąd pobierania PDF: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Wielkopolskie {today} — błąd pobierania PDF",
            f"Sprawdzono {today} o {now_utc}.\n\n```\n{e}\n```\n\n- **URL:** {pdf_url}",
        )
        sys.exit(1)

    h = file_hash(data)
    known = last_known_hash()
    is_new = h != known
    print(f"Hash: {h} | Poprzedni: {known} | Nowy plik: {is_new}")

    if not is_new and not force:
        print("PDF bez zmian.")
        create_github_issue(
            f"✅ Wolne miejsca DPS Wielkopolskie {today} — brak nowego PDF",
            f"Sprawdzono {today} o {now_utc}.\n\nPDF nie zmienił się.\n\n- **Hash:** `{h}`\n- **URL:** {pdf_url}",
            auto_close=True,
        )
        sys.exit(0)

    pdf_path = save_file(data, h)
    mark_found_this_month()
    print(f"Zapisano: {pdf_path}")

    print("Parsowanie PDF...")
    try:
        parsed = parse_pdf(data)
    except Exception as e:
        print(f"❌ Błąd parsowania: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Wielkopolskie {today} — błąd parsowania PDF",
            f"PDF pobrany poprawnie, ale nie udało się go sparsować.\n\n```\n{e}\n```\n\n- **URL:** {pdf_url}",
        )
        sys.exit(1)

    print(f"DPS: {len(parsed['rows'])} | Wolne: {parsed['total_wolne']} / {parsed['total_miejsca']}")

    report = build_report(parsed, is_new, pdf_url, h, today)
    issue_title = f"🆕 Wolne miejsca DPS Wielkopolskie {today} — {parsed['total_wolne']} wolnych miejsc"
    issue_url = create_github_issue(issue_title, report)
    update_log(pdf_path, h, issue_url)


if __name__ == "__main__":
    main()
