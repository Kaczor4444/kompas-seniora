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
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.append("q", searchQuery.trim());

      if (selectedType !== "WSZYSTKIE") {
        params.append("type", selectedType.toLowerCase());
      }

      // Dodaj województwo jeśli wybrane i nie Małopolskie
      if (selectedVoivodeship && selectedVoivodeship !== "malopolskie") {
        params.append("woj", selectedVoivodeship);
      }

      // Dodaj powiat jeśli wybrany
      if (selectedPowiat) {
        params.append("powiat", selectedPowiat);
      }

      window.location.href = `/search?${params.toString()}`;
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Twoja przeglądarka nie obsługuje geolokalizacji");
      return;
    }

    console.log("📍 Requesting geolocation...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("✅ Geolocation success:", { latitude, longitude });
        window.location.href = `/search?lat=${latitude}&lng=${longitude}&near=true`;
      },
      (error) => {
        console.error("❌ Geolocation error:", error);

        let message = "Nie udało się pobrać lokalizacji.";

        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Musisz zezwolić na dostęp do lokalizacji w ustawieniach przeglądarki.\n\niPhone: Ustawienia → Safari → Lokalizacja → Zezwól";
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
          zIndex: 10000,
          position: "absolute",
        }}
        onMouseDown={(e) => {
          // Zapobiega zamknięciu dropdown przed kliknięciem
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Suggestions list */}
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.nazwa}-${suggestion.powiat}`}
            onMouseDown={(e) => {
              e.preventDefault();
              handleSuggestionClick(suggestion);
            }}
            className={`w-full px-4 py-3 text-left border-b border-neutral-100 last:border-b-0 hover:bg-accent-50 transition-colors cursor-pointer ${
              highlightedIndex === index ? "bg-accent-50" : ""
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-neutral-900">
                  {suggestion.nazwa}
                </div>
                <div className="text-sm text-neutral-500">
                  {suggestion.powiat}, {suggestion.wojewodztwo}
                </div>
              </div>
              <div className="text-sm text-accent-600 font-medium">
                {suggestion.facilitiesCount}{" "}
                {getPluralForm(suggestion.facilitiesCount)}
              </div>
            </div>
          </button>
        ))}

        {/* "Show All" button if more results than displayed AND query is long enough */}
        {totalCount > suggestions.length && searchQuery.length >= 4 && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleShowAllClick();
            }}
            className="w-full px-4 py-3 text-center text-accent-600 hover:bg-accent-50 font-medium transition-colors border-t border-neutral-200 cursor-pointer"
          >
            📋 Pokaż wszystkie ({totalCount})
          </button>
        )}
      </div>
    );
  };

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-accent-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Trust Badge */}
        <div className="flex justify-center mb-8">
          <div className="bg-white px-6 py-2 rounded-lg shadow-sm border border-neutral-200">
            <span className="text-sm text-neutral-700">
              ⭐⭐⭐⭐⭐ Zaufana platforma
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 leading-tight">
            Znajdź najlepszy dom opieki
            <br />w Twojej okolicy
          </h1>
          <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
            Transparentna wyszukiwarka publicznych domów pomocy społecznej z
            oficjalnymi cenami
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedType("WSZYSTKIE")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              selectedType === "WSZYSTKIE"
                ? "bg-white border-2 border-accent-500 text-neutral-900"
                : "bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700"
            }`}
            title="Wszystkie typy placówek - zarówno DPS jak i ŚDS"
          >
            Wszystkie
          </button>
          <button
            onClick={() => setSelectedType("DPS")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              selectedType === "DPS"
                ? "bg-white border-2 border-accent-500 text-neutral-900"
                : "bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700"
            }`}
            title="Domy Pomocy Społecznej - całodobowa opieka dla osób starszych i niepełnosprawnych"
          >
            Domy Pomocy Społecznej (DPS){" "}
            <span className="text-neutral-400 ml-1">ⓘ</span>
          </button>
          <button
            onClick={() => setSelectedType("ŚDS")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              selectedType === "ŚDS"
                ? "bg-white border-2 border-accent-500 text-neutral-900"
                : "bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700"
            }`}
            title="Środowiskowe Domy Samopomocy - wsparcie dla osób z zaburzeniami psychicznymi"
          >
            Środowiskowe Domy Samopomocy (ŚDS){" "}
            <span className="text-neutral-400 ml-1">ⓘ</span>
          </button>
        </div>

        {/* Multi-Segment Search Bar */}
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

            {/* Segment 4: Geo Button */}
            <button
              onClick={handleGeolocation}
              className="px-6 bg-green-50 hover:bg-green-100 transition-colors flex items-center justify-center border-r border-neutral-200"
              title="Szukaj w okolicy"
            >
              <svg
                className="w-6 h-6 text-green-700"
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

            {/* Buttons */}
            <button
              onClick={handleGeolocation}
              className="w-full px-4 py-4 bg-green-50 hover:bg-green-100 transition-colors flex items-center justify-center gap-2 border-b border-neutral-200 text-green-800 font-medium"
            >
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
