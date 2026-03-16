# Plan Unifikacji Systemu Artykułów

**Data:** 2026-03-16
**Cel:** Jeden unified system zarządzania artykułami zamiast duplikacji danych

---

## 🎯 Cel Biznesowy

**Problem:**
- Artykuły są zdefiniowane w **dwóch miejscach**: `KnowledgeCenter.tsx` (strona główna) i `articles.ts` (strona /poradniki)
- Duplikacja danych → trudne utrzymanie
- Niespójne URL-e i nazwy sekcji
- Ryzyko rozsynchronizowania

**Rozwiązanie:**
- **Single Source of Truth**: `src/data/articles.ts`
- Wszystkie komponenty pobierają dane z jednego miejsca
- Łatwe zarządzanie, zero duplikacji

---

## 📊 Analiza Obecnego Stanu

### System 1: KnowledgeCenter.tsx (strona główna)
**Lokalizacja:** `src/components/knowledge/KnowledgeCenter.tsx`

**Struktura danych:**
```typescript
type Article = {
  id: number              // ręczne ID
  title: string
  excerpt: string
  category: string
  badge: 'POLECAMY' | 'NOWE' | 'NOWY ARTYKUŁ' | 'WKRÓTCE'
  href: string           // pełny URL: /poradniki/sekcja/slug
  isPlaceholder: boolean
  isActive: boolean
  readingTime: string
  imageUrl?: string      // ścieżka do obrazka
}
```

**8 artykułów:**
1. Jak wybrać odpowiednią placówkę → `/poradniki/wybor-opieki/wybor-placowki` ✅
2. 6 Typów DPS → `/poradniki/wybor-opieki/typy-dps` ✅
3. Proces Przyjęcia do DPS → `/poradniki/wybor-opieki/proces-przyjecia-dps` ✅
4. Ile kosztuje dom opieki? → `/poradniki/finanse-prawne/koszty-opieki` ❌
5. Czym różni się DPS od ŚDS? → `/poradniki/wybor-opieki/dps-vs-sds` ❌
6. Jak przygotować seniora → `/poradniki/wsparcie-emocjonalne/przygotowanie-seniora` ❌
7. Jakie dokumenty → `/poradniki/finanse-prawne/dokumenty-wniosek` ❌
8. Prawa mieszkańca → `/poradniki/finanse-prawne/prawa-mieszkanca` ❌

**Status:** 3/8 artykułów ma odpowiedniki w articles.ts

---

### System 2: articles.ts (strona /poradniki)
**Lokalizacja:** `src/data/articles.ts`

**Struktura danych:**
```typescript
{
  slug: string,          // identyfikator
  sectionId: string,     // wybor-opieki, dla-opiekuna, etc.
  category: string,      // kategoria wizualna
  featured: boolean      // czy wyróżniony
}
```

**Metadane z MDX frontmatter:**
- title, excerpt, readTime, publishedAt, thumbnail, keywords

**6 sekcji:**
1. `wybor-opieki` - 6 artykułów (4 active + 2 placeholder)
2. `dla-opiekuna` - 5 artykułów
3. `dla-seniora` - 5 artykułów
4. `finanse-i-swiadczenia` - 5 artykułów
5. `prawne-aspekty` - 5 artykułów

**Total:** 26 artykułów w systemie

---

## 🚨 Zidentyfikowane Problemy

### 1. **Niespójne nazwy sekcji**
| KnowledgeCenter | articles.ts | Conflict? |
|-----------------|-------------|-----------|
| `finanse-prawne` | `finanse-i-swiadczenia` + `prawne-aspekty` | ❌ TAK |
| `wsparcie-emocjonalne` | Brak sekcji | ❌ TAK |

### 2. **Brakujące artykuły w articles.ts**
- `koszty-opieki` (linkowany w KnowledgeCenter)
- `dps-vs-sds` (linkowany)
- `przygotowanie-seniora` (linkowany)
- `dokumenty-wniosek` (linkowany)

