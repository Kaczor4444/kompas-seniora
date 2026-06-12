#!/usr/bin/env python3
"""
Import wolnych miejsc DPS z XLSX MUW Małopolska do bazy danych.
Matchuje placówki po nazwie (powiaty) lub adresie (Kraków).
Uruchamiany po wykryciu nowego pliku przez monitor-wolne-miejsca.py.

Użycie:
  python3 scripts/import-wolne-miejsca.py raw_dane/malopolskie/wolne_miejsca_dps_2026-05-09.xlsx
  python3 scripts/import-wolne-miejsca.py  # użyje najnowszego pliku
"""

import re
import sys
import json
import datetime
import psycopg2
import openpyxl
from io import BytesIO
from pathlib import Path
from difflib import SequenceMatcher

RAW_DANE_DIR = Path(__file__).parent.parent / "raw_dane" / "malopolskie"
DATABASE_URL  = open(Path(__file__).parent.parent / ".env").read()
DATABASE_URL  = next(
    line.split("=", 1)[1].strip().strip('"')
    for line in DATABASE_URL.splitlines()
    if line.startswith("DATABASE_URL")
)

# Mapowania przez podciąg nazwy → docelowa znormalizowana nazwa w DB
MANUAL_MAPPINGS = {
    "bonifraterska fundacja dobroczynna":
        "dom pomocy społecznej w konarach",
    # Zgromadzenie Sióstr Najświętszej Rodziny z Nazaretu → ul. Lwowska 31, Wadowice
    "zgromadzenie sióstr najświętszej rodziny z nazaretu":
        "dom pomocy społecznej w wadowicach",
    # Cudzysłów '' psuje fuzzy match — klucz bez cudzysłowu
    "miłosierny samarytanin":
        "dom pomocy społecznej w grabiu",
}

# Mapowania przez podciąg nazwy → ID w bazie (gdy nazwa DB jest niejednoznaczna)
MANUAL_MAPPINGS_BY_ID = {
    "gmina borzęcin":          22,   # DPS-Regionalne Centrum... w Borzęcinie
    "gmina sękowa":            29,   # DPS w Wapiennem
    "gmina grybów":            73,   # DPS Biała Niżna 640
    "miasto i gmina niepołomice": 86, # DPS w Staniątkach
    "w rabie niżnej":          61,   # XLSX: "Dom Pomocy Społecznej" — DB: "Fundacja Opiekuńczość" (inna nazwa tej samej placówki)
}

# Powiaty obsługiwane przez matching po adresie (Kraków) lub pojemności (Nowy Sącz, Tarnów)
CITY_POWIATY = {"m. kraków", "m. nowy sącz", "m. tarnów"}


# ── normalizacja ──────────────────────────────────────────────────────────────

def norm_name(s: str) -> str:
    """Normalizuj nazwę: małe litery, bez adresu (po przecinku), bez nadmiarowych spacji."""
    s = re.sub(r'\s+', ' ', (s or '').strip().lower())
    s = re.sub(r',.*$', '', s)   # usuń adres po pierwszym przecinku
    s = re.sub(r'\bul\.\s*\S+.*$', '', s)  # usuń "ul. ..." z końca
    s = s.strip().rstrip('.,- ')
    return s


def norm_typ(s: str) -> str:
    """Normalizuj typ opieki."""
    return re.sub(r'\s+', ' ', (s or '').strip().lower())


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def parse_int(v) -> int | None:
    try:
        n = int(str(v).strip())
        return n if n >= 0 else None
    except (ValueError, TypeError):
        return None


# ── parsowanie XLSX ───────────────────────────────────────────────────────────

