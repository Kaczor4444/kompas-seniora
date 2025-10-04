"use client";

import { useState, useEffect } from 'react';

interface Placowka {
  id: number;
  nazwa: string;
  typ_placowki: string;
  miejscowosc: string;
  koszt_pobytu: number | null;
  telefon: string | null;
}

interface SearchBarProps {
  selectedType?: string;
}

export default function SearchBar({ selectedType = 'WSZYSTKIE' }: SearchBarProps) {
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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
          <div className="grid gap-4">
            {placowki.map((placowka) => (
              <div key={placowka.id} className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">{placowka.nazwa}</h3>
                <div className="text-neutral-700 space-y-2">
                  <p><span className="font-medium">Typ:</span> {placowka.typ_placowki}</p>
                  <p><span className="font-medium">Miejscowość:</span> {placowka.miejscowosc}</p>
                  {placowka.koszt_pobytu !== null && (
                    <p><span className="font-medium">Koszt:</span> {placowka.koszt_pobytu === 0 ? 'Bezpłatne' : `${placowka.koszt_pobytu} zł/miesiąc`}</p>
                  )}
                  {placowka.telefon && (
                    <p><span className="font-medium">Telefon:</span> 
                      <a href={`tel:${placowka.telefon}`} className="text-accent-600 hover:text-accent-700 hover:underline ml-1">
                        {placowka.telefon}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}