### 3. **Różne nazwy tego samego artykułu**
- `prawa-mieszkanca` (KnowledgeCenter) vs `prawa-mieszkancow` (articles.ts)

### 4. **Duplikacja logiki**
- Obrazki ustawiane w 2 miejscach (KnowledgeCenter + MDX frontmatter)
- Featured flag w 2 miejscach
- Badge/status w 2 miejscach

---

## ✅ Proponowana Struktura Docelowa

### Unified Schema
```typescript
// src/data/articles.ts

export type ArticleDefinition = {
  slug: string
  sectionId: string
  category: string
  featured: boolean

  // Metadata (opcjonalne - domyślnie z MDX)
  title?: string
  excerpt?: string
  readTime?: string
  thumbnail?: string

  // Display settings
  badge?: 'POLECAMY' | 'NOWE' | 'NOWY ARTYKUŁ' | 'WKRÓTCE'
  isActive?: boolean  // domyślnie true
}

export const sections: Section[] = [
  {
    id: 'wybor-opieki',
    title: 'Wybór opieki',
    icon: 'Building2',
    articles: [
      { slug: 'wybor-placowki', category: 'Wybór opieki', featured: true, badge: 'POLECAMY' },
      { slug: 'typy-dps', category: 'Wybór opieki', featured: true, badge: 'NOWE' },
      { slug: 'proces-przyjecia-dps', category: 'Wybór opieki', featured: true, badge: 'NOWY ARTYKUŁ' },
      { slug: 'dps-vs-sds', category: 'Wybór opieki', isActive: false, badge: 'WKRÓTCE' },
      // ...
    ]
  },
  {
    id: 'finanse-prawne',  // 🆕 UNIFIED section
    title: 'Finanse i prawo',
    icon: 'Wallet',
    articles: [
      { slug: 'koszty-opieki', category: 'Finanse', isActive: false, badge: 'WKRÓTCE' },
      { slug: 'dokumenty-wniosek', category: 'Prawne', isActive: false, badge: 'WKRÓTCE' },
      { slug: 'prawa-mieszkanca', category: 'Prawne', isActive: false, badge: 'WKRÓTCE' },
      // ...
    ]
  },
  {
    id: 'dla-seniora',
    title: 'Dla seniora',
    icon: 'Users',
    articles: [
      { slug: 'przygotowanie-seniora', category: 'Dla seniora', isActive: false, badge: 'WKRÓTCE' },
      // ...
    ]
  }
]
```

### Helper Functions
```typescript
// src/lib/articleHelpers.ts

export function getFeaturedArticles(limit: number = 8) {
  // Pobiera featured articles dla KnowledgeCenter
  const allArticles = sections.flatMap(s => s.articles.map(a => ({...a, sectionId: s.id})))
  return allArticles
    .filter(a => a.featured)
    .sort((a, b) => /* priorytet */)
    .slice(0, limit)
}

export function getArticleUrl(sectionId: string, slug: string) {
  return `/poradniki/${sectionId}/${slug}`
}

export function getArticleThumbnail(article: Article) {
  return article.thumbnail || '/images/placeholder-article.webp'
}
```

---

## 🔧 Plan Implementacji

### FAZA 1: Przygotowanie (30 min)

**1.1 Backup**
```bash
git add -A
git commit -m "checkpoint: before article unification"
```

**1.2 Dodaj brakujące artykuły do articles.ts**
- Dodaj sekcję `finanse-prawne` (połącz `finanse-i-swiadczenia` + część `prawne-aspekty`)
- Dodaj slug'i: `koszty-opieki`, `dokumenty-wniosek`, `prawa-mieszkanca`
- Dodaj slug: `dps-vs-sds` do sekcji `wybor-opieki`
- Dodaj slug: `przygotowanie-seniora` do sekcji `dla-seniora`

