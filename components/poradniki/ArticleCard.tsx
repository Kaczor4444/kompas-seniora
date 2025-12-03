'use client'

import Link from 'next/link'
import type { ArticleWithMetadata } from '@/lib/articleHelpers'

interface ArticleCardProps {
  article: ArticleWithMetadata
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const isPlaceholder = article.excerpt === 'Artykuł w przygotowaniu...'

  return (
    <Link
      href={`/poradniki/${article.sectionId}/${article.slug}`}
      className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 hover:scale-[1.01] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none flex flex-col"
    >
      {/* Image Header */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={article.thumbnail}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Featured Badge */}
        {article.featured && !isPlaceholder && (
          <div className="absolute top-3 right-3">
            <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              POLECANY
            </span>
          </div>
        )}

        {/* Placeholder Badge */}
        {isPlaceholder && (
          <div className="absolute top-3 left-3">
            <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              W PRZYGOTOWANIU
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Category Tag */}
        <div className="mb-2">
          <span className="text-xs font-semibold text-emerald-600">
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors"
          title={article.title}
        >
          {article.title.replace('[Placeholder] ', '')}
        </h3>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-2 flex-1">
          {article.excerpt}
        </p>

        {/* Read Time */}
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{article.readTime} min czytania</span>
        </div>
      </div>
    </Link>
  )
}
