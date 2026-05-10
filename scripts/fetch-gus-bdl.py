"""
Pobiera z GUS BDL dane demograficzne per powiat dla Małopolski:
  1. Wiek poprodukcyjny (60+K/65+M) — zmienna 72293, lata 2015–2024
  2. Populacja 80+ (80-84 + 85+) — zmienne 76024+76025, lata 2015–2024
  3. Prognozy 65+ per powiat — 2025, 2030, 2035, 2040
  4. Prognozy 80+ per powiat — 2025, 2030, 2035, 2040

Wynik: data/gus_populacja_malopolska.csv

Uruchom: python3 scripts/fetch-gus-bdl.py
Opcjonalnie: GUS_BDL_KEY=twoj_klucz python3 scripts/fetch-gus-bdl.py

Źródło: GUS BDL https://bdl.stat.gov.pl/api/v1
"""

import requests
import csv
import os
import time
import datetime

API_KEY = os.environ.get("GUS_BDL_KEY", "")
BASE_URL = "https://bdl.stat.gov.pl/api/v1"
MALOPOLSKA_ID = "011200000000"
OUTPUT = "data/gus_populacja_malopolska.csv"

headers = {"X-ClientId": API_KEY, "Accept": "application/json"} if API_KEY else {"Accept": "application/json"}

HIST_YEARS = list(range(2015, 2025))

# Zmienne historyczne
HIST_VARS = {
    "wiek_poprodukcyjny": 72293,   # 60+K / 65+M ogółem (P2577)
    "80_84":              76024,   # 80–84 ogółem (P2137)
    "85plus":             76025,   # 85+ ogółem (P2137)
}

# Prognozy (subject P4359, co 45 zmiennych na rok)
# n2='ogółem', n3='65+': 2025→1722486, +45/rok
# n2='ogółem', n3='80+': 2025→1722487, +45/rok
FORECAST_VARS = {
    "65plus": {2025: 1722486, 2030: 1722531, 2035: 1722576, 2040: 1722621},
    "80plus": {2025: 1722487, 2030: 1722532, 2035: 1722577, 2040: 1722622},
}


def get_malopolska_powiats() -> tuple[dict, set]:
    r = requests.get(
        f"{BASE_URL}/units",
        params={"parent-id": MALOPOLSKA_ID, "level": 5, "page-size": 100, "format": "json"},
        headers=headers, timeout=30,
    )
    r.raise_for_status()
    powiats = [u for u in r.json()["results"] if u["id"].startswith("01121")]
    unit_map = {u["id"]: u["name"] for u in powiats}
    return unit_map, set(unit_map.keys())


def fetch_batch(variable_id: int, years: list[int]) -> list:
    """Pobiera dane dla wszystkich lat naraz (batch). Fallback do per-rok przy 412."""
    params = {
        "unit-level": 5, "unit-parentId": MALOPOLSKA_ID,
        "year": [str(y) for y in years],
        "page-size": 100, "format": "json",
    }
    r = requests.get(f"{BASE_URL}/data/by-variable/{variable_id}",
                     params=params, headers=headers, timeout=30)
    if r.status_code == 412:
        # API nie obsługuje wielu lat dla tej zmiennej — fallback rok po roku
        return fetch_year_by_year(variable_id, years)
    r.raise_for_status()
    return r.json()["results"]


def fetch_year_by_year(variable_id: int, years: list[int]) -> list:
    merged: dict[str, dict] = {}
    for year in years:
        r = requests.get(
            f"{BASE_URL}/data/by-variable/{variable_id}",
            params={"unit-level": 5, "unit-parentId": MALOPOLSKA_ID,
                    "year": str(year), "page-size": 100, "format": "json"},
            headers=headers, timeout=30,
        )
        r.raise_for_status()
        for unit in r.json().get("results", []):
            uid = unit["id"]
            if uid not in merged:
                merged[uid] = {"id": uid, "name": unit["name"], "values": []}
            merged[uid]["values"].extend(unit.get("values", []))
        time.sleep(0.2)
    return list(merged.values())


def fetch_single_year(variable_id: int) -> list:
    r = requests.get(
        f"{BASE_URL}/data/by-variable/{variable_id}",
        params={"unit-level": 5, "unit-parentId": MALOPOLSKA_ID,
                "page-size": 100, "format": "json"},
        headers=headers, timeout=30,
    )
    r.raise_for_status()
    return r.json()["results"]


