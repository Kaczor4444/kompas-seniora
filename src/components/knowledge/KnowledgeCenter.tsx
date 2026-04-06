'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Building2, UserCheck, User, TrendingUp, Scale, Bookmark } from 'lucide-react'
import type { ArticleWithMetadata } from '@/lib/articleHelpers'

// Article type for KnowledgeCenter display
type KnowledgeCenterArticle = {
  id: string
  title: string
  excerpt: string
  category: string
  badge: 'POLECAMY' | 'NOWE' | 'NOWY ARTYKUŁ' | 'WKRÓTCE'
  href: string
  isPlaceholder: boolean
  isActive: boolean
  readingTime: string
  imageUrl?: string
}

interface KnowledgeCenterProps {
  articles: ArticleWithMetadata[]
}

export default function KnowledgeCenter({ articles: featuredArticles }: KnowledgeCenterProps) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [activeFilter, setActiveFilter] = useState('Wszystkie')
  const [savedArticles, setSavedArticles] = useState<string[]>([])  // Changed to string[] for articleId
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Map featured articles to KnowledgeCenter format
  const articles: KnowledgeCenterArticle[] = featuredArticles.map((article) => {
    const articleId = `${article.sectionId}-${article.slug}`
    const href = `/poradniki/${article.sectionId}/${article.slug}`
    const isPlaceholder = article.excerpt === 'Artykuł w przygotowaniu...'

    return {
      id: articleId,
      title: article.title.replace('[Placeholder] ', ''),
      excerpt: article.excerpt,
      category: article.category,
      badge: article.badge || 'WKRÓTCE',
      href,
      isPlaceholder,
      isActive: article.isActive !== false,  // Default true
      readingTime: `${article.readTime} min`,
      imageUrl: article.thumbnail
    }
  })

  const scrollLeft = () => {
    if (!scrollContainerRef.current) return
    const scrollAmount = 400
    scrollContainerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
  }

  const scrollRight = () => {
    if (!scrollContainerRef.current) return
    const scrollAmount = 400
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    setScrollPosition(scrollContainerRef.current.scrollLeft)
  }

  const toggleSave = (id: string, title: string) => {
    const isAdding = !savedArticles.includes(id)

    setSavedArticles(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

    setToastMessage(isAdding ? '✓ Dodano do zakładek' : '✗ Usunięto z zakładek')
    setShowToast(true)

    setTimeout(() => setShowToast(false), 3000)
  }

  // Filter articles - hide inactive (WKRÓTCE) articles
  const filteredArticles = activeFilter === 'Zakładki'
    ? articles.filter(a => savedArticles.includes(a.id) && a.isActive)
    : activeFilter === 'Wszystkie'
      ? articles.filter(a => a.isActive)
      : articles.filter(a => a.category === activeFilter && a.isActive)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') scrollLeft()
      if (e.key === 'ArrowRight') scrollRight()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Calculate button states
  const isAtStart = scrollPosition <= 10
  const isAtEnd = scrollContainerRef.current
    ? scrollPosition >= (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth - 10)
    : false

  return (
    <section className="py-4 bg-white">
      <div className="max-w-6xl mx-auto px-3">

        {/* Kategorie/Tagi - V2 with Icons */}
        <div className="lg:hidden flex flex-nowrap overflow-x-auto scrollbar-hide gap-3 mb-4 px-1 pb-1">
          <button
            onClick={() => setActiveFilter('Wszystkie')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all inline-flex items-center gap-2 ${
              activeFilter === 'Wszystkie'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            Wszystkie
          </button>
          <button
            onClick={() => setActiveFilter('Wybór opieki')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all inline-flex items-center gap-2 ${
              activeFilter === 'Wybór opieki'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <Building2 size={16} />
            Wybór opieki
          </button>
          <button
            onClick={() => setActiveFilter('Dla opiekuna')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all inline-flex items-center gap-2 ${
              activeFilter === 'Dla opiekuna'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <UserCheck size={16} />
            Dla opiekuna
          </button>
          <button
            onClick={() => setActiveFilter('Dla seniora')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all inline-flex items-center gap-2 ${
              activeFilter === 'Dla seniora'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <User size={16} />
            Dla seniora
          </button>
          <button
            onClick={() => setActiveFilter('Finanse')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all inline-flex items-center gap-2 ${
              activeFilter === 'Finanse'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <TrendingUp size={16} />
            Finanse
          </button>
          <button
            onClick={() => setActiveFilter('Prawne')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all inline-flex items-center gap-2 ${
              activeFilter === 'Prawne'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <Scale size={16} />
            Prawne
          </button>
          <button
            onClick={() => setActiveFilter('Zakładki')}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium text-sm transition-all inline-flex items-center gap-2 ${
              activeFilter === 'Zakładki'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <Bookmark size={16} className={activeFilter === 'Zakładki' ? 'fill-white' : ''} />
            Zakładki
          </button>
        </div>

        {/* Desktop & Mobile: Horizontal Scroll with Arrows (Desktop only) */}
        <div className="relative">
          {/* Left Arrow (Desktop only) */}
          <button
            onClick={scrollLeft}
            disabled={isAtStart}
            className={`
              hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-20
              w-12 h-12 items-center justify-center
              bg-white hover:bg-emerald-600 hover:text-white
              rounded-full shadow-lg border border-gray-200
              transition-all duration-200
              focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
              ${isAtStart ? 'opacity-30 cursor-not-allowed' : 'opacity-90 hover:opacity-100'}
            `}
            aria-label="Przewiń w lewo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2 px-1"
            onScroll={handleScroll}
          >
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={article.href}
                aria-label={article.title}
                className={`group flex-shrink-0 snap-start w-[280px] md:w-[340px] max-w-[340px] ${!article.isActive ? 'pointer-events-none' : ''}`}
              >
                <article className={`bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow h-full relative ${!article.isActive ? 'opacity-75' : ''}`}>
                  {/* Bookmark button - top right */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleSave(article.id, article.title)
                    }}
                    className="absolute top-3 right-4 z-20 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    <Bookmark
                      size={20}
                      className={savedArticles.includes(article.id) ? 'fill-emerald-600 text-emerald-600' : 'text-slate-400'}
                    />
                  </button>

                  {/* Badge - top left */}
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold z-10 ${
                    article.badge === 'POLECAMY' ? 'bg-emerald-100 text-emerald-800 animate-pulse' :
                    article.badge === 'NOWE' ? 'bg-blue-100 text-blue-800' :
                    article.badge === 'NOWY ARTYKUŁ' ? 'bg-emerald-100 text-emerald-800 animate-pulse' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {article.badge}
                  </div>

                  {/* Image or Placeholder */}
                  {article.isPlaceholder && !article.imageUrl ? (
                    <div className="relative h-36 bg-slate-200 flex items-center justify-center">
                      <h3 className="text-2xl font-black text-slate-600 tracking-tight">Poradnik Seniora</h3>

                      {/* Category badge ON image - bottom left */}
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                          {article.category.toUpperCase()}
                        </span>
                      </div>

                      {/* Reading time - bottom right */}
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 text-slate-600 shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium">{article.readingTime}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={article.imageUrl || "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80"}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />

                      {/* Category badge ON image - bottom left */}
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                          {article.category.toUpperCase()}
                        </span>
                      </div>

                      {/* Reading time - bottom right */}
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 text-slate-600 shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium">{article.readingTime}</span>
                      </div>
                    </div>
                  )}

                  {/* Content - NO category tag here */}
                  <div className="p-4">
                    <h3 className="text-base font-bold text-slate-900 mb-2 tracking-tight">
                      {article.title}
                    </h3>
                    <p className="text-neutral-700 text-sm mb-2">
                      {article.excerpt}
                    </p>
                    <span className={`text-sm font-medium inline-flex items-center gap-1 ${
                      article.isActive ? 'text-emerald-600' : 'text-gray-500 opacity-50 cursor-not-allowed'
                    }`}>
                      {article.isActive ? 'Czytaj dalej →' : 'W przygotowaniu'}
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Right Arrow (Desktop only) */}
          <button
            onClick={scrollRight}
            disabled={isAtEnd}
            className={`
              hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-20
              w-12 h-12 items-center justify-center
              bg-white hover:bg-emerald-600 hover:text-white
              rounded-full shadow-lg border border-gray-200
              transition-all duration-200
              focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
              ${isAtEnd ? 'opacity-30 cursor-not-allowed' : 'opacity-90 hover:opacity-100'}
            `}
            aria-label="Przewiń w prawo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* CTA dla więcej artykułów */}
        <div className="text-center mt-4">
          <Link href="/poradniki" className="bg-slate-900 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all active:scale-95 inline-flex items-center gap-2">
            Zobacz wszystkie poradniki ({articles.filter(a => a.isActive).length})
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10">
            {toastMessage.includes('✓') ? (
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </section>
  )
}
