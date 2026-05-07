# Publish Draft — Kompas Seniora

Przenosi gotowy artykuł z `drafts/` do właściwego miejsca w projekcie MDX i rejestruje go w `src/data/articles.ts`.

## Użycie
`/publish-draft [plik w drafts/]`

Przykład:
```
/publish-draft drafts/koszty-dps-2026-05-07.md
```

## Co robi ta komenda

### Krok 1 — Określ sekcję i slug

Na podstawie treści artykułu zaproponuj gdzie go umieścić:

| Temat artykułu | Sekcja | Folder |
|---------------|--------|--------|
| Koszty, zasiłki, przepisy, dokumenty | `finanse-prawne` | `content/articles/finanse-prawne/` |
| Wybór placówki, DPS, ŚDS, proces przyjęcia | `wybor-opieki` | `content/articles/wybor-opieki/` |
| Demencja, wypalenie, opieka w domu | `dla-opiekuna` | `content/articles/dla-opiekuna/` |
| Zdrowie, aktywność, styl życia seniora | `dla-seniora` | `content/articles/dla-seniora/` |

Zaproponuj slug (bez polskich znaków, z myślnikami) na podstawie tytułu artykułu.
Potwierdź z użytkownikiem przed wykonaniem.

### Krok 2 — Konwertuj frontmatter do formatu MDX

Draft z `/write` ma format SEO Machine. Zamień na format MDX Kompas Seniora:

```yaml
---
title: "[tytuł z draftu]"
excerpt: "[meta description z draftu, 140-160 znaków]"
category: "[nazwa sekcji po polsku: Wybór opieki / Dla opiekuna / Dla seniora / Finanse i prawo]"
readTime: "[oblicz: liczba słów / 200, zaokrąglij] min"
publishedAt: "[dzisiejsza data YYYY-MM-DD]"
thumbnail: "[patrz: Krok 2b]"
heroImage: "[patrz: Krok 2b]"
---
```

### Krok 2b — Dobierz zdjęcia (thumbnail + heroImage)

Dostępne zdjęcia w `/public/images/` z sugestiami zastosowania:

| Plik | Pasuje do tematu |
|------|-----------------|
| `senior_opiekunka.webp` | opieka, wybór placówki, relacja senior-opiekun |
| `demencja.webp` | Alzheimer, demencja, opieka nad chorym |
| `demencja_hero.webp` | hero dla artykułów o demencji |
| `babcia_dom_opieki.webp` | DPS, dom opieki, przeprowadzka do placówki |
| `babcia_dom_opieki2.webp` | j.w., wersja alternatywna |
| `seniorzy_puzle.webp` | aktywność umysłowa, ŚDS, zajęcia terapeutyczne |
| `seniorzy_puzle2.webp` | j.w., wersja hero |
| `seniorzy_ciasto.png` | codzienność w DPS, integracja, zajęcia |
| `seniorzy_ciasto2.webp` | j.w., wersja hero |
| `aktywnosc_seniora.webp` | ćwiczenia, aktywność fizyczna, zdrowie |
| `aktywnosc_seniora_2.webp` | j.w., wersja hero |
| `senior_cwiczenia.webp` | rehabilitacja, ruch, zdrowie po 70 |
| `senior_obliczenia.webp` | koszty, finanse, obliczenia, budżet |
| `babcia_tablet.webp` | technologia, internet, nowoczesność |
| `babcie_rowery.webp` | aktywność, styl życia, seniorzy aktywni |
| `dps-comfort.webp` | komfort w DPS, dobra placówka |
| `family-support.webp` | rodzina, wsparcie, relacje |
| `garden-therapy.webp` | terapia ogrodowa, aktywność w placówce |
| `wybor_placowki_hero.webp` | hero dla artykułów o wyborze DPS |
| `zdrowie_po_70_hero.webp` | hero dla artykułów o zdrowiu seniora |
| `telefon.webp` | kontakt, MOPS, telefon do placówki |

**Zasada doboru:**
- `thumbnail` = zdjęcie które wygląda dobrze w karcie artykułu (kwadrat/poziom, twarz lub akcja)
- `heroImage` = szersze, bardziej "filmowe" zdjęcie na baner górny artykułu
- Często `thumbnail` i `heroImage` to para (np. `demencja.webp` + `demencja_hero.webp`)

**Jeśli żadne zdjęcie nie pasuje:**
Zamiast zgadywać, dodaj placeholder i wyraźnie zaznacz:
```yaml
thumbnail: "📸 PLACEHOLDER — potrzebne zdjęcie: [opis co powinno być na zdjęciu]"
heroImage: "📸 PLACEHOLDER — potrzebne zdjęcie: [opis co powinno być na zdjęciu]"
```
Np. dla artykułu o kosztach DPS: `"📸 PLACEHOLDER — senior z dokumentami/rachunkami, ciepłe światło"`

### Krok 3 — Przenieś plik

```bash
# Utwórz folder jeśli nie istnieje
mkdir -p content/articles/[sekcja]/

# Przenieś i zmień nazwę
mv drafts/[plik-draftu].md content/articles/[sekcja]/[slug].mdx
```

### Krok 4 — Dodaj wpis do src/data/articles.ts

Znajdź odpowiednią sekcję w `src/data/articles.ts` i dodaj nowy wpis na końcu listy `articles`:

```typescript
{
  slug: '[slug]',
  sectionId: '[wybor-opieki|dla-opiekuna|dla-seniora|finanse-prawne]',
  category: '[kategoria PL]',
  badge: 'NOWE',
  isActive: true,
},
```

Nie dodawaj `featuredOrder` ani `thumbnail` — użytkownik doda je później jeśli będzie potrzeba.

### Krok 5 — Potwierdź i zaproponuj commit

Pokaż użytkownikowi:
- ścieżkę docelową pliku MDX
- fragment dodany do `articles.ts`
- liczbę słów artykułu

Zapytaj czy zrobić commit. Jeśli tak, użyj formatu:
```
feat: Nowy artykuł — [tytuł artykułu]

[2-3 zdania o czym jest artykuł i co wnosi]
Sekcja: [nazwa sekcji]
Słów: [liczba]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## Pełny workflow dla nowego artykułu

```
/research [temat]          → brief z weryfikowanymi źródłami
/write [temat]             → draft w drafts/, przejrzyj fakty
/scrub drafts/[plik].md    → usuń AI-slop (ręcznie, po review)
/optimize drafts/[plik].md → finalna optymalizacja SEO
/publish-draft drafts/[plik].md → przenieś do MDX + dodaj do articles.ts + commit
```
