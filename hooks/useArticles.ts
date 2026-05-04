import { useMemo } from 'react'
import type { ArticleWithMetadata } from '@/lib/articleHelpers'

interface UseArticlesParams {
  articles: ArticleWithMetadata[]
  searchQuery: string
  activeCategory: string
  sortBy: string
}

interface UseArticlesReturn {
  allArticles: ArticleWithMetadata[]
  popularArticles: ArticleWithMetadata[]
  resultCount: number
}

export function useArticles({
  articles,
  searchQuery,
  activeCategory,
  sortBy,
}: UseArticlesParams): UseArticlesReturn {
  // Filter articles
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      // Category filter
      if (activeCategory !== 'Wszystkie' && article.category !== activeCategory) {
        return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        return (
          article.title.toLowerCase().includes(query) ||
          article.excerpt.toLowerCase().includes(query) ||
          article.category.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [articles, searchQuery, activeCategory])

  // Sort articles
  const sortedArticles = useMemo(() => {
    const sorted = [...filteredArticles]

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        )
      case 'popular':
        return sorted.filter(a => a.badge && a.badge !== 'WKRÓTCE')
      case 'recommended':
      default:
        // Articles with badge first, then by date
        return sorted.sort((a, b) => {
          const aFeatured = !!(a.badge && a.badge !== 'WKRÓTCE')
          const bFeatured = !!(b.badge && b.badge !== 'WKRÓTCE')
          if (aFeatured && !bFeatured) return -1
          if (!aFeatured && bFeatured) return 1
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        })
    }
  }, [filteredArticles, sortBy])

  // Popular articles (featured ones)
  const popularArticles = useMemo(() => {
    return articles
      .filter(a => a.badge && a.badge !== 'WKRÓTCE')
      .slice(0, 5)
  }, [articles])

  return {
    allArticles: sortedArticles,
    popularArticles,
    resultCount: sortedArticles.length,
  }
}
