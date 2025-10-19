// src/components/filters/FilterSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PriceFilter from './PriceFilter';

interface FilterSidebarProps {
  totalResults: number;
}

export default function FilterSidebar({ totalResults }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Local state for optimistic updates
  const [localType, setLocalType] = useState<string>(
    searchParams.get('type') || 'all'
  );

  // Sync local state with URL changes
  useEffect(() => {
    const urlType = searchParams.get('type') || 'all';
    setLocalType(urlType);
  }, [searchParams]);

  // Przeczytaj aktualne filtry z URL
  const currentFilters = {
    query: searchParams.get('q') || '',
    type: localType, // ✅ Always use local state
    wojewodztwo: searchParams.get('woj') || 'all',
    minPrice: searchParams.get('min') ? parseInt(searchParams.get('min')!) : undefined,
    maxPrice: searchParams.get('max') ? parseInt(searchParams.get('max')!) : undefined,
    showFree: searchParams.get('free') === 'true',
  };

  // Handler dla zmiany filtrów
  const handleFilterChange = (updates: {
    minPrice?: number;
    maxPrice?: number;
    showFree?: boolean;
    type?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update type filter with optimistic UI FIRST
    if (updates.type !== undefined) {
      setLocalType(updates.type); // ⚡ Set local state immediately!
    }

    // Update price filters
    if (updates.minPrice !== undefined) {
      if (updates.minPrice > 0) {
        params.set('min', updates.minPrice.toString());
      } else {
        params.delete('min');
      }
    }

    if (updates.maxPrice !== undefined) {
      if (updates.maxPrice > 0) {
        params.set('max', updates.maxPrice.toString());
      } else {
        params.delete('max');
      }
    }

    if (updates.showFree !== undefined) {
      if (updates.showFree) {
        params.set('free', 'true');
      } else {
        params.delete('free');
      }
    }

    // Update type in URL
    if (updates.type !== undefined) {
      if (updates.type !== 'all') {
        params.set('type', updates.type);
      } else {
        params.delete('type');
      }
    }

    // Navigate z nowymi filtrami
    router.push(`/search?${params.toString()}`);
  };

  return (
    <aside className="w-full lg:w-80 space-y-6 lg:sticky lg:top-6 lg:self-start">
      {/* Header z liczbą wyników */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-neutral-200">
        <p className="text-sm text-neutral-600">
          Znaleziono <span className="font-semibold text-neutral-900">{totalResults}</span> placówek
        </p>
      </div>

      {/* Typ placówki */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-neutral-200">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Typ placówki
        </h3>
        
        <div className="space-y-3">
          {/* Wszystkie */}
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="radio"
                name="type"
                value="all"
                checked={currentFilters.type === 'all'}
                onChange={() => handleFilterChange({ type: 'all' })}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                currentFilters.type === 'all' 
                  ? 'border-accent-600 bg-accent-50' 
                  : 'border-neutral-300 bg-white group-hover:border-accent-400'
              }`}>
                {currentFilters.type === 'all' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-600"></div>
                )}
              </div>
            </div>
            <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
              Wszystkie
            </span>
          </label>

          {/* DPS */}
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="radio"
                name="type"
                value="dps"
                checked={currentFilters.type === 'dps'}
                onChange={() => handleFilterChange({ type: 'dps' })}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                currentFilters.type === 'dps' 
                  ? 'border-accent-600 bg-accent-50' 
                  : 'border-neutral-300 bg-white group-hover:border-accent-400'
              }`}>
                {currentFilters.type === 'dps' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-600"></div>
                )}
              </div>
            </div>
            <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
              DPS
            </span>
          </label>

          {/* ŚDS */}
          <label className="flex items-center space-x-3 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="radio"
                name="type"
                value="sds"
                checked={currentFilters.type === 'sds'}
                onChange={() => handleFilterChange({ type: 'sds' })}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                currentFilters.type === 'sds' 
                  ? 'border-accent-600 bg-accent-50' 
                  : 'border-neutral-300 bg-white group-hover:border-accent-400'
              }`}>
                {currentFilters.type === 'sds' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-accent-600"></div>
                )}
              </div>
            </div>
            <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
              ŚDS
            </span>
          </label>
        </div>
      </div>

      {/* Filtr ceny */}
      <PriceFilter
        minPrice={currentFilters.minPrice}
        maxPrice={currentFilters.maxPrice}
        showFree={currentFilters.showFree}
        onChange={handleFilterChange}
      />
    </aside>
  );
}