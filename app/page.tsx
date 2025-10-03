"use client";

import MiniFAQSection from '../src/components/faq/MiniFAQSection';  // ← DODAJ TO
import SearchBar from '../src/components/search/SearchBar';
export default function Home() {

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-semibold text-neutral-900">Kompas Seniora</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-neutral-700 hover:text-neutral-900 font-medium">
                Wyszukiwarka
              </a>
              <a href="#" className="text-neutral-700 hover:text-neutral-900 font-medium">
                Kalkulator
              </a>
              <a href="#" className="text-neutral-700 hover:text-neutral-900 font-medium">
                Poradnik
              </a>
              <button className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Kontakt
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Lottie Style */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-accent-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          {/* Trustpilot Badge */}
          <div className="flex justify-center mb-8">
            <div className="bg-white px-6 py-2 rounded-lg shadow-sm border border-neutral-200">
              <span className="text-sm text-neutral-700">⭐⭐⭐⭐⭐ Zaufana platforma</span>
            </div>
          </div>
          
          {/* Headline */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 leading-tight">
              Znajdź najlepszy dom opieki<br />w Twojej okolicy
            </h1>
            <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
              Transparentna wyszukiwarka publicznych domów pomocy społecznej z oficjalnymi cenami
            </p>
          </div>
          
          {/* Category Tabs - Responsive with Tooltips */}
          <div className="flex justify-center gap-3 mb-8 max-w-2xl mx-auto">
            <div className="relative group">
              <button className="bg-white border-2 border-accent-500 text-neutral-900 px-6 py-3 rounded-lg font-medium text-sm transition-all text-center transform hover:scale-105 min-w-[140px]">
                <span className="hidden sm:inline">Domy Pomocy Społecznej</span>
                <span className="sm:hidden">DPS</span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-accent-500 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 shadow-lg">
                Stacjonarne placówki dla osób wymagających całodobowej opieki
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-accent-500"></div>
              </div>
            </div>
            
            <div className="relative group">
              <button className="bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 px-6 py-3 rounded-lg font-medium text-sm transition-all text-center transform hover:scale-105 min-w-[140px]">
                <span className="hidden sm:inline">Środowiskowe Domy</span>
                <span className="sm:hidden">ŚDS</span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-accent-500 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 shadow-lg">
                Ośrodki wsparcia dziennego dla osób z zaburzeniami psychicznymi
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-accent-500"></div>
              </div>
            </div>
            
            <div className="relative group">
              <button className="bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 px-6 py-3 rounded-lg font-medium text-sm transition-all text-center transform hover:scale-105 min-w-[140px]">
                <span className="hidden sm:inline">Kalkulator Kosztów</span>
                <span className="sm:hidden">Kalkulator</span>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-accent-500 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10 shadow-lg">
                Oblicz szacunkowe koszty opieki i zaplanuj budżet
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-accent-500"></div>
              </div>
            </div>
          </div>
          
            <SearchBar />
        </div>
      </section>

      {/* Stats Section - Flat Design */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-primary-700">2</span>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Placówki w bazie</h3>
              <p className="text-sm text-neutral-600">Sprawdzone domy pomocy społecznej</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-success-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-success-700">100%</span>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Oficjalne dane</h3>
              <p className="text-sm text-neutral-600">Ceny z urzędów miast i MOPS</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center px-4 h-14 bg-accent-100 rounded-full mb-4">
                <span className="text-sm font-bold text-accent-600">Małopolska</span>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Aktualnie dostępne</h3>
              <p className="text-sm text-neutral-600">Rozszerzamy na kolejne województwa</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Horizontal Scroll na mobile */}
      <section className="py-12 md:py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <div className="md:px-4">
            {/* Desktop: grid 3 kolumny */}
            <div className="hidden md:grid md:grid-cols-3 gap-8 px-4">
              {/* Feature 1 */}
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <img src="/icons/search-intelligent.png" alt="Inteligentna wyszukiwarka" className="w-16 h-16 object-contain" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 text-center">Inteligentna wyszukiwarka</h3>
                <p className="text-neutral-700 text-center">
                  Wpisz "Kamienica" - system znajdzie powiat limanowski
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <img src="/icons/prices-transparent.png" alt="Transparentne ceny" className="w-16 h-16 object-contain" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 text-center">Transparentne ceny</h3>
                <p className="text-neutral-700 text-center">
                  Oficjalne dane z MOPS. Koniec z dziesiątkami PDFów
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <img src="/icons/calculator-costs.png" alt="Kalkulator kosztów" className="w-16 h-16 object-contain" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 text-center">Kalkulator kosztów</h3>
                <p className="text-neutral-700 text-center">
                  Zaplanuj budżet opieki i porównaj różne opcje
                </p>
              </div>
            </div>
            
            {/* Mobile: horizontal scroll */}
            <div className="md:hidden overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 px-4 pb-4" style={{ width: 'max-content' }}>
                {/* Feature 1 */}
                <div className="bg-white rounded-xl p-6 shadow-sm" style={{ width: '280px' }}>
                  <div className="w-16 h-16 bg-secondary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <img src="/icons/search-intelligent.png" alt="Inteligentna wyszukiwarka" className="w-12 h-12 object-contain" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">Inteligentna wyszukiwarka</h3>
                  <p className="text-sm text-neutral-700 text-center">
                    Wpisz miejscowość - znajdziemy odpowiedni powiat
                  </p>
                </div>
                
                {/* Feature 2 */}
                <div className="bg-white rounded-xl p-6 shadow-sm" style={{ width: '280px' }}>
                  <div className="w-16 h-16 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <img src="/icons/prices-transparent.png" alt="Transparentne ceny" className="w-12 h-12 object-contain" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">Transparentne ceny</h3>
                  <p className="text-sm text-neutral-700 text-center">
                    Oficjalne dane MOPS bez ukrytych kosztów
                  </p>
                </div>
                
                {/* Feature 3 */}
                <div className="bg-white rounded-xl p-6 shadow-sm" style={{ width: '280px' }}>
                  <div className="w-16 h-16 bg-accent-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <img src="/icons/calculator-costs.png" alt="Kalkulator kosztów" className="w-12 h-12 object-contain" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">Kalkulator kosztów</h3>
                  <p className="text-sm text-neutral-700 text-center">
                    Zaplanuj budżet opieki dla bliskiej osoby
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge Center / Poradnik Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Centrum Wiedzy dla Rodzin
            </h2>
            <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
              Praktyczne porady i informacje o opiece nad osobami z demencją i chorobą Alzheimera
            </p>
          </div>
          
          {/* Kategorie/Tagi */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <button className="px-6 py-2 bg-accent-500 text-white rounded-lg font-medium">
              Wszystkie
            </button>
            <button className="px-6 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-colors">
              Domy Pomocy (DPS)
            </button>
            <button className="px-6 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-colors">
              Środowiskowe (ŚDS)
            </button>
            <button className="px-6 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-colors">
              Finanse i prawo
            </button>
            <button className="px-6 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-colors">
              Opieka w domu
            </button>
            <button className="px-6 py-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-colors">
              Zdrowie i terapie
            </button>
          </div>
          
          {/* Desktop: Grid 3 kolumny */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {/* Artykuł 1 - DPS */}
            <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-12 bg-accent-50 p-8 flex items-center justify-center relative">
                {/* Tag kategorii */}
                <span className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-xs font-medium text-accent-600 border border-accent-200">
                  Domy Pomocy
                </span>
                <img 
                  src="/images/dps-comfort.webp" 
                  alt="Komfort w domu pomocy społecznej" 
                  className="w-full h-48 object-contain"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  Jak wygląda życie w domu pomocy społecznej?
                </h3>
                <p className="text-neutral-700 mb-4">
                  Obalamy mity - zobacz jak naprawdę wygląda codzienny dzień mieszkańca DPS i jakie ma prawa.
                </p>
                <a href="#" className="text-accent-600 hover:text-accent-700 font-medium inline-flex items-center gap-2">
                  Czytaj więcej
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </article>
            
            {/* Artykuł 2 - ŚDS */}
            <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-12 bg-success-50 p-8 flex items-center justify-center relative">
                {/* Tag kategorii */}
                <span className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-xs font-medium text-success-600 border border-success-200">
                  Środowiskowe
                </span>
                <img 
                  src="/images/garden-therapy.webp" 
                  alt="Terapia ogrodowa w ŚDS" 
                  className="w-full h-48 object-contain"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  Środowiskowe Domy Samopomocy - alternatywa dla DPS
                </h3>
                <p className="text-neutral-700 mb-4">
                  Poznaj dzienne formy wsparcia: hortiterapia, arteterapia i zajęcia grupowe dla osób z demencją.
                </p>
                <a href="#" className="text-accent-600 hover:text-accent-700 font-medium inline-flex items-center gap-2">
                  Czytaj więcej
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </article>
            
            {/* Artykuł 3 - Finanse */}
            <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-w-16 aspect-h-12 bg-primary-50 p-8 flex items-center justify-center relative">
                {/* Tag kategorii */}
                <span className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-xs font-medium text-primary-600 border border-primary-200">
                  Finanse i prawo
                </span>
                <img 
                  src="/images/family-support.webp" 
                  alt="Wsparcie dla rodziny" 
                  className="w-full h-48 object-contain"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                  Ile to kosztuje? Finansowanie opieki krok po kroku
                </h3>
                <p className="text-neutral-700 mb-4">
                  Od dopłat MOPS po ulgi podatkowe - kompletny przewodnik finansowania opieki nad seniorem.
                </p>
                <a href="#" className="text-accent-600 hover:text-accent-700 font-medium inline-flex items-center gap-2">
                  Czytaj więcej
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </article>
          </div>

          {/* Mobile: Horizontal Scroll Carousel */}
          <div className="md:hidden overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
              {/* Artykuł 1 - DPS */}
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden" style={{ width: '300px' }}>
                <div className="bg-accent-50 p-6 flex items-center justify-center h-40 relative">
                  <span className="absolute top-2 left-2 bg-white px-2 py-0.5 rounded-full text-xs font-medium text-accent-600">
                    Domy Pomocy
                  </span>
                  <img 
                    src="/images/dps-comfort.webp" 
                    alt="Komfort w domu pomocy społecznej" 
                    className="w-full h-32 object-contain"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Życie w domu pomocy społecznej
                  </h3>
                  <p className="text-sm text-neutral-700 mb-3">
                    Obalamy mity - zobacz jak wygląda dzień w DPS.
                  </p>
                  <a href="#" className="text-accent-600 hover:text-accent-700 font-medium text-sm inline-flex items-center gap-1">
                    Czytaj więcej
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </article>
              
              {/* Artykuł 2 - ŚDS */}
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden" style={{ width: '300px' }}>
                <div className="bg-success-50 p-6 flex items-center justify-center h-40 relative">
                  <span className="absolute top-2 left-2 bg-white px-2 py-0.5 rounded-full text-xs font-medium text-success-600">
                    Środowiskowe
                  </span>
                  <img 
                    src="/images/garden-therapy.webp" 
                    alt="Terapia ogrodowa w ŚDS" 
                    className="w-full h-32 object-contain"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Środowiskowe Domy Samopomocy
                  </h3>
                  <p className="text-sm text-neutral-700 mb-3">
                    Dzienne wsparcie: hortiterapia i zajęcia grupowe.
                  </p>
                  <a href="#" className="text-accent-600 hover:text-accent-700 font-medium text-sm inline-flex items-center gap-1">
                    Czytaj więcej
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </article>
              
              {/* Artykuł 3 - Finanse */}
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden" style={{ width: '300px' }}>
                <div className="bg-primary-50 p-6 flex items-center justify-center h-40 relative">
                  <span className="absolute top-2 left-2 bg-white px-2 py-0.5 rounded-full text-xs font-medium text-primary-600">
                    Finanse i prawo
                  </span>
                  <img 
                    src="/images/family-support.webp" 
                    alt="Wsparcie dla rodziny" 
                    className="w-full h-32 object-contain"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                    Finansowanie opieki
                  </h3>
                  <p className="text-sm text-neutral-700 mb-3">
                    Dopłaty MOPS, ulgi podatkowe - kompletny przewodnik.
                  </p>
                  <a href="#" className="text-accent-600 hover:text-accent-700 font-medium text-sm inline-flex items-center gap-1">
                    Czytaj więcej
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </article>
            </div>
          </div>
          
          {/* CTA dla więcej artykułów */}
          <div className="text-center mt-12">
            <button className="bg-white hover:bg-neutral-50 text-neutral-900 px-8 py-3 rounded-lg font-medium border-2 border-neutral-300 transition-colors inline-flex items-center gap-2">
              Zobacz wszystkie poradniki
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>


      <section className="py-16 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Rozpocznij poszukiwania już dziś
          </h2>
          <p className="text-xl text-neutral-700 mb-8">
            Pomożemy Ci znaleźć najlepszą opiekę dla Twojego bliskiego
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-sm hover:shadow-md">
              Znajdź dom opieki
            </button>
            <button className="bg-white hover:bg-neutral-50 text-neutral-900 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-neutral-300 transition-colors">
              Użyj kalkulatora
            </button>
          </div>
        </div>
      </section>

      {/* Location Search Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-3xl font-bold text-neutral-900">
              Szukasz w konkretnej lokalizacji?
            </h2>
          </div>
          
          {/* Category Tabs */}
          <div className="flex justify-center gap-2 mb-6">
            <button className="bg-white border-2 border-accent-500 text-neutral-900 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
              Domy Pomocy Społecznej (DPS)
            </button>
            <button className="bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
              Środowiskowe Domy Samopomocy (ŚDS)
            </button>
          </div>
          
          <div className="bg-white rounded-xl border border-neutral-200 p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Kolumna 1 */}
              <div className="space-y-4">
                <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Kraków</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                
                <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Limanowa</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                
                <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Nowy Targ</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              
              {/* Kolumna 2 */}
              <div className="space-y-4">
                <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Nowy Sącz</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                
                <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Wadowice</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                
                <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Oświęcim</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              
              {/* Kolumna 3 */}
              <div className="space-y-4">
                <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Tarnów</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                
                <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Zakopane</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                
                <a href="#" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Myślenice</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
            
            {/* View All Button */}
            <div className="mt-8 text-center">
              <button className="inline-flex items-center gap-2 bg-accent-100 hover:bg-accent-200 text-accent-700 px-6 py-3 rounded-lg font-medium transition-colors">
                Zobacz wszystkie lokalizacje
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* Mini FAQ Section */}
      <MiniFAQSection />

      {/* Newsletter Section */}
      <section className="py-16 bg-gradient-to-br from-accent-500 to-accent-600">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Bądź na bieżąco z kompaseniora.pl
            </h2>
            <p className="text-lg text-accent-50 max-w-2xl mx-auto">
              Otrzymuj aktualizacje o nowych domach opieki, zmianach cen oraz wsparcie dla całej rodziny w opiece nad bliskimi.
            </p>
          </div>
          
          <form className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Twój adres email"
                className="flex-1 px-6 py-4 rounded-lg text-lg text-neutral-900 placeholder:text-white border-2 border-white bg-white/10 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors whitespace-nowrap"
              >
                Zapisz się
              </button>
            </div>
            <p className="text-sm text-accent-50 mt-4 text-center">
              Nie dzielimy się danymi z nikim. Wypisz się kiedy chcesz.
            </p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-semibold text-neutral-900">Kompas Seniora</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-neutral-700">
              <a href="#" className="hover:text-neutral-900 transition-colors">Polityka prywatności</a>
              <a href="#" className="hover:text-neutral-900 transition-colors">Regulamin</a>
              <a href="#" className="hover:text-neutral-900 transition-colors">Kontakt</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-neutral-200 text-center">
            <p className="text-neutral-500 text-sm">
              © 2024 Kompas Seniora. Dane z oficjalnych źródeł MOPS i urzędów miast.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}