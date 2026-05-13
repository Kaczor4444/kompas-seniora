# Sesja #15: UX kalkulatora + geolokalizacja + treści
**Data:** 13 maja 2026
**Branch:** main
**Commity sesji:** `7c279c8` → `740155f`

---

## ✅ Co osiągnęliśmy

### 1. Redesign nagłówka kalkulatora (commit `7c279c8`)

Stary tekst był dosłowną kopią ze stasik-kancelaria.pl (art. 61, kolejność zobowiązanych).

Nowy:
- H1: "Ile naprawdę zapłaci Twoja rodzina?" — pytanie z perspektywy rodziny
- Opis: wyjaśnia insight (cena DPS ≠ kwota z Twojego konta)
- 3-krokowy explainer: Senior płaci z emerytury → Rodzina dopłaca nadwyżkę → Gmina pokrywa resztę

### 2. Animowane liczniki (`20f9e8e`)

`AnimatedNumber` — custom hook z `requestAnimationFrame`, cubic ease-out, 350ms.
Startuje od aktualnej pozycji animacji (smooth przy szybkim wpisywaniu).
Zastosowane na: sumie łącznej + 4 wartościach wynikowych.

**Bug fix** (`967f91f`): key `"Dzieci (×2)"` zmieniał się z `nKids` → React niszczył komponent zamiast animować. Naprawiono przez stabilny key `"dzieci"` oddzielony od etykiety.

### 3. Panel wyników — redesign od zera (`715444c`)

Zarzucono iPhone Calculator style (za podobny do stasik). Nowy układ — styl rachunku/faktury:
- 4 wiersze oddzielone `border-b` z kolorową kropką + etykieta + kwota
- Cienki pasek proporcji (szerokość = % udziału w koszcie, animowany 350ms)
- Suma **"Łącznie / mc"** na dole — odwrotnie niż stasik gdzie jest na górze

Usunięto:
- "Podział opłaty miesięcznej" — słowo w słowo ze stasik
- Disclaimer o WSA w Łodzi/Opolu — skopiowany ze stasik
- Zastąpiony: "Wynik orientacyjny. Ostateczną kwotę ustala MOPS/GOPS indywidualnie..."

### 4. Wskaźnik live — pulsująca kropka (`3ba8fa1`, `70f3bdf`)

Pulsująca kropka zamiast badge z tekstem:
- **Szara** na starcie (`slate-600`, bez animacji)
- **Zielona + `animate-ping`** po pierwszym wpisaniu (`hasInteracted` state)
- Wrapper `interact()` owinięty wokół wszystkich onChange formularza

### 5. Sortowanie DPS od najtańszej (`967f91f`)

Lista DPS po wyszukaniu sortuje od najtańszej ceny. Placówki bez ceny na końcu.

### 6. Geolokalizacja jako dropdown suggestion

**Kalkulator** (`7f0b479`): klik na pole miasta gdy puste → dropdown z "📍 Szukaj w mojej okolicy". Znika gdy zaczniesz pisać. Reverse geocoding Nominatim → wypełnia pole.

**SearchBar strona główna** (`4970441`): to samo — usunięto osobny przycisk "Namierz moją lokalizację". Teraz dropdown w inputcie. Ikona MapPin (nie Navigation).

**Asystent** (`c49b8b5`): to samo w kroku "Gdzie szukasz pomocy?" — wypełnia `answers.location`.

### 7. Treści — artykuły i FAQ (`740155f`)

**Nowy artykuł:** `content/articles/wybor-opieki/uslugi-opiekuncze.mdx`
- "Usługi opiekuńcze w domu 2026: jak dostać, ile kosztuje, kto decyduje"
- Największy gap vs gov.pl — wcześniej zero treści o opiece domowej jako alternatywie DPS
- Styl zgodny z `koszty-opieki.mdx` (wnioski, tabela, kroki, FAQ)
- Podstawa: art. 50 ups (isap.sejm.gov.pl) + świadczenie pielęgnacyjne 3 386 zł z linkiem gov.pl
- Dodano do `src/data/articles.ts`, badge: NOWE

