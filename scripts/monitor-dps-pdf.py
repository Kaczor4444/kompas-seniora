#!/usr/bin/env python3
"""
Monitor DPS PDF — pobiera aktualny wykaz DPS z MUW Małopolska,
porównuje z bazą danych i tworzy GitHub Issue z raportem różnic.
"""

import os
import re
import sys
import json
import hashlib
import datetime
import requests
import pdfplumber
import psycopg2
from pathlib import Path

PDF_URL = "https://www.malopolska.uw.gov.pl/doc/wykaz%20dps.pdf"
REPO = os.environ.get("GITHUB_REPOSITORY", "Kaczor4444/kompas-seniora")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
RAW_DANE_DIR = Path(__file__).parent.parent / "raw_dane" / "malopolskie"


# ── helpers ──────────────────────────────────────────────────────────────────

def download_pdf(url: str) -> bytes:
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    r = requests.get(url, timeout=30, verify=False)
    r.raise_for_status()
    return r.content


def pdf_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()[:12]


def last_known_hash() -> str | None:
    """Szuka pliku .pdf_hash w raw_dane/malopolskie/"""
    p = RAW_DANE_DIR / ".pdf_hash"
    return p.read_text().strip() if p.exists() else None


def extract_doc_date(data: bytes) -> str | None:
    """Wyciąga datę stanu z nagłówka PDF (np. 'wg stanu na 24.06. 2026 r.')."""
    import io as _io
    try:
        with pdfplumber.open(_io.BytesIO(data)) as pdf:
            text = pdf.pages[0].extract_text() or ""
        m = re.search(r"wg stanu na\s+(\d{1,2})\.(\d{2})\.\s*(\d{4})", text, re.IGNORECASE)
        if m:
            day, month, year = m.group(1).zfill(2), m.group(2), m.group(3)
            return f"{year}-{month}-{day}"
    except Exception:
        pass
    return None


def save_pdf(data: bytes, h: str) -> Path:
    doc_date = extract_doc_date(data) or datetime.date.today().strftime("%Y-%m-%d")
    path = RAW_DANE_DIR / f"wykaz dps malopolska {doc_date}.pdf"
    path.write_bytes(data)
    (RAW_DANE_DIR / ".pdf_hash").write_text(h)
    return path


def update_download_log(pdf_path: Path, h: str, issue_url: str | None = None):
    log_path = RAW_DANE_DIR / "pobrane.md"
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    issue_link = f" | [Issue]({issue_url})" if issue_url else ""
    entry = f"| {now} | [{pdf_path.name}]({pdf_path.name}) | `{h}` | [źródło PDF]({PDF_URL}){issue_link} |\n"

    if not log_path.exists():
        log_path.write_text(
            "# Dziennik pobrań — wykaz DPS Małopolska\n\n"
            "| Data pobrania | Plik | Hash (SHA-256) | Źródło | Raport |\n"
            "|---|---|---|---|---|\n"
            + entry
        )
    else:
        with log_path.open("a", encoding="utf-8") as f:
            f.write(entry)


def extract_pdf_rows(data: bytes) -> dict:
    rows = {}
    with pdfplumber.open(data) as pdf:  # type: ignore[arg-type]
        for page in pdf.pages:
            for table in (page.extract_tables() or []):
                for row in table:
                    lp = (row[0] or "").strip().rstrip(".")
                    if not lp or lp == "l.p.":
                        continue
                    try:
                        num = int(lp)
                    except ValueError:
                        continue

                    def cell(idx):
                        return row[idx] if idx < len(row) else None

                    def norm_cell(c):
                        return (c or "").strip().replace("\n", " ")

                    def extract_tel(c):
                        m = re.search(r"tel[./\s]+(?:fax\s+)?([\d\s/]+)", c or "")
                        return re.sub(r"\s+", " ", m.group(1).strip().rstrip("/")) if m else None

                    def extract_email(c):
                        m = re.search(r"[\w.\-+]+@[\w.\-]+\.[a-z]{2,}", c or "")
                        return m.group(0).lower() if m else None

                    def extract_miejsca(c):
                        nums = re.findall(r"(\d+)\s*miejsc", c or "")
                        if nums:
                            return sum(int(n) for n in nums)
                        m = re.match(r"^\s*(\d+)\s*$", (c or "").strip())
                        return int(m.group(1)) if m else None

                    rows[num] = {
                        "powiat":    norm_cell(cell(1)),
                        "nazwa":     norm_cell(cell(2)),
                        "telefon":   extract_tel(cell(3)),
                        "email":     extract_email(cell(3)),
                        "profil":    norm_cell(cell(4)),
                        "miejsca":   extract_miejsca(cell(6)),
                    }
    return rows


