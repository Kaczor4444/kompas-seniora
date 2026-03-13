'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, AlertCircle, Check, Navigation } from 'lucide-react';

// Types
interface Suggestion {
  nazwa: string;
  powiat: string;
  wojewodztwo: string;
  facilitiesCount: number;
  rodzaj_miejscowosci?: string;
  parentLocationName?: string | null;
}

interface SuggestResponse {
  suggestions: Suggestion[];
  totalCount: number;
  showAll: boolean;
}

interface SearchBarProps {
  initialQuery?: string;
  initialType?: 'DPS' | 'ŚDS' | 'Wszystkie';
  compact?: boolean; // dla wersji na stronie wyników
  onQueryChange?: (query: string) => void; // callback when query changes
  disableAutocomplete?: boolean; // wyłącz dropdown na stronie wyników
  onSearch?: (params: URLSearchParams) => void; // callback for search in map view
}

// Autocomplete Dropdown Component
interface AutocompleteDropdownProps {
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  suggestions: Suggestion[];
  totalCount: number;
  highlightedIndex: number;
  onSuggestionClick: (suggestion: Suggestion) => void;
  onShowAllClick: () => void;
  onMouseEnter: (index: number) => void;
}

const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({
  dropdownRef,
  suggestions,
  totalCount,
  highlightedIndex,
  onSuggestionClick,
  onShowAllClick,
  onMouseEnter,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-[100%] left-0 right-0 bg-white rounded-b-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-200 border-t-0 z-[100] overflow-hidden"
    >
      <ul className="divide-y divide-slate-50 bg-white max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
        {suggestions.map((suggestion, index) => (
          <li
            key={`sugg-${suggestion.nazwa}-${suggestion.powiat}-${index}`}
            onMouseDown={() => onSuggestionClick(suggestion)}
            onMouseEnter={() => onMouseEnter(index)}
            className={`px-5 py-3.5 cursor-pointer transition-colors ${
              highlightedIndex === index ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate">
                  {suggestion.nazwa}
                  {suggestion.parentLocationName && (
                    <span className="text-slate-500 font-normal"> (część wsi {suggestion.parentLocationName})</span>
                  )}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  Powiat {suggestion.powiat}
                </p>
              </div>
            </div>
          </li>
        ))}

        {suggestions.length > 5 && (
          <li className="px-5 py-2 bg-slate-50 text-slate-500 text-xs text-center sticky bottom-0">
            Przewiń, aby zobaczyć wszystkie ({suggestions.length}) wyniki
          </li>
        )}
      </ul>
    </div>
  );
};

// Type Chip Component
const TypeChip = ({ active, label, sub, onClick }: { active: boolean; label: string; sub?: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center min-w-[80px]
      ${active
        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
  >
    <span className="text-[11px] font-black uppercase tracking-wider">{label}</span>
    {sub && (
      <span className={`hidden sm:block text-[9px] font-bold uppercase tracking-widest mt-0.5 ${active ? 'text-slate-300' : 'text-slate-400'}`}>
        {sub}
      </span>
    )}
  </button>
);

export const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = '',
  initialType = 'Wszystkie',
  compact = false,
  onQueryChange,
  disableAutocomplete = false,
  onSearch,
}) => {
  const [cityInput, setCityInput] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<'DPS' | 'ŚDS' | 'Wszystkie'>(initialType);
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // API-based validation state
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Refs for click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Notify parent of query changes
  useEffect(() => {
    if (onQueryChange) {
      onQueryChange(cityInput);
    }
  }, [cityInput, onQueryChange]);

  // Debounced fetch autocomplete suggestions
  useEffect(() => {
    // Wyłącz autocomplete na stronie wyników
    if (disableAutocomplete) {
      setSuggestions([]);
      setShowDropdown(false);
      setValidationState('idle');
      return;
    }

    if (cityInput.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setValidationState('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({ q: cityInput });
        if (selectedType !== 'Wszystkie') {
          params.append('typ', selectedType);
        }

        const response = await fetch(`/api/teryt/suggest?${params}`);
        const data: SuggestResponse = await response.json();

        const sugg = data.suggestions || [];
        setSuggestions(sugg);
        setTotalCount(data.totalCount || 0);
        setShowDropdown(sugg.length > 0);
        setValidationState(sugg.length > 0 ? 'valid' : 'invalid');
        setHighlightedIndex(-1);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
        setShowDropdown(false);
        setValidationState('idle');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [cityInput, selectedType, disableAutocomplete]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setCityInput(suggestion.nazwa);
    setShowDropdown(false);

    const params = new URLSearchParams();
    params.append('q', suggestion.nazwa);
    params.append('powiat', suggestion.powiat);
    if (selectedType !== 'Wszystkie') {
      params.append('type', selectedType === 'DPS' ? 'dps' : 'sds');
    }

    // Use callback if provided (map view), otherwise navigate
    if (onSearch) {
      onSearch(params);
    } else {
      window.location.href = `/search?${params.toString()}`;
    }
  };

  const handleShowAllClick = () => {
    setShowDropdown(false);

    const params = new URLSearchParams();
    params.append('q', cityInput);
    params.append('partial', 'true');
    if (selectedType !== 'Wszystkie') {
      params.append('type', selectedType === 'DPS' ? 'dps' : 'sds');
    }
    window.location.href = `/search?${params.toString()}`;
  };

  const handleSearchClick = () => {
    // Auto-select - inteligentne wybieranie sugestii
    if (suggestions.length > 0) {
      // Normalizuj input do porównania (bez polskich znaków)
      const normalizedInput = cityInput
        .toLowerCase()
        .trim()
        .replace(/ł/g, 'l')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      // Jeśli jest tylko jedna sugestia - zawsze ją wybierz
      if (suggestions.length === 1) {
        handleSuggestionClick(suggestions[0]);
        return;
      }

      // Jeśli jest wiele sugestii - sprawdź czy któraś jest exact match
      // API już sortuje - pierwsza exact match jest najlepsza (miasta na prawach powiatu mają priorytet)
      const exactMatches = suggestions.filter(s => {
        const normalized = s.nazwa
          .toLowerCase()
          .replace(/ł/g, 'l')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return normalized === normalizedInput;
      });

      if (exactMatches.length > 0) {
        // Wybierz pierwszą - API już posortowało (exact + RM=96/98 mają priorytet)
        handleSuggestionClick(exactMatches[0]);
        return;
      }
    }

    // Fallback - obecna logika (partial search)
    const params = new URLSearchParams();
    if (cityInput) params.append('q', cityInput);
    if (selectedType !== 'Wszystkie') {
      params.append('type', selectedType === 'DPS' ? 'dps' : 'sds');
    }

    // Use callback if provided (map view), otherwise navigate
    if (onSearch) {
      onSearch(params);
    } else {
      window.location.href = `/search?${params.toString()}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Blokuj Enter gdy brak walidacji
    const isSearchDisabled = cityInput.length < 2 || validationState !== 'valid';

    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter' && !isSearchDisabled) handleSearchClick();
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        } else {
          handleSearchClick();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  const handleGeolocation = () => {
    // ========================================
    // ⚠️ TODO: USUNĄĆ PO TESTACH! ⚠️
    //
    // TYMCZASOWY TEST MODE - hardcoded lokalizacja Kraków
    // Pozwala testować geolokalizację z UK bez prawdziwego GPS
    //
    // JAK USUNĄĆ:
    // 1. Usuń cały blok od linii "const TEST_MODE = true"
    //    do "// KONIEC HARDCODED TEST MODE"
    // 2. Lub po prostu ustaw: const TEST_MODE = false;
    //
    // DOKUMENTACJA: Zobacz PROJEKT_DOKUMENTACJA.md sekcja "Tymczasowe zmiany"
    // ========================================
    const TEST_MODE = true; // ← ZMIEŃ NA FALSE LUB USUŃ CAŁY BLOK

    if (TEST_MODE) {
      setIsGeoLoading(true);
      // Olkusz: 50.2833°N, 19.5667°E (mniejsze miasto - do testów)
      const latitude = 50.2833;
      const longitude = 19.5667;
      setTimeout(() => {
        window.location.href = `/search?lat=${latitude}&lng=${longitude}&near=true`;
      }, 500); // Symuluj małe opóźnienie jak przy prawdziwym GPS
      return;
    }
    // ========================================
    // KONIEC HARDCODED TEST MODE
    // ========================================

    if (!navigator.geolocation) {
      alert('Twoja przeglądarka nie obsługuje geolokalizacji');
      return;
    }
    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        window.location.href = `/search?lat=${latitude}&lng=${longitude}&near=true`;
      },
      (error) => {
        setIsGeoLoading(false);
        let message = 'Nie udało się pobrać lokalizacji.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Dostęp do lokalizacji został zablokowany.\n\nWłącz w ustawieniach przeglądarki.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Przekroczono czas oczekiwania.\n\nSpróbuj ponownie lub wpisz miasto ręcznie.';
        } else {
          message = 'Nie można określić lokalizacji.\n\nUpewnij się że masz włączone usługi lokalizacji.';
        }
        alert(message);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  };

  return (
    <div className={`${compact ? 'max-w-2xl' : 'max-w-2xl'} space-y-3`}>
      {/* Type chips */}
      {!compact && (
        <div className="flex gap-2 flex-wrap">
          <TypeChip active={selectedType === 'Wszystkie'} label="Wszystkie" onClick={() => setSelectedType('Wszystkie')} />
          <TypeChip active={selectedType === 'DPS'} label="DPS" sub="Całodobowe" onClick={() => setSelectedType('DPS')} />
          <TypeChip active={selectedType === 'ŚDS'} label="ŚDS" sub="Dzienne" onClick={() => setSelectedType('ŚDS')} />
        </div>
      )}

      {/* Search bar */}
      <div className={`${compact ? 'bg-white shadow-lg p-1' : 'bg-slate-50 border border-slate-200 shadow-sm p-1.5'} rounded-xl`}>
        <div className="bg-white border border-slate-200 rounded-lg flex items-stretch">
          {/* City input */}
          <div className="relative flex-1 group">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none
              ${validationState === 'invalid' ? 'text-amber-500' : 'text-slate-300 group-focus-within:text-emerald-600'}`}>
              <MapPin size={18} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Gdzie szukasz opieki?"
              enterKeyHint="search"
              autoComplete="off"
              spellCheck="false"
              className={`w-full bg-transparent ${compact ? 'py-2.5' : 'py-4'} pl-11 pr-4 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium`}
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
              </div>
            )}
            {showDropdown && (
              <AutocompleteDropdown
                dropdownRef={dropdownRef}
                suggestions={suggestions}
                totalCount={totalCount}
                highlightedIndex={highlightedIndex}
                onSuggestionClick={handleSuggestionClick}
                onShowAllClick={handleShowAllClick}
                onMouseEnter={setHighlightedIndex}
              />
            )}
          </div>

          {/* Search button */}
          <button
            onClick={handleSearchClick}
            disabled={cityInput.length < 2 || (!disableAutocomplete && validationState !== 'valid')}
            className={`bg-slate-900 hover:bg-emerald-700 text-white m-1.5 ${compact ? 'px-4 py-2' : 'px-6'} rounded-lg font-black text-[11px] uppercase tracking-[0.15em] transition-colors active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900`}
          >
            Szukaj
          </button>
        </div>
      </div>

      {/* Validation / popular hint */}
      {!compact && (
        <div className="min-h-[22px] px-1">
          {validationState === 'invalid' ? (
            <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
              <AlertCircle size={13} /> {cityInput} nie jest w naszej bazie. Teraz obejmujemy Małopolskę.
            </p>
          ) : cityInput.length === 0 ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Popularne:</span>
              {['Kraków', 'Tarnów', 'Nowy Sącz'].map(city => (
                <button
                  key={city}
                  onClick={() => setCityInput(city)}
                  className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 underline decoration-slate-200 underline-offset-4 hover:decoration-emerald-300 transition-all"
                >
                  {city}
                </button>
              ))}
            </div>
          ) : validationState === 'valid' && !showDropdown ? (
            <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
              <Check size={13} /> Region Małopolski zweryfikowany
            </p>
          ) : null}
        </div>
      )}

      {/* Geolocation */}
      {!compact && (
        <button
          onClick={handleGeolocation}
          disabled={isGeoLoading}
          className="inline-flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 tracking-widest hover:text-emerald-700 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Navigation size={13} className="text-emerald-500 group-hover:animate-bounce" />
          <span className="underline decoration-dotted underline-offset-4 decoration-2">
            {isGeoLoading ? 'Wyszukiwanie...' : 'Namierz moją lokalizację'}
          </span>
        </button>
      )}
    </div>
  );
};