def parse_date_from_title(title: str) -> datetime.date | None:
    """Wyciąga datę z tytułu: 'stan na dzień 30 kwietnia 2026 r.'"""
    months = {
        'stycznia': 1, 'lutego': 2, 'marca': 3, 'kwietnia': 4,
        'maja': 5, 'czerwca': 6, 'lipca': 7, 'sierpnia': 8,
        'września': 9, 'października': 10, 'listopada': 11, 'grudnia': 12,
    }
    m = re.search(r'(\d{1,2})\s+(\w+)\s+(\d{4})', title.lower())
    if m:
        day, month_str, year = int(m.group(1)), m.group(2), int(m.group(3))
        month = months.get(month_str)
        if month:
            return datetime.date(year, month, day)
    return None


def parse_xlsx(path: Path) -> tuple[datetime.date | None, list[dict]]:
    """
    Parsuje XLSX/XLS i zwraca (data_stanu, lista wierszy danych).
    Każdy wiersz: { powiat, nazwa_xlsx, typ, liczba_miejsc, wolne_ogolem,
                    wolne_kobiety, wolne_mezczyzni, oczekujacych, czas_oczekiwania_dni }
    """
    if path.suffix.lower() == '.xls':
        import pandas as pd
        df = pd.read_excel(path, header=None)
        all_rows = [
            [str(c).strip() if c is not None and str(c) != 'nan' else "" for c in row]
            for row in df.values.tolist()
        ]
    else:
        wb = openpyxl.load_workbook(path)
        ws = wb.active
        all_rows = [
            [str(c).strip() if c is not None else "" for c in row]
            for row in ws.iter_rows(values_only=True)
        ]

    # Tytuł z datą (szukaj w pierwszych 8 wierszach - .xls może mieć puste nagłówki)
    title = next((c for row in all_rows[:8] for c in row if "stan na" in c.lower()), "")
    data_stanu = parse_date_from_title(title)
    print(f"Data stanu: {data_stanu}  (z tytułu: '{title[:60]}')")

    # Znajdź wiersz nagłówkowy (zawiera "LP" lub "Powiat")
    header_idx = 1
    for i, row in enumerate(all_rows[:6]):
        if any("lp" in c.lower() or "powiat" in c.lower() for c in row if c):
            header_idx = i
            break

    results = []
    current_powiat = ""
    current_nazwa  = ""

    for row in all_rows[header_idx + 1:]:
        # Pomiń całkowicie puste wiersze
        if not any(c for c in row):
            continue

        # Kol 0: LP (np. "1.", "2.") — aktualizuj powiat gdy nowy LP
        lp   = row[0].rstrip(". ").strip()
        pow_ = row[1].strip()
        name = row[2].strip()
        typ  = row[3].strip()

        if pow_ and pow_ != "X":
            current_powiat = pow_
        is_new_facility = bool(name and name not in ("X", ""))
        if is_new_facility:
            current_nazwa = name

        # Pomiń wiersze bez typu (sub-nagłówki)
        if not typ or typ == "X":
            continue
        # Pomiń wiersze gdzie LP i nazwa to "X" (wiersz sumaryczny powiatu)
        if name == "X" and lp:
            continue

        results.append({
            "powiat":               current_powiat,
            "nazwa_xlsx":           current_nazwa,
            "is_new_facility":      is_new_facility,  # True = nowa placówka, False = kolejny typ tej samej
            "typ":                  typ,
            "liczba_miejsc":        parse_int(row[4]) if len(row) > 4 else None,
            "wolne_ogolem":         parse_int(row[8]) if len(row) > 8 else None,
            "wolne_kobiety":        parse_int(row[9]) if len(row) > 9 else None,
            "wolne_mezczyzni":      parse_int(row[11]) if len(row) > 11 else None,
            "oczekujacych":         parse_int(row[13]) if len(row) > 13 else None,
            "czas_oczekiwania_dni": parse_int(row[14]) if len(row) > 14 else None,
        })

    print(f"Wierszy danych z XLSX: {len(results)}")
    return data_stanu, results


# ── matchowanie ───────────────────────────────────────────────────────────────

