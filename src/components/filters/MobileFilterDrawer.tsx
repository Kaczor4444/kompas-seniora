// src/components/filters/MobileFilterDrawer.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import FilterSidebar from './FilterSidebar';

interface MobileFilterDrawerProps {
  totalResults: number;
  careProfileCounts: Record<string, number>;
  hasUserLocation?: boolean; // ✅ DODANE: dla sortowania
}

export default function MobileFilterDrawer({ 
  totalResults,
  careProfileCounts,
  hasUserLocation = false
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();

  // ✅ NOWE: Body scroll lock - blokuje scrollowanie strony gdy drawer otwarty
  useEffect(() => {
    if (isOpen) {
      // Zapisz aktualną pozycję scrolla
      const scrollY = window.scrollY;
      
      // Zablokuj body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Przywróć scroll
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        // Przywróć pozycję scrolla
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

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
      {/* ✅ UPDATED: Trigger Button z badge + data attribute dla sticky bara */}
      {/* Ukryty button do triggerowania przez MobileStickyBar */}
      <button
        data-mobile-filter-trigger
        onClick={() => setIsOpen(true)}
        className="sr-only"
        aria-label="Otwórz filtry"
      />

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
        style={{ 
          touchAction: 'pan-y',
          overscrollBehavior: 'contain' // ✅ Zapobiega scroll chaining
        }}
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
            hasUserLocation={hasUserLocation}
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