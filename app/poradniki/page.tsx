'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import SearchBar from '@/components/poradniki/SearchBar';
import CategoryFilters from '@/components/poradniki/CategoryFilters';
import SortDropdown from '@/components/poradniki/SortDropdown';
import ArticleCard from '@/components/poradniki/ArticleCard';

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

  // Extended article data with metadata
  type Article = {
    title: string;
    slug: string;
    thumbnail: string;
    category: string;
    categoryColor: string;
    excerpt: string;
    readTime: number;
    isNew?: boolean;
    isPopular?: boolean;
  };

  // Lista kategorii do filtrowania
  const categories = ['Wszystkie', 'Wybór opieki', 'Porady dla opiekunów', 'Porady dla seniorów', 'Finanse i świadczenia', 'Prawne aspekty'];

  const sections = [
    {
      id: 'wybor-opieki',
      title: 'Wybór opieki',
      articles: [
        {
          title: 'DPS, ZOL, ŚDS, opieka domowa – czym się różnią',
          slug: 'rodzaje-opieki',
          thumbnail: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
          category: 'Wybór opieki',
          categoryColor: 'bg-blue-50 text-blue-700',
          excerpt: 'Poznaj różnice między placówkami i formami opieki, aby wybrać najlepszą opcję dla seniora.',
          readTime: 7,
          isPopular: true
        },
        {
          title: 'Jak znaleźć dobrą placówkę – checklista',
          slug: 'wybor-placowki',
          thumbnail: 'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=800&q=80',
          category: 'Wybór opieki',
          categoryColor: 'bg-blue-50 text-blue-700',
          excerpt: 'Praktyczna lista kontrolna, która pomoże Ci ocenić jakość domu pomocy społecznej.',
          readTime: 5,
          isNew: true
        },
        {
          title: 'Czy senior musi wyrazić zgodę na DPS',
          slug: 'zgoda-seniora',
          thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
          category: 'Wybór opieki',
          categoryColor: 'bg-blue-50 text-blue-700',
          excerpt: 'Wyjaśniamy kwestie prawne związane ze zgodą seniora na umieszczenie w placówce.',
          readTime: 6,
          isPopular: true
        },
        {
          title: 'Proces przyjęcia do DPS krok po kroku',
          slug: 'proces-przyjecia',
          thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
          category: 'Wybór opieki',
          categoryColor: 'bg-blue-50 text-blue-700',
          excerpt: 'Szczegółowy przewodnik po procedurze przyjęcia do domu pomocy społecznej.',
          readTime: 8
        },
        {
          title: 'Opieka dzienna vs całodobowa',
          slug: 'opieka-dzienna-calodobowa',
          thumbnail: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80',
          category: 'Wybór opieki',
          categoryColor: 'bg-blue-50 text-blue-700',
          excerpt: 'Porównanie form opieki dziennej i całodobowej - zalety, wady i koszty.',
          readTime: 5
        },
      ],
    },
    {
      id: 'opiekunowie',
      title: 'Porady dla opiekunów',
      articles: [
        {
          title: 'Jak zorganizować opiekę nad seniorem krok po kroku',
          slug: 'organizacja-opieki',
          thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
          category: 'Porady dla opiekunów',
          categoryColor: 'bg-purple-50 text-purple-700',
          excerpt: 'Kompleksowy przewodnik jak zaplanować i zorganizować opiekę nad osobą starszą.',
          readTime: 10,
          isPopular: true
        },
        {
          title: 'Komunikacja z seniorem – sprawdzone techniki',
          slug: 'komunikacja-senior',
          thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
          category: 'Porady dla opiekunów',
          categoryColor: 'bg-purple-50 text-purple-700',
          excerpt: 'Praktyczne wskazówki jak rozmawiać z seniorem i budować pozytywne relacje.',
          readTime: 6
        },
        {
          title: 'Higiena i pielęgnacja seniora – praktyczny poradnik',
          slug: 'higiena-pielegnacja',
          thumbnail: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80',
          category: 'Porady dla opiekunów',
          categoryColor: 'bg-purple-50 text-purple-700',
          excerpt: 'Szczegółowe instrukcje dotyczące codziennej pielęgnacji osoby starszej.',
          readTime: 8
        },
        {
          title: 'Jak wspierać seniora z demencją i problemami pamięci',
          slug: 'wsparcie-demencja',
          thumbnail: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80',
          category: 'Porady dla opiekunów',
          categoryColor: 'bg-purple-50 text-purple-700',
          excerpt: 'Praktyczne strategie wspierania seniora z zaburzeniami pamięci i demencją.',
          readTime: 9,
          isPopular: true
        },
        {
          title: 'Udogodnienia w domu seniora – co warto przygotować',
          slug: 'udogodnienia-dom',
          thumbnail: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&q=80',
          category: 'Porady dla opiekunów',
          categoryColor: 'bg-purple-50 text-purple-700',
          excerpt: 'Lista niezbędnych adaptacji domu dla bezpieczeństwa i komfortu seniora.',
          readTime: 7,
          isNew: true
        },
      ],
    },
    {
      id: 'seniorzy',
      title: 'Porady dla seniorów',
      articles: [
        {
          title: 'Aktywność fizyczna dla seniorów – proste ćwiczenia',
          slug: 'aktywnosc-fizyczna',
          thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
          category: 'Porady dla seniorów',
          categoryColor: 'bg-green-50 text-green-700',
          excerpt: 'Bezpieczne i skuteczne ćwiczenia dla osób starszych do wykonania w domu.',
          readTime: 6
        },
        {
          title: 'Jak bezpiecznie senior może korzystać z internetu',
          slug: 'internet-bezpieczenstwo',
          thumbnail: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&q=80',
          category: 'Porady dla seniorów',
          categoryColor: 'bg-green-50 text-green-700',
          excerpt: 'Zasady bezpieczeństwa w sieci i ochrona przed oszustwami online.',
          readTime: 7,
          isNew: true
        },
        {
          title: 'Emerytura z dobrym planem – porady finansowe',
          slug: 'emerytura-plan',
          thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',
          category: 'Porady dla seniorów',
          categoryColor: 'bg-green-50 text-green-700',
          excerpt: 'Jak mądrze planować budżet i zarządzać finansami na emeryturze.',
          readTime: 8
        },
        {
          title: 'Jak dbać o zdrowie i sprawność po 70 roku życia',
          slug: 'zdrowie-po-70',
          thumbnail: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
          category: 'Porady dla seniorów',
          categoryColor: 'bg-green-50 text-green-700',
          excerpt: 'Kompleksowy przewodnik po profilaktyce zdrowotnej i aktywności po 70.',
          readTime: 9,
          isPopular: true
        },
        {
          title: 'Jak zaplanować dzień, by zachować energię',
          slug: 'planowanie-dnia',
          thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80',
          category: 'Porady dla seniorów',
          categoryColor: 'bg-green-50 text-green-700',
          excerpt: 'Strategie organizacji dnia, które pomogą zachować witalność i dobry nastrój.',
          readTime: 5
        },
      ],
    },
    {
      id: 'finanse',
      title: 'Finanse i świadczenia',
      articles: [
        {
          title: 'Dodatek pielęgnacyjny – ile wynosi i jak złożyć wniosek',
          slug: 'dodatek-pielegnacyjny',
          thumbnail: 'https://images.unsplash.com/photo-1554224311-beee460ae6ba?w=800&q=80',
          category: 'Finanse i świadczenia',
          categoryColor: 'bg-amber-50 text-amber-700',
          excerpt: 'Szczegółowy przewodnik po dodatku pielęgnacyjnym - kwoty, zasady i proces składania wniosku.',
          readTime: 7,
          isPopular: true
        },
        {
          title: 'Zasiłek opiekuńczy dla opiekunów – zasady i dokumenty',
          slug: 'zasilek-opiekunczy',
          thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
          category: 'Finanse i świadczenia',
          categoryColor: 'bg-amber-50 text-amber-700',
          excerpt: 'Kto może ubiegać się o zasiłek opiekuńczy i jakie dokumenty są potrzebne.',
          readTime: 6,
          isPopular: true
        },
        {
          title: 'Świadczenia z MOPS – kto ma prawo do pomocy',
          slug: 'swiadczenia-mops',
          thumbnail: 'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=800&q=80',
          category: 'Finanse i świadczenia',
          categoryColor: 'bg-amber-50 text-amber-700',
          excerpt: 'Przegląd świadczeń z miejskiego ośrodka pomocy społecznej i kryteria ich przyznawania.',
          readTime: 8
        },
        {
          title: 'Jak uzyskać dofinansowania dla seniorów w 2025',
          slug: 'dofinansowania-2025',
          thumbnail: 'https://images.unsplash.com/photo-1633158829875-e5316a358c6f?w=800&q=80',
          category: 'Finanse i świadczenia',
          categoryColor: 'bg-amber-50 text-amber-700',
          excerpt: 'Aktualna lista dostępnych dofinansowań i programów wsparcia finansowego.',
          readTime: 9,
          isNew: true
        },
        {
          title: 'Ulgi podatkowe dla seniorów i opiekunów',
          slug: 'ulgi-podatkowe',
          thumbnail: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&q=80',
          category: 'Finanse i świadczenia',
          categoryColor: 'bg-amber-50 text-amber-700',
          excerpt: 'Poznaj wszystkie ulgi podatkowe przysługujące seniorom i opiekunom.',
          readTime: 7
        },
      ],
    },
    {
      id: 'prawne',
      title: 'Prawne aspekty',
      articles: [
        {
          title: 'Prawa mieszkańców DPS i pacjentów ZOL – przewodnik',
          slug: 'prawa-mieszkancow',
          thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
          category: 'Prawne aspekty',
          categoryColor: 'bg-red-50 text-red-700',
          excerpt: 'Kompleksowy przewodnik po prawach osób przebywających w placówkach opiekuńczych.',
          readTime: 10,
          isPopular: true
        },
        {
          title: 'Czy senior musi wyrazić zgodę na opiekę lub DPS',
          slug: 'zgoda-na-opieke',
          thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
          category: 'Prawne aspekty',
          categoryColor: 'bg-red-50 text-red-700',
          excerpt: 'Wyjaśnienie przepisów dotyczących zgody seniora na umieszczenie w placówce.',
          readTime: 6
        },
        {
          title: 'Ubezwłasnowolnienie – co warto wiedzieć',
          slug: 'ubezwlasnowolnienie',
          thumbnail: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&q=80',
          category: 'Prawne aspekty',
          categoryColor: 'bg-red-50 text-red-700',
          excerpt: 'Kiedy i jak przebiega proces ubezwłasnowolnienia - informacje prawne.',
          readTime: 8
        },
        {
          title: 'Prawa opiekunów rodzinnych',
          slug: 'prawa-opiekunow',
          thumbnail: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=800&q=80',
          category: 'Prawne aspekty',
          categoryColor: 'bg-red-50 text-red-700',
          excerpt: 'Co przysługuje opiekunom rodzinnym - prawa, świadczenia i wsparcie.',
          readTime: 7
        },
        {
          title: 'Umowy z placówkami – na co uważać',
          slug: 'umowy-placowki',
          thumbnail: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=800&q=80',
          category: 'Prawne aspekty',
          categoryColor: 'bg-red-50 text-red-700',
          excerpt: 'Najważniejsze klauzule umów z domami opieki i na co zwracać szczególną uwagę.',
          readTime: 9,
          isNew: true
        },
      ],
    },
  ];

  // Flatten all articles with filtering and sorting
  const allArticles = useMemo(() => {
    let articles = sections.flatMap(section =>
      section.articles.map(article => ({
        ...article,
        sectionId: section.id,
        sectionTitle: section.title
      }))
    );

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.trim().toLowerCase();
      articles = articles.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (activeCategory !== 'Wszystkie') {
      articles = articles.filter(article => article.category === activeCategory);
    }

    // Sort articles
    switch (sortBy) {
      case 'newest':
        articles = articles.sort((a, b) => {
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return 0;
        });
        break;
      case 'popular':
        articles = articles.sort((a, b) => {
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return 0;
        });
        break;
      case 'recommended':
        articles = articles.sort((a, b) => {
          const scoreA = (a.isPopular ? 2 : 0) + (a.isNew ? 1 : 0);
          const scoreB = (b.isPopular ? 2 : 0) + (b.isNew ? 1 : 0);
          return scoreB - scoreA;
        });
        break;
    }

    return articles;
  }, [sections, searchQuery, activeCategory, sortBy]);

  // Get popular articles for sidebar
  const popularArticles = allArticles.filter(a => a.isPopular).slice(0, 5);

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
                Znaleziono <span className="font-semibold text-gray-900">{allArticles.length}</span> {allArticles.length === 1 ? 'poradnik' : allArticles.length < 5 ? 'poradniki' : 'poradników'}
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
