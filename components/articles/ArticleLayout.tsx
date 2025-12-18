import React from 'react'
import Link from 'next/link'
import { ChevronRightIcon, ClockIcon, CalendarIcon, ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import TableOfContents from '@/components/articles/TableOfContents'
import ReadingProgressBar from '@/components/articles/ReadingProgressBar'

interface ArticleLayoutProps {
  children: React.ReactNode
  title: string
  category: string
  readTime: number
  publishedAt?: string
  updatedAt?: string
  headings?: Array<{ id: string; text: string; level: number }>
  downloads?: Array<{ title: string; url: string; icon?: string }>
}

const categoryMap: Record<string, { name: string; slug: string }> = {
  'wybor-opieki': { name: 'Wybór opieki', slug: 'wybor-opieki' },
  'dla-opiekuna': { name: 'Dla opiekuna', slug: 'dla-opiekuna' },
  'dla-seniora': { name: 'Dla seniora', slug: 'dla-seniora' },
  'finanse-i-swiadczenia': { name: 'Finanse i świadczenia', slug: 'finanse-i-swiadczenia' },
  'prawne-aspekty': { name: 'Prawne aspekty', slug: 'prawne-aspekty' },
  'finanse-prawne': { name: 'Finanse i prawne', slug: 'finanse-prawne' },
}

export default function ArticleLayout({
  children,
  title,
  category,
  readTime,
  publishedAt,
  updatedAt,
  headings = [],
  downloads = [],
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
      {/* Mobile reading progress bar */}
      <ReadingProgressBar />

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

      {/* Main container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">

        {/* Mobile TOC (above content) */}
        {headings.length > 0 && <TableOfContents headings={headings} downloads={downloads} variant="mobile" />}

        {/* Two-column layout: Content + Desktop TOC */}
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-12">

          {/* Main content */}
          <article className="max-w-4xl">
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
            <div className="prose prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:lg:text-4xl prose-h2:mt-16 prose-h2:mb-8 prose-h3:text-xl prose-h3:md:text-2xl prose-h3:font-semibold prose-h3:mt-12 prose-h3:mb-6 prose-p:text-lg prose-p:md:text-xl prose-p:leading-loose prose-p:mb-6 prose-p:md:mb-8 prose-p:text-gray-800 prose-a:text-emerald-600 prose-a:no-underline hover:prose-a:text-emerald-700 hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:space-y-3 prose-ol:space-y-3 prose-li:text-lg prose-li:md:text-xl prose-li:text-gray-800 prose-li:leading-loose prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-6 prose-blockquote:not-italic prose-img:rounded-lg prose-img:shadow-md space-y-8 md:space-y-12">
              {children}
            </div>

            {/* Download Section - Dark Background */}
            {downloads && downloads.length > 0 && (
              <div className="mt-16 -mx-4 md:-mx-6 lg:mx-0">
                <div className="bg-slate-900 rounded-none lg:rounded-2xl px-6 md:px-8 py-10 md:py-12">
                  <div className="max-w-3xl mx-auto text-center">
                    {/* Icon + Title */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <ArrowDownTrayIcon className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />
                      <h2 className="text-2xl md:text-3xl font-bold text-white">
                        Materiały do pobrania
                      </h2>
                    </div>

                    {/* Description */}
                    <p className="text-lg md:text-xl text-slate-300 mb-8">
                      Pobierz pomocne materiały i dokumenty do tego artykułu
                    </p>

                    {/* Download Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      {downloads.map((item, index) => (
                        <a
                          key={index}
                          href={item.url}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                          target={item.url.startsWith('http') ? '_blank' : undefined}
                          rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          <span className="text-2xl">{item.icon || '📄'}</span>
                          <span>{item.title}</span>
                          <ArrowDownTrayIcon className="w-5 h-5" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

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

          {/* Desktop TOC sidebar */}
          {headings.length > 0 && (
            <TableOfContents headings={headings} downloads={downloads} variant="desktop" />
          )}

        </div>
      </div>
    </div>
  )
}
