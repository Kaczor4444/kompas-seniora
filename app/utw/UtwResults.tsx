'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { GraduationCap, Phone, Mail, Globe, MapPin, Map, List, Search, ChevronDown } from 'lucide-react';

const UtwMap = dynamic(() => import('./UtwMap'), { ssr: false });

interface UtwEntry {
  id: number;
  nazwa: string;
  ulica: string | null;
  miejscowosc: string;
  kod_pocztowy: string | null;
  powiat: string;
  telefon: string | null;
  email: string | null;
  www: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  utw: UtwEntry[];
  powiaty: string[];
  initialPowiat?: string;
}

export default function UtwResults({ utw, powiaty, initialPowiat }: Props) {
  const [search, setSearch]         = useState('');
  const [powiat, setPowiat]         = useState(initialPowiat ?? '');
  const [view, setView]             = useState<'list' | 'map'>('list');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return utw.filter(u => {
      if (powiat && u.powiat !== powiat) return false;
      if (q && !u.nazwa.toLowerCase().includes(q) && !u.miejscowosc.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [utw, search, powiat]);

  return (
    <main className="min-h-screen bg-stone-50">

      {/* HERO */}
      <section className="relative bg-white border-b border-stone-200 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-indigo-50 opacity-60" />
        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-violet-100 rounded-2xl">
              <GraduationCap className="w-8 h-8 text-violet-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 text-center mb-4 tracking-tight">
            Aktywny senior w Małopolsce
          </h1>
          <p className="text-lg text-slate-600 text-center max-w-2xl mx-auto leading-relaxed">
            Uniwersytety Trzeciego Wieku to miejsca dla seniorów, którzy chcą się uczyć,
            poznawać ludzi i cieszyć się życiem. Wykłady, kursy językowe, warsztaty, wycieczki —
            zazwyczaj bezpłatnie lub za symboliczną składkę członkowską.
          </p>
          <p className="text-center mt-4 text-sm font-medium text-violet-600">
            {utw.length} placówek w Małopolsce
          </p>
        </div>
      </section>

      {/* FILTRY */}
      <section className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">

          {/* Szukaj */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Szukaj po nazwie lub mieście…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Powiat */}
          <div className="relative">
            <select
              value={powiat}
              onChange={e => setPowiat(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="">Wszystkie powiaty</option>
              {powiaty.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Widok */}
          <div className="flex border border-stone-300 rounded-lg overflow-hidden shrink-0">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                view === 'list' ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 hover:bg-stone-50'
              }`}
            >
              <List className="w-4 h-4" /> Lista
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                view === 'map' ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 hover:bg-stone-50'
              }`}
            >
              <Map className="w-4 h-4" /> Mapa
            </button>
          </div>
        </div>
      </section>

      {/* WYNIKI */}
      <section className="max-w-5xl mx-auto px-4 py-6">

        <p className="text-sm text-slate-500 mb-4">
          {filtered.length === utw.length
            ? `${utw.length} placówek`
            : `${filtered.length} z ${utw.length} placówek`}
          {powiat && <span className="font-medium text-slate-700"> · powiat {powiat}</span>}
        </p>

        {view === 'map' ? (
          <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm h-[600px]">
            <UtwMap utw={filtered} />
          </div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-lg font-medium">Brak wyników</p>
                <p className="text-sm mt-1">Spróbuj zmienić filtry</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(u => (
                  <UtwCard key={u.id} utw={u} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* INFO */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="bg-violet-50 border border-violet-100 rounded-2xl p-6 text-sm text-slate-600">
          <p className="font-semibold text-violet-800 mb-1">Ważna informacja</p>
          <p>
            UTW to zazwyczaj stowarzyszenia lub fundacje — dane kontaktowe mogą się zmieniać.
            Przed wizytą zadzwoń lub napisz bezpośrednio do placówki, żeby potwierdzić
            aktualne godziny zajęć i warunki dołączenia.
          </p>
        </div>
      </section>
    </main>
  );
}

// ── Karta UTW ──────────────────────────────────────────────────────────────

function UtwCard({ utw }: { utw: UtwEntry }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md transition-shadow">

      {/* Nagłówek */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-violet-50 rounded-xl shrink-0 mt-0.5">
          <GraduationCap className="w-5 h-5 text-violet-600" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 leading-snug">{utw.nazwa}</h2>
          <div className="flex items-center gap-1 mt-1 text-sm text-slate-500">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>{utw.miejscowosc}</span>
            {utw.powiat && (
              <span className="text-slate-400">· pow. {utw.powiat}</span>
            )}
          </div>
        </div>
      </div>

      {/* Adres */}
      {utw.ulica && (
        <p className="text-xs text-slate-500 mb-3 pl-10">
          {utw.ulica}{utw.kod_pocztowy ? `, ${utw.kod_pocztowy} ${utw.miejscowosc}` : ''}
        </p>
      )}

      {/* Kontakt */}
      <div className="flex flex-wrap gap-2 pl-10">
        {utw.telefon && (
          <a
            href={`tel:${utw.telefon.replace(/\s/g, '')}`}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-violet-700 bg-stone-50 hover:bg-violet-50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {utw.telefon}
          </a>
        )}
        {utw.email && (
          <a
            href={`mailto:${utw.email}`}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-violet-700 bg-stone-50 hover:bg-violet-50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            {utw.email}
          </a>
        )}
        {utw.www && (
          <a
            href={utw.www.startsWith('http') ? utw.www : `https://${utw.www}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-violet-700 bg-stone-50 hover:bg-violet-50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            Strona WWW
          </a>
        )}
      </div>
    </div>
  );
}
