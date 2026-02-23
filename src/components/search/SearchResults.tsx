// src/components/search/SearchResults.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { isFavorite, addFavorite, removeFavorite } from '@/src/utils/favorites';
import { getShortProfileLabels } from '@/src/lib/profileLabels';
import { useAppAnalytics } from '@/src/hooks/useAppAnalytics';
import { useScrollTracking } from '@/src/hooks/useScrollTracking';
import { calculateDistance } from '@/src/utils/distance';

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

// ===== HELPER FUNCTIONS =====
const getProfileName = (code: string): string => {
  const mapping: Record<string, string> = {
    'A': 'Niepełnosprawnić intelektualna',
    'B': 'Zaburzenia psychiczne',
    'C': 'Choroby przewlekłe',
    'D': 'Podeszły wiek',
    'E': 'Osoby starsze',
    'F': 'Choroby somatyczne',
    'G': 'Dzieci niepełnosprawne',
    'H': 'Młodzież niepełnosprawna',
    'I': 'Niepełnosprawnić fizyczna',
  };
  return mapping[code] || code;
};

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
  distanceFromCity?: number | null;
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
  searchCenter?: { lat: number; lng: number; name: string };
  terytPowiats?: string[];
  powiatBreakdown?: Record<string, number>;
  powiatSearchCenters?: Record<string, { lat: number; lng: number }>;
}


