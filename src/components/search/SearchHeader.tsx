// src/components/search/SearchHeader.tsx
import React from 'react';
import { Search, SlidersHorizontal, ChevronLeft } from 'lucide-react';

interface SearchHeaderProps {
  cityInput: string;
  onCityChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  activeFiltersCount: number;
  onBack: () => void;
  isFavoritesView?: boolean;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  cityInput,
  onCityChange,
  showFilters,
  onToggleFilters,
  activeFiltersCount,
  onBack,
  isFavoritesView = false
}) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center gap-4">
          
          {/* Back Button */}
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Title */}
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 hidden sm:block">
            {isFavoritesView ? 'Zapisane placówki' : 'Wyniki wyszukiwania'}
          </h1>

          {/* Search Input */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                size={18} 
              />
              <input
                type="text"
                value={cityInput}
                onChange={(e) => onCityChange(e.target.value)}
                placeholder="Wyszukaj miasto..."
                className="
                  w-full pl-10 pr-4 py-3
                  bg-gray-50 border border-gray-200 rounded-xl
                  text-sm
                  focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100
                  outline-none transition-all
                "
              />
            </div>
          </div>

          {/* Filters Button — hidden on mobile (handled by MobileBottomBar) */}
          <button
            onClick={onToggleFilters}
            className={`
              hidden md:block relative p-3 rounded-xl border transition-all
              ${showFilters
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <SlidersHorizontal size={20} />
            
            {/* Badge */}
            {activeFiltersCount > 0 && (
              <span className="
                absolute -top-1 -right-1 
                w-5 h-5 
                bg-emerald-600 text-white
                text-[10px] font-bold 
                rounded-full 
                flex items-center justify-center
                border-2 border-white
              ">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
