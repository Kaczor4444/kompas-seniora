// src/components/search/SearchResults.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Import modular components
import { SearchHeader } from './SearchHeader';
import { ActiveFilters } from './ActiveFilters';
import { FilterPanel } from './FilterPanel';
import { FacilityCard } from './FacilityCard';
import { SkeletonCard } from './SkeletonCard';
import { EmptyState } from './EmptyState';
import { ComparisonBar } from './ComparisonBar';
import { MobileMapToggle } from './MobileMapToggle';

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

// ===== CONSTANTS =====
const VOIVODESHIPS = [
  "Wszystkie", "Dolnośląskie", "Kujawsko-pomorskie", "Lubelskie", "Lubuskie",
  "Łódzkie", "Małopolskie", "Mazowieckie", "Opolskie",
  "Podkarpackie", "Podlaskie", "Pomorskie", "Śląskie",
  "Świętokrzyskie", "Warmińsko-mazurskie", "Wielkopolskie", "Zachodniopomorskie"
];

const CARE_PROFILES = [
  "Wszystkie", "Osoby starsze", "Somatycznie chorzy", "Psychicznie chorzy",
  "Niepełnosprawni intelektualnie", "Niepełnosprawni fizycznie",
  "Dzieci i młodzież", "Uzależnieni"
];

// ===== MAIN COMPONENT =====
export default function SearchResults({
  query,
  type,
  results,
  message,
  activeFilters,
  userLocation
}: SearchResultsProps) {

  // ===== STATE =====
  const [cityInput, setCityInput] = useState(query || "");
  const [selectedType, setSelectedType] = useState(type || 'all');
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
  const [quickFilterNFZ, setQuickFilterNFZ] = useState(
    activeFilters?.showFree || false
  );
  const [quickFilterBest, setQuickFilterBest] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);

  const [facilities, setFacilities] = useState<Facility[]>(results);
  const [isLoading, setIsLoading] = useState(false);

  // ===== COMPUTED =====
  const availablePowiats = useMemo(() => {
    const powiats = new Set<string>();
    results.forEach(f => {
      if (f.powiat) powiats.add(f.powiat);
    });
    return ["Wszystkie", ...Array.from(powiats).sort()];
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

  // ===== FILTERING LOGIC =====
  useEffect(() => {
    let filtered = results;

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(f =>
        f.typ_placowki.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // City search
    if (cityInput) {
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

    // Powiat filter
    if (selectedPowiat !== "Wszystkie") {
      filtered = filtered.filter(f =>
        f.powiat === selectedPowiat
      );
    }

    // Profile filter
    if (selectedProfile !== "Wszystkie") {
      filtered = filtered.filter(f =>
        f.profil_opieki?.toLowerCase().includes(selectedProfile.toLowerCase())
      );
    }

    // Price filter
    filtered = filtered.filter(f =>
      (f.koszt_pobytu || 0) <= priceLimit
    );

    // Quick filters
    if (quickFilterNFZ) {
      filtered = filtered.filter(f =>
        f.koszt_pobytu === 0 || f.koszt_pobytu === null
      );
    }

    if (quickFilterBest) {
      // Assuming you have rating field - adjust as needed
      // filtered = filtered.filter(f => f.rating >= 4.7);
    }

    setFacilities(filtered);
  }, [
    results, selectedType, cityInput, selectedVoivodeship, selectedPowiat,
    selectedProfile, priceLimit, quickFilterNFZ, quickFilterBest
  ]);

  // ===== HANDLERS =====
  const resetFilters = () => {
    setCityInput(query);
    setSelectedType(type);
    setSelectedVoivodeship("Wszystkie");
    setSelectedPowiat("Wszystkie");
    setSelectedProfile("Wszystkie");
    setPriceLimit(10000);
    setQuickFilterNFZ(false);
    setQuickFilterBest(false);
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
    <div className="flex flex-col bg-gray-50 min-h-screen">

      {/* Header */}
      <SearchHeader
        cityInput={cityInput}
        onCityChange={setCityInput}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        activeFiltersCount={activeChips.length}
        onBack={() => window.history.back()}
        isFavoritesView={false}
      />

      {/* Active Filters */}
      <ActiveFilters
        chips={activeChips}
        quickFilterNFZ={quickFilterNFZ}
        quickFilterBest={quickFilterBest}
        onToggleNFZ={() => setQuickFilterNFZ(!quickFilterNFZ)}
        onToggleBest={() => setQuickFilterBest(!quickFilterBest)}
        isFavoritesView={false}
      />

      {/* Filter Panel */}
      <FilterPanel
        show={showFilters}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedVoivodeship={selectedVoivodeship}
        onVoivodeshipChange={setSelectedVoivodeship}
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
      <div className="flex flex-1 h-[calc(100vh-240px)] overflow-hidden">

        {/* Results List */}
        <div className={`
          flex-1 md:w-1/2
          overflow-y-auto p-3 sm:p-4 md:p-8
          ${showMapMobile ? 'hidden md:block' : 'block'}
        `}>
          <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">

            {/* Results count */}
            {!isLoading && facilities.length > 0 && (
              <div className="text-sm text-gray-600 mb-4">
                Znaleziono <span className="font-semibold">{facilities.length}</span> {facilities.length === 1 ? 'placówkę' : 'placówek'}
              </div>
            )}

            {isLoading ? (
              // Loading
              [1, 2, 3, 4].map(i => <SkeletonCard key={i} />)
            ) : facilities.length === 0 ? (
              // Empty State
              <EmptyState onResetFilters={resetFilters} />
            ) : (
              // Facility Cards
              facilities.map(fac => (
                <FacilityCard
                  key={fac.id}
                  facility={{
                    id: fac.id,
                    name: fac.nazwa,
                    type: fac.typ_placowki as 'DPS' | 'ŚDS',
                    city: fac.miejscowosc || '',
                    powiat: fac.powiat || '',
                    category: fac.profil_opieki || 'Różne profile',
                    price: fac.koszt_pobytu || 0,
                    rating: 4.5, // Default - adjust if you have rating
                    image: '/images/placeholder-facility.jpg', // Add your image logic
                    waitTime: 'Brak danych'
                  }}
                  isHovered={hoveredId === fac.id}
                  isSaved={false} // Add your saved logic
                  isCompared={selectedForCompare.includes(fac.id)}
                  onHover={setHoveredId}
                  onClick={() => handleFacilityClick(fac.id)}
                  onToggleSave={(e) => {
                    e.stopPropagation();
                    // Add your save logic
                  }}
                  onToggleCompare={(e) => toggleCompare(fac.id, e)}
                />
              ))
            )}
          </div>
        </div>

        {/* Map */}
        <div className={`
          flex-1 md:w-1/2
          bg-gray-100 overflow-hidden
          ${showMapMobile ? 'block fixed inset-0 z-40 top-[120px]' : 'hidden md:block md:sticky md:top-0 md:h-[calc(100vh-80px)]'}
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
          window.location.href = `/porownaj?ids=${ids}`;
        }}
        onClear={() => setSelectedForCompare([])}
      />

      {/* Mobile Map Toggle */}
      {!selectedForCompare.length && (
        <MobileMapToggle
          showMap={showMapMobile}
          onToggle={setShowMapMobile}
        />
      )}
    </div>
  );
}