// src/components/search/MobileBottomBar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { List, Map, SlidersHorizontal, ArrowUpDown, Heart, X, Check } from 'lucide-react';
import { getFavorites } from '@/src/utils/favorites';

interface MobileBottomBarProps {
  showMap: boolean;
  onToggleMap: (show: boolean) => void;
  activeFiltersCount: number;
  hasUserLocation?: boolean;
}

export default function MobileBottomBar({
  showMap,
  onToggleMap,
  activeFiltersCount,
  hasUserLocation = false,
}: MobileBottomBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSortModal, setShowSortModal] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);

  const currentSort = searchParams.get('sort') || '';

  // Track favorites count
  useEffect(() => {
    const update = () => setFavoritesCount(getFavorites().length);
    update();
    window.addEventListener('favoritesChanged', update);
    return () => window.removeEventListener('favoritesChanged', update);
  }, []);

  // Open filter drawer via data attribute trigger
  const handleOpenFilters = () => {
    const btn = document.querySelector('[data-mobile-filter-trigger]') as HTMLButtonElement;
    if (btn) btn.click();
  };

  const sortOptions = [
    { value: 'name_asc', label: 'A–Z' },
    { value: 'name_desc', label: 'Z–A' },
    { value: 'price_asc', label: 'Najtańsze' },
    { value: 'price_desc', label: 'Najdroższe' },
    ...(hasUserLocation ? [{ value: 'distance', label: 'Najbliższe' }] : []),
  ];

  const currentSortLabel = sortOptions.find(o => o.value === currentSort)?.label || 'Sortuj';

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/search?${params.toString()}`);
    setShowSortModal(false);
  };

  return (
    <>
      {/* Bottom pill bar */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="
          bg-gray-900/95 backdrop-blur-lg
          rounded-full
          px-1 py-1
          shadow-2xl
          border border-gray-700
          flex items-center gap-0.5
        ">
          {/* Lista / Mapa toggle */}
          <button
            onClick={() => onToggleMap(false)}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all
              ${!showMap ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'}
            `}
          >
            <List size={16} />
            <span>Lista</span>
          </button>

          <button
            onClick={() => onToggleMap(true)}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all
              ${showMap ? 'bg-white text-gray-900' : 'text-gray-300 hover:text-white'}
            `}
          >
            <Map size={16} />
            <span>Mapa</span>
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-600 mx-0.5" />

          {/* Filtry */}
          <button
            onClick={handleOpenFilters}
            className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-gray-300 hover:text-white transition-all"
          >
            <SlidersHorizontal size={16} />
            <span>Filtry</span>
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sortuj */}
          <button
            onClick={() => setShowSortModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-gray-300 hover:text-white transition-all"
          >
            <ArrowUpDown size={16} />
            <span className="max-w-[60px] truncate">{currentSortLabel}</span>
          </button>

          {/* Ulubione (only if any) */}
          {favoritesCount > 0 && (
            <>
              <div className="w-px h-5 bg-gray-600 mx-0.5" />
              <Link
                href="/ulubione"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('returnUrl', window.location.pathname + window.location.search);
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-all"
              >
                <Heart size={16} className="fill-current" />
                <span>{favoritesCount}</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Sort modal */}
      {showSortModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] md:hidden"
            onClick={() => setShowSortModal(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[9999] md:hidden bg-white rounded-t-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Sortuj wyniki</h3>
              <button onClick={() => setShowSortModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="px-4 py-3 space-y-2 pb-8">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left min-h-[52px] transition-all
                    ${currentSort === opt.value
                      ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-700 font-semibold'
                      : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{opt.label}</span>
                  {currentSort === opt.value && <Check size={18} className="text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
