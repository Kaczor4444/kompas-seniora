"""
Monitor GUS BDL — sprawdza czy pojawiły się nowe dane o wysokości emerytur.

Logika:
- Porównuje najnowszy rok w API z ostatnim zapisanym w data/gus_emerytury_wojewodztwa.csv
- Jeśli API ma nowszy rok → tworzy GitHub Issue z nowymi wartościami
- Jeśli brak zmian → kończy cicho (zero spamu)
- Duplikaty Issues blokowane przez sprawdzenie tytułu

Harmonogram: 1. każdego miesiąca o 9:30 UTC (po monitorze GUS populacji).

Zmienne środowiskowe:
  GITHUB_TOKEN  — token GitHub (automatyczny w Actions)
  GITHUB_REPO   — "owner/repo"
  GUS_BDL_KEY   — opcjonalny klucz API GUS
  FORCE_CHECK   — "true" → Issue nawet bez nowych danych (do testów)
"""

import os
import sys
import csv
import datetime
import time
import requests

# ── konfiguracja ──────────────────────────────────────────────────────────────

BASE_URL      = "https://bdl.stat.gov.pl/api/v1"
VARIABLE_ID   = 155058       # Przeciętna emerytura ZUS brutto per województwo
LOCAL_CSV     = "data/gus_emerytury_wojewodztwa.csv"
WSKAZNIK      = "emerytura_zus"

REPO          = os.environ.get("GITHUB_REPO", os.environ.get("GITHUB_REPOSITORY", "Kaczor4444/kompas-seniora"))
GITHUB_TOKEN  = os.environ.get("GITHUB_TOKEN", "")
API_KEY       = os.environ.get("GUS_BDL_KEY", "")
FORCE_CHECK   = os.environ.get("FORCE_CHECK", "false").lower() == "true"

# Województwa priorytetowe w raporcie
HIGHLIGHT_WOJE = {"MAŁOPOLSKIE", "ŚLĄSKIE", "MAZOWIECKIE"}


# ── helpers ───────────────────────────────────────────────────────────────────

def gus_headers() -> dict:
    h = {"Accept": "application/json"}
    if API_KEY:
        h["X-ClientId"] = API_KEY
    return h


def fetch_latest_year_api() -> tuple[int, dict[str, float]]:
    """Zwraca (najnowszy_rok, {województwo: wartość}) z GUS BDL."""
    for attempt in (1, 2):
        try:
            r = requests.get(
                f"{BASE_URL}/variables/{VARIABLE_ID}",
                params={"format": "json"},
                headers=gus_headers(),
                timeout=20,
            )
            r.raise_for_status()
            available_years = sorted(r.json().get("years", []))
            if not available_years:
                raise ValueError("Brak listy lat w odpowiedzi API")
            latest_year = available_years[-1]
            break
        except requests.RequestException as exc:
            if attempt == 1:
                print(f"  Retry za 5s ({exc})")
                time.sleep(5)
            else:
                raise

    # Pobierz wartości dla najnowszego roku
    r = requests.get(
        f"{BASE_URL}/data/by-variable/{VARIABLE_ID}",
        params={"unit-level": 2, "year": str(latest_year), "page-size": 50, "format": "json"},
        headers=gus_headers(),
        timeout=20,
    )
    r.raise_for_status()

    values = {}
    for unit in r.json().get("results", []):
        for v in unit.get("values", []):
            if v.get("attrId") == 1 and v.get("val"):
                values[unit["name"]] = round(float(v["val"]), 2)

    return latest_year, values


