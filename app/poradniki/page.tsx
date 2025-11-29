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
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      ),
      description: 'Jak wybrać DPS czy ZOL, czy senior musi wyrazić zgodę, jak znaleźć dobrą placówkę - wszystko krok po kroku',
      articles: [
        { title: 'DPS, ZOL, ŚDS, opieka domowa – czym się różnią', slug: 'rodzaje-opieki' },
        { title: 'Jak znaleźć dobrą placówkę – checklista', slug: 'wybor-placowki' },
        { title: 'Czy senior musi wyrazić zgodę na DPS', slug: 'zgoda-seniora' },
        { title: 'Proces przyjęcia do DPS krok po kroku', slug: 'proces-przyjecia' },
        { title: 'Opieka dzienna vs całodobowa', slug: 'opieka-dzienna-calodobowa' },
      ],
    },
    {
      id: 'opiekunowie',
      title: 'Porady dla opiekunów',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      description: 'Jak zorganizować opiekę, jak wspierać seniora z demencją, jakie przysługują prawa opiekuna rodzinnego',
      articles: [
        { title: 'Jak zorganizować opiekę nad seniorem krok po kroku', slug: 'organizacja-opieki' },
        { title: 'Komunikacja z seniorem – sprawdzone techniki', slug: 'komunikacja-senior' },
        { title: 'Higiena i pielęgnacja seniora – praktyczny poradnik', slug: 'higiena-pielegnacja' },
        { title: 'Jak wspierać seniora z demencją i problemami pamięci', slug: 'wsparcie-demencja' },
        { title: 'Udogodnienia w domu seniora – co warto przygotować', slug: 'udogodnienia-dom' },
      ],
    },
    {
      id: 'seniorzy',
      title: 'Porady dla seniorów',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
      description: 'Jak dbać o zdrowie po 70. roku życia, jak bezpiecznie korzystać z internetu, jak zaplanować dzień',
      articles: [
        { title: 'Aktywność fizyczna dla seniorów – proste ćwiczenia', slug: 'aktywnosc-fizyczna' },
        { title: 'Jak bezpiecznie senior może korzystać z internetu', slug: 'internet-bezpieczenstwo' },
        { title: 'Emerytura z dobrym planem – porady finansowe', slug: 'emerytura-plan' },
        { title: 'Jak dbać o zdrowie i sprawność po 70 roku życia', slug: 'zdrowie-po-70' },
        { title: 'Jak zaplanować dzień, by zachować energię', slug: 'planowanie-dnia' },
      ],
    },
    {
      id: 'finanse',
      title: 'Finanse i świadczenia',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      ),
      description: 'Ile kosztuje opieka, jak uzyskać dofinansowanie, kto płaci za DPS, jak złożyć wniosek o dodatek pielęgnacyjny',
      articles: [
        { title: 'Dodatek pielęgnacyjny – ile wynosi i jak złożyć wniosek', slug: 'dodatek-pielegnacyjny' },
        { title: 'Zasiłek opiekuńczy dla opiekunów – zasady i dokumenty', slug: 'zasilek-opiekunczy' },
        { title: 'Świadczenia z MOPS – kto ma prawo do pomocy', slug: 'swiadczenia-mops' },
        { title: 'Jak uzyskać dofinansowania dla seniorów w 2025', slug: 'dofinansowania-2025' },
        { title: 'Ulgi podatkowe dla seniorów i opiekunów', slug: 'ulgi-podatkowe' },
      ],
    },
    {
      id: 'prawne',
      title: 'Prawne aspekty opieki',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
        </svg>
      ),
      description: 'Jakie prawa ma mieszkaniec DPS, czy senior musi wyrazić zgodę, co warto wiedzieć o umowach z placówkami',
      articles: [
        { title: 'Prawa mieszkańców DPS i pacjentów ZOL – przewodnik', slug: 'prawa-mieszkancow' },
        { title: 'Czy senior musi wyrazić zgodę na opiekę lub DPS', slug: 'zgoda-na-opieke' },
        { title: 'Ubezwłasnowolnienie – co warto wiedzieć', slug: 'ubezwlasnowolnienie' },
        { title: 'Prawa opiekunów rodzinnych', slug: 'prawa-opiekunow' },
        { title: 'Umowy z placówkami – na co uważać', slug: 'umowy-placowki' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
            Poradniki
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-emerald-100 max-w-3xl mx-auto">
            Praktyczne przewodniki dla seniorów i opiekunów - wszystko, co musisz wiedzieć w jednym miejscu
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
                  <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    {section.icon}
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
                      className="group flex items-start gap-3 p-3 md:p-4 rounded-lg hover:bg-emerald-50 transition-colors border border-gray-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-5 h-5 text-emerald-600"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm md:text-base text-gray-900 group-hover:text-emerald-700 transition-colors mb-1">
                          {article.title}
                        </h3>
                        <span className="text-xs md:text-sm text-emerald-600 group-hover:text-emerald-700 font-medium">
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
                                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors border border-gray-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                              >
                                <div className="flex-shrink-0 mt-1">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-5 h-5 text-emerald-600"
                                    aria-hidden="true"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-sm text-gray-900 group-hover:text-emerald-700 transition-colors mb-1">
                                    {article.title}
                                  </h3>
                                  <span className="text-xs text-emerald-600 group-hover:text-emerald-700 font-medium">
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
