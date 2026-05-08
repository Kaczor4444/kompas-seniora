# SESSION NOTES - 2026-05-08

## ✅ SESJA #12: Synchronizacja bazy DPS z wykazem PDF + Monitor automatyczny

### Co zrobiliśmy:

#### 1. Porównanie bazy z wykazem DPS Małopolska (27.03.2026)
- PDF: 91 placówek | Baza przed: 89 placówek
- **Brakujące:** l.p. 39 (Skrzydlna), l.p. 57 (Mogilno) → dodane ręcznie przez użytkownika
- **Błędy nazw (3):** naprawione automatycznie
  - l.p. 9: `DomDom` → `Dom`
  - l.p. 17: błędna nazwa (adres urzędu) → prawidłowa nazwa DPS
  - l.p. 62: brak spacji `SpołecznejBraci` → `Społecznej Braci`
- **Wynik końcowy:** 91/91 zgodnych ✅

#### 2. DPS bez ceny — logika "bez zlecenia"
- l.p. 39 Skrzydlna: prowadzony przez stowarzyszenie bez zlecenia samorządu
- l.p. 57 Mogilno: prowadzony przez osobę fizyczną
- Oba: `koszt_pobytu = null`, `data_zrodla_cena = 2026`, `notatki` z podstawą prawną (art. 60 ust. 2)

#### 3. Fix wyświetlania ceny na frontendzie
- **Przed:** `null` → "NFZ" (błędne!)
- **Po:** 3 stany:
  - DPS z ceną → `4 500 zł / mies.`
  - DPS bez ceny (null) → `Zapytaj` (szary)
  - ŚDS (zawsze null) → `Bezpłatne` (zielony)
- Pliki: `FacilityCard.tsx`, `SearchResults.tsx`

#### 4. Dodatkowe porównanie: telefony, emaile, profile, miejsca
- **Profil — 4 uszkodzone rekordy** (wartości "F", "E", "C", "A") → naprawione
- **Telefony — 7 rozbieżności** → zaktualizowane z PDF
- **Emaile — 15 rozbieżności** → zaktualizowane z PDF
- **Miejsca — 1 rozbieżność** (l.p. 82: 72→70) → naprawione

#### 5. GitHub Actions — automatyczny monitor PDF
- Workflow: `.github/workflows/dps-pdf-monitor.yml`
  - Cron: 1. każdego miesiąca o 8:00 UTC
  - `workflow_dispatch` do ręcznego odpalenia
  - Pobiera PDF, porównuje z bazą, tworzy GitHub Issue z raportem
- Skrypt: `scripts/monitor-dps-pdf.py` (Python: pdfplumber + psycopg2)
- API: `/api/admin/trigger-pdf-check` — wyzwala workflow przez GitHub API
- Panel admina: przycisk "Sprawdź teraz" + checkbox "Wymuś porównanie"
- Wymaga: `GITHUB_PAT` w `.env` i Vercel, `DATABASE_URL` jako GitHub Secret

### Commity:
- `2be69bf` — fix: Poprawne wyświetlanie ceny (ŚDS/DPS null/DPS z ceną)
- `d6cd1da` — chore: Aktualizacja linków raw_dane + usunięcie advisor.png
- `3a510ac` — feat: Monitor DPS PDF (GitHub Actions + admin panel)

### Stan bazy po sesji:
- **DPS Małopolska:** 91 placówek (zsynchronizowane z wykazem 27.03.2026 ✅)
- **ŚDS:** 95 placówek (bez zmian)
- **Łącznie:** 186 placówek

---

# SESSION NOTES - 2026-03-18

## ✅ SESJA #10: Fix out-of-region detection - KOMPLETNY

### Problem z poprzedniej sesji:
- Warszawa (wieś w Małopolsce) pokazywała się jako stolica ❌
- Olsztyn na mapie nie był blokowany ❌
- Brak jasnego komunikatu dla usera

---

## Co zrobiliśmy dziś:

### 1. ✅ Blacklista 40+ stolic Polski

**Implementacja:**
- `app/search/page.tsx:8-17` - lista `CAPITAL_CITIES_BLACKLIST`
- 40+ największych miast Polski (Warszawa, Łódź, Wrocław, Poznań, Gdańsk, Olsztyn...)

**Logika:**
```typescript
if (CAPITAL_CITIES_BLACKLIST.includes(normalizedCity) && !powiat) {
  return { lat: 0, lng: 0, outOfRegion: true }; // Blokuj TYLKO bez kontekstu powiatu
}
```

**Kluczowa zmiana:** Blokuje TYLKO gdy user wpisał sam tekst (bez wyboru z autocomplete).
- ✅ "warszawa" + Enter → **blokowane** (brak powiatu = na pewno stolica)
- ✅ "warszawa" → wybór "Warszawa (część wsi)" z autocomplete → **dozwolone** (powiat znany)

---

### 2. ✅ Console.log w geocodeCity() - szczegółowe debugowanie