def latest_year_local() -> int:
    """Zwraca najnowszy rok zapisany w lokalnym CSV."""
    if not os.path.exists(LOCAL_CSV):
        return 0
    max_rok = 0
    with open(LOCAL_CSV, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("wskaznik") == WSKAZNIK:
                max_rok = max(max_rok, int(row["rok"]))
    return max_rok


def has_open_issue(title: str) -> bool:
    if not GITHUB_TOKEN:
        return False
    r = requests.get(
        f"https://api.github.com/repos/{REPO}/issues",
        headers={"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"},
        params={"state": "open", "per_page": 50},
        timeout=15,
    )
    if not r.ok:
        print(f"  Ostrzeżenie: nie można sprawdzić Issues ({r.status_code})")
        return False
    return any(i["title"] == title for i in r.json())


def create_issue(title: str, body: str) -> str | None:
    if not GITHUB_TOKEN:
        print("Brak GITHUB_TOKEN — pomijam Issue")
        return None
    labels = ["data-monitoring", "gus-data", "data-update"]
    r = requests.post(
        f"https://api.github.com/repos/{REPO}/issues",
        headers={"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"},
        json={"title": title, "body": body, "labels": labels},
        timeout=15,
    )
    if r.status_code == 422:
        r = requests.post(
            f"https://api.github.com/repos/{REPO}/issues",
            headers={"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github+json"},
            json={"title": title, "body": body},
            timeout=15,
        )
    if not r.ok:
        print(f"Błąd tworzenia Issue: {r.status_code} {r.text}")
        return None
    url = r.json()["html_url"]
    print(f"Issue: {url}")
    return url


def build_body(new_year: int, values: dict[str, float], prev_year: int) -> str:
    today = datetime.date.today().strftime("%d.%m.%Y")
    malopolska = values.get("MAŁOPOLSKIE", 0)
    slaskie    = values.get("ŚLĄSKIE", 0)
    mazowieckie = values.get("MAZOWIECKIE", 0)

    lines = [
        f"# GUS BDL — nowe dane emerytur za rok {new_year}",
        "",
        f"Sprawdzono: **{today}**  |  Poprzedni rok w bazie: **{prev_year}**",
        "",
        "## Kluczowe wartości",
        "",
        f"| Województwo | Emerytura ZUS brutto {new_year} |",
        "|-------------|-------------------------------|",
        f"| Małopolskie | **{malopolska:,.0f} zł** |",
        f"| Śląskie     | {slaskie:,.0f} zł |",
        f"| Mazowieckie | {mazowieckie:,.0f} zł |",
        "",
        "## Wszystkie województwa",
        "",
        "| Województwo | Emerytura (zł) |",
        "|-------------|---------------|",
    ]
    for woj, val in sorted(values.items(), key=lambda x: -x[1]):
        highlight = "**" if woj in HIGHLIGHT_WOJE else ""
        lines.append(f"| {highlight}{woj.title()}{highlight} | {val:,.2f} |")

    lines += [
        "",
        "## Co dalej",
        "",
        "1. Uruchom skrypt: `python3 scripts/fetch-gus-emerytury.py`",
        "2. Zaktualizuje `data/gus_emerytury_wojewodztwa.csv` o nowy rok",
        "3. Odśwież wskaźnik nasycenia: `python3 scripts/calculate-saturation-index.py`",
        "4. Zamknij Issue po aktualizacji danych.",
        "",
        "## Źródło",
        "",
        f"GUS BDL, P2860 — Przeciętna miesięczna emerytura i renta brutto  ",
        f"https://bdl.stat.gov.pl/BDL/dane/podgrup/tablica?rok=0&id=P2860  ",
        f"Zmienna: {VARIABLE_ID} (emerytury z pozarolniczego systemu ZUS)",
        "",
        "---",
        f"*Wygenerowano automatycznie — Kompas Seniora ({today})*",
    ]
    return "\n".join(lines)


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    today = datetime.date.today().strftime("%d.%m.%Y")
    print(f"=== Monitor GUS BDL — emerytury — {today} ===")
    print(f"Repo: {REPO} | Force: {FORCE_CHECK} | API key: {'tak' if API_KEY else 'nie'}")
    print()

    # 1. Sprawdź API
    print("Sprawdzam najnowszy rok w GUS BDL...")
    try:
        api_year, api_values = fetch_latest_year_api()
    except Exception as exc:
        print(f"Błąd API: {exc}")
        sys.exit(1)

    print(f"  API: najnowszy rok = {api_year} ({len(api_values)} województw)")
    print(f"  Małopolskie {api_year}: {api_values.get('MAŁOPOLSKIE', 'brak'):,.0f} zł")

    # 2. Sprawdź lokalny CSV
    local_year = latest_year_local()
    print(f"  CSV lokalny: najnowszy rok = {local_year}")

    # 3. Porównaj
    is_new = api_year > local_year
    print()
    if is_new:
        print(f"✅ Nowy rok danych: {api_year} (poprzednio {local_year})")
    else:
        print(f"Brak nowych danych (API={api_year} == lokalny={local_year})")
        if not FORCE_CHECK:
            print("Kończę bez Issue.")
            sys.exit(0)
        print("FORCE_CHECK=true — kontynuuję mimo braku zmian.")

    # 4. Sprawdź duplikat Issue
    title = f"✅ GUS BDL: nowe dane emerytur za rok {api_year}"
    print(f"Sprawdzam czy Issue '{title}' już istnieje...")
    if has_open_issue(title):
        print("Issue już istnieje — nie tworzę duplikatu. Koniec.")
        sys.exit(0)

    # 5. Utwórz Issue
    body = build_body(api_year, api_values, local_year)
    print("Tworzę GitHub Issue...")
    issue_url = create_issue(title, body)

    if issue_url:
        print(f"\nGotowe! Issue: {issue_url}")
    else:
        print("\nIssue nie zostało utworzone.")
        sys.exit(1)


if __name__ == "__main__":
    main()
