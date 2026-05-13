# Insight: Wyciąganie danych ze stron www i BIP-ów

**Data:** 2026-05-13  
**Kontekst:** Aktualizacja danych kontaktowych GOPS/MOPS w bazie

---

## Problem

Strony BIP (`bip.malopolska.pl` i inne) renderują treść przez JavaScript.  
`curl` pobiera tylko szkielet HTML — bez danych kontaktowych.

```bash
curl -sL "https://bip.malopolska.pl/gopswboleslawiu/Article/id,137220.html"
# → pusty HTML, brak emaila, brak telefonu
```

## Rozwiązanie: Playwright (headless Chromium)

Playwright uruchamia pełną przeglądarkę, wykonuje JS i daje dostęp do wyrenderowanej treści.

### Instalacja (jednorazowo)

```bash
# Globalnie (do skryptów lokalnych)
npm install playwright --prefix /tmp/pw-test
npx playwright install chromium

# Lub jako dev-dependency w projekcie
npm install playwright --save-dev
npx playwright install chromium
```

### Podstawowy skrypt — wyciągnij email i telefon ze strony

```javascript
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('https://bip.malopolska.pl/gopswboleslawiu/Article/id,137220.html', {
    waitUntil: 'networkidle',  // czeka aż JS się wykona
    timeout: 20000
  });
  
  const text = await page.evaluate(() => document.body.innerText);
  
  const emails = text.match(/[\w.\-]+@[\w.\-]+\.\w+/g) || [];
  const phones = text.match(/\d[\d\s\-\/]{7,14}\d/g) || [];
  
  console.log('Emaile:', [...new Set(emails)]);
  console.log('Telefony:', [...new Set(phones)]);
  
  await browser.close();
})();
```

### Wynik dla GOPS Bolesław (pow. dąbrowski)

```
curl:      brak danych
Playwright: EMAILE: ['gops@boleslaw.com.pl']
            TELEFONY: ['14 641 50 27']
```

---

## Kiedy używać curl, kiedy Playwright

| Sytuacja | Narzędzie |
|----------|-----------|
| Strona statyczna / WordPress / prosta HTML | `curl` + Python regex — szybkie |
| BIP (`bip.malopolska.pl`, `bip.gov.pl`) | Playwright — JS-rendered |
| Strona gminy z Angular/React | Playwright |
| Strona z CAPTCHA | Playwright + manual lub usługa AntiCaptcha |
| Masowe pobieranie (100+ stron) | Playwright z `Promise.all` + rate limiting |

---

## Gdzie można użyć w projekcie

### 1. Monitoring GOPS/MOPS (planowane)

Skrypt co miesiąc/2 miesiące sprawdzający czy dane kontaktowe się nie zmieniły:

```javascript
// scripts/monitor-mops-contacts.js
const { PrismaClient } = require('@prisma/client');
const { chromium } = require('playwright');

const prisma = new PrismaClient();
const browser = await chromium.launch();

const allMops = await prisma.mopsContact.findMany({
  where: { website: { not: null } }
});

const changes = [];
for (const mops of allMops) {
  const page = await browser.newPage();
  await page.goto(mops.website, { waitUntil: 'networkidle', timeout: 15000 });
  const text = await page.evaluate(() => document.body.innerText);
  
  const emailOnPage = (text.match(/[\w.\-]+@[\w.\-]+\.\w+/g) || [])[0];
  
  if (emailOnPage && emailOnPage !== mops.email) {
    changes.push({ id: mops.id, city: mops.cityDisplay, old: mops.email, new: emailOnPage });
  }
}

console.log('Zmiany do weryfikacji:', changes);
// → wysyłka emailem lub zapis do tabeli "do weryfikacji"
```

### 2. Auto-uzupełnianie brakujących danych GOPS

86 rekordów w bazie nie ma emaila lub www. Dla tych które mają znany URL BIP można próbować auto-uzupełnić:

```javascript
// Wzorzec BIP Małopolska:
// https://bip.malopolska.pl/{slug}/Article/id,{id}.html
// Np. gopswboleslawiu → slug
```

### 3. Scraping MUW — wolne miejsca w DPS

