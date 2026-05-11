# Sesja #14: Redesign kalkulatora + FAQ DPS
**Data:** 11 maja 2026 (kontynuacja sesji #13)
**Branch:** main
**Commity sesji:** `f2b7592` → `02414c3`

---

## ✅ Co osiągnęliśmy

### 1. Rekonesans stasik-kancelaria.pl

Pobrano przez curl pełny HTML + inline JavaScript kalkulatora ze strony kancelarii prawnej stasik-kancelaria.pl. Kluczowe obserwacje:

- Czcionki: **Plus Jakarta Sans** (body, 400–800) + **DM Serif Display** (nagłówki)
- Logika JS kalkulatora: hierarchia mieszkaniec → małżonek → dzieci → gmina
- 7 pól input: koszt DPS, dochód seniora, dochód małżonka, liczba dzieci, sytuacja dziecka, dochód gosp. dziecka, liczba osób
- Badge: "Aktualizuje się na żywo"
- Disclaimer o dwóch metodach obliczania (WSA Łódź II SA/Łd 499/20, WSA Opole I SA/Op 401/24)

**Wnioski prawne z treści serwisu** (fakty prawne, nie kopiowane teksty):
- Synowa/zięć nie w katalogu art. 61 — ale dochód wliczany do gosp. domowego dziecka
- Dzieci za granicą: obowiązek niezależny od miejsca zamieszkania
- Po śmierci: gmina może dochodzić zwrotu z majątku spadkowego
- Darowizna przed DPS: ryzyko podważenia (skarga pauliańska art. 527 k.c.)
- Odmowa umowy z MOPS → decyzja administracyjna → odwołanie do SKO/WSA
- ZOL vs DPS: w ZOL NFZ pokrywa koszty medyczne, rodzina nie dopłaca

---

### 2. Redesign kalkulatora `/kalkulator` (commit `eebddfa`)

Kompletny rewrite `app/kalkulator/page.tsx` (595 ins, 1047 del).

**Nowy układ:**
- 2 kolumny: formularz (lewo) + sticky panel wyników (prawo)
- Panel wyników `bg-slate-900` — 4 karty live:
  - 🟢 Mieszkaniec DPS (emerald)
  - ⬛ Małżonek (dark)
  - 🟡 Dzieci ×N (amber)
  - 🔵 Gmina (blue)
- Badge "Przelicza na bieżąco" (Zap icon)
- Wyniki aktualizują się na każde wejście — bez klikania

**Logika (port 1:1 z JS stasik-kancelaria.pl):**
```
oplataSeniora = min(income * 0.7, koszt)
oplataM = (spouseIncome > 3030) ? min(spouseIncome - 3030, pozostalo) : 0
prog300Dz = samotnie ? 3030 : 2469 * nPersons
nadwyzkaDz = max(0, incChild - prog300Dz)
oplataD = min(nadwyzkaDz * nKids, pozostalo_po_malzonku)
oplataGminy = koszt - oplataSeniora - oplataM - oplataD
```

**Dodatkowa funkcja:** po wyszukaniu DPS przez miasto → auto-podstawia najtańszą cenę do kalkulatora. Na kartach DPS: przycisk "Użyj ceny ↑".

**Różnicowanie od stasik** (commit `d5c3b07`):
- Liczby wyników → `font-mono` (Geist Mono) — wygląd wyświetlacza
- Inputy → `font-bold` zamiast `font-black` (700 vs 900)
- Badge: "Przelicza na bieżąco" (stasik: "Aktualizuje się na żywo")
- Nasza czcionka globalna: Lato vs stasik: Plus Jakarta Sans

---

### 3. FAQ artykuł `koszty-opieki.mdx` (commit `0b26b9d`)

Rozszerzenie sekcji FAQ z 6 do 13 pytań. Nowe pytania:

| Pytanie | Podejście |
|---------|-----------|
| Synowa/zięć — nie płacą, ale dochód wliczany | faktyczne |
| Dzieci za granicą — obowiązek istnieje | faktyczne |
| Po śmierci — gmina może odzyskać z spadku | + disclaimer |
| Dwie metody obliczania MOPS | + disclaimer |
| Darowizna przed DPS | tylko sygnalizacja + mocny disclaimer |
| Odmowa umowy z MOPS — ścieżka formalna | + disclaimer |
| ZOL vs DPS — NFZ pokrywa medyczne | faktyczne |

**Zasada:** fakty = wprost; taktyka/strategia = "skonsultuj z radcą prawnym".

---

### 4. faqData.ts — poprawki + nowe pytania (commit `ce3ac81`)

**4 poprawki błędów:**
- `koszt-dps`: "koszt ustala MOPS/GOPS" → "koszt ustala powiat (wójt/burmistrz)" ← błąd merytoryczny
- `kto-doplaca`: dodano hierarchię (małżonek → dzieci → gmina) + progi 300%
- `publiczne-vs-prywatne`: cena prywatnych "3000-8000 zł" → "5 000–15 000 zł"
- `jak-dziala-kalkulator`: opis aktualizacji do nowego kalkulatora

**3 nowe pytania:**
- `rodzenstwo-nie-placi`: art. 61 katalog zamknięty
- `progi-300`: 3 030 zł (samotna) / 2 469 zł/os. (rodzina)
- `zol-vs-dps`: ZOL — rodzina nie dopłaca

**Naprawa techniczna:** `miniFAQData` zmienione z indeksów tablicy (`allFAQData[0]`) na `.find()` po `id` — odporne na dodawanie pytań w środku.

---

### 5. SEO research: FAQ rich results

Google usunął wyświetlanie FAQ w wynikach wyszukiwania **7 maja 2026**. Jednak FAQPage JSON-LD schema nadal obowiązuje i jest czytana przez Google. Strony z FAQPage schema są **3,2× częściej cytowane w AI Overviews**. Decyzja: zostawiamy schema, rozszerzamy FAQ — wartość dla AI Overviews.

---

## 📁 Zmienione pliki

| Plik | Co zmieniono |
|------|-------------|
| `app/kalkulator/page.tsx` | Kompletny rewrite — live kalkulator 4-kartowy |
| `content/articles/finanse-prawne/koszty-opieki.mdx` | FAQ: 6 → 13 pytań |
| `src/components/faq/faqData.ts` | 4 poprawki + 3 nowe pytania + fix miniFAQData |

---

## 🔑 Kluczowe decyzje projektowe

1. **Treść stasik-kancelaria.pl** — można użyć faktów prawnych (publiczne prawo), nie tekstów. Pytania techniczne/taktyczne odsyłamy do radcy prawnego.

2. **Ochrona przed scrapingiem** — 100% ochrony niemożliwe. Rekomendacja: Cloudflare + rate limiting. Dane DPS są publiczne (MUW) — nie ma sensu chronić.

3. **FAQ rich results** — martwe od 7 maja 2026 (visual). FAQPage schema nadal wartościowa dla AI Overviews.

4. **Kalkulator a stasik** — identyczny układ to problem wizerunkowy. Naprawione przez font-mono na liczbach + font-bold inputy + zmieniony tekst badge.

---

## 🚨 Do zrobienia w następnej sesji

### Priorytet: SEO (nadal zablokowane!)
- [ ] `public/robots.txt` → `Allow: /`, `Disallow: /admin/`
- [ ] `app/layout.tsx` → `robots: { index: true, follow: true }`
- [ ] `app/sitemap.ts` — dynamiczny (184 placówki + artykuły)

### Kalkulator — drobne poprawki
- [ ] Przetestować zachowanie przy `nKids=0` i `spouseIncome=0`
- [ ] Rozważyć mini-kalkulator na karcie placówki (`/placowka/[id]`)

### Treść
- [ ] Seria artykułów o opłatach DPS — agenci + wiarygodne źródła (ISAP, NSA)
- [ ] "Krok po kroku: wniosek o DPS" — brakuje procedury od A do Z

### Dane
- [ ] GUS prognoza per powiat 2040 (XLSX 32 MB, stat.gov.pl)
- [ ] Mediana emerytur ZUS — PSZ.ZUS.PL lub UDIP do statystyki@zus.pl
- [ ] Monitor wolnych miejsc: odkomentować import do bazy (po fazie testowej)

Ostatnia aktualizacja: 2026-05-11