def fetch_db_rows() -> dict:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("""
        SELECT oficjalne_id, nazwa, telefon, email, profil_opieki, liczba_miejsc, nazwa_oficjalna
        FROM "Placowka"
        WHERE typ_placowki = 'DPS' AND wojewodztwo = 'małopolskie'
        ORDER BY oficjalne_id
    """)
    rows = {}
    for r in cur.fetchall():
        if r[0]:
            rows[r[0]] = {
                "nazwa":         r[1],
                "telefon":       r[2],
                "email":         r[3],
                "profil":        r[4],
                "miejsca":       r[5],
                "nazwa_oficjalna": r[6],
            }
    cur.close()
    conn.close()
    return rows


def norm(s: str | None) -> str:
    return re.sub(r"[\s\-./]+", "", (s or "").lower().strip())


def compare(pdf: dict, db: dict) -> dict:
    diffs = {
        "missing_in_db": [],
        "extra_in_db": [],
        "nazwa_diff": [],
        "telefon_diff": [],
        "email_diff": [],
        "profil_diff": [],
        "miejsca_diff": [],
    }

    for i in pdf:
        if i not in db:
            diffs["missing_in_db"].append({"lp": i, "pdf": pdf[i]["nazwa"]})

    for i in db:
        if i not in pdf:
            diffs["extra_in_db"].append({"lp": i, "db": db[i]["nazwa"]})

    for i in sorted(set(pdf) & set(db)):
        p, d = pdf[i], db[i]

        if norm(p["nazwa"]) != norm(d.get("nazwa_oficjalna")):
            diffs["nazwa_diff"].append({"lp": i, "pdf": p["nazwa"], "db": d.get("nazwa_oficjalna")})

        if p["telefon"] and d["telefon"] and norm(p["telefon"]) != norm(d["telefon"]):
            diffs["telefon_diff"].append({"lp": i, "pdf": p["telefon"], "db": d["telefon"]})

        if p["email"] and d["email"] and p["email"].lower() != (d["email"] or "").lower():
            diffs["email_diff"].append({"lp": i, "pdf": p["email"], "db": d["email"]})

        if p["miejsca"] and d["miejsca"] and p["miejsca"] != d["miejsca"]:
            diffs["miejsca_diff"].append({"lp": i, "pdf": p["miejsca"], "db": d["miejsca"]})

    return diffs


