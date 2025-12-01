import SearchBar from '@/components/poradniki/SearchBar';
import CategoryFilters from '@/components/poradniki/CategoryFilters';
import SortDropdown from '@/components/poradniki/SortDropdown';

interface SearchFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: readonly string[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onResetFilters: () => void;
}

export default function SearchFilters({
  searchQuery,
  setSearchQuery,
  categories,
  activeCategory,
  setActiveCategory,
  sortBy,
  setSortBy,
  onResetFilters,
}: SearchFiltersProps) {
  return (
    <div
      id="filters-section"
      className="sticky top-16 z-40 bg-gray-50 py-3 -mx-4 px-4 md:-mx-6 md:px-6 shadow-sm mb-4 md:mb-8"
    >
      <div className="flex flex-col gap-3">
        {/* Rząd 1: Search + Sort (mobile obok siebie, desktop Search full width) */}
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchBar onSearch={setSearchQuery} />
          </div>
          <div className="md:hidden">
            <SortDropdown onSortChange={setSortBy} />
          </div>
        </div>

        {/* Rząd 2: Categories + Sort (desktop) + Reset */}
        <div className="flex flex-wrap gap-2 md:gap-4 items-start justify-between">
          <CategoryFilters
            categories={[...categories]}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          <div className="flex gap-2 items-center">
            <div className="hidden md:block">
              <SortDropdown onSortChange={setSortBy} />
            </div>

            {(searchQuery || activeCategory !== 'Wszystkie') && (
              <button
                onClick={onResetFilters}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-all min-h-[44px] flex items-center gap-2"
                aria-label="Wyczyść wszystkie filtry"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Wyczyść filtry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