def norm_ulica(s: str) -> str:
    """Normalizuj adres do 'ostatnie_słowo_ulicy numer' dla porównania."""
    s = re.sub(r'\s+', ' ', (s or '').lower().strip())
    # Usuń prefix: ul., os., al., pl.
    s = re.sub(r'^(ul\.|os\.|al\.|pl\.)\s*', '', s)
    # Usuń tytuły i inicjały: dr., prof., im., św., A., J.
    s = re.sub(r'\b(dr|prof|im|św|o)\b\.?\s*', '', s)
    s = re.sub(r'\b[a-z]\.\s*', '', s)
    s = s.strip()
    # Wyciągnij: ostatnie słowo (≥4 liter) przed numerem + numer
    m = re.search(r'(\w{4,})\s+(\d+[a-z]?)\b', s)
    return f"{m.group(1)} {m.group(2)}" if m else s


def load_db_facilities(conn) -> list[dict]:
    cur = conn.cursor()
    cur.execute("""
        SELECT id, nazwa, powiat, ulica, liczba_miejsc, profil_opieki
        FROM "Placowka"
        WHERE typ_placowki = 'DPS' AND wojewodztwo = 'małopolskie'
        ORDER BY id
    """)
    cols = [d[0] for d in cur.description]
    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
    # Dodaj znormalizowany adres (klucz dla Krakowa)
    for r in rows:
        r['ulica_key'] = norm_ulica(r.get('ulica') or '')
    cur.close()
    return rows


def find_best_match_by_name(nazwa_xlsx: str, db: list[dict]) -> tuple[dict | None, float]:
    """Fuzzy match po nazwie — zwraca (db_row, score)."""
    norm_xlsx = norm_name(nazwa_xlsx)

    # Mapowania przez ID (niejednoznaczne nazwy DB lub Gmina-based)
    for key, db_id in MANUAL_MAPPINGS_BY_ID.items():
        if key in norm_xlsx:
            for d in db:
                if d['id'] == db_id:
                    return d, 1.0

    # Mapowania przez nazwę DB
    for key, target in MANUAL_MAPPINGS.items():
        if key in norm_xlsx:
            for d in db:
                if norm_name(d['nazwa']) == target:
                    return d, 1.0

    best_score = 0.0
    best = None
    for d in db:
        score = similarity(norm_xlsx, norm_name(d['nazwa']))
        if score > best_score:
            best_score = score
            best = d
    return best, best_score


def extract_xlsx_ulica(xlsx_name: str) -> str:
    """Wyciągnij adres z długiej nazwy XLSX Krakowa: 'Miasto Kraków ... ul. X N, ...'"""
    m = re.search(r'(?:ul\.|os\.|al\.)\s+\w[\w\s\.]*?\d+[A-Za-z]?', xlsx_name, re.IGNORECASE)
    return m.group(0).strip() if m else ""


def match_krakow_by_address(xlsx_name: str, db: list[dict]) -> dict | None:
    """
    Dla Krakowa: matchuj po adresie (ul./os. + numer).
    Działa dla obu powiatów: 'm. Kraków' i 'krakowski'.
    """
    raw_addr = extract_xlsx_ulica(xlsx_name)
    if not raw_addr:
        return None
    key = norm_ulica(raw_addr)
    if not key:
        return None

    krakow_db = [
        d for d in db
        if d['powiat'] in ('m. Kraków', 'krakowski')
    ]
    candidates = [d for d in krakow_db if d['ulica_key'] == key]
    if len(candidates) == 1:
        return candidates[0]
    if len(candidates) > 1:
        print(f"  ⚠️  Ambiguous address '{key}': {[d['nazwa'][:30] for d in candidates]}")
    return None


