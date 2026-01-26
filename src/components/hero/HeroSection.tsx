"use client";
import { useState, useEffect, useRef } from "react";
import RegionModal from "./RegionModal";
import TypeTooltip from "./TypeTooltip";
import { CategorySelector } from '../CategorySelector';

// Type dla suggestion z API
interface Suggestion {
  nazwa: string;
  powiat: string;
  wojewodztwo: string;
  facilitiesCount: number;
}

interface SuggestResponse {
  suggestions: Suggestion[];
  totalCount: number;
  showAll: boolean;
}

// ✅ ADDED: Props interface for callback
interface HeroSectionProps {
  onTabChange?: (tab: 'DPS' | 'SDS' | 'Wszystkie') => void;
  selectedProfiles?: string[];
  activeTab?: 'DPS' | 'SDS' | 'Wszystkie';
}

export default function HeroSection({ onTabChange, selectedProfiles = [], activeTab = 'Wszystkie' }: HeroSectionProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("WSZYSTKIE");

  // ✅ ADDED: Handler to sync with parent component
  const handleTypeChange = (type: string) => {
    setSelectedType(type);

    // Notify parent component (page.tsx) about tab change
    if (onTabChange) {
      if (type === 'DPS') onTabChange('DPS');
      else if (type === 'ŚDS') onTabChange('SDS');
      else onTabChange('Wszystkie');
    }

    console.log('🔄 HeroSection: Tab changed to:', type, '→ mapped to:',
      type === 'DPS' ? 'DPS' : type === 'ŚDS' ? 'SDS' : 'Wszystkie');
  };

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  // Geolocation loading state
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  // Region modal state
  const [showRegionModal, setShowRegionModal] = useState(false);

  // NEW: Geo mode toggle
  const [geoMode, setGeoMode] = useState(false);
  const [radius, setRadius] = useState(20);

  // NEW: Budget slider
  const [budget, setBudget] = useState(6000);

  // Refs for click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRefDesktop = useRef<HTMLInputElement>(null);
  const inputRefMobile = useRef<HTMLInputElement>(null);

  // Helper function for Polish pluralization
  const getPluralForm = (count: number): string => {
    if (count === 1) return "placówka";
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "placówek";
    if (lastDigit >= 2 && lastDigit <= 4) return "placówki";
    return "placówek";
  };

  // Debounced fetch autocomplete suggestions
  useEffect(() => {
    console.log("⚡ useEffect triggered:", {
      searchQuery,
      length: searchQuery.length,
    });

    if (searchQuery.length < 2) {
      console.log("⏸️ Query too short, resetting");
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      console.log("🔍 Fetching suggestions for:", searchQuery);
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          q: searchQuery,
        });

        if (selectedType !== "WSZYSTKIE") {
          params.append("typ", selectedType);
        }

        const apiUrl = `/api/teryt/suggest?${params}`;
        console.log("🌐 API URL:", apiUrl);

        const response = await fetch(apiUrl);
        const data: SuggestResponse = await response.json();

        console.log("✅ API Response:", data);
        setSuggestions(data.suggestions || []);
        setTotalCount(data.totalCount || 0);
        setShowDropdown((data.suggestions?.length || 0) > 0);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error("❌ Autocomplete error:", error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedType]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRefDesktop.current?.contains(event.target as Node) &&
        !inputRefMobile.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ FIX: Handle suggestion click - pass powiat to search
  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchQuery(suggestion.nazwa);
    setShowDropdown(false);

    const params = new URLSearchParams();
    params.append("q", suggestion.nazwa);
    
    // ✅ CRITICAL FIX: Pass powiat from suggestion to search page
    // This ensures "Kraków" (m. Kraków) doesn't show results from "krakowski" powiat
    params.append("powiat", suggestion.powiat);
    
    if (selectedType !== "WSZYSTKIE") {
      params.append("type", selectedType.toLowerCase());
    }
    
    // ✅ ADDED: Include selected care profiles
    if (selectedProfiles && selectedProfiles.length > 0) {
      params.append("care", selectedProfiles.join(','));
    }

    console.log('🔗 Navigating with params:', params.toString());
    window.location.href = `/search?${params.toString()}`;
  };

  // Handle "Show All" click
  const handleShowAllClick = () => {
    setShowDropdown(false);

    const params = new URLSearchParams();
    params.append("q", searchQuery);
    params.append("partial", "true");

    if (selectedType !== "WSZYSTKIE") {
      params.append("type", selectedType.toLowerCase());
    }

    window.location.href = `/search?${params.toString()}`;
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
    }
  };

  // NEW: Main search button handler (combines text/geo search + budget)
  const handleMainSearch = () => {
    if (geoMode) {
      // Geo mode: trigger geolocation with radius
      if (!navigator.geolocation) {
        alert("Twoja przeglądarka nie obsługuje geolokalizacji");
        return;
      }

      setIsGeoLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          const params = new URLSearchParams({
            lat: latitude.toString(),
            lng: longitude.toString(),
            radius: radius.toString(),
            near: 'true'
          });

          if (selectedType !== "WSZYSTKIE") {
            params.append("type", selectedType.toLowerCase());
          }

          if (selectedProfiles && selectedProfiles.length > 0) {
            params.append("care", selectedProfiles.join(','));
          }

          if (selectedType === 'DPS' && budget) {
            params.append("maxPrice", budget.toString());
          }

          window.location.href = `/search?${params.toString()}`;
        },
        (error) => {
          setIsGeoLoading(false);
          let message = "Nie udało się pobrać lokalizacji.";
          if (error.code === error.PERMISSION_DENIED) {
            message = "Dostęp do lokalizacji został zablokowany.";
          }
          alert(message);
        },
        {
          timeout: 10000,
          maximumAge: 60000,
          enableHighAccuracy: false,
        }
      );
    } else {
      // Text mode: use existing handleSearch logic
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append("q", searchQuery);
      }
      if (selectedType !== "WSZYSTKIE") {
        params.append("type", selectedType.toLowerCase());
      }
      if (selectedProfiles && selectedProfiles.length > 0) {
        params.append("care", selectedProfiles.join(','));
      }
      if (selectedType === 'DPS' && budget) {
        params.append("maxPrice", budget.toString());
      }

      window.location.href = `/search?${params.toString()}`;
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.append("q", searchQuery);
    }
    if (selectedType !== "WSZYSTKIE") {
      params.append("type", selectedType.toLowerCase());
    }

    // ✅ ADDED: Include selected care profiles from CategorySelector
    if (selectedProfiles && selectedProfiles.length > 0) {
      params.append("care", selectedProfiles.join(','));
      console.log('🔗 Main search with profiles:', selectedProfiles);
    }

    window.location.href = `/search?${params.toString()}`;
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Twoja przeglądarka nie obsługuje geolokalizacji");
      return;
    }

    setIsGeoLoading(true);
    console.log("📍 Requesting geolocation...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("✅ Geolocation success:", { latitude, longitude });
        window.location.href = `/search?lat=${latitude}&lng=${longitude}&near=true`;
      },
      (error) => {
        setIsGeoLoading(false);
        console.error("❌ Geolocation error:", error);

        let message = "Nie udało się pobrać lokalizacji.";

        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Dostęp do lokalizacji został zablokowany.\n\nWłącz w ustawieniach przeglądarki.";
        } else if (error.code === error.TIMEOUT) {
          message =
            "Przekroczono czas oczekiwania.\n\nSpróbuj ponownie lub wpisz miasto ręcznie w polu wyszukiwania.";
        } else {
          message =
            "Nie można określić lokalizacji.\n\nUpewnij się że masz włączone usługi lokalizacji i spróbuj ponownie.";
        }

        alert(message);
      },
      {
        timeout: 10000,
        maximumAge: 60000,
        enableHighAccuracy: false,
      }
    );
  };

  // Autocomplete Dropdown Component
  const AutocompleteDropdown = () => {
    if (!showDropdown || suggestions.length === 0) return null;

    return (
      <div
        ref={dropdownRef}
        className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-2xl border border-neutral-300 max-h-96 overflow-y-auto"
        style={{
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
          width:
            typeof window !== "undefined" && window.innerWidth < 768
              ? "100%"
              : "500px",
          minWidth: "280px",
          zIndex: 1000,
        }}
      >
        <div className="p-5 border-b border-neutral-200 bg-neutral-50">
          <p className="text-sm text-neutral-600">
            {suggestions.length < totalCount ? (
              <>
                Pokazano <strong>{suggestions.length}</strong> z{" "}
                <strong>{totalCount}</strong>{" "}
                {getPluralForm(totalCount)}
              </>
            ) : (
              <>
                Znaleziono <strong>{totalCount}</strong>{" "}
                {getPluralForm(totalCount)}
              </>
            )}
          </p>
        </div>

        <ul className="divide-y divide-neutral-100">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.nazwa}-${suggestion.powiat}-${index}`}
              onMouseDown={() => handleSuggestionClick(suggestion)}
              className={`px-6 py-5 hover:bg-accent-50 cursor-pointer transition-colors ${
                highlightedIndex === index ? "bg-accent-50" : ""
              }`}
            >
              <div className="flex justify-between items-start gap-5">
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">
                    {suggestion.nazwa}
                  </p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {suggestion.powiat}, woj. {suggestion.wojewodztwo}
                  </p>
                </div>
                <div className="px-2.5 py-1 bg-accent-100 text-accent-700 rounded-md text-xs font-semibold whitespace-nowrap">
                  {suggestion.facilitiesCount}{" "}
                  {getPluralForm(suggestion.facilitiesCount)}
                </div>
              </div>
            </li>
          ))}

          {suggestions.length < totalCount && (
            <li
              onMouseDown={handleShowAllClick}
              className="px-6 py-5 bg-neutral-50 hover:bg-accent-50 cursor-pointer border-t-2 border-neutral-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-accent-600">
                  Pokaż wszystkie ({totalCount} {getPluralForm(totalCount)})
                </p>
                <svg
                  className="w-5 h-5 text-accent-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <section className="bg-gradient-to-b from-primary-50/50 via-white to-stone-50 pt-10 pb-8 md:pt-16 md:pb-12 relative overflow-hidden">
      {/* Abstract shapes decorations */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-secondary-500/10 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Hero Header */}
        <div className="text-center max-w-5xl mx-auto mb-6 sm:mb-10">
          <h1 className="text-3xl md:text-6xl font-serif font-bold text-slate-900 mb-4 md:mb-6 leading-tight">
            Znajdź publiczną opiekę <br/>
            <span className="text-primary-600 relative inline-block">
              dostosowaną do potrzeb
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
          </h1>

          <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Porównaj, oblicz koszty i dowiedz się więcej
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-5xl mx-auto">
          {/* Desktop version - NEW LAYOUT */}
          <div className="hidden md:block">
            {/* STEP 1: Type Selection - MOVED TO TOP */}
            <div className="mb-6">
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => handleTypeChange('WSZYSTKIE')}
                  className={`px-6 py-3 rounded-xl text-sm font-bold transition-all transform active:scale-95 shadow-sm border flex items-center gap-2
                    ${selectedType === 'WSZYSTKIE'
                      ? 'bg-slate-800 border-slate-800 text-white ring-4 ring-slate-200'
                      : 'bg-white border-stone-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'}`}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Wszystkie placówki
                </button>

                <button
                  onClick={() => handleTypeChange('DPS')}
                  className={`px-6 py-3 rounded-xl text-sm font-bold transition-all transform active:scale-95 shadow-sm border
                    ${selectedType === 'DPS'
                      ? 'bg-primary-600 border-primary-600 text-white ring-4 ring-primary-100'
                      : 'bg-white border-stone-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'}`}
                >
                  DPS (Całodobowe)
                </button>

                <button
                  onClick={() => handleTypeChange('ŚDS')}
                  className={`px-6 py-3 rounded-xl text-sm font-bold transition-all transform active:scale-95 shadow-sm border
                    ${selectedType === 'ŚDS'
                      ? 'bg-secondary-600 border-secondary-600 text-white ring-4 ring-secondary-100'
                      : 'bg-white border-stone-200 text-slate-600 hover:border-secondary-300 hover:text-secondary-600'}`}
                >
                  ŚDS (Dzienne)
                </button>
              </div>
            </div>

            {/* STEP 2: Location Input/Display with Geo Toggle */}
            <div className="bg-white p-3 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 mb-4">
              <div className="flex gap-2">
                <div className="flex-1 relative group">
                  {!geoMode ? (
                    <>
                      <label htmlFor="desktop-location" className="sr-only">Lokalizacja</label>
                      <input
                        id="desktop-location"
                        ref={inputRefDesktop}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Wpisz miejscowość (np. Olkusz)"
                        className={`w-full pl-4 pr-4 py-4 rounded-xl bg-stone-50 border border-transparent outline-none transition-all text-slate-800 font-medium focus:bg-white focus:ring-2
                          ${selectedType === 'DPS' ? 'focus:ring-primary-100 focus:border-primary-300'
                            : selectedType === 'ŚDS' ? 'focus:ring-secondary-100 focus:border-secondary-300'
                            : 'focus:ring-slate-200 focus:border-slate-300'}`}
                        autoComplete="off"
                      />
                      {isLoading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="animate-spin h-5 w-5 border-2 border-accent-500 border-t-transparent rounded-full" />
                        </div>
                      )}
                      <AutocompleteDropdown />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full px-4 py-4 rounded-xl bg-stone-50">
                      <span className="text-slate-700 font-medium">
                        📍 Szukaj w promieniu: <strong>{radius} km</strong>
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setGeoMode(!geoMode)}
                  className={`px-6 py-4 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 whitespace-nowrap
                    ${geoMode
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-stone-100 text-slate-700 hover:bg-stone-200'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {geoMode ? 'Wpisz miasto' : 'Szukaj blisko mnie'}
                </button>
              </div>
            </div>

            {geoMode && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-4">
                <label className="block text-sm font-medium text-primary-900 mb-3">
                  Szukaj w promieniu:
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-primary-700 mt-2">
                  <span>5 km</span>
                  <span className="font-bold text-base">{radius} km</span>
                  <span>100 km</span>
                </div>
              </div>
            )}

            {selectedType === 'DPS' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <label className="block text-sm font-medium text-blue-900 mb-3">
                  Twój maksymalny budżet miesięczny:
                </label>
                <input
                  type="range"
                  min="1500"
                  max="10000"
                  step="100"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-blue-700 mt-2">
                  <span>1 500 zł</span>
                  <span className="font-bold text-base">Do {budget.toLocaleString('pl-PL')} zł</span>
                  <span>10 000 zł</span>
                </div>
              </div>
            )}

            {selectedType === 'ŚDS' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-green-900">
                  ✨ ŚDS są <strong>całkowicie bezpłatne</strong> (dzienna opieka finansowana przez gminę)
                </p>
              </div>
            )}

            <div className="mt-8">
              <CategorySelector
                activeTab={
                  selectedType === 'DPS' ? 'DPS' :
                  selectedType === 'ŚDS' ? 'SDS' :
                  'Wszystkie'
                }
                onSearch={() => {}}
                onProfilesChange={(profiles) => {
                  console.log('🎯 Hero received profiles:', profiles);
                }}
                location={searchQuery}
              />
            </div>

            <div className="mt-6">
              <button
                onClick={handleMainSearch}
                disabled={isGeoLoading}
                className={`w-full py-5 rounded-2xl text-white font-bold text-lg shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed
                  ${selectedType === 'DPS' ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30'
                  : selectedType === 'ŚDS' ? 'bg-secondary-600 hover:bg-secondary-700 shadow-secondary-500/30'
                  : 'bg-slate-800 hover:bg-slate-900 shadow-slate-500/30'}`}
              >
                {isGeoLoading ? (
                  <>
                    <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Pobieranie lokalizacji...</span>
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>SZUKAJ PLACÓWEK</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile version - v2 Style */}
          <div className="md:hidden">
            {/* Type buttons FIRST - Mobile */}
            <div className="mb-4">
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => handleTypeChange('WSZYSTKIE')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all transform active:scale-95 shadow-sm border flex items-center gap-2
                    ${selectedType === 'WSZYSTKIE'
                      ? 'bg-slate-800 border-slate-800 text-white ring-4 ring-slate-200'
                      : 'bg-white border-stone-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'}`}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Wszystkie
                </button>

                <button
                  onClick={() => handleTypeChange('DPS')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all transform active:scale-95 shadow-sm border
                    ${selectedType === 'DPS'
                      ? 'bg-primary-600 border-primary-600 text-white ring-4 ring-primary-100'
                      : 'bg-white border-stone-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'}`}
                >
                  DPS
                </button>

                <button
                  onClick={() => handleTypeChange('ŚDS')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all transform active:scale-95 shadow-sm border
                    ${selectedType === 'ŚDS'
                      ? 'bg-secondary-600 border-secondary-600 text-white ring-4 ring-secondary-100'
                      : 'bg-white border-stone-200 text-slate-600 hover:border-secondary-300 hover:text-secondary-600'}`}
                >
                  ŚDS
                </button>
              </div>
            </div>

            {/* Location input OR geo display with toggle - Mobile */}
            <div className="bg-white p-2.5 rounded-xl shadow-lg shadow-stone-200/50 border border-stone-100 mb-3">
              <div className="flex gap-2">
                <div className="flex-1 relative group">
                  {!geoMode ? (
                    <>
                      <label htmlFor="mobile-location" className="sr-only">Wpisz miasto</label>
                      <input
                        id="mobile-location"
                        ref={inputRefMobile}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Wpisz miejscowość..."
                        className={`w-full pl-3 pr-10 py-3 rounded-lg border border-stone-200 bg-white shadow-sm outline-none focus:ring-2
                          ${selectedType === 'DPS' ? 'focus:ring-primary-500'
                          : selectedType === 'ŚDS' ? 'focus:ring-secondary-500'
                          : 'focus:ring-slate-500'}`}
                        autoComplete="off"
                      />

                      {isLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-accent-500 border-t-transparent rounded-full" />
                        </div>
                      )}

                      <AutocompleteDropdown />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full px-3 py-3 rounded-lg bg-stone-50 border border-stone-200">
                      <span className="text-sm text-stone-700">
                        📍 Szukaj w promieniu: <strong>{radius} km</strong>
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setGeoMode(!geoMode)}
                  className={`px-3 py-3 rounded-lg font-medium text-sm transition-all active:scale-95 whitespace-nowrap flex items-center gap-1.5 shadow-sm
                    ${geoMode
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-stone-200 text-slate-700 hover:border-primary-300 hover:text-primary-600'
                    }`}
                >
                  {geoMode ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span className="text-xs">Wpisz</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs">Blisko</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Radius slider - conditional on geoMode - Mobile */}
            {geoMode && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-primary-900">Zasięg wyszukiwania</label>
                  <span className="text-sm font-bold text-primary-700">{radius} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full h-2 bg-primary-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-[10px] text-primary-600 mt-1">
                  <span>5 km</span>
                  <span>100 km</span>
                </div>
              </div>
            )}

            {/* Budget slider - conditional on DPS type - Mobile */}
            {selectedType === 'DPS' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-blue-900">Maksymalny koszt pobytu</label>
                  <span className="text-sm font-bold text-blue-700">{budget} zł/mies.</span>
                </div>
                <input
                  type="range"
                  min="1500"
                  max="10000"
                  step="100"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-blue-600 mt-1">
                  <span>1 500 zł</span>
                  <span>10 000 zł</span>
                </div>
              </div>
            )}

            {/* ŚDS info badge - conditional on ŚDS type - Mobile */}
            {selectedType === 'ŚDS' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 text-center">
                <p className="text-xs text-green-800">
                  ✨ Środowiskowe Domy Samopomocy są <strong>całkowicie bezpłatne</strong> (finansowane z NFZ)
                </p>
              </div>
            )}

            {/* CategorySelector - Mobile */}
            <div className="mt-6">
              <CategorySelector
                activeTab={
                  selectedType === 'DPS' ? 'DPS' :
                  selectedType === 'ŚDS' ? 'SDS' :
                  'Wszystkie'
                }
                onSearch={() => {}}
                onProfilesChange={(profiles) => {
                  console.log('🎯 Hero (mobile) received profiles:', profiles);
                }}
                location={searchQuery}
              />
            </div>

            {/* Main Search Button - Mobile */}
            <div className="mt-5">
              <button
                onClick={handleMainSearch}
                disabled={isGeoLoading}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base
                  ${selectedType === 'DPS'
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : selectedType === 'ŚDS'
                    ? 'bg-secondary-600 hover:bg-secondary-700'
                    : 'bg-slate-800 hover:bg-slate-900'
                  }`}
              >
                {isGeoLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg width="20" height="20" className="animate-spin">
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="50" strokeDashoffset="25"/>
                    </svg>
                    Szukam lokalizacji...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    SZUKAJ PLACÓWEK
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Region Modal */}
      <RegionModal
        isOpen={showRegionModal}
        onClose={() => setShowRegionModal(false)}
      />
    </section>
  );
}