'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

export default function PoradnikiPage() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // 4 simplified CTAs
  const getCTA = (index: number) => {
    const ctas = [
      'Dowiedz się więcej →',
      'Zobacz szczegóły →',
      'Poznaj wskazówki →',
      'Sprawdź, jak to działa →'
    ];
    return ctas[index % 4];
  };

  const sections = [
    {
      id: 'wybor-opieki',
      title: 'Wybór opieki',
      image: 'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=400&q=80',
      imageAlt: 'Budynek domu opieki',
      description: 'Jak wybrać DPS czy ZOL, czy senior musi wyrazić zgodę, jak znaleźć dobrą placówkę - wszystko krok po kroku',
      articles: [
        { title: 'DPS, ZOL, ŚDS, opieka domowa – czym się różnią', slug: 'rodzaje-opieki', thumbnail: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=100&q=80' },
        { title: 'Jak znaleźć dobrą placówkę – checklista', slug: 'wybor-placowki', thumbnail: 'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=100&q=80' },
        { title: 'Czy senior musi wyrazić zgodę na DPS', slug: 'zgoda-seniora', thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=100&q=80' },
        { title: 'Proces przyjęcia do DPS krok po kroku', slug: 'proces-przyjecia', thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=100&q=80' },
        { title: 'Opieka dzienna vs całodobowa', slug: 'opieka-dzienna-calodobowa', thumbnail: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=100&q=80' },
      ],
    },
    {
      id: 'opiekunowie',
      title: 'Porady dla opiekunów',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
      imageAlt: 'Opiekun wspierający seniora',
      description: 'Jak zorganizować opiekę, jak wspierać seniora z demencją, jakie przysługują prawa opiekuna rodzinnego',
      articles: [
        { title: 'Jak zorganizować opiekę nad seniorem krok po kroku', slug: 'organizacja-opieki', thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=100&q=80' },
        { title: 'Komunikacja z seniorem – sprawdzone techniki', slug: 'komunikacja-senior', thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80' },
        { title: 'Higiena i pielęgnacja seniora – praktyczny poradnik', slug: 'higiena-pielegnacja', thumbnail: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=100&q=80' },
        { title: 'Jak wspierać seniora z demencją i problemami pamięci', slug: 'wsparcie-demencja', thumbnail: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&q=80' },
        { title: 'Udogodnienia w domu seniora – co warto przygotować', slug: 'udogodnienia-dom', thumbnail: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=100&q=80' },
      ],
    },
    {
      id: 'seniorzy',
      title: 'Porady dla seniorów',
      image: 'https://images.unsplash.com/photo-1612537949127-1ec8f0af3e0b?w=400&q=80',
      imageAlt: 'Uśmiechnięci seniorzy',
      description: 'Jak dbać o zdrowie po 70. roku życia, jak bezpiecznie korzystać z internetu, jak zaplanować dzień',
      articles: [
        { title: 'Aktywność fizyczna dla seniorów – proste ćwiczenia', slug: 'aktywnosc-fizyczna', thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100&q=80' },
        { title: 'Jak bezpiecznie senior może korzystać z internetu', slug: 'internet-bezpieczenstwo', thumbnail: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=100&q=80' },
        { title: 'Emerytura z dobrym planem – porady finansowe', slug: 'emerytura-plan', thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=100&q=80' },
        { title: 'Jak dbać o zdrowie i sprawność po 70 roku życia', slug: 'zdrowie-po-70', thumbnail: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=100&q=80' },
        { title: 'Jak zaplanować dzień, by zachować energię', slug: 'planowanie-dnia', thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=100&q=80' },
      ],
    },
    {
      id: 'finanse',
      title: 'Finanse i świadczenia',
      image: 'https://images.unsplash.com/photo-1554224311-beee460ae6ba?w=400&q=80',
      imageAlt: 'Dokumenty finansowe i kalkulator',
      description: 'Ile kosztuje opieka, jak uzyskać dofinansowanie, kto płaci za DPS, jak złożyć wniosek o dodatek pielęgnacyjny',
      articles: [
        { title: 'Dodatek pielęgnacyjny – ile wynosi i jak złożyć wniosek', slug: 'dodatek-pielegnacyjny', thumbnail: 'https://images.unsplash.com/photo-1554224311-beee460ae6ba?w=100&q=80' },
        { title: 'Zasiłek opiekuńczy dla opiekunów – zasady i dokumenty', slug: 'zasilek-opiekunczy', thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=100&q=80' },
        { title: 'Świadczenia z MOPS – kto ma prawo do pomocy', slug: 'swiadczenia-mops', thumbnail: 'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=100&q=80' },
        { title: 'Jak uzyskać dofinansowania dla seniorów w 2025', slug: 'dofinansowania-2025', thumbnail: 'https://images.unsplash.com/photo-1633158829875-e5316a358c6f?w=100&q=80' },
        { title: 'Ulgi podatkowe dla seniorów i opiekunów', slug: 'ulgi-podatkowe', thumbnail: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=100&q=80' },
      ],
    },
    {
      id: 'prawne',
      title: 'Prawne aspekty opieki',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80',
      imageAlt: 'Dokumenty prawne i umowy',
      description: 'Jakie prawa ma mieszkaniec DPS, czy senior musi wyrazić zgodę, co warto wiedzieć o umowach z placówkami',
      articles: [
        { title: 'Prawa mieszkańców DPS i pacjentów ZOL – przewodnik', slug: 'prawa-mieszkancow', thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=100&q=80' },
        { title: 'Czy senior musi wyrazić zgodę na opiekę lub DPS', slug: 'zgoda-na-opieke', thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=100&q=80' },
        { title: 'Ubezwłasnowolnienie – co warto wiedzieć', slug: 'ubezwlasnowolnienie', thumbnail: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=100&q=80' },
        { title: 'Prawa opiekunów rodzinnych', slug: 'prawa-opiekunow', thumbnail: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=100&q=80' },
        { title: 'Umowy z placówkami – na co uważać', slug: 'umowy-placowki', thumbnail: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=100&q=80' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-16 md:py-24 overflow-hidden">
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
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 drop-shadow-lg">
            Poradniki dla Seniorów i Opiekunów
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-emerald-50 max-w-3xl mx-auto drop-shadow">
            Praktyczne przewodniki - wszystko, co musisz wiedzieć w jednym miejscu
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">

        {/* Introduction */}
        <section className="mb-8 md:mb-12">
          <p className="text-base md:text-lg text-gray-700 leading-relaxed text-center max-w-3xl mx-auto">
            Zebrane przez nas poradniki pomogą Ci lepiej zrozumieć, jak dbać o seniora,
            jakie przysługują mu prawa i świadczenia, oraz jak zadbać o siebie jako opiekun.
          </p>
        </section>

        {/* Guide Sections */}
        <div className="space-y-6 md:space-y-8">
          {sections.map((section) => {
            const isExpanded = expandedSections[section.id];
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            const displayedArticles = isMobile && !isExpanded
              ? section.articles.slice(0, 3)
              : section.articles;
            const hasMore = section.articles.length > 3;

            return (
              <div
                key={section.id}
                id={section.id}
                className="bg-white rounded-xl md:rounded-2xl border-2 border-gray-200 p-4 md:p-8 hover:shadow-lg transition-shadow scroll-mt-24"
              >
                {/* Section Header */}
                <div className="flex items-start gap-3 md:gap-4 mb-4 md:mb-6">
                  <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-4 border-emerald-100 shadow-md">
                    <img
                      src={section.image}
                      alt={section.imageAlt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
                      {section.title}
                    </h2>
                    <p className="text-sm md:text-base text-gray-600">
                      {section.description}
                    </p>
                  </div>
                </div>

                {/* Articles List */}
                <div className="flex flex-col md:grid md:grid-cols-2 gap-3 md:gap-4">
                  {displayedArticles.map((article, index) => (
                    <Link
                      key={article.slug}
                      href={`/poradniki/${section.id}/${article.slug}`}
                      aria-label={`Przeczytaj: ${article.title}`}
                      className="group flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg hover:bg-emerald-50 transition-all duration-200 border border-gray-100 hover:border-emerald-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={article.thumbnail}
                          alt=""
                          className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover shadow-sm"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base text-gray-900 group-hover:text-emerald-700 transition-colors mb-1.5">
                          {article.title}
                        </h3>
                        <span className="text-xs md:text-sm text-emerald-600 group-hover:text-emerald-700 font-medium inline-flex items-center gap-1">
                          {getCTA(index)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Show More Button (Mobile only) with animation */}
                {hasMore && (
                  <div className="md:hidden mt-4">
                    <button
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={isExpanded}
                      aria-controls={`${section.id}-additional-articles`}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                    >
                      {isExpanded ? (
                        <>
                          Pokaż mniej
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          Pokaż więcej ({section.articles.length - 3})
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
                          <div className="flex flex-col gap-3 mt-3">
                            {section.articles.slice(3).map((article, index) => (
                              <Link
                                key={article.slug}
                                href={`/poradniki/${section.id}/${article.slug}`}
                                aria-label={`Przeczytaj: ${article.title}`}
                                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-all duration-200 border border-gray-100 hover:border-emerald-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                              >
                                <div className="flex-shrink-0">
                                  <img
                                    src={article.thumbnail}
                                    alt=""
                                    className="w-14 h-14 rounded-lg object-cover shadow-sm"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors mb-1.5">
                                    {article.title}
                                  </h3>
                                  <span className="text-xs text-emerald-600 group-hover:text-emerald-700 font-medium inline-flex items-center gap-1">
                                    {getCTA(index + 3)}
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
