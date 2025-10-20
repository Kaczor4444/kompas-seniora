// src/components/search/SortDropdown.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';

interface SortDropdownProps {
  totalResults: number;
  hasUserLocation?: boolean; // ✅ NOWE: czy user udostępnił lokalizację
}

export default function SortDropdown({ totalResults, hasUserLocation = false }: SortDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'default';

  const handleSortChange = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (sortValue === 'default') {
      params.delete('sort');
    } else {
      params.set('sort', sortValue);
    }
    
    router.push(`/search?${params.toString()}`);
  };

  // ✅ OPCJA "Najbliższe" tylko gdy mamy geolocation
  const sortOptions = [
    { value: 'default', label: 'Domyślnie' },
    { value: 'name_asc', label: 'Alfabetycznie A-Z' },
    { value: 'name_desc', label: 'Alfabetycznie Z-A' },
    { value: 'price_asc', label: 'Najtańsze' },
    { value: 'price_desc', label: 'Najdroższe' },
    // Opcja "Najbliższe" tylko gdy user udostępnił lokalizację
    ...(hasUserLocation ? [{ value: 'distance', label: 'Najbliższe' }] : []),
  ];

  // Polski plural dla "placówka/placówki/placówek"
  const getPlacowkaText = (count: number): string => {
    if (count === 1) return 'placówka';
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'placówek';
    if (lastDigit >= 2 && lastDigit <= 4) return 'placówki';
    return 'placówek';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-neutral-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Results count */}
        <p className="text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">{totalResults}</span> {getPlacowkaText(totalResults)}
        </p>

        {/* Right: Sort dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-neutral-600 font-medium">
            Sortuj:
          </label>
          <select
            id="sort-select"
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-2 text-sm border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}