import PoradnikiContent from '@/components/poradniki/PoradnikiContent'
import { sections } from '@/data/articles'
import { enrichArticlesWithMetadata } from '@/lib/articleHelpers'

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function PoradnikiPage({ searchParams }: PageProps) {
  // Load and enrich articles server-side
  const allArticlesFlat = sections.flatMap(section =>
    section.articles.map(article => ({
      ...article,
      sectionId: section.id
    }))
  )

  const enrichedArticles = await enrichArticlesWithMetadata(allArticlesFlat)

  // Get category from search params (server-side)
  const params = await searchParams
  const initialCategory = params.category || 'Wszystkie'

  return (
    <PoradnikiContent
      initialArticles={enrichedArticles}
      isFullPage={true}
      showHero={true}
      initialCategory={initialCategory}
    />
  )
}
