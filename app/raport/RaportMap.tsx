'use client'

import { useState, useMemo } from 'react'
import { MALOPOLSKIE_COUNTIES, MAP_META, DB_NAME_TO_ID, normalizePowiatName } from '@/src/components/data/malopolskie-counties'
import type { PowiatRow } from './page'

type Props = {
  powiaty: (PowiatRow & { powiat: string })[]
}

// Skala kolorów: czerwony (niski wskaźnik = zły) → zielony (wysoki = dobry)
function getColor(value: number | undefined): string {
  if (!value) return '#f1f5f9' // brak danych — slate-100
  if (value < 250)  return '#ef4444' // red-500 — krytyczny deficyt
  if (value < 400)  return '#f97316' // orange-500 — niedobór
  if (value < 600)  return '#eab308' // yellow-500 — umiarkowany
  if (value < 900)  return '#84cc16' // lime-500 — dobry
  return '#10b981'                    // emerald-500 — bardzo dobry
}

function getStroke(value: number | undefined, hovered: boolean): string {
  if (hovered) return '#0f172a'
  if (!value)  return '#cbd5e1'
  if (value < 250) return '#b91c1c'
  if (value < 400) return '#c2410c'
  if (value < 600) return '#a16207'
  return '#166534'
}

const fmt = (n: number) => n.toLocaleString('pl-PL')

export default function RaportMap({ powiaty }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Mapuj powiat DB name → wskaźnik dostępności
  const valueById = useMemo(() => {
    const result: Record<string, number> = {}
    for (const row of powiaty) {
      const normalized = normalizePowiatName(row.powiat)
      const id = DB_NAME_TO_ID[normalized] ?? DB_NAME_TO_ID[row.powiat.toLowerCase()]
      if (id) result[id] = row.dostepnosc_2024
    }
    return result
  }, [powiaty])

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
        aria-label="Mapa dostępności DPS w Małopolsce per powiat"
      >
        {MALOPOLSKIE_COUNTIES.map((county) => {
          const value   = valueById[county.id]
          const hovered = hoveredId === county.id
          return (
            <path
              key={county.id}
              d={county.d}
              fill={getColor(value)}
              stroke={getStroke(value, hovered)}
              strokeWidth={hovered ? '2' : '0.8'}
              className="transition-all duration-150 cursor-pointer"
              style={{ filter: hovered ? 'brightness(0.85)' : 'none' }}
              onMouseEnter={() => setHoveredId(county.id)}
              onMouseLeave={() => setHoveredId(null)}
            />
          )
        })}
      </svg>

      {/* Tooltip */}
      {hoveredCounty && hoveredData && (() => {
        const xPct = (hoveredCounty.centroid.x / 600) * 100
        const yPct = (hoveredCounty.centroid.y / 345.66) * 100
        return (
          <div
            className="absolute z-40 pointer-events-none"
            style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%, -115%)' }}
          >
            <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 min-w-[200px]">
              <p className="font-bold text-sm capitalize mb-2">{hoveredCounty.name}</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Dostępność</span>
                  <span className="font-bold text-white">{hoveredData.dostepnosc_2024.toFixed(0)}/10k</span>
                </div>
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
                    <span className="text-slate-400">Luka roczna</span>
                    <span className="font-bold text-orange-400">{fmt(hoveredData.luka_roczna_zl)} zł</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-0 h-0 mx-auto border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-slate-900" />
          </div>
        )
      })()}
    </div>
  )
}
