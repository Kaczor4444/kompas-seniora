'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Clock,
  Search,
  BookOpen,
  Tag,
  User,
  UserCheck,
  Bookmark,
  Building2,
  Scale,
  TrendingUp,
  ArrowLeft
} from 'lucide-react'
import type { ArticleWithMetadata } from '@/lib/articleHelpers'

interface PoradnikiContentProps {
  initialArticles: ArticleWithMetadata[]
  isFullPage?: boolean
  onBack?: () => void
  showHero?: boolean
  initialCategory?: string
}

const categories = ["Wszystkie", "Wybór opieki", "Dla opiekuna", "Dla seniora", "Finanse", "Prawne", "Zakładki"]
const popularTags = ["Koszty DPS 2025", "Wniosek do MOPS", "Różnice DPS vs ŚDS", "Dodatek pielęgnacyjny", "Prawa mieszkańców"]

// Icon mapping for categories
const categoryIcons: Record<string, any> = {
  "Zakładki": Bookmark,
  "Dla opiekuna": UserCheck,
  "Dla seniora": User,
  "Finanse": TrendingUp,
  "Wybór opieki": Building2,
  "Prawne": Scale,
}

export default function PoradnikiContent({
  initialArticles,
  isFullPage = true,
  onBack,
  showHero = true,
  initialCategory = "Wszystkie"
}: PoradnikiContentProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [searchQuery, setSearchQuery] = useState("")
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([])

  // Update activeCategory when initialCategory prop changes
  useEffect(() => {
    setActiveCategory(initialCategory)
  }, [initialCategory])

  // Load saved articles from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedArticles')
    if (saved) {
      setSavedArticleIds(JSON.parse(saved))
    }
  }, [])

  // Toggle save article
  const toggleSave = (articleId: string) => {
    const newSaved = savedArticleIds.includes(articleId)
      ? savedArticleIds.filter(id => id !== articleId)
      : [...savedArticleIds, articleId]

    setSavedArticleIds(newSaved)
    localStorage.setItem('savedArticles', JSON.stringify(newSaved))
  }

  // Filtering Logic
  const filteredArticles = initialArticles.filter(article => {
    // Logic for "Zakładki" Tab
    if (activeCategory === "Zakładki") {
      const articleId = `${article.sectionId}-${article.slug}`
      if (!savedArticleIds.includes(articleId)) return false
    } else {
      const matchesCategory = activeCategory === "Wszystkie" || article.category === activeCategory
      if (!matchesCategory) return false
    }

    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Display subset if not full page
  const displayArticles = isFullPage ? filteredArticles : filteredArticles.slice(0, 3)

  // Popular articles for sidebar (top 5 by featured or first 5)
  const popularArticles = [...initialArticles]
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
    .slice(0, 5)

  return (
    <section className={`bg-stone-50 ${isFullPage ? 'min-h-screen pb-24' : 'py-12 md:py-24'}`}>

      {/* FULL PAGE HEADER - V2 STYLE */}
      {isFullPage && showHero && (
        <div className="bg-emerald-600 text-white relative overflow-hidden mb-8 md:mb-12">
          {/* Decorative Icon */}
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <BookOpen size={400} className="-mr-20 -mt-20" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
            <Link
              href="/"
              className="group flex items-center gap-2 text-emerald-100 hover:text-white font-bold mb-6 md:mb-8 transition-colors px-4 py-2 rounded-xl hover:bg-emerald-700/50 w-fit"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-700/50 border border-emerald-500 flex items-center justify-center group-hover:border-white/50 transition-colors">
                <ArrowLeft size={16} />
              </div>
              Wróć do strony głównej
            </Link>

            <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 md:mb-6 text-center md:text-left">
              Potrzebujesz pomocy w opiece?
            </h1>
            <p className="text-emerald-100 text-lg mb-8 max-w-2xl text-center md:text-left">
              Przeszukaj naszą bazę wiedzy. Znajdziesz tu poradniki o finansach, prawie i codziennej opiece nad seniorem.
            </p>

            {/* Main Search Bar */}
            <div className="max-w-2xl relative mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
              <input
                type="text"
                placeholder="Wpisz temat (np. wniosek do dps, koszty, demencja)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-4 rounded-xl bg-white text-slate-900 placeholder:text-slate-500 border border-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-400 shadow-xl"
              />
            </div>

            {/* Popular Tags */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-emerald-200 text-sm font-bold mr-2">Najczęściej wyszukiwane:</span>
              {popularTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="bg-emerald-700/50 hover:bg-white hover:text-emerald-700 text-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-emerald-500"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Two-column layout: Content + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">

          {/* LEFT CONTENT AREA */}
          <div className="flex-1 min-w-0">

            {/* Filter Tabs - V2 STYLE */}
            <div id="filtry" className="relative group mb-4 md:mb-8 scroll-mt-24">
              <div className="flex overflow-x-auto lg:overflow-x-visible pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap lg:justify-center scrollbar-hide gap-2 items-center snap-x">
                {categories.map((cat) => {
                  const Icon = categoryIcons[cat]
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`whitespace-nowrap snap-start px-4 py-2 md:px-5 md:py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 group flex-shrink-0 ${
                        activeCategory === cat
                          ? (cat === 'Zakładki' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-white shadow-md')
                          : (cat === 'Zakładki' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:border-emerald-400' : 'bg-white text-slate-600 border border-stone-200 hover:border-emerald-400 hover:text-emerald-700')
                      }`}
                    >
                      {Icon && <Icon size={16} className={cat === "Zakładki" && activeCategory === 'Zakładki' ? 'fill-white' : ''} />}
                      <span>{cat}</span>

                      {/* Counter Badge for Zakładki */}
                      {cat === "Zakładki" && savedArticleIds.length > 0 && (
                        <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full leading-none transition-colors ${
                          activeCategory === 'Zakładki'
                            ? 'bg-white text-emerald-600'
                            : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200'
                        }`}>
                          {savedArticleIds.length}
                        </span>
                      )}
                    </button>
                  )
                })}
                <div className="w-4 md:hidden flex-shrink-0"></div>
              </div>

              {/* Mobile Gradient Scroll Hint */}
              <div className="absolute -right-4 top-0 bottom-0 w-12 bg-gradient-to-l from-stone-50 to-transparent pointer-events-none lg:hidden z-10"></div>
            </div>

            {/* Empty State for Zakładki */}
            {activeCategory === "Zakładki" && filteredArticles.length === 0 && (
              <div className="text-center py-12 md:py-20 bg-white rounded-3xl border border-stone-100 border-dashed">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-300">
                  <Bookmark size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Twoje zakładki są puste</h3>
                <p className="text-slate-500 mt-2 text-sm md:text-base">Kliknij ikonę zakładki przy artykule, aby dodać go do listy.</p>
              </div>
            )}

            {/* Articles Grid / Carousel Logic - V2 STYLE */}
            <div className={`
              ${isFullPage
                ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
                : 'flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 -mx-4 px-4 md:grid md:grid-cols-3 md:gap-8 md:pb-0 md:mx-0 md:px-0 scrollbar-hide'
              }
            `}>
              {displayArticles.map((article) => {
                const articleId = `${article.sectionId}-${article.slug}`
                const isSaved = savedArticleIds.includes(articleId)
                const isPlaceholder = article.excerpt === 'Artykuł w przygotowaniu...'

                return (
                  <article
                    key={articleId}
                    className={`
                      bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col border border-stone-100 relative
                      ${!isFullPage ? 'min-w-[85vw] sm:min-w-[350px] md:min-w-0 snap-center h-auto md:h-full' : 'h-full'}
                    `}
                  >

                    {/* Badges (Top Left) - V2 STYLE */}
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start pointer-events-none">
                      {article.featured && !isPlaceholder && (
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          POLECAMY
                        </span>
                      )}
                      {isPlaceholder && (
                        <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          WKRÓTCE
                        </span>
                      )}
                    </div>

                    {/* Bookmark Button (Top Right) - V2 STYLE */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleSave(articleId)
                      }}
                      className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
                      title={isSaved ? "Usuń z zakładek" : "Dodaj do zakładek"}
                    >
                      <Bookmark
                        size={20}
                        className={`transition-colors ${isSaved ? 'fill-emerald-600 text-emerald-600' : 'text-slate-400 hover:text-emerald-600'}`}
                      />
                    </button>

                    {/* Image - V2 STYLE */}
                    <Link href={`/poradniki/${article.sectionId}/${article.slug}`} className="block">
                      <div className="relative h-48 overflow-hidden bg-stone-100">
                        <img
                          src={article.thumbnail}
                          alt={article.title}
                          loading="lazy"
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    </Link>

                    {/* Content - V2 STYLE */}
                    <Link href={`/poradniki/${article.sectionId}/${article.slug}`} className="p-6 flex flex-col flex-grow">
                      {/* Category & Read Time */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          <Tag size={12} /> {article.category}
                        </span>
                        <div className="flex items-center text-slate-400 text-xs font-medium">
                          <Clock size={14} className="mr-1" /> {article.readTime} min
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-slate-900 mb-3 font-serif leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {article.title.replace('[Placeholder] ', '')}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                        {article.excerpt}
                      </p>

                      {/* CTA */}
                      <div className="pt-4 border-t border-stone-100 mt-auto">
                        <span className="inline-flex items-center text-slate-800 font-bold text-sm group-hover:text-emerald-600 transition-colors">
                          Czytaj dalej <ArrowRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  </article>
                )
              })}
            </div>

            {!isFullPage && (
              <div className="mt-8 md:mt-12 text-center">
                <Link
                  href="/poradniki"
                  className="bg-white border-2 border-stone-200 text-slate-700 font-bold py-3 px-8 rounded-xl hover:border-slate-800 hover:text-slate-900 transition-all w-full md:w-auto inline-block"
                >
                  Zobacz wszystkie poradniki ({initialArticles.length})
                </Link>
              </div>
            )}
          </div>

          {/* SIDEBAR - V2 STYLE (Only visible on Desktop Full Page View) */}
          {isFullPage && (
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm sticky top-32">
                <h3 className="font-bold font-serif text-xl mb-6 flex items-center gap-2">
                  <TrendingUp className="text-emerald-600" /> Najczęściej czytane
                </h3>

                <div className="space-y-6">
                  {popularArticles.map((article, index) => (
                    <Link
                      key={`popular-${article.sectionId}-${article.slug}`}
                      href={`/poradniki/${article.sectionId}/${article.slug}`}
                      className="group cursor-pointer flex items-start gap-4"
                    >
                      <span className="text-3xl font-serif font-bold text-stone-200 group-hover:text-emerald-200 transition-colors flex-shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight group-hover:text-emerald-700 transition-colors mb-1">
                          {article.title.replace('[Placeholder] ', '')}
                        </h4>
                        <span className="text-xs text-slate-400">{article.category}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          )}

        </div>
      </div>
    </section>
  )
}