**Dodano logi:**
```typescript
🌍 GEOCODING: "Warszawa" (powiat: olkuski, woj: brak)
📍 Nominatim result: {
  display_name: "...",
  state: "województwo małopolskie",  // ← ODKRYLIŚMY PROBLEM!
  county: "powiat olkuski",
  ...
}
🔍 State check: "województwo małopolskie" → wytnij prefix → "małopolskie" → outOfRegion: false
```

---

### 3. ✅ FIX KRYTYCZNY: Normalizacja województwa

**Problem znaleziony:**
Nominatim zwraca `"województwo małopolskie"` (z prefixem), ale `ENABLED_VOIVODESHIPS = ['małopolskie']` (bez prefixu).

Porównanie:
- `"wojewodztwo malopolskie"` ≠ `"malopolskie"` → **ZAWSZE outOfRegion=true!** ❌

**Rozwiązanie:**
```typescript
// app/search/page.tsx:83-85
let stateName = state.toLowerCase().replace(/^województwo\s+/, ''); // Wytnij prefix
const normalizedState = normalizePolish(stateName);
```

**Wynik:**
- `"województwo małopolskie"` → wytnij → `"małopolskie"` → normalized → `"malopolskie"` ✅

---

### 4. ✅ NIE pokazuj searchCenter gdy outOfRegion=true

**Implementacja:**
```typescript
// app/search/page.tsx:668-669
const validSearchCenter = searchCenter && !searchCenter.outOfRegion ? searchCenter : null;
```

**Rezultat:**
- Olsztyn nie pokazuje pulsującego punktu na mapie ✅
- Warszawa (stolica) nie pokazuje punktu ✅

---

### 5. ✅ Oznaczenie RM=00 jako "(część wsi)" w autocomplete

**UI Update:**
```typescript
// src/components/search/SearchBar.tsx:72-79
{suggestion.rodzaj_miejscowosci === '00' && (
  <span className="text-slate-500 font-normal">
    {suggestion.parentLocationName
      ? ` (część wsi ${suggestion.parentLocationName})`
      : ' (część wsi)'}
  </span>
)}
```

**Bonus:**
- ★ dla miast (RM=96/98) - zielona gwiazdka emerald-600

---

### 6. ✅ Żółty banner ostrzegawczy dla części wsi o nazwie stolicy

**Implementacja:**
```typescript
// app/search/page.tsx:673-676
const isCapitalCity = CAPITAL_CITIES_BLACKLIST.includes(normalizedQuery);
const capitalCityWarning = isCapitalCity && powiatParam && sortedResults.length > 0
  ? { cityName: query, powiat: powiatParam }
  : undefined;
```

**UI:**
```
┌─────────────────────────────────────────────────┐
│ ⚠️  To nie stolica, tylko część wsi!            │
│                                                 │
│ Szukana miejscowość "Warszawa" to część wsi    │
│ w powiecie olkuskim, nie stolica Polski.       │
│ Stolica Warszawa nie znajduje się w            │
│ obsługiwanym regionie (Małopolska).            │
└─────────────────────────────────────────────────┘
```

- 🟡 Żółte tło (amber-50)
- 🔶 Pomarańczowa ramka (amber-300)
- ⚠️ Ikona ostrzeżenia
- 📝 Jasny komunikat wyjaśniający

**Lokalizacja:** `src/components/search/SearchResults.tsx:1023-1040`

---

### 7. ✅ Etykieta "(część wsi)" na pulsującym punkcie mapy

**Implementacja:**
```typescript
// components/FacilityMap.tsx:116-159
function createSearchCenterIcon(cityName: string, isPartOfVillage?: boolean) {
  const label = isPartOfVillage
    ? `${cityName}<br/><span style="font-size:8px;color:#92400e">(część wsi)</span>`
    : cityName;
  // ...
}
```

**Propagacja flagi:**
```typescript
// app/search/page.tsx:683
searchCenter: validSearchCenter ? {
  ...validSearchCenter,
  name: query,
  isPartOfVillage: isCapitalCity && !!powiatParam // ← Flaguj część wsi
} : undefined
```

**Wynik na mapie:**
```
┌────────────────┐
│   Warszawa     │
│ (część wsi)    │
└────────────────┘
```

---

## 🐛 Bugi naprawione (2 krytyczne):

### Bug #1: Blacklista blokowała za szeroko
**Było:** Blokuje "warszawa" ZAWSZE (nawet gdy user wybrał z autocomplete)
**Jest:** Blokuje TYLKO gdy brak kontekstu powiatu (user wpisał sam tekst)

### Bug #2: Normalizacja województwa
**Było:** Nominatim zwraca "województwo małopolskie" → porównanie z "małopolskie" → zawsze FALSE
**Jest:** Wycinamy prefix "województwo " przed porównaniem

---

## 📁 Zmienione pliki (4):

