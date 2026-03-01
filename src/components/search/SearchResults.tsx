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
import { SearchBar } from './SearchBar';

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

// Normalizacja polskich znaków (konsystentne z app/search/page.tsx)
const normalizePolish = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Mapowanie miast na prawach powiatu (TERYT) → powiaty ziemskie (baza placówek)
const mapCityCountyToPowiat = (powiat: string): string => {
  const normalized = normalizePolish(powiat);

  // Kraków: tylko "m. Kraków" (nie wieś "Kraków"!) → "krakowski"
  if (normalized === 'm. krakow') return 'krakowski';
  // Nowy Sącz: "m. Nowy Sącz" → "nowosądecki"
  if (normalized === 'm. nowy sacz') return 'nowosądecki';
  // Tarnów: "m. Tarnów" → "tarnowski"
  if (normalized === 'm. tarnow') return 'tarnowski';

  return powiat; // bez zmian dla innych powiatów
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

  // Auto-select powiat jeśli:
  // 1. User wybrał powiat z autocomplete (activeFilters.powiat)
  // 2. User wpisał miejscowość która istnieje w JEDNYM powiecie (terytPowiats.length === 1)
  const getInitialPowiat = () => {
    if (activeFilters?.powiat) {
      return mapCityCountyToPowiat(activeFilters.powiat);
    }
    if (terytPowiats && terytPowiats.length === 1) {
      return mapCityCountyToPowiat(terytPowiats[0]);
    }
    return "Wszystkie";
  };

  const [selectedPowiat, setSelectedPowiat] = useState(getInitialPowiat());
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
  const [maxDistance, setMaxDistance] = useState<number>(30); // km (from geolocation)
  const [maxDistanceFromCity, setMaxDistanceFromCity] = useState<number>(30); // km (from searched city)

  // Track current query from SearchBar - when empty, clear results
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);

  // ===== COMPUTED =====
  // Lista powiatów do filtra — dynamiczna (tylko powiaty gdzie istnieje szukana miejscowość)
  // lub pełna lista Małopolski gdy brak danych TERYT (np. wyszukiwanie woj./geoloc)
  const ALL_MALOPOLSKA_POWIATS = [
    "bocheński", "brzeski", "chrzanowski", "dąbrowski", "gorlicki",
    "krakowski", "limanowski", "miechowski", "myślenicki", "nowosądecki",
    "nowotarski", "olkuski", "oświęcimski", "proszowicki", "suski",
    "tarnowski", "tatrzański", "wadowicki", "wielicki",
    // Note: miasta na prawach powiatu (m. Kraków, m. Nowy Sącz, m. Tarnów) są mapowane
    // na odpowiadające im powiaty ziemskie (krakowski, nowosądecki, tarnowski)
    // w app/search/page.tsx, więc nie są potrzebne tutaj jako osobne opcje
  ];
  const availablePowiats = terytPowiats && terytPowiats.length > 0
    ? ["Wszystkie", ...Array.from(new Set(terytPowiats.map(mapCityCountyToPowiat)))]
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
    if (userLocation && maxDistance < 30) {
      chips.push({
        label: `Do: ${maxDistance} km`,
        clear: () => setMaxDistance(30)
      });
    }
    if (searchCenter && maxDistanceFromCity < 30) {
      chips.push({
        label: `Od ${searchCenter.name}: ${maxDistanceFromCity} km`,
        clear: () => setMaxDistanceFromCity(30)
      });
    }
    return chips;
  }, [cityInput, query, selectedType, type, selectedVoivodeship, selectedPowiat, selectedProfiles, priceLimit, maxDistance, maxDistanceFromCity, userLocation, searchCenter]);


  // Sync filter state when activeFilters prop changes (e.g. after router.push navigation)
  useEffect(() => {
    if (activeFilters?.powiat) {
      setSelectedPowiat(mapCityCountyToPowiat(activeFilters.powiat));
    } else if (terytPowiats && terytPowiats.length === 1) {
      setSelectedPowiat(mapCityCountyToPowiat(terytPowiats[0]));
    } else {
      setSelectedPowiat("Wszystkie");
    }
  }, [activeFilters?.powiat, terytPowiats]);

  // Mobile map toggle via custom event from MobileStickyBar
  useEffect(() => {
    const handleToggleMap = () => setShowMapMobile(prev => !prev);
    window.addEventListener('toggleMobileMap', handleToggleMap);
    return () => window.removeEventListener('toggleMobileMap', handleToggleMap);
  }, []);

  // Set initial facilities from server
  useEffect(() => {
    setFacilities(results);
  }, [results]);

  // Clear results and reset filters when query is cleared in SearchBar
  useEffect(() => {
    // Skip if SearchBar hasn't initialized yet (null = not touched by user)
    if (currentQuery === null) return;

    // Sync cityInput with currentQuery from SearchBar
    setCityInput(currentQuery);

    if (currentQuery.trim() === '') {
      // Clear everything when search is empty
      setFacilities([]);
      setSelectedPowiat('Wszystkie');
      setSelectedProfiles([]);
      setPriceLimit(10000);
      setMaxDistance(30);
      setMaxDistanceFromCity(30);
    }
  }, [currentQuery]);

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

      // MAPOWANIE: "m. Kraków" (TERYT) → "krakowski" (baza placówek)
      let mappedPowiat = selectedPowiat;
      const normalizedSelected = norm(selectedPowiat);

      if (normalizedSelected === 'm. krakow') {
        mappedPowiat = 'krakowski';
      }

      const targetPowiat = norm(mappedPowiat);
      filtered = filtered.filter(f => {
        // ✅ MAPUJ także powiat z FACILITIES (tak jak w app/search/page.tsx)
        let facilityPowiat = f.powiat ?? '';
        const normFacilityPowiat = norm(facilityPowiat);

        // Zmapuj miasta na prawach powiatu
        if (normFacilityPowiat === 'krakow') {
          facilityPowiat = 'krakowski';
        } else if (normFacilityPowiat === 'nowy sacz') {
          facilityPowiat = 'nowosądecki';
        } else if (normFacilityPowiat === 'tarnow') {
          facilityPowiat = 'tarnowski';
        }

        return norm(facilityPowiat) === targetPowiat;
      });
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
    if (userLocation) {
      filtered = filtered.filter(f => {
        // Jeśli placówka nie ma współrzędnych, nie filtruj po odległości (pokaż ją)
        if (f.distance === null || f.distance === undefined) return true;
        return f.distance <= maxDistance;
      });
    }

    // Distance from searched city filter (only when searchCenter exists)
    if (searchCenter && !userLocation) {
      filtered = filtered.filter(f => {
        // Jeśli placówka nie ma współrzędnych, nie filtruj po odległości (pokaż ją)
        if (f.distanceFromCity === null || f.distanceFromCity === undefined) return true;
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
      setMaxDistance(30);
      setMaxDistanceFromCity(30);
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
    setMaxDistance(30);
    setMaxDistanceFromCity(30);
  };

  const normPowiat = (s: string) =>
    s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'l');

  const handlePowiatChange = (powiat: string) => {
    if (powiat !== "Wszystkie") {
      const targetPowiat = normPowiat(powiat);
      const hasResults = results.some(f => normPowiat(f.powiat ?? '') === targetPowiat);
      if (!hasResults) {
        // Powiat not in current server results — navigate with BOTH query and powiat
        // ✅ Zachowujemy query żeby dostać odpowiedni komunikat o braku wyników
        const params = new URLSearchParams();
        if (query && query.trim() !== '') {
          params.set('q', query);
        }
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
      <div className="flex w-full">

        {/* LEFT SIDEBAR - FILTERS (Desktop only) - STICKY */}
        <div className="hidden lg:block sticky top-20 w-80 h-fit max-h-[calc(100vh-100px)] bg-white border-r border-slate-200 z-20 self-start">
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-100px)] pb-8">

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

              {/* Województwo Filter */}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Województwo</label>
                <select
                  value="Małopolskie"
                  disabled
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-300 rounded-lg text-sm font-bold text-slate-600 cursor-not-allowed"
                >
                  <option value="Małopolskie">Małopolskie</option>
                </select>
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

              {/* Distance Filter */}
              {userLocation ? (
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Odległość: <span className="text-slate-900">do {maxDistance} km</span>
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
              ) : searchCenter ? (
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    Od {searchCenter.name}: <span className="text-slate-900">do {maxDistanceFromCity} km</span>
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
              ) : null}

          </div>
        </div>

        {/* RIGHT SIDE - LIST OR MAP (toggle jak w Lottie) */}
        <div className="flex-1 flex flex-col bg-slate-50">

          {/* Desktop Header - sticky */}
          <div className="hidden md:block sticky top-20 z-30 bg-white border-b border-gray-200 shadow-md">
              {/* Row 1: Search Bar */}
              <div className="px-6 py-3 border-b border-gray-100 flex justify-center">
                <div className="w-full max-w-2xl">
                  <SearchBar
                    initialQuery={cityInput}
                    initialType={selectedType === 'DPS' ? 'DPS' : selectedType === 'ŚDS' ? 'ŚDS' : 'Wszystkie'}
                    compact={true}
                    onQueryChange={setCurrentQuery}
                  />
                </div>
              </div>

              {/* Row 2: Active Filters (z wrap) */}
              {activeChips.length > 0 && (
                <div className="px-6 py-3 border-b border-gray-100">
                  <ActiveFilters chips={activeChips} inline={true} />
                </div>
              )}

              {/* Row 3: Results Count + Sort + Toggle */}
              <div className="flex items-center justify-between gap-4 px-6 py-3">
                {/* Left: Results Count */}
                <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">
                  {query ? `${query}: ` : ''}{facilities.length} {facilities.length === 1 ? 'placówka' : facilities.length < 5 ? 'placówki' : 'placówek'}
                </h2>

                {/* Right: Sort + Toggle */}
                <div className="flex items-center gap-4">
                  {/* Sort Dropdown - Lottie style */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-600">Sortuj:</label>
                    <select className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option>Rekomendowane</option>
                      <option>Odległość</option>
                      <option>Cena: rosnąco</option>
                      <option>Cena: malejąco</option>
                    </select>
                  </div>

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
              </div>
            </div>

            {/* LISTA lub MAPA (toggle) */}
            {!showMapMobile ? (
              /* LISTA */
              <div className={`w-full overflow-y-auto h-[calc(100vh-136px)] md:h-[calc(100vh-80px-56px)] ${showMapMobile ? 'hidden md:block' : 'block'} relative z-0`}>
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