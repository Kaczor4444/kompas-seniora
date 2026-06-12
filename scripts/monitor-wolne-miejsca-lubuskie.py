#!/usr/bin/env python3
"""
Monitor wolnych miejsc DPS — Lubuskie.

Scrapeuje stronę BIP UW Gorzów Wlkp., szuka aktualnego linku PDF
z wolnymi miejscami, wykrywa zmiany (hash) i tworzy GitHub Issue.

Format pliku: PDF (1 strona), tabela:
  Nazwa DPS | Profil | Ogólna liczba miejsc | Liczba miejsc wolnych
Ostatnia linia: "SUMA" z sumą miejsc i wolnych.

Harmonogram: 12. i 22. każdego miesiąca (PDF wychodzi ~10. za poprzedni miesiąc).
"""

import os
import re
import sys
import hashlib
import datetime
import requests
from pathlib import Path

BIP_PAGE_URL = "https://bip.lubuskie.uw.gov.pl/polityka_spoleczna/pliki_polityka_spoleczna"
PDF_URL_PATTERN = re.compile(
    r'https://bip\.lubuskie\.uw\.gov\.pl/download/Wykaz-wolnych-miejsc-w-domach-pomocy-spolecznej[^"\'>\s]+\.pdf',
    re.IGNORECASE,
)

REPO = os.environ.get("GITHUB_REPOSITORY", "Kaczor4444/kompas-seniora")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
RAW_DANE_DIR = Path(__file__).parent.parent / "raw_dane" / "lubuskie"
HASH_FILE = RAW_DANE_DIR / ".wolne_miejsca_hash"
MONTH_FILE = RAW_DANE_DIR / ".wolne_miejsca_month"
LOG_FILE = RAW_DANE_DIR / "wolne_miejsca_log.md"


# ── helpers ──────────────────────────────────────────────────────────────────

def download_file(url: str) -> bytes:
    r = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0"})
    r.raise_for_status()
    return r.content


def find_pdf_url(html: str) -> str | None:
    """Znajdź najnowszy link do PDF wolnych miejsc na stronie BIP."""
    matches = PDF_URL_PATTERN.findall(html)
    # Weź ostatni (najnowszy) wynik
    return matches[-1] if matches else None


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

def extract_city_name(text: str) -> str | None:
    """Wyciągnij nazwę miejscowości z tekstu (jeśli zaczyna się wielką literą)."""
    text = text.strip()
    if not text or text.startswith("-"):
        return None
    # Musi zaczynać się wielką literą (miasto/wieś)
    if not re.match(r"^[A-ZŁŚÓŹĆĘĄŃŻ]", text):
        return None
    # Weź tekst do pierwszego myślnika lub końca
    m = re.match(r"^([A-ZŁŚÓŹĆĘĄŃŻ][A-Za-z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s\.]+?)(?:\s*[-–]|$)", text)
    return m.group(1).strip() if m else None


