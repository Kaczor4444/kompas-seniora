"""
Pobiera z GUS BDL:
  1. Historyczne dane populacji w wieku poprodukcyjnym (60+K/65+M) per powiat, Małopolska 2015-2023
  2. Prognozy 65+ per powiat, Małopolska na lata 2025-2060

Wynik: data/gus_populacja_malopolska.csv

Uruchom: python3 scripts/fetch-gus-bdl.py
Opcjonalnie: GUS_BDL_KEY=twoj_klucz python3 scripts/fetch-gus-bdl.py
"""

import requests
import csv
import os
import time

API_KEY = os.environ.get("GUS_BDL_KEY", "")
BASE_URL = "https://bdl.stat.gov.pl/api/v1"
MALOPOLSKA_ID = "011200000000"

headers = {"X-ClientId": API_KEY} if API_KEY else {}

HIST_VARIABLE = 72293   # Ludność w wieku poprodukcyjnym ogółem (60+K, 65+M)
HIST_YEARS = list(range(2015, 2025))  # GUS publikuje z ~rocznym opóźnieniem, 2024 dostępne

# Prognoza 65+ ogółem — ID per rok (GUS BDL, subject P4359)
FORECAST_VARS = {
    2025: 1722486,
    2030: 1722531,
    2035: 1722576,
    2040: 1722621,
}


def get_malopolska_powiats():
    r = requests.get(
        f"{BASE_URL}/units",
        params={"parent-id": MALOPOLSKA_ID, "level": 5, "page-size": 100, "format": "json"},
        headers=headers,
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["results"]


def get_variable_data(variable_id, years=None):
    params = {
        "unit-level": 5,
        "unit-parentId": MALOPOLSKA_ID,
        "page-size": 100,
        "format": "json",
    }
    if years:
        params["year"] = years
    r = requests.get(
        f"{BASE_URL}/data/by-variable/{variable_id}",
        params=params,
        headers=headers,
        timeout=30,
    )
    r.raise_for_status()
    return r.json()["results"]


if __name__ == "__main__":
    print("=== GUS BDL — populacja Małopolska per powiat ===\n")

    print("1. Pobieram listę 22 powiatów Małopolski...")
    powiats = get_malopolska_powiats()
    # Filtruj tylko Małopolskę (ID zaczyna się od "01121")
    powiats = [u for u in powiats if u["id"].startswith("01121")]
    print(f"   {len(powiats)} powiatów")
    unit_map = {u["id"]: u["name"] for u in powiats}
    malopolska_ids = set(unit_map.keys())

    rows = []

    # Dane historyczne
    print(f"\n2. Dane historyczne {HIST_YEARS[0]}–{HIST_YEARS[-1]} (wiek poprodukcyjny 60+K/65+M)...")
    results = get_variable_data(HIST_VARIABLE, [str(y) for y in HIST_YEARS])
    count = 0
    for result in results:
        uid = result["id"]
        if uid not in malopolska_ids:
            continue
        for val in result.get("values", []):
            rows.append({
                "teryt_powiat": uid,
                "powiat": unit_map[uid],
                "rok": int(val["year"]),
                "typ": "historyczny",
                "miara": "wiek_poprodukcyjny_ogołem",
                "populacja": val["val"],
            })
            count += 1
    print(f"   {count} rekordów")

    # Prognozy 65+
    print(f"\n3. Prognozy 65+ na lata {list(FORECAST_VARS.keys())}...")
    for rok, var_id in FORECAST_VARS.items():
        results = get_variable_data(var_id)
        count = 0
        for result in results:
            uid = result["id"]
            if uid not in malopolska_ids:
                continue
            for val in result.get("values", []):
                rows.append({
                    "teryt_powiat": uid,
                    "powiat": unit_map[uid],
                    "rok": rok,
                    "typ": "prognoza",
                    "miara": "65plus_ogołem",
                    "populacja": val["val"],
                })
                count += 1
        print(f"   {rok}: {count} rekordów")
        time.sleep(0.3)

    # Zapis
    os.makedirs("data", exist_ok=True)
    output = "data/gus_populacja_malopolska.csv"
    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["teryt_powiat", "powiat", "rok", "typ", "miara", "populacja"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n✅ Zapisano {len(rows)} rekordów → {output}")

    # Podgląd: ranking powiatów 2023 (wiek poprodukcyjny)
    print("\nRanking powiatów — wiek poprodukcyjny 2023:")
    hist_2023 = [(r["powiat"], r["populacja"]) for r in rows if r["rok"] == 2023 and r["typ"] == "historyczny"]
    for powiat, pop in sorted(hist_2023, key=lambda x: -x[1]):
        print(f"  {powiat:35} {pop:>8,}")
