'use client';

import { useState, useEffect, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { MapPin, Check, ChevronsUpDown } from 'lucide-react';

interface TerytSuggestion {
  nazwa: string;
  powiat: string;
  wojewodztwo: string;
  facilitiesCount: number;
}

interface TerytAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (data: {
    miejscowosc: string;
    gmina: string;
    powiat: string;
    wojewodztwo: string;
  }) => void;
  placeholder?: string;
  error?: string;
}

export default function TerytAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Wpisz miejscowość...",
  error
}: TerytAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<TerytSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<TerytSuggestion | null>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/teryt/suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (err) {
        console.error('TERYT search error:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (suggestion: TerytSuggestion | null) => {
    if (!suggestion) {
      setSelected(null);
      setQuery('');
      onChange('');
      return;
    }

    setSelected(suggestion);
    setQuery(suggestion.nazwa);
    onChange(suggestion.nazwa);
    
    // Auto-fill all fields
    onSelect({
      miejscowosc: suggestion.nazwa,
      gmina: suggestion.nazwa,
      powiat: suggestion.powiat,
      wojewodztwo: suggestion.wojewodztwo
    });
  };

  return (
    <div className="relative">
      <Combobox value={selected} onChange={handleSelect}>
        <div className="relative">
          <Combobox.Input
            className={`w-full px-4 py-3 pl-10 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
              error ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder={placeholder}
            displayValue={(suggestion: TerytSuggestion | null) => suggestion?.nazwa || ''}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange(e.target.value);
            }}
          />
          <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronsUpDown className="h-5 w-5 text-gray-400" />
          </Combobox.Button>
        </div>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {loading && (
              <div className="px-4 py-2 text-sm text-gray-500">
                Wyszukiwanie...
              </div>
            )}
            {!loading && suggestions.length === 0 && query.length >= 2 && (
              <div className="px-4 py-2 text-sm text-gray-500">
                Nie znaleziono miejscowości
              </div>
            )}
            {suggestions.map((suggestion) => (
              <Combobox.Option
                key={`${suggestion.nazwa}-${suggestion.powiat}`}
                value={suggestion}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? 'bg-emerald-50 text-emerald-900' : 'text-gray-900'
                  }`
                }
              >
                {({ selected, active }) => (
                  <>
                    <div className="flex flex-col">
                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                        {suggestion.nazwa}
                      </span>
                      <span className="text-xs text-gray-500">
                        pow. {suggestion.powiat}, woj. {suggestion.wojewodztwo}
                        {' • '}
                        {suggestion.facilitiesCount} {suggestion.facilitiesCount === 1 ? 'placówka' : 'placówek'}
                      </span>
                    </div>
                    {selected && (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-600">
                        <Check className="h-5 w-5" />
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </Transition>
      </Combobox>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
