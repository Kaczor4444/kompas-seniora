// src/components/search/ActiveFilters.tsx
import React from 'react';
import { X } from 'lucide-react';

interface FilterChip {
  label: string;
  clear: () => void;
}

interface ActiveFiltersProps {
  chips: FilterChip[];
  isFavoritesView?: boolean;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  chips,
  isFavoritesView = false
}) => {
  if (chips.length === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {chips.map((chip, idx) => (
            <div
              key={idx}
              className="
                flex items-center gap-2
                px-3 py-1.5
                rounded-full
                bg-gray-100 text-gray-700
                border border-gray-200
                text-xs font-medium
                whitespace-nowrap
              "
            >
              {chip.label}
              <button
                onClick={chip.clear}
                className="hover:text-red-500 transition-colors p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