def parse_pdf(data: bytes) -> dict:
    """
    Parsuje PDF wolnych miejsc Lubuskie.

    PDF ma nieregularne łamanie linii — nazwa DPS może być na oddzielnej linii
    od liczb. Strategia:
    - linie kończące się "liczba liczba" → wiersz danych
    - linie z samymi dwiema liczbami → wiersz danych (nazwa z poprzednich linii)
    - pozostałe linie z wielką literą → aktualizacja current_name
    """
    try:
        import pdfplumber
    except ImportError:
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "pdfplumber"], check=True)
        import pdfplumber

    from io import BytesIO

    # Linie które nigdy nie zawierają danych liczbowych DPS
    HEADER_PHRASES = [
        "wolne miejsca w domach", "stan na:", "gorzów wielkopolski,",
        "dom pomocy profil", "społecznej dla osób", "ogólna liczba",
        "brak możliwości przyjmowania", "pobytu całodobowego",
    ]

    rows = []
    date_header = ""
    total_miejsca = 0
    total_wolne = 0
    current_name = ""

    with pdfplumber.open(BytesIO(data)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""

            # Data stanu
            m = re.search(r"stan na[:\s]+(.+?\d{4}\s*r\.?)", text, re.IGNORECASE)
            if m:
                date_header = m.group(1).strip()

            for line in text.splitlines():
                line = line.strip()
                if not line:
                    continue

                # SUMA — wyciągnij totale (format "SUMA 2.246 20")
                if re.match(r"^SUMA\b", line, re.IGNORECASE):
                    # Usuń separatory tysięczne (kropki) i znajdź liczby
                    clean = line.replace(".", "")
                    nums = [int(n) for n in re.findall(r"\d+", clean)]
                    if len(nums) >= 2:
                        total_miejsca = nums[-2]
                        total_wolne = nums[-1]
                    continue

                # Linia z samymi dwiema liczbami: "180 7"
                m_only = re.match(r"^(\d+)\s+(\d+)\s*$", line)
                if m_only:
                    rows.append({
                        "nazwa": current_name,
                        "miejsca": int(m_only.group(1)),
                        "wolne": int(m_only.group(2)),
                    })
                    continue

                # Linia kończąca się dwiema liczbami: "Tursk - ... 180 7"
                m_data = re.search(r"\s+(\d+)\s+(\d+)\s*$", line)
                if m_data:
                    miejsca = int(m_data.group(1))
                    wolne = int(m_data.group(2))
                    text_part = line[: m_data.start()].strip()
                    city = extract_city_name(text_part)
                    if city:
                        current_name = city
                    rows.append({
                        "nazwa": current_name,
                        "miejsca": miejsca,
                        "wolne": wolne,
                    })
                    continue

                # Linia bez liczb — pomiń nagłówki, sprawdź czy nazwa miejscowości
                if any(p in line.lower() for p in HEADER_PHRASES):
                    continue
                city = extract_city_name(line)
                if city:
                    current_name = city

    # Fallback na wypadek braku SUMA
    if total_wolne == 0 and rows:
        total_wolne = sum(r["wolne"] for r in rows)
        total_miejsca = sum(r["miejsca"] for r in rows)

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
        json={"title": title, "body": body, "labels": ["data-monitoring", "wolne-miejsca-lubuskie"]},
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
        f"# Raport wolnych miejsc DPS Lubuskie — {today}",
        "",
        f"**Status:** {status}",
        f"**Dane z pliku:** {parsed['date_header']}",
        f"**Źródło:** [{pdf_url}]({pdf_url})",
        f"**Strona BIP:** [{BIP_PAGE_URL}]({BIP_PAGE_URL})",
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
        "| Nazwa DPS | Miejsca ogółem | Wolne |",
        "|---|---|---|",
    ]
    for row in parsed["rows"]:
        marker = " ✅" if row["wolne"] > 0 else ""
        lines.append(f"| {row['nazwa']} | {row['miejsca']} | {row['wolne']}{marker} |")

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
            "# Dziennik monitoringu — wolne miejsca DPS Lubuskie\n\n"
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
            f"✅ Wolne miejsca DPS Lubuskie {today} — dane już aktualne",
            f"Sprawdzono {today} o {now_utc}.\n\nNowy PDF już pobrany w tym miesiącu.\n\n- **BIP:** {BIP_PAGE_URL}",
            auto_close=True,
        )
        sys.exit(0)

    # Pobierz stronę BIP i znajdź link do PDF
    print(f"Pobieram stronę BIP: {BIP_PAGE_URL}")
    try:
        page_data = download_file(BIP_PAGE_URL)
        html = page_data.decode("utf-8", errors="replace")
        pdf_url = find_pdf_url(html)
    except Exception as e:
        print(f"❌ Błąd pobierania strony BIP: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Lubuskie {today} — błąd pobierania strony BIP",
            f"Sprawdzono {today} o {now_utc}.\n\n```\n{e}\n```\n\n- **BIP:** {BIP_PAGE_URL}",
        )
        sys.exit(1)

    if not pdf_url:
        print("❌ Nie znaleziono linku do PDF na stronie BIP")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Lubuskie {today} — nie znaleziono PDF",
            f"Sprawdzono {today} o {now_utc}.\n\nNie znaleziono linku do PDF z wolnymi miejscami na stronie BIP.\n\nMoże zmienił się format strony lub nazwa pliku.\n\n- **BIP:** {BIP_PAGE_URL}",
        )
        sys.exit(1)

    print(f"Znaleziono PDF: {pdf_url}")

    # Pobierz PDF
    try:
        data = download_file(pdf_url)
    except Exception as e:
        print(f"❌ Błąd pobierania PDF: {e}")
        create_github_issue(
            f"⚠️ Wolne miejsca DPS Lubuskie {today} — błąd pobierania PDF",
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
            f"✅ Wolne miejsca DPS Lubuskie {today} — brak nowego PDF",
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
            f"⚠️ Wolne miejsca DPS Lubuskie {today} — błąd parsowania PDF",
            f"PDF pobrany poprawnie, ale nie udało się go sparsować.\n\n```\n{e}\n```\n\n- **URL:** {pdf_url}",
        )
        sys.exit(1)

    print(f"DPS: {len(parsed['rows'])} | Wolne: {parsed['total_wolne']} / {parsed['total_miejsca']}")

    report = build_report(parsed, is_new, pdf_url, h, today)
    issue_title = f"🆕 Wolne miejsca DPS Lubuskie {today} — {parsed['total_wolne']} wolnych miejsc"
    issue_url = create_github_issue(issue_title, report)
    update_log(pdf_path, h, issue_url)


if __name__ == "__main__":
    main()
