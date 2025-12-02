'use client';

import { useState } from 'react';

interface CategoryFiltersProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilters({ categories, activeCategory, onCategoryChange }: CategoryFiltersProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Skrócone nazwy kategorii na mobile
  const categoryLabels: Record<string, string> = {
    'Wszystkie': 'Wszystkie',
    'Wybór opieki': 'Opieka',
    'Dla opiekuna': 'Opiekun',
    'Dla seniora': 'Senior',
    'Finanse i świadczenia': 'Finanse',
    'Prawne aspekty': 'Prawne'
  };

  // Podział na primary (zawsze widoczne) i secondary (w dropdown)
  const primaryCategories = categories.slice(0, 4); // Pierwsze 4: Wszystkie, Opieka, Opiekun, Senior
  const secondaryCategories = categories.slice(4); // Reszta w dropdown

  return (
    <div className="flex flex-wrap gap-1.5 md:gap-2 will-change-transform" style={{ backfaceVisibility: 'hidden' }}>
      {/* Primary categories - zawsze widoczne */}
      {primaryCategories.map((category) => {
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-2.5 py-2 md:px-5 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm transition-all min-h-[44px] ${
              isActive
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <span className="hidden sm:inline">{category}</span>
            <span className="sm:hidden">{categoryLabels[category] || category}</span>
          </button>
        );
      })}

      {/* Przycisk "Więcej" z dropdown - hover na desktop, click na mobile */}
      {secondaryCategories.length > 0 && (
        <div
          className="relative"
          onMouseEnter={() => setShowDropdown(true)}
          onMouseLeave={() => setShowDropdown(false)}
        >
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-2.5 py-2 md:px-5 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm transition-all min-h-[44px] bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:shadow-sm flex items-center gap-1"
            style={{ transform: 'translate3d(0,0,0)' }}
            aria-expanded={showDropdown}
            aria-haspopup="true"
          >
            <span>Więcej</span>
            <svg
              className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown z secondary categories */}
          {showDropdown && (
            <div className="absolute z-10 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] left-0">
              {secondaryCategories.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => {
                      onCategoryChange(category);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
