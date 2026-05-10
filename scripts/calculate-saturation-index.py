"""
Liczy wskaźnik nasycenia DPS per powiat w Małopolsce:
  nasycenie = populacja_poprodukcyjna / miejsca_DPS

Im wyższy wskaźnik → więcej seniorów na 1 miejsce → większy deficyt.

Źródła:
  - GUS BDL 2024: data/gus_populacja_malopolska.csv
  - Baza Kompas Seniora: Neon PostgreSQL

Wynik: data/wskaznik_nasycenia_malopolska.csv
"""

import csv
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

GUS_CSV = "data/gus_populacja_malopolska.csv"
OUTPUT = "data/wskaznik_nasycenia_malopolska.csv"

# Mapowanie nazw powiatów: DB → GUS
POWIAT_MAP = {
    "bocheński":    "Powiat bocheński",
    "brzeski":      "Powiat brzeski",
    "chrzanowski":  "Powiat chrzanowski",
    "dąbrowski":    "Powiat dąbrowski",
    "gorlicki":     "Powiat gorlicki",
    "krakowski":    "Powiat krakowski",
    "limanowski":   "Powiat limanowski",
    "m. Kraków":    "Powiat m. Kraków",
    "m. Nowy Sącz": "Powiat m. Nowy Sącz",
    "m. Tarnów":    "Powiat m. Tarnów",
    "miechowski":   "Powiat miechowski",
    "myślenicki":   "Powiat myślenicki",
    "nowosądecki":  "Powiat nowosądecki",
    "nowotarski":   "Powiat nowotarski",
    "olkuski":      "Powiat olkuski",
    "oświęcimski":  "Powiat oświęcimski",
    "proszowicki":  "Powiat proszowicki",
    "suski":        "Powiat suski",
    "tarnowski":    "Powiat tarnowski",
    "tatrzański":   "Powiat tatrzański",
    "wadowicki":    "Powiat wadowicki",
    "wielicki":     "Powiat wielicki",
}


def load_gus(rok=2024):
    """Wczytuje populację poprodukcyjną per powiat dla danego roku."""
    data = {}
    with open(GUS_CSV, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if int(row["rok"]) == rok and row["typ"] == "historyczny":
                data[row["powiat"]] = int(row["populacja"])
    return data


def load_db_capacity():
    """Pobiera pojemność DPS i ŚDS per powiat z bazy."""
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()
    cur.execute("""
        SELECT
            powiat,
            typ_placowki,
            COUNT(*)           AS liczba_placowek,
            COALESCE(SUM(liczba_miejsc), 0) AS suma_miejsc
        FROM "Placowka"
        WHERE wojewodztwo = 'małopolskie'
        GROUP BY powiat, typ_placowki
        ORDER BY powiat, typ_placowki
    """)
    rows = cur.fetchall()
    conn.close()

    capacity = {}
    for powiat, typ, n_placowek, miejsca in rows:
        if powiat not in capacity:
            capacity[powiat] = {"dps_placowki": 0, "dps_miejsca": 0, "sds_placowki": 0, "sds_miejsca": 0}
        if typ == "DPS":
            capacity[powiat]["dps_placowki"] = n_placowek
            capacity[powiat]["dps_miejsca"] = int(miejsca)
        elif typ == "ŚDS":
            capacity[powiat]["sds_placowki"] = n_placowek
            capacity[powiat]["sds_miejsca"] = int(miejsca)
    return capacity


def load_gus_forecast(rok=2035):
    """Wczytuje prognozę 65+ per powiat dla danego roku."""
    data = {}
    with open(GUS_CSV, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if int(row["rok"]) == rok and row["typ"] == "prognoza":
                data[row["powiat"]] = int(row["populacja"])
    return data


if __name__ == "__main__":
    print("=== Wskaźnik nasycenia DPS — Małopolska ===\n")

    gus_2024   = load_gus(2024)
    gus_f2030  = load_gus_forecast(2030)
    gus_f2035  = load_gus_forecast(2035)
    capacity   = load_db_capacity()

    print(f"GUS 2024:     {len(gus_2024)} powiatów")
    print(f"Prognoza 2030:{len(gus_f2030)} powiatów")
    print(f"Baza DB:      {len(capacity)} powiatów\n")

    rows_out = []
    missing = []

    for db_powiat, caps in sorted(capacity.items()):
        gus_name = POWIAT_MAP.get(db_powiat)
        if not gus_name:
            missing.append(db_powiat)
            continue

        pop_2024  = gus_2024.get(gus_name, 0)
        pop_f2030 = gus_f2030.get(gus_name, 0)
        pop_f2035 = gus_f2035.get(gus_name, 0)
        dps_miejsc = caps["dps_miejsca"]

        # Wskaźnik: ile osób poprodukcyjnych na 1 miejsce DPS
        nasycenie_2024 = round(pop_2024 / dps_miejsc, 1) if dps_miejsc > 0 else None
        nasycenie_2030 = round(pop_f2030 / dps_miejsc, 1) if dps_miejsc > 0 else None
        nasycenie_2035 = round(pop_f2035 / dps_miejsc, 1) if dps_miejsc > 0 else None

        rows_out.append({
            "powiat_db":       db_powiat,
            "powiat_gus":      gus_name,
            "dps_placowki":    caps["dps_placowki"],
            "dps_miejsca":     dps_miejsc,
            "sds_placowki":    caps["sds_placowki"],
            "sds_miejsca":     caps["sds_miejsca"],
            "pop_poprodukcyjna_2024": pop_2024,
            "nasycenie_2024":  nasycenie_2024,   # osób/miejsce
            "pop_65plus_prog_2030": pop_f2030,
            "nasycenie_2030":  nasycenie_2030,
            "pop_65plus_prog_2035": pop_f2035,
            "nasycenie_2035":  nasycenie_2035,
        })

    # Zapisz CSV
    os.makedirs("data", exist_ok=True)
    fields = list(rows_out[0].keys())
    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows_out)

    print(f"✅ Zapisano {len(rows_out)} powiatów → {OUTPUT}\n")

    # Ranking nasycenia 2024 (najgorsze na górze)
    ranked = sorted(rows_out, key=lambda x: x["nasycenie_2024"] or 0, reverse=True)
    print(f"{'Powiat':20} {'DPS':>5} {'Miejsc':>7} {'Pop.prod.':>10} {'Nasycenie':>10} {'2030':>8} {'2035':>8}")
    print("-" * 75)
    for r in ranked:
        n24 = f"{r['nasycenie_2024']:>8.0f}" if r["nasycenie_2024"] else "    brak"
        n30 = f"{r['nasycenie_2030']:>6.0f}" if r["nasycenie_2030"] else "  brak"
        n35 = f"{r['nasycenie_2035']:>6.0f}" if r["nasycenie_2035"] else "  brak"
        print(f"{r['powiat_db']:20} {r['dps_placowki']:>5} {r['dps_miejsca']:>7,} {r['pop_poprodukcyjna_2024']:>10,} {n24} {n30} {n35}")

    if missing:
        print(f"\n⚠️  Pominięte (brak mapowania): {missing}")
