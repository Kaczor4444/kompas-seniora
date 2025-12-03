import React from 'react'
import Link from 'next/link'
import { ChevronRightIcon, ClockIcon, CalendarIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

interface ArticleLayoutProps {
  children: React.ReactNode
  title: string
  category: string
  readTime: number
  publishedAt?: string
  updatedAt?: string
}

const categoryMap: Record<string, { name: string; slug: string }> = {
  'wybor-opieki': { name: 'Wybór opieki', slug: 'wybor-opieki' },
  'dla-opiekuna': { name: 'Dla opiekuna', slug: 'dla-opiekuna' },
  'dla-seniora': { name: 'Dla seniora', slug: 'dla-seniora' },
  'finanse-i-swiadczenia': { name: 'Finanse i świadczenia', slug: 'finanse-i-swiadczenia' },
  'prawne-aspekty': { name: 'Prawne aspekty', slug: 'prawne-aspekty' },
}

export default function ArticleLayout({
  children,
  title,
  category,
  readTime,
  publishedAt,
  updatedAt,
}: ArticleLayoutProps) {
  const categoryInfo = categoryMap[category] || { name: category, slug: category }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <ol className="flex items-center space-x-2 text-sm md:text-base">
            <li>
              <Link
                href="/"
                className="text-gray-600 hover:text-emerald-600 transition-colors"
              >
                Strona główna
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
              <Link
                href="/poradniki"
                className="text-gray-600 hover:text-emerald-600 transition-colors"
              >
                Poradniki
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
              <Link
                href={`/poradniki/${categoryInfo.slug}`}
                className="text-gray-600 hover:text-emerald-600 transition-colors"
              >
                {categoryInfo.name}
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
              <span className="text-gray-900 font-medium truncate max-w-[200px] md:max-w-none">
                {title}
              </span>
            </li>
          </ol>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-4xl mx-auto py-8 md:py-12 px-4 md:px-6">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          {/* Category Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
              {categoryInfo.name}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-gray-600">
            {/* Read Time */}
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 md:h-6 md:w-6" />
              <span className="text-base md:text-lg">
                {readTime} {readTime === 1 ? 'minuta' : readTime < 5 ? 'minuty' : 'minut'} czytania
              </span>
            </div>

            {/* Published Date */}
            {publishedAt && (
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 md:h-6 md:w-6" />
                <span className="text-base md:text-lg">
                  {formatDate(publishedAt)}
                </span>
              </div>
            )}

            {/* Updated Date */}
            {updatedAt && updatedAt !== publishedAt && (
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-sm md:text-base">
                  Zaktualizowano: {formatDate(updatedAt)}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-lg prose-p:md:text-xl prose-p:leading-relaxed prose-p:mb-4 prose-p:text-gray-800 prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:text-emerald-700 hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:space-y-2 prose-ol:space-y-2 prose-li:text-lg prose-li:md:text-xl prose-li:text-gray-800 prose-li:leading-relaxed prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-6 prose-blockquote:not-italic prose-img:rounded-lg prose-img:shadow-md space-y-6">
          {children}
        </div>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/poradniki"
            className="inline-flex items-center gap-2 text-lg md:text-xl text-emerald-600 hover:text-emerald-700 font-medium transition-colors group"
          >
            <ArrowLeftIcon className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:-translate-x-1" />
            Powrót do poradników
          </Link>
        </div>
      </article>
    </div>
  )
}