// ===== MAIN COMPONENT =====
export default function SearchResults({
  query,
  type,
  results,
  message,
  activeFilters,
  userLocation,
  searchCenter,
  terytPowiats,
  powiatBreakdown,
  powiatSearchCenters,
}: SearchResultsProps) {

  const router = useRouter();
  const { trackEmptyResults, trackFilterApplied, trackCrossPowiatView } = useAppAnalytics();
  const filterTrackedRef = useRef<string>('');

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
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [priceLimit, setPriceLimit] = useState(
    activeFilters?.maxPrice || 10000
  );

  const [showFilters, setShowFilters] = useState(false);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [showProfilesMenu, setShowProfilesMenu] = useState(false);

  const [facilities, setFacilities] = useState<Facility[]>(results);
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [favoritesState, setFavoritesState] = useState<number[]>([]);
  const [maxDistance, setMaxDistance] = useState<number>(100); // km (from geolocation)
  const [maxDistanceFromCity, setMaxDistanceFromCity] = useState<number>(100); // km (from searched city)

  // ===== COMPUTED =====
  // Lista powiatów do filtra — dynamiczna (tylko powiaty gdzie istnieje szukana miejscowość)
  // lub pełna lista Małopolski gdy brak danych TERYT (np. wyszukiwanie woj./geoloc)
  const ALL_MALOPOLSKA_POWIATS = [
    "bocheński", "brzeski", "chrzanowski", "dąbrowski", "gorlicki",
    "krakowski", "limanowski", "miechowski", "myślenicki", "nowosądecki",
    "nowotarski", "olkuski", "oświęcimski", "proszowicki", "suski",
    "tarnowski", "tatrzański", "wadowicki", "wielicki",
    "Kraków", "Nowy Sącz", "Tarnów",
  ];
  const availablePowiats = terytPowiats && terytPowiats.length > 0
    ? ["Wszystkie", ...terytPowiats]
    : ["Wszystkie", ...ALL_MALOPOLSKA_POWIATS];

  // Dynamiczne profile — tylko te kody które faktycznie występują w wynikach
  const availableProfiles = useMemo(() => {
    const codes = new Set<string>();
    const validCodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    for (const f of results) {
      if (f.profil_opieki) {
        f.profil_opieki.split(',').forEach((c: string) => {
          const trimmed = c.trim();
          // Only add valid single-letter codes
          if (validCodes.includes(trimmed)) {
            codes.add(trimmed);
          }
        });
      }
    }
    return [...codes].sort();
  }, [results]);

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
    // Add a chip for each selected profile
    selectedProfiles.forEach(code => {
      chips.push({
        label: getProfileName(code),
        clear: () => setSelectedProfiles(selectedProfiles.filter(c => c !== code))
      });
    });
    if (priceLimit < 10000) {
      chips.push({
        label: `Do: ${priceLimit} zł`,
        clear: () => setPriceLimit(10000)
      });
    }
    if (userLocation && maxDistance < 100) {
      chips.push({
        label: `Do: ${maxDistance} km`,
        clear: () => setMaxDistance(100)
      });
    }
    if (searchCenter && maxDistanceFromCity < 100) {
      chips.push({
        label: `Od ${searchCenter.name}: ${maxDistanceFromCity} km`,
        clear: () => setMaxDistanceFromCity(100)
      });
    }
    return chips;
  }, [cityInput, query, selectedType, type, selectedVoivodeship, selectedPowiat, selectedProfiles, priceLimit, maxDistance, maxDistanceFromCity, userLocation, searchCenter]);


  // Sync filter state when activeFilters prop changes (e.g. after router.push navigation)
  useEffect(() => {
    setSelectedPowiat(activeFilters?.powiat || "Wszystkie");
  }, [activeFilters?.powiat]);

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

  // Calculate distance from searched city for all facilities
  useEffect(() => {
    if (!searchCenter) return;

    const resultsWithCityDistance = results.map(facility => {
      if (!facility.latitude || !facility.longitude) {
        return { ...facility, distanceFromCity: null };
      }

      const dist = calculateDistance(
        searchCenter.lat,
        searchCenter.lng,
        parseFloat(facility.latitude as any),
        parseFloat(facility.longitude as any)
      );

      return { ...facility, distanceFromCity: dist };
    });

    setFacilities(resultsWithCityDistance);
  }, [searchCenter, results]);

  // ===== FILTERING LOGIC =====
  useEffect(() => {
    let filtered = results;

    // ✅ If cityInput is completely empty (user cleared it), show no results
    // EXCEPT when using geolocation (userLocation is set)
    if ((!cityInput || cityInput.trim() === '') && !userLocation) {
      setFacilities([]);
      return;
    }

    // ✅ If user typed completely different city (not a substring of query), show no results
    // This prevents showing old results when user types new city before clicking "Szukaj"
    const normalizeText = (s: string) => s.toLowerCase().trim();
    const inputNorm = normalizeText(cityInput);
    const queryNorm = normalizeText(query);

    if (cityInput !== query && !inputNorm.includes(queryNorm) && !queryNorm.includes(inputNorm)) {
      setFacilities([]);
      return;
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(f => {
        // Direct comparison - selectedType is now "DPS" or "ŚDS" from FilterPanel
        return f.typ_placowki === selectedType;
      });
    }

    // City search — tylko gdy user zmienił input po załadowaniu
    // (gdy cityInput === query, serwer już przefiltrował przez TERYT → powiat)
    if (cityInput !== query) {
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
      const norm = (s: string) =>
        s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'l');
      const targetPowiat = norm(selectedPowiat);
      filtered = filtered.filter(f => norm(f.powiat ?? '') === targetPowiat);
    }

    // Profile filter - selectedProfiles is an array of code letters
    if (selectedProfiles.length > 0) {
      filtered = filtered.filter(f => {
        if (!f.profil_opieki) return false;
        const codes = f.profil_opieki.split(',').map((c: string) => c.trim());
        // Check if facility has at least one of the selected profiles
        return selectedProfiles.some(selectedCode => codes.includes(selectedCode));
      });
    }

    // Price filter
    filtered = filtered.filter(f =>
      (f.koszt_pobytu || 0) <= priceLimit
    );

    // Distance filter (only when geolocation is active)
    if (userLocation && maxDistance < 100) {
      filtered = filtered.filter(f => {
        if (f.distance === null || f.distance === undefined) return false;
        return f.distance <= maxDistance;
      });
    }

    // Distance from searched city filter (only when searchCenter exists)
    if (searchCenter && maxDistanceFromCity < 100) {
      filtered = filtered.filter(f => {
        if (f.distanceFromCity === null || f.distanceFromCity === undefined) return false;
        return f.distanceFromCity <= maxDistanceFromCity;
      });
    }

    setFacilities(filtered);

    // Track empty results
    if (filtered.length === 0 && results.length > 0) {
      trackEmptyResults({
        powiat: selectedPowiat,
        type: selectedType,
        priceLimit,
        profile: selectedProfiles.join(','),
        totalServerResults: results.length,
      });
    }

    // Track filter combinations (debounced by combo key)
    const combo = [selectedPowiat, selectedType, selectedProfiles.join(','), priceLimit].join('|');
    if (combo !== filterTrackedRef.current) {
      filterTrackedRef.current = combo;
      trackFilterApplied({
        powiat: selectedPowiat,
        type: selectedType,
        priceLimit,
        profile: selectedProfiles.join(','),
      });
    }
  }, [
    results, selectedType, cityInput, selectedVoivodeship, selectedPowiat,
    selectedProfiles, priceLimit, maxDistance, maxDistanceFromCity, userLocation, searchCenter, trackEmptyResults, trackFilterApplied
  ]);

  // Scroll depth tracking
  useScrollTracking(facilities.length);

  // ===== AUTO-RESET FILTERS WHEN CITY INPUT IS CLEARED =====
  const prevCityInputRef = useRef(cityInput);
  useEffect(() => {
    // Only reset if cityInput changed from non-empty to empty
    if (prevCityInputRef.current && (!cityInput || cityInput.trim() === '')) {
      setSelectedType('all');
      setSelectedVoivodeship("Wszystkie");
      setSelectedPowiat("Wszystkie");
      setSelectedProfiles([]);
      setPriceLimit(10000);
      setMaxDistance(100);
      setMaxDistanceFromCity(100);
    }
    prevCityInputRef.current = cityInput;
  }, [cityInput]);

  // ===== HANDLERS =====
  const resetFilters = () => {
    // Only restore query if cityInput is not empty
    // If user cleared cityInput, keep it empty (don't restore old query)
    if (cityInput && cityInput.trim() !== '') {
      setCityInput(query);
    }
    setSelectedType('all');
    setSelectedVoivodeship("Wszystkie");
    setSelectedPowiat("Wszystkie");
    setSelectedProfiles([]);
    setPriceLimit(10000);
    setMaxDistance(100);
    setMaxDistanceFromCity(100);
  };

  const normPowiat = (s: string) =>
    s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'l');

  const handlePowiatChange = (powiat: string) => {
    if (powiat !== "Wszystkie") {
      const targetPowiat = normPowiat(powiat);
      const hasResults = results.some(f => normPowiat(f.powiat ?? '') === targetPowiat);
      if (!hasResults) {
        // Powiat not in current server results — navigate to powiat-only search
        // Nie przekazujemy q — user wybrał konkretny powiat, nie szuka już po mieście
        const params = new URLSearchParams();
        params.set('powiat', powiat);
        router.push(`/search?${params.toString()}`);
        return;
      }
    }
    setSelectedPowiat(powiat);
  };

  const handleApplyFilters = () => {
    // No-op — powiat navigation is handled live in handlePowiatChange
  };

  const toggleCompare = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForCompare(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const handleFacilityClick = (id: number, facilityPowiat?: string) => {
    // Track cross-powiat views
    if (
      facilityPowiat &&
      selectedPowiat !== 'Wszystkie' &&
      selectedPowiat.toLowerCase() !== facilityPowiat.toLowerCase()
    ) {
      trackCrossPowiatView(id, facilityPowiat, selectedPowiat);
    }
    window.location.href = `/placowka/${id}`;
  };

  // ===== GEOLOCATION HANDLER =====
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolokalizacja nie jest wspierana przez Twoją przeglądarkę');
      return;
    }
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        router.push(`/search?lat=${latitude}&lng=${longitude}&near=true`);
      },
      (error) => {
        setIsLoadingLocation(false);
        alert('Nie udało się uzyskać Twojej lokalizacji. Sprawdź uprawnienia przeglądarki.');
        console.error('Geolocation error:', error);
      }
    );
  };

  // ===== RENDER =====
  return (
    <div className="flex flex-col bg-slate-50 min-h-screen md:-mt-20">

      {/* Active Filters Chips */}
      <ActiveFilters chips={activeChips} />

      {/* Multi-Powiat Info Banner */}
      {powiatBreakdown && Object.keys(powiatBreakdown).length > 1 && cityInput && cityInput.trim() !== '' && !userLocation && (
        <div className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3 mx-4 md:mx-6 mb-2 rounded-r-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                Znaleziono "{query}" w kilku lokalizacjach:
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {Object.entries(powiatBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([powiat, count]) => (
                    <button
                      key={powiat}
                      onClick={() => handlePowiatChange(powiat)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-blue-800 text-xs font-medium rounded-full border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer active:scale-95"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {powiat} ({count})
                    </button>
                  ))}
              </div>
              <p className="text-xs text-blue-700">
                Kliknij na powiat, aby zobaczyć tylko placówki z tej lokalizacji.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Panel Modal */}
      <FilterPanel
        show={showFilters}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedPowiat={selectedPowiat}
        onPowiatChange={handlePowiatChange}
        selectedProfiles={selectedProfiles}
        onProfilesChange={setSelectedProfiles}
        priceLimit={priceLimit}
        onPriceLimitChange={setPriceLimit}
        maxDistance={maxDistance}
        onMaxDistanceChange={setMaxDistance}
        maxDistanceFromCity={maxDistanceFromCity}
        onMaxDistanceFromCityChange={setMaxDistanceFromCity}
        availablePowiats={availablePowiats}
        availableProfiles={availableProfiles}
        userLocation={userLocation}
        searchCenter={searchCenter}
        onReset={resetFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
      />

      {/* 2-COLUMN LAYOUT (jak Lottie) */}
      <div className="flex-1 w-full relative">
        <div className="flex">

          {/* LEFT SIDEBAR - FILTERS (Desktop only) - FIXED */}
          <aside className="hidden lg:block w-96 overflow-y-auto fixed left-6 top-24 h-[calc(100vh-120px)] z-20">
            <div className="bg-white border border-slate-300 rounded-xl p-6 space-y-5 shadow-sm">

              {/* Filters Header */}
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Filtry</h2>
                <button
                  onClick={resetFilters}
                  className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  Wyczyść
                </button>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Typ placówki</label>
                <div className="flex gap-2">
                  {['all', 'DPS', 'ŚDS'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`flex-1 px-3 py-2 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all ${
                        selectedType === type
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {type === 'all' ? 'Wszystkie' : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Powiat Filter */}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Powiat</label>
                <select
                  value={selectedPowiat}
                  onChange={(e) => handlePowiatChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {availablePowiats.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Profile Filter */}
              {availableProfiles.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowProfilesMenu(!showProfilesMenu)}
                    className="w-full flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 hover:text-slate-900 transition-colors"
                  >
                    <span>Profile opieki {selectedProfiles.length > 0 && `(${selectedProfiles.length})`}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showProfilesMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showProfilesMenu && (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                      {availableProfiles.map((code) => {
                        const isSelected = selectedProfiles.includes(code);
                        return (
                          <label
                            key={code}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProfiles([...selectedProfiles, code]);
                                } else {
                                  setSelectedProfiles(selectedProfiles.filter(c => c !== code));
                                }
                              }}
                              className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                            />
                            <span className="text-sm font-medium text-slate-700">{getProfileName(code)}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Price Filter - tylko dla DPS (ŚDS jest bezpłatny) */}
              {selectedType !== 'ŚDS' && (
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Cena do: <span className="text-slate-900">{priceLimit} zł</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={priceLimit}
                    onChange={(e) => setPriceLimit(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                    <span>0 zł</span>
                    <span>10000 zł</span>
                  </div>
                </div>
              )}

              {/* Distance Filter (only when geolocation is active) */}
              {userLocation && (
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Odległość: <span className="text-slate-900">{maxDistance === 100 ? 'Wszystkie' : `do ${maxDistance} km`}</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                    <span>5 km</span>
                    <span>100 km</span>
                  </div>
                </div>
              )}

              {/* Distance from City Filter (only when searching by city) */}
              {searchCenter && !userLocation && (
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Od {searchCenter.name}: <span className="text-slate-900">{maxDistanceFromCity === 100 ? 'Wszystkie' : `do ${maxDistanceFromCity} km`}</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={maxDistanceFromCity}
                    onChange={(e) => setMaxDistanceFromCity(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                    <span>5 km</span>
                    <span>100 km</span>
                  </div>
                </div>
              )}

            </div>
          </aside>

          {/* RIGHT SIDE - LIST OR MAP (toggle jak w Lottie) */}
          <div className="flex-1 flex flex-col bg-slate-50 lg:ml-[420px]">

            {/* Desktop Search & Toggle Bar - sticky */}
            <div className="hidden md:flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200 sticky top-20 z-30 lg:left-96">

              {/* Search Input */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && cityInput.trim()) {
                        router.push(`/search?q=${encodeURIComponent(cityInput.trim())}&partial=true`);
                      }
                    }}
                    placeholder="Wpisz miejscowość..."
                    className="w-full pl-4 pr-24 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                  <button
                    onClick={() => {
                      if (cityInput.trim()) {
                        router.push(`/search?q=${encodeURIComponent(cityInput.trim())}&partial=true`);
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Szukaj
                  </button>
                </div>
              </div>

              {/* Geolocation Button */}
              <button
                onClick={handleGeolocation}
                disabled={isLoadingLocation}
                className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {isLoadingLocation ? 'Lokalizacja...' : 'Geolokalizacja'}
              </button>

              {/* Results Count */}
              <p className="text-sm font-semibold text-gray-600 whitespace-nowrap">
                Znaleziono <span className="text-gray-900">{facilities.length}</span> {facilities.length === 1 ? 'placówkę' : 'placówek'}
              </p>

              {/* List/Map Toggle */}
              <div className="flex items-center gap-2 bg-gray-900 rounded-xl p-1">
                <button
                  onClick={() => setShowMapMobile(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    !showMapMobile
                      ? 'bg-white text-gray-900'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Lista
                </button>
                <button
                  onClick={() => setShowMapMobile(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    showMapMobile
                      ? 'bg-white text-gray-900'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Mapa
                </button>
              </div>
            </div>

            {/* LISTA lub MAPA (toggle) */}
            {!showMapMobile ? (
              /* LISTA */
              <div className={`w-full overflow-y-auto h-[calc(100vh-136px)] md:h-[calc(100vh-80px-56px)] ${showMapMobile ? 'hidden md:block' : 'block'}`}>
                <div className="p-4 md:p-6 space-y-4 max-w-3xl mx-auto">

              {isLoading ? (
                // Loading
                [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
              ) : facilities.length === 0 && message ? (
                // Komunikat z serwera (np. miejscowość poza Małopolską)
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <p className="text-slate-700 font-semibold text-base mb-1">{message}</p>
                  <p className="text-slate-400 text-sm">Przykłady: Kraków, Tarnów, Nowy Sącz, Zakopane</p>
                </div>
              ) : facilities.length === 0 ? (
                // Empty State (po filtrowaniu po stronie klienta)
                <EmptyState onResetFilters={resetFilters} cityInput={cityInput} />
              ) : (
                <>
                  {/* Results Count */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    <p className="text-sm font-semibold text-gray-600">
                      Znaleziono <span className="text-gray-900">{facilities.length}</span> {facilities.length === 1 ? 'placówkę' : 'placówek'}
                    </p>
                  </div>

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
                      profileLabels: getShortProfileLabels(fac.profil_opieki, fac.typ_placowki),
                      distance: fac.distance
                    }}
                    userLocation={userLocation}
                    isHovered={hoveredId === fac.id}
                    isSaved={favoritesState.includes(fac.id)}
                    isCompared={selectedForCompare.includes(fac.id)}
                    onHover={setHoveredId}
                    onClick={() => handleFacilityClick(fac.id, fac.powiat)}
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
            ) : (
              /* MAPA */
              <div className="w-full bg-gray-100 overflow-hidden h-[calc(100vh-136px)] md:h-[calc(100vh-80px-56px)]">
                <FacilityMap
                  facilities={facilities}
                  userLocation={userLocation}
                  searchCenter={searchCenter}
                  powiatBreakdown={powiatBreakdown}
                  powiatSearchCenters={powiatSearchCenters}
                  selectedPowiat={selectedPowiat}
                  onPowiatClick={handlePowiatChange}
                />
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Mobile Map Overlay (fullscreen) */}
      {showMapMobile && (
        <div className="md:hidden fixed inset-0 z-40 top-[120px] bg-gray-100">
          <FacilityMap
            facilities={facilities}
            userLocation={userLocation}
            searchCenter={searchCenter}
            powiatBreakdown={powiatBreakdown}
            powiatSearchCenters={powiatSearchCenters}
            selectedPowiat={selectedPowiat}
            onPowiatClick={handlePowiatChange}
          />
        </div>
      )}

      {/* Comparison Bar */}
      <ComparisonBar
        selectedIds={selectedForCompare}
        facilities={facilities}
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
          hasUserLocation={!!userLocation}
          onGeolocation={handleGeolocation}
        />
      )}
    </div>
  );
}