'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass } from 'lucide-react'; // ✅ NOWY IMPORT - ikona kompasu
import { getProfileOpiekiNazwy, profileOpiekiKody } from '@/src/data/profileopieki';
// ✅ USUNIĘTO: import SortDropdown - sortowanie przeniesione do FilterSidebar
import { formatDistance } from '@/src/utils/distance'; // ✅ IMPORT

const FacilityMap = dynamic(() => import('@/components/FacilityMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
});

interface Facility {
  id: number;
  nazwa: string;
  typ_placowki: string;
  powiat: string;
  miejscowosc: string;
  koszt_pobytu: number | null;
  telefon: string | null;
  latitude: number | null;
  longitude: number | null;
  profil_opieki?: string | null;
  distance?: number | null; // ✅ NOWE POLE
}

interface ActiveFilters {
  wojewodztwo?: string;
  powiat?: string;
  type?: string;
  careTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
  showFree?: boolean;
}

interface SearchResultsProps {
  query: string;
  type: string;
  results: Facility[];
  message: string;
  activeFilters?: ActiveFilters;
  userLocation?: { lat: number; lng: number }; // ✅ NOWY PROP
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

export default function SearchResults({ query, type, results, message, activeFilters, userLocation }: SearchResultsProps) {
  const router = useRouter();

  const removeFilter = (filterType: string, value?: string) => {
    const params = new URLSearchParams(window.location.search);
    
    switch (filterType) {
      case 'wojewodztwo':
        params.delete('woj');
        params.delete('powiat');
        break;
      case 'powiat':
        params.delete('powiat');
        break;
      case 'type':
        params.delete('type');
        break;
      case 'care':
        if (value && activeFilters?.careTypes) {
          const remaining = activeFilters.careTypes.filter(t => t !== value);
          if (remaining.length > 0) {
            params.set('care', remaining.join(','));
          } else {
            params.delete('care');
          }
        } else {
          params.delete('care');
        }
        break;
      case 'price':
        params.delete('min');
        params.delete('max');
        break;
      case 'free':
        params.delete('free');
        break;
    }
    
    router.push(`/search?${params.toString()}`);
  };

  const wojewodztwaLabels: Record<string, string> = {
    'malopolskie': 'Małopolskie',
    'slaskie': 'Śląskie',
    'all': 'Wszystkie',
  };

  const typeLabels: Record<string, string> = {
    'dps': 'DPS',
    'sds': 'ŚDS',
    'all': 'Wszystkie',
  };

  const hasActiveFilters = activeFilters && (
    activeFilters.wojewodztwo ||
    activeFilters.powiat ||
    activeFilters.type ||
    (activeFilters.careTypes && activeFilters.careTypes.length > 0) ||
    activeFilters.minPrice ||
    activeFilters.maxPrice ||
    activeFilters.showFree
  );

  return (
    <>
      {/* Message - ✅ MOBILE OPTIMIZED */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg"
          >
            <p className="text-sm sm:text-base text-blue-800 leading-relaxed">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AKTYWNE FILTRY - ✅ MOBILE OPTIMIZED */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white border border-neutral-200 rounded-lg overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs sm:text-sm font-medium text-neutral-700 w-full sm:w-auto mb-1 sm:mb-0">
                Aktywne filtry:
              </span>
              
              {/* Badges - ✅ TOUCH-FRIENDLY */}
              <AnimatePresence>
                {activeFilters?.wojewodztwo && (
                  <motion.button
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    onClick={() => removeFilter('wojewodztwo')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors min-h-[44px] touch-manipulation"
                  >
                    {wojewodztwaLabels[activeFilters.wojewodztwo] || activeFilters.wojewodztwo}
                    <span className="text-accent-600 text-lg">×</span>
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {activeFilters?.powiat && (
                  <motion.button
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    onClick={() => removeFilter('powiat')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors min-h-[44px] touch-manipulation"
                  >
                    {activeFilters.powiat}
                    <span className="text-accent-600 text-lg">×</span>
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {activeFilters?.type && (
                  <motion.button
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    onClick={() => removeFilter('type')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors min-h-[44px] touch-manipulation"
                  >
                    {typeLabels[activeFilters.type] || activeFilters.type}
                    <span className="text-accent-600 text-lg">×</span>
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {activeFilters?.careTypes && activeFilters.careTypes.map((code) => (
                  <motion.button
                    key={code}
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    onClick={() => removeFilter('care', code)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors min-h-[44px] touch-manipulation"
                  >
                    <span className="line-clamp-1">{profileOpiekiKody[code as keyof typeof profileOpiekiKody]}</span>
                    <span className="text-accent-600 text-lg flex-shrink-0">×</span>
                  </motion.button>
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {(activeFilters?.minPrice || activeFilters?.maxPrice) && (
                  <motion.button
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    onClick={() => removeFilter('price')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors min-h-[44px] touch-manipulation"
                  >
                    <span className="whitespace-nowrap">
                      {activeFilters.minPrice && activeFilters.maxPrice
                        ? `${activeFilters.minPrice.toLocaleString('pl-PL')} - ${activeFilters.maxPrice.toLocaleString('pl-PL')} zł`
                        : activeFilters.minPrice
                        ? `od ${activeFilters.minPrice.toLocaleString('pl-PL')} zł`
                        : `do ${activeFilters.maxPrice?.toLocaleString('pl-PL')} zł`
                      }
                    </span>
                    <span className="text-accent-600 text-lg">×</span>
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {activeFilters?.showFree && (
                  <motion.button
                    variants={badgeVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    onClick={() => removeFilter('free')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors min-h-[44px] touch-manipulation"
                  >
                    Tylko bezpłatne
                    <span className="text-accent-600 text-lg">×</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ USUNIĘTO: SortDropdown - sortowanie przeniesione do FilterSidebar (desktop) */}

      {/* Layout: Lista + Mapa */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Lista placówek - ✅ MOBILE OPTIMIZED */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <AnimatePresence mode="popLayout">
              {results.map((facility, index) => {
                const profileNazwy = facility.profil_opieki 
                  ? getProfileOpiekiNazwy(facility.profil_opieki)
                  : [];

                return (
                  <motion.div
                    key={facility.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ 
                      duration: 0.4,
                      delay: index * 0.05,
                      ease: [0.22, 1, 0.36, 1]
                    }}
                    whileHover={{ 
                      scale: 1.01,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                    }}
                    className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 transition relative"
                  >
                    {/* 🧭 DISTANCE BADGE - górny prawy róg z ikoną kompasu */}
                    {facility.distance !== null && facility.distance !== undefined && (
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2 py-1 bg-accent-50 text-gray-800 rounded-full text-[10px] sm:text-xs font-semibold flex items-center gap-1 shadow-sm">
                        <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>{formatDistance(facility.distance)} od Ciebie</span>
                      </div>
                    )}

                    {/* ✅ MOBILE: Większy, wyraźniejszy tytuł */}
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 leading-snug pr-20 sm:pr-32">
                      {facility.nazwa}
                    </h2>
                    
                    {/* ✅ MOBILE: Lepsze spacing */}
                    <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                      {facility.typ_placowki} • {facility.powiat}
                    </p>

                    <div className="space-y-3 sm:space-y-2 mb-4">
                      {/* Lokalizacja */}
                      <div>
                        <span className="font-medium text-gray-700 text-sm sm:text-base">Lokalizacja</span>
                        <p className="text-sm sm:text-base text-gray-600 mt-0.5">{facility.miejscowosc}</p>
                        <p className="text-xs sm:text-sm text-gray-500">Powiat: {facility.powiat}</p>
                      </div>

                      {/* PROFIL OPIEKI - ✅ MOBILE OPTIMIZED */}
                      {profileNazwy.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700 text-sm sm:text-base">Profil opieki</span>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {profileNazwy.map((nazwa, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-2 py-1 text-xs sm:text-xs bg-accent-50 text-accent-700 rounded-md leading-tight"
                              >
                                {nazwa}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Koszt miesięczny - ✅ MOBILE: Wyraźniejszy */}
                      <div>
                        <span className="font-medium text-gray-700 text-sm sm:text-base">Koszt miesięczny</span>
                        <p className={`text-xl sm:text-lg font-semibold mt-0.5 ${facility.koszt_pobytu ? 'text-accent-600' : 'text-green-600'}`}>
                          {facility.koszt_pobytu
                            ? `${Math.round(facility.koszt_pobytu).toLocaleString('pl-PL')} zł/mc`
                            : 'Bezpłatne'}
                        </p>
                      </div>
                    </div>

                    {/* ✅ MOBILE: Touch-friendly buttons, stack on small screens */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Link
                        href={`/placowka/${facility.id}`}
                        className="flex-1 px-4 py-3 sm:py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors text-center font-medium text-sm sm:text-base min-h-[44px] flex items-center justify-center touch-manipulation"
                      >
                        Zobacz szczegóły
                      </Link>
                      {facility.telefon && (
                        <a
                          href={`tel:${facility.telefon.replace(/\s/g, '')}`}
                          className="flex-1 px-4 py-3 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-center font-medium text-sm sm:text-base min-h-[44px] flex items-center justify-center touch-manipulation"
                        >
                          📞 {facility.telefon}
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Mapa - ✅ MOBILE: Ukryta na bardzo małych ekranach, widoczna od 640px */}
          <div className="hidden md:block lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                Lokalizacja na mapie
              </h3>
              <FacilityMap facilities={results} mode="multiple" />
            </div>
          </div>

        </div>
      )}
    </>
  );
}