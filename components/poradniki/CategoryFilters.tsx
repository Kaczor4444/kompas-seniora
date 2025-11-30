'use client';

interface CategoryFiltersProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilters({ categories, activeCategory, onCategoryChange }: CategoryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all min-h-[44px] ${
              isActive
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
