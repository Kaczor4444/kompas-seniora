// src/components/search/ActiveFilters.tsx
import React from 'react';
import { X, Wallet, Star } from 'lucide-react';

interface FilterChip {
  label: string;
  clear: () => void;
}

interface ActiveFiltersProps {
  chips: FilterChip[];
  quickFilterNFZ: boolean;
  quickFilterBest: boolean;
  onToggleNFZ: () => void;
  onToggleBest: () => void;
  isFavoritesView?: boolean;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  chips,
  quickFilterNFZ,
  quickFilterBest,
  onToggleNFZ,
  onToggleBest,
  isFavoritesView = false
}) => {
  if (chips.length === 0 && !quickFilterNFZ && !quickFilterBest && isFavoritesView) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          
          {/* Quick Filters */}
          {!isFavoritesView && (
            <>
              <QuickChip
                active={quickFilterNFZ}
                onClick={onToggleNFZ}
                icon={<Wallet size={14} />}
                label="Finansowane NFZ"
              />
              <QuickChip
                active={quickFilterBest}
                onClick={onToggleBest}
                icon={<Star size={14} />}
                label="Najwyżej oceniane"
              />
            </>
          )}

          {/* Active Filter Chips */}
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

// Helper Component
const QuickChip = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2
      px-4 py-2
      rounded-full
      text-xs font-semibold
      border
      transition-all
      whitespace-nowrap
      ${active
        ? 'bg-gray-900 border-gray-900 text-white'
        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
      }
    `}
  >
    <span className={active ? 'text-white' : 'text-emerald-600'}>{icon}</span>
    {label}
  </button>
);
