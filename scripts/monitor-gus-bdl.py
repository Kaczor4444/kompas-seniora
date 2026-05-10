#!/usr/bin/env python3
"""
Monitor GUS BDL — sprawdza czy dane za rok 2025 dla zmiennej
"wiek poprodukcyjny" (72293) per powiat w Małopolsce są już dostępne.

Harmonogram: 1. każdego miesiąca o 9:00 UTC.
- Gdy dane dostępne (≥15/22 powiatów ma val > 0): tworzy GitHub Issue.
- Gdy dane niedostępne: kończy cicho (brak spamu).
- Gdy Issue z tym tytułem już istnieje (open): nie tworzy duplikatu.
- Gdy błąd sieciowy: jeden retry, potem loguje i kończy z kodem 1.

Zmienne środowiskowe:
  GITHUB_TOKEN      — token GitHub (dostępny automatycznie w Actions)
  GITHUB_REPO       — "owner/repo" (domyślnie: Kaczor4444/kompas-seniora)
  GUS_BDL_KEY       — opcjonalny klucz API GUS (zwiększa limit zapytań)
  FORCE_CHECK       — "true" → tworzy Issue nawet jeśli próg nieosiągnięty
"""

import os
import sys
import datetime
import time
import requests

# ── konfiguracja ─────────────────────────────────────────────────────────────

BASE_URL       = "https://bdl.stat.gov.pl/api/v1"
VARIABLE_ID    = 72293          # Ludność w wieku poprodukcyjnym ogółem
MALOPOLSKA_ID  = "011200000000"
TARGET_YEAR    = "2025"
MIN_POWIATS    = 15             # Minimalna liczba powiatów z val > 0 → dane dostępne

REPO          = os.environ.get("GITHUB_REPO", os.environ.get("GITHUB_REPOSITORY", "Kaczor4444/kompas-seniora"))
GITHUB_TOKEN  = os.environ.get("GITHUB_TOKEN", "")
API_KEY       = os.environ.get("GUS_BDL_KEY", "")
FORCE_CHECK   = os.environ.get("FORCE_CHECK", "false").lower() == "true"

ISSUE_TITLE   = f"✅ GUS BDL: dane {TARGET_YEAR} dostępne — wiek poprodukcyjny Małopolska"

# Etykiety muszą istnieć w repo; jeśli nie → GitHub zwróci 422.
# Tworzymy tylko znane etykiety: "data-monitoring" (jak inne monitory).
# "gus-data" i "data-update" dodaj ręcznie w repo jeśli potrzebne.
ISSUE_LABELS  = ["data-monitoring", "gus-data", "data-update"]


# ── helpers ──────────────────────────────────────────────────────────────────

def gus_headers() -> dict:
    h = {"Accept": "application/json"}
    if API_KEY:
        h["X-ClientId"] = API_KEY
    return h


def fetch_with_retry(url: str, params: dict, timeout: int = 30) -> dict:
    """Odpytuje API GUS — jeden retry po 5 s przy błędzie sieciowym."""
    for attempt in (1, 2):
        try:
            r = requests.get(url, params=params, headers=gus_headers(), timeout=timeout)
            r.raise_for_status()
            return r.json()
        except requests.RequestException as exc:
            if attempt == 1:
                print(f"  Próba {attempt} nieudana: {exc} — retry za 5 s...")
                time.sleep(5)
            else:
                raise


def fetch_variable_data(variable_id: int, year: str) -> list:
    """Zwraca listę wyników dla zmiennej per powiat w Małopolsce."""
    url = f"{BASE_URL}/data/by-variable/{variable_id}"
    params = {
        "unit-level":    5,
        "unit-parentId": MALOPOLSKA_ID,
        "year":          year,
        "page-size":     30,
        "format":        "json",
    }
    data = fetch_with_retry(url, params)
    return data.get("results", [])


def has_open_issue(title: str) -> bool:
    """Sprawdza czy GitHub ma już otwarte Issue z podanym tytułem."""
    if not GITHUB_TOKEN:
        return False
    r = requests.get(
        f"https://api.github.com/repos/{REPO}/issues",
        headers={
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept":        "application/vnd.github+json",
        },
        params={"state": "open", "per_page": 50},
        timeout=15,
    )
    if not r.ok:
        print(f"  Ostrzeżenie: nie można sprawdzić listy Issues ({r.status_code})")
        return False
    issues = r.json()
    return any(i["title"] == title for i in issues)


def create_github_issue(title: str, body: str) -> str | None:
    if not GITHUB_TOKEN:
        print("Brak GITHUB_TOKEN — pomijam tworzenie Issue")
        return None
    r = requests.post(
        f"https://api.github.com/repos/{REPO}/issues",
        headers={
            "Authorization": f"Bearer {GITHUB_TOKEN}",
            "Accept":        "application/vnd.github+json",
        },
        json={"title": title, "body": body, "labels": ISSUE_LABELS},
        timeout=15,
    )
    if not r.ok:
        # Może się nie udać jeśli labele nie istnieją — spróbuj bez etykiet
        if r.status_code == 422:
            print(f"  Uwaga: labele mogą nie istnieć ({r.status_code}) — próba bez etykiet...")
            r = requests.post(
                f"https://api.github.com/repos/{REPO}/issues",
                headers={
                    "Authorization": f"Bearer {GITHUB_TOKEN}",
                    "Accept":        "application/vnd.github+json",
                },
                json={"title": title, "body": body},
                timeout=15,
            )
        if not r.ok:
            print(f"Błąd tworzenia Issue: {r.status_code} {r.text}")
            return None

    url = r.json()["html_url"]
    print(f"Issue utworzone: {url}")
    return url


