# Sesja #17: Ośrodki Senior+ — pełna integracja
**Data:** 16 maja 2026  
**Branch:** main  
**Commit:** `2991097`

---

## Cel sesji

Dodanie nowej kategorii placówek — **Klub Senior+** i **Dzienny Dom Senior+** — z pliku XLSX opublikowanego przez MUW Małopolska, wraz z pełną integracją z bazą danych, wyszukiwarką, mapą i panelem admina. Konfiguracja automatycznego monitoringu miesięcznego przez GitHub Actions.

---

## Źródło danych

**URL:** `https://www.malopolska.uw.gov.pl/Docs/Wykaz%20funkcjonuj%C4%85cych%20o%C5%9Brodk%C3%B3w%20Senior%20w%20Ma%C5%82opolsce.xlsx`

**Struktura XLSX (arkusz "Senior"):**
| Kolumna | Pole DB |
|---------|---------|
| Lp. | *(indeks)* |
| Rodzaj ośrodka wsparcia | `typ_placowki` |
| Liczba miejsc | `liczba_miejsc` |
| Nazwa JST | `jst_nazwa` |
| Województwo | `wojewodztwo` |
| Adres | `ulica` |
| Kod | `kod_pocztowy` |
| Miejscowość | `miejscowosc` |
| Telefon | `telefon` |
| Email | `email` |
| Rok powstania | `rok_powstania` |

---

## Zmiany w projekcie

### 1. Schemat bazy danych (`prisma/schema.prisma`)

Dodano do modelu `Placowka`:
```prisma
rok_powstania  Int?     // Rok powstania ośrodka Senior+
jst_nazwa      String?  // JST prowadząca (np. "Gmina Andrychów")
```

Zastosowano przez `npx prisma db push` (nie `migrate dev` z powodu drift z Neon).

### 2. Import danych (`scripts/import-senior-plus.py`)

- Pobiera XLSX z MUW (requests + openpyxl)
- Geokoduje każdy adres przez Nominatim OSM (1.2s opóźnienie = polityka rate limit)
- Upsertuje do tabeli `Placowka` (sprawdza duplikaty po typ+miejscowosc+ulica)
- 107 rekordów, 100% geolokalizacja
- Uruchomiony jednorazowo: `export $(grep -v '^#' .env | xargs) && python3 scripts/import-senior-plus.py`

**Wynik:** 107 nowych rekordów, 0 aktualizacji

### 3. Monitor miesięczny (`scripts/monitor-senior-plus.py`)

Wzorzec identyczny z `monitor-wolne-miejsca.py`:
- Sprawdza SHA256 hash pliku XLSX (pierwsze 12 znaków)
- Gdy hash zmieniony: parsuje, upsertuje do bazy, tworzy GitHub Issue z raportem
- Gdy brak zmian: kończy bez akcji
- Zapisuje hash do `raw_dane/malopolskie/.senior_plus_hash`
- Loguje do `raw_dane/malopolskie/senior_plus_log.md`

### 4. GitHub Action (`.github/workflows/senior-plus-monitor.yml`)

```yaml
schedule:
  - cron: '30 9 1 * *'   # 1. każdego miesiąca, 9:30 UTC
```

Wymaga secretu `DATABASE_URL` w GitHub Repo Settings → Secrets → Actions.
**⚠️ Secret jeszcze nie dodany! Cron działa ale nie importuje do bazy.**

### 5. UI — SearchBar (`src/components/search/SearchBar.tsx`)

Nowy typ `PlacowkaType` + stała mapowania URL:
```typescript
type PlacowkaType = 'DPS' | 'ŚDS' | 'Klub Senior+' | 'Dzienny Dom Senior+' | 'Wszystkie';
const TYPE_TO_URL: Record<PlacowkaType, string> = {
  'DPS': 'dps', 'ŚDS': 'sds',
  'Klub Senior+': 'klub-senior', 'Dzienny Dom Senior+': 'dzienny-dom-senior', 'Wszystkie': '',
};
```

Nowe chipsy obok DPS/ŚDS: `"Klub Senior+"` (sub: "Aktywność") i `"DD Senior+"` (sub: "Dzienny").

### 6. UI — SearchResults (`src/components/search/SearchResults.tsx`)

- Inicjalizacja stanu z URL params:
  - `type=klub-senior` → `selectedType = 'Klub Senior+'`
  - `type=dzienny-dom-senior` → `selectedType = 'Dzienny Dom Senior+'`
- Dwa zestawy type chips (desktop sidebar + mobile) rozszerzone do 5 opcji z `flex-wrap`
- Filtr ceny ukryty dla Senior+ (bezpłatne): `selectedType !== 'ŚDS' && selectedType !== 'Klub Senior+' && ...`
- Kategoria karty placówki: fallback do `fac.typ_placowki` dla nowych typów

### 7. Mapa (`components/FacilityMap.tsx`)

```typescript
const seniorPlusIcon = createPinIcon('#f59e0b', 'map-pin-senior-plus'); // amber/gold
```

Badge w popupie: amber (`#fef3c7` / `#92400e`) zamiast zielonego/niebieskiego.

### 8. Panel admina (`app/admin/placowki/page.tsx`)

- Dropdown "Typ placówki" rozszerzony o Senior+ opcje
- Badge: emerald zamiast purple dla typów innych niż DPS/ŚDS

### 9. Public fields (`lib/public-placowka-fields.ts`)

Dodano `rok_powstania: true` i `jst_nazwa: true` do `PUBLIC_PLACOWKA_SELECT`.

---

## Stan bazy po sesji

| Typ | Liczba |
|-----|--------|
| DPS | 95 |
| ŚDS | 97 |
| Klub Senior+ | 79 |
| Dzienny Dom Senior+ | 28 |
| **ŁĄCZNIE** | **299** |

---

## Znane problemy / do poprawy

### Powiat Senior+ ≠ powiat administracyjny
Pole `powiat` dla Senior+ jest wypełnione nazwą JST (np. "Andrychów") zamiast nazwy powiatu administracyjnego (np. "wadowicki"). Wynika to z funkcji `get_powiat_from_jst()` w skrypcie importu, która wyciąga tylko nazwę gminy z JST.

**Skutek:** Wyszukiwarka filtrująca po powiecie nie znajdzie Senior+ przez klik z mapy Małopolski.

**Rozwiązanie:** Stworzyć słownik `gmina → powiat` lub użyć TERYT API. Można to naprawić w następnej sesji ręcznym SQL UPDATE lub rozszerzonym skryptem.

### GitHub Action bez DATABASE_URL
Secret `DATABASE_URL` nie jest dodany w repo GitHub. Cron uruchomi monitor ale nie zaimportuje nowych danych do bazy Neon.

**Rozwiązanie:** GitHub Repo → Settings → Secrets and variables → Actions → New repository secret → `DATABASE_URL` = wartość z `.env`.

---

## Następne kroki powiązane z Senior+

- [ ] Naprawić pole `powiat` dla 107 Senior+ rekordów (mapowanie JST → powiat)
- [ ] Dodać `DATABASE_URL` secret w GitHub
- [ ] Karta placówki `/app/placowka/[id]/page.tsx` — wyświetlać `rok_powstania` i `jst_nazwa`
- [ ] Autocomplete TERYT (`/api/teryt/suggest`) — sprawdzić czy Senior+ pojawiają się przy wyszukiwaniu miejscowości
