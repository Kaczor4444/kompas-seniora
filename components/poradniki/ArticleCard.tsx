'use client'

import Link from 'next/link'
import type { ArticleWithMetadata } from '@/lib/articleHelpers'

interface ArticleCardProps {
  article: ArticleWithMetadata
}

// Get category color based on category name
function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Wybór opieki': 'bg-emerald-100 text-emerald-800',
    'Dla opiekuna': 'bg-rose-100 text-rose-800',
    'Dla seniora': 'bg-blue-100 text-blue-800',
    'Finanse i świadczenia': 'bg-amber-100 text-amber-800',
    'Prawne aspekty': 'bg-purple-100 text-purple-800',
  }
  return colorMap[category] || 'bg-gray-100 text-gray-800'
}

// Get category icon emoji
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Wybór opieki': '🏥',
    'Dla opiekuna': '❤️',
    'Dla seniora': '👴',
    'Finanse i świadczenia': '💰',
    'Prawne aspekty': '⚖️',
  }
  return iconMap[category] || '📄'
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const categoryColor = getCategoryColor(article.category)
  const categoryIcon = getCategoryIcon(article.category)
  const isPlaceholder = article.title.includes('[Placeholder]') || article.excerpt.includes('w przygotowaniu')

  return (
    <Link
      href={`/poradniki/${article.sectionId}/${article.slug}`}
      className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 hover:scale-[1.01] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none flex flex-col"
    >
      {/* Icon Header */}
      <div className="relative aspect-[5/3] bg-gradient-to-br from-emerald-50 to-emerald-100 overflow-hidden flex items-center justify-center">
        <div className="text-6xl md:text-7xl opacity-80 group-hover:scale-110 transition-transform duration-300">
          {categoryIcon}
        </div>

        {/* Featured Badge */}
        {article.featured && !isPlaceholder && (
          <div className="absolute top-3 left-3">
            <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              POLECANY
            </span>
          </div>
        )}

        {/* Placeholder Badge */}
        {isPlaceholder && (
          <div className="absolute top-3 left-3">
            <span className="bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              W PRZYGOTOWANIU
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category Tag */}
        <div className="mb-2">
          <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${categoryColor}`}>
            {article.category}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors mb-2 line-clamp-2"
          title={article.title}
        >
          {article.title.replace('[Placeholder] ', '')}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3 flex-1">
          {article.excerpt}
        </p>

        {/* Read Time & Date */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{article.readTime} min</span>
          </div>
          {!isPlaceholder && (
            <time className="text-xs text-gray-400">
              {new Date(article.publishedAt).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </time>
          )}
        </div>
      </div>
    </Link>
  )
}
