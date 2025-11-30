'use client';

interface CategoryFiltersProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilters({ categories, activeCategory, onCategoryChange }: CategoryFiltersProps) {
  // Skrócone nazwy kategorii na mobile
  const categoryLabels: Record<string, string> = {
    'Wszystkie': 'Wszystkie',
    'Wybór opieki': 'Opieka',
    'Porady dla opiekunów': 'Opiekunowie',
    'Porady dla seniorów': 'Seniorzy',
    'Finanse i świadczenia': 'Finanse',
    'Prawne aspekty': 'Prawne'
  };

  return (
    <div className="flex flex-wrap gap-1.5 md:gap-2">
      {categories.map((category) => {
        const isActive = activeCategory === category;
        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-3 py-2 md:px-5 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm transition-all min-h-[44px] ${
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
    </div>
  );
}