**1.3 Dodaj pola `badge` i `imageUrl` do ArticleDefinition**

---

### FAZA 2: Refaktoryzacja KnowledgeCenter (1h)

**2.1 Utwórz helper function**
```typescript
// src/lib/articleHelpers.ts
export async function getFeaturedArticlesForHome() {
  const featured = sections.flatMap(section =>
    section.articles
      .filter(a => a.featured || a.badge === 'POLECAMY')
      .map(a => ({
        ...a,
        sectionId: section.id,
        href: `/poradniki/${section.id}/${a.slug}`
      }))
  )

  // Enrich with MDX metadata
  return enrichArticlesWithMetadata(featured)
}
```

**2.2 Zaktualizuj KnowledgeCenter.tsx**
```typescript
// Zamiast hardcoded articles array:
const articles: Article[] = [...]

// Używaj:
interface KnowledgeCenterProps {
  articles: ArticleWithMetadata[]
}

export default function KnowledgeCenter({ articles }: KnowledgeCenterProps) {
  // Użyj przekazanych articles
}
```

**2.3 Zaktualizuj stronę główną**
```typescript
// app/page.tsx
import { getFeaturedArticlesForHome } from '@/lib/articleHelpers'

export default async function HomePage() {
  const featuredArticles = await getFeaturedArticlesForHome()

  return (
    <>
      <HeroSection />
      <KnowledgeCenter articles={featuredArticles} />
      {/* ... */}
    </>
  )
}
```

---

### FAZA 3: Unifikacja nazw sekcji (30 min)

**3.1 Zmiana struktury sekcji w articles.ts**

**PRZED:**
```typescript
{
  id: 'finanse-i-swiadczenia',
  title: 'Finanse',
  icon: 'Wallet',
  articles: [...]
},
{
  id: 'prawne-aspekty',
  title: 'Prawne',
  icon: 'Scale',
  articles: [...]
}
```

**PO:**
```typescript
{
  id: 'finanse-prawne',
  title: 'Finanse i prawo',
  icon: 'Wallet',
  articles: [
    // Przeniesione z finanse-i-swiadczenia
    { slug: 'dodatek-pielegnacyjny', ... },
    { slug: 'zasilek-opiekunczy', ... },
    { slug: 'koszty-opieki', ... },  // 🆕

    // Przeniesione z prawne-aspekty
    { slug: 'prawa-mieszkanca', ... },  // 🆕 zmienione z prawa-mieszkancow
    { slug: 'dokumenty-wniosek', ... }, // 🆕
    { slug: 'zgoda-na-opieke', ... },
    // ...
  ]
}
```

**3.2 Redirect dla starych URL-i**
```typescript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/poradniki/finanse-i-swiadczenia/:slug',
        destination: '/poradniki/finanse-prawne/:slug',
        permanent: true,
      },
      {
        source: '/poradniki/prawne-aspekty/:slug',
        destination: '/poradniki/finanse-prawne/:slug',
        permanent: true,
      },
    ]
  },
}
```

---

### FAZA 4: Dodanie obrazków (15 min)

**4.1 Rozszerz ArticleDefinition**
```typescript
type ArticleDefinition = {
  // ...
  thumbnail?: string  // Opcjonalne - override MDX frontmatter
}
```

**4.2 Dodaj obrazki do featured articles**
```typescript
{
  slug: 'wybor-placowki',
  sectionId: 'wybor-opieki',
  category: 'Wybór opieki',
  featured: true,
  badge: 'POLECAMY',
  thumbnail: '/images/senior_opiekunka.webp'  // 🆕
},
{
  slug: 'typy-dps',
  featured: true,
  badge: 'NOWE',
  thumbnail: '/images/seniorzy_puzle.webp'  // 🆕
},
// ...
```

---

### FAZA 5: Testowanie (30 min)