Już mamy `monitor-wolne-miejsca.py` (Python + requests). Gdyby MUW zmieniło stronę na JS-rendered, migracja do Playwright byłaby prosta.

### 4. Weryfikacja stron DPS/ŚDS

184 placówki mają `www` w bazie — można sprawdzać czy strony działają i czy ceny się nie zmieniły.

---

## Uwagi praktyczne

- **Rate limiting**: min. 1-2 sekundy przerwy między requestami żeby nie przeciążyć serwera
- **`waitUntil: 'networkidle'`**: bezpieczny wybór dla BIP-ów, ale wolniejszy niż `'domcontentloaded'`
- **Headless**: domyślnie `true` — przeglądarka nie otwiera okna, działa w tle i na serwerze
- **GitHub Actions**: Playwright działa na Ubuntu runners bez dodatkowej konfiguracji
- **Rozmiar**: Chromium ~100MB — nie commitować do repo, instalować w pipeline

---

## Przykład GitHub Action (cron)

```yaml
# .github/workflows/monitor-mops.yml
name: Monitor MOPS kontakty
on:
  schedule:
    - cron: '0 8 1 * *'  # 1. dnia miesiąca o 8:00

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install chromium --with-deps
      - run: node scripts/monitor-mops-contacts.js
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Wykazy MUW Małopolska — coroczna aktualizacja danych DPS/ŚDS

**Kluczowe odkrycie (2026-05-13):** MUW Małopolska używa **stałych URL** i nadpisuje pliki przy aktualizacji.  
Nie trzeba szukać nowego linku każdego roku — wystarczy sprawdzić nagłówek `Last-Modified`.

### URL-e produkcyjne

| Plik | URL | Last-Modified | Stan |
|------|-----|---------------|------|
| Wykaz DPS | `https://www.malopolska.uw.gov.pl/doc/wykaz%20dps.pdf` | 27.03.2026 | ✅ aktualny |
| Wykaz ŚDS | `https://www.malopolska.uw.gov.pl/doc/WYKAZ%20SRODOWISKOWYCH%20DOM%C3%93W%20SAMOPOMOCY%20W%20MA%C5%81OPOLSCE.xls` | 03.04.2017 | ❌ od 9 lat nieaktualizowany |

### Sprawdzenie czy plik jest nowszy (bez pobierania)

```bash
curl -sI "https://www.malopolska.uw.gov.pl/doc/wykaz%20dps.pdf" | grep Last-Modified
# Last-Modified: Fri, 27 Mar 2026 14:24:03 GMT
```

Jeśli data nowsza niż `data_zrodla_dane` w naszej bazie → warto pobrać i przetworzyć.

### Co dał wykaz DPS 2026 (91 rekordów, 92 emaili)

- Uzupełnił emaile dla wszystkich 89 DPS w bazie (wcześniej 2 brakowały)
- Przetestowany skrypt: `data/wykaz_dps_malopolska_2026.pdf` + Python fitz
- Struktura: l.p. | powiat | nazwa i adres | email | typ | liczba miejsc

### Co dał wykaz ŚDS 2017 (76 rekordów, 76 emaili)

- Uzupełnił 7 z 10 brakujących emaili ŚDS → 92/95 ŚDS ma email
- 3 rekordy bez dopasowania (Marchocice, Rzepiennik Biskupi, Winiary) — nowsze placówki spoza 2017
- Plik: `data/wykaz_sds_malopolska.xls`, kolumna 7 = email

### Strategia rocznej aktualizacji (na 2027 i kolejne lata)

```bash
# 1. Sprawdź czy DPS PDF jest nowszy
curl -sI "https://www.malopolska.uw.gov.pl/doc/wykaz%20dps.pdf" | grep Last-Modified

# 2. Pobierz jeśli nowszy
curl -sL "https://www.malopolska.uw.gov.pl/doc/wykaz%20dps.pdf" -o data/wykaz_dps_{ROK}.pdf

# 3. Wyciągnij emaile (Python fitz)
# Struktura stała: l.p. jako "N." na początku linii, email w tej samej sekcji

# 4. Dopasuj przez oficjalne_id (l.p. w PDF = oficjalne_id w DB)
# UWAGA: oficjalne_id są wypełnione dla wszystkich 89 DPS — dopasowanie 1:1

# 5. Dla ŚDS: szukaj zaktualizowanego XLS lub nowego formatu
# URL ŚDS od 2017 nie zmieniał się — MUW może mieć nowszy w innym miejscu
```

