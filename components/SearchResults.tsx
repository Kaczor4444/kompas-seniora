'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getProfileOpiekiNazwy, profileOpiekiKody } from '@/src/data/profileopieki';
import SortDropdown from '@/src/components/search/SortDropdown'; // ✅ DODANE

const FacilityMap = dynamic(() => import('@/components/FacilityMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
});

interface Facility {
  id: number;
  nazwa: string;
  typ_placowki: string;
  powiat: string;
  miejscowosc: string;
  koszt_pobytu: number | null;
  telefon: string | null;
  latitude: number | null;
  longitude: number | null;
  profil_opieki?: string | null;
}

interface ActiveFilters {
  wojewodztwo?: string;
  powiat?: string;
  type?: string;
  careTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
  showFree?: boolean;
}

interface SearchResultsProps {
  query: string;
  type: string;
  results: Facility[];
  message: string;
  activeFilters?: ActiveFilters;
}

export default function SearchResults({ query, type, results, message, activeFilters }: SearchResultsProps) {
  const router = useRouter();

  // Funkcja do usuwania pojedynczego filtra
  const removeFilter = (filterType: string, value?: string) => {
    const params = new URLSearchParams(window.location.search);
    
    switch (filterType) {
      case 'wojewodztwo':
        params.delete('woj');
        params.delete('powiat'); // Clear powiat when removing wojewodztwo
        break;
      case 'powiat':
        params.delete('powiat');
        break;
      case 'type':
        params.delete('type');
        break;
      case 'care':
        if (value && activeFilters?.careTypes) {
          const remaining = activeFilters.careTypes.filter(t => t !== value);
          if (remaining.length > 0) {
            params.set('care', remaining.join(','));
          } else {
            params.delete('care');
          }
        } else {
          params.delete('care');
        }
        break;
      case 'price':
        params.delete('min');
        params.delete('max');
        break;
      case 'free':
        params.delete('free');
        break;
    }
    
    router.push(`/search?${params.toString()}`);
  };

  // Mapowanie nazw
  const wojewodztwaLabels: Record<string, string> = {
    'malopolskie': 'Małopolskie',
    'slaskie': 'Śląskie',
    'all': 'Wszystkie',
  };

  const typeLabels: Record<string, string> = {
    'dps': 'DPS',
    'sds': 'ŚDS',
    'all': 'Wszystkie',
  };

  // Sprawdź czy są aktywne filtry
  const hasActiveFilters = activeFilters && (
    activeFilters.wojewodztwo ||
    activeFilters.powiat ||
    activeFilters.type ||
    (activeFilters.careTypes && activeFilters.careTypes.length > 0) ||
    activeFilters.minPrice ||
    activeFilters.maxPrice ||
    activeFilters.showFree
  );

  return (
    <>
      {/* Message */}
      {message && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">{message}</p>
        </div>
      )}

      {/* AKTYWNE FILTRY JAKO BADGES */}
      {hasActiveFilters && (
        <div className="mb-6 p-4 bg-white border border-neutral-200 rounded-lg">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-neutral-700">Aktywne filtry:</span>
            
            {/* Województwo */}
            {activeFilters?.wojewodztwo && (
              <button
                onClick={() => removeFilter('wojewodztwo')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors"
              >
                {wojewodztwaLabels[activeFilters.wojewodztwo] || activeFilters.wojewodztwo}
                <span className="text-accent-600">×</span>
              </button>
            )}

            {/* Powiat */}
            {activeFilters?.powiat && (
              <button
                onClick={() => removeFilter('powiat')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors"
              >
                {activeFilters.powiat}
                <span className="text-accent-600">×</span>
              </button>
            )}

            {/* Typ placówki */}
            {activeFilters?.type && (
              <button
                onClick={() => removeFilter('type')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors"
              >
                {typeLabels[activeFilters.type] || activeFilters.type}
                <span className="text-accent-600">×</span>
              </button>
            )}

            {/* Profile opieki */}
            {activeFilters?.careTypes && activeFilters.careTypes.map((code) => (
              <button
                key={code}
                onClick={() => removeFilter('care', code)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors"
              >
                {profileOpiekiKody[code as keyof typeof profileOpiekiKody]}
                <span className="text-accent-600">×</span>
              </button>
            ))}

            {/* Cena */}
            {(activeFilters?.minPrice || activeFilters?.maxPrice) && (
              <button
                onClick={() => removeFilter('price')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors"
              >
                {activeFilters.minPrice && activeFilters.maxPrice
                  ? `${activeFilters.minPrice.toLocaleString('pl-PL')} - ${activeFilters.maxPrice.toLocaleString('pl-PL')} zł`
                  : activeFilters.minPrice
                  ? `od ${activeFilters.minPrice.toLocaleString('pl-PL')} zł`
                  : `do ${activeFilters.maxPrice?.toLocaleString('pl-PL')} zł`
                }
                <span className="text-accent-600">×</span>
              </button>
            )}

            {/* Bezpłatne */}
            {activeFilters?.showFree && (
              <button
                onClick={() => removeFilter('free')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm hover:bg-accent-100 transition-colors"
              >
                Tylko bezpłatne
                <span className="text-accent-600">×</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✅ SORTOWANIE - DODANE */}
      {results.length > 0 && (
        <SortDropdown totalResults={results.length} />
      )}

      {/* Layout: Lista + Mapa */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Lista placówek - 2/3 szerokości na desktop */}
          <div className="lg:col-span-2 space-y-4">
            {results.map((facility) => {
              // Mapowanie kodów na czytelne nazwy
              const profileNazwy = facility.profil_opieki 
                ? getProfileOpiekiNazwy(facility.profil_opieki)
                : [];

              return (
                <div
                  key={facility.id}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {facility.nazwa}
                  </h2>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {facility.typ_placowki} • {facility.powiat}
                  </p>

                  <div className="space-y-2 mb-4">
                    {/* Lokalizacja */}
                    <div>
                      <span className="font-medium text-gray-700">Lokalizacja</span>
                      <p className="text-gray-600">{facility.miejscowosc}</p>
                      <p className="text-sm text-gray-500">Powiat: {facility.powiat}</p>
                    </div>

                    {/* PROFIL OPIEKI - Z MAPOWANIEM */}
                    {profileNazwy.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Profil opieki</span>
                        <div className="mt-1 space-y-1">
                          {profileNazwy.map((nazwa, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 mr-2 mb-1 text-xs bg-accent-50 text-accent-700 rounded-md"
                            >
                              {nazwa}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Koszt miesięczny */}
                    <div>
                      <span className="font-medium text-gray-700">Koszt miesięczny</span>
                      <p className={`text-lg font-semibold ${facility.koszt_pobytu ? 'text-accent-600' : 'text-green-600'}`}>
                        {facility.koszt_pobytu
                          ? `${Math.round(facility.koszt_pobytu).toLocaleString('pl-PL')} zł/mc`
                          : 'Bezpłatne'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/placowka/${facility.id}`}
                      className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700"
                    >
                      Zobacz szczegóły
                    </Link>
                    {facility.telefon && (
                      <a
                        href={`tel:${facility.telefon.replace(/\s/g, '')}`}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        📞 {facility.telefon}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mapa - 1/3 szerokości na desktop, sticky */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Lokalizacja na mapie
              </h3>
              <FacilityMap facilities={results} mode="multiple" />
            </div>
          </div>

        </div>
      )}
    </>
  );
}