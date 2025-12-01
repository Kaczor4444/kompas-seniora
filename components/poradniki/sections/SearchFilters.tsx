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
  showPopularModal: boolean;
  setShowPopularModal: (show: boolean) => void;
  onResetFilters: () => void;
  popularArticles: any[];
}

export default function SearchFilters({
  searchQuery,
  setSearchQuery,
  categories,
  activeCategory,
  setActiveCategory,
  sortBy,
  setSortBy,
  showPopularModal,
  setShowPopularModal,
  onResetFilters,
  popularArticles,
}: SearchFiltersProps) {
  return (
    <div
      id="filters-section"
      className="sticky top-16 z-40 bg-gray-50 py-3 -mx-4 px-4 md:-mx-6 md:px-6 shadow-sm mb-4 md:mb-8 space-y-4"
    >
      <SearchBar onSearch={setSearchQuery} />
      <div className="flex flex-wrap gap-2 md:gap-4 items-start justify-between">
        <CategoryFilters
          categories={[...categories]}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />
        <div className="flex gap-2 items-center">
          {/* Mobile: Najczęściej czytane button */}
          <button
            onClick={() => setShowPopularModal(!showPopularModal)}
            className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg font-semibold text-gray-900 hover:border-emerald-300 transition-all"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Najczęściej
            </span>
            <svg 
              className={`w-5 h-5 ml-2 transition-transform ${showPopularModal ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <SortDropdown onSortChange={setSortBy} />

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
  );
}