**Aktualizacja `koszty-opieki.mdx`:**
- Nowe FAQ: świadczenie pielęgnacyjne 3 386 zł (2026)
- Link: `[Ministerstwo Rodziny — informacja o wysokości...](gov.pl)` — nie surowy URL

---

## 🔑 Wnioski i lekcje

1. **Stasik-kancelaria.pl** — przy portowaniu kalkulatora skopiowałem 3 elementy których nie powinienem: nagłówek sekcji, disclaimer o WSA, opis. Użytkownik musiał to wychwycić. Przy przyszłych inspiracjach zewnętrznymi źródłami — sprawdzać każdą frazę.

2. **FAQ rich results** martwe od 7 maja 2026 — FAQPage schema nadal użyteczna dla AI Overviews (3.2× szansa).

3. **Świadczenie pielęgnacyjne** — podałem błędną kwotę 3 287 zł, poprawna to 3 386 zł (2026). Użytkownik poprosił o weryfikację — potwierdzono przez gov.pl.

4. **Style guide** istnieje w `context/style-guide.md` — używać przy każdym artykule.

---

## 📁 Zmienione pliki

| Plik | Zmiana |
|------|--------|
| `app/kalkulator/page.tsx` | Nagłówek, animacje, panel wyników, geo dropdown |
| `src/components/search/SearchBar.tsx` | Geo dropdown zamiast osobnego przycisku |
| `src/components/asystent/SupportAssistant.tsx` | Geo dropdown w kroku lokalizacji |
| `content/articles/wybor-opieki/uslugi-opiekuncze.mdx` | Nowy artykuł |
| `content/articles/finanse-prawne/koszty-opieki.mdx` | FAQ świadczenie pielęgnacyjne |
| `src/data/articles.ts` | Nowy wpis uslugi-opiekuncze |
| `src/components/faq/faqData.ts` | 3 nowe pytania + 4 poprawki |

---

## 🚨 Do zrobienia w następnej sesji

### Nadal krytyczne (od sesji #12!)
- [ ] **SEO blokada**: `robots.txt` → `Allow: /`, `Disallow: /admin/` + `layout.tsx` → `index: true` + `sitemap.ts` dynamiczny. 30 min roboty, strona nadal niewidoczna dla Google.

### Treści
- [ ] Artykuł: mieszkania chronione i rodzinny dom pomocy (z gov.pl gap)
- [ ] Aktualizacja `dps-vs-sds.mdx` — dodać sekcję "Inne opcje przed DPS" (usługi opiekuńcze, mieszkania chronione)
- [ ] Sprawdzić `proces-przyjecia-dps.mdx` — czy kwoty i progi aktualne

### Kalkulator
- [ ] Mini-kalkulator na karcie placówki `/placowka/[id]`
- [ ] Przetestować geo na iOS Safari (różne zachowanie permissions)

---

## ➕ Uzupełnienie (wieczór 2026-05-13)

### GOPS/MOPS — weryfikacja i aktualizacja danych

**Bug w API `/api/mops`:** DB przechowuje znormalizowane nazwy bez polskich znaków (`myslenice`), API szukało z polskimi (`myślenice`). Naprawiono normalizację — Myślenice, Niepołomice itp. teraz działają.

**Zaktualizowano 6 rekordów ręcznie:**

| ID | Miejscowość | Co dodano |
|----|-------------|-----------|
| 187 | Alwernia | email, www, nowa nazwa (MGOPS → CUS), tel |
| 168 | Biały Dunajec | email, www (portal gminy), poprawiony tel |
| 99 | Biecz | email, www mgops.biecz.pl |
| 145 | Bolesław olkuski | email, www gminaboleslaw.pl |
| 97 | Bolesław dąbrowski | www BIP, email (Playwright!), poprawiony tel |
| 206 | Charsznica | email, www, pełny adres, verified |

