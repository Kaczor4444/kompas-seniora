'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ArrowRight } from 'lucide-react';
import { MALOPOLSKIE_COUNTIES, MAP_META, DB_NAME_TO_ID, normalizePowiatName } from '@/src/components/data/malopolskie-counties';

interface RegionalMapProps {
  powiatCounts: Record<string, number>;
  totalFacilities?: number;
}

function getCountyFill(count: number): string {
  if (count === 0) return '#f1f5f9';   // slate-100 — brak placówek
  if (count <= 2) return '#d1fae5';    // emerald-100
  if (count <= 5) return '#6ee7b7';    // emerald-300
  if (count <= 10) return '#10b981';   // emerald-500
  return '#059669';                     // emerald-600 — dużo placówek
}

function getCountyStroke(count: number, isHovered: boolean): string {
  if (isHovered) return '#064e3b';
  if (count === 0) return '#cbd5e1';
  return '#047857';
}

export default function RegionalMap({ powiatCounts, totalFacilities }: RegionalMapProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Build map: SVG id → facility count
  const countById = useMemo(() => {
    const result: Record<string, number> = {};
    for (const [dbName, count] of Object.entries(powiatCounts)) {
      const normalized = normalizePowiatName(dbName);
      const id = DB_NAME_TO_ID[normalized] ?? DB_NAME_TO_ID[dbName];
      if (id) result[id] = count;
    }
    return result;
  }, [powiatCounts]);

  const hoveredCounty = hoveredId
    ? MALOPOLSKIE_COUNTIES.find(c => c.id === hoveredId)
    : null;

  const handleCountyClick = (county: typeof MALOPOLSKIE_COUNTIES[0]) => {
    const normalized = normalizePowiatName(county.name);
    router.push(`/search?powiat=${encodeURIComponent(normalized)}`);
  };

  return (
    <section className="py-12 md:py-20 bg-white relative overflow-hidden" id="regional-coverage">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-50/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12 lg:gap-20">

          {/* TEXT CONTENT */}
          <div className="flex-1 space-y-6 md:space-y-8 order-1 lg:order-1 relative z-10">
            <div className="space-y-4 md:space-y-6">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-[0.25em] shadow-sm">
                <MapPin size={14} className="text-emerald-700" /> Małopolska — 22 powiaty
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 leading-[1.05]">
                Znajdź opiekę<br/>
                <span className="text-emerald-700 relative inline-block">
                  w Twojej okolicy
                  <svg className="absolute -bottom-4 left-0 w-full h-5 text-emerald-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>
              <p className="text-slate-500 text-xl leading-relaxed max-w-xl font-medium">
                Kliknij na dowolny powiat, aby zobaczyć dostępne placówki DPS i ŚDS.
                Aktualnie mamy <strong className="text-slate-900 font-bold"><span className="text-emerald-600 font-extrabold">{totalFacilities ?? Object.values(powiatCounts).reduce((a, b) => a + b, 0)}</span> zweryfikowanych placówek</strong> w całej Małopolsce.
              </p>
            </div>

            {/* LEGEND */}
            <div className="flex flex-col gap-3 bg-white border border-stone-200 rounded-2xl p-5 shadow-sm w-fit">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Liczba placówek w powiecie</p>
              {[
                { label: 'Brak danych', color: '#f1f5f9', stroke: '#cbd5e1' },
                { label: '1–2 placówki', color: '#d1fae5', stroke: '#047857' },
                { label: '3–5 placówek', color: '#6ee7b7', stroke: '#047857' },
                { label: '6–10 placówek', color: '#10b981', stroke: '#047857' },
                { label: '11+ placówek', color: '#059669', stroke: '#047857' },
              ].map(({ label, color, stroke }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded flex-shrink-0"
                    style={{ background: color, border: `1.5px solid ${stroke}` }}
                  />
                  <span className="text-xs font-medium text-slate-600">{label}</span>
                </div>
              ))}
            </div>

            {/* CTA BUTTON — DESKTOP */}
            <div className="hidden lg:flex pt-2">
              <button
                onClick={() => router.push('/search')}
                className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:bg-emerald-600 hover:-translate-y-1 transition-all active:scale-95 group"
              >
                Wszystkie placówki Małopolski <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
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
                      fill={getCountyFill(count)}
                      stroke={getCountyStroke(count, isHovered)}
                      strokeWidth={isHovered ? '2' : '0.8'}
                      className="transition-all duration-200 cursor-pointer"
                      style={{
                        filter: isHovered ? 'brightness(0.88)' : 'none',
                      }}
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
                    style={{
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      transform: 'translate(-50%, -110%)',
                    }}
                  >
                    <div className="bg-emerald-950 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-800 min-w-[140px] text-center">
                      <p className="font-bold text-sm leading-tight capitalize">{hoveredCounty.name}</p>
                      <p className="text-emerald-300 text-xs mt-0.5">
                        {count === 0
                          ? 'brak placówek'
                          : `${count} ${count === 1 ? 'placówka' : count < 5 ? 'placówki' : 'placówek'}`}
                      </p>
                    </div>
                    <div className="w-0 h-0 mx-auto border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-emerald-950"></div>
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
          onClick={() => router.push('/search')}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl hover:bg-emerald-600 transition-all active:scale-95 group text-sm w-full sm:w-auto justify-center"
        >
          Wszystkie placówki Małopolski <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </section>
  );
}
