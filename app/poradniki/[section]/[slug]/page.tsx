import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import matter from 'gray-matter'
import fs from 'fs/promises'
import path from 'path'
import ArticleLayout from '@/components/articles/ArticleLayout'
import ArticleTracker from '@/components/articles/ArticleTracker'
import ArticleSchema from '@/components/articles/ArticleSchema'
import KeyTakeaways from '@/components/articles/KeyTakeaways'
import InfoBox from '@/components/articles/InfoBox'
import WarningBox from '@/components/articles/WarningBox'
import Checklist from '@/components/articles/Checklist'
import ProcessTimeline from '@/components/articles/ProcessTimeline'
import { extractHeadings } from '@/lib/mdxUtils'

// Extract text from React children (handles strings and React elements)
function getTextFromChildren(children: any): string {
  if (typeof children === 'string') {
    return children
  }
  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join('')
  }
  if (children?.props?.children) {
    return getTextFromChildren(children.props.children)
  }
  return ''
}

// Generate ID from heading text (same logic as mdx-components.tsx and mdxUtils.ts)
function generateId(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (ą→a, ę→e, etc)
    .replace(/ł/g, 'l') // Polish ł → l
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric
    .replace(/\s+/g, '-') // Spaces to dashes
    .replace(/-+/g, '-') // Remove duplicate dashes
    .trim()
}

interface ArticleFrontmatter {
  title: string
  category: string
  excerpt: string
  readTime: number
  publishedAt: string
  updatedAt?: string
  featured?: boolean
  downloads?: Array<{ title: string; url: string; icon?: string }>
}

async function loadArticle(section: string, slug: string) {
  const filePath = path.join(
    process.cwd(),
    'content',
    'articles',
    section,
    `${slug}.mdx`
  )

  try {
    const source = await fs.readFile(filePath, 'utf8')
    const { content, data } = matter(source)
    return {
      content,
      frontmatter: data as ArticleFrontmatter
    }
  } catch (error) {
    return null
  }
}

// MDX components that can be used in articles
const components = {
  KeyTakeaways,
  InfoBox,
  WarningBox,
  Checklist,
  ProcessTimeline,
  h2: ({ children, ...props }: any) => {
    const text = getTextFromChildren(children)
    const id = text ? generateId(text) : undefined
    if (id) console.log('🏷️ H2 rendered with ID:', id, '- Text:', text.slice(0, 60)) // DEBUG
    return (
      <h2 id={id} className="scroll-mt-32" {...props}>
        {children}
      </h2>
    )
  },
  h3: ({ children, ...props }: any) => {
    const text = getTextFromChildren(children)
    const id = text ? generateId(text) : undefined
    if (id) console.log('🏷️ H3 rendered with ID:', id, '- Text:', text.slice(0, 60)) // DEBUG
    return (
      <h3 id={id} className="scroll-mt-32" {...props}>
        {children}
      </h3>
    )
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string; slug: string }>
}): Promise<Metadata> {
  const { section, slug } = await params
  const article = await loadArticle(section, slug)

  if (!article) {
    return {
      title: 'Artykuł nie znaleziony | Kompas Seniora',
    }
  }

  const { frontmatter } = article

  return {
    title: `${frontmatter.title} | Kompas Seniora`,
    description: frontmatter.excerpt,
    keywords: [
      'dom pomocy społecznej',
      'dps',
      'śds',
      'opieka senioralna',
      frontmatter.category,
    ],
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.excerpt,
      type: 'article',
      publishedTime: frontmatter.publishedAt,
      modifiedTime: frontmatter.updatedAt,
      authors: ['Kompas Seniora'],
      siteName: 'Kompas Seniora',
    },
    twitter: {
      card: 'summary_large_image',
      title: frontmatter.title,
      description: frontmatter.excerpt,
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ section: string; slug: string }>
}) {
  const { section, slug } = await params
  const article = await loadArticle(section, slug)

  if (!article) {
    notFound()
  }

  // Extract headings for TOC
  const headings = extractHeadings(article.content)

  return (
    <>
      <ArticleSchema
        title={article.frontmatter.title}
        excerpt={article.frontmatter.excerpt}
        publishedAt={article.frontmatter.publishedAt}
        updatedAt={article.frontmatter.updatedAt}
        category={article.frontmatter.category}
      />
      <ArticleTracker
        slug={slug}
        sectionId={section}
        title={article.frontmatter.title}
        category={article.frontmatter.category}
      />
      <ArticleLayout
        title={article.frontmatter.title}
        category={article.frontmatter.category}
        readTime={article.frontmatter.readTime}
        publishedAt={article.frontmatter.publishedAt}
        updatedAt={article.frontmatter.updatedAt}
        headings={headings}
        downloads={article.frontmatter.downloads}
      >
        <MDXRemote source={article.content} components={components} />
      </ArticleLayout>
    </>
  )
}
