// src/components/filters/MobileFilterDrawer.tsx
'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import FilterSidebar from './FilterSidebar';

interface MobileFilterDrawerProps {
  totalResults: number;
  careProfileCounts: Record<string, number>;
}

export default function MobileFilterDrawer({ 
  totalResults,
  careProfileCounts
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();

  // ✅ NOWE: Obliczamy liczbę aktywnych filtrów
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    
    // Typ placówki (nie liczymy 'all')
    if (searchParams.get('type') && searchParams.get('type') !== 'all') count++;
    
    // Województwo
    if (searchParams.get('woj') && searchParams.get('woj') !== 'all') count++;
    
    // Powiat
    if (searchParams.get('powiat')) count++;
    
    // Profile opieki
    const careTypes = searchParams.get('care');
    if (careTypes) count += careTypes.split(',').length;
    
    // Cena min/max
    if (searchParams.get('min')) count++;
    if (searchParams.get('max')) count++;
    
    // Bezpłatne
    if (searchParams.get('free') === 'true') count++;
    
    return count;
  }, [searchParams]);

  return (
    <>
      {/* ✅ UPDATED: Trigger Button z badge */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="font-medium">Filtry</span>
        
        {/* ✅ NOWE: Badge z licznikiem aktywnych filtrów */}
        {activeFiltersCount > 0 && (
          <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[24px] h-6 px-2 bg-accent-600 text-white text-xs font-bold rounded-full shadow-lg">
            {activeFiltersCount}
          </span>
        )}
        
        <span className="text-sm text-gray-500">({totalResults})</span>
      </button>

      {/* ✅ UPDATED: Backdrop z blur effect */}
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black/30 z-[9998] lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          style={{ touchAction: 'none' }}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 
          bg-white rounded-t-2xl shadow-2xl 
          z-[9999]
          transform transition-transform duration-300 ease-out 
          lg:hidden
          max-h-[90vh] 
          flex flex-col
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ touchAction: 'pan-y' }}
      >
        {/* Handle (drag indicator) */}
        <div className="flex justify-center pt-3 pb-2 bg-white rounded-t-2xl">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header z tytułem + przycisk X */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
            {/* ✅ NOWE: Badge w headerze też */}
            {activeFiltersCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-accent-100 text-accent-700 text-xs font-semibold rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Zamknij filtry"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <FilterSidebar 
            totalResults={totalResults} 
            careProfileCounts={careProfileCounts}
          />
        </div>

        {/* ✅ UPDATED: Bottom Action z licznikiem filtrów */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-accent-600 hover:bg-accent-700 text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
          >
            {activeFiltersCount > 0 
              ? `Zastosuj filtry (${activeFiltersCount}) • ${totalResults} wyników`
              : `Pokaż wyniki (${totalResults})`
            }
          </button>
        </div>
      </div>
    </>
  );
}