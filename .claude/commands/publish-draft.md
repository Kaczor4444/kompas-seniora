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
readTime: "[oblicz: liczba słów / 200, zaokrąglij]"
publishedAt: "[dzisiejsza data YYYY-MM-DD]"
---
```

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
