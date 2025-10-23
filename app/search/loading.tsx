// app/search/loading.tsx
export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT: Sidebar skeleton (desktop only) */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6 animate-pulse">
              {/* Filtry header */}
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              
              {/* Filter sections */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Results skeleton */}
          <div className="flex-1 min-w-0">
            {/* Mobile sticky bar skeleton */}
            <div className="lg:hidden mb-4">
              <div className="h-14 bg-white rounded-lg shadow-sm animate-pulse"></div>
            </div>

            {/* Results grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Facility cards skeleton */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
                    {/* Header */}
                    <div className="mb-4">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>

                    {/* Location */}
                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3 mt-1"></div>
                      </div>

                      {/* Profile badges */}
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="flex gap-2">
                          <div className="h-6 bg-gray-200 rounded w-20"></div>
                          <div className="h-6 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>

                      {/* Price */}
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-6 bg-gray-200 rounded w-28"></div>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Map skeleton (desktop) */}
              <div className="hidden md:block lg:col-span-1">
                <div className="lg:sticky lg:top-20">
                  <div className="h-6 bg-gray-200 rounded w-40 mb-3 animate-pulse"></div>
                  <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
