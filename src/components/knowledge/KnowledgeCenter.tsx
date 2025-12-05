import Link from 'next/link';

export default function KnowledgeCenter() {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              🎯 Nie wiesz od czego zacząć?
            </h2>
            <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
              Zacznij od tych artykułów - pomogą Ci podjąć pierwszą decyzję
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
          
          {/* Desktop: Grid 3 kolumny */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {/* Artykuł 1 - Wybór placówki */}
            <Link
              href="/poradniki/wybor-opieki/wybor-placowki"
              aria-label="Jak wybrać odpowiednią placówkę dla seniora?"
              className="group"
            >
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow h-full relative">
                {/* Badge POLECAMY - top right */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold animate-pulse z-10">
                  POLECAMY
                </div>
                <div className="aspect-w-16 aspect-h-12 bg-accent-50 p-8 flex items-center justify-center relative">
                  <img
                    src="/images/dps-comfort.webp"
                    alt="Jak wybrać placówkę dla seniora"
                    className="w-full h-48 object-contain"
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

            {/* Artykuł 2 - Koszty opieki */}
            <Link
              href="/poradniki/finanse-prawne/koszty-opieki"
              aria-label="Ile kosztuje dom opieki?"
              className="group pointer-events-none"
            >
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden h-full relative opacity-75">
                {/* Badge WKRÓTCE - top right */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold z-10">
                  WKRÓTCE
                </div>
                <div className="aspect-w-16 aspect-h-12 bg-gray-50 p-8 flex items-center justify-center relative">
                  <img
                    src="/images/family-support.webp"
                    alt="Koszty domu opieki"
                    className="w-full h-48 object-contain"
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

            {/* Artykuł 3 - DPS vs ŚDS */}
            <Link
              href="/poradniki/wybor-opieki/dps-vs-sds"
              aria-label="Czym różni się DPS od ŚDS?"
              className="group pointer-events-none"
            >
              <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden h-full relative opacity-75">
                {/* Badge WKRÓTCE - top right */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold z-10">
                  WKRÓTCE
                </div>
                <div className="aspect-w-16 aspect-h-12 bg-gray-50 p-8 flex items-center justify-center relative">
                  <img
                    src="/images/garden-therapy.webp"
                    alt="Różnice DPS i ŚDS"
                    className="w-full h-48 object-contain"
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
          </div>
  
          {/* Mobile: Horizontal Scroll Carousel */}
          <div className="md:hidden overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
              {/* Artykuł 1 - Wybór placówki */}
              <Link
                href="/poradniki/wybor-opieki/wybor-placowki"
                aria-label="Jak wybrać odpowiednią placówkę dla seniora?"
                className="group"
              >
                <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden relative" style={{ width: '300px' }}>
                  {/* Badge POLECAMY - top right */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold animate-pulse z-10">
                    POLECAMY
                  </div>
                  <div className="bg-accent-50 p-6 flex items-center justify-center h-40 relative">
                    <img
                      src="/images/dps-comfort.webp"
                      alt="Jak wybrać placówkę dla seniora"
                      className="w-full h-32 object-contain"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-emerald-600 transition-colors">
                      Jak wybrać odpowiednią placówkę dla seniora?
                    </h3>
                    <p className="text-sm text-neutral-700 mb-2">
                      Poznaj kryteria wyboru. Dowiedz się na co zwrócić uwagę.
                    </p>
                    <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                      Rozpocznij czytanie →
                    </span>
                  </div>
                </article>
              </Link>

              {/* Artykuł 2 - Koszty opieki */}
              <Link
                href="/poradniki/finanse-prawne/koszty-opieki"
                aria-label="Ile kosztuje dom opieki?"
                className="group pointer-events-none"
              >
                <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden relative opacity-75" style={{ width: '300px' }}>
                  {/* Badge WKRÓTCE - top right */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold z-10">
                    WKRÓTCE
                  </div>
                  <div className="bg-gray-50 p-6 flex items-center justify-center h-40 relative">
                    <img
                      src="/images/family-support.webp"
                      alt="Koszty domu opieki"
                      className="w-full h-32 object-contain"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      Ile kosztuje dom opieki?
                    </h3>
                    <p className="text-sm text-neutral-700 mb-2">
                      Koszty pobytu i możliwości dofinansowania z MOPS
                    </p>
                    <span className="text-xs text-gray-500 font-medium inline-flex items-center gap-1 opacity-50 cursor-not-allowed">
                      W przygotowaniu
                    </span>
                  </div>
                </article>
              </Link>

              {/* Artykuł 3 - DPS vs ŚDS */}
              <Link
                href="/poradniki/wybor-opieki/dps-vs-sds"
                aria-label="Czym różni się DPS od ŚDS?"
                className="group pointer-events-none"
              >
                <article className="bg-white rounded-xl border border-neutral-200 overflow-hidden relative opacity-75" style={{ width: '300px' }}>
                  {/* Badge WKRÓTCE - top right */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold z-10">
                    WKRÓTCE
                  </div>
                  <div className="bg-gray-50 p-6 flex items-center justify-center h-40 relative">
                    <img
                      src="/images/garden-therapy.webp"
                      alt="Różnice DPS i ŚDS"
                      className="w-full h-32 object-contain"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      Czym różni się DPS od ŚDS?
                    </h3>
                    <p className="text-sm text-neutral-700 mb-2">
                      Zrozum różnice i wybierz właściwą formę opieki
                    </p>
                    <span className="text-xs text-gray-500 font-medium inline-flex items-center gap-1 opacity-50 cursor-not-allowed">
                      W przygotowaniu
                    </span>
                  </div>
                </article>
              </Link>
            </div>
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