def build_report(diffs: dict, pdf_rows: dict, db_rows: dict, is_new_file: bool, pdf_path: str) -> str:
    today = datetime.date.today().strftime("%d.%m.%Y")
    total = sum(len(v) for v in diffs.values())
    status = "🆕 Nowy plik PDF" if is_new_file else "📄 Plik bez zmian (hash identyczny)"

    lines = [
        f"# Raport monitoringu DPS Małopolska — {today}",
        "",
        f"**Status pliku:** {status}",
        f"**Źródło:** {PDF_URL}",
        f"**Plik lokalny:** `{pdf_path}`",
        f"**Rekordów w PDF:** {len(pdf_rows)}",
        f"**Łączne rozbieżności:** {total}",
        "",
    ]

    def section(title, items, fmt):
        if not items:
            return [f"### {title}\n✅ Brak rozbieżności\n"]
        rows = [f"### {title} ({len(items)})\n"]
        for it in items:
            rows.append(fmt(it))
        rows.append("")
        return rows

    lines += section(
        "🔴 Brakujące w bazie (są w PDF, nie ma w DB)",
        diffs["missing_in_db"],
        lambda x: f"- **l.p. {x['lp']}** — {x['pdf']}"
    )
    lines += section(
        "🟡 Extra w bazie (są w DB, nie ma w PDF)",
        diffs["extra_in_db"],
        lambda x: f"- **l.p. {x['lp']}** — {x['db']}"
    )
    lines += section(
        "📛 Niezgodne nazwy",
        diffs["nazwa_diff"],
        lambda x: f"- **l.p. {x['lp']}**\n  - PDF: `{x['pdf']}`\n  - DB: `{x['db']}`"
    )
    lines += section(
        "📞 Niezgodne telefony",
        diffs["telefon_diff"],
        lambda x: f"- **l.p. {x['lp']}** — PDF: `{x['pdf']}` → DB: `{x['db']}`"
    )
    lines += section(
        "📧 Niezgodne emaile",
        diffs["email_diff"],
        lambda x: f"- **l.p. {x['lp']}** — PDF: `{x['pdf']}` → DB: `{x['db']}`"
    )
    lines += section(
        "🛏️ Niezgodna liczba miejsc",
        diffs["miejsca_diff"],
        lambda x: f"- **l.p. {x['lp']}** — PDF: {x['pdf']} → DB: {x['db']}"
    )

    if total == 0:
        lines.append("## ✅ Baza danych jest zgodna z aktualnym wykazem PDF.")
    else:
        lines.append(f"## ⚠️ Znaleziono {total} rozbieżności do sprawdzenia.")
        lines.append("")
        lines.append("## 🛠️ Sugerowany SQL patch")
        lines.append("> Przejrzyj przed wykonaniem. Uruchom: `psql $DATABASE_URL` i wklej poniżej.")
        lines.append("")
        lines.append(generate_sql_patch(diffs, pdf_rows, db_rows))

    lines.append("\n---\n*Wygenerowano automatycznie przez GitHub Actions / Kompas Seniora*")
    return "\n".join(lines)


