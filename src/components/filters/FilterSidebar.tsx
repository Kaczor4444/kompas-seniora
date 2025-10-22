// src/components/filters/FilterSidebar.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FilterSidebarProps {
  totalResults: number;
  careProfileCounts: Record<string, number>;
  hasUserLocation?: boolean; // ✅ NOWE: czy user użył geolokalizacji
}

// ✅ NOWE: Typy dla autocomplete
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

// Wszystkie województwa Polski
const WOJEWODZTWA = [
  { value: 'małopolskie', label: 'Małopolskie', hasData: true },
  { value: 'śląskie', label: 'Śląskie', hasData: true },
  { value: 'mazowieckie', label: 'Mazowieckie', hasData: false },
  { value: 'dolnośląskie', label: 'Dolnośląskie', hasData: false },
  { value: 'wielkopolskie', label: 'Wielkopolskie', hasData: false },
  { value: 'łódzkie', label: 'Łódzkie', hasData: false },
  { value: 'pomorskie', label: 'Pomorskie', hasData: false },
  { value: 'zachodniopomorskie', label: 'Zachodniopomorskie', hasData: false },
  { value: 'lubelskie', label: 'Lubelskie', hasData: false },
  { value: 'podkarpackie', label: 'Podkarpackie', hasData: false },
  { value: 'kujawsko-pomorskie', label: 'Kujawsko-Pomorskie', hasData: false },
  { value: 'warmińsko-mazurskie', label: 'Warmińsko-Mazurskie', hasData: false },
  { value: 'podlaskie', label: 'Podlaskie', hasData: false },
  { value: 'świętokrzyskie', label: 'Świętokrzyskie', hasData: false },
  { value: 'lubuskie', label: 'Lubuskie', hasData: false },
  { value: 'opolskie', label: 'Opolskie', hasData: false },
];

// Powiaty dla każdego województwa
const POWIATY_MAP: Record<string, string[]> = {
  'małopolskie': [
    'bocheński', 'brzeski', 'chrzanowski', 'dąbrowski', 'gorlicki',
    'krakowski', 'limanowski', 'miechowski', 'myślenicki', 'nowosądecki',
    'nowotarski', 'olkuski', 'oświęcimski', 'proszowicki', 'suski',
    'tarnowski', 'tatrzański', 'wadowicki', 'wielicki', 'Kraków'
  ],
  'śląskie': [
    'bielski', 'bytomski', 'cieszyński', 'częstochowski', 'gliwicki',
    'kłobucki', 'lubliniecki', 'mikołowski', 'myszkowski', 'pszczyński',
    'raciborski', 'rybnicki', 'tarnogórski', 'bieruńsko-lędziński', 'wodzisławski',
    'zawierciański', 'żywiecki', 'Katowice', 'Bielsko-Biała', 'Bytom'
  ],
};

// Typy opieki
const CARE_TYPES = [
  { value: 'A', label: 'Niepełnosprawność intelektualna (dorośli)' },
  { value: 'B', label: 'Spektrum autyzmu' },
  { value: 'C', label: 'Zaburzenia psychiczne, demencja, Alzheimer' },
  { value: 'D', label: 'Niepełnosprawności sprzężone' },
  { value: 'E', label: 'Osoby w podeszłym wieku' },
  { value: 'F', label: 'Przewlekle somatycznie chorzy' },
  { value: 'G', label: 'Dzieci niepełnosprawne intelektualnie' },
  { value: 'H', label: 'Młodzież niepełnosprawna intelektualnie' },
  { value: 'I', label: 'Niepełnosprawność fizyczna (motoryczna)' },
];