def build_issue_body(powiats_with_data: list, powiats_missing: list) -> str:
    today       = datetime.date.today().strftime("%d.%m.%Y")
    now_utc     = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M UTC")
    total_found = len(powiats_with_data)
    api_url     = (
        f"https://bdl.stat.gov.pl/api/v1/data/by-variable/{VARIABLE_ID}"
        f"?unit-level=5&unit-parentId={MALOPOLSKA_ID}&year={TARGET_YEAR}"
        f"&page-size=30&format=json"
    )
    fetch_script = "python scripts/fetch-gus-bdl.py"

    lines = [
        f"# GUS BDL — dane {TARGET_YEAR} dostępne!",
        "",
        f"Sprawdzono: **{today}** o **{now_utc}**",
        "",
        f"Zmienna **{VARIABLE_ID}** (Ludność w wieku poprodukcyjnym ogółem) "
        f"ma dane za rok **{TARGET_YEAR}** dla **{total_found}** powiatów Małopolski.",
        "",
        "## Powiaty z danymi",
        "",
        "| Powiat | ID TERYT | Wartość |",
        "|--------|----------|---------|",
    ]
    for p in sorted(powiats_with_data, key=lambda x: x["name"]):
        lines.append(f"| {p['name']} | `{p['id']}` | {p['val']:,} |")

    if powiats_missing:
        lines += [
            "",
            f"## Powiaty bez danych ({len(powiats_missing)})",
            "",
        ]
        for p in sorted(powiats_missing, key=lambda x: x["name"]):
            lines.append(f"- {p['name']} (`{p['id']}`)")

    lines += [
        "",
        "## Co dalej",
        "",
        f"1. Uruchom skrypt pobierania: `{fetch_script}`",
        f"2. Lub pobierz przez API: [{api_url}]({api_url})",
        "3. Zaktualizuj plik `data/gus_populacja_malopolska.csv` z nowymi danymi",
        "4. Zamknij to Issue po zaimportowaniu danych.",
        "",
        "---",
        f"*Wygenerowano automatycznie przez GitHub Actions / Kompas Seniora ({today})*",
    ]
    return "\n".join(lines)


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    today   = datetime.date.today().strftime("%d.%m.%Y")
    now_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M UTC")

    print(f"=== GUS BDL Monitor — {today} {now_utc} ===")
    print(f"Sprawdzam dane za rok {TARGET_YEAR} (zmienna {VARIABLE_ID}) per powiat Małopolska...")
    print(f"Repo: {REPO} | Force: {FORCE_CHECK} | API key: {'tak' if API_KEY else 'nie'}")
    print()

    # Pobierz dane
    try:
        results = fetch_variable_data(VARIABLE_ID, TARGET_YEAR)
    except requests.RequestException as exc:
        print(f"Błąd sieciowy po 2 próbach: {exc}")
        sys.exit(1)

    print(f"API zwróciło {len(results)} powiatów")

    # Przeanalizuj wyniki
    powiats_with_data: list[dict] = []
    powiats_missing:   list[dict] = []

    for unit in results:
        uid   = unit.get("id", "")
        name  = unit.get("name", uid)
        vals  = unit.get("values", [])

        # Filtruj tylko Małopolskę (ID zaczyna się od "01121")
        if not uid.startswith("01121"):
            continue

        # Szukaj wartości za TARGET_YEAR z attrId=1 i val > 0
        real_val = None
        for v in vals:
            if str(v.get("year")) == TARGET_YEAR and v.get("attrId") == 1 and (v.get("val") or 0) > 0:
                real_val = v["val"]
                break

        if real_val is not None:
            powiats_with_data.append({"id": uid, "name": name, "val": real_val})
            print(f"  ✅ {name}: {real_val:,}")
        else:
            powiats_missing.append({"id": uid, "name": name})
            print(f"  ❌ {name}: brak danych")

    total_found = len(powiats_with_data)
    total_all   = total_found + len(powiats_missing)

    print()
    print(f"Wynik: {total_found}/{total_all} powiatów ma dane za {TARGET_YEAR}")
    print(f"Próg: {MIN_POWIATS} powiatów wymaganych")

    # Decyzja
    data_ready = total_found >= MIN_POWIATS

    if not data_ready and not FORCE_CHECK:
        print(f"Dane NIE są jeszcze dostępne ({total_found} < {MIN_POWIATS}) — kończę bez Issue.")
        sys.exit(0)

    if FORCE_CHECK and not data_ready:
        print(f"FORCE_CHECK=true — tworzę Issue mimo niewystarczającej liczby powiatów ({total_found}).")

    # Sprawdź duplikat
    print(f"Sprawdzam czy Issue '{ISSUE_TITLE}' już istnieje...")
    if has_open_issue(ISSUE_TITLE):
        print("Issue już istnieje (open) — nie tworzę duplikatu. Koniec.")
        sys.exit(0)

    # Utwórz Issue
    body = build_issue_body(powiats_with_data, powiats_missing)
    print("Tworzę GitHub Issue...")
    issue_url = create_github_issue(ISSUE_TITLE, body)

    if issue_url:
        print(f"\nGotowe! Issue: {issue_url}")
    else:
        print("\nIssue nie zostało utworzone (brak tokenu lub błąd API).")
        sys.exit(1)


if __name__ == "__main__":
    main()
