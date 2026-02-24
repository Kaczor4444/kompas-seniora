// app/search/loading.tsx
// Skeleton dopasowany do NOWEGO układu SearchResults:
// - navbar (z layout.tsx)
// - 2-column flex: sidebar z filtrami (left) | lista kart (right, wyśrodkowana)
export default function SearchLoading() {
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen pt-20">

      {/* 2-COLUMN LAYOUT: Sidebar + Content */}
      <div className="flex w-full">

        {/* LEFT SIDEBAR - FILTERS (Desktop only) */}
        <div className="hidden lg:block sticky top-20 w-80 h-fit max-h-[calc(100vh-100px)] bg-white border-r border-slate-200 self-start">
          <div className="p-6 space-y-5">
            {/* Filters Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Filter sections */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-3">
                <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                <div className="w-full h-10 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE - CONTENT */}
        <div className="flex-1 flex flex-col bg-slate-50">

          {/* Desktop Sticky Header - Search Bar */}
          <div className="hidden md:block sticky top-20 z-30 bg-white border-b border-gray-200 shadow-md">
            {/* Row 1: Search Bar */}
            <div className="px-6 py-3 border-b border-gray-100 flex justify-center">
              <div className="w-full max-w-2xl h-12 bg-gray-100 rounded-xl animate-pulse" />
            </div>

            {/* Row 2: Results count + Sort + Toggle */}
            <div className="flex items-center justify-between gap-4 px-6 py-3">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
              <div className="flex items-center gap-4">
                <div className="w-40 h-9 bg-gray-100 rounded-lg animate-pulse" />
                <div className="w-32 h-9 bg-gray-900/10 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>

          {/* Lista wyników - wyśrodkowana */}
          <div className="w-full overflow-y-auto h-[calc(100vh-136px)] md:h-[calc(100vh-80px-56px)]">
            <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl sm:rounded-3xl border-2 border-gray-100 flex flex-col sm:flex-row gap-4 sm:gap-6 p-4"
                >
                  {/* Image */}
                  <div className="relative w-full sm:w-[245px] h-48 sm:h-[195px] flex-shrink-0 rounded-xl sm:rounded-2xl bg-gray-200 animate-pulse">
                    <div className="absolute bottom-3 right-3">
                      <div className="w-12 h-6 bg-gray-300 rounded-lg animate-pulse" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1 sm:py-2">
                    <div>
                      <div className="w-40 h-3 sm:h-3.5 bg-gray-200 rounded animate-pulse mb-1.5 sm:mb-2" />
                      <div className="space-y-1.5 sm:space-y-2 mb-1.5 sm:mb-2">
                        <div className="w-3/4 h-4 sm:h-5 md:h-6 bg-gray-200 rounded animate-pulse" />
                        <div className="w-1/2 h-4 sm:h-5 md:h-6 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-3.5 h-3.5 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                        <div className="w-36 sm:w-44 h-3.5 sm:h-4 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <div className="w-20 h-5 sm:h-6 bg-gray-200 rounded-full animate-pulse" />
                        <div className="w-28 h-5 sm:h-6 bg-gray-200 rounded-full animate-pulse" />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-3 min-w-0 pt-3 border-t border-gray-100">
                      <div>
                        <div className="w-16 sm:w-20 h-2.5 sm:h-3 bg-gray-200 rounded animate-pulse mb-0.5 sm:mb-1" />
                        <div className="w-24 sm:w-28 h-6 sm:h-8 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse" />
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
