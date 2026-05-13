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
