// src/components/filters/PriceFilter.tsx
'use client';

import { useState, useEffect } from 'react';

interface PriceFilterProps {
  minPrice?: number;
  maxPrice?: number;
  showFree: boolean;
  onChange: (updates: {
    minPrice?: number;
    maxPrice?: number;
    showFree?: boolean;
  }) => void;
}

// Popularne zakresy cenowe
const PRICE_OPTIONS = [
  { value: 0, label: 'Bezpłatne' },
  { value: 5000, label: '5 000 zł' },
  { value: 6000, label: '6 000 zł' },
  { value: 7000, label: '7 000 zł' },
  { value: 8000, label: '8 000 zł' },
  { value: 9000, label: '9 000 zł' },
  { value: 10000, label: '10 000 zł' },
  { value: 12000, label: '12 000 zł' },
  { value: 15000, label: '15 000 zł' },
  { value: 20000, label: '20 000 zł' },
  { value: 99999, label: 'Powyżej 20 000 zł' },
];

export default function PriceFilter({ 
  minPrice, 
  maxPrice, 
  showFree, 
  onChange 
}: PriceFilterProps) {
  // Local state dla custom inputs
  const [customMin, setCustomMin] = useState(minPrice?.toString() || '');
  const [customMax, setCustomMax] = useState(maxPrice?.toString() || '');

  // Sync local state z props
  useEffect(() => {
    setCustomMin(minPrice?.toString() || '');
    setCustomMax(maxPrice?.toString() || '');
  }, [minPrice, maxPrice]);

  // Handler dla checkbox "Bezpłatne"
  const handleFreeChange = (checked: boolean) => {
    onChange({ 
      showFree: checked,
      // Jeśli wybrano "Bezpłatne", wyczyść zakres cenowy
      minPrice: checked ? undefined : minPrice,
      maxPrice: checked ? undefined : maxPrice,
    });
  };

  // Handler dla dropdown (Od)
  const handleMinDropdownChange = (value: string) => {
    const numValue = parseInt(value);
    if (numValue === 0) {
      // "Bezpłatne" w dropdown
      handleFreeChange(true);
    } else {
      onChange({ 
        minPrice: numValue,
        showFree: false,
      });
    }
  };

  // Handler dla dropdown (Do)
  const handleMaxDropdownChange = (value: string) => {
    const numValue = parseInt(value);
    onChange({ 
      maxPrice: numValue === 99999 ? undefined : numValue,
      showFree: false,
    });
  };

  // Handler dla custom input (z debounce)
  const handleCustomMinChange = (value: string) => {
    setCustomMin(value);
    
    // Debounce - czekaj aż user skończy pisać
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange({ 
        minPrice: numValue,
        showFree: false,
      });
    } else if (value === '') {
      onChange({ minPrice: undefined });
    }
  };

  const handleCustomMaxChange = (value: string) => {
    setCustomMax(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onChange({ 
        maxPrice: numValue,
        showFree: false,
      });
    } else if (value === '') {
      onChange({ maxPrice: undefined });
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">💰 Cena miesięczna</h3>

      {/* Checkbox: Pokaż bezpłatne */}
      <label className="flex items-center cursor-pointer group mb-4">
        <input
          type="checkbox"
          checked={showFree}
          onChange={(e) => handleFreeChange(e.target.checked)}
          className="w-4 h-4 text-accent-600 rounded focus:ring-accent-500"
        />
        <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
          Pokaż bezpłatne placówki
        </span>
      </label>

      {/* Divider */}
      {!showFree && (
        <>
          <div className="border-t border-gray-100 mb-4"></div>

          {/* Zakres cenowy - Dropdowns */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Od (zł/miesiąc)
              </label>
              <select
                value={minPrice || ''}
                onChange={(e) => handleMinDropdownChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              >
                <option value="">Bez limitu</option>
                {PRICE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Do (zł/miesiąc)
              </label>
              <select
                value={maxPrice || ''}
                onChange={(e) => handleMaxDropdownChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              >
                <option value="">Bez limitu</option>
                {PRICE_OPTIONS.slice(1).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mb-4"></div>

          {/* Custom number inputs */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">
              Lub wpisz dokładną kwotę:
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min.</label>
                <input
                  type="number"
                  value={customMin}
                  onChange={(e) => handleCustomMinChange(e.target.value)}
                  placeholder="5000"
                  min="0"
                  step="100"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Max.</label>
                <input
                  type="number"
                  value={customMax}
                  onChange={(e) => handleCustomMaxChange(e.target.value)}
                  placeholder="10000"
                  min="0"
                  step="100"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                />
              </div>
            </div>
          </div>

          {/* Info o zakresie */}
          {(minPrice || maxPrice) && (
            <div className="mt-3 p-2 bg-accent-50 rounded text-xs text-gray-600">
              Szukasz placówek: {' '}
              {minPrice && <strong>{minPrice.toLocaleString('pl-PL')} zł</strong>}
              {minPrice && maxPrice && ' - '}
              {maxPrice && <strong>{maxPrice.toLocaleString('pl-PL')} zł</strong>}
              {!minPrice && maxPrice && <strong>do {maxPrice.toLocaleString('pl-PL')} zł</strong>}
              {minPrice && !maxPrice && <strong>od {minPrice.toLocaleString('pl-PL')} zł</strong>}
            </div>
          )}
        </>
      )}
    </div>
  );
}