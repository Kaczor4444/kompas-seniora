import { useMemo } from 'react';
import type { Section, ArticleWithSection } from '@/types/article';

interface UseArticlesParams {
  sections: Section[];
  searchQuery: string;
  activeCategory: string;
  sortBy: string;
}

interface UseArticlesReturn {
  allArticles: ArticleWithSection[];
  popularArticles: ArticleWithSection[];
  resultCount: number;
}

export function useArticles({
  sections,
  searchQuery,
  activeCategory,
  sortBy,
}: UseArticlesParams): UseArticlesReturn {
  const allArticles = useMemo(() => {
    let articles = sections.flatMap(section =>
      section.articles.map(article => ({
        ...article,
        sectionId: section.id,
        sectionTitle: section.title,
      }))
    );

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (activeCategory !== 'Wszystkie') {
      articles = articles.filter(article => article.category === activeCategory);
    }

    // Sort articles
    switch (sortBy) {
      case 'newest':
        articles = [...articles].sort((a, b) => {
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return 0;
        });
        break;
      case 'popular':
        articles = [...articles].sort((a, b) => {
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return 0;
        });
        break;
      case 'recommended':
        articles = [...articles].sort((a, b) => {
          const scoreA = (a.isPopular ? 2 : 0) + (a.isNew ? 1 : 0);
          const scoreB = (b.isPopular ? 2 : 0) + (b.isNew ? 1 : 0);
          return scoreB - scoreA;
        });
        break;
    }

    return articles;
  }, [sections, searchQuery, activeCategory, sortBy]);

  const popularArticles = useMemo(() => {
    return allArticles.filter(a => a.isPopular).slice(0, 5);
  }, [allArticles]);

  return {
    allArticles,
    popularArticles,
    resultCount: allArticles.length,
  };
}
