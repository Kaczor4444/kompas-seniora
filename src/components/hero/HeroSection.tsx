"use client";
import { useState, useEffect, useRef } from "react";

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
  const [selectedVoivodeship, setSelectedVoivodeship] = useState(""); // ZMIENIONE: pusty string
  const [selectedPowiat, setSelectedPowiat] = useState("");

  // NEW: Autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  // 🆕 NEW: Geolocation loading state
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  // Refs for click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRefDesktop = useRef<HTMLInputElement>(null);
  const inputRefMobile = useRef<HTMLInputElement>(null);

  // Mapa powiatów dla każdego województwa
  const powiatyByVoivodeship: Record<string, string[]> = {
    malopolskie: [
      "bocheński",
      "chrzanowski",
      "dąbrowski",
      "gorlicki",
      "krakowski",
      "limanowski",
      "miechowski",
      "myślenicki",
      "nowosądecki",
      "nowotarski",
      "olkuski",
      "oświęcimski",
      "proszowicki",
      "suski",
      "tarnowski",
      "tatrzański",
      "wadowicki",
      "wielicki",
      "Kraków",
      "Nowy Sącz",
      "Tarnów",
    ],
    slaskie: [
      "będziński",
      "bielski",
      "bieruńsko-lędziński",
      "cieszyński",
      "częstochowski",
      "gliwicki",
      "kłobucki",
      "lubliniecki",
      "mikołowski",
      "myszkowski",
      "pszczyński",
      "raciborski",
      "rybnicki",
      "tarnogórski",
      "wodzisławski",
      "zawierciański",
      "żywiecki",
      "Bielsko-Biała",
      "Bytom",
      "Chorzów",
      "Katowice",
      "Sosnowiec",
      "Tychy",
    ],
  };

  // Dostępne powiaty dla wybranego województwa
  const availablePowiaty = powiatyByVoivodeship[selectedVoivodeship] || [];

  // Helper function for Polish pluralization
  const getPluralForm = (count: number): string => {
    if (count === 1) return "placówka";
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "placówek";
    if (lastDigit >= 2 && lastDigit <= 4) return "placówki";
    return "placówek";
  };

  // NEW: Debounced fetch autocomplete suggestions
  useEffect(() => {
    console.log("⚡ useEffect triggered:", {
      searchQuery,
      length: searchQuery.length,
    });

    // Reset suggestions if query too short
    if (searchQuery.length < 2) {
      console.log("⏸️ Query too short, resetting");
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Debounce: 300ms
    const timer = setTimeout(async () => {
      console.log("🔍 Fetching suggestions for:", searchQuery);
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          q: searchQuery,
        });

        if (selectedVoivodeship) {
          params.append("woj", selectedVoivodeship);
        }
        if (selectedPowiat) {
          params.append("powiat", selectedPowiat);
        }
        if (selectedType !== "WSZYSTKIE") {
          params.append("typ", selectedType);
        }

        const apiUrl = `/api/teryt/suggest?${params}`;
        console.log("🌐 API URL:", apiUrl);

        const response = await fetch(apiUrl);
        const data: SuggestResponse = await response.json();

        console.log("✅ API Response:", data);
        console.log("📊 Suggestions count:", data.suggestions?.length || 0);
        console.log(
          "🎯 showDropdown will be:",
          (data.suggestions?.length || 0) > 0
        );

        setSuggestions(data.suggestions || []);
        setTotalCount(data.totalCount || 0);
        setShowDropdown((data.suggestions?.length || 0) > 0);
        setHighlightedIndex(-1);

        console.log("✨ State updated - dropdown should show");
      } catch (error) {
        console.error("❌ Autocomplete error:", error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      console.log("🧹 Cleanup timer");
      clearTimeout(timer);
    };
  }, [searchQuery, selectedVoivodeship, selectedPowiat, selectedType]);

  // NEW: Click outside to close dropdown
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

  // NEW: Handle suggestion click
  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSearchQuery(suggestion.nazwa);
    setShowDropdown(false);

    // Auto-search
    const params = new URLSearchParams();
    params.append("q", suggestion.nazwa);
    if (selectedType !== "WSZYSTKIE") {
      params.append("type", selectedType.toLowerCase());
    }
    if (selectedVoivodeship && selectedVoivodeship !== "malopolskie") {
      params.append("woj", selectedVoivodeship);
    }
    if (selectedPowiat) {
      params.append("powiat", selectedPowiat);
    }

    window.location.href = `/search?${params.toString()}`;
  };

  // NEW: Handle "Show All" click
  const handleShowAllClick = () => {
    setShowDropdown(false);

    const params = new URLSearchParams();
    params.append("q", searchQuery);
    params.append("partial", "true"); // NOWE - oznacz jako partial search

    if (selectedType !== "WSZYSTKIE") {
      params.append("type", selectedType.toLowerCase());
    }
    if (selectedVoivodeship && selectedVoivodeship !== "malopolskie") {
      params.append("woj", selectedVoivodeship);
    }
    if (selectedPowiat) {
      params.append("powiat", selectedPowiat);
    }

    window.location.href = `/search?${params.toString()}`;
  };

  // NEW: Keyboard navigation
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
    if (selectedVoivodeship && selectedVoivodeship !== "malopolskie") {
      params.append("woj", selectedVoivodeship);
    }
    if (selectedPowiat) {
      params.append("powiat", selectedPowiat);
    }

    window.location.href = `/search?${params.toString()}`;
  };

  // 🆕 IMPROVED: Geolocation with loading state
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Twoja przeglądarka nie obsługuje geolokalizacji");
      return;
    }

    // Start loading
    setIsGeoLoading(true);
    console.log("📍 Requesting geolocation...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("✅ Geolocation success:", { latitude, longitude });
        // Loading will stop when page redirects
        window.location.href = `/search?lat=${latitude}&lng=${longitude}&near=true`;
      },
      (error) => {
        // Stop loading on error
        setIsGeoLoading(false);
        console.error("❌ Geolocation error:", error);

        let message = "Nie udało się pobrać lokalizacji.";

        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Dostęp do lokalizacji został zablokowany.\n\nWłącz w ustawieniach przeglądarki.";
        } else if (error.code === error.TIMEOUT) {
          message =
            "Przekroczono czas oczekiwania.\n\nSpróbuj ponownie lub wpisz miasto ręcznie w polu wyszukiwania.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
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

  // NEW: Autocomplete Dropdown Component
  const AutocompleteDropdown = () => {
    console.log("🎨 Rendering dropdown:", {
      showDropdown,
      suggestionsLength: suggestions.length,
    });

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
        <div className="p-3 border-b border-neutral-200 bg-neutral-50">
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
              className={`px-4 py-3 hover:bg-accent-50 cursor-pointer transition-colors ${
                highlightedIndex === index ? "bg-accent-50" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-neutral-900">
                    {suggestion.nazwa}
                  </p>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {suggestion.powiat}, woj. {suggestion.wojewodztwo}
                  </p>
                </div>
                <div className="ml-3 px-2 py-1 bg-accent-100 text-accent-700 rounded-md text-xs font-semibold whitespace-nowrap">
                  {suggestion.facilitiesCount}{" "}
                  {getPluralForm(suggestion.facilitiesCount)}
                </div>
              </div>
            </li>
          ))}

          {suggestions.length < totalCount && (
            <li
              onMouseDown={handleShowAllClick}
              className="px-4 py-3 bg-neutral-50 hover:bg-accent-50 cursor-pointer border-t-2 border-neutral-200 transition-colors"
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
    <section className="bg-gradient-to-br from-white via-neutral-50 to-amber-100/80 py-8 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Hero Header */}
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
            Znajdź Dom Pomocy w Twojej okolicy
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Transparentna wyszukiwarka publicznych domów pomocy społecznej z
            oficjalnymi cenami
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-5xl mx-auto">
          {/* Desktop version - IMPORTANT: overflow visible for dropdown */}
          <div className="hidden md:flex bg-white rounded-xl shadow-lg border border-neutral-200 relative">
            {/* Segment 1: Miejscowość - WITH AUTOCOMPLETE */}
            <div
              className="flex-1 px-4 py-4 border-r border-neutral-200 relative"
              style={{ zIndex: 10 }}
            >
              <label className="block text-xs text-neutral-500 mb-1">
                Miejscowość{" "}
                <span
                  className="text-neutral-400"
                  title="Wpisz co najmniej 2 znaki aby zobaczyć sugestie"
                >
                  ⓘ
                </span>
              </label>
              <input
                ref={inputRefDesktop}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  console.log("📝 Input changed:", e.target.value);
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="np. Bochnia, Kraków, Nowy Sącz..."
                className="w-full text-base focus:outline-none"
                autoComplete="off"
              />

              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-accent-500 border-t-transparent rounded-full" />
                </div>
              )}

              {/* Autocomplete Dropdown */}
              <AutocompleteDropdown />
            </div>

            {/* Segment 2: Województwo */}
            <div className="flex-1 px-4 py-4 border-r border-neutral-200">
              <label className="block text-xs text-neutral-500 mb-1">
                Województwo
              </label>
              <select
                value={selectedVoivodeship}
                onChange={(e) => {
                  setSelectedVoivodeship(e.target.value);
                  setSelectedPowiat(""); // Reset powiatu gdy zmienia się województwo
                }}
                className="w-full text-base focus:outline-none bg-transparent cursor-pointer"
              >
                <option value="">Wybierz województwo</option>
                <option value="malopolskie">Małopolskie</option>
                <option value="slaskie">Śląskie (Beta)</option>
                <option value="" disabled>
                  Mazowieckie - Wkrótce
                </option>
                <option value="" disabled>
                  Dolnośląskie - Wkrótce
                </option>
                <option value="" disabled>
                  Wielkopolskie - Wkrótce
                </option>
              </select>
            </div>

            {/* Segment 3: Powiat */}
            <div className="flex-1 px-4 py-4 border-r border-neutral-200">
              <label className="block text-xs text-neutral-500 mb-1">
                Powiat
              </label>
              <select
                value={selectedPowiat}
                onChange={(e) => setSelectedPowiat(e.target.value)}
                className="w-full text-base focus:outline-none bg-transparent cursor-pointer"
                disabled={!selectedVoivodeship}
              >
                <option value="">Wszystkie powiaty</option>
                {availablePowiaty.map((powiat) => (
                  <option key={powiat} value={powiat}>
                    {powiat}
                  </option>
                ))}
              </select>
            </div>

            {/* Segment 4: Geo Button - 🆕 WITH LOADING SPINNER */}
            <button
              onClick={handleGeolocation}
              disabled={isGeoLoading}
              className="px-6 bg-green-200 hover:bg-green-300 transition-colors flex items-center justify-center border-r border-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title={isGeoLoading ? "Pobieranie lokalizacji..." : "Szukaj w okolicy"}
            >
              {isGeoLoading ? (
                <div className="animate-spin h-6 w-6 border-2 border-green-900 border-t-transparent rounded-full" />
              ) : (
                <svg
                  className="w-6 h-6 text-green-900"
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
              )}
            </button>

            {/* Segment 5: Search Button */}
            <button
              onClick={handleSearch}
              className="px-8 bg-accent-500 hover:bg-accent-600 transition-colors flex items-center justify-center rounded-r-xl"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>

          {/* Mobile version */}
          <div className="md:hidden bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
            {/* Miejscowość - WITH AUTOCOMPLETE */}
            <div className="px-4 py-4 border-b border-neutral-200 relative">
              <label className="block text-xs text-neutral-500 mb-2">
                Miejscowość{" "}
                <span
                  className="text-neutral-400"
                  title="Wpisz co najmniej 2 znaki"
                >
                  ⓘ
                </span>
              </label>
              <input
                ref={inputRefMobile}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  console.log("📝 Mobile input changed:", e.target.value);
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="np. Bochnia, Kraków, Nowy Sącz..."
                className="w-full text-base focus:outline-none"
                autoComplete="off"
              />

              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-accent-500 border-t-transparent rounded-full" />
                </div>
              )}

              {/* Autocomplete Dropdown */}
              <AutocompleteDropdown />
            </div>

            {/* Województwo */}
            <div className="px-4 py-4 border-b border-neutral-200">
              <label className="block text-xs text-neutral-500 mb-2">
                Województwo
              </label>
              <select
                value={selectedVoivodeship}
                onChange={(e) => {
                  setSelectedVoivodeship(e.target.value);
                  setSelectedPowiat("");
                }}
                className="w-full text-base focus:outline-none bg-transparent"
              >
                <option value="">Wybierz województwo</option>
                <option value="malopolskie">Małopolskie</option>
                <option value="slaskie">Śląskie (Beta)</option>
                <option value="" disabled>
                  Mazowieckie - Wkrótce
                </option>
                <option value="" disabled>
                  Dolnośląskie - Wkrótce
                </option>
                <option value="" disabled>
                  Wielkopolskie - Wkrótce
                </option>
              </select>
            </div>

            {/* Powiat */}
            <div className="px-4 py-4 border-b border-neutral-200">
              <label className="block text-xs text-neutral-500 mb-2">
                Powiat
              </label>
              <select
                value={selectedPowiat}
                onChange={(e) => setSelectedPowiat(e.target.value)}
                className="w-full text-base focus:outline-none bg-transparent"
                disabled={!selectedVoivodeship}
              >
                <option value="">Wszystkie powiaty</option>
                {availablePowiaty.map((powiat) => (
                  <option key={powiat} value={powiat}>
                    {powiat}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons - 🆕 GEO BUTTON WITH LOADING */}
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

            <button
              onClick={handleSearch}
              className="w-full px-4 py-4 bg-accent-500 hover:bg-accent-600 transition-colors text-white font-semibold"
            >
              Szukaj
            </button>
          </div>

          {/* Helper Text */}
          <p className="text-sm text-neutral-500 text-center mt-3">
            💡 Wpisz miejscowość - system automatycznie dopasuje województwo i
            powiat
          </p>
        </div>
      </div>
    </section>
  );
}