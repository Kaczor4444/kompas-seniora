'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import SearchBar from '@/components/poradniki/SearchBar';
import CategoryFilters from '@/components/poradniki/CategoryFilters';
import SortDropdown from '@/components/poradniki/SortDropdown';
import ArticleCard from '@/components/poradniki/ArticleCard';
import type { Article, Section } from '@/types/article';
import { categories } from '@/data/categories';
import { sections } from '@/data/articles';
import { useArticles } from '@/hooks/useArticles';

export default function PoradnikiPage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Wszystkie');
  const [sortBy, setSortBy] = useState('popular');
  const [showPopularModal, setShowPopularModal] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  const scrollToFilters = () => {
    const el = document.getElementById('filters-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveCategory('Wszystkie');
    setSortBy('popular');
    setShowPopularModal(false);
    scrollToFilters();
  };

  const { allArticles, popularArticles, resultCount } = useArticles({
    sections,
    searchQuery,
    activeCategory,
    sortBy,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <ol className="flex items-center space-x-2 text-sm md:text-base">
            <li>
              <Link href="/" className="text-gray-500 hover:text-emerald-700 transition-colors">
                Strona główna
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/poradniki" className={activeCategory !== 'Wszystkie' ? 'text-gray-500 hover:text-emerald-700 transition-colors' : 'text-gray-900 font-medium'}>
                Poradniki
              </Link>
            </li>
            {activeCategory !== 'Wszystkie' && (
              <>
                <li className="text-gray-400">/</li>
                <li className="text-gray-900 font-medium" aria-current="page">
                  {activeCategory}
                </li>
              </>
            )}
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-6 md:py-20 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=1920&q=80"
            alt="Senior z opiekunem"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-emerald-700/90"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 drop-shadow-lg">
            Poradniki dla Seniorów i Opiekunów
          </h1>
          <p className="text-base md:text-xl lg:text-2xl text-emerald-50 max-w-2xl drop-shadow leading-relaxed">
            <span className="hidden sm:inline">Praktyczne przewodniki - wszystko, co musisz wiedzieć o opiece, finansach i prawach seniora w jednym miejscu</span>
            <span className="sm:hidden">Praktyczne przewodniki o opiece, finansach i prawach seniora</span>
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">

        {/* SearchBar + Filters + Sort */}
        <div id="filters-section" className="sticky top-16 z-40 bg-gray-50 py-3 -mx-4 px-4 md:-mx-6 md:px-6 shadow-sm mb-4 md:mb-8 space-y-4">
          <SearchBar onSearch={setSearchQuery} />
          <div className="flex flex-wrap gap-2 md:gap-4 items-start justify-between">
            <CategoryFilters
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />

            <div className="flex gap-2 items-center">
              <SortDropdown onSortChange={setSortBy} />

              {(searchQuery || activeCategory !== 'Wszystkie') && (
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-all min-h-[44px] flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Wyczyść filtry
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Layout: Main Content + Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main Content Area - Sections */}
          <div className="flex-1">

            {/* Mobile: Najczęściej czytane button */}
            <button
              onClick={() => setShowPopularModal(!showPopularModal)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg font-semibold text-xs text-gray-900 hover:border-emerald-500 hover:text-emerald-700 transition-all min-h-[44px] mb-3"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Najczęściej czytane</span>
              <svg className={`w-4 h-4 transition-transform ${showPopularModal ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Mobile: Modal "Najczęściej czytane" */}
            {showPopularModal && (
              <div className="lg:hidden mb-4 bg-white border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  {popularArticles.map((article, index) => (
                    <Link
                      key={`mobile-popular-${article.sectionId}-${article.slug}`}
                      href={`/poradniki/${article.sectionId}/${article.slug}`}
                      className="group flex gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-all"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-gray-900 group-hover:text-emerald-700 line-clamp-2" title={article.title}>
                          {article.title}
                        </h4>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {article.readTime} min
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Licznik wyników */}
            <div id="search-results" className="mb-3 md:mb-6">
              <p className="text-gray-600 text-sm md:text-base">
                Znaleziono <span className="font-semibold text-gray-900">{resultCount}</span> {resultCount === 1 ? 'poradnik' : resultCount < 5 ? 'poradniki' : 'poradników'}
              </p>
            </div>

            {/* Najczęściej wyszukiwane tematy */}
            <section className="hidden md:block mb-8 md:mb-12">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                Najczęściej wyszukiwane tematy
              </h2>
              <div className="flex flex-wrap gap-2 md:gap-3">
                {[
                  { text: 'Koszty DPS 2025', category: 'Finanse i świadczenia' },
                  { text: 'Różnice DPS vs ŚDS', category: 'Wybór opieki' },
                  { text: 'Jak złożyć wniosek do DPS', category: 'Wybór opieki' },
                  { text: 'Dodatek pielęgnacyjny', category: 'Finanse i świadczenia' },
                  { text: 'Prawa mieszkańców DPS', category: 'Prawne aspekty' },
                  { text: 'Świadczenia z MOPS', category: 'Finanse i świadczenia' },
                  { text: 'Opieka dzienna vs całodobowa', category: 'Wybór opieki' },
                  { text: 'Komunikacja z seniorem', category: 'Porady dla opiekunów' }
                ].map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchQuery(topic.text);
                      setActiveCategory(topic.category);
                      scrollToFilters();
                    }}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-emerald-500 hover:text-emerald-700 hover:shadow-sm transition-all"
                  >
                    🔍 {topic.text}
                  </button>
                ))}
              </div>
            </section>

            {/* Sections with Categories */}
            {allArticles.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Nie znaleziono poradników</h3>
                  <p className="text-gray-600 mb-6">Spróbuj zmienić kryteria wyszukiwania lub filtry</p>
                  <button
                    onClick={handleResetFilters}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    Wyczyść filtry
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-12">
              {sections
                .filter(section =>
                  activeCategory === 'Wszystkie' ||
                  section.articles.some(article => article.category === activeCategory)
                )
                .map((section) => {
                // Get filtered articles for this section
                const sectionArticles = allArticles.filter(a => a.sectionId === section.id);
                const isExpanded = expandedSections[section.id];
                const firstThreeArticles = sectionArticles.slice(0, 3);
                const additionalArticles = sectionArticles.slice(3);
                const hasMore = sectionArticles.length > 3;

                return (
                  <section key={section.id} id={section.id} className="scroll-mt-24">
                    {/* Section Header */}
                    <div className="mb-6">
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        {section.title}
                      </h2>
                      <div className="h-1 w-20 bg-emerald-600 rounded-full"></div>
                    </div>

                    {/* Articles Grid - 3 columns desktop, 2 tablet, 1 mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {firstThreeArticles.map((article) => (
                        <ArticleCard
                          key={article.slug}
                          article={article}
                        />
                      ))}
                    </div>

                    {/* Show More Button with AnimatePresence */}
                    {hasMore && (
                      <div className="mt-6">
                        <button
                          onClick={() => toggleSection(section.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`${section.id}-additional-articles`}
                          className="w-full md:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                        >
                          {isExpanded ? (
                            <>
                              Pokaż mniej
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </>
                          ) : (
                            <>
                              Pokaż więcej ({additionalArticles.length})
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </>
                          )}
                        </button>

                        {/* Animated hidden articles */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              id={`${section.id}-additional-articles`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                                {additionalArticles.map((article) => (
                                  <ArticleCard
                                    key={article.slug}
                                    article={article}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </section>
                );
              })}
              </div>
            )}
          </div>

          {/* Desktop: Sidebar - Najczęściej czytane */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="sticky top-60">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Najczęściej czytane
                </h3>

                <div className="space-y-4">
                  {popularArticles.map((article, index) => (
                    <Link
                      key={`popular-${article.sectionId}-${article.slug}`}
                      href={`/poradniki/${article.sectionId}/${article.slug}`}
                      className="group flex gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-200"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-1" title={article.title}>
                          {article.title}
                        </h4>
                        <div className="flex items-center text-xs text-gray-500">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {article.readTime} min
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

        </div>

        {/* Mobile: Najczęściej wyszukiwane - na dole, 4 pigułki */}
        <section className="md:hidden mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Najczęściej wyszukiwane tematy
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { text: 'Koszty DPS 2025', category: 'Finanse i świadczenia' },
              { text: 'Różnice DPS vs ŚDS', category: 'Wybór opieki' },
              { text: 'Dodatek pielęgnacyjny', category: 'Finanse i świadczenia' },
              { text: 'Prawa mieszkańców DPS', category: 'Prawne aspekty' }
            ].map((topic, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(topic.text);
                  setActiveCategory(topic.category);
                  scrollToFilters();
                }}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-emerald-500 hover:text-emerald-700 transition-all"
              >
                🔍 {topic.text}
              </button>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-12 md:mt-16 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl md:rounded-2xl p-6 md:p-8 lg:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
            Potrzebujesz pomocy w znalezieniu placówki?
          </h2>
          <p className="text-base md:text-xl text-emerald-100 mb-6 md:mb-8 max-w-2xl mx-auto">
            Skorzystaj z naszej wyszukiwarki, aby znaleźć odpowiednią placówkę DPS lub ŚDS w Twojej okolicy.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg hover:bg-emerald-50 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Wyszukaj placówki
          </Link>
        </section>

      </div>
    </div>
  );
}
