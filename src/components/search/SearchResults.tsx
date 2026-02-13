// src/components/search/SearchResults.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { isFavorite, addFavorite, removeFavorite } from '@/src/utils/favorites';
import { getShortProfileLabels } from '@/src/lib/profileLabels';

// Import modular components
import { SearchHeader } from './SearchHeader';
import { ActiveFilters } from './ActiveFilters';
import { FilterPanel } from './FilterPanel';
import { FacilityCard } from './FacilityCard';
import { SkeletonCard } from './SkeletonCard';
import { EmptyState } from './EmptyState';
import { ComparisonBar } from './ComparisonBar';
import MobileBottomBar from './MobileBottomBar';

// ✅ Use your existing FacilityMap with dynamic import
const FacilityMap = dynamic(() => import("@/components/FacilityMap"), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-100 animate-pulse" />
});

// ===== TYPES (from your existing structure) =====
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
  distance?: number | null;
  ulica?: string | null;
  kod_pocztowy?: string | null;
  prowadzacy?: string | null;
  liczba_miejsc?: number | null;
  email?: string | null;
  www?: string | null;
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
  userLocation?: { lat: number; lng: number };
}


// ===== MAIN COMPONENT =====
export default function SearchResults({
  query,
  type,
  results,
  message,
  activeFilters,
  userLocation
}: SearchResultsProps) {

  const router = useRouter();

  // ===== STATE =====
  const [cityInput, setCityInput] = useState(query || "");
  const [selectedType, setSelectedType] = useState(
    () => type === 'dps' ? 'DPS' : type === 'sds' ? 'ŚDS' : (type || 'all')
  );
  const [selectedVoivodeship, setSelectedVoivodeship] = useState(
    activeFilters?.wojewodztwo || "Wszystkie"
  );
  const [selectedPowiat, setSelectedPowiat] = useState(
    activeFilters?.powiat || "Wszystkie"
  );
  const [selectedProfile, setSelectedProfile] = useState("Wszystkie");
  const [priceLimit, setPriceLimit] = useState(
    activeFilters?.maxPrice || 10000
  );

  const [showFilters, setShowFilters] = useState(false);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);

  const [facilities, setFacilities] = useState<Facility[]>(results);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [favoritesState, setFavoritesState] = useState<number[]>([]);

  // ===== COMPUTED =====
  // Stała lista wszystkich powiatów Małopolski — nie zależy od aktualnych wyników
  const availablePowiats = [
    "Wszystkie",
    "bocheński", "brzeski", "chrzanowski", "dąbrowski", "gorlicki",
    "krakowski", "limanowski", "miechowski", "myślenicki", "nowosądecki",
    "nowotarski", "olkuski", "oświęcimski", "proszowicki", "suski",
    "tarnowski", "tatrzański", "wadowicki", "wielicki",
    "Kraków", "Nowy Sącz", "Tarnów",
  ];

  const activeChips = useMemo(() => {
    const chips = [];
    if (cityInput && cityInput !== query) {
      chips.push({ label: `Szukaj: ${cityInput}`, clear: () => setCityInput(query) });
    }
    if (selectedType !== 'all' && selectedType !== type) {
      chips.push({ label: `Typ: ${selectedType}`, clear: () => setSelectedType(type) });
    }
    if (selectedVoivodeship !== "Wszystkie") {
      chips.push({
        label: `Woj.: ${selectedVoivodeship}`,
        clear: () => setSelectedVoivodeship("Wszystkie")
      });
    }
    if (selectedPowiat !== "Wszystkie") {
      chips.push({
        label: `Powiat: ${selectedPowiat}`,
        clear: () => setSelectedPowiat("Wszystkie")
      });
    }
    if (selectedProfile !== "Wszystkie") {
      chips.push({
        label: `Profil: ${selectedProfile}`,
        clear: () => setSelectedProfile("Wszystkie")
      });
    }
    if (priceLimit < 10000) {
      chips.push({
        label: `Do: ${priceLimit} zł`,
        clear: () => setPriceLimit(10000)
      });
    }
    return chips;
  }, [cityInput, query, selectedType, type, selectedVoivodeship, selectedPowiat, selectedProfile, priceLimit]);


  // Mobile map toggle via custom event from MobileStickyBar
  useEffect(() => {
    const handleToggleMap = () => setShowMapMobile(prev => !prev);
    window.addEventListener('toggleMobileMap', handleToggleMap);
    return () => window.removeEventListener('toggleMobileMap', handleToggleMap);
  }, []);

  // Load favorites on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateFavorites = () => {
        const favorites = JSON.parse(localStorage.getItem('kompas-seniora-favorites') || '[]');
        setFavoritesState(favorites.map((f: any) => f.id));
      };
      
      updateFavorites();
      window.addEventListener('favoritesChanged', updateFavorites);
      
      return () => window.removeEventListener('favoritesChanged', updateFavorites);
    }
  }, []);
  // ===== FILTERING LOGIC =====
  useEffect(() => {
    let filtered = results;

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(f => {
        // Direct comparison - selectedType is now "DPS" or "ŚDS" from FilterPanel
        return f.typ_placowki === selectedType;
      });
    }

    // City search — tylko gdy user zmienił input po załadowaniu
    // (gdy cityInput === query, serwer już przefiltrował przez TERYT → powiat)
    if (cityInput && cityInput !== query) {
      filtered = filtered.filter(f =>
        f.miejscowosc?.toLowerCase().includes(cityInput.toLowerCase()) ||
        f.powiat?.toLowerCase().includes(cityInput.toLowerCase())
      );
    }

    // Voivodeship filter
    if (selectedVoivodeship !== "Wszystkie") {
      filtered = filtered.filter(f =>
        f.wojewodztwo === selectedVoivodeship
      );
    }

    // Powiat filter (normalizacja: trim, lowercase, polskie znaki → ASCII)
    if (selectedPowiat !== "Wszystkie") {
      const normPowiat = (s: string) =>
        s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'l');
      const targetPowiat = normPowiat(selectedPowiat);
      filtered = filtered.filter(f => normPowiat(f.powiat ?? '') === targetPowiat);
    }

    // Profile filter - selectedProfile is a code letter (e.g. "E", "A")
    if (selectedProfile !== "Wszystkie") {
      filtered = filtered.filter(f => {
        if (!f.profil_opieki) return false;
        const codes = f.profil_opieki.split(',').map((c: string) => c.trim());
        return codes.includes(selectedProfile);
      });
    }

    // Price filter
    filtered = filtered.filter(f =>
      (f.koszt_pobytu || 0) <= priceLimit
    );

    setFacilities(filtered);
  }, [
    results, selectedType, cityInput, selectedVoivodeship, selectedPowiat,
    selectedProfile, priceLimit
  ]);

  // ===== HANDLERS =====
  const resetFilters = () => {
    setCityInput(query);
    setSelectedType(type);
    setSelectedVoivodeship("Wszystkie");
    setSelectedPowiat("Wszystkie");
    setSelectedProfile("Wszystkie");
    setPriceLimit(10000);
  };

  const toggleCompare = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleFacilityClick = (id: number) => {
    // Navigate to facility detail page
    window.location.href = `/placowka/${id}`;
  };

  // ===== RENDER =====
  return (
    <div className="flex flex-col bg-gray-50 h-full">

      {/* Header */}
      <SearchHeader
        cityInput={cityInput}
        onCityChange={setCityInput}
        onSearch={(val) => {
          if (val.trim()) router.push(`/search?q=${encodeURIComponent(val.trim())}&partial=true`);
        }}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        activeFiltersCount={activeChips.length}
        onBack={() => window.history.back()}
        isFavoritesView={false}
      />

      {/* Active Filters */}
      <ActiveFilters
        chips={activeChips}
      />

      {/* Filter Panel */}
      <FilterPanel
        show={showFilters}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedPowiat={selectedPowiat}
        onPowiatChange={setSelectedPowiat}
        selectedProfile={selectedProfile}
        onProfileChange={setSelectedProfile}
        priceLimit={priceLimit}
        onPriceLimitChange={setPriceLimit}
        availablePowiats={availablePowiats}
        onReset={resetFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Content Area */}
      <div className="flex flex-1 h-[calc(100vh-240px)] overflow-hidden relative">

        {/* Results List */}
        <div className={`
          flex-1 md:w-1/2
          overflow-y-auto p-3 sm:p-4 md:p-8 relative z-10
          ${showMapMobile ? 'hidden md:block' : 'block'}
        `}>
          <div className="max-w-2xl ml-auto mr-0 md:mr-4 space-y-3 sm:space-y-4">

            {isLoading ? (
              // Loading
              [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
            ) : facilities.length === 0 ? (
              // Empty State
              <EmptyState onResetFilters={resetFilters} />
            ) : (
              <>
                {/* Facility Cards */}
                {facilities.slice(0, visibleCount).map(fac => (
                  <FacilityCard
                    key={fac.id}
                    facility={{
                      id: fac.id,
                      name: fac.nazwa,
                      type: fac.typ_placowki as 'DPS' | 'ŚDS',
                      city: fac.miejscowosc || '',
                      powiat: fac.powiat || '',
                      category: fac.typ_placowki === 'DPS' ? 'Dom Pomocy Społecznej' : 'Środowiskowy Dom Samopomocy',
                      price: fac.koszt_pobytu || 0,
                      street: fac.ulica,
                      image: '/images/placeholder-facility.jpg', // Add your image logic
                      waitTime: 'Brak danych',
                      profileLabels: getShortProfileLabels(fac.profil_opieki, fac.typ_placowki)
                    }}
                    isHovered={hoveredId === fac.id}
                    isSaved={favoritesState.includes(fac.id)}
                    isCompared={selectedForCompare.includes(fac.id)}
                    onHover={setHoveredId}
                    onClick={() => handleFacilityClick(fac.id)}
                    onToggleSave={(e) => {
                      e.stopPropagation();
                      
                      if (isFavorite(fac.id)) {
                        removeFavorite(fac.id);
                      } else {
                        addFavorite({
                          id: fac.id,
                          nazwa: fac.nazwa,
                          miejscowosc: fac.miejscowosc,
                          powiat: fac.powiat,
                          typ_placowki: fac.typ_placowki,
                          koszt_pobytu: fac.koszt_pobytu,
                          telefon: fac.telefon,
                          ulica: fac.ulica,
                          kod_pocztowy: fac.kod_pocztowy,
                          email: fac.email,
                          www: fac.www,
                          liczba_miejsc: fac.liczba_miejsc,
                          profil_opieki: fac.profil_opieki,
                          addedAt: new Date().toISOString()
                        });
                      }
                      
                      window.dispatchEvent(new Event("favoritesChanged"));
                    }}
                    onToggleCompare={(e) => toggleCompare(fac.id, e)}
                  />
                ))}

                {/* Load More Button */}
                {visibleCount < facilities.length && (
                  <div className="pt-8 pb-48 md:pb-8 flex flex-col items-center gap-4">
                    <div className="text-sm font-bold text-slate-400">
                      Widzisz <span className="text-slate-900">{Math.min(visibleCount, facilities.length)}</span> z <span className="text-slate-900">{facilities.length}</span> placówek
                    </div>
                    <button
                      onClick={() => {
                        setIsLoadingMore(true);
                        setTimeout(() => {
                          setVisibleCount(prev => prev + 20);
                          setIsLoadingMore(false);
                        }, 600);
                      }}
                      disabled={isLoadingMore}
                      className="group bg-white border-2 border-stone-200 text-slate-800 font-bold py-4 px-10 rounded-2xl hover:border-emerald-600 hover:text-emerald-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    >
                      {isLoadingMore ? (
                        <span>Ładowanie...</span>
                      ) : (
                        <>
                          <span>Pokaż więcej wyników</span>
                          <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Map */}
        <div className={`
          flex-1 md:w-1/2
          bg-gray-100 overflow-hidden
          ${showMapMobile ? 'block fixed inset-0 z-40 top-[120px]' : 'hidden md:block md:sticky md:top-0 md:h-[calc(100vh-80px)] md:z-0'}
        `}>
          <FacilityMap
            facilities={facilities}
            userLocation={userLocation}
          />
        </div>
      </div>

      {/* Comparison Bar */}
      <ComparisonBar
        selectedIds={selectedForCompare}
        facilities={facilities}
        onCompare={() => {
          // Navigate to comparison page
          const ids = selectedForCompare.join(',');
          window.location.href = `/ulubione/porownaj?ids=${ids}`;
        }}
        onRemove={(id) => setSelectedForCompare(prev => prev.filter(fid => fid !== id))}
        onClear={() => setSelectedForCompare([])}
      />

      {/* Mobile Bottom Bar (hidden when comparison bar is active) */}
      {!selectedForCompare.length && (
        <MobileBottomBar
          showMap={showMapMobile}
          onToggleMap={setShowMapMobile}
          activeFiltersCount={activeChips.length}
          onOpenFilters={() => setShowFilters(true)}
          hasUserLocation={false}
        />
      )}
    </div>
  );
}