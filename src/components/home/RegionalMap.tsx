'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ArrowRight } from 'lucide-react';
import { MALOPOLSKIE_COUNTIES, MAP_META, DB_NAME_TO_ID, normalizePowiatName } from '@/src/components/data/malopolskie-counties';

type Layer = 'DPS' | 'KlubSenior' | 'DDSenior';

const LAYERS: { key: Layer; label: string; sub: string; href: string; colors: string[]; stroke: string; pillActive: string; pillBase: string }[] = [
  {
    key: 'DPS',
    label: 'DPS',
    sub: 'Całodobowe',
    href: '/search?type=dps',
    colors: ['#f1f5f9', '#d1fae5', '#6ee7b7', '#10b981', '#059669'],
    stroke: '#047857',
    pillActive: 'bg-emerald-600 text-white border-emerald-600',
    pillBase: 'bg-white text-emerald-700 border-emerald-200 hover:border-emerald-400',
  },
  {
    key: 'KlubSenior',
    label: 'Klub Senior+',
    sub: 'Aktywność',
    href: '/search?type=klub-senior',
    colors: ['#f1f5f9', '#fef3c7', '#fde68a', '#f59e0b', '#d97706'],
    stroke: '#b45309',
    pillActive: 'bg-amber-500 text-white border-amber-500',
    pillBase: 'bg-white text-amber-700 border-amber-200 hover:border-amber-400',
  },
  {
    key: 'DDSenior',
    label: 'DD Senior+',
    sub: 'Dzienny',
    href: '/search?type=dzienny-dom-senior',
    colors: ['#f1f5f9', '#ffedd5', '#fed7aa', '#f97316', '#ea580c'],
    stroke: '#c2410c',
    pillActive: 'bg-orange-500 text-white border-orange-500',
    pillBase: 'bg-white text-orange-700 border-orange-200 hover:border-orange-400',
  },
];

function getCountyFill(count: number, colors: string[]): string {
  if (count === 0) return colors[0];
  if (count <= 2) return colors[1];
  if (count <= 5) return colors[2];
  if (count <= 10) return colors[3];
  return colors[4];
}

interface RegionalMapProps {
  powiatCounts: Record<string, number>;
  totalFacilities?: number;
  powiatCountsByType: Record<'DPS' | 'KlubSenior' | 'DDSenior', Record<string, number>>;
  typeCounts: { DPS: number; SDS: number; KlubSenior: number; DDSenior: number };
}

