// src/components/filters/MobileFilterDrawer.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import FilterSidebar from './FilterSidebar';

interface MobileFilterDrawerProps {
  totalResults: number;
  careProfileCounts: Record<string, number>;
  hasUserLocation?: boolean;
}

export default function MobileFilterDrawer({ 
  totalResults,
  careProfileCounts,
  hasUserLocation = false
}: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchParams.get('type') && searchParams.get('type') !== 'all') count++;
    if (searchParams.get('woj') && searchParams.get('woj') !== 'all') count++;
    if (searchParams.get('powiat')) count++;
    const careTypes = searchParams.get('care');
    if (careTypes) count += careTypes.split(',').length;
    if (searchParams.get('min')) count++;
    if (searchParams.get('max')) count++;
    if (searchParams.get('free') === 'true') count++;
    return count;
  }, [searchParams]);

  return (
    <>
      <button
        data-mobile-filter-trigger
        onClick={() => setIsOpen(true)}
        className="sr-only"
      />

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed inset-0 bg-white z-[9999] transform transition-transform duration-300 lg:hidden flex flex-col ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}
        style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Filtry</h2>
            {activeFiltersCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 bg-accent-100 text-accent-700 text-xs font-semibold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <FilterSidebar 
            totalResults={totalResults} 
            careProfileCounts={careProfileCounts}
            hasUserLocation={hasUserLocation}
            showSorting={false}
          />
        </div>

        <div className="bg-white border-t px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <button onClick={() => setIsOpen(false)} className="w-full bg-accent-600 hover:bg-accent-700 text-white font-medium py-3 rounded-lg">
            {activeFiltersCount > 0 ? `Zastosuj (${activeFiltersCount}) • ${totalResults} wyników` : `Pokaż ${totalResults} wyników`}
          </button>
        </div>
      </div>
    </>
  );
}