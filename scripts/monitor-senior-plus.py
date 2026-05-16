#!/usr/bin/env python3
"""
Monitor ośrodków Senior+ — pobiera plik XLSX z MUW Małopolska,
wykrywa zmiany i tworzy GitHub Issue z raportem + importuje nowe rekordy.

Harmonogram: 1. każdego miesiąca o 9:30 UTC.
- Gdy nowy plik (hash zmieniony): pełny raport + upsert do bazy + GitHub Issue.
- Gdy plik bez zmian: brak Issue (nie zaśmieca listy).
- Gdy błąd pobierania: otwarty Issue z alertem.
"""

import os
import re
import sys
import hashlib
import datetime
import time
import requests
import openpyxl
from io import BytesIO
from pathlib import Path

XLSX_URL = "https://www.malopolska.uw.gov.pl/Docs/Wykaz%20funkcjonuj%C4%85cych%20o%C5%9Brodk%C3%B3w%20Senior%20w%20Ma%C5%82opolsce.xlsx"
REPO = os.environ.get("GITHUB_REPOSITORY", "Kaczor4444/kompas-seniora")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
DATABASE_URL = os.environ.get("DATABASE_URL", "")
RAW_DANE_DIR = Path(__file__).parent.parent / "raw_dane" / "malopolskie"
HASH_FILE = RAW_DANE_DIR / ".senior_plus_hash"
LOG_FILE = RAW_DANE_DIR / "senior_plus_log.md"

FORCE_CHECK = os.environ.get("FORCE_CHECK", "false").lower() == "true"


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
    RAW_DANE_DIR.mkdir(parents=True, exist_ok=True)
    path = RAW_DANE_DIR / f"senior_plus_{today}.xlsx"
    path.write_bytes(data)
    HASH_FILE.write_text(h)
    return path


def parse_xlsx(data: bytes) -> tuple[list[dict], dict]:
    wb = openpyxl.load_workbook(BytesIO(data))
    ws = wb.active

    rows = []
    stats = {"Klub Senior+": 0, "Dzienny Dom Senior+": 0, "total": 0}

    for row in ws.iter_rows(min_row=2, values_only=True):
        lp, rodzaj, liczba_miejsc, jst, woj, ulica, kod, miasto, tel, email, rok = row
        if lp is None:
            continue
        typ = str(rodzaj).strip() if rodzaj else ""
        rows.append({
            "lp": int(lp),
            "typ_placowki": typ,
            "liczba_miejsc": int(liczba_miejsc) if liczba_miejsc else None,
            "jst_nazwa": str(jst).strip() if jst else None,
            "ulica": str(ulica).strip() if ulica else None,
            "kod_pocztowy": str(kod).strip() if kod else None,
            "miejscowosc": str(miasto).strip() if miasto else "",
            "telefon": str(tel).strip() if tel else None,
            "email": str(email).strip() if email else None,
            "rok_powstania": int(rok) if rok else None,
        })
        if typ in stats:
            stats[typ] += 1
        stats["total"] += 1

    return rows, stats


def create_github_issue(title: str, body: str, labels: list[str] = None):
    if not GITHUB_TOKEN:
        print(f"⚠️ Brak GITHUB_TOKEN — pomijam tworzenie Issue")
        print(f"  Tytuł: {title}")
        return

    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
    }
    payload = {"title": title, "body": body, "labels": labels or []}
    r = requests.post(
        f"https://api.github.com/repos/{REPO}/issues",
        headers=headers,
        json=payload,
        timeout=30,
    )
    if r.status_code == 201:
        print(f"✅ GitHub Issue utworzony: {r.json().get('html_url', '')}")
    else:
        print(f"❌ Błąd GitHub Issue: {r.status_code} {r.text[:200]}")