if __name__ == "__main__":
    pobrano = datetime.date.today().isoformat()
    print("=== GUS BDL — populacja Małopolska per powiat ===\n")

    print("1. Pobieram listę 22 powiatów Małopolski...")
    unit_map, malopolska_ids = get_malopolska_powiats()
    print(f"   {len(unit_map)} powiatów")

    rows = []

    # ── Dane historyczne ──────────────────────────────────────────────────────
    print(f"\n2. Dane historyczne {HIST_YEARS[0]}–{HIST_YEARS[-1]}...")

    # Zbieramy 80-84 i 85+ osobno, potem sumujemy per powiat/rok
    pop_80_84: dict[tuple, int] = {}
    pop_85plus: dict[tuple, int] = {}

    for var_name, var_id in HIST_VARS.items():
        print(f"   [{var_name}] zmienna {var_id}...")
        results = fetch_batch(var_id, HIST_YEARS)
        count = 0

        for result in results:
            uid = result["id"]
            if uid not in malopolska_ids:
                continue
            for val in result.get("values", []):
                if not val.get("val"):
                    continue
                key = (uid, int(val["year"]))
                if var_name == "wiek_poprodukcyjny":
                    rows.append({
                        "teryt_powiat":  uid,
                        "powiat":        unit_map[uid],
                        "rok":           int(val["year"]),
                        "typ":           "historyczny",
                        "miara":         "wiek_poprodukcyjny",
                        "populacja":     int(val["val"]),
                        "zrodlo_var_id": var_id,
                        "zrodlo_url":    f"https://bdl.stat.gov.pl/BDL/metadane/podgrup-opis/2577",
                        "pobrano":       pobrano,
                    })
                elif var_name == "80_84":
                    pop_80_84[key] = int(val["val"])
                elif var_name == "85plus":
                    pop_85plus[key] = int(val["val"])
                count += 1
        print(f"   → {count} wartości")

    # Sumuj 80+ = 80-84 + 85+
    all_keys = set(pop_80_84) | set(pop_85plus)
    count_80 = 0
    for (uid, rok) in sorted(all_keys):
        v = pop_80_84.get((uid, rok), 0) + pop_85plus.get((uid, rok), 0)
        if v > 0:
            rows.append({
                "teryt_powiat":  uid,
                "powiat":        unit_map[uid],
                "rok":           rok,
                "typ":           "historyczny",
                "miara":         "80plus",
                "populacja":     v,
                "zrodlo_var_id": "76024+76025",
                "zrodlo_url":    "https://bdl.stat.gov.pl/BDL/metadane/podgrup-opis/2137",
                "pobrano":       pobrano,
            })
            count_80 += 1
    print(f"   [80+] zsumowane: {count_80} rekordów")

    # ── Prognozy ─────────────────────────────────────────────────────────────
    print(f"\n3. Prognozy 65+ i 80+ na lata 2025–2040...")
    for miara, year_vars in FORECAST_VARS.items():
        for rok, var_id in year_vars.items():
            results = fetch_single_year(var_id)
            count = 0
            for result in results:
                uid = result["id"]
                if uid not in malopolska_ids:
                    continue
                for val in result.get("values", []):
                    if val.get("val"):
                        rows.append({
                            "teryt_powiat":  uid,
                            "powiat":        unit_map[uid],
                            "rok":           rok,
                            "typ":           "prognoza",
                            "miara":         miara,
                            "populacja":     int(val["val"]),
                            "zrodlo_var_id": var_id,
                            "zrodlo_url":    "https://bdl.stat.gov.pl/BDL/metadane/podgrup-opis/4359",
                            "pobrano":       pobrano,
                        })
                        count += 1
            print(f"   [{miara}] {rok}: {count} powiatów")
            time.sleep(0.2)

    # ── Zapis ─────────────────────────────────────────────────────────────────
    os.makedirs("data", exist_ok=True)
    fields = ["teryt_powiat", "powiat", "rok", "typ", "miara", "populacja",
              "zrodlo_var_id", "zrodlo_url", "pobrano"]
    with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n✅ Zapisano {len(rows)} rekordów → {OUTPUT}")

    # Podgląd 80+ 2024
    print("\nPodgląd — populacja 80+ per powiat 2024:")
    hist_80_2024 = [(r["powiat"], r["populacja"]) for r in rows
                    if r["rok"] == 2024 and r["miara"] == "80plus"]
    for powiat, pop in sorted(hist_80_2024, key=lambda x: -x[1]):
        print(f"  {powiat:35} {pop:>8,}")
