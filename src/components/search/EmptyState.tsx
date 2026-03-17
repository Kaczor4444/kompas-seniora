// src/components/search/EmptyState.tsx
import React, { useState } from 'react';
import { Search, MapPin, Home, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmptyStateProps {
  onResetFilters: () => void;
  cityInput?: string;
  outOfRegion?: boolean; // true gdy miejscowość poza obsługiwanymi województwami
  outOfRegionCityName?: string; // nazwa miejscowości dla komunikatu
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onResetFilters,
  cityInput,
  outOfRegion,
  outOfRegionCityName
}) => {
  const router = useRouter();
  const isCityEmpty = !cityInput || cityInput.trim() === '';
  const isOutOfRegion = !isCityEmpty && outOfRegion === true;
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolokalizacja nie jest wspierana przez Twoją przeglądarkę');
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Redirect to search with geolocation
        router.push(`/search?lat=${latitude}&lng=${longitude}&near=true`);
      },
      (error) => {
        setIsLoadingLocation(false);
        alert('Nie udało się uzyskać Twojej lokalizacji. Sprawdź uprawnienia przeglądarki.');
        console.error('Geolocation error:', error);
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {isOutOfRegion ? (
          <AlertTriangle size={32} className="text-amber-500" />
        ) : (
          <Search size={32} className="text-gray-400" />
        )}
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {isOutOfRegion
          ? 'Miejscowość poza obsługiwanym obszarem'
          : isCityEmpty
          ? 'Wpisz miejscowość'
          : 'Nie znaleziono placówek'}
      </h3>

      <p className="text-gray-500 text-center max-w-sm mb-6">
        {isOutOfRegion
          ? `Miejscowość "${outOfRegionCityName}" znajduje się poza obszarem objętym bazą danych. Obecnie obsługujemy tylko województwo małopolskie.`
          : isCityEmpty
          ? 'Aby zobaczyć wyniki, wpisz nazwę miejscowości w pasku wyszukiwania powyżej.'
          : 'Spróbuj zmienić kryteria wyszukiwania lub wyczyść filtry, aby zobaczyć więcej wyników.'
        }
      </p>

      {isCityEmpty ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGeolocation}
            disabled={isLoadingLocation}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MapPin size={18} />
            {isLoadingLocation ? 'Wyszukiwanie...' : 'Użyj geolokalizacji'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            <Home size={18} />
            Strona główna
          </button>
        </div>
      ) : !isOutOfRegion ? (
        <button
          onClick={onResetFilters}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
        >
          Wyczyść filtry
        </button>
      ) : null}
    </div>
  );
};