1. **`app/search/page.tsx`**
   - Dodano `CAPITAL_CITIES_BLACKLIST` (40+ stolic)
   - Blacklista z warunkiem `&& !powiat`
   - Console.log w `geocodeCity()`
   - Fix normalizacji: `.replace(/^województwo\s+/, '')`
   - `validSearchCenter` - blokada gdy outOfRegion=true
   - `capitalCityWarning` - wykrywanie części wsi o nazwie stolicy
   - `isPartOfVillage` - flaga do mapy

2. **`src/components/search/SearchResults.tsx`**
   - Nowy prop: `capitalCityWarning?: { cityName, powiat }`
   - Żółty banner ostrzegawczy (linie 1023-1040)
   - Aktualizacja typu `searchCenter` - dodano `isPartOfVillage?: boolean`

3. **`src/components/search/SearchBar.tsx`**
   - Oznaczenie RM=00 jako "(część wsi)" w UI (linie 72-79)
   - Bonus: ★ dla miast RM=96/98

4. **`components/FacilityMap.tsx`**
   - `createSearchCenterIcon()` - nowy parametr `isPartOfVillage`
   - Dwuliniowa etykieta: nazwa + "(część wsi)"
   - Propagacja `isPartOfVillage` przez `effectiveSearchCenter`
   - Aktualizacja typu `FacilityMapProps.searchCenter`

---

## 🧪 Testy wykonane:

### Test 1: Warszawa (część wsi) ✅
1. Wpisz "warszawa" → autocomplete pokazuje "Warszawa (część wsi)" - powiat olkuski
2. Wybierz z autocomplete → Kliknij Szukaj
3. **Rezultat:**
   - ✅ Żółty banner: "To nie stolica, tylko część wsi!"
   - ✅ Pulsujący punkt na mapie: "Warszawa<br/>(część wsi)"
   - ✅ Wyniki placówek z okolicy (0 placówek w samej wsi, ale pokazuje okoliczne)
   - ✅ Brak błędnego komunikatu "poza regionem"

### Test 2: Warszawa (stolica) - user NIE wybiera z autocomplete ✅
1. Wpisz "warszawa" → Kliknij Szukaj BEZ wyboru
2. **Rezultat:**
   - ✅ Komunikat: "Miejscowość poza obsługiwanym regionem"
   - ✅ Brak pulsującego punktu na mapie
   - ✅ Blacklista zadziałała

### Test 3: Olsztyn na mapie ✅
1. Widok mapy → wpisz "olsztyn" → Kliknij Szukaj
2. **Rezultat:**
   - ✅ Komunikat: "Miejscowość poza obsługiwanym regionem"
   - ✅ Mapa zostaje na Małopolsce (NIE przeskakuje do Olsztyna)
   - ✅ Brak pulsującego punktu
   - ✅ Blacklista + `woj=malopolskie` zadziałały

### Test 4: Kraków (normalny flow) ✅
1. Wpisz "kraków" → wybierz z autocomplete
2. **Rezultat:**
   - ✅ Lista placówek (44 placówki w powiecie krakowskim)
   - ✅ Pulsujący punkt na mapie: "Kraków" (bez "(część wsi)")
   - ✅ Brak żółtego bannera
   - ✅ Normalny wynik

---

## 📊 Statystyki:

- **Blacklista:** 40+ stolic Polski
- **Console.log:** 6 nowych logów w `geocodeCity()`
- **UX improvement:** 2 nowe komunikaty wizualne (banner + etykieta mapy)
- **Linijek kodu:** ~150 dodanych, ~20 zmienionych
- **Bugi naprawione:** 2 krytyczne (blacklista za szeroka + normalizacja województwa)

---

## 🎯 Rezultat:

**Wszystkie 3 scenariusze działają poprawnie:**
1. ✅ Stolice Polski (Warszawa, Olsztyn...) - blokowane
2. ✅ Części wsi o nazwie stolicy (Warszawa w olkuskim) - dozwolone + komunikaty wyjaśniające
3. ✅ Normalne miejscowości (Kraków) - działają bez zmian

**User experience:**
- Jasne komunikaty dlaczego coś nie działa
- Wyjaśnienie różnicy między stolicą a częścią wsi
- Wizualne oznaczenia na mapie i w wynikach

---

## 📝 TODO na przyszłość:

- [ ] Usunąć console.log z produkcji (gdy debugging zakończony)
- [ ] Rozważyć dodanie więcej miast do blacklisty (miasta wojewódzkie poza obsługiwanym regionem)
- [ ] Monitoring: jak często users szukają stolic spoza regionu? (analytics)

---

## Commity z tej sesji:

(Do stworzenia)

---

## Stan projektu:

- **Baza:** PostgreSQL (Neon), 184 placówki (89 DPS + 95 ŚDS)
- **Województwa:** tylko Małopolskie (+ 4 Śląskie w bazie)
- **TERYT:** 13,831 lokalizacji (wszystkie miejscowości Małopolski, w tym RM=00)
- **Branch:** main
- **Ostatni commit:** (pending)
- **Status:** Out-of-region detection w pełni działa ✅
1