export default function RegionalMap({ totalFacilities, powiatCountsByType, typeCounts }: RegionalMapProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<Layer>('DPS');

  const layer = LAYERS.find(l => l.key === activeLayer)!;
  const activeCounts = powiatCountsByType[activeLayer];

  const countById = useMemo(() => {
    const result: Record<string, number> = {};
    for (const [dbName, count] of Object.entries(activeCounts)) {
      const normalized = normalizePowiatName(dbName);
      const id = DB_NAME_TO_ID[normalized] ?? DB_NAME_TO_ID[dbName];
      if (id) result[id] = (result[id] || 0) + count;
    }
    return result;
  }, [activeCounts]);

  const hoveredCounty = hoveredId ? MALOPOLSKIE_COUNTIES.find(c => c.id === hoveredId) : null;

  const handleCountyClick = (county: typeof MALOPOLSKIE_COUNTIES[0]) => {
    const isCityCounty = parseInt(county.id) >= 1261;
    const typeParam = layer.href.split('type=')[1];
    if (isCityCounty) {
      router.push(`/search?q=${encodeURIComponent(county.name)}&city=true&type=${typeParam}`);
    } else {
      const normalized = normalizePowiatName(county.name);
      router.push(`/search?powiat=${encodeURIComponent(normalized)}&type=${typeParam}`);
    }
  };

  const layerTotal = activeLayer === 'DPS' ? typeCounts.DPS : activeLayer === 'KlubSenior' ? typeCounts.KlubSenior : typeCounts.DDSenior;

  return (
    <section className="py-12 md:py-20 bg-white relative overflow-hidden" id="regional-coverage">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-50/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12 lg:gap-20">

          {/* TEXT CONTENT */}
          <div className="flex-1 space-y-6 md:space-y-8 order-1 lg:order-1 relative z-10">
            <div className="space-y-4 md:space-y-6">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-[0.25em] shadow-sm">
                <MapPin size={14} className="text-emerald-700" /> Małopolska — 22 powiaty
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.05] tracking-tighter">
                Znajdź opiekę<br/>
                <span className="text-emerald-600 relative inline-block">
                  w Twojej okolicy
                  <svg className="absolute -bottom-3 left-0 w-full overflow-visible" viewBox="0 0 400 16" fill="none" preserveAspectRatio="none">
                    <path d="M0 12 Q100 2 200 10 Q300 18 400 6" stroke="#bbf7d0" strokeWidth="5" strokeLinecap="round"/>
                  </svg>
                </span>
              </h2>
              <p className="text-slate-500 text-xl leading-relaxed max-w-xl font-medium">
                Kliknij na dowolny powiat, aby zobaczyć dostępne placówki.
                Aktualnie mamy{' '}
                <strong className="text-slate-900 font-bold">
                  <span className="text-emerald-600 font-extrabold">{totalFacilities ?? (typeCounts.DPS + typeCounts.KlubSenior + typeCounts.DDSenior)}</span> placówek
                </strong>{' '}
                w całej Małopolsce.
              </p>
            </div>

            {/* LAYER PILLS */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Pokaż na mapie:</p>
              <div className="flex flex-wrap gap-2">
                {LAYERS.map(l => (
                  <button
                    key={l.key}
                    onClick={() => setActiveLayer(l.key)}
                    className={`flex flex-col items-start px-4 py-2.5 rounded-xl border font-black text-xs transition-all ${activeLayer === l.key ? l.pillActive : l.pillBase}`}
                  >
                    <span className="text-xs font-black leading-tight">{l.label}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider leading-tight ${activeLayer === l.key ? 'opacity-70' : 'opacity-50'}`}>{l.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* LEGEND */}
            <div className="flex flex-col gap-3 bg-white border border-stone-200 rounded-2xl p-5 shadow-sm w-fit">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Liczba placówek — {layer.label} ({layerTotal})
              </p>
              {[
                { label: 'Brak', i: 0 },
                { label: '1–2', i: 1 },
                { label: '3–5', i: 2 },
                { label: '6–10', i: 3 },
                { label: '11+', i: 4 },
              ].map(({ label, i }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded flex-shrink-0"
                    style={{ background: layer.colors[i], border: `1.5px solid ${i === 0 ? '#cbd5e1' : layer.stroke}` }}
                  />
                  <span className="text-xs font-medium text-slate-600">{label}</span>
                </div>
              ))}
            </div>

            {/* CTA BUTTONS — DESKTOP */}
            <div className="hidden lg:flex flex-col gap-3 pt-2">
              <button
                onClick={() => router.push('/search?woj=malopolskie&showAll=true')}
                className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:bg-emerald-600 hover:-translate-y-1 transition-all active:scale-95 group"
              >
                Wszystkie placówki Małopolski <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>

              {activeLayer === 'DPS' && (
                <button
                  onClick={() => router.push('/mops')}
                  className="bg-white border-2 border-slate-200 hover:border-emerald-400 text-slate-700 hover:text-emerald-700 px-10 py-5 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95 group"
                >
                  <ArrowRight size={20} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
                  Znajdź właściwy MOPS/GOPS
                </button>
              )}
            </div>
          </div>

          {/* MAP CONTAINER */}
          <div className="flex-1 order-2 lg:order-2 flex justify-center items-start relative w-full px-4 md:px-0">
            <div className="relative w-full max-w-[620px]">

              <svg
                viewBox={MAP_META.viewBox}
                className="w-full h-auto drop-shadow-sm"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Interaktywna mapa Małopolski z podziałem na powiaty"
              >
                {MALOPOLSKIE_COUNTIES.map((county) => {
                  const count = countById[county.id] ?? 0;
                  const isHovered = hoveredId === county.id;
                  return (
                    <path
                      key={county.id}
                      d={county.d}
                      fill={getCountyFill(count, layer.colors)}
                      stroke={count === 0 ? '#cbd5e1' : layer.stroke}
                      strokeWidth={isHovered ? '2' : '0.8'}
                      className="transition-all duration-200 cursor-pointer"
                      style={{ filter: isHovered ? 'brightness(0.88)' : 'none' }}
                      onMouseEnter={() => setHoveredId(county.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleCountyClick(county)}
                    />
                  );
                })}
              </svg>

              {/* TOOLTIP */}
              {hoveredCounty && (() => {
                const count = countById[hoveredCounty.id] ?? 0;
                const xPct = (hoveredCounty.centroid.x / 600) * 100;
                const yPct = (hoveredCounty.centroid.y / 345.66) * 100;
                return (
                  <div
                    className="absolute z-40 pointer-events-none"
                    style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%, -110%)' }}
                  >
                    <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 min-w-[150px] text-center">
                      <p className="font-bold text-sm leading-tight capitalize">{hoveredCounty.name}</p>
                      <p className="text-slate-300 text-xs mt-0.5">
                        {layer.label}:{' '}
                        <span className="font-black text-white">
                          {count === 0 ? 'brak' : `${count} ${count === 1 ? 'placówka' : count < 5 ? 'placówki' : 'placówek'}`}
                        </span>
                      </p>
                    </div>
                    <div className="w-0 h-0 mx-auto border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-900" />
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      </div>

      {/* CTA BUTTON — MOBILE */}
      <div className="lg:hidden mt-10 px-4 flex justify-center">
        <button
          onClick={() => router.push('/search?woj=malopolskie&showAll=true')}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl hover:bg-emerald-600 transition-all active:scale-95 group text-sm w-full sm:w-auto justify-center"
        >
          Wszystkie placówki Małopolski <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </section>
  );
}