def generate_sql_patch(diffs: dict, pdf_rows: dict, db_rows: dict) -> str:
    lines = ["```sql", "BEGIN;", ""]

    # nazwa_oficjalna — prosta aktualizacja do wersji z PDF
    nazwa_updates = [d for d in diffs["nazwa_diff"]]
    if nazwa_updates:
        lines.append("-- Aktualizacja nazwa_oficjalna zgodnie z nowym PDF")
        for d in nazwa_updates:
            safe = d["pdf"].replace("'", "''")
            lines.append(
                f"UPDATE \"Placowka\" SET nazwa_oficjalna = '{safe}'"
                f" WHERE oficjalne_id = {d['lp']}"
                f" AND typ_placowki = 'DPS' AND wojewodztwo = 'małopolskie';"
            )
        lines.append("")

    # telefony
    if diffs["telefon_diff"]:
        lines.append("-- Aktualizacja telefonów zgodnie z nowym PDF")
        for d in diffs["telefon_diff"]:
            safe = d["pdf"].replace("'", "''")
            lines.append(
                f"UPDATE \"Placowka\" SET telefon = '{safe}'"
                f" WHERE oficjalne_id = {d['lp']}"
                f" AND typ_placowki = 'DPS' AND wojewodztwo = 'małopolskie';"
            )
        lines.append("")

    # emaile
    if diffs["email_diff"]:
        lines.append("-- Aktualizacja emaili zgodnie z nowym PDF")
        for d in diffs["email_diff"]:
            safe = d["pdf"].replace("'", "''")
            lines.append(
                f"UPDATE \"Placowka\" SET email = '{safe}'"
                f" WHERE oficjalne_id = {d['lp']}"
                f" AND typ_placowki = 'DPS' AND wojewodztwo = 'małopolskie';"
            )
        lines.append("")

    # liczba miejsc
    if diffs["miejsca_diff"]:
        lines.append("-- Aktualizacja liczby miejsc zgodnie z nowym PDF")
        for d in diffs["miejsca_diff"]:
            lines.append(
                f"UPDATE \"Placowka\" SET liczba_miejsc = {d['pdf']}"
                f" WHERE oficjalne_id = {d['lp']}"
                f" AND typ_placowki = 'DPS' AND wojewodztwo = 'małopolskie';"
            )
        lines.append("")

    # brakujące — tylko komentarz, wymagają ręcznej decyzji
    if diffs["missing_in_db"]:
        lines.append("-- ⚠️ BRAKUJĄCE W BAZIE — wymagają ręcznego dodania przez panel admina:")
        for d in diffs["missing_in_db"]:
            lines.append(f"-- l.p. {d['lp']}: {d['pdf']}")
        lines.append("")

    # extra — tylko komentarz
    if diffs["extra_in_db"]:
        lines.append("-- ⚠️ EXTRA W BAZIE — sprawdź czy nie usunięto z wykazu:")
        for d in diffs["extra_in_db"]:
            lines.append(f"-- l.p. {d['lp']}: {d['db']}")
        lines.append("")

    lines += ["COMMIT;", "```"]
    return "\n".join(lines)


def validate_pdf_rows(pdf_rows: dict) -> list[str]:
    """
    Sprawdza czy parsowanie PDF dało sensowne wyniki.
    Zmiana układu kolumn w pliku MUW → puste pola bez błędu parsera.
    Zwraca listę komunikatów błędów (pusta = OK).
    """
    errors = []
    n = len(pdf_rows)

    if n < 80:
        errors.append(f"Za mało rekordów: **{n}** (oczekiwane ≥80) — możliwa zmiana formatu PDF lub niekompletne parsowanie.")
    if n > 105:
        errors.append(f"Za dużo rekordów: **{n}** (oczekiwane ≤105) — możliwe zduplikowane wiersze.")

    with_email = sum(1 for r in pdf_rows.values() if r.get('email'))
    if n > 0 and with_email / n < 0.30:
        errors.append(
            f"Tylko **{with_email}/{n}** rekordów ma email ({with_email/n*100:.0f}%) — "
            f"prawdopodobna zmiana układu kolumn w PDF."
        )

    with_name = sum(1 for r in pdf_rows.values() if r.get('nazwa') and len(r['nazwa']) > 5)
    if n > 0 and with_name / n < 0.70:
        errors.append(
            f"Tylko **{with_name}/{n}** rekordów ma nazwę ({with_name/n*100:.0f}%) — "
            f"prawdopodobna zmiana układu kolumn w PDF."
        )

    return errors


