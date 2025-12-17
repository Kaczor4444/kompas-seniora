import PoradnikiContent from '@/components/poradniki/PoradnikiContent'
import { sections } from '@/data/articles'
import { enrichArticlesWithMetadata } from '@/lib/articleHelpers'

export default async function PoradnikiPage() {
  // Load and enrich articles server-side
  const allArticlesFlat = sections.flatMap(section =>
    section.articles.map(article => ({
      ...article,
      sectionId: section.id
    }))
  )

  const enrichedArticles = await enrichArticlesWithMetadata(allArticlesFlat)

  return (
    <PoradnikiContent initialArticles={enrichedArticles} isFullPage={true} showHero={true} />
  )
}
