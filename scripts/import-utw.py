#!/usr/bin/env python3
"""
Import UTW (Uniwersytety Trzeciego Wieku) z raw_dane/utw_malopolska.csv do bazy Neon PostgreSQL.

Uruchomienie:
  export $(grep -v '^#' .env | xargs) && python3 scripts/import-utw.py

Sprawdza duplikaty po (nazwa, miejscowosc) — bezpieczne wielokrotne uruchomienie.
"""

import csv
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import psycopg2
except ImportError:
    sys.exit("❌ Brak psycopg2. Zainstaluj: pip install psycopg2-binary")

DATABASE_URL = os.environ.get('DATABASE_URL', '')
if not DATABASE_URL:
    sys.exit("❌ Brak DATABASE_URL w środowisku. Uruchom: export $(grep -v '^#' .env | xargs)")

CSV_PATH = Path(__file__).resolve().parent.parent / 'raw_dane' / 'utw_malopolska.csv'
if not CSV_PATH.exists():
    sys.exit(f"❌ Brak pliku {CSV_PATH}")


def main():
    rows = list(csv.DictReader(open(CSV_PATH, encoding='utf-8')))
    print(f"📋 CSV: {len(rows)} wpisów UTW")

    conn = psycopg2.connect(DATABASE_URL)
    cur  = conn.cursor()
    now  = datetime.utcnow()

    inserted = skipped = errors = 0

    for row in rows:
        nazwa      = row['nazwa'].strip()
        miejscowosc = row['miejscowosc'].strip()

        # Sprawdź duplikat
        cur.execute(
            'SELECT id FROM "Placowka" WHERE typ_placowki = %s AND nazwa = %s AND miejscowosc = %s',
            ('UTW', nazwa, miejscowosc)
        )
        if cur.fetchone():
            print(f"  ⏭  pominięto (już istnieje): {nazwa[:55]}")
            skipped += 1
            continue

        lat = float(row['latitude'])  if row['latitude']  else None
        lon = float(row['longitude']) if row['longitude'] else None

        try:
            cur.execute("""
                INSERT INTO "Placowka" (
                    nazwa, typ_placowki,
                    ulica, miejscowosc, kod_pocztowy,
                    powiat, wojewodztwo,
                    telefon, email, www,
                    latitude, longitude,
                    verified, "createdAt", "updatedAt",
                    zrodlo_dane
                ) VALUES (
                    %s, 'UTW',
                    %s, %s, %s,
                    %s, %s,
                    %s, %s, %s,
                    %s, %s,
                    false, %s, %s,
                    %s
                ) RETURNING id
            """, (
                nazwa,
                row['ulica']       or None,
                miejscowosc,
                row['kod_pocztowy'] or None,
                row['powiat']      or None,
                row['wojewodztwo'] or 'małopolskie',
                row['telefon']     or None,
                row['email']       or None,
                row['strona_www']  or None,
                lat, lon,
                now, now,
                f"senioralna.malopolska.pl {now.year}",
            ))
            new_id = cur.fetchone()[0]
            conn.commit()
            print(f"  ✅ id={new_id:4d} | {nazwa[:55]}")
            inserted += 1
        except Exception as e:
            conn.rollback()
            print(f"  ❌ błąd: {nazwa[:40]} — {e}")
            errors += 1

    cur.close()
    conn.close()

    print(f"\n{'='*60}")
    print(f"Wynik: {inserted} dodano, {skipped} pominięto, {errors} błędów")

    if inserted > 0:
        print(f"\n⚠️  Pamiętaj:")
        print(f"   • Dodać filtr UTW w SearchBar / FilterPanel")
        print(f"   • Zbudować stronę /utw")
        print(f"   • Dodać kafelek na landingu")


if __name__ == '__main__':
    main()
