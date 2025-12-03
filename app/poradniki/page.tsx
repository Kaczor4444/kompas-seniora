import Hero from '@/components/poradniki/sections/Hero'
import Breadcrumbs from '@/components/poradniki/sections/Breadcrumbs'
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
    <div className="min-h-screen bg-gray-50">
      <Breadcrumbs activeCategory="Wszystkie" />

      <Hero />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <PoradnikiContent initialArticles={enrichedArticles} />
      </div>
    </div>
  )
}
