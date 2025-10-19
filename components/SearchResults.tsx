'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getProfileOpiekiNazwy } from '@/src/data/profileopieki';

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

interface SearchResultsProps {
  query: string;
  type: string;
  results: Facility[];
  message: string;
}

export default function SearchResults({ query, type, results, message }: SearchResultsProps) {
  return (
    <>
      {/* Message */}
      {message && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">{message}</p>
        </div>
      )}

      {/* Layout: Lista + Mapa */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Lista placówek - 2/3 szerokości na desktop */}
          <div className="lg:col-span-2 space-y-4">
            {results.map((facility) => {
              // ✅ Mapowanie kodów na czytelne nazwy
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

                    {/* ✅ PROFIL OPIEKI - Z MAPOWANIEM */}
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