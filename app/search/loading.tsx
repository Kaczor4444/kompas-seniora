// app/search/loading.tsx
// Skeleton dopasowany do aktualnego układu SearchResults:
// - nagłówek z paskiem wyszukiwania
// - split 50/50: lista kart | mapa
export default function SearchLoading() {
  return (
    <div className="flex flex-col bg-gray-50 h-screen">

      {/* Nagłówek — identyczny układ jak SearchHeader */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">

            {/* Strzałka wstecz */}
            <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />

            {/* Tytuł — widoczny tylko md+ */}
            <div className="hidden sm:block w-48 h-6 bg-gray-200 rounded animate-pulse flex-shrink-0" />

            {/* Pasek wyszukiwania */}
            <div className="flex-1 max-w-md h-11 bg-gray-100 rounded-xl animate-pulse" />

            {/* Przycisk filtrów — widoczny tylko md+ */}
            <div className="hidden md:block w-11 h-11 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />

          </div>
        </div>
      </div>

      {/* Obszar treści: lista + mapa */}
      <div className="flex flex-1 overflow-hidden">

        {/* Lista wyników — lewa połowa */}
        <div className="flex-1 md:w-1/2 overflow-y-auto p-3 sm:p-4 md:p-8">
          <div className="max-w-2xl ml-auto mr-0 md:mr-4 space-y-3 sm:space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl sm:rounded-3xl border-2 border-gray-100 flex flex-col sm:flex-row gap-4 sm:gap-6 p-4"
              >
                {/* Miniatura */}
                <div className="w-full sm:w-[245px] h-48 sm:h-[195px] flex-shrink-0 rounded-xl sm:rounded-2xl bg-gray-200 animate-pulse" />

                {/* Treść */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1 sm:py-2">
                  <div>
                    {/* Kategoria */}
                    <div className="w-36 h-3 bg-gray-200 rounded animate-pulse mb-2" />
                    {/* Tytuł */}
                    <div className="space-y-2 mb-3">
                      <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse" />
                      <div className="w-1/2 h-5 bg-gray-200 rounded animate-pulse" />
                    </div>
                    {/* Lokalizacja */}
                    <div className="w-44 h-4 bg-gray-200 rounded animate-pulse mb-4" />
                    {/* Tagi profilu */}
                    <div className="flex gap-2">
                      <div className="w-20 h-5 bg-gray-200 rounded-full animate-pulse" />
                      <div className="w-28 h-5 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                  </div>
                  {/* Cena + przyciski */}
                  <div className="flex items-end justify-between gap-3 pt-3 border-t border-gray-100 mt-3">
                    <div>
                      <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="w-24 h-7 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
                      <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mapa — prawa połowa, tylko md+ */}
        <div className="hidden md:block md:w-1/2 bg-gray-100 animate-pulse" />

      </div>
    </div>
  );
}