export default function FilterSidebar({ totalResults, careProfileCounts, hasUserLocation = false }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Collapse states - ✅ ZMIENIONE: Lokalizacja domyślnie OTWARTA
  const [isLocationOpen, setIsLocationOpen] = useState(true);
  const [isCareTypeOpen, setIsCareTypeOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  
  // ✅ NOWE: Sort state
  const [currentSort, setCurrentSort] = useState(searchParams.get('sort') || 'default');
  
  // ✅ NOWE: Autocomplete state dla miejscowości
  const [locationQuery, setLocationQuery] = useState<string>(
    searchParams.get('q') || ''
  );
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Local state for optimistic updates
  const [localType, setLocalType] = useState<string>(
    searchParams.get('type') || 'all'
  );
  
  const [selectedWojewodztwo, setSelectedWojewodztwo] = useState<string>(
    searchParams.get('woj') || 'all'
  );
  
  const [selectedPowiat, setSelectedPowiat] = useState<string>(
    searchParams.get('powiat') || 'all'
  );
  
  const [selectedCareTypes, setSelectedCareTypes] = useState<string[]>(() => {
    const careParam = searchParams.get('care');
    return careParam ? careParam.split(',') : [];
  });

  const [minPrice, setMinPrice] = useState<string>(searchParams.get('min') || '');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('max') || '');
  const [showFree, setShowFree] = useState(searchParams.get('free') === 'true');

  // Helper dla polskiej pluralizacji
  const getPluralForm = (count: number): string => {
    if (count === 1) return 'placówka';
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'placówek';
    if (lastDigit >= 2 && lastDigit <= 4) return 'placówki';
    return 'placówek';
  };

  // ✅ NOWE: Handle sort change
  const handleSortChange = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (sortValue === 'default') {
      params.delete('sort');
    } else {
      params.set('sort', sortValue);
    }
    
    router.push(`/search?${params.toString()}`);
  };

  // ✅ NOWE: Debounced autocomplete fetch
  useEffect(() => {
    if (locationQuery.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      
      try {
        const params = new URLSearchParams({ q: locationQuery });
        const apiUrl = `/api/teryt/suggest?${params}`;
        
        const response = await fetch(apiUrl);
        const data: SuggestResponse = await response.json();

        setSuggestions(data.suggestions || []);
        setShowDropdown((data.suggestions || []).length > 0);
        setHighlightedIndex(-1);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [locationQuery]);

  // ✅ NOWE: Click outside handler
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

  // Sync with URL changes
  useEffect(() => {
    setLocalType(searchParams.get('type') || 'all');
    setSelectedWojewodztwo(searchParams.get('woj') || 'all');
    setSelectedPowiat(searchParams.get('powiat') || 'all');
    setLocationQuery(searchParams.get('q') || '');
    setCurrentSort(searchParams.get('sort') || 'default');
    
    const careParam = searchParams.get('care');
    setSelectedCareTypes(careParam ? careParam.split(',') : []);
    
    setMinPrice(searchParams.get('min') || '');
    setMaxPrice(searchParams.get('max') || '');
    setShowFree(searchParams.get('free') === 'true');
  }, [searchParams]);

  // Dostępne powiaty
  const availablePowiaty = selectedWojewodztwo !== 'all' 
    ? POWIATY_MAP[selectedWojewodztwo] || []
    : [];

  // Sprawdź czy są aktywne filtry
  const hasActiveFilters = 
    localType !== 'all' ||
    selectedWojewodztwo !== 'all' ||
    selectedPowiat !== 'all' ||
    locationQuery !== '' ||
    selectedCareTypes.length > 0 ||
    minPrice !== '' ||
    maxPrice !== '' ||
    showFree;

  const handleFilterChange = (changes: Partial<{
    type: string;
    wojewodztwo: string;
    powiat: string;
    showFree: boolean;
  }>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (changes.type !== undefined) {
      setLocalType(changes.type);
      if (changes.type === 'all') {
        params.delete('type');
      } else {
        params.set('type', changes.type);
      }
    }
    
    if (changes.wojewodztwo !== undefined) {
      setSelectedWojewodztwo(changes.wojewodztwo);
      if (changes.wojewodztwo === 'all') {
        params.delete('woj');
        params.delete('powiat');
      } else {
        params.set('woj', changes.wojewodztwo);
        params.delete('powiat');
      }
      setSelectedPowiat('all');
    }
    
    if (changes.powiat !== undefined) {
      setSelectedPowiat(changes.powiat);
      if (changes.powiat === 'all') {
        params.delete('powiat');
      } else {
        params.set('powiat', changes.powiat);
      }
    }
    
    if (changes.showFree !== undefined) {
      if (changes.showFree) {
        params.set('free', 'true');
        params.delete('min');
        params.delete('max');
        setMinPrice('');
        setMaxPrice('');
      } else {
        params.delete('free');
      }
    }
    
    router.push(`/search?${params.toString()}`);
  };

  const handleCareTypeToggle = (careType: string) => {
    const newSelectedTypes = selectedCareTypes.includes(careType)
      ? selectedCareTypes.filter(t => t !== careType)
      : [...selectedCareTypes, careType];
    
    setSelectedCareTypes(newSelectedTypes);
    
    const params = new URLSearchParams(searchParams.toString());
    if (newSelectedTypes.length > 0) {
      params.set('care', newSelectedTypes.join(','));
    } else {
      params.delete('care');
    }
    
    router.push(`/search?${params.toString()}`);
  };

  const handlePriceSubmit = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (showFree) return;
    
    if (minPrice) {
      params.set('min', minPrice);
    } else {
      params.delete('min');
    }
    
    if (maxPrice) {
      params.set('max', maxPrice);
    } else {
      params.delete('max');
    }
    
    router.push(`/search?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setLocalType('all');
    setSelectedWojewodztwo('all');
    setSelectedPowiat('all');
    // ✅ NIE czyścimy locationQuery - miejscowość zostaje
    setSelectedCareTypes([]);
    setMinPrice('');
    setMaxPrice('');
    setShowFree(false);
    setCurrentSort('default');
    
    const params = new URLSearchParams(searchParams.toString());
    
    // ✅ Zachowaj query (q), geolokalizację (lat, lng, near)
    const preserveParams = ['q', 'lat', 'lng', 'near'];
    const preserved: Record<string, string> = {};
    
    preserveParams.forEach(param => {
      const value = params.get(param);
      if (value) preserved[param] = value;
    });
    
    // Wyczyść wszystko i przywróć zachowane
    const newParams = new URLSearchParams();
    Object.entries(preserved).forEach(([key, value]) => {
      newParams.set(key, value);
    });
    
    router.push(`/search?${newParams.toString()}`);
  };

  // ✅ NOWE: Keyboard navigation for autocomplete
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  // ✅ NOWE: Handle suggestion click
  const handleSuggestionClick = (suggestion: Suggestion) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', suggestion.nazwa);
    params.delete('partial');
    
    setLocationQuery(suggestion.nazwa);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    
    router.push(`/search?${params.toString()}`);
  };

  // ✅ NOWE: Handle location clear
  const handleLocationClear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('q');
    params.delete('partial');
    
    setLocationQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    
    router.push(`/search?${params.toString()}`);
  };

  // ✅ NOWE: Opcje sortowania z warunkiem dla geolokalizacji
  const sortOptions = [
    { value: 'default', label: 'Domyślnie' },
    { value: 'name_asc', label: 'Alfabetycznie A-Z' },
    { value: 'name_desc', label: 'Alfabetycznie Z-A' },
    { value: 'price_asc', label: 'Najtańsze' },
    { value: 'price_desc', label: 'Najdroższe' },
    // Opcja "Najbliższe" tylko gdy user udostępnił lokalizację
    ...(hasUserLocation ? [{ value: 'distance', label: 'Najbliższe' }] : []),
  ];

  return (
    <aside className="space-y-4 sticky top-6">
      {/* Header z licznikiem i wyczyść wszystko */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-600">
            Znaleziono <span className="font-semibold text-neutral-900">{totalResults}</span> {getPluralForm(totalResults)}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors"
            >
              Wyczyść filtry
            </button>
          )}
        </div>

        {/* 🆕 SORTOWANIE - Dodane tutaj! */}
        <div className="pt-4 border-t border-neutral-200">
          <label htmlFor="sort-select-sidebar" className="block text-sm font-medium text-neutral-700 mb-2">
            Sortuj wyniki:
          </label>
          <select
            id="sort-select-sidebar"
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lokalizacja - COLLAPSIBLE */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <button
          onClick={() => setIsLocationOpen(!isLocationOpen)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <h3 className="text-base font-semibold text-neutral-900">
            Lokalizacja
          </h3>
          <svg 
            className={`w-5 h-5 text-neutral-500 transition-transform ${isLocationOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isLocationOpen && (
          <div className="px-4 pb-4 space-y-3">
            {/* ✅ Miejscowość z autocomplete */}
            <div className="relative">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Miejscowość
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="np. Kraków, Bochnia..."
                  className="w-full px-3 py-2 pr-8 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                />
                {locationQuery && (
                  <button
                    onClick={handleLocationClear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Autocomplete dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-accent-50 transition-colors ${
                        index === highlightedIndex ? 'bg-accent-50' : ''
                      }`}
                    >
                      <div className="font-medium text-neutral-900">{suggestion.nazwa}</div>
                      <div className="text-xs text-neutral-600">
                        {suggestion.powiat}, {suggestion.wojewodztwo} • {suggestion.facilitiesCount} {getPluralForm(suggestion.facilitiesCount)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Województwo */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Województwo
              </label>
              <select
                value={selectedWojewodztwo}
                onChange={(e) => handleFilterChange({ wojewodztwo: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              >
                <option value="all">Wszystkie</option>
                {WOJEWODZTWA.map((woj) => (
                  <option 
                    key={woj.value} 
                    value={woj.value}
                    disabled={!woj.hasData}
                  >
                    {woj.label} {!woj.hasData && '(Wkrótce)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Powiat - tylko gdy wybrane województwo */}
            {selectedWojewodztwo !== 'all' && availablePowiaty.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Powiat
                </label>
                <select
                  value={selectedPowiat}
                  onChange={(e) => handleFilterChange({ powiat: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                >
                  <option value="all">Wszystkie</option>
                  {availablePowiaty.map((powiat) => (
                    <option key={powiat} value={powiat}>
                      {powiat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Typ placówki - ALWAYS VISIBLE */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-neutral-200">
        <h3 className="text-base font-semibold text-neutral-900 mb-3">
          Typ placówki
        </h3>
        
        <div className="space-y-2">
          {['all', 'dps', 'sds'].map((type) => (
            <label key={type} className="flex items-center space-x-2 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={localType === type}
                  onChange={() => handleFilterChange({ type })}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  localType === type
                    ? 'border-accent-600 bg-accent-50' 
                    : 'border-neutral-300 bg-white group-hover:border-accent-400'
                }`}>
                  {localType === type && (
                    <div className="w-2 h-2 rounded-full bg-accent-600"></div>
                  )}
                </div>
              </div>
              <span className="text-sm text-neutral-700 group-hover:text-neutral-900">
                {type === 'all' ? 'Wszystkie' : type === 'dps' ? 'DPS' : 'ŚDS'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Profil opieki - COLLAPSIBLE */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <button
          onClick={() => setIsCareTypeOpen(!isCareTypeOpen)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <h3 className="text-base font-semibold text-neutral-900">
            Profil opieki
          </h3>
          <svg 
            className={`w-5 h-5 text-neutral-500 transition-transform ${isCareTypeOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isCareTypeOpen && (
          <div className="px-4 pb-4 space-y-2">
            {CARE_TYPES.map((careType) => {
              const count = careProfileCounts[careType.value] || 0;
              const isDisabled = count === 0;
              
              return (
                <label 
                  key={careType.value}
                  className={`flex items-center justify-between space-x-2 ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } group`}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedCareTypes.includes(careType.value)}
                        onChange={() => !isDisabled && handleCareTypeToggle(careType.value)}
                        disabled={isDisabled}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedCareTypes.includes(careType.value)
                          ? 'border-accent-600 bg-accent-50' 
                          : isDisabled
                          ? 'border-neutral-200 bg-neutral-50'
                          : 'border-neutral-300 bg-white group-hover:border-accent-400'
                      }`}>
                        {selectedCareTypes.includes(careType.value) && (
                          <svg className="w-3 h-3 text-accent-600" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10.28 2.28L4.5 8.06 2.22 5.78a.75.75 0 00-1.06 1.06l2.75 2.75a.75.75 0 001.06 0l6.25-6.25a.75.75 0 00-1.06-1.06z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm ${
                      isDisabled ? 'text-neutral-400' : 'text-neutral-700 group-hover:text-neutral-900'
                    }`}>
                      {careType.label}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${
                    isDisabled ? 'text-neutral-300' : 'text-neutral-500'
                  }`}>
                    ({count})
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Cena - COLLAPSIBLE */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        <button
          onClick={() => setIsPriceOpen(!isPriceOpen)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <h3 className="text-base font-semibold text-neutral-900">
            Cena miesięczna
          </h3>
          <svg 
            className={`w-5 h-5 text-neutral-500 transition-transform ${isPriceOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isPriceOpen && (
          <div className="px-4 pb-4 space-y-3">
            {/* Checkbox bezpłatne */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFree}
                onChange={(e) => {
                  setShowFree(e.target.checked);
                  handleFilterChange({ showFree: e.target.checked });
                }}
                className="w-4 h-4 text-accent-600 border-neutral-300 rounded focus:ring-accent-500"
              />
              <span className="text-sm text-neutral-700">Tylko bezpłatne</span>
            </label>

            {/* Input range od-do */}
            {!showFree && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Od (zł)</label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      onBlur={handlePriceSubmit}
                      placeholder="0"
                      className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-600 mb-1">Do (zł)</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      onBlur={handlePriceSubmit}
                      placeholder="15000"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handlePriceSubmit}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-accent-600 rounded-lg hover:bg-accent-700 transition-colors"
                >
                  Zastosuj
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
