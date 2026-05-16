#!/usr/bin/env python3
"""
Jednorazowy import ośrodków Senior+ do tabeli Placowka.
Pobiera plik XLSX z MUW Małopolska, geokoduje adresy przez Nominatim
i upsertuje rekordy (sprawdza duplikaty po nazwie + miejscowości).

Uruchomienie: DATABASE_URL=... python3 scripts/import-senior-plus.py
"""

import os
import sys
import time
import urllib3
import requests
import openpyxl
from io import BytesIO
from datetime import datetime

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

DATABASE_URL = os.environ.get("DATABASE_URL", "")
XLSX_URL = "https://www.malopolska.uw.gov.pl/Docs/Wykaz%20funkcjonuj%C4%85cych%20o%C5%9Brodk%C3%B3w%20Senior%20w%20Ma%C5%82opolsce.xlsx"
NOMINATIM_DELAY = 1.2  # sekundy między requestami (polityka Nominatim: max 1 req/s)

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("❌ Brak psycopg2. Zainstaluj: pip install psycopg2-binary")
    sys.exit(1)


def download_xlsx() -> bytes:
    print(f"📥 Pobieram plik XLSX z MUW...")
    r = requests.get(XLSX_URL, timeout=30, verify=False)
    r.raise_for_status()
    print(f"✅ Pobrano {len(r.content):,} bajtów")
    return r.content


def parse_xlsx(data: bytes) -> list[dict]:
    wb = openpyxl.load_workbook(BytesIO(data))
    ws = wb.active
    rows = []
    for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True)):
        lp, rodzaj, liczba_miejsc, jst, woj, ulica, kod, miasto, tel, email, rok = row
        if lp is None:
            continue
        rows.append({
            "lp": int(lp) if lp else i,
            "typ_placowki": str(rodzaj).strip() if rodzaj else "",
            "liczba_miejsc": int(liczba_miejsc) if liczba_miejsc else None,
            "jst_nazwa": str(jst).strip() if jst else None,
            "wojewodztwo": str(woj).strip() if woj else "małopolskie",
            "ulica": str(ulica).strip() if ulica else None,
            "kod_pocztowy": str(kod).strip() if kod else None,
            "miejscowosc": str(miasto).strip() if miasto else "",
            "telefon": str(tel).strip() if tel else None,
            "email": str(email).strip() if email else None,
            "rok_powstania": int(rok) if rok else None,
        })
    print(f"📊 Sparsowano {len(rows)} wierszy")
    return rows


def geocode(ulica: str | None, miejscowosc: str, kod: str | None) -> tuple[float | None, float | None]:
    """Geokoduje adres przez Nominatim OSM. Zwraca (lat, lon)."""
    parts = []
    if ulica:
        parts.append(ulica)
    parts.append(miejscowosc)
    if kod:
        parts.append(kod)
    parts.append("Polska")
    q = ", ".join(parts)

    headers = {"User-Agent": "KompasSeniora/1.0 (import-senior-plus)"}
    params = {"q": q, "format": "json", "limit": 1, "countrycodes": "pl"}
    try:
        r = requests.get("https://nominatim.openstreetmap.org/search",
                         params=params, headers=headers, timeout=10)
        data = r.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
        # Fallback: sama miejscowość
        r2 = requests.get("https://nominatim.openstreetmap.org/search",
                          params={"q": f"{miejscowosc}, małopolskie, Polska",
                                  "format": "json", "limit": 1, "countrycodes": "pl"},
                          headers=headers, timeout=10)
        data2 = r2.json()
        if data2:
            return float(data2[0]["lat"]), float(data2[0]["lon"])
    except Exception as e:
        print(f"    ⚠️ Błąd geokodowania: {e}")
    return None, None


def get_powiat_from_jst(jst: str | None) -> str:
    """Wyciąga nazwę powiatu z nazwy JST (np. 'Gmina Andrychów' → 'wadowicki')."""
    if not jst:
        return "małopolskie"
    # Zostawiamy surową nazwę JST — admin może poprawić
    # Wycinamy prefix "Gmina " / "Powiat " / "Miasto "
    name = jst.strip()
    for prefix in ["Gmina Miasto ", "Gmina ", "Powiat ", "Miasto "]:
        if name.startswith(prefix):
            name = name[len(prefix):]
            break
    return name


def build_nazwa(row: dict) -> str:
    rodzaj = row["typ_placowki"]
    jst = get_powiat_from_jst(row["jst_nazwa"])
    return f"{rodzaj} — {jst}"


def import_to_db(rows: list[dict]):
    if not DATABASE_URL:
        print("❌ Brak DATABASE_URL w środowisku!")
        sys.exit(1)

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    now = datetime.utcnow()

    inserted = 0
    updated = 0
    skipped = 0

    for i, row in enumerate(rows):
        nazwa = build_nazwa(row)
        miejscowosc = row["miejscowosc"]

        # Sprawdź duplikat
        cur.execute(
            "SELECT id FROM \"Placowka\" WHERE typ_placowki = %s AND miejscowosc = %s AND ulica = %s",
            (row["typ_placowki"], miejscowosc, row["ulica"])
        )
        existing = cur.fetchone()

        # Geokoduj
        print(f"  [{i+1}/{len(rows)}] {nazwa} ({miejscowosc}) → geokodowanie...")
        lat, lon = geocode(row["ulica"], miejscowosc, row["kod_pocztowy"])
        if lat:
            print(f"    📍 {lat:.4f}, {lon:.4f}")
        else:
            print(f"    ⚠️ brak współrzędnych")
        time.sleep(NOMINATIM_DELAY)

        if existing:
            cur.execute("""
                UPDATE "Placowka"
                SET latitude = %s, longitude = %s, rok_powstania = %s, jst_nazwa = %s,
                    liczba_miejsc = %s, telefon = %s, email = %s,
                    "updatedAt" = %s, zrodlo_dane = %s
                WHERE id = %s
            """, (lat, lon, row["rok_powstania"], row["jst_nazwa"],
                  row["liczba_miejsc"], row["telefon"], row["email"],
                  now, "MUW Senior+ XLSX 2025", existing[0]))
            updated += 1
        else:
            cur.execute("""
                INSERT INTO "Placowka" (
                    nazwa, typ_placowki, ulica, miejscowosc, kod_pocztowy,
                    powiat, wojewodztwo, telefon, email,
                    liczba_miejsc, rok_powstania, jst_nazwa,
                    latitude, longitude,
                    verified, "createdAt", "updatedAt", zrodlo_dane
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s,
                    false, %s, %s, %s
                )
            """, (
                nazwa,
                row["typ_placowki"],
                row["ulica"],
                miejscowosc,
                row["kod_pocztowy"],
                get_powiat_from_jst(row["jst_nazwa"]),
                "małopolskie",
                row["telefon"],
                row["email"],
                row["liczba_miejsc"],
                row["rok_powstania"],
                row["jst_nazwa"],
                lat, lon,
                now, now,
                "MUW Senior+ XLSX 2025",
            ))
            inserted += 1

        if (i + 1) % 10 == 0:
            conn.commit()
            print(f"  💾 Zapisano {i+1} rekordów...")

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n✅ GOTOWE: {inserted} dodanych, {updated} zaktualizowanych, {skipped} pominiętych")


if __name__ == "__main__":
    data = download_xlsx()
    rows = parse_xlsx(data)
    import_to_db(rows)
