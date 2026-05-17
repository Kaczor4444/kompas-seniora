'use client';

import { useState, useEffect } from 'react';
import { MALOPOLSKIE_COUNTIES, MAP_META, DB_NAME_TO_ID, normalizePowiatName } from '@/src/components/data/malopolskie-counties';

interface PriceData {
  avg: number;
  count: number;
}

function getPriceFill(avg: number | undefined): string {
  if (!avg) return '#f1f5f9';
  if (avg < 7000) return '#d1fae5';
  if (avg < 8000) return '#6ee7b7';
  if (avg < 9000) return '#10b981';
  return '#059669';
}

function formatPrice(avg: number): string {
  return avg.toLocaleString('pl-PL') + ' zł';
}

function pluralCount(n: number): string {
  if (n === 1) return '1 DPS';
  if (n < 5) return `${n} DPS`;
  return `${n} DPS`;
}

interface PriceMapProps {
  onPowiatClick?: (powiatName: string) => void;
  highlightedPowiat?: string;
}

export default function PriceMap({ onPowiatClick, highlightedPowiat }: PriceMapProps) {
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/powiat-prices')
      .then(r => r.json())
      .then(d => { if (d.success) setPriceData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Build SVG id → price data
  const priceById: Record<string, PriceData> = {};
  for (const [dbName, data] of Object.entries(priceData)) {
    const normalized = normalizePowiatName(dbName);
    const id = DB_NAME_TO_ID[normalized] ?? DB_NAME_TO_ID[dbName];
    if (id) priceById[id] = data;
  }

  // Highlighted powiat id
  const highlightedId = highlightedPowiat
    ? (DB_NAME_TO_ID[normalizePowiatName(highlightedPowiat)] ?? DB_NAME_TO_ID[highlightedPowiat] ?? null)
    : null;

  const hoveredCounty = hoveredId ? MALOPOLSKIE_COUNTIES.find(c => c.id === hoveredId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
          Średnia cena DPS — 2026
        </p>
        {loading && (
          <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
        )}
      </div>

      {/* SVG Map */}
      <div className="relative">
        <svg
          viewBox={MAP_META.viewBox}
          className="w-full h-auto drop-shadow-sm"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Mapa Małopolski — średnie ceny DPS per powiat"
        >
          {MALOPOLSKIE_COUNTIES.map((county) => {
            const data = priceById[county.id];
            const isHovered = hoveredId === county.id;
            const isHighlighted = highlightedId === county.id;
            return (
              <path
                key={county.id}
                d={county.d}
                fill={getPriceFill(data?.avg)}
                stroke={isHighlighted ? '#f59e0b' : isHovered ? '#064e3b' : '#047857'}
                strokeWidth={isHighlighted ? '2.5' : isHovered ? '2' : '0.8'}
                className="transition-all duration-150 cursor-pointer"
                style={{ filter: isHovered ? 'brightness(0.88)' : 'none' }}
                onMouseEnter={() => setHoveredId(county.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onPowiatClick?.(county.name)}
              />
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredCounty && (
          <div
            className="absolute z-40 pointer-events-none"
            style={{
              left: `${(hoveredCounty.centroid.x / 600) * 100}%`,
              top: `${(hoveredCounty.centroid.y / 345.66) * 100}%`,
              transform: 'translate(-50%, -110%)',
            }}
          >
            <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 min-w-[160px] text-center">
              <p className="font-bold text-sm leading-tight capitalize mb-1">{hoveredCounty.name}</p>
              {priceById[hoveredCounty.id] ? (
                <>
                  <p className="text-emerald-300 text-base font-black leading-tight">
                    {formatPrice(priceById[hoveredCounty.id].avg)}
                  </p>
                  <p className="text-slate-400 text-[10px] mt-0.5">
                    śr. miesięcznie · {pluralCount(priceById[hoveredCounty.id].count)}
                  </p>
                </>
              ) : (
                <p className="text-slate-400 text-xs">brak danych cenowych</p>
              )}
            </div>
            <div className="w-0 h-0 mx-auto border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-900" />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
        {[
          { color: '#f1f5f9', stroke: '#cbd5e1', label: 'Brak danych' },
          { color: '#d1fae5', stroke: '#047857', label: '< 7 000 zł' },
          { color: '#6ee7b7', stroke: '#047857', label: '7–8 tys.' },
          { color: '#10b981', stroke: '#047857', label: '8–9 tys.' },
          { color: '#059669', stroke: '#047857', label: '9 000+ zł' },
        ].map(({ color, stroke, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded flex-shrink-0" style={{ background: color, border: `1.5px solid ${stroke}` }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
