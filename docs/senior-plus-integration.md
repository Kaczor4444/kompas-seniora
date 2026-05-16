# Ośrodki Senior+ — dokumentacja integracji

> Dodane: 2026-05-16 (commit `2991097`)

## Czym są ośrodki Senior+?

Program **Senior+** (dawniej "Senior-WIGOR") to program Ministerstwa Rodziny finansujący dwa typy placówek dziennego wsparcia dla seniorów:

- **Klub Senior+** — aktywizacja, zajęcia grupowe, rekreacja (~4h/dzień)
- **Dzienny Dom Senior+** — pełne wsparcie dzienne (~8h/dzień), posiłki, zajęcia

**Kluczowe różnice vs DPS/ŚDS:**
- Bezpłatne dla uczestników (finansowane gminowo + dotacja MRiPS)
- Nie wymagają skierowania ani decyzji MOPS
- Prowadzone przez gminy/powiaty (JST), nie przez ROPS
- Dane: `koszt_pobytu = NULL`, `profil_opieki = NULL`

---

## Źródło danych i monitoring

**URL XLSX:**
```
https://www.malopolska.uw.gov.pl/Docs/Wykaz%20funkcjonuj%C4%85cych%20o%C5%9Brodk%C3%B3w%20Senior%20w%20Ma%C5%82opolsce.xlsx
```

**Jak często aktualizowane:** nieregularnie, zwykle kilka razy w roku.

**Monitoring:**
- GitHub Action: `.github/workflows/senior-plus-monitor.yml`
- Harmonogram: 1. każdego miesiąca, 9:30 UTC
- Skrypt: `scripts/monitor-senior-plus.py`
- Logi: `raw_dane/malopolskie/senior_plus_log.md`

**Ręczny import:**
```bash
export $(grep -v '^#' .env | xargs)
python3 scripts/import-senior-plus.py
```

**Wymuszony check przez GitHub Actions UI:**
→ Actions → Monitor ośrodków Senior+ → Run workflow → Force = true

---

## Model bazy danych

Ośrodki Senior+ są w tej samej tabeli `Placowka` co DPS i ŚDS.

```sql
SELECT * FROM "Placowka"
WHERE typ_placowki IN ('Klub Senior+', 'Dzienny Dom Senior+')
ORDER BY miejscowosc;
```

**Pola specyficzne dla Senior+:**
```sql
rok_powstania  INT           -- rok otwarcia ośrodka
jst_nazwa      VARCHAR       -- np. "Gmina Andrychów", "Powiat Bocheński"
```

**Pola zawsze NULL dla Senior+:**
```sql
koszt_pobytu   -- Senior+ są bezpłatne
profil_opieki  -- brak profili opieki (A/B/C/D)
oficjalne_id   -- brak w wykazie PDF DPS
nazwa_oficjalna
```

---

## Integracja z wyszukiwarką

### URL params
| Typ | Param URL |
|-----|-----------|
| Klub Senior+ | `?type=klub-senior` |
| Dzienny Dom Senior+ | `?type=dzienny-dom-senior` |

### Filtry
- Typ chips w SearchBar i SearchResults: 5 opcji (Wszystkie / DPS / ŚDS / Klub Senior+ / DD Senior+)
- Filtr ceny ukryty gdy Senior+ wybrany (bezpłatne)
- Filtr profili opieki: pokazywany (puste dla Senior+, ale UI nie psuje się)

### Mapa
- Kolor pinezki: **amber/złoty (#f59e0b)** — odróżnia od DPS (zielony) i ŚDS (granatowy)
- Badge w popupie: amber tło (#fef3c7), ciemnobrązowy tekst (#92400e)

---

## Znane ograniczenia

### 1. Powiat ≠ powiat administracyjny
Pole `powiat` jest wypełnione nazwą JST bez prefiksu, np. "Andrychów" zamiast "wadowicki".

**Skutek:** Klik w powiat "wadowicki" na mapie Małopolski nie pokaże Senior+ z Andrychowa.

**Workaround tymczasowy:** Wyszukiwanie po nazwie miejscowości działa poprawnie.

**Docelowe rozwiązanie:**
```sql
-- Przykładowe mapowanie (do uzupełnienia):
UPDATE "Placowka" SET powiat = 'wadowicki'
WHERE typ_placowki IN ('Klub Senior+', 'Dzienny Dom Senior+')
AND jst_nazwa = 'Gmina Andrychów';
```

### 2. Brak w TERYT autocomplete
Autocomplete TERYT (`/api/teryt/suggest`) działa na tabeli `TerytLocation`, nie na `Placowka`. Wyszukiwanie Senior+ działa tylko przez podanie nazwy miejscowości (która musi istnieć w TERYT).

### 3. GitHub Action wymaga secretu
Secret `DATABASE_URL` musi być dodany w:
GitHub → Settings → Secrets and variables → Actions → New repository secret

---

## Karta placówki Senior+ (TODO)

W `/app/placowka/[id]/page.tsx` brakuje wyświetlania pól specyficznych dla Senior+:
- `rok_powstania` — "Działa od: 2019"
- `jst_nazwa` — "Prowadzi: Gmina Andrychów"

Te pola są dostępne przez `PUBLIC_PLACOWKA_SELECT` (dodane w tej sesji).
