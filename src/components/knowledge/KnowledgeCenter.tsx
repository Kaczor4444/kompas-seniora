'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function KnowledgeCenter() {
  const [scrollPosition, setScrollPosition] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Updated Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            🎯 Nie wiesz od czego zacząć?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Przeczytaj artykuły, które pomogą Ci w poszukiwaniu i podjęciu decyzji.
          </p>
        </div>

        {/* Kategorie/Tagi */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <Link href="/poradniki" className="px-6 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium transition-colors">
            Wszystkie
          </Link>
          <Link href="/poradniki#wybor-opieki" className="px-6 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-colors">
            Wybór opieki
          </Link>
          <Link href="/poradniki#opiekunowie" className="px-6 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-colors">
            Dla opiekunów
          </Link>
          <Link href="/poradniki#seniorzy" className="px-6 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-colors">
            Dla seniorów
          </Link>
          <Link href="/poradniki#finanse" className="px-6 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-colors">
            Finanse
          </Link>
          <Link href="/poradniki#prawne" className="px-6 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-colors">
            Prawne
          </Link>
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
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-4 px-2"
            onScroll={handleScroll}
          >
            {/* Card 1 - Wybór placówki (POLECAMY) */}
            <Link
              href="/poradniki/wybor-opieki/wybor-placowki"
              aria-label="Jak wybrać odpowiednią placówkę dla seniora?"
              className="group flex-shrink-0 snap-start w-[300px] lg:w-[380px]"
            >
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow h-full relative">
                {/* Badge POLECAMY - top right */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold animate-pulse z-10">
                  POLECAMY
                </div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800&q=80"
                    alt="Jak wybrać placówkę dla seniora"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3 group-hover:text-emerald-600 transition-colors">
                    Jak wybrać odpowiednią placówkę dla seniora?
                  </h3>
                  <p className="text-neutral-700 mb-3">
                    Poznaj kryteria wyboru. Dowiedz się na co zwrócić uwagę.
                  </p>
                  <span className="text-sm text-emerald-600 font-medium inline-flex items-center gap-1">
                    Rozpocznij czytanie →
                  </span>
                </div>
              </article>
            </Link>

            {/* Card 2 - Typy DPS (NOWE!) */}
            <Link
              href="/poradniki/wybor-opieki/typy-dps"
              aria-label="6 Typów DPS w Polsce - który wybrać?"
              className="group flex-shrink-0 snap-start w-[300px] lg:w-[380px]"
            >
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow h-full relative">
                {/* Badge NOWE - top right */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold z-10">
                  NOWE
                </div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80"
                    alt="6 typów DPS w Polsce"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3 group-hover:text-emerald-600 transition-colors">
                    6 Typów DPS w Polsce - który wybrać?
                  </h3>
                  <p className="text-neutral-700 mb-3">
                    Poznaj rodzaje DPS zgodnie z Art. 54 i sprawdź który typ pasuje do potrzeb Twojego bliskiego
                  </p>
                  <span className="text-sm text-emerald-600 font-medium inline-flex items-center gap-1">
                    Przeczytaj teraz →
                  </span>
                </div>
              </article>
            </Link>

            {/* Card 3 - Koszty opieki (WKRÓTCE) */}
            <Link
              href="/poradniki/finanse-prawne/koszty-opieki"
              aria-label="Ile kosztuje dom opieki?"
              className="group pointer-events-none flex-shrink-0 snap-start w-[300px] lg:w-[380px]"
            >
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden h-full relative opacity-75">
                {/* Badge WKRÓTCE - top right */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold z-10">
                  WKRÓTCE
                </div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80"
                    alt="Koszty domu opieki"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    Ile kosztuje dom opieki?
                  </h3>
                  <p className="text-neutral-700 mb-3">
                    Koszty pobytu i możliwości dofinansowania z MOPS
                  </p>
                  <span className="text-sm text-gray-500 font-medium inline-flex items-center gap-1 opacity-50 cursor-not-allowed">
                    W przygotowaniu
                  </span>
                </div>
              </article>
            </Link>

            {/* Card 4 - DPS vs ŚDS (WKRÓTCE) */}
            <Link
              href="/poradniki/wybor-opieki/dps-vs-sds"
              aria-label="Czym różni się DPS od ŚDS?"
              className="group pointer-events-none flex-shrink-0 snap-start w-[300px] lg:w-[380px]"
            >
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden h-full relative opacity-75">
                {/* Badge WKRÓTCE - top right */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold z-10">
                  WKRÓTCE
                </div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80"
                    alt="Różnice DPS i ŚDS"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    Czym różni się DPS od ŚDS?
                  </h3>
                  <p className="text-neutral-700 mb-3">
                    Zrozum różnice i wybierz właściwą formę opieki
                  </p>
                  <span className="text-sm text-gray-500 font-medium inline-flex items-center gap-1 opacity-50 cursor-not-allowed">
                    W przygotowaniu
                  </span>
                </div>
              </article>
            </Link>

            {/* Card 4 - Przygotowanie seniora (WKRÓTCE) */}
            <Link
              href="/poradniki/wsparcie-emocjonalne/przygotowanie-seniora"
              aria-label="Jak przygotować seniora do przeprowadzki do DPS?"
              className="group pointer-events-none flex-shrink-0 snap-start w-[300px] lg:w-[380px]"
            >
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden h-full relative opacity-75">
                {/* Badge WKRÓTCE - top right */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold z-10">
                  WKRÓTCE
                </div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=800&q=80"
                    alt="Przygotowanie seniora do DPS"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-500 mb-2">Wsparcie emocjonalne</div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    Jak przygotować seniora do przeprowadzki do DPS?
                  </h3>
                  <p className="text-neutral-700 mb-3">
                    Praktyczne porady jak pomóc bliskiemu zaakceptować zmianę i przygotować się emocjonalnie
                  </p>
                  <span className="text-sm text-gray-500 font-medium inline-flex items-center gap-1 opacity-50 cursor-not-allowed">
                    W przygotowaniu
                  </span>
                </div>
              </article>
            </Link>

            {/* Card 5 - Dokumenty do wniosku (WKRÓTCE) */}
            <Link
              href="/poradniki/finanse-prawne/dokumenty-wniosek"
              aria-label="Jakie dokumenty potrzebne do złożenia wniosku do DPS?"
              className="group pointer-events-none flex-shrink-0 snap-start w-[300px] lg:w-[380px]"
            >
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden h-full relative opacity-75">
                {/* Badge WKRÓTCE - top right */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold z-10">
                  WKRÓTCE
                </div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80"
                    alt="Dokumenty do wniosku DPS"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-500 mb-2">Finanse i prawo</div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    Jakie dokumenty potrzebne do złożenia wniosku do DPS?
                  </h3>
                  <p className="text-neutral-700 mb-3">
                    Kompletna lista dokumentów i krok po kroku jak przygotować wniosek do MOPS
                  </p>
                  <span className="text-sm text-gray-500 font-medium inline-flex items-center gap-1 opacity-50 cursor-not-allowed">
                    W przygotowaniu
                  </span>
                </div>
              </article>
            </Link>

            {/* Card 6 - Prawa mieszkańca (WKRÓTCE) */}
            <Link
              href="/poradniki/finanse-prawne/prawa-mieszkanca"
              aria-label="Prawa mieszkańca domu pomocy społecznej"
              className="group pointer-events-none flex-shrink-0 snap-start w-[300px] lg:w-[380px]"
            >
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden h-full relative opacity-75">
                {/* Badge WKRÓTCE - top right */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold z-10">
                  WKRÓTCE
                </div>
                <div className="relative h-48 overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80"
                    alt="Prawa mieszkańca DPS"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="text-sm text-gray-500 mb-2">Finanse i prawo</div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                    Prawa mieszkańca domu pomocy społecznej
                  </h3>
                  <p className="text-neutral-700 mb-3">
                    Poznaj prawa seniora w DPS - od prywatności po możliwość odwiedzin rodziny
                  </p>
                  <span className="text-sm text-gray-500 font-medium inline-flex items-center gap-1 opacity-50 cursor-not-allowed">
                    W przygotowaniu
                  </span>
                </div>
              </article>
            </Link>
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
        <div className="text-center mt-12">
          <Link href="/poradniki" className="bg-white hover:bg-neutral-50 text-neutral-900 px-8 py-3 rounded-lg font-medium border-2 border-neutral-300 transition-colors inline-flex items-center gap-2">
            Zobacz wszystkie poradniki
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
