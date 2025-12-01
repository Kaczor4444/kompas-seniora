import { useState, useEffect } from 'react';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showSearch, setShowSearch] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Pokaż/ukryj search bar w zależności od kierunku scrollu
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scroll w dół + poza hero -> ukryj search
        setShowSearch(false);
        setIsScrolled(true);
      } else if (currentScrollY < lastScrollY) {
        // Scroll w górę -> pokaż search
        setShowSearch(true);
      }

      // Jeśli jesteśmy na górze strony, zawsze pokaż search
      if (currentScrollY < 50) {
        setShowSearch(true);
        setIsScrolled(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div
      id="filters-section"
      className={`sticky top-16 z-40 bg-gray-50 -mx-4 px-4 md:-mx-6 md:px-6 shadow-sm mb-4 md:mb-8 transition-all duration-300 ${
        isScrolled && !showSearch ? 'py-2' : 'py-3'
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Rząd 1: Search + Sort (mobile obok siebie, desktop Search full width) */}
        <div className={`flex gap-2 transition-all duration-300 overflow-hidden ${
          showSearch
            ? 'opacity-100 max-h-20'
            : 'opacity-0 max-h-0 pointer-events-none'
        }`}>
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

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-medium text-sm hover:bg-emerald-200 transition-all flex items-center gap-2"
                aria-label={`Usuń wyszukiwanie: ${searchQuery}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="max-w-[150px] truncate">"{searchQuery}"</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
