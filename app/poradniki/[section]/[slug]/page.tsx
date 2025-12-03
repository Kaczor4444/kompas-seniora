import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import matter from 'gray-matter'
import fs from 'fs/promises'
import path from 'path'
import ArticleLayout from '@/components/articles/ArticleLayout'
import ArticleTracker from '@/components/articles/ArticleTracker'

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
        <MDXRemote source={article.content} />
      </ArticleLayout>
    </>
  )
}
