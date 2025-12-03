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
  thumbnail?: string
}

export interface ArticleWithMetadata extends Article {
  // Metadata from MDX frontmatter:
  title: string
  excerpt: string
  readTime: number
  publishedAt: string
  updatedAt?: string
  thumbnail: string  // Always present (from MDX or fallback)
}

/**
 * Get fallback thumbnail for category
 * Uses themed Unsplash images for Polish senior care context
 */
function getCategoryThumbnail(category: string): string {
  const thumbnails: Record<string, string> = {
    'Wybór opieki': 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80', // Modern nursing home lobby
    'Dla opiekuna': 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800&q=80', // Caregiver holding elderly hand
    'Dla seniora': 'https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=800&q=80', // Happy senior reading
    'Finanse i świadczenia': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80', // Financial planning documents
    'Prawne aspekty': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80', // Legal documents signing
  }

  return thumbnails[category] || 'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&q=80' // Default: senior care
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

    // Add category fallback thumbnail if not specified in MDX
    return {
      ...data,
      thumbnail: data.thumbnail || getCategoryThumbnail(data.category || ''),
    } as ArticleMetadata
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
      thumbnail: metadata.thumbnail || getCategoryThumbnail(article.category),
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
    thumbnail: getCategoryThumbnail(article.category),
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
    thumbnail: getCategoryThumbnail(category),
  }
}
