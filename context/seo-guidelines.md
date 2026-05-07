# SEO Guidelines — Kompas Seniora

## Długość artykułów

| Typ artykułu | Docelowa długość |
|-------------|-----------------|
| Przewodnik główny (pillar) | 2500–4000 słów |
| Artykuł informacyjny | 1500–2500 słów |
| FAQ / porównanie | 1200–2000 słów |

## Struktura obowiązkowa

Każdy artykuł MUSI zawierać:

1. **Frontmatter** z `title`, `excerpt`, `readTime`, `publishedAt`
2. **Sekcja "Najważniejsze wnioski"** — 3–5 bullet points na górze (przed H2) — patrz reguły AEO poniżej
3. **Min. 2 nagłówki H2** z keyword lub pokrewną frazą
4. **Sekcja FAQ** — min. 4 pytania — patrz reguły AEO poniżej
5. **CTA na końcu** — link do wyszukiwarki `/search` lub kalkulatora `/kalkulator`
6. **Sekcja "Powiązane artykuły"** — 2–3 linki wewnętrzne

## ⚠️ AEO — Answer Engine Optimization (dla AI i skanerów)

Dziś treść jest konsumowana na 3 sposoby jednocześnie:
- **AI (Perplexity, ChatGPT, Google AI Overview)** — wyciągają samodzielne fragmenty, nie czytają całości
- **Skaner** — czyta nagłówki i pierwsze zdania każdego akapitu, pomija resztę
- **Czytelnik** — czyta dokładnie, ale tylko jeśli poprzednie dwa go nie odstraszą

Artykuł musi działać dla wszystkich trzech. Oto konkretne reguły:

### Reguła 1 — "Najważniejsze wnioski" = samodzielne odpowiedzi, nie spis treści

❌ ŹLE (spis treści):
```
- Czym jest DPS
- Jak wygląda proces
- Ile to kosztuje
```

✅ DOBRZE (samodzielne odpowiedzi, każdy bullet działa bez kontekstu):
```
- Opłata za DPS wynosi maksymalnie 70% dochodu seniora — reszta zostaje na kieszonkowe
- Wniosek składa się w MOPS, nie w placówce — to częsty błąd który opóźnia proces
- Czas oczekiwania na miejsce w DPS w Małopolsce wynosi średnio 3–18 miesięcy
- Jeśli dochód seniora nie pokrywa kosztów, resztę w pierwszej kolejności dopłaca rodzina
```

Każdy bullet musi zawierać **konkretną liczbę, fakt lub zasadę** — nie ogólnik.
Pisz je PO napisaniu artykułu, nie przed.

### Reguła 2 — FAQ: pytania jak w Google "People Also Ask"

Min. 4 pytania, cel: 6–8. Każda odpowiedź w FAQ musi:
- Mieć **40–80 słów** (tyle wyciąga Google do Featured Snippet)
- Zaczynać się od **bezpośredniej odpowiedzi** (nie od "To zależy...")
- Być **samodzielna** — zrozumiała bez czytania reszty artykułu
- Kończyć się **linkiem wewnętrznym** gdy temat jest rozwinięty w innym artykule

❌ ŹLE:
```
### Czy można zmienić DPS?
To zależy od wielu czynników. Warto skonsultować się z pracownikiem socjalnym...
```

✅ DOBRZE:
```
### Czy można zmienić placówkę DPS po zamieszkaniu?
Tak — mieszkaniec DPS ma prawo złożyć wniosek o przeniesienie do innej placówki.
Decyzję wydaje MOPS na podstawie nowego wywiadu środowiskowego. Proces trwa
zazwyczaj 1–3 miesiące. Wniosek może złożyć też rodzina w imieniu seniora.
```

Pytania w FAQ formułuj jak realny użytkownik wpisałby je w Google lub ChatGPT:
- "Czy dzieci muszą płacić za DPS rodziców?"
- "Ile się czeka na miejsce w DPS?"
- "Co jeśli senior nie chce iść do DPS?"

### Reguła 3 — pierwsze zdanie każdego H2 = samodzielna odpowiedź

AI i skanery czytają pierwsze zdanie po nagłówku. Musi ono zawierać główną tezę sekcji.

❌ ŹLE (pierwsze zdanie nie mówi nic):
```
## Koszty pobytu w DPS
Kwestia finansowa jest jedną z najważniejszych przy wyborze placówki i warto ją dokładnie przeanalizować.
```

✅ DOBRZE:
```
## Koszty pobytu w DPS
Miesięczna opłata za DPS wynosi maksymalnie 70% dochodu seniora — reszta do pełnej ceny pochodzi z kieszeni rodziny lub gminy.
```

### Reguła 4 — H2 jako pytanie gdy to naturalne

Gdy artykuł odpowiada na konkretne pytania użytkowników, formułuj H2 jako pytanie:
- "Ile kosztuje pobyt w DPS?" zamiast "Koszty DPS"
- "Kto płaci za DPS gdy brakuje pieniędzy?" zamiast "Finansowanie przez rodzinę"
- "Jak długo czeka się na miejsce?" zamiast "Czas oczekiwania"

