// src/components/filters/FilterSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface FilterSidebarProps {
  totalResults: number;
  careProfileCounts: Record<string, number>;
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

// Typy opieki - mapowanie z profileopieki.ts
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

export default function FilterSidebar({ totalResults, careProfileCounts }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Collapse states
  const [isLocationOpen, setIsLocationOpen] = useState(true);
  const [isCareTypeOpen, setIsCareTypeOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  
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

  // Sync with URL changes
  useEffect(() => {
    setLocalType(searchParams.get('type') || 'all');
    setSelectedWojewodztwo(searchParams.get('woj') || 'all');
    setSelectedPowiat(searchParams.get('powiat') || 'all');
    
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
    selectedCareTypes.length > 0 ||
    minPrice !== '' ||
    maxPrice !== '' ||
    showFree;

  // Handler do czyszczenia filtrów
  const handleClearFilters = () => {
    router.push(`/search?${searchParams.get('q') ? 'q=' + searchParams.get('q') : ''}`);
  };

  // Handler dla zmiany filtrów
  const handleFilterChange = (updates: {
    type?: string;
    wojewodztwo?: string;
    powiat?: string;
    careTypes?: string[];
    minPrice?: number;
    maxPrice?: number;
    showFree?: boolean;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.type !== undefined) {
      setLocalType(updates.type);
      if (updates.type !== 'all') {
        params.set('type', updates.type);
      } else {
        params.delete('type');
      }
    }

    if (updates.wojewodztwo !== undefined) {
      setSelectedWojewodztwo(updates.wojewodztwo);
      if (updates.wojewodztwo !== 'all') {
        params.set('woj', updates.wojewodztwo);
      } else {
        params.delete('woj');
        setSelectedPowiat('all');
        params.delete('powiat');
      }
    }

    if (updates.powiat !== undefined) {
      setSelectedPowiat(updates.powiat);
      if (updates.powiat !== 'all') {
        params.set('powiat', updates.powiat);
      } else {
        params.delete('powiat');
      }
    }

    if (updates.careTypes !== undefined) {
      setSelectedCareTypes(updates.careTypes);
      if (updates.careTypes.length > 0) {
        params.set('care', updates.careTypes.join(','));
      } else {
        params.delete('care');
      }
    }

    if (updates.minPrice !== undefined) {
      if (updates.minPrice > 0) {
        params.set('min', updates.minPrice.toString());
      } else {
        params.delete('min');
      }
    }

    if (updates.maxPrice !== undefined) {
      if (updates.maxPrice > 0) {
        params.set('max', updates.maxPrice.toString());
      } else {
        params.delete('max');
      }
    }

    if (updates.showFree !== undefined) {
      if (updates.showFree) {
        params.set('free', 'true');
      } else {
        params.delete('free');
      }
    }

    router.push(`/search?${params.toString()}`);
  };

  const handleCareTypeToggle = (careType: string) => {
    const newCareTypes = selectedCareTypes.includes(careType)
      ? selectedCareTypes.filter(t => t !== careType)
      : [...selectedCareTypes, careType];
    
    handleFilterChange({ careTypes: newCareTypes });
  };

  const handlePriceSubmit = () => {
    const min = minPrice ? parseInt(minPrice) : undefined;
    const max = maxPrice ? parseInt(maxPrice) : undefined;
    handleFilterChange({ minPrice: min, maxPrice: max });
  };

  return (
    <aside className="w-full lg:w-80 space-y-4 lg:sticky lg:top-6 lg:self-start">
      {/* Header z liczbą wyników + Wyczyść */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-neutral-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600">
            Znaleziono <span className="font-semibold text-neutral-900">{totalResults}</span> placówek
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-accent-600 hover:text-accent-700 font-medium"
            >
              Wyczyść filtry
            </button>
          )}
        </div>
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
            {/* Województwo */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Województwo
              </label>
              <select
                value={selectedWojewodztwo}
                onChange={(e) => handleFilterChange({ wojewodztwo: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              >
                <option value="all">Wszystkie</option>
                {WOJEWODZTWA.map((woj) => (
                  <option key={woj.value} value={woj.value} disabled={!woj.hasData}>
                    {woj.label} {!woj.hasData && '(Wkrótce)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Powiat */}
            {selectedWojewodztwo !== 'all' && availablePowiaty.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1.5">
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