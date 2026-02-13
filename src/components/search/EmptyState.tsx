// src/components/search/EmptyState.tsx
import React from 'react';
import { Search } from 'lucide-react';

interface EmptyStateProps {
  onResetFilters: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onResetFilters }) => {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Search size={32} className="text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Nie znaleziono placówek
      </h3>
      
      <p className="text-gray-500 text-center max-w-sm mb-6">
        Spróbuj zmienić kryteria wyszukiwania lub wyczyść filtry, aby zobaczyć więcej wyników.
      </p>
      
      <button
        onClick={onResetFilters}
        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
      >
        Wyczyść filtry
      </button>
    </div>
  );
};