### Dla ŚDS — alternatywne źródła nowszych danych

Skoro XLS MUW ma dane z 2017, opcje na aktualne emaile ŚDS:
1. **ROPS Małopolska** (`rops.malopolska.pl`) — prowadzi rejestr ŚDS
2. **BIP Małopolska** — każde ŚDS ma profil pod `bip.malopolska.pl/{slug}`
3. **Strony gminy** — ŚDS gminne są na stronach urzędów gmin
4. **Kontakt telefoniczny** — dla 3 brakujących (Marchocice, Rzepiennik Biskupi, Winiary)

---

## Bonus: PDF z listą OPS Małopolska (BIP)

**URL:** `https://bip.malopolska.pl/api/files/3559651`  
**Plik:** `data/ops_malopolska_bip_2026-05-13.pdf` (15 stron, 876 KB)

Zawiera listę wszystkich jednostek pomocy społecznej w Małopolsce z podziałem na powiaty i gminy — w kontekście przeciwdziałania przemocy domowej. Mimo specyficznego kontekstu, dane kontaktowe (email, telefon, adres) są ogólne dla całej placówki.

**Wynik użycia:**
- Wyciągnięto 346 unikalnych emaili
- Dopasowano 64 z 66 rekordów bez emaila w naszej bazie
- Wgrano automatycznie 48 pewnych dopasowań
- 16 wymaga ręcznej weryfikacji (PCPR zamiast GOPS, inne miasto w domenie)

**Wzorzec URL pliku:** `https://bip.malopolska.pl/api/files/{ID}` — warto szukać podobnych plików dla innych województw.

### Co jeszcze jest w tym PDF

Poza GOPS/MOPS dokument zawiera:

| Typ placówki | Liczba | Wartość dla projektu |
|---|---|---|
| **PCPR** (Powiatowe Centrum Pomocy Rodzinie) | 24 | Kluczowe — PCPR koordynuje kierowanie do DPS. Warto dodać do bazy jako osobny typ. |
| **OIK** (Ośrodek Interwencji Kryzysowej) | 30 | Pomocne gdy rodzina jest w kryzysie — można linkować z kalkulatora |
| Punkty konsultacyjne | ~40 | Mniej istotne dla nas |

PCPR z emailami wyciągnięte z PDF:

```
Brzesko:     pcpr@pcprbrzesko.pl
Dąbrowa Tn.: pcpr@pcprdt.pl
Limanowa:    pcpr@powiat.limanowski.pl
Miechów:     sekretariat@pcprmiechow.pl
Nowy Sącz:   pk@pcpr-ns.pl
Gorlice:     sekretariat@pcpr.gorlice.pl
Myślenice:   kontakt@interwencjamyslenicki.pl
```

---

## Jak znaleźć podobny PDF dla innych województw

Każde województwo prowadzi **rejestr jednostek przeciwdziałania przemocy** i publikuje go jako PDF w BIP. To roczne zestawienie zawsze ma pełną listę OPS/PCPR z danymi kontaktowymi.

### Strategia szukania

**1. Google File Search:**
```
site:bip.{woj}.pl "lista jednostek" "ośrodek pomocy społecznej" filetype:pdf
site:bip.slaskie.pl "wykaz" "ops" filetype:pdf
```

**2. Bezpośrednio przez BIP API:**
```
# Małopolska — działający wzorzec:
https://bip.malopolska.pl/api/files/{ID}

# Inne województwa do sprawdzenia:
https://bip.slaskie.pl/api/files/{ID}
https://bip.mazowsze.pl/api/files/{ID}
https://bip.lodzkie.eu/api/files/{ID}
https://bip.kujawsko-pomorskie.pl/api/files/{ID}
```

