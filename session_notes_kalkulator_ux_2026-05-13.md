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

Ostatnia aktualizacja: 2026-05-13
