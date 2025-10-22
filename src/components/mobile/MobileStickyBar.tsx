// src/components/mobile/MobileStickyBar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface MobileStickyBarProps {
  totalResults: number;
  activeFiltersCount: number;
  hasUserLocation?: boolean;
}

export default function MobileStickyBar({ 
  totalResults, 
  activeFiltersCount,
  hasUserLocation = false 
}: MobileStickyBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(true);
  const [prevScrollY, setPrevScrollY] = useState(0);
  const [showSortModal, setShowSortModal] = useState(false);
  
  const currentSort = searchParams.get('sort') || '';

  // ✅ Auto-hide logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > prevScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < prevScrollY) {
        setIsVisible(true);
      }
      
      if (currentScrollY < 50) {
        setIsVisible(true);
      }
      
      setPrevScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollY]);

  // ✅ Trigger ukrytego buttona
  const handleOpenFilters = () => {
    const btn = document.querySelector('[data-mobile-filter-trigger]') as HTMLButtonElement;
    if (btn) btn.click();
  };

  const sortOptions = [
    { value: 'name_asc', label: 'A-Z', icon: '🔤' },
    { value: 'name_desc', label: 'Z-A', icon: '🔤' },
    { value: 'price_asc', label: 'Najtańsze', icon: '💰' },
    { value: 'price_desc', label: 'Najdroższe', icon: '💎' },
    ...(hasUserLocation ? [{ value: 'distance', label: 'Najbliższe', icon: '🧭' }] : []),
  ];

  const handleSortChange = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sortValue);
    router.push(`/search?${params.toString()}`);
    setShowSortModal(false);
  };

  const currentSortLabel = sortOptions.find(opt => opt.value === currentSort)?.label || 'Sortuj';

  return (
    <>
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex gap-2 p-3">
          <button onClick={handleOpenFilters} className="relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition min-h-[44px] active:scale-95">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium text-sm">Filtry</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-accent-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <button onClick={() => setShowSortModal(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition min-h-[44px] active:scale-95">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span className="font-medium text-sm truncate max-w-[100px]">{currentSortLabel}</span>
          </button>
        </div>
      </div>

      {showSortModal && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] lg:hidden" onClick={() => setShowSortModal(false)} />
          <div className="fixed inset-0 bg-white shadow-2xl z-[9999] lg:hidden animate-slide-down">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Sortuj wyniki</h3>
              <button onClick={() => setShowSortModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-2 h-full overflow-y-auto">
              {sortOptions.map((opt) => (
                <button key={opt.value} onClick={() => handleSortChange(opt.value)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left min-h-[56px] ${currentSort === opt.value ? 'bg-accent-50 border-2 border-accent-600' : 'bg-white border-2 border-gray-200 hover:border-gray-300'}`}>
                  <span className={`font-medium flex-1 ${currentSort === opt.value ? 'text-accent-700' : 'text-gray-900'}`}>{opt.label}</span>
                  {currentSort === opt.value && (
                    <svg className="w-5 h-5 text-accent-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="h-6"></div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-down { from { transform: translateY(-100%); } to { transform: translateY(0); } }
        .animate-slide-down { animation: slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .active\\:scale-95:active { transform: scale(0.95); }
      `}</style>
    </>
  );
}
