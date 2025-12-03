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

interface ArticleFrontmatter {
  title: string
  category: string
  excerpt: string
  readTime: number
  publishedAt: string
  updatedAt?: string
  featured?: boolean
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
}

export async function generateMetadata({
  params,
}: {
  params: { section: string; slug: string }
}): Promise<Metadata> {
  const article = await loadArticle(params.section, params.slug)

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
  params: { section: string; slug: string }
}) {
  const { section, slug } = params
  const article = await loadArticle(section, slug)

  if (!article) {
    notFound()
  }

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
      >
        <MDXRemote source={article.content} components={components} />
      </ArticleLayout>
    </>
  )
}