def match_city_by_capacity(group_total: int | None, powiat_norm: str,
                            db: list[dict]) -> dict | None:
    """Dla Nowego Sącza i Tarnowa: matchuj po sumie liczba_miejsc grupy."""
    if group_total is None or group_total == 0:
        return None

    city_powiat_map = {
        "m. nowy sącz": "m. Nowy Sącz",
        "m. tarnów": "m. Tarnów",
    }
    db_powiat = city_powiat_map.get(powiat_norm)
    if not db_powiat:
        return None

    candidates = [
        d for d in db
        if d['powiat'] == db_powiat and d['liczba_miejsc'] == group_total
    ]
    return candidates[0] if len(candidates) == 1 else None


# ── import do bazy ────────────────────────────────────────────────────────────

def upsert_record(conn, placowka_id: int, data_stanu: datetime.date, row: dict):
    """INSERT lub UPDATE rekordu wolnych miejsc."""
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO "PlacowkaWolneMiejsca"
          ("placowkaId", data_stanu, typ_opieki, liczba_miejsc,
           wolne_ogolem, wolne_kobiety, wolne_mezczyzni,
           oczekujacych, czas_oczekiwania_dni, "createdAt")
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        ON CONFLICT ("placowkaId", data_stanu, typ_opieki)
        DO UPDATE SET
          liczba_miejsc        = EXCLUDED.liczba_miejsc,
          wolne_ogolem         = EXCLUDED.wolne_ogolem,
          wolne_kobiety        = EXCLUDED.wolne_kobiety,
          wolne_mezczyzni      = EXCLUDED.wolne_mezczyzni,
          oczekujacych         = EXCLUDED.oczekujacych,
          czas_oczekiwania_dni = EXCLUDED.czas_oczekiwania_dni
    """, (
        placowka_id,
        data_stanu,
        norm_typ(row['typ']),
        row['liczba_miejsc'],
        row['wolne_ogolem'],
        row['wolne_kobiety'],
        row['wolne_mezczyzni'],
        row['oczekujacych'],
        row['czas_oczekiwania_dni'],
    ))
    cur.close()


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    # Znajdź plik XLSX
    if len(sys.argv) > 1:
        xlsx_path = Path(sys.argv[1])
    else:
        files = sorted(RAW_DANE_DIR.glob("wolne_miejsca_dps_*.xlsx"))
        if not files:
            print("Brak pliku XLSX. Podaj ścieżkę jako argument.")
            sys.exit(1)
        xlsx_path = files[-1]

    print(f"Plik: {xlsx_path}")

    data_stanu, rows = parse_xlsx(xlsx_path)
    if not data_stanu:
        print("⚠️  Nie udało się wyciągnąć daty z tytułu pliku. Używam daty dzisiejszej.")
        data_stanu = datetime.date.today()

    conn = psycopg2.connect(DATABASE_URL)
    db = load_db_facilities(conn)
    print(f"DPS w bazie: {len(db)}")

    stats = {"matched_name": 0, "matched_address": 0, "matched_capacity": 0, "no_match": 0}
    unmatched = []

    # ── Podziel po powiatu: miasta (Kraków/NS/Tarnów) vs reszta ────────────
    def is_city_row(r: dict) -> bool:
        return r['powiat'].strip().lower() in CITY_POWIATY

    non_city_rows = [r for r in rows if not is_city_row(r)]
    city_rows     = [r for r in rows if     is_city_row(r)]

    # ── 1. Placówki poza miastami — match po nazwie ─────────────────────────
    matched_cache: dict[str, dict | None] = {}

    for row in non_city_rows:
        nazwa = row['nazwa_xlsx'].strip()
        powiat_norm = row['powiat'].strip().lower()
        cache_key = f"{powiat_norm}|{nazwa}"

        if cache_key not in matched_cache:
            db_row, score = find_best_match_by_name(nazwa, db)
            if score >= 0.75:
                matched_cache[cache_key] = db_row
                stats["matched_name"] += 1
                print(f"  ✅ [{score:.2f}] {norm_name(nazwa)[:50]}")
            else:
                matched_cache[cache_key] = None
                unmatched.append((nazwa, score, db_row['nazwa'] if db_row else '?'))
                print(f"  ❌ [{score:.2f}] {norm_name(nazwa)[:50]}")

        db_row = matched_cache[cache_key]
        if db_row is None:
            stats["no_match"] += 1
            continue
        upsert_record(conn, db_row['id'], data_stanu, row)

    # ── 2. Kraków — grupuj po adresie, matchuj po ulicy ────────────────────
    krakow_rows = [r for r in city_rows if r['powiat'].strip().lower() == "m. kraków"]

    # Grupuj wiersze Krakowa po znormalizowanym adresie (jeden DPS = jeden adres)
    krakow_groups: dict[str, list[dict]] = {}
    krakow_order: list[str] = []  # zachowaj kolejność
    for row in krakow_rows:
        raw_addr = extract_xlsx_ulica(row['nazwa_xlsx'])
        addr_key = norm_ulica(raw_addr) if raw_addr else f"__unnamed_{id(row)}"
        if addr_key not in krakow_groups:
            krakow_groups[addr_key] = []
            krakow_order.append(addr_key)
        krakow_groups[addr_key].append(row)

    for addr_key in krakow_order:
        group = krakow_groups[addr_key]
        # Użyj nazwy z pierwszego wiersza do wyciągnięcia adresu
        db_row = match_krakow_by_address(group[0]['nazwa_xlsx'], db)
        if db_row:
            stats["matched_address"] += 1
            print(f"  ✅ [adres {addr_key}] {db_row['nazwa'][:50]}")
            for r in group:
                upsert_record(conn, db_row['id'], data_stanu, r)
        else:
            stats["no_match"] += len(group)
            print(f"  ❌ [adres {addr_key}] brak dopasowania w Krakowie")

    # ── 3. Nowy Sącz i Tarnów — matchuj po SUMIE pojemności ────────────────
    ns_tarnow_rows = [r for r in city_rows if r['powiat'].strip().lower() in ("m. nowy sącz", "m. tarnów")]

    current_group: list[dict] = []

    def flush_city_group(group: list[dict]):
        if not group:
            return
        group_total = sum(r['liczba_miejsc'] or 0 for r in group)
        powiat_norm = group[0]['powiat'].strip().lower()
        db_row = match_city_by_capacity(group_total, powiat_norm, db)
        if db_row:
            stats["matched_capacity"] += 1
            print(f"  ✅ [pojemność {group_total}] {db_row['nazwa'][:50]}")
            for r in group:
                upsert_record(conn, db_row['id'], data_stanu, r)
        else:
            stats["no_match"] += len(group)
            print(f"  ❌ [pojemność {group_total}] brak dopasowania ({powiat_norm})")

    for row in ns_tarnow_rows:
        if row['is_new_facility']:
            flush_city_group(current_group)
            current_group = [row]
        else:
            current_group.append(row)
    flush_city_group(current_group)

    conn.commit()
    conn.close()

    total_imported = stats['matched_name'] + stats['matched_address'] + stats['matched_capacity']
    print()
    print("=" * 60)
    print(f"✅ Zaimportowano: {total_imported} placówek")
    print(f"   Po nazwie:    {stats['matched_name']}")
    print(f"   Po adresie:   {stats['matched_address']} (Kraków)")
    print(f"   Po pojemności:{stats['matched_capacity']} (Nowy Sącz / Tarnów)")
    print(f"   Brak dopasowania: {stats['no_match']}")
    if unmatched:
        print()
        print("Niedopasowane:")
        for u in unmatched:
            print(f"  [{u[1]:.2f}] {u[0][:60]}")
    print(f"\nData stanu: {data_stanu}")
    print(f"Rekordy w tabeli PlacowkaWolneMiejsca: gotowe do odczytu")


if __name__ == "__main__":
    main()
