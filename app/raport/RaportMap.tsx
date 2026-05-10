'use client'

import { useState, useMemo } from 'react'
import { MALOPOLSKIE_COUNTIES, MAP_META, DB_NAME_TO_ID, normalizePowiatName } from '@/src/components/data/malopolskie-counties'
import type { PowiatRow } from './page'

// Jednolita skala kolorów — używana też w RaportCharts
export const COLOR_SCALE = [
  { max: 250,  fill: '#ef4444', stroke: '#b91c1c', label: 'Krytyczny (<250)'     },
  { max: 400,  fill: '#f97316', stroke: '#c2410c', label: 'Niedobór (250–400)'   },
  { max: 600,  fill: '#eab308', stroke: '#a16207', label: 'Umiarkowany (400–600)'},
  { max: 900,  fill: '#84cc16', stroke: '#4d7c0f', label: 'Dobry (600–900)'      },
  { max: Infinity, fill: '#10b981', stroke: '#166534', label: 'Bardzo dobry (>900)'},
]

export function getColorForValue(value: number | undefined): { fill: string; stroke: string } {
  if (!value) return { fill: '#f1f5f9', stroke: '#cbd5e1' }
  const level = COLOR_SCALE.find(l => value < l.max)!
  return { fill: level.fill, stroke: level.stroke }
}

type Props = {
  powiaty:   (PowiatRow & { powiat: string })[]
  year?:     '2024' | '2035'
}

const fmt = (n: number) => n.toLocaleString('pl-PL')

export default function RaportMap({ powiaty, year = '2024' }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const valueById = useMemo(() => {
    const result: Record<string, number> = {}
    for (const row of powiaty) {
      const normalized = normalizePowiatName(row.powiat)
      const id = DB_NAME_TO_ID[normalized] ?? DB_NAME_TO_ID[row.powiat.toLowerCase()]
      if (id) result[id] = year === '2035' ? row.dostepnosc_2035 : row.dostepnosc_2024
    }
    return result
  }, [powiaty, year])

  const dataById = useMemo(() => {
    const result: Record<string, PowiatRow & { powiat: string }> = {}
    for (const row of powiaty) {
      const normalized = normalizePowiatName(row.powiat)
      const id = DB_NAME_TO_ID[normalized] ?? DB_NAME_TO_ID[row.powiat.toLowerCase()]
      if (id) result[id] = row
    }
    return result
  }, [powiaty])

  const hoveredCounty = hoveredId ? MALOPOLSKIE_COUNTIES.find(c => c.id === hoveredId) : null
  const hoveredData   = hoveredId ? dataById[hoveredId] : null

  return (
    <div className="relative w-full">
      <svg
        viewBox={MAP_META.viewBox}
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`Mapa dostępności DPS w Małopolsce per powiat — ${year}`}
      >
        {MALOPOLSKIE_COUNTIES.map((county) => {
          const value   = valueById[county.id]
          const hovered = hoveredId === county.id
          const { fill, stroke } = getColorForValue(value)
          return (
            <path
              key={county.id}
              d={county.d}
              fill={fill}
              stroke={hovered ? '#0f172a' : stroke}
              strokeWidth={hovered ? '2' : '0.8'}
              className="transition-all duration-150 cursor-pointer"
              style={{ filter: hovered ? 'brightness(0.85)' : 'none' }}
              onMouseEnter={() => setHoveredId(county.id)}
              onMouseLeave={() => setHoveredId(null)}
            />
          )
        })}
      </svg>

      {/* Tooltip — z detekcją krawędzi górnej */}
      {hoveredCounty && hoveredData && (() => {
        const xPct = (hoveredCounty.centroid.x / 600) * 100
        const yPct = (hoveredCounty.centroid.y / 345.66) * 100
        // Powiaty przy górze (<30%) — tooltip poniżej, nie powyżej
        const isTop = yPct < 30
        const value = year === '2035' ? hoveredData.dostepnosc_2035 : hoveredData.dostepnosc_2024
        return (
          <div
            className="absolute z-40 pointer-events-none"
            style={{
              left: `${xPct}%`,
              top:  `${yPct}%`,
              transform: isTop
                ? 'translate(-50%, 15%)'
                : 'translate(-50%, -115%)',
            }}
          >
            {!isTop && (
              <div className="w-0 h-0 mx-auto border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-900 order-last" />
            )}
            <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 min-w-[200px]">
              <p className="font-bold text-sm capitalize mb-2">{hoveredCounty.name}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Dostępność {year}</span>
                  <span className="font-bold text-white">{value?.toFixed(0) ?? '—'}/10k</span>
                </div>
                {year === '2035' && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Było 2024</span>
                    <span className="text-slate-300">{hoveredData.dostepnosc_2024.toFixed(0)}/10k</span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Miejsc DPS</span>
                  <span className="font-medium">{fmt(hoveredData.dps_miejsca)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Seniorów 80+</span>
                  <span className="font-medium">{fmt(hoveredData.pop_80plus_2024)}</span>
                </div>
                {hoveredData.luka_roczna_zl && (
                  <div className="flex justify-between gap-4 border-t border-slate-700 pt-1 mt-1">
                    <span className="text-slate-400">Luka systemowa/rok</span>
                    <span className="font-bold text-orange-400">
                      {fmt(Math.round((hoveredData.cena_dps_mediana ?? 0) - 0.7 * hoveredData.emerytura_malopolska) * 12)} zł
                    </span>
                  </div>
                )}
              </div>
            </div>
            {isTop && (
              <div className="w-0 h-0 mx-auto border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-slate-900" />
            )}
          </div>
        )
      })()}
    </div>
  )
}
