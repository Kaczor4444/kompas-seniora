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

  // Warn in development when article has no MDX file
  if (process.env.NODE_ENV === 'development') {
    console.warn(`📝 Missing MDX file for article: ${article.slug} (showing placeholder)`)
  }

  // Fallback for articles without MDX files
  // Convert slug to readable title: "dodatek-pielegnacyjny" -> "Dodatek Pielęgnacyjny"
  const readableTitle = article.slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return {
    ...article,
    title: `[Placeholder] ${readableTitle}`,
    excerpt: 'Artykuł w przygotowaniu...',
    readTime: 5,
    publishedAt: '2025-12-03',
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
  // Warn in development when article has no MDX file
  if (process.env.NODE_ENV === 'development') {
    console.warn(`📝 Missing MDX file for article: ${slug} (showing placeholder)`)
  }

  // Convert slug to readable title: "dodatek-pielegnacyjny" -> "Dodatek Pielęgnacyjny"
  const readableTitle = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return {
    title: `[Placeholder] ${readableTitle}`,
    excerpt: 'Artykuł w przygotowaniu...',
    category,
    readTime: 5,
    publishedAt: '2025-12-03',
    featured: false,
  }
}
