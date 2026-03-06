'use client';

import { useState } from 'react';
import { Search, Phone, Mail, Globe, MapPin, Building2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatPhoneNumber } from '@/lib/phone-utils';

interface MopsRecord {
  id: number;
  city: string;
  cityDisplay: string;
  typ: string;
  gmina: string | null;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  website: string | null;
  wojewodztwo: string;
  verified: boolean;
  notes: string | null;
}

export default function MopsFinderPage() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<MopsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/mops/search?q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft size={20} />
            <span className="font-bold">Powrót do strony głównej</span>
          </Link>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-3">
            Znajdź właściwy MOPS/GOPS
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            Wpisz miasto lub gminę, gdzie <strong>mieszka</strong> osoba potrzebująca opieki w DPS/ŚDS
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Important Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-xl mb-8">
          <div className="flex items-start gap-3">
            <Building2 size={24} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">⚠️ Ważne!</h3>
              <p className="text-blue-800 leading-relaxed">
                Wniosek o skierowanie do DPS/ŚDS składa się w ośrodku pomocy społecznej
                <strong> według miejsca zamieszkania osoby potrzebującej</strong>,
                nie lokalizacji placówki.
              </p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-stone-200">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Gdzie mieszka osoba potrzebująca opieki?
            </label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="np. Kraków, Nowy Sącz, Grybów..."
                  className="w-full pl-12 pr-4 py-4 border-2 border-stone-200 rounded-xl text-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !search.trim()}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black rounded-xl transition-all disabled:cursor-not-allowed text-sm uppercase tracking-widest"
              >
                {loading ? 'Szukam...' : 'Szukaj'}
              </button>
            </div>
          </div>
        </form>

        {/* Results */}
        {searched && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-slate-500">
                Wyszukiwanie...
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center">
                <p className="text-slate-600 text-lg mb-2">
                  Nie znaleziono ośrodka dla: <strong>{search}</strong>
                </p>
                <p className="text-sm text-slate-500">
                  Spróbuj wpisać pełną nazwę miasta lub gminy
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 font-bold">
                  Znaleziono {results.length} {results.length === 1 ? 'ośrodek' : 'ośrodki'}:
                </p>

                {results.map((mops) => (
                  <div key={mops.id} className="bg-white p-6 rounded-2xl border-2 border-stone-200 hover:border-blue-300 transition-all shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-600 text-white text-xs font-black px-2 py-1 rounded uppercase">
                            {mops.typ}
                          </span>
                          <span className="text-xs text-slate-500">
                            {mops.wojewodztwo}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-1">
                          {mops.name}
                        </h3>
                        <p className="text-slate-600 flex items-center gap-2">
                          <MapPin size={16} />
                          {mops.address}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-stone-100">
                      <a
                        href={`tel:${mops.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors"
                      >
                        <Phone size={18} />
                        <span className="font-bold">{formatPhoneNumber(mops.phone)}</span>
                      </a>

                      {mops.email && (
                        <a
                          href={`mailto:${mops.email}`}
                          className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors"
                        >
                          <Mail size={18} />
                          <span className="text-sm truncate">{mops.email}</span>
                        </a>
                      )}

                      {mops.website && (
                        <a
                          href={mops.website.startsWith('http') ? mops.website : `https://${mops.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors"
                        >
                          <Globe size={18} />
                          <span className="text-sm truncate">Strona WWW</span>
                        </a>
                      )}
                    </div>

                    {mops.notes && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800">{mops.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
