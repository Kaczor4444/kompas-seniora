import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import type { Article } from '@/types/article'

export interface ArticleMetadata {
  title: string
  excerpt: string
  category: string
  readTime: number
  publishedAt: string
  updatedAt?: string
  featured?: boolean
}

export interface ArticleWithMetadata extends Article {
  // Metadata from MDX frontmatter:
  title: string
  excerpt: string
  readTime: number
  publishedAt: string
  updatedAt?: string
}

/**
 * Load article metadata from MDX frontmatter
 * Returns null if file doesn't exist or parsing fails
 */
export async function loadArticleMetadata(
  sectionId: string,
  slug: string
): Promise<ArticleMetadata | null> {
  const filePath = path.join(
    process.cwd(),
    'content',
    'articles',
    sectionId,
    `${slug}.mdx`
  )

  try {
    const source = await fs.readFile(filePath, 'utf8')
    const { data } = matter(source)
    return data as ArticleMetadata
  } catch (error) {
    // File doesn't exist or parsing failed
    return null
  }
}

/**
 * Enrich a single article with metadata from MDX frontmatter
 * Falls back to placeholder data if MDX doesn't exist
 */
export async function enrichArticleWithMetadata(
  article: Article
): Promise<ArticleWithMetadata> {
  const metadata = await loadArticleMetadata(article.sectionId, article.slug)

  if (metadata) {
    return {
      ...article,
      title: metadata.title,
      excerpt: metadata.excerpt,
      readTime: metadata.readTime,
      publishedAt: metadata.publishedAt,
      updatedAt: metadata.updatedAt,
    }
  }

  // Fallback for articles without MDX files
  return {
    ...article,
    title: `[Placeholder] ${article.slug}`,
    excerpt: 'Ten artykuł jest w przygotowaniu.',
    readTime: 5,
    publishedAt: new Date().toISOString().split('T')[0],
  }
}

/**
 * Enrich multiple articles with metadata from MDX frontmatter
 * Processes all articles in parallel for better performance
 */
export async function enrichArticlesWithMetadata(
  articles: Article[]
): Promise<ArticleWithMetadata[]> {
  return Promise.all(articles.map(enrichArticleWithMetadata))
}

/**
 * Get placeholder metadata for an article without MDX file
 * Useful for consistent fallback behavior
 */
export function getPlaceholderMetadata(slug: string, category: string): ArticleMetadata {
  return {
    title: `[Placeholder] ${slug}`,
    excerpt: 'Ten artykuł jest w przygotowaniu.',
    category,
    readTime: 5,
    publishedAt: new Date().toISOString().split('T')[0],
    featured: false,
  }
}
