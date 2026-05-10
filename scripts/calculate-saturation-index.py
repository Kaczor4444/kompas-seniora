"""
Liczy wskaźnik dostępności DPS per powiat w Małopolsce.

Konwencja (standard): miejsc DPS na 10 000 mieszkańców 80+
  → wyższy = lepsza dostępność

Uwzględnia tylko DPS (nie ŚDS — ŚDS to nie tylko seniorzy).

Źródła:
  - GUS BDL 2024: data/gus_populacja_malopolska.csv (80+)
  - Baza Kompas Seniora: Neon PostgreSQL (DPS, liczba_miejsc)
  - Ceny DPS: PlacowkaCena (mediana per powiat)
  - Emerytury: data/gus_emerytury_wojewodztwa.csv (Małopolska)

Wynik: data/wskaznik_nasycenia_malopolska.csv

Metodologia: https://kompas-seniora.pl/raport/metodologia
"""

import csv
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

GUS_CSV      = "data/gus_populacja_malopolska.csv"
EMERY_CSV    = "data/gus_emerytury_wojewodztwa.csv"
OUTPUT       = "data/wskaznik_nasycenia_malopolska.csv"
ROK_GUS      = 2024
ROK_EMERY    = 2025   # najnowsze dostępne
PER_10K      = 10_000

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


def load_gus_80plus(rok: int) -> dict[str, int]:
    data = {}
    with open(GUS_CSV, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if int(row["rok"]) == rok and row["miara"] == "80plus" and row["typ"] == "historyczny":
                data[row["powiat"]] = int(row["populacja"])
    return data


def load_gus_forecast(miara: str, rok: int) -> dict[str, int]:
    data = {}
    with open(GUS_CSV, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if int(row["rok"]) == rok and row["miara"] == miara and row["typ"] == "prognoza":
                data[row["powiat"]] = int(row["populacja"])
    return data


def load_emerytura_malopolska(rok: int) -> float | None:
    with open(EMERY_CSV, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if int(row["rok"]) == rok and row["wskaznik"] == "emerytura_zus" \
               and "MAŁOPOL" in row["wojewodztwo"]:
                return float(row["wartosc_zl"])
    return None


def load_db_data() -> dict[str, dict]:
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur  = conn.cursor()

    # Pojemność DPS per powiat (tylko DPS, tylko Małopolska)
    cur.execute("""
        SELECT powiat,
               COUNT(*)                           AS dps_placowki,
               COALESCE(SUM(liczba_miejsc), 0)    AS dps_miejsca
        FROM "Placowka"
        WHERE typ_placowki = 'DPS'
          AND wojewodztwo  = 'małopolskie'
        GROUP BY powiat
    """)
    capacity = {row[0]: {"dps_placowki": row[1], "dps_miejsca": int(row[2])}
                for row in cur.fetchall()}

    # Mediana i średnia ceny DPS per powiat (z PlacowkaCena, najnowszy rok)
    cur.execute("""
        WITH latest AS (
            SELECT p.powiat, pc.kwota,
                   ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY pc.rok DESC, pc.data_obowiazuje DESC NULLS LAST) AS rn
            FROM "Placowka" p
            JOIN "PlacowkaCena" pc ON pc."placowkaId" = p.id
            WHERE p.typ_placowki = 'DPS'
              AND p.wojewodztwo  = 'małopolskie'
              AND pc.kwota IS NOT NULL
        )
        SELECT powiat,
               PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY kwota) AS mediana,
               ROUND(AVG(kwota))                                   AS srednia,
               COUNT(*)                                            AS n_cen
        FROM latest
        WHERE rn = 1
        GROUP BY powiat
    """)
    prices = {row[0]: {"cena_mediana": round(float(row[1])) if row[1] else None,
                       "cena_srednia": int(row[2]) if row[2] else None,
                       "n_cen": row[3]}
              for row in cur.fetchall()}

    conn.close()

    # Scal capacity + prices
    result = {}
    for powiat, caps in capacity.items():
        result[powiat] = {**caps, **prices.get(powiat, {"cena_mediana": None, "cena_srednia": None, "n_cen": 0})}
    return result


if __name__ == "__main__":
    print("=== Wskaźnik dostępności DPS — Małopolska ===\n")

    pop_80_2024   = load_gus_80plus(ROK_GUS)
    pop_80_f2030  = load_gus_forecast("80plus", 2030)
    pop_80_f2035  = load_gus_forecast("80plus", 2035)
    pop_65_f2035  = load_gus_forecast("65plus", 2035)   # kontekst
    emerytura     = load_emerytura_malopolska(ROK_EMERY)
    db_data       = load_db_data()

    print(f"GUS 80+ {ROK_GUS}: {len(pop_80_2024)} powiatów")
    print(f"Emerytura Małopolska {ROK_EMERY}: {emerytura:,.0f} zł")
    print(f"Baza DB (DPS): {len(db_data)} powiatów\n")

    rows_out = []

    for db_powiat, caps in sorted(db_data.items()):
        gus_name   = POWIAT_MAP.get(db_powiat)
        if not gus_name:
            print(f"  ⚠️  Brak mapowania: {db_powiat}")
            continue

        pop_80   = pop_80_2024.get(gus_name, 0)
        pop_f30  = pop_80_f2030.get(gus_name, 0)
        pop_f35  = pop_80_f2035.get(gus_name, 0)
        miejsca  = caps["dps_miejsca"]
        mediana  = caps["cena_mediana"]

        # Wskaźnik: miejsc DPS na 10 000 osób 80+
        # Wyższy = lepsza dostępność
        def wsk(pop):
            return round(miejsca / pop * PER_10K, 1) if pop and miejsca else None

        dostepnosc_2024 = wsk(pop_80)
        dostepnosc_2030 = wsk(pop_f30)
        dostepnosc_2035 = wsk(pop_f35)

        # Luka finansowa: cena DPS - emerytura (ile brakuje miesięcznie)
        luka_mies = round(mediana - emerytura) if mediana and emerytura else None
        luka_rok  = luka_mies * 12 if luka_mies else None

        rows_out.append({
            "powiat":              db_powiat,
            # DPS
            "dps_placowki":        caps["dps_placowki"],
            "dps_miejsca":         miejsca,
            # Populacja 80+
            "pop_80plus_2024":     pop_80,
            "pop_80plus_prog2030": pop_f30,
            "pop_80plus_prog2035": pop_f35,
            # Wskaźnik dostępności (miejsc/10k seniorów 80+) — wyższy = lepszy
            "dostepnosc_2024":     dostepnosc_2024,
            "dostepnosc_2030":     dostepnosc_2030,
            "dostepnosc_2035":     dostepnosc_2035,
            # Ceny DPS
            "cena_dps_mediana":    mediana,
            "cena_dps_srednia":    caps["cena_srednia"],
            "n_placowek_z_cena":   caps["n_cen"],
            # Emerytura (Małopolska, ZUS brutto)
            "emerytura_malopolska": emerytura,
            # Luka finansowa
            "luka_miesieczna_zl":  luka_mies,
            "luka_roczna_zl":      luka_rok,
        })

    # Zapis
    os.makedirs("data", exist_ok=True)
    fields = list(rows_out[0].keys())
    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows_out)

    print(f"✅ Zapisano {len(rows_out)} powiatów → {OUTPUT}\n")

    # Ranking — najgorszy dostęp na górze
    ranked = sorted(rows_out, key=lambda x: x["dostepnosc_2024"] or 9999)
    print(f"{'Powiat':20} {'Miejsc':>7} {'Pop80+':>8} {'Dost/10k':>9} {'2035':>7} {'Mediana DPS':>12} {'Luka/rok':>10}")
    print("─" * 80)
    for r in ranked:
        d24 = f"{r['dostepnosc_2024']:>7.1f}" if r["dostepnosc_2024"] else "    —  "
        d35 = f"{r['dostepnosc_2035']:>5.1f}" if r["dostepnosc_2035"] else "   — "
        med = f"{r['cena_dps_mediana']:>10,} zł" if r["cena_dps_mediana"] else "     brak ceny"
        luk = f"{r['luka_roczna_zl']:>8,} zł" if r["luka_roczna_zl"] else "          —"
        print(f"{r['powiat']:20} {r['dps_miejsca']:>7,} {r['pop_80plus_2024']:>8,} {d24} {d35} {med} {luk}")

    print(f"\nEmerytura bazowa (Małopolska {ROK_EMERY}): {emerytura:,.0f} zł")
    print("Interpretacja: Dostępność = miejsc DPS na 10 000 seniorów 80+. Im wyżej, tym lepiej.")
