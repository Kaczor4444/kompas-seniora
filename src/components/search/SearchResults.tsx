// src/components/search/SearchResults.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { isFavorite, addFavorite, removeFavorite } from '@/src/utils/favorites';
import { getShortProfileLabels } from '@/src/lib/profileLabels';
import { useAppAnalytics } from '@/src/hooks/useAppAnalytics';
import { useScrollTracking } from '@/src/hooks/useScrollTracking';
import { calculateDistance } from '@/src/utils/distance';
import { normalizePolish } from '@/lib/normalize-polish';
import { mapCityCountyToPowiat } from '@/lib/city-county-mapping';

// Import modular components
import { SearchHeader } from './SearchHeader';
import { ActiveFilters } from './ActiveFilters';
import { FilterPanel } from './FilterPanel';
import { FacilityCard } from './FacilityCard';
import { SkeletonCard } from './SkeletonCard';
import { EmptyState } from './EmptyState';
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
  searchCenter?: {
    lat: number;
    lng: number;
    name: string;
    state?: string; // Województwo z Nominatim
    outOfRegion?: boolean; // true jeśli miasto poza obsługiwanymi województwami
    isPartOfVillage?: boolean; // true jeśli to część wsi o nazwie stolicy
  };
  terytPowiats?: string[];
  powiatBreakdown?: Record<string, number>;
  powiatSearchCenters?: Record<string, { lat: number; lng: number }>;
  initialView?: 'list' | 'map';
  capitalCityWarning?: {
    cityName: string;
    powiat: string;
  };
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
  initialView = 'list',
  capitalCityWarning,
}: SearchResultsProps) {

  const router = useRouter();
  const searchParams = useSearchParams();
  const showAll = searchParams.get('showAll') === 'true';
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
    activeFilters?.maxPrice || 12000  // Zwiększono z 10000 do 12000 (max cena w bazie: 11300 zł)
  );

  const [showFilters, setShowFilters] = useState(false);
  const [showMapMobile, setShowMapMobile] = useState(initialView === 'map');
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const [facilities, setFacilities] = useState<Facility[]>(results);
  const [isLoading, setIsLoading] = useState(false);
  // ⚠️ ZMIENIONO: 20 → 10 (lepszy UX + trudniejszy scraping)
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [favoritesState, setFavoritesState] = useState<number[]>([]);
  // ⚠️ DOSTOSOWANE do servera (app/search/page.tsx DEFAULT_RADIUS_KM = 30)
  // Server filtruje do 30km (lub 50km jeśli < 3 wyniki), więc client musi używać tego samego limitu
  const [maxDistance, setMaxDistance] = useState<number>(30); // km (from geolocation)
  const [maxDistanceFromCity, setMaxDistanceFromCity] = useState<number>(30); // km (from searched city)

  // Track current query from SearchBar - when empty, clear results
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);

  // Profile filter collapsed by default - manual toggle only
  const [showProfilesExpanded, setShowProfilesExpanded] = useState(false);

  // Left panel visibility (map view)
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  // Price filter collapsed by default
  const [showPriceExpanded, setShowPriceExpanded] = useState(false);

  // Sort parameter
  const [sortParam, setSortParam] = useState<string>('recommended');

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

  // Oblicz maksymalną odległość z wyników (server limit)
  const maxDistanceFromServer = useMemo(() => {
    if (results.length === 0) return 100;
    const distances = results
      .map(f => f.distance || f.distanceFromCity || 0)
      .filter(d => d > 0);
    if (distances.length === 0) return 100;
    return Math.ceil(Math.max(...distances) / 5) * 5; // Zaokrąglij w górę do najbliższej 5
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
    if (userLocation && maxDistance < maxDistanceFromServer) {
      chips.push({
        label: `Do: ${maxDistance} km`,
        clear: () => setMaxDistance(maxDistanceFromServer)
      });
    }
    if (searchCenter && maxDistanceFromCity < maxDistanceFromServer) {
      chips.push({
        label: `Od ${searchCenter.name}: ${maxDistanceFromCity} km`,
        clear: () => setMaxDistanceFromCity(maxDistanceFromServer)
      });
    }
    return chips;
  }, [cityInput, query, selectedType, type, selectedVoivodeship, selectedPowiat, selectedProfiles, priceLimit, maxDistance, maxDistanceFromCity, userLocation, searchCenter, maxDistanceFromServer]);


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
    console.log('🔄 Setting facilities from results:', results.length);
    setFacilities(results);
  }, [results]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(10);
  }, [selectedType, selectedVoivodeship, selectedPowiat, selectedProfiles, priceLimit, maxDistance, maxDistanceFromCity]);

  // Clear results and reset filters when query is cleared in SearchBar
  useEffect(() => {
    // Skip if SearchBar hasn't initialized yet (null = not touched by user)
    if (currentQuery === null) return;

    // Sync cityInput with currentQuery from SearchBar
    setCityInput(currentQuery);

    if (currentQuery.trim() === '') {
      // 🔧 FIX: NIE czyść facilities gdy:
      // 1. Jest aktywny filtr powiatu (TRYB 5 - klik z mapy)
      // 2. showAll flag jest ustawiony (pokazuj wszystkie placówki)
      // 3. Server przesłał puste query (query === '') I mamy wyniki (TRYB 6 - wszystkie placówki)
      //    To znaczy że to NIE jest sytuacja gdzie user wyczyścił pole, tylko SearchBar się inicjalizuje
      if ((activeFilters?.powiat && results.length > 0) || showAll || (query === '' && results.length > 0)) {
        console.log('⏭️ NIE czyścimy facilities - mamy wyniki z servera (TRYB 5/6 lub showAll)', {
          powiatFilter: activeFilters?.powiat,
          resultsLength: results.length,
          showAll,
          query
        });
        return;
      }

      // Clear everything when search is empty
      console.log('🗑️ CZYSZCZENIE facilities - currentQuery jest puste i nie ma wyników z servera');
      setFacilities([]);
      setSelectedPowiat('Wszystkie');
      setSelectedProfiles([]);
      setPriceLimit(10000);
      setMaxDistance(maxDistanceFromServer);
      setMaxDistanceFromCity(maxDistanceFromServer);

      // ✅ Navigate to clear searchCenter and reset map (hide pulsating point)
      const viewParam = showMapMobile ? 'view=map' : '';
      if (userLocation) {
        // Keep geolocation active, just remove city search
        router.push(`/search?lat=${userLocation.lat}&lng=${userLocation.lng}&near=true${viewParam ? '&' + viewParam : ''}`);
      } else {
        // Go back to empty search (no pulsating point, default map center)
        router.push(`/search${viewParam ? '?' + viewParam : ''}`);
      }
    }
  }, [currentQuery, maxDistanceFromServer, showMapMobile, userLocation, router, activeFilters, results, showAll]);

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

  // ===== FILTERING LOGIC (with distance calculation) =====
  useEffect(() => {
    // ✅ Calculate effectiveSearchCenter - same logic as FacilityMap.tsx
    // When user changes county dropdown (selectedPowiat), use geocoded coordinates for that county
    // This ensures distance calculations match the pulsating point on the map
    const effectiveSearchCenter = selectedPowiat !== "Wszystkie" && powiatSearchCenters?.[selectedPowiat]
      ? { ...powiatSearchCenters[selectedPowiat], name: searchCenter?.name || selectedPowiat }
      : searchCenter;

    // Step 1: Calculate distance from searched city for all facilities
    let filtered = results.map(facility => {
      // Add distanceFromCity if we have effectiveSearchCenter
      if (effectiveSearchCenter && facility.latitude && facility.longitude) {
        const dist = calculateDistance(
          effectiveSearchCenter.lat,  // ✅ Use effectiveSearchCenter instead of searchCenter
          effectiveSearchCenter.lng,
          parseFloat(facility.latitude as any),
          parseFloat(facility.longitude as any)
        );
        return { ...facility, distanceFromCity: dist };
      }
      return { ...facility, distanceFromCity: null };
    });

    // ✅ If cityInput is completely empty (user cleared it), show no results
    // EXCEPT when:
    // - using geolocation (userLocation is set)
    // - powiat filter is active (TRYB 5 - klik z mapy regionowej)
    // - showAll flag is true (pokazuj wszystkie placówki z województwa)
    // - TRYB 6: server przesłał wszystkie placówki (query === '' && results.length > 0)
    if ((!cityInput || cityInput.trim() === '') && !userLocation && !activeFilters?.powiat && !showAll && !(query === '' && results.length > 0)) {
      console.log('🗑️ Czyszczenie facilities - brak inputu i specjalnych trybów');
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
      // MAPOWANIE: "m. Kraków" (TERYT) → "krakowski" (baza placówek)
      const mappedPowiat = mapCityCountyToPowiat(selectedPowiat);
      const targetPowiat = normalizePolish(mappedPowiat);

      filtered = filtered.filter(f => {
        // ✅ MAPUJ także powiat z FACILITIES (tak jak w app/search/page.tsx)
        const facilityPowiat = mapCityCountyToPowiat(f.powiat ?? '');
        return normalizePolish(facilityPowiat) === targetPowiat;
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

    // Distance from searched city filter (only when searchCenter exists AND not TRYB 6)
    // TRYB 6: gdy query='' i serwer wysłał wszystkie wyniki - nie filtruj po odległości
    if (searchCenter && !userLocation && !(query === '' && results.length > 0)) {
      filtered = filtered.filter(f => {
        // Jeśli placówka nie ma współrzędnych LUB distanceFromCity nie jest obliczony, ukryj ją
        if (f.distanceFromCity === null || f.distanceFromCity === undefined) {
          return false; // Ukryj placówki bez dystansu
        }
        return f.distanceFromCity <= maxDistanceFromCity;
      });
    }

    // ===== SORTING LOGIC =====
    switch (sortParam) {
      case 'distance':
        // Sort by distance (closest first)
        filtered = filtered.sort((a, b) => {
          const distA = a.distance ?? a.distanceFromCity ?? Infinity;
          const distB = b.distance ?? b.distanceFromCity ?? Infinity;
          return distA - distB;
        });
        break;

      case 'price_asc':
        // Sort by price ascending (null at the end)
        filtered = filtered.sort((a, b) => {
          if (a.koszt_pobytu === null && b.koszt_pobytu === null) return 0;
          if (a.koszt_pobytu === null) return 1;
          if (b.koszt_pobytu === null) return -1;
          return a.koszt_pobytu - b.koszt_pobytu;
        });
        break;

      case 'price_desc':
        // Sort by price descending (null at the end)
        filtered = filtered.sort((a, b) => {
          if (a.koszt_pobytu === null && b.koszt_pobytu === null) return 0;
          if (a.koszt_pobytu === null) return 1;
          if (b.koszt_pobytu === null) return -1;
          return b.koszt_pobytu - a.koszt_pobytu;
        });
        break;

      case 'recommended':
      default:
        // Keep default order (by name from server, or by priority)
        break;
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
    selectedProfiles, priceLimit, maxDistance, maxDistanceFromCity, userLocation, searchCenter, powiatSearchCenters, sortParam, trackEmptyResults, trackFilterApplied, showAll
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
      setMaxDistance(maxDistanceFromServer);
      setMaxDistanceFromCity(maxDistanceFromServer);
    }
    prevCityInputRef.current = cityInput;
  }, [cityInput, maxDistanceFromServer]);

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
    setMaxDistance(maxDistanceFromServer);
    setMaxDistanceFromCity(maxDistanceFromServer);
  };

  const normPowiat = (s: string) =>
    s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'l');

  const handlePowiatChange = (powiat: string) => {
    // ⚠️ NOWA LOGIKA: Server zawsze zwraca wszystkie z województwa gdy jest query
    // Więc NIE TRZEBA nawigować - po prostu zmieniamy filtr client-side!

    if (powiat !== "Wszystkie") {
      const targetPowiat = normPowiat(powiat);
      const hasResults = results.some(f => normPowiat(f.powiat ?? '') === targetPowiat);

      // Jeśli NIE MA tego powiatu w results I NIE mamy query (np. tylko filtr powiat),
      // to znaczy że trzeba fetchować
      if (!hasResults && (!query || query.trim() === '')) {
        const params = new URLSearchParams();
        params.set('powiat', powiat);
        router.push(`/search?${params.toString()}`);
        return;
      }

      // W przeciwnym razie - mamy już wszystkie placówki z województwa,
      // więc po prostu filtrujemy client-side
    }

    setSelectedPowiat(powiat);
  };

  const handleApplyFilters = () => {
    // No-op — powiat navigation is handled live in handlePowiatChange
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
        // Stay in map view if currently in map view
        const viewParam = showMapMobile ? '&view=map' : '';
        router.push(`/search?lat=${latitude}&lng=${longitude}&near=true${viewParam}`);
      },
      (error) => {
        setIsLoadingLocation(false);
        alert('Nie udało się uzyskać Twojej lokalizacji. Sprawdź uprawnienia przeglądarki.');
        console.error('Geolocation error:', error);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  };

  // Handler to turn off geolocation
  const handleTurnOffGeolocation = () => {
    // Go back to last city search or just show empty state
    const viewParam = showMapMobile ? '&view=map' : '';
    if (query && query.trim() !== '') {
      router.push(`/search?q=${query}${viewParam}`);
    } else {
      router.push(`/${viewParam ? '?view=map' : ''}`);
    }
  };

  // ===== RENDER =====
  return (
    <section className="bg-stone-50 min-h-screen pb-24">

      {/* HERO SECTION - jak w Poradnikach */}
      <div className="bg-emerald-600 text-white relative overflow-hidden mb-8 md:mb-12">
        {/* Decorative Icon */}
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <svg className="w-96 h-96 -mr-20 -mt-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 relative z-10">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            className="group flex items-center gap-2 text-emerald-100 hover:text-white font-bold mb-4 md:mb-6 transition-colors px-4 py-2 rounded-xl hover:bg-emerald-700/50 w-fit"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-700/50 border border-emerald-500 flex items-center justify-center group-hover:border-white/50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            Wróć do strony głównej
          </button>

          {/* SearchBar */}
          <div className="max-w-2xl">
            <SearchBar
              initialQuery={cityInput}
              initialType={selectedType === 'DPS' ? 'DPS' : selectedType === 'ŚDS' ? 'ŚDS' : 'Wszystkie'}
              compact={true}
              onQueryChange={setCurrentQuery}
              disableAutocomplete={true}
            />
          </div>

          {/* Active Filters Pills */}
          {activeChips.length > 0 && (
            <div className="flex overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-2 lg:flex-wrap scrollbar-hide gap-2 items-center snap-x snap-mandatory scroll-px-4 mt-6 mb-6">
              {activeChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={chip.clear}
                  className="whitespace-nowrap snap-start px-4 py-2 rounded-xl text-sm font-bold transition-all bg-white text-slate-900 shadow-md hover:bg-emerald-700 hover:text-white flex items-center gap-2 flex-shrink-0"
                >
                  <span>{chip.label}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

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

      {/* CONTENT + SIDEBAR LAYOUT (jak Poradniki) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 md:gap-12">

          {/* LEFT SIDEBAR - FILTERS (Desktop only) - STICKY */}
          <aside className="hidden lg:block w-80 flex-shrink-0 order-2 lg:order-1">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm sticky top-32 space-y-5">

              {/* Filters Header */}
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Filtry</h2>
                <button
                  onClick={resetFilters}
                  className={`text-[11px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 ${
                    activeChips.length > 0
                      ? 'text-emerald-600 hover:text-emerald-700'
                      : 'text-slate-400 hover:text-emerald-600'
                  }`}
                >
                  Wyczyść
                  {activeChips.length > 0 && (
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {activeChips.length}
                    </span>
                  )}
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
                    onClick={() => setShowProfilesExpanded(!showProfilesExpanded)}
                    className="w-full flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 hover:text-slate-900 transition-colors"
                  >
                    <span>Profile opieki {selectedProfiles.length > 0 && `(${selectedProfiles.length})`}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showProfilesExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showProfilesExpanded && (
                    <div className="flex flex-wrap gap-2">
                      {availableProfiles.map((code) => {
                        const isSelected = selectedProfiles.includes(code);
                        return (
                          <button
                            key={code}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedProfiles(selectedProfiles.filter(c => c !== code));
                              } else {
                                setSelectedProfiles([...selectedProfiles, code]);
                              }
                            }}
                            className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                              isSelected
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            {getProfileName(code)}
                          </button>
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

              {/* Distance Filter - zawsze widoczny dla wszystkich miast */}
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  {userLocation ? (
                    <>Odległość: <span className="text-slate-900">do {maxDistance} km</span></>
                  ) : searchCenter ? (
                    <>Od {searchCenter.name}: <span className="text-slate-900">do {maxDistanceFromCity} km</span></>
                  ) : (
                    <>Odległość: <span className="text-slate-900">do {maxDistanceFromCity} km</span></>
                  )}
                </label>
                <input
                  type="range"
                  min="5"
                  max={maxDistanceFromServer}
                  step="5"
                  value={userLocation ? maxDistance : maxDistanceFromCity}
                  onChange={(e) => {
                    if (userLocation) {
                      setMaxDistance(parseInt(e.target.value));
                    } else {
                      setMaxDistanceFromCity(parseInt(e.target.value));
                    }
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                  <span>5 km</span>
                  <span>{maxDistanceFromServer} km</span>
                </div>
              </div>

          </div>
        </aside>

          {/* RIGHT CONTENT AREA */}
          <div className="flex-1 min-w-0 order-1 lg:order-2">

            {/* Multi-Powiat Info Banner */}
            {powiatBreakdown && Object.keys(powiatBreakdown).length > 1 && cityInput && cityInput.trim() !== '' && !userLocation && (
              <div className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3 mb-6 rounded-r-lg">
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

            {/* Sort + Toggle Controls - tylko gdy są wyniki */}
            {/* NOTE: Na chwilę obecną używamy prostego toggle widocznego na wszystkich ekranach.
                 MobileBottomBar (zakomentowany poniżej) to bardziej zaawansowany bottom bar z dodatkowymi funkcjami
                 (filtry, sortuj, ulubione, geolokalizacja), ale obecnie nie jest aktywny. */}
            {facilities.length > 0 && (
              <div className="flex items-center justify-between gap-4 mb-6">
                {/* Sortowanie */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm font-bold">Sortuj:</span>
                  <select
                    value={sortParam}
                    onChange={(e) => setSortParam(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="recommended">Rekomendowane</option>
                    <option value="distance">Odległość</option>
                    <option value="price_asc">Cena: rosnąco</option>
                    <option value="price_desc">Cena: malejąco</option>
                  </select>
                </div>

                {/* List/Map Toggle - JEDEN przycisk przełączający widok */}
                <button
                  onClick={() => setShowMapMobile(!showMapMobile)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  {showMapMobile ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span>Lista</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span>Mapa</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Results Count */}
            {facilities.length > 0 && (
              <div className="mb-6">
                {message ? (
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {message}
                  </h2>
                ) : (
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Znaleziono {facilities.length} {(() => {
                      const count = facilities.length;
                      if (count === 1) return 'placówkę';
                      const lastDigit = count % 10;
                      const lastTwoDigits = count % 100;
                      if (lastTwoDigits >= 10 && lastTwoDigits <= 21) return 'placówek';
                      if (lastDigit >= 2 && lastDigit <= 4) return 'placówki';
                      return 'placówek';
                    })()}
                  </h2>
                )}
              </div>
            )}

            {/* ⚠️ OSTRZEŻENIE: User szukał stolicę Polski ale pokazujemy część wsi */}
            {capitalCityWarning && facilities.length > 0 && (
              <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-amber-900 text-base mb-1 tracking-tight">
                    To nie stolica, tylko część wsi!
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Szukana miejscowość <strong>"{capitalCityWarning.cityName}"</strong> to <strong>część wsi w powiecie {capitalCityWarning.powiat}</strong>, nie stolica Polski.
                    {' '}Stolica {capitalCityWarning.cityName} nie znajduje się w obsługiwanym regionie (Małopolska).
                  </p>
                </div>
              </div>
            )}

            {/* Facilities Grid - SINGLE COLUMN */}
            <div className="space-y-6">
              {isLoading ? (
                [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
              ) : facilities.length === 0 && message ? (
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
                // Nie pokazuj EmptyState gdy query jest puste ALE mamy wyniki z servera
                // (TRYB 6 - wszystkie placówki bez wyszukiwania)
                query === '' && results.length > 0 ? null : (
                  <EmptyState
                    onResetFilters={resetFilters}
                    cityInput={cityInput}
                    outOfRegion={searchCenter?.outOfRegion}
                    outOfRegionCityName={searchCenter?.name}
                  />
                )
              ) : (
                <>
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
                        image: '/images/placeholder-facility.jpg',
                        waitTime: 'Brak danych',
                        profileLabels: getShortProfileLabels(fac.profil_opieki, fac.typ_placowki),
                        distance: fac.distance
                      }}
                      userLocation={userLocation}
                      isHovered={hoveredId === fac.id}
                      isSaved={favoritesState.includes(fac.id)}
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
                    />
                  ))}

                  {/* Load More Button */}
                  {visibleCount < facilities.length && (
                    <div className="pt-8 flex flex-col items-center gap-4">
                      <div className="text-sm font-bold text-slate-400">
                        Widzisz <span className="text-slate-900">{Math.min(visibleCount, facilities.length)}</span> z <span className="text-slate-900">{facilities.length}</span> placówek
                      </div>
                      <button
                        onClick={() => {
                          setIsLoadingMore(true);
                          setTimeout(() => {
                            setVisibleCount(prev => prev + 10); // Ładuj po 10
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

        </div>
      </div>

      {/* MAP VIEW (fullscreen overlay when showMapMobile=true) */}
      {showMapMobile && (
        <div className="fixed inset-0 z-40 top-20 bg-stone-50">
          {/* Backdrop - kliknięcie zamyka panel */}
          {showLeftPanel && (
            <div
              className="absolute inset-0 bg-slate-900/10 z-10"
              onClick={() => setShowLeftPanel(false)}
            />
          )}

          {/* Floating "Filtry" button (when panel is closed) */}
          {!showLeftPanel && (
            <button
              onClick={() => setShowLeftPanel(true)}
              className="absolute top-4 left-20 z-30 bg-white hover:bg-emerald-600 text-slate-900 hover:text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Filtry
            </button>
          )}

          {/* Left Panel Container - only show when showLeftPanel is true */}
          {showLeftPanel && (
            <div className="absolute top-20 left-4 z-30 w-80 space-y-3">
              <SearchBar
                initialQuery={cityInput}
                initialType={selectedType === 'DPS' ? 'DPS' : selectedType === 'ŚDS' ? 'ŚDS' : 'Wszystkie'}
                compact={true}
                onQueryChange={setCurrentQuery}
                disableAutocomplete={true}
                onSearch={(params) => {
                  // Stay in map view after search - add view=map parameter
                  params.append('view', 'map');

                  // FIX: Zawsze wysyłaj województwo (domyślnie małopolskie)
                  // Zapobiega szukaniu miast poza obsługiwanym regionem (np. Olsztyn)
                  if (!params.has('woj')) {
                    params.append('woj', 'malopolskie');
                  }

                  // CRITICAL FIX: Przekaż aktualnie wybrany powiat do URL
                  // Aby server geokodował właściwą miejscowość w wybranym powiecie
                  if (selectedPowiat !== "Wszystkie") {
                    params.append('powiat', selectedPowiat);
                  }

                  router.push(`/search?${params.toString()}`);
                }}
              />

              {/* Floating Filters Modal - Always Visible, below SearchBar */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-[calc(100vh-13rem)]">
              <div className="p-6 space-y-5">
                {/* Filters Header with Close button */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Filtry</h2>
                    {activeChips.length > 0 && (
                      <span className="bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded-full">
                        {activeChips.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowLeftPanel(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Zamknij panel"
                  >
                    <svg className="w-5 h-5 text-slate-400 hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Geolocation Section */}
                <div className="pb-5 border-b border-slate-200">
                  {/* Geolocation info when active */}
                  {userLocation && (
                    <div className="bg-emerald-50 border border-emerald-200 px-3 py-2.5 rounded-lg mb-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-xs font-bold text-emerald-900">
                          W promieniu {maxDistance}km od Ciebie
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Geolocation toggle button */}
                  <button
                    onClick={userLocation ? handleTurnOffGeolocation : handleGeolocation}
                    disabled={isLoadingLocation}
                    className={`w-full px-4 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      userLocation
                        ? 'bg-slate-600 hover:bg-slate-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isLoadingLocation ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Wyszukiwanie...</span>
                      </>
                    ) : userLocation ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Wyłącz geolokalizację</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Szukaj blisko mnie</span>
                      </>
                    )}
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
                        onClick={() => setShowProfilesExpanded(!showProfilesExpanded)}
                        className="w-full flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 hover:text-slate-900 transition-colors"
                      >
                        <span>Profile opieki {selectedProfiles.length > 0 && `(${selectedProfiles.length})`}</span>
                        <svg
                          className={`w-4 h-4 transition-transform ${showProfilesExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showProfilesExpanded && (
                        <div className="flex flex-wrap gap-2">
                          {availableProfiles.map((code) => {
                            const isSelected = selectedProfiles.includes(code);
                            return (
                              <button
                                key={code}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedProfiles(selectedProfiles.filter(c => c !== code));
                                  } else {
                                    setSelectedProfiles([...selectedProfiles, code]);
                                  }
                                }}
                                className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                                  isSelected
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                                }`}
                              >
                                {getProfileName(code)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Distance Filter - pokazuj zawsze (dla geolokalizacji lub searched city) */}
                  {(userLocation || searchCenter) && (
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        {userLocation ? (
                          <>Odległość: <span className="text-slate-900">do {maxDistance} km</span></>
                        ) : searchCenter ? (
                          <>Od {searchCenter.name}: <span className="text-slate-900">do {maxDistanceFromCity} km</span></>
                        ) : (
                          <>Odległość: <span className="text-slate-900">do {maxDistanceFromCity} km</span></>
                        )}
                      </label>
                      <input
                        type="range"
                        min="5"
                        max={maxDistanceFromServer}
                        step="5"
                        value={userLocation ? maxDistance : maxDistanceFromCity}
                        onChange={(e) => {
                          if (userLocation) {
                            setMaxDistance(parseInt(e.target.value));
                          } else {
                            setMaxDistanceFromCity(parseInt(e.target.value));
                          }
                        }}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1">
                        <span>5 km</span>
                        <span>{maxDistanceFromServer} km</span>
                      </div>
                    </div>
                  )}

                {/* Price Filter - Collapsible */}
                {selectedType !== 'ŚDS' && (
                  <div>
                    <button
                      onClick={() => setShowPriceExpanded(!showPriceExpanded)}
                      className="w-full flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 hover:text-slate-900 transition-colors"
                    >
                      <span>Cena {priceLimit < 10000 && `(do ${priceLimit} zł)`}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${showPriceExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showPriceExpanded && (
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
                  </div>
                )}

                {/* Reset filters button */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    onClick={resetFilters}
                    className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Wyczyść wszystkie filtry
                  </button>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Back to List button - right side */}
          <button
            onClick={() => setShowMapMobile(false)}
            className="absolute top-4 right-4 z-30 bg-white hover:bg-emerald-600 text-slate-900 hover:text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="hidden md:inline">Lista</span>
          </button>

          {/* Content Area */}
          <div className="h-full relative">
            {/* Map */}
            <div className="w-full h-full">
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
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar - ZAKOMENTOWANY */}
      {/*
        MobileBottomBar to zaawansowany bottom bar dla mobile z wieloma funkcjami:
        - Toggle Lista/Mapa
        - Przycisk Filtry z licznikiem aktywnych filtrów
        - Przycisk Sortuj (otwiera modal z opcjami sortowania)
        - Przycisk Ulubione (tylko jeśli są zapisane placówki)
        - Przycisk Geolokalizacji

        DLACZEGO ZAKOMENTOWANY:
        - Na chwilę obecną używamy prostszego rozwiązania - toggle w głównej sekcji (widoczny wszędzie)
        - MobileBottomBar może kolidować z innymi elementami UI (np. comparison bar)
        - Do przyszłego użycia gdy będziemy chcieli bardziej zaawansowany mobile UX

        Aby aktywować: odkomentuj poniższy kod i ukryj desktop toggle dodając "hidden md:flex" do linii ~979
      */}
      {/* <MobileBottomBar
        showMap={showMapMobile}
        onToggleMap={setShowMapMobile}
        activeFiltersCount={Object.keys(activeFilters).length}
        onOpenFilters={() => setShowFilters(true)}
        hasUserLocation={!!userLocation}
        onGeolocation={handleGeolocation}
      /> */}
    </section>
  );
}
