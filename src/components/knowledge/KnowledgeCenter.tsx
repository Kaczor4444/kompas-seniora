export default function KnowledgeCenter() {
    return (
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
    )
  }