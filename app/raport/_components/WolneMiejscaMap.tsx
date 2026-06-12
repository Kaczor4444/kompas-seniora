'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MALOPOLSKIE_COUNTIES, MAP_META } from '@/data/malopolskie-counties';

export type MapPowiatData = {
  powiat: string;
  wolne: number;
  oczek: number;
};

type Props = {
  data: MapPowiatData[];
};

// Normalize powiat names to match SVG county names
function normalizePowiat(p: string): string {
  return p.toLowerCase().trim();
}

// Convert SVG county name → search URL powiat param (matches DB powiat field)
function countyToSearchUrl(name: string): string {
  const isCityCounty = ['Kraków', 'Nowy Sącz', 'Tarnów'].includes(name);
  const powiat = isCityCounty ? `m. ${name}` : name;
  return `/search?powiat=${encodeURIComponent(powiat)}&type=dps&spaces=true`;
}

function getCountyKey(name: string): string {
  // Cities have capitalized names in the SVG
  if (name === 'Kraków') return 'm. kraków';
  if (name === 'Nowy Sącz') return 'm. nowy sącz';
  if (name === 'Tarnów') return 'm. tarnów';
  return normalizePowiat(name);
}

function getPowiatKey(powiat: string): string {
  const p = normalizePowiat(powiat);
  // Map DB powiat names to SVG county names
  if (p === 'kraków') return 'm. kraków';
  if (p === 'nowy sącz') return 'm. nowy sącz';
  if (p === 'tarnów') return 'm. tarnów';
  return p;
}

function getColor(wolne: number, maxWolne: number): string {
  if (wolne === 0) return '#cbd5e1'; // no free spots — slate-300
  const ratio = Math.sqrt(wolne / Math.max(maxWolne, 1)); // sqrt scale
  // Use CSS emerald palette steps
  if (ratio >= 0.85) return '#059669'; // emerald-600
  if (ratio >= 0.65) return '#10b981'; // emerald-500
  if (ratio >= 0.45) return '#34d399'; // emerald-400
  if (ratio >= 0.25) return '#6ee7b7'; // emerald-300
  return '#a7f3d0'; // emerald-200 — just 1-2 spots
}

export default function WolneMiejscaMap({ data }: Props) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{
    name: string;
    wolne: number;
    oczek: number;
    x: number;
    y: number;
  } | null>(null);

  // Build lookup: normalized key → data
  const lookup = new Map<string, MapPowiatData>();
  for (const d of data) {
    lookup.set(getPowiatKey(d.powiat), d);
  }

  const maxWolne = Math.max(...data.map(d => d.wolne), 1);

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <svg
        viewBox={MAP_META.viewBox}
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))' }}
      >
        {MALOPOLSKIE_COUNTIES.map((county) => {
          const key = getCountyKey(county.name);
          const d = lookup.get(key);
          const wolne = d?.wolne ?? 0;
          const fill = d ? getColor(wolne, maxWolne) : '#e2e8f0';
          const isCity = ['Kraków', 'Nowy Sącz', 'Tarnów'].includes(county.name);

          return (
            <path
              key={county.id}
              d={county.d}
              fill={fill}
              stroke="#ffffff"
              strokeWidth={isCity ? "1.5" : "1"}
              className="transition-all duration-150 cursor-pointer"
              style={{ outline: 'none' }}
              onMouseEnter={(e) => {
                const svgEl = (e.target as SVGPathElement).ownerSVGElement;
                const rect = svgEl?.getBoundingClientRect();
                const pt = svgEl?.createSVGPoint();
                if (pt && rect) {
                  pt.x = e.clientX;
                  pt.y = e.clientY;
                  const ctm = svgEl!.getScreenCTM();
                  const svgCoord = ctm ? pt.matrixTransform(ctm.inverse()) : null;
                  setTooltip({
                    name: county.name,
                    wolne: d?.wolne ?? 0,
                    oczek: d?.oczek ?? 0,
                    x: svgCoord?.x ?? county.centroid.x,
                    y: svgCoord?.y ?? county.centroid.y,
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => router.push(countyToSearchUrl(county.name))}
            />
          );
        })}

        {/* Tooltip rendered inside SVG for correct positioning */}
        {tooltip && (() => {
          const vbWidth = 600;
          const vbHeight = 345.66;
          const tw = 130;
          const th = tooltip.oczek > 0 ? 60 : 46;
          let tx = tooltip.x + 6;
          let ty = tooltip.y - th / 2;
          if (tx + tw > vbWidth - 4) tx = tooltip.x - tw - 6;
          if (ty < 4) ty = 4;
          if (ty + th > vbHeight - 4) ty = vbHeight - th - 4;

          return (
            <g pointerEvents="none">
              <rect
                x={tx} y={ty} width={tw} height={th}
                rx="5" ry="5"
                fill="#0f172a" opacity="0.92"
              />
              <text x={tx + 8} y={ty + 14} fontSize="8.5" fontWeight="700" fill="#f8fafc">
                {['Kraków','Nowy Sącz','Tarnów'].includes(tooltip.name) ? tooltip.name : `powiat ${tooltip.name}`}
              </text>
              <text x={tx + 8} y={ty + 27} fontSize="8" fill="#34d399">
                {tooltip.wolne > 0
                  ? `${tooltip.wolne} wolne ${tooltip.wolne === 1 ? 'miejsce' : tooltip.wolne < 5 ? 'miejsca' : 'miejsc'}`
                  : 'Brak wolnych miejsc'}
              </text>
              {tooltip.oczek > 0 && (
                <text x={tx + 8} y={ty + 40} fontSize="7.5" fill="#fbbf24">
                  {tooltip.oczek} oczekujących
                </text>
              )}
              {tooltip.wolne === 0 && (
                <text x={tx + 8} y={ty + 38} fontSize="7" fill="#94a3b8">
                  sprawdź powiaty sąsiednie
                </text>
              )}
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-600" />
          <span>Wiele miejsc</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-200" />
          <span>Kilka miejsc</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-slate-300" />
          <span>Brak miejsc</span>
        </div>
      </div>
    </div>
  );
}
