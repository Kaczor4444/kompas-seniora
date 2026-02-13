// src/components/mobile/MobileStickyBar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getFavorites } from '@/src/utils/favorites';

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
  const [favoritesCount, setFavoritesCount] = useState(0);
  
  const currentSort = searchParams.get('sort') || '';

  // ✅ Śledź liczbę ulubionych
  useEffect(() => {
    const updateFavoritesCount = () => {
      const favorites = getFavorites();
      setFavoritesCount(favorites.length);
    };

    // Załaduj przy mount
    updateFavoritesCount();

    // Nasłuchuj zmian
    window.addEventListener('favoritesChanged', updateFavoritesCount);
    
    return () => {
      window.removeEventListener('favoritesChanged', updateFavoritesCount);
    };
  }, []);

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
      {/* ✅ ZMIANA 1: top-16 → top-[68px] (niżej) */}
      <div className={`lg:hidden fixed top-[68px] left-0 right-0 z-30 bg-white border-b border-gray-200 shadow-sm transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        {/* JEDEN RZĄD: Wszystkie przyciski obok siebie */}
        <div className="flex gap-1.5 p-2">
          {/* Filtruj */}
          <button 
            onClick={handleOpenFilters} 
            className="relative flex items-center justify-center gap-1 px-2 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition min-h-[44px] active:scale-95 flex-1"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium text-xs hidden xs:inline">Filtry</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sortuj */}
          <button 
            onClick={() => setShowSortModal(true)} 
            className="flex items-center justify-center gap-1 px-2 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition min-h-[44px] active:scale-95 flex-1"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span className="font-medium text-xs hidden xs:inline truncate max-w-[60px]">{currentSortLabel}</span>
          </button>

          {/* Widok (Mapa) */}
          <button
            onClick={() => window.dispatchEvent(new Event('toggleMobileMap'))}
            className="flex items-center justify-center gap-1 px-2 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition min-h-[44px] active:scale-95 flex-1"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="font-medium text-xs hidden xs:inline">Mapa</span>
          </button>

          {/* ✅ ZMIANA 2: Dodano onClick z sessionStorage */}
          {/* NOWY: Ulubione (tylko jeśli są) */}
          {favoritesCount > 0 && (
            <Link
              href="/ulubione"
              onClick={() => {
                // Zapisz obecny URL przed odejściem
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search);
                }
              }}
              className="flex items-center justify-center gap-1 px-2 py-2.5 bg-emerald-50 border-2 border-emerald-600 rounded-lg hover:bg-emerald-100 transition min-h-[44px] active:scale-95 flex-1"
            >
              <svg className="w-4 h-4 flex-shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span className="font-medium text-xs text-emerald-700 hidden xs:inline">
                ({favoritesCount})
              </span>
              {/* Na małych ekranach tylko liczba bez nawiasów */}
              <span className="font-bold text-xs text-emerald-700 xs:hidden">
                {favoritesCount}
              </span>
            </Link>
          )}
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
                <button key={opt.value} onClick={() => handleSortChange(opt.value)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-left min-h-[56px] ${currentSort === opt.value ? 'bg-emerald-50 border-2 border-emerald-600' : 'bg-white border-2 border-gray-200 hover:border-gray-300'}`}>
                  <span className={`font-medium flex-1 ${currentSort === opt.value ? 'text-emerald-700' : 'text-gray-900'}`}>{opt.label}</span>
                  {currentSort === opt.value && (
                    <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
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
        
        /* Breakpoint dla małych ekranów */
        @media (min-width: 375px) {
          .xs\\:inline { display: inline; }
          .xs\\:hidden { display: none; }
        }
      `}</style>
    </>
  );
}