def create_github_issue(title: str, body: str, auto_close: bool = False) -> str | None:
    if not GITHUB_TOKEN:
        print("Brak GITHUB_TOKEN — pomijam tworzenie Issue")
        return None
    r = requests.post(
        f"https://api.github.com/repos/{REPO}/issues",
        headers={"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"},
        json={"title": title, "body": body, "labels": ["data-monitoring"]},
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
            headers={"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"},
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
    import io

    force = os.environ.get("FORCE_COMPARE", "false").lower() == "true"
    today = datetime.date.today().strftime("%d.%m.%Y")
    now_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M UTC")

    # #1 — błąd pobierania → otwarty Issue z alertem
    print("Pobieranie PDF...")
    try:
        pdf_data = download_pdf(PDF_URL)
    except Exception as e:
        print(f"❌ Błąd pobierania: {e}")
        create_github_issue(
            f"⚠️ DPS Monitor {today} — błąd pobierania PDF",
            (
                f"Sprawdzono {today} o {now_utc}.\n\n"
                f"**Nie udało się pobrać pliku PDF z MUW Małopolska.**\n\n"
                f"```\n{e}\n```\n\n"
                f"- **URL:** {PDF_URL}\n\n"
                f"Sprawdź czy strona MUW jest dostępna. "
                f"Następna próba: zgodnie z harmonogramem."
            ),
        )
        sys.exit(1)

    h = pdf_hash(pdf_data)
    known = last_known_hash()
    is_new = h != known

    print(f"Hash: {h} | Poprzedni: {known} | Nowy: {is_new}")

    # #3 — brak zmian → zamknięty Issue informacyjny
    if not is_new and not force:
        print("PDF bez zmian — tworzę zamknięty Issue informacyjny.")
        create_github_issue(
            f"✅ DPS Monitor {today} — brak zmian w PDF",
            (
                f"Sprawdzono {today} o {now_utc}.\n\n"
                f"Plik PDF nie zmienił się od ostatniego sprawdzenia.\n\n"
                f"- **Hash (SHA-256):** `{h}`\n"
                f"- **Źródło:** {PDF_URL}"
            ),
            auto_close=True,
        )
        sys.exit(0)

    pdf_path = save_pdf(pdf_data, h)
    print(f"Zapisano: {pdf_path}")
    update_download_log(pdf_path, h)

    print("Parsowanie PDF...")
    pdf_rows = extract_pdf_rows(io.BytesIO(pdf_data))
    print(f"Znaleziono {len(pdf_rows)} rekordów w PDF")

    # #7 — walidacja struktury — jeśli coś nie gra, alert i wyjście BEZ SQL patcha
    validation_errors = validate_pdf_rows(pdf_rows)
    if validation_errors:
        err_list = "\n".join(f"- {e}" for e in validation_errors)
        print(f"❌ Walidacja PDF nieudana:\n{err_list}")
        create_github_issue(
            f"🔴 DPS Monitor {today} — anomalia struktury PDF (sprawdź ręcznie)",
            (
                f"Sprawdzono {today} o {now_utc}.\n\n"
                f"**Parsowanie PDF dało podejrzane wyniki — możliwa zmiana układu kolumn.**\n\n"
                f"## Wykryte problemy\n\n{err_list}\n\n"
                f"## Co zrobić\n\n"
                f"1. Otwórz ręcznie: [{PDF_URL}]({PDF_URL})\n"
                f"2. Sprawdź czy tabela ma tę samą strukturę kolumn co wcześniej\n"
                f"3. Jeśli zmieniła się — zaktualizuj `extract_pdf_rows()` w `monitor-dps-pdf.py`\n\n"
                f"**SQL patch NIE został wygenerowany** — dane są podejrzane i nie powinny trafić do bazy.\n\n"
                f"- **Hash PDF:** `{h}`\n"
                f"- **Źródło:** {PDF_URL}"
            ),
        )
        sys.exit(1)

    print("Pobieranie danych z bazy...")
    db_rows = fetch_db_rows()
    print(f"Znaleziono {len(db_rows)} rekordów w bazie")

    diffs = compare(pdf_rows, db_rows)
    total = sum(len(v) for v in diffs.values())

    report = build_report(diffs, pdf_rows, db_rows, is_new, str(pdf_path.name))

    today = datetime.date.today().strftime("%d.%m.%Y")
    if total == 0:
        title = f"✅ DPS Monitor {today} — baza zgodna z PDF"
    else:
        title = f"⚠️ DPS Monitor {today} — {total} rozbieżności do sprawdzenia"

    issue_url = create_github_issue(title, report)
    update_download_log(pdf_path, h, issue_url)
    print(f"\nRaport:\n{report}")


if __name__ == "__main__":
    main()
