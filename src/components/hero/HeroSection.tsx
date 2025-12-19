"use client";
import { useState, useEffect, useRef } from "react";
import RegionModal from "./RegionModal";
import TypeTooltip from "./TypeTooltip";

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

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("WSZYSTKIE");

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

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.append("q", searchQuery);
    }
    if (selectedType !== "WSZYSTKIE") {
      params.append("type", selectedType.toLowerCase());
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
          {/* Badge - v2 style */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary-100 shadow-sm mb-6 md:mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary-500"></span>
            <span className="text-xs font-semibold uppercase tracking-wide text-primary-600">
              Publiczny System Pomocy Społecznej
            </span>
          </div>

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
          {/* Desktop version - v2 Style */}
          <div className="hidden md:block">
            <div className="bg-white p-3 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 flex flex-row gap-2 relative">
              {/* Input with Icon - v2 style */}
              <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg 
                    className={`transition-colors ${
                      selectedType === 'DPS' ? 'text-primary-500' : 
                      selectedType === 'ŚDS' ? 'text-secondary-500' : 
                      'text-slate-500'
                    } group-focus-within:text-slate-800`}
                    width="20" 
                    height="20" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                  </svg>
                </div>
                <label htmlFor="desktop-location" className="sr-only">Lokalizacja</label>
                <input
                  id="desktop-location"
                  ref={inputRefDesktop}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Powiat lub miasto (np. Warszawa)"
                  className={`w-full pl-11 pr-4 py-4 rounded-xl bg-stone-50 border border-transparent outline-none transition-all text-slate-800 font-medium focus:bg-white focus:ring-2 
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
              </div>

              {/* Geo Button - v2 style */}
              <button 
                onClick={handleGeolocation}
                disabled={isGeoLoading}
                className="bg-stone-100 hover:bg-stone-200 text-slate-600 hover:text-primary-600 p-4 rounded-xl transition-all border border-transparent hover:border-primary-200 flex items-center justify-center min-w-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Użyj mojej lokalizacji"
              >
                {isGeoLoading ? (
                  <svg width="20" height="20" className="animate-spin">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="50" strokeDashoffset="25"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>

              {/* Search Button - v2 style with dynamic colors */}
              <button 
                onClick={handleSearch}
                className={`text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 min-w-[140px]
                  ${selectedType === 'DPS' ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30' 
                  : selectedType === 'ŚDS' ? 'bg-secondary-600 hover:bg-secondary-700 shadow-secondary-500/30'
                  : 'bg-slate-800 hover:bg-slate-900 shadow-slate-500/30'}`}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Szukaj</span>
              </button>
            </div>

            {/* Type Buttons - Desktop - v2 Style with ring-4 and icons */}
            <div className="mt-4 md:mt-8 flex flex-wrap justify-center gap-2 md:gap-3">
              <button 
                onClick={() => setSelectedType('WSZYSTKIE')}
                className={`px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-sm font-bold transition-all transform active:scale-95 shadow-sm border flex items-center gap-2
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
                onClick={() => setSelectedType('DPS')}
                className={`px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-sm font-bold transition-all transform active:scale-95 shadow-sm border 
                  ${selectedType === 'DPS' 
                    ? 'bg-primary-600 border-primary-600 text-white ring-4 ring-primary-100' 
                    : 'bg-white border-stone-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'}`}
              >
                DPS (Całodobowe)
              </button>
              
              <button 
                onClick={() => setSelectedType('ŚDS')}
                className={`px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-sm font-bold transition-all transform active:scale-95 shadow-sm border 
                  ${selectedType === 'ŚDS' 
                    ? 'bg-secondary-600 border-secondary-600 text-white ring-4 ring-secondary-100' 
                    : 'bg-white border-stone-200 text-slate-600 hover:border-secondary-300 hover:text-secondary-600'}`}
              >
                ŚDS (Dzienne)
              </button>
            </div>

            {/* Helper text UNDER buttons - Desktop */}
            <div className="text-center mt-6 space-y-2">
              <p className="text-sm text-neutral-600 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Kliknij by znaleźć placówki w okolicy</span>
              </p>
              <button
                onClick={() => setShowRegionModal(true)}
                className="text-sm text-accent-600 hover:text-accent-700 font-medium inline-flex items-center gap-1 hover:underline"
              >
                Przeglądaj po województwie
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile version */}
          <div className="md:hidden bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
            {/* Miejscowość */}
            <div className="px-4 py-4 border-b border-neutral-200 relative">
              <input
                ref={inputRefMobile}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Wpisz miejscowość, np. Bochnia"
                className="w-full text-base focus:outline-none py-4 px-3"
                autoComplete="off"
              />

              {isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-accent-500 border-t-transparent rounded-full" />
                </div>
              )}

              <AutocompleteDropdown />
            </div>

            {/* Type Buttons - Mobile */}
            <div className="px-4 py-4 border-b border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs text-neutral-500">Typ placówki</label>
                <TypeTooltip />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedType("DPS")}
                  className={`py-3 rounded-lg text-xs font-medium transition-all ${
                    selectedType === "DPS"
                      ? "bg-accent-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-accent-50"
                  }`}
                >
                  DPS
                </button>
                <button
                  onClick={() => setSelectedType("ŚDS")}
                  className={`py-3 rounded-lg text-xs font-medium transition-all ${
                    selectedType === "ŚDS"
                      ? "bg-accent-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-accent-50"
                  }`}
                >
                  ŚDS
                </button>
                <button
                  onClick={() => setSelectedType("WSZYSTKIE")}
                  className={`py-3 rounded-lg text-xs font-medium transition-all ${
                    selectedType === "WSZYSTKIE"
                      ? "bg-accent-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-accent-50"
                  }`}
                >
                  WSZYSTKIE
                </button>
              </div>
            </div>

            {/* Geo Button */}
            <button
              onClick={handleGeolocation}
              disabled={isGeoLoading}
              className="w-full px-4 py-4 bg-green-200 hover:bg-green-300 transition-colors flex items-center justify-center gap-2 border-b border-neutral-200 text-green-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeoLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-green-900 border-t-transparent rounded-full" />
                  Pobieranie lokalizacji...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Szukaj w okolicy
                </>
              )}
            </button>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="w-full px-4 py-4 bg-accent-500 hover:bg-accent-600 transition-colors text-white font-semibold"
            >
              Szukaj
            </button>
          </div>

          {/* Helper text POD searchbarem - Mobile */}
          <div className="md:hidden text-center mt-4 space-y-2">
              <p className="text-xs text-neutral-600 flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Kliknij by znaleźć placówki w okolicy</span>
              </p>
              <button
                onClick={() => setShowRegionModal(true)}
                className="text-xs text-accent-600 hover:text-accent-700 font-medium inline-flex items-center gap-1 hover:underline"
              >
                Przeglądaj po województwie
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
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
