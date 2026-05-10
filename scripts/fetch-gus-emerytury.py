"""
Pobiera z GUS BDL przeciętne miesięczne emerytury brutto per województwo.

Źródło:
  GUS BDL, subject P2860 "Przeciętna miesięczna emerytura i renta brutto"
  Zmienna 155058: "z pozarolniczego systemu ubezpieczeń społecznych emerytury"
  URL API: https://bdl.stat.gov.pl/api/v1/data/by-variable/155058?unit-level=2
  URL BDL: https://bdl.stat.gov.pl/BDL/dane/podgrup/tablica?rok=0&id=P2860

Wynik:
  data/gus_emerytury_wojewodztwa.csv   — dane + metadane źródła

Uruchom: python3 scripts/fetch-gus-emerytury.py
"""

import requests
import csv
import os
import datetime

BASE_URL = "https://bdl.stat.gov.pl/api/v1"
API_KEY  = os.environ.get("GUS_BDL_KEY", "")

# Zmienna 155058 = przeciętna emerytura ZUS (bez rent)
# Zmienna 155057 = razem (emerytury + renty) — dla kontekstu
VARIABLES = {
    "emerytura_zus":        155058,  # sama emerytura z pozarolniczego systemu
    "swiadczenie_razem":    155057,  # emerytura + renta razem
    "renta_rolnikow":       155061,  # KRUS (rolnicy) — do porównania
}

YEARS = list(range(2015, 2026))  # 2015–2025 (2025 dostępne)
OUTPUT = "data/gus_emerytury_wojewodztwa.csv"

# Metadane źródła do podlinkowania
SOURCE_META = {
    "provider":     "GUS BDL (Bank Danych Lokalnych)",
    "subject_id":   "P2860",
    "subject_name": "Przeciętna miesięczna emerytura i renta brutto",
    "unit_level":   "województwo (poziom 2)",
    "unit_name":    "osoba",
    "url_api":      f"{BASE_URL}/data/by-variable/155058?unit-level=2&format=json",
    "url_www":      "https://bdl.stat.gov.pl/BDL/dane/podgrup/tablica?rok=0&id=P2860",
    "url_metodologia": "https://bdl.stat.gov.pl/BDL/metadane/podgrup-opis/185",
    "pobrano":      datetime.date.today().isoformat(),
}


def fetch_variable(var_id: int, years: list) -> list:
    """Pobiera dane rok po roku i scala wyniki (API nie obsługuje wielu lat naraz)."""
    headers = {"X-ClientId": API_KEY} if API_KEY else {}
    merged: dict[str, dict] = {}  # id → {id, name, values: []}

    for year in years:
        r = requests.get(
            f"{BASE_URL}/data/by-variable/{var_id}",
            params={"unit-level": 2, "year": str(year), "page-size": 50, "format": "json"},
            headers=headers,
            timeout=30,
        )
        r.raise_for_status()
        for unit in r.json().get("results", []):
            uid = unit["id"]
            if uid not in merged:
                merged[uid] = {"id": uid, "name": unit["name"], "values": []}
            merged[uid]["values"].extend(unit.get("values", []))

    return list(merged.values())


if __name__ == "__main__":
    print("=== GUS BDL — Przeciętne emerytury per województwo ===\n")
    print(f"Źródło: {SOURCE_META['url_www']}")
    print(f"API:    {SOURCE_META['url_api']}")
    print()

    rows = []

    for var_name, var_id in VARIABLES.items():
        print(f"Pobieranie: {var_name} (zmienna {var_id})...")
        results = fetch_variable(var_id, YEARS)
        count = 0
        for result in results:
            for val in result.get("values", []):
                if (val.get("attrId") == 1) and val.get("val"):
                    rows.append({
                        "wojewodztwo":      result["name"],
                        "rok":              int(val["year"]),
                        "wskaznik":         var_name,
                        "wartosc_zl":       round(float(val["val"]), 2),
                        # metadane źródła
                        "zrodlo_provider":  SOURCE_META["provider"],
                        "zrodlo_var_id":    var_id,
                        "zrodlo_subject":   SOURCE_META["subject_id"],
                        "zrodlo_url_api":   SOURCE_META["url_api"],
                        "zrodlo_url_www":   SOURCE_META["url_www"],
                        "zrodlo_pobrano":   SOURCE_META["pobrano"],
                    })
                    count += 1
        print(f"  {count} rekordów")

    # Zapisz
    os.makedirs("data", exist_ok=True)
    fields = list(rows[0].keys())
    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n✅ Zapisano {len(rows)} rekordów → {OUTPUT}")

    # Podgląd — Małopolska i Śląskie
    print("\nPrzeciętna emerytura ZUS — Małopolskie i Śląskie (2020–2025):")
    print(f"{'Województwo':20} {'Rok':>6} {'Emerytura':>12}")
    print("-" * 42)
    preview = [r for r in rows
               if r["wskaznik"] == "emerytura_zus"
               and r["rok"] >= 2020
               and any(woj in r["wojewodztwo"] for woj in ["MAŁOPOL", "ŚLĄSKIE"])]
    for r in sorted(preview, key=lambda x: (x["wojewodztwo"], x["rok"])):
        print(f"  {r['wojewodztwo']:20} {r['rok']:>4}   {r['wartosc_zl']:>8,.0f} zł")

    print(f"\nŹródło do cytowania:")
    print(f"  GUS BDL, Przeciętna miesięczna emerytura brutto (P2860)")
    print(f"  {SOURCE_META['url_www']}")
    print(f"  Pobrano: {SOURCE_META['pobrano']}")