Nie na siłę — jeśli sekcja nie jest odpowiedzią na pytanie, zostaw H2 opisowy.

## Meta elementy

- **Title tag**: maks. 60 znaków, keyword na początku
- **Meta description (excerpt)**: 140–160 znaków, zawiera keyword + pytanie lub korzyść
- **Slug**: krótki, po polsku bez polskich znaków (np. `koszty-dps`, `dokumenty-wniosek`)

## Linkowanie

- **Wewnętrzne**: 3–5 na artykuł (patrz `internal-links-map.md`)
- **Zewnętrzne**: min. 2 autorytarne źródła:
  - isap.sejm.gov.pl (przepisy prawne)
  - malopolska.uw.gov.pl (dane regionalne)
  - nfz.gov.pl (dane NFZ)
  - mz.gov.pl (Ministerstwo Zdrowia)
  - stat.gov.pl (dane GUS)

## Keyword density

- Primary keyword: 1–2% (nie upychaj)
- Keyword w: H1, pierwszym akapicie, co najmniej jednym H2, meta description
- Stosuj synonimy: "DPS" / "dom pomocy społecznej" / "placówka opiekuńcza"

## Język i styl

- Flesch Reading Ease dla polskiego: cel 60+ (prosty, zrozumiały)
- Zdania: maks. 20 słów
- Akapity: maks. 3–4 zdania
- Listy punktowane zamiast długich akapitów gdy to możliwe
- Tabele dla danych liczbowych i porównań

## E-E-A-T dla Kompas Seniora

Tematy medyczno-prawne (demencja, przepisy, koszty) wymagają:
- Cytowania konkretnych ustaw z numerami artykułów
- Dat aktualizacji danych ("stan na X 2025" lub "stan na X 2026")
- Linków do oficjalnych rejestrów (np. rejestr DPS Małopolska)
- Unikania twierdzeń bez źródła przy danych liczbowych

## ⚠️ Aktualność danych — OBOWIĄZKOWE

**Aktualny rok to 2026. Wszystkie dane muszą być z 2025 lub 2026.**

- Nigdy nie cytuj danych starszych niż 2024 bez wyraźnego zaznaczenia
- Przy wyszukiwaniu zawsze dodawaj rok: "koszty DPS 2026", "dodatek pielęgnacyjny 2026"
- Jeśli nowszych danych brak, napisz wprost: "(dane za 2024, brak nowszych oficjalnych)"
- Sprawdzaj czy cytowane przepisy były nowelizowane po 2024

## ⚠️ Źródła do linkowania — OBOWIĄZKOWE

Każdy artykuł musi zawierać min. **5 linkowanych źródeł zewnętrznych** (cel: 8–12). Podczas researchu zawsze szukaj źródeł nadających się do:
- cytowania inline (np. "według danych GUS z 2025...")
- przypisu pod tabelą (np. "Źródło: rejestr MUW, stan na 01.2026")
- sekcji FAQ (link do oficjalnej odpowiedzi np. z ZUS, NFZ)

**Priorytetowe domeny źródeł (od najwyższego autorytetu):**

| Domena | Co zawiera | Kiedy linkować |
|--------|-----------|----------------|
| isap.sejm.gov.pl | Teksty ustaw (Dz.U.) | Każde powołanie na przepis prawny |
| malopolska.uw.gov.pl | Rejestry DPS/ŚDS, wolne miejsca | Dane regionalne Małopolska |
| stat.gov.pl (GUS) | Statystyki ludności, opieki | Dane demograficzne, liczby placówek |
| mz.gov.pl | Dane Ministerstwa Zdrowia | Tematy zdrowotne, demencja |
| nfz.gov.pl | Refundacje, świadczenia | Finansowanie opieki przez NFZ |
| nik.gov.pl | Raporty NIK o jakości DPS | Jakość opieki, kontrole |
| zus.pl | Świadczenia, emerytury | Finanse, zasiłki |
| alzheimer.pl | PTAiZ — Polskie Towarzystwo | Demencja, Alzheimer (PL źródło) |
| alz.org / alzint.org | WHO/ADI raporty | Statystyki demencji światowe |
| thelancet.com / nejm.org / bmj.com | Badania kliniczne | Demencja, styl życia, leczenie |
| cochranelibrary.com | Przeglądy systematyczne | Skuteczność interwencji |
| who.int | Raporty WHO | Dane globalne, starzenie się |
| mayoclinic.org / health.harvard.edu | Wytyczne kliniczne | Zdrowie seniora, prewencja |

**Źródła anglojęzyczne są dozwolone i pożądane** gdy:
- Dostarczają nowszych lub lepiej udokumentowanych danych niż polskie źródła
- Dotyczą tematów gdzie polska literatura jest uboga (badania nad Alzheimerem, styl życia, modele opieki)
- Są to badania recenzowane (peer-reviewed) z prestiżowych czasopism

Format cytowania w polskim artykule: "Według badań opublikowanych w [Lancet/NEJM] (2025)..." + link do oryginału.