**5.1 Test strony głównej**
- [ ] Karuzela artykułów wyświetla się poprawnie
- [ ] Obrazki się ładują
- [ ] Badge'y (POLECAMY, NOWE) działają
- [ ] Linki prowadzą do właściwych artykułów

**5.2 Test strony /poradniki**
- [ ] Wszystkie artykuły z głównej są dostępne
- [ ] Filtrowanie po kategoriach działa
- [ ] Obrazki się wyświetlają

**5.3 Test linków**
```bash
# Sprawdź wszystkie linki:
grep -r "href=\"/poradniki" --include="*.tsx" --include="*.ts"
```

**5.4 Test konsystencji danych**
- [ ] Wszystkie linki z KnowledgeCenter prowadzą do istniejących artykułów
- [ ] Nie ma 404
- [ ] Obrazki istnieją w `/public/images`

---

### FAZA 6: Cleanup (15 min)

**6.1 Usuń stary kod**
```typescript
// KnowledgeCenter.tsx - usuń:
const articles: Article[] = [
  { id: 1, title: '...', ... },  // ❌ USUŃ cały hardcoded array
  // ...
]
```

**6.2 Aktualizuj dokumentację**
- CLAUDE.md - opisz nowy system
- PROJEKT_DOKUMENTACJA.md - zaktualizuj strukturę

**6.3 Commit**
```bash
git add -A
git commit -m "feat: Unifikacja systemu artykułów - single source of truth

- articles.ts jest teraz jedynym źródłem danych
- Dodano sekcję finanse-prawne (połączenie finanse + prawne)
- KnowledgeCenter używa getFeaturedArticlesForHome()
- Dodano redirecty dla starych URL-i
- 100% artykułów ze strony głównej dostępnych w /poradniki"
```

---

## 📋 Checklist Finalny

### Przed wdrożeniem:
- [ ] Backup kodu (git commit checkpoint)
- [ ] Sprawdź czy dev server działa
- [ ] Lista wszystkich artykułów z KnowledgeCenter.tsx

### Po wdrożeniu:
- [ ] Wszystkie testy przeszły
- [ ] Żadnych błędów w konsoli
- [ ] Żadnych 404
- [ ] Obrazki się ładują
- [ ] Redirecty działają
- [ ] Dokumentacja zaktualizowana
- [ ] Commit + push

---

## 🎯 Korzyści po wdrożeniu

### Dla developera:
- ✅ Jeden plik do edycji (articles.ts)
- ✅ Zero duplikacji
- ✅ Łatwe dodawanie nowych artykułów
- ✅ TypeScript wymusza spójność

### Dla contentu:
- ✅ Wszystkie artykuły w jednym miejscu
- ✅ Spójne URL-e
- ✅ Łatwe zarządzanie featured/badge
- ✅ Obrazki w MDX lub articles.ts (do wyboru)

### Dla użytkownika:
- ✅ Spójne doświadczenie (główna ↔ /poradniki)
- ✅ Wszystkie artykuły dostępne
- ✅ Działa filtrowaniem i wyszukiwanie

---

## 🚀 Czas realizacji

| Faza | Czas |
|------|------|
| 1. Przygotowanie | 30 min |
| 2. Refaktoryzacja KnowledgeCenter | 1h |
| 3. Unifikacja nazw sekcji | 30 min |
| 4. Dodanie obrazków | 15 min |
| 5. Testowanie | 30 min |
| 6. Cleanup | 15 min |
| **TOTAL** | **3h** |

---

## 📝 Notatki

- Plan zakłada, że istniejące MDX files są OK
- Redirecty zapewnią backward compatibility
- Można wykonać fazami (nie wszystko naraz)
- Priorytet: Faza 1-2 (podstawowa unifikacja), reszta opcjonalna

---

**Status:** ✅ Plan gotowy do wdrożenia
**Następny krok:** Rozpocznij od FAZY 1 - Przygotowanie
