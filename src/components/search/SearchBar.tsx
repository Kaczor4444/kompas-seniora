"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Banknote, 
  Bed, 
  Users, 
  Building2, 
  Phone, 
  Mail, 
  Globe,
  Search,
  ChevronRight
} from 'lucide-react';
import { getProfileOpiekiNazwy } from '../../data/profileopieki';

interface Placowka {
  id: number;
  nazwa: string;
  typ_placowki: string;
  prowadzacy: string;
  miejscowosc: string;
  ulica: string | null;
  kod_pocztowy: string | null;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  koszt_pobytu: number | null;
  telefon: string | null;
  email: string | null;
  www: string | null;
  liczba_miejsc: number | null;
  profil_opieki: string | null;
}

interface SearchBarProps {
  selectedType?: string;
}

// Helper: Formatowanie kwoty
function formatPrice(amount: number | null): string {
  if (amount === null) return 'Brak danych';
  if (amount === 0) return 'Bezpłatne';
  
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' zł';
}

// Helper: Pełny adres
function formatAddress(placowka: Placowka): string {
  const parts = [];
  
  if (placowka.ulica) parts.push(placowka.ulica);
  if (placowka.kod_pocztowy || placowka.miejscowosc) {
    const cityPart = [placowka.kod_pocztowy, placowka.miejscowosc]
      .filter(Boolean)
      .join(' ');
    parts.push(cityPart);
  }
  
  return parts.join(', ') || placowka.miejscowosc;
}

export default function SearchBar({ selectedType = 'WSZYSTKIE' }: SearchBarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [placowki, setPlacowki] = useState<Placowka[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('search', searchQuery);
      if (selectedType !== 'WSZYSTKIE') {
        params.append('type', selectedType);
      }
      
      const response = await fetch(`/api/placowki?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setPlacowki(data.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-search when selectedType changes
  useEffect(() => {
    if (searchQuery.trim() && placowki.length > 0) {
      handleSearch();
    }
  }, [selectedType]);

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSearch}>
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 flex items-center overflow-hidden">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Wpisz miejscowość, np. Kamienica, Kraków, Limanowa..."
            className="flex-1 px-6 py-4 text-lg focus:outline-none"
          />
          <button
            type="submit"
            disabled={!searchQuery.trim() || loading}
            className="bg-accent-500 hover:bg-accent-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white px-8 py-4 font-semibold transition-colors flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            {loading ? 'Szukam...' : 'Szukaj'}
          </button>
        </div>
        <p className="text-sm text-neutral-500 text-center mt-3">
          Nie musisz znać powiatu - wpisz po prostu nazwę miejscowości
        </p>
      </form>

      {/* Results */}
      {placowki.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Znalezione placówki ({placowki.length})
          </h2>
          <div className="grid gap-6">
            {placowki.map((placowka) => {
              // DEBUG: Sprawdź co przychodzi z API
              console.log(`[${placowka.nazwa}] koszt_pobytu:`, placowka.koszt_pobytu, 'typeof:', typeof placowka.koszt_pobytu);
              const priceFormatted = formatPrice(placowka.koszt_pobytu);
              console.log(`[${placowka.nazwa}] formatted:`, priceFormatted);
              
              return (
                <div 
                  key={placowka.id} 
                  className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-neutral-900 mb-1">
                      {placowka.nazwa}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {placowka.typ_placowki} • {placowka.powiat}
                    </p>
                  </div>

                  {/* Main Info Grid */}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {/* Left Column */}
                    <div className="space-y-2">
                      {/* Adres */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-accent-500" />
                          <p className="text-sm font-medium text-neutral-500">Adres</p>
                        </div>
                        <p className="text-neutral-900 ml-6">{formatAddress(placowka)}</p>
                        <p className="text-sm text-neutral-600 ml-6">
                          Gmina: {placowka.gmina}
                        </p>
                        <p className="text-sm text-neutral-600 ml-6">
                          Powiat: {placowka.powiat}
                        </p>
                      </div>

                      {/* Prowadzący */}
                      {placowka.prowadzacy && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-4 h-4 text-neutral-500" />
                            <p className="text-sm font-medium text-neutral-500">Prowadzący</p>
                          </div>
                          <p className="text-neutral-900 text-sm ml-6">{placowka.prowadzacy}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-2">
                      {/* Koszt */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Banknote className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-medium text-neutral-500">Koszt miesięczny</p>
                        </div>
                        <p className="text-2xl font-bold ml-6">
                          <span className={placowka.koszt_pobytu === 0 ? "text-green-600" : "text-accent-600"}>
                            {priceFormatted}
                          </span>
                          {placowka.koszt_pobytu !== null && placowka.koszt_pobytu > 0 && (
                            <span className="text-sm font-normal text-neutral-600">/mc</span>
                          )}
                        </p>
                      </div>

                      {/* Liczba miejsc */}
                      {placowka.liczba_miejsc && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Bed className="w-4 h-4 text-neutral-500" />
                            <p className="text-sm font-medium text-neutral-500">Liczba miejsc</p>
                          </div>
                          <p className="text-neutral-900 ml-6">{placowka.liczba_miejsc}</p>
                        </div>
                      )}

                      {/* Profil opieki */}
                      {placowka.profil_opieki && (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-neutral-500" />
                            <p className="text-sm font-medium text-neutral-500">Profil opieki</p>
                          </div>
                          <div className="ml-6 space-y-1">
                            {(() => {
                              const profil = placowka.profil_opieki.trim();
                              const isKody = /^[A-I](,[A-I])*$/.test(profil);
                              
                              if (isKody) {
                                return getProfileOpiekiNazwy(profil).map((nazwa, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="text-accent-600 font-bold">•</span>
                                    <p className="text-neutral-800 text-sm font-medium">{nazwa}</p>
                                  </div>
                                ));
                              } else {
                                return profil.split(',')
                                  .map(opis => opis.trim())
                                  .filter(opis => opis.length > 0)
                                  .map((opis, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <span className="text-accent-600 font-bold">•</span>
                                      <p className="text-neutral-800 text-sm font-medium">{opis}</p>
                                    </div>
                                  ));
                              }
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Bar */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-200">
                    {placowka.telefon && (
                      <a 
                        href={`tel:${placowka.telefon}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-accent-50 text-accent-700 hover:bg-accent-100 rounded-lg font-medium transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {placowka.telefon}
                      </a>
                    )}

                    {placowka.email && (
                      <a 
                        href={`mailto:${placowka.email}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Email
                      </a>
                    )}

                    {placowka.www && (
                      <a 
                        href={placowka.www}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        Strona WWW
                      </a>
                    )}

                    {/* Spacer - wypycha przycisk szczegółów na prawo */}
                    <div className="flex-1"></div>

                    {/* Przycisk szczegółów */}
                    <button
                      onClick={() => router.push(`/placowka/${placowka.id}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-accent-500 text-white hover:bg-accent-600 rounded-lg font-medium transition-colors ml-auto"
                    >
                      Zobacz szczegóły
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}