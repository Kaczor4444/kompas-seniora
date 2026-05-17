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

- [x] Naprawić pole `powiat` dla 107 Senior+ rekordów — DONE (commit e4e77a2, skrypt `fix-senior-plus-powiat.js`)
- [x] Karta placówki — wyświetlać `rok_powstania` i `jst_nazwa` — DONE (sesja #18, PlacowkaDetails)
- [ ] Dodać `DATABASE_URL` secret w GitHub

---

## 🏙️ INSIGHT: MDDPS Kraków — do dyskusji w przyszłej sesji

**Problem odkryty:** Kraków nie ma żadnego rekordu `Dzienny Dom Senior+` w bazie — ale to nie luka danych, tylko świadoma decyzja miasta.

**Stan faktyczny:**
- Gmina miejska Kraków **nie aplikowała do programu MRPiPS Senior+** (dotacje dla gmin)
- Zamiast tego zbudowała własną sieć **6 Miejskich Dziennych Domów Pomocy Społecznej (MDDPS)**, finansowanych z budżetu miasta
- MDDPS funkcjonalnie = DD Senior+, ale inny organ finansujący i inna nazwa

**6 MDDPS w Krakowie:**
| Dom | Adres | Tel |
|-----|-------|-----|
| Nr 1 "Socius" | ul. Jana Sas-Zubrzyckiego 10 | 12 655 21 76 |
| Nr 2 | ul. ks. W. Gurgacza 5 | 12 411 00 50 |
| Nr 3 | ul. Korczaka 4 | 12 416 15 60 |
| Nr 4 | ul. Sudolska 7a | 12 412 62 34 |
| Nr 5 | ul. Nad Sudołem 32 | 12 415 54 14 |
| Nr 6 (CKiRS) | os. Szkolne 20 | 12 644 20 52 |

Kontakt ogólny: sekretariat@mddps.krakow.pl  
Źródło: https://mops.krakow.pl/262772,artykul,nasze-domy---mddps-w-krakowie.html

**Pytania do decyzji:**
1. Czy dodać MDDPS do bazy jako nowy typ (`typ_placowki = 'MDDPS'` lub `'Dzienny Dom'`)?
2. Czy Tarnów, Nowy Sącz też mają własne miejskie odpowiedniki poza programem MRPiPS?
3. Jak monitorować zmiany? BIP Kraków (`bip.krakow.pl/?dok_id=78643`) — **DA SIĘ monitorować**:
   - Strona server-side (SSR) — działa `requests` + `BeautifulSoup`, bez JS
   - **Najlepszy sygnał:** `bip.krakow.pl/?dok_id=78643&vReg=1` — dziennik zmian z dokładną datą edycji
   - Ostatnia zmiana: **2023-03-20** (ponad 2 lata temu — nie pali się)
   - Na stronie: 17 publicznych MDDPS (6 domów + 11 klubów) + 5 niepublicznych
4. Ewentualny GitHub Action scraper (podobny do `senior-plus-monitor.yml`):
   - Sprawdza datę w `?vReg=1`, porównuje z zapisaną
   - Gdy zmiana → tworzy GitHub Issue z komunikatem do ręcznej weryfikacji

**Sesja #18:** Dodano notatkę w opisie kafelka DD Senior+ na stronie głównej że duże miasta mogą mieć własne odpowiedniki poza programem MRPiPS. Zaimportowano 16 placówek MDDPS Kraków do bazy (sesja #18, skrypt `scripts/import-mddps-krakow.py`).

**Weryfikacja Klub Senior+ Kraków (sesja #18):**
- W bazie: **1 Klub Senior+** przy ul. Krowoderskich Zuchów 6 (z wykazu MUW, program MRPiPS)
- Na BIP Kraków: **11 Klubów Samopomocy MDDPS** (zupełnie inne placówki, budżet miasta)
- **Brak nakładania** — to dwa odrębne systemy, żaden z 11 MDDPS-owych nie pokrywa się z naszym rekordem
- Kraków konsekwentnie buduje własną infrastrukturę zamiast korzystać z dotacji MRPiPS
- [ ] Autocomplete TERYT (`/api/teryt/suggest`) — sprawdzić czy Senior+ pojawiają się przy wyszukiwaniu miejscowości