ID trzeba odgadnąć lub znaleźć przez wyszukiwarkę BIP danego województwa. Warto szukać ID bliskie 3559651 (Małopolska 2025) — inne województwa publikowały podobne pliki mniej więcej w tym samym czasie.

**3. Strona ROPS (Regionalny Ośrodek Polityki Społecznej):**

Każde województwo ma ROPS który zbiera te dane. Np.:
- Małopolska: `rops.malopolska.pl`
- Śląskie: `rops-katowice.pl`
- Mazowieckie: `mcps.com.pl`

Szukaj sekcji "przeciwdziałanie przemocy" → "baza danych" lub "wykaz placówek".

### Schemat działania przy nowym województwie

```python
# 1. Pobierz PDF
curl -sL "https://bip.{woj}.pl/api/files/{ID}" -o ops_{woj}.pdf

# 2. Wyciągnij tekst
import fitz
doc = fitz.open(f'ops_{woj}.pdf')
text = ''.join(page.get_text() for page in doc)

# 3. Wyciągnij emaile per placówka
# (skrypt w data/scripts/ — do napisania)

# 4. Dopasuj do bazy po nazwie gminy
# (ten sam algorytm co dla Małopolski)

# 5. Wgraj pewne, oznacz do weryfikacji
```

### Jakość danych — co sprawdzić przed wgraniem

Nie wszystkie emaile z PDF są emailami GOPS. Filtruj:
- ✅ Domena zawiera nazwę gminy/miasta (`gops@gnojnik.pl`)
- ✅ Prefix to `gops@`, `mops@`, `ops@`, `mgops@`
- ⚠️ Sprawdź ręcznie: `pcpr@...`, `oik@...`, `opieka@...`
- ❌ Odrzuć: `gmail.com`, `wp.pl`, `interia.pl`, `op.pl` — osobiste/tymczasowe
- ❌ Odrzuć gdy domena to inne miasto niż szukane

### Możliwe zastosowania poza GOPS/MOPS

Gdy będziemy dodawać kolejne województwa lub typy placówek do bazy:

| Cel | Źródło |
|-----|--------|
| DPS innych województw | `{woj}.uw.gov.pl/doc/wykaz dps.pdf` — ten sam wzorzec |
| ŚDS całej Polski | ROPS + MRPiPS (centralny rejestr) |
| PCPR (20 powiatów Małopolski) | BIP PDF `bip.malopolska.pl/api/files/3559651` — gotowe |
| Noclegownie / schroniska | Podobny raport ROPS |

---

## Wzorzec MUW dla innych województw

Każde MUW prowadzi rejestr DPS. URL pattern jest analogiczny:

| Województwo | MUW URL | Status |
|-------------|---------|--------|
| **Małopolskie** | `malopolska.uw.gov.pl/doc/wykaz dps.pdf` | ✅ działa, Last-Modified 27.03.2026 |
| Śląskie | `katowice.uw.gov.pl` | do sprawdzenia |
| Mazowieckie | `mazowieckie.uw.gov.pl` | do sprawdzenia |
| Łódzkie | `lodz.uw.gov.pl` | do sprawdzenia |
| Podkarpackie | `rzeszow.uw.gov.pl` | do sprawdzenia |

### Jak znaleźć dla nowego województwa

```bash
# Opcja 1: bezpośredni strzał
curl -sI "https://{woj}.uw.gov.pl/doc/wykaz%20dps.pdf" | grep -E "HTTP|Last-Modified"

# Opcja 2: Google
# site:{woj}.uw.gov.pl "wykaz" "dom pomocy" filetype:pdf

# Opcja 3: strona MUW → Pomoc społeczna → DPS → wykaz
```

### Co zrobić gdy rozszerzamy na nowe województwo

1. Sprawdź URL wzorcem MUW → pobierz PDF
2. Sprawdź strukturę (może różnić się od Małopolski)  
3. Wyciągnij emaile przez fitz + regex
4. Dopasuj do bazy po nazwie DPS lub miejscowości
5. `oficjalne_id` = l.p. z PDF — wpisz żeby umożliwić przyszłą aktualizację 1:1

**Czas na nowe województwo (mając już skrypt):** ~2-3 godziny.