**Eksport niekompletnych:** `data/mops_niekompletne_2026-05-13.csv` — 86 rekordów bez emaila lub www.

**Playwright — nowy insight:**

BIP-y (`bip.malopolska.pl`) renderują JS — `curl` daje pusty HTML. Playwright (headless Chromium) wykonuje JS i wyciąga treść. Przetestowano na GOPS Bolesław dąbrowski:
- `curl` → brak danych
- `Playwright` → `gops@boleslaw.com.pl` ✅

Pełna dokumentacja: `context/insights/web-scraping-playwright.md`

Zastosowania w projekcie:
1. Monitor GOPS/MOPS co miesiąc (planowane)
2. Auto-uzupełnianie 86 brakujących rekordów
3. Fallback dla monitora wolnych miejsc DPS jeśli MUW zmieni stronę

Ostatnia aktualizacja: 2026-05-13 (wieczór)

---

## ➕ Uzupełnienie 2 — baza DPS/ŚDS (sesja #15, część 3)

### Wykazy MUW — emaile + weryfikacja danych

**DPS — 89/89 z emailem ✅**
- Pobrano `wykaz dps.pdf` z malopolska.uw.gov.pl (Last-Modified 27.03.2026, stały URL)
- Uzupełniono 2 brakujące emaile: DPS Diana Kasina Wielka, DPS Muszyna
- oficjalne_id wypełnione dla wszystkich 89 → roczna aktualizacja przez l.p. bez fuzzy matching

**ŚDS — 97 rekordów, 92 z emailem**
- Stary XLS (2017): uzupełniono 7 emaili (Miłocice, Miechów, Raciechowice, Lubień, Pałecznica, Proszowice, Tarnów)
- Nowy XLSX 2026 (`Wykaz Środowiskowych domów samopomocy.xlsx`, Last-Modified 04.05.2026):
  - **Brak emaili** — format zmieniony na ePUAP/eDoręczenia
  - Cross-check telefonów → wykryto 3 błędy nazw w DB:
    - id=7: Dobroczyce → **Dobczyce** ✓
    - id=107: Mszana Górna → **Mszana Dolna** ✓
    - id=122: Rzepiennik Biskupi → **Rzepiennik Strzyżewski** ✓
  - Znaleziono 2 brakujące ŚDS → dodano do bazy:
    - **id=199** ŚDS Kossowa (gmina Brzeźnica, wadowicki), 30 miejsc, A/B/C/D
    - **id=200** ŚDS Wysowa-Zdrój (gmina Uście Gorlickie, gorlicki), 15 miejsc, A/C

**Stan końcowy bazy:**
- DPS: 89 rekordów, 89/89 emaili (100%)
- ŚDS: 97 rekordów, 92/97 emaili (95%)
- Pliki źródłowe: `data/wykaz_dps_malopolska_2026.pdf`, `data/wykaz_sds_malopolska.xls`, `data/wykaz_sds_malopolska_2026.xlsx`

**Commity sesji (część 3):** `267ca1e` → `82323e6` (push do main)

---

## 📋 GOPS/MOPS — 67 rekordów bez emaila do ręcznego sprawdzenia

Kolejność: zadzwoń lub wejdź na stronę gminy. Telefony są w bazie.