def upsert_to_db(rows: list[dict]):
    if not DATABASE_URL:
        print("⚠️ Brak DATABASE_URL — pomijam import do bazy")
        return 0, 0

    try:
        import psycopg2
    except ImportError:
        print("⚠️ Brak psycopg2 — pomijam import do bazy")
        return 0, 0

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    now = datetime.datetime.utcnow()
    inserted = 0
    updated = 0

    for row in rows:
        cur.execute(
            'SELECT id FROM "Placowka" WHERE typ_placowki = %s AND miejscowosc = %s AND ulica = %s',
            (row["typ_placowki"], row["miejscowosc"], row["ulica"])
        )
        existing = cur.fetchone()
        if existing:
            cur.execute("""
                UPDATE "Placowka"
                SET liczba_miejsc=%s, telefon=%s, email=%s, rok_powstania=%s,
                    jst_nazwa=%s, "updatedAt"=%s, zrodlo_dane=%s
                WHERE id=%s
            """, (row["liczba_miejsc"], row["telefon"], row["email"],
                  row["rok_powstania"], row["jst_nazwa"], now,
                  f"MUW Senior+ XLSX {now.year}", existing[0]))
            updated += 1
        else:
            cur.execute("""
                INSERT INTO "Placowka"
                (nazwa, typ_placowki, ulica, miejscowosc, kod_pocztowy, powiat,
                 wojewodztwo, telefon, email, liczba_miejsc, rok_powstania,
                 jst_nazwa, verified, "createdAt", "updatedAt", zrodlo_dane)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,false,%s,%s,%s)
            """, (
                f"{row['typ_placowki']} — {row['jst_nazwa'] or row['miejscowosc']}",
                row["typ_placowki"], row["ulica"], row["miejscowosc"],
                row["kod_pocztowy"], row["jst_nazwa"] or "małopolskie",
                "małopolskie", row["telefon"], row["email"],
                row["liczba_miejsc"], row["rok_powstania"], row["jst_nazwa"],
                now, now, f"MUW Senior+ XLSX {now.year}",
            ))
            inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    return inserted, updated


def update_log(h: str, rows: list[dict], stats: dict, path: Path):
    RAW_DANE_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.date.today().isoformat()
    entry = (
        f"\n## {today} — hash `{h}`\n"
        f"- Łącznie: {stats['total']} ośrodków\n"
        f"- Klub Senior+: {stats['Klub Senior+']}\n"
        f"- Dzienny Dom Senior+: {stats['Dzienny Dom Senior+']}\n"
        f"- Plik: {path.name}\n"
    )
    existing = LOG_FILE.read_text() if LOG_FILE.exists() else "# Senior+ Monitor Log\n"
    LOG_FILE.write_text(existing + entry)


def main():
    today = datetime.date.today().isoformat()
    print(f"🔍 Senior+ Monitor — {today}")
    print(f"   URL: {XLSX_URL}")

    # Pobierz plik
    try:
        data = download_file(XLSX_URL)
    except Exception as e:
        create_github_issue(
            f"🚨 Senior+ Monitor — błąd pobierania XLSX ({today})",
            f"Nie udało się pobrać pliku wykazu ośrodków Senior+:\n\n```\n{e}\n```\n\nURL: `{XLSX_URL}`",
            ["monitor", "błąd"],
        )
        sys.exit(1)

    h = file_hash(data)
    prev_h = last_known_hash()
    print(f"   Hash: {h} | Poprzedni: {prev_h or 'brak'}")

    if h == prev_h and not FORCE_CHECK:
        print("✅ Plik bez zmian — brak akcji")
        return

    print(f"🆕 {'Wymuszony check' if FORCE_CHECK else 'Nowy plik wykryty'}!")
    rows, stats = parse_xlsx(data)
    path = save_file(data, h)
    update_log(h, rows, stats, path)

    # Import do bazy
    inserted, updated_count = upsert_to_db(rows)

    # Raport
    report_lines = [
        f"## Wykaz ośrodków Senior+ Małopolska — aktualizacja {today}",
        f"",
        f"**Źródło:** [MUW Małopolska]({XLSX_URL})",
        f"**Hash pliku:** `{h}`",
        f"",
        f"### Statystyki",
        f"| Typ | Liczba |",
        f"|-----|--------|",
        f"| Klub Senior+ | {stats['Klub Senior+']} |",
        f"| Dzienny Dom Senior+ | {stats['Dzienny Dom Senior+']} |",
        f"| **ŁĄCZNIE** | **{stats['total']}** |",
        f"",
        f"### Import do bazy danych",
        f"- Nowe rekordy: {inserted}",
        f"- Zaktualizowane: {updated_count}",
        f"",
        f"### Pierwsze 5 rekordów",
        f"| Lp. | Typ | Miejscowość | JST | Rok |",
        f"|-----|-----|-------------|-----|-----|",
    ]
    for row in rows[:5]:
        report_lines.append(
            f"| {row['lp']} | {row['typ_placowki']} | {row['miejscowosc']} | {row['jst_nazwa'] or '—'} | {row['rok_powstania'] or '—'} |"
        )

    create_github_issue(
        f"📋 Senior+ Monitor — nowy wykaz ({today}, {stats['total']} ośrodków)",
        "\n".join(report_lines),
        ["monitor", "senior-plus", "dane"],
    )

    print(f"✅ Zakończono: {stats['total']} ośrodków, {inserted} nowych, {updated_count} zaktualizowanych")


if __name__ == "__main__":
    main()
