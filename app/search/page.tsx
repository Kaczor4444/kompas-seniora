'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Banknote, 
  Phone, 
  ChevronRight,
  ArrowLeft,
  Info
} from 'lucide-react';

interface Placowka {
  id: number;
  nazwa: string;
  typ_placowki: string;
  miejscowosc: string;
  powiat: string;
  telefon: string | null;
  koszt_pobytu: number | null;
}

interface TerytSuggestion {
  found: boolean;
  nazwa: string;
  typ: string;
  powiat: string;
  message: string;
}

interface SearchResponse {
  results: Placowka[];
  terytSuggestion: TerytSuggestion | null;
  query: string;
}

function formatPrice(amount: number | null): string {
  if (amount === null) return 'Brak danych';
  if (amount === 0) return 'Bezpłatne';
  
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' zł';
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const typ = searchParams.get('typ') || 'all';
  
  const [results, setResults] = useState<Placowka[]>([]);
  const [terytSuggestion, setTerytSuggestion] = useState<TerytSuggestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (typ !== 'all') params.append('typ', typ);

        const response = await fetch(`/api/search?${params}`);
        const data = await response.json();
        
        // Handle both old format (array) and new format (object with results)
        if (Array.isArray(data)) {
          setResults(data);
          setTerytSuggestion(null);
        } else {
          setResults(data.results || []);
          setTerytSuggestion(data.terytSuggestion || null);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, typ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-neutral-700 hover:text-neutral-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Powrót do strony głównej
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            {query ? `Wyniki dla: "${query}"` : 'Wszystkie placówki'}
          </h1>
          <p className="text-neutral-600">
            {typ !== 'all' && `Typ: ${typ} • `}
            {loading ? 'Szukam...' : `Znaleziono ${results.length} placówek`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
            <p className="mt-4 text-neutral-600">Ładowanie wyników...</p>
          </div>
        ) : (
          <>
            {/* TERYT Suggestion - pokazuj gdy brak wyników ale znaleziono lokalizację */}
            {results.length === 0 && terytSuggestion && (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Rozpoznano lokalizację
                    </h3>
                    <p className="text-blue-800 mb-3">
                      <span className="font-medium">{terytSuggestion.nazwa}</span>
                      {' '}({terytSuggestion.typ}, powiat {terytSuggestion.powiat})
                    </p>
                    <p className="text-blue-700">
                      Nie znaleziono placówek w tej lokalizacji. Spróbuj wyszukać w sąsiednich miejscowościach lub powiatach.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* No results - bez TERYT suggestion */}
            {results.length === 0 && !terytSuggestion && (
              <div className="text-center py-12 bg-neutral-50 rounded-xl">
                <p className="text-neutral-500 text-lg mb-4">Nie znaleziono placówek</p>
                <button
                  onClick={() => router.push('/')}
                  className="text-accent-600 hover:text-accent-700 font-medium"
                >
                  Wróć i spróbuj ponownie
                </button>
              </div>
            )}

            {/* Results */}
            {results.length > 0 && (
              <div className="grid gap-6">
                {results.map((placowka) => (
                  <div 
                    key={placowka.id} 
                    className="bg-white p-4 md:p-6 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="mb-4">
                      <h3 className="text-base md:text-xl font-semibold text-neutral-900 mb-1 leading-tight">
                        {placowka.nazwa}
                      </h3>
                      <p className="text-xs md:text-sm text-neutral-600">
                        {placowka.typ_placowki} • {placowka.powiat}
                      </p>
                    </div>

                    {/* Main Info Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {/* Left Column */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-accent-500" />
                            <p className="text-xs md:text-sm font-medium text-neutral-500">Lokalizacja</p>
                          </div>
                          <p className="text-sm md:text-base text-neutral-900 ml-6">{placowka.miejscowosc}</p>
                          <p className="text-xs md:text-sm text-neutral-600 ml-6">Powiat: {placowka.powiat}</p>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Banknote className="w-4 h-4 text-green-600" />
                            <p className="text-xs md:text-sm font-medium text-neutral-500">Koszt miesięczny</p>
                          </div>
                          <p className="text-lg md:text-2xl font-bold ml-6">
                            <span className={placowka.koszt_pobytu === 0 ? "text-green-600" : "text-accent-600"}>
                              {formatPrice(placowka.koszt_pobytu)}
                            </span>
                            {placowka.koszt_pobytu !== null && placowka.koszt_pobytu > 0 && (
                              <span className="text-xs md:text-sm font-normal text-neutral-600">/mc</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Bar */}
                    <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-200">
                      {placowka.telefon && (
                        <a 
                          href={`tel:${placowka.telefon}`}
                          className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-accent-50 text-accent-700 hover:bg-accent-100 rounded-lg text-sm md:text-base font-medium transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          <span className="text-xs md:text-sm">{placowka.telefon}</span>
                        </a>
                      )}

                      <div className="flex-1"></div>

                      <button
                        onClick={() => router.push(`/placowka/${placowka.id}`)}
                        className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-accent-500 text-white hover:bg-accent-600 rounded-lg text-sm md:text-base font-medium transition-colors ml-auto"
                      >
                        <span className="text-xs md:text-sm">Zobacz szczegóły</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}