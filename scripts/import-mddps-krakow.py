#!/usr/bin/env python3
"""
Import MDDPS Kraków (Miejski Dzienny Dom Pomocy Społecznej) — 16 placówek.
Źródło: https://bip.krakow.pl/?dok_id=78643

Typy:
  - 6 Domy → Dzienny Dom Senior+ (dzienna opieka dla potrzebujących)
  - 10 Klubów → Klub Senior+    (aktywność, finansowane przez miasto)

Uruchomienie:
  export $(grep -v '^#' .env | xargs) && python3 scripts/import-mddps-krakow.py
"""

import os
import time
import requests
import psycopg2

DATABASE_URL = os.environ['DATABASE_URL']

MDDPS = [
    # ── 6 Miejskie Dzienne Domy Pomocy Społecznej ─────────────────────────────
    {
        'nazwa': 'Miejski Dzienny Dom Pomocy Społecznej nr 1 "Socius"',
        'ulica': 'ul. Jana Sas-Zubrzyckiego 10',
        'typ': 'Dzienny Dom Senior+',
        'telefon': '12 655 21 76',
    },
    {
        'nazwa': 'Miejski Dzienny Dom Pomocy Społecznej nr 2',
        'ulica': 'ul. Ks. Gurgacza 5',
        'typ': 'Dzienny Dom Senior+',
        'telefon': '12 411 00 50',
    },
    {
        'nazwa': 'Miejski Dzienny Dom Pomocy Społecznej nr 3',
        'ulica': 'ul. Korczaka 4',
        'typ': 'Dzienny Dom Senior+',
        'telefon': '12 416 15 60',
    },
    {
        'nazwa': 'Miejski Dzienny Dom Pomocy Społecznej nr 4',
        'ulica': 'ul. Sudolska 7a',
        'typ': 'Dzienny Dom Senior+',
        'telefon': '12 412 62 34',
    },
    {
        'nazwa': 'Miejski Dzienny Dom Pomocy Społecznej nr 5',
        'ulica': 'ul. Nad Sudołem 32',
        'typ': 'Dzienny Dom Senior+',
        'telefon': '12 415 54 14',
    },
    {
        'nazwa': 'Miejski Dzienny Dom Pomocy Społecznej nr 6 Centrum Kultury i Rekreacji Seniorów',
        'ulica': 'os. Szkolne 20',
        'typ': 'Dzienny Dom Senior+',
        'telefon': '12 644 20 52',
    },
    # ── 5 Kluby Samopomocy ────────────────────────────────────────────────────
    {
        'nazwa': 'MDDPS Klub Samopomocy',
        'ulica': 'ul. Zapolskiej 15',
        'typ': 'Klub Senior+',
        'telefon': None,
    },
    {
        'nazwa': 'MDDPS Klub Samopomocy',
        'ulica': 'ul. Zapolskiej 42',
        'typ': 'Klub Senior+',
        'telefon': None,
    },
    {
        'nazwa': 'MDDPS Klub Samopomocy',
        'ulica': 'al. Marszałka Focha 39',
        'typ': 'Klub Senior+',
        'telefon': None,
    },
    {
        'nazwa': 'MDDPS Klub Samopomocy',
        'ulica': 'ul. Św. Jana 18',
        'typ': 'Klub Senior+',
        'telefon': None,
    },
    {
        'nazwa': 'MDDPS Klub Samopomocy',
        'ulica': 'ul. Facimiech 16',
        'typ': 'Klub Senior+',
        'telefon': None,
    },
    # ── 4 Kluby Samopomocy Aktywizacyjne ────────────────────────────────────
    {
        'nazwa': 'MDDPS Klub Samopomocy Aktywizacyjny',
        'ulica': 'ul. Grzegórzecka 19',
        'typ': 'Klub Senior+',
        'telefon': None,
    },
    {
        'nazwa': 'MDDPS Klub Samopomocy Aktywizacyjny',
        'ulica': 'ul. Generała Okulickiego 51',
        'typ': 'Klub Senior+',
        'telefon': None,
    },
    {
        'nazwa': 'MDDPS Klub Samopomocy Aktywizacyjny',
        'ulica': 'ul. Bronowicka 19',
        'typ': 'Klub Senior+',
        'telefon': None,
    },
    {
        'nazwa': 'MDDPS Klub Samopomocy Aktywizacyjny',
        'ulica': 'ul. Gdańska 5',
        'typ': 'Klub Senior+',
        'telefon': None,
    },
    # ── 1 Klub Samopomocy Specjalistyczny ───────────────────────────────────
    {
        'nazwa': 'MDDPS Klub Samopomocy Specjalistyczny',
        'ulica': 'os. Krakowiaków 2',
        'typ': 'Klub Senior+',
        'telefon': None,
    },
]


def geocode(ulica: str) -> tuple[float, float] | None:
    url = 'https://nominatim.openstreetmap.org/search'
    params = {
        'q': f'{ulica}, Kraków, Polska',
        'format': 'json',
        'limit': 1,
    }
    headers = {'User-Agent': 'geocoder-research/1.0'}
    try:
        r = requests.get(url, params=params, headers=headers, timeout=10)
        r.raise_for_status()
        data = r.json()
        if data:
            return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f'  geocoding error: {e}')
    return None


def main():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    inserted = skipped = errors = 0

    for fac in MDDPS:
        print(f'\n{fac["nazwa"]} — {fac["ulica"]}')

        # Check duplicate
        cur.execute(
            'SELECT id FROM "Placowka" WHERE typ_placowki = %s AND miejscowosc = %s AND ulica = %s',
            (fac['typ'], 'Kraków', fac['ulica']),
        )
        existing = cur.fetchone()
        if existing:
            print(f'  ⏭  już istnieje (id={existing[0]})')
            skipped += 1
            continue

        # Geocode
        coords = geocode(fac['ulica'])
        time.sleep(1.2)
        lat = coords[0] if coords else None
        lon = coords[1] if coords else None
        print(f'  coords: {lat}, {lon}' if coords else '  ⚠️  brak geolokalizacji')

        try:
            cur.execute(
                """
                INSERT INTO "Placowka" (
                    nazwa, ulica, miejscowosc, powiat, wojewodztwo,
                    typ_placowki, telefon, email, jst_nazwa,
                    latitude, longitude,
                    "createdAt", "updatedAt"
                ) VALUES (
                    %s, %s, 'Kraków', 'm. Kraków', 'małopolskie',
                    %s, %s, 'sekretariat@mddps.krakow.pl', 'Miasto Kraków (MDDPS)',
                    %s, %s,
                    NOW(), NOW()
                ) RETURNING id
                """,
                (fac['nazwa'], fac['ulica'], fac['typ'], fac['telefon'], lat, lon),
            )
            row = cur.fetchone()
            conn.commit()
            print(f'  ✅ dodano (id={row[0]})')
            inserted += 1
        except Exception as e:
            conn.rollback()
            print(f'  ❌ błąd bazy: {e}')
            errors += 1

    cur.close()
    conn.close()

    print(f'\n{"="*50}')
    print(f'Wynik: {inserted} dodano, {skipped} pominięto, {errors} błędów')
    print(f'Łącznie w liście: {len(MDDPS)}')


if __name__ == '__main__':
    main()