| ID | Miejscowość | Telefon |
|----|-------------|---------|
| 187 | Alwernia | 12 283 11 15 |
| 242 | Brzeźnica | 33 879 20 29 |
| 233 | Budzów | 33 876 77 52 |
| 234 | Bystra-Sidzina | 18 268 12 20 |
| 215 | Chełmiec | 18 440 46 27 |
| 221 | Czarny Dunajec | 18 544 72 89 |
| 182 | Czchów | 14 663 65 65 |
| 222 | Maniowy | 18 275 08 83 |
| 210 | Dobczyce | 12 372 17 14 |
| 189 | Dąbrowa Tarnowska | 14 642 29 15 |
| 183 | Wola Dębińska | 14 631 85 92 |
| 247 | Gdów | 12 251 48 32 |
| 224 | Nowy Targ (miasto) | 18 265 55 87 |
| 237 | Tarnów (gmina) | 14 688 01 54 |
| 184 | Gnojnik | 14 686 97 20 |
| 207 | Gołcza | 12 388 64 11 |
| 216 | Gródek nad Dunajcem | 18 440 10 96 |
| 198 | Wawrzeńczyce | 12 287 40 03 |
| 199 | Iwanowice | 12 388 41 22 |
| 185 | Iwkowa | 14 684 40 20 |
| 223 | Jabłonka | 18 261 11 47 |
| 203 | Kamienica | 18 332 30 67 |
| 230 | Koniusza | 12 386 90 32 |
| 231 | Koszyce | 41 351 40 48 |
| 208 | Kozłów | 41 384 10 33 |
| 243 | Lanckorona | 33 876 35 91 |
| 194 | Lipinki | 13 447 78 92 |
| 238 | Lisia Góra | 14 678 45 68 |
| 235 | Maków Podhalański | 33 877 15 54 |
| 196 | Moszczenica | 18 354-xx-xx |
| 190 | Mędrzechów | 14 644 24 23 |
| 218 | Nawojowa | 18 445 70 68 |
| 180 | Niegowić | — |
| 232 | Nowe Brzesko | 12 385 26 55 |
| 220 | Nowy Targ (gmina) | 18 266 25 93 |
| 191 | Olesno | 14 641 10 82 |
| 239 | Pleśna | 14 679 81 70 |
| 228 | Polanka Wielka | 33 848 80 19 |
| 229 | Przeciszów | 33 841 32 80 |
| 211 | Raciechowice | 12 372 52 11 |
| 192 | Radgoszcz | 14 641 46 60 |
| 197 | Ropa | 18 353 40 14 |
| 219 | Rytro | 18 448 64 64 |
| 240 | Rzepiennik Strzyżewski | 14 653 15 19 |
| 181 | Rzezawa | 14 685 85 55 |
| 212 | Siepraw | 12 372 18 25 |
| 201 | Skawina | 12 276 21 37 |
| 200 | Skała | 12 389 14 37 |
| 225 | Spytkowice | 18 265 35 68 |
| 236 | Stryszawa | 33 876 77 24 |
| 193 | Szczucin | 14 643 64 18 |
| 186 | Szczurowa | 14 671 31 20 |
| 209 | Słaboszów | 41 384 71 72 |
| 213 | Tokarnia | 12 274 70 63 |
| 245 | Tomice | 33 823 26 47 |
| 188 | Trzebinia | 32 612 15 10 |
| 226 | Trzyciąż | 12 389 49 34 |
| 248 | Trąbki | — |
| 205 | Tymbark | 18 332 53 22 |
| 246 | Wieliczka | 12 278 45 61 |
| 202 | Szyce | 12 419 11 01 |
| 214 | Wiśniowa | 12 271 40 86 |
| 227 | Wolbrom | 32 644 10 75 |
| 241 | Zakopane | 18 201 47 33 |
| 217 | Łososina Dolna | 18 444 80 02 |
| 204 | Łukowica | 18 333 50 66 |
| 195 | Łużna | 18 354 30 41 |

> Tip: Playwright może pomóc przy BIP-ach. Dla stron statycznych gmin — curl + regex.  
> Skrypt wzorcowy: `context/insights/web-scraping-playwright.md`

---

## 🔲 TODO przyszłe — GitHub Action dla ŚDS

**Do zrobienia później** (brakuje tokenów): GitHub Action cron sprawdzający co kwartał czy `wykaz_sds_malopolska_2026.xlsx` ma nową datę `Last-Modified` i automatycznie importuje zmiany.

URL do monitorowania:
```
https://www.malopolska.uw.gov.pl/doc/Wykaz%20%C5%9Brodowiskowych%20dom%C3%B3w%20samopomocy.xlsx
```

Analogicznie dla DPS:
```
https://www.malopolska.uw.gov.pl/doc/wykaz%20dps.pdf
```
