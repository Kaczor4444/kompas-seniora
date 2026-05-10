'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine, Cell,
} from 'recharts'
import type { PowiatRow, EmeryRow } from './page'
import RaportMap from './RaportMap'

type Props = {
  powiaty:   (PowiatRow & { powiat: string })[]
  emerytury: EmeryRow[]
}

const fmt = (n: number) => n.toLocaleString('pl-PL')

// ---------- Tooltips ----------

function TooltipDostepnosc({ active, payload }: { active?: boolean; payload?: Array<{ payload: PowiatRow }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const level =
    d.dostepnosc_2024 < 250 ? { label: 'Krytyczny deficyt', color: 'text-red-600' } :
    d.dostepnosc_2024 < 500 ? { label: 'Niedobór', color: 'text-amber-600' } :
    { label: 'Relatywnie dobry', color: 'text-emerald-600' }
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-sm min-w-[220px]">
      <div className="font-bold text-slate-900 mb-2 text-base">{d.powiat}</div>
      <div className={`text-xs font-semibold uppercase tracking-wide mb-3 ${level.color}`}>
        {level.label}
      </div>
      <div className="space-y-1.5 text-slate-600">
        <div className="flex justify-between gap-4">
          <span>Dostępność 2024</span>
          <span className="font-bold text-slate-900">{d.dostepnosc_2024.toFixed(0)} / 10k</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Prognoza 2035</span>
          <span className="font-medium text-slate-500">{d.dostepnosc_2035.toFixed(0)} / 10k</span>
        </div>
        <div className="border-t border-slate-100 pt-1.5 mt-1.5 text-xs text-slate-500">
          <div>{fmt(d.dps_miejsca)} miejsc DPS</div>
          <div>{fmt(d.pop_80plus_2024)} seniorów 80+</div>
        </div>
      </div>
    </div>
  )
}

function TooltipLuka({ active, payload }: { active?: boolean; payload?: Array<{ payload: PowiatRow }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-sm min-w-[220px]">
      <div className="font-bold text-slate-900 mb-2 text-base">{d.powiat}</div>
      <div className="space-y-1.5 text-slate-600">
        <div className="flex justify-between gap-4">
          <span>Luka roczna</span>
          <span className="font-bold text-red-700">{fmt(d.luka_roczna_zl ?? 0)} zł</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Luka miesięczna</span>
          <span className="font-medium text-red-600">{fmt(d.luka_miesieczna_zl ?? 0)} zł</span>
        </div>
        <div className="border-t border-slate-100 pt-1.5 mt-1.5 text-xs text-slate-500">
          <div>Mediana kosztu DPS: {fmt(d.cena_dps_mediana ?? 0)} zł/mies.</div>
          <div>Emerytura: {fmt(Math.round(d.emerytura_malopolska))} zł/mies.</div>
        </div>
      </div>
    </div>
  )
}

function TooltipEmerytura({ active, payload }: { active?: boolean; payload?: Array<{ payload: EmeryRow }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-sm">
      <div className="font-bold text-slate-900 mb-1">{d.rok}</div>
      <div className="flex items-center gap-2 text-emerald-700">
        <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
        <span>Emerytura ZUS: <span className="font-bold">{fmt(d.wartosc_zl)} zł</span></span>
      </div>
    </div>
  )
}

// ---------- Sekcja wykresu — wrapper z animacją wejścia ----------

function ChartSection({
  children,
  insight,
  delay = 0,
}: {
  children: React.ReactNode
  insight: string
  delay?: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Insight bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <p className="text-sm font-semibold text-slate-700 leading-snug">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 mb-0.5" />
          {insight}
        </p>
      </div>
      <div className="p-6">{children}</div>
    </motion.section>
  )
}

// ---------- Legenda wykresu dostępności ----------

function LegendaDostepnosci() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4">
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
        Krytyczny deficyt (&lt;250)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
        Niedobór (250–500)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
        Relatywnie dobry (&gt;500)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-slate-200 inline-block" />
        Prognoza 2035
      </span>
    </div>
  )
}

// ---------- Główny komponent ----------

export default function RaportCharts({ powiaty, emerytury }: Props) {
  const withLuka = powiaty
    .filter(r => r.luka_roczna_zl !== null)
    .sort((a, b) => (b.luka_roczna_zl ?? 0) - (a.luka_roczna_zl ?? 0))

  // Oblicz insight dla wykresu 1
  const worst = powiaty[0]
  const best  = powiaty[powiaty.length - 1]
  const disparity = best && worst
    ? Math.round(best.dostepnosc_2024 / worst.dostepnosc_2024)
    : 0

  // Insight dla wykresu 2
  const worstLuka = withLuka[0]
  const lukaTys = worstLuka?.luka_roczna_zl
    ? Math.round((worstLuka.luka_roczna_zl) / 1000)
    : 0

  // Insight dla wykresu 3
  const emFirst = emerytury[0]
  const emLast  = emerytury[emerytury.length - 1]
  const emWzrost = emFirst && emLast
    ? Math.round((emLast.wartosc_zl / emFirst.wartosc_zl - 1) * 100)
    : 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">

      {/* Mapa choropletyczna */}
      <ChartSection
        delay={0}
        insight="Kolor mapy pokazuje dostępność DPS — czerwony oznacza krytyczny deficyt miejsc względem liczby seniorów 80+."
      >
        <h2 className="text-xl font-bold text-slate-900 mb-1">Mapa dostępności DPS — Małopolska</h2>
        <p className="text-sm text-slate-500 mb-5">
          Miejsca DPS na 10 000 mieszkańców w wieku 80+. Najedź na powiat po szczegóły.
        </p>

        {/* Legenda */}
        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-5">
          {[
            { color: '#ef4444', label: 'Krytyczny (<250)' },
            { color: '#f97316', label: 'Niedobór (250–400)' },
            { color: '#eab308', label: 'Umiarkowany (400–600)' },
            { color: '#84cc16', label: 'Dobry (600–900)' },
            { color: '#10b981', label: 'Bardzo dobry (>900)' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>

        <RaportMap powiaty={powiaty} />
      </ChartSection>

      {/* Wykres 1: Dostępność per powiat */}
      <ChartSection
        delay={0}
        insight={
          disparity > 0
            ? `Powiat ${worst?.powiat ?? ''} ma ${disparity}× gorszy dostęp do DPS niż ${best?.powiat ?? ''} — największa dysproporcja w regionie.`
            : 'Porównanie dostępności DPS dla 22 powiatów Małopolski.'
        }
      >
        <div className="mb-1">
          <h2 className="text-xl font-bold text-slate-900">Dostępność DPS — ranking powiatów</h2>
          <p className="text-sm text-slate-500 mt-1">
            Liczba miejsc DPS na 10 000 mieszkańców w wieku 80+. Małopolska, 2024.
          </p>
        </div>
        <LegendaDostepnosci />
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={powiaty} layout="vertical" margin={{ left: 90, right: 24, top: 4, bottom: 4 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={v => `${v}`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="powiat"
              tick={{ fontSize: 11, fill: '#64748b' }}
              width={88}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<TooltipDostepnosc />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="dostepnosc_2024" name="2024" radius={[0, 4, 4, 0]} maxBarSize={16}>
              {powiaty.map((entry) => (
                <Cell
                  key={entry.powiat}
                  fill={
                    entry.dostepnosc_2024 < 250 ? '#ef4444' :
                    entry.dostepnosc_2024 < 500 ? '#f59e0b' :
                    '#10b981'
                  }
                />
              ))}
            </Bar>
            <Bar dataKey="dostepnosc_2035" name="Prognoza 2035" fill="#e2e8f0" radius={[0, 4, 4, 0]} maxBarSize={8} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
          Powiaty posortowane rosnąco wg dostępności 2024.
          Szary pasek = prognoza na rok 2035 przy obecnej liczbie miejsc i rosnącej populacji 80+.
        </p>
      </ChartSection>

      {/* Wykres 2: Luka finansowa */}
      <ChartSection
        delay={0.1}
        insight={
          worstLuka
            ? `W powiecie ${worstLuka.powiat} senior lub rodzina musi dopłacić średnio ${lukaTys} tys. zł rocznie ponad kwotę emerytury, żeby pokryć koszt DPS.`
            : 'Różnica między kosztem DPS a emeryturą ZUS — ile trzeba dopłacić rocznie.'
        }
      >
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">Luka finansowa — roczna dopłata do DPS</h2>
          <p className="text-sm text-slate-500 mt-1">
            Różnica między medianą kosztu DPS a średnią emeryturą ZUS
            w Małopolsce (4&nbsp;085&nbsp;zł brutto, 2025) × 12 miesięcy.
          </p>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={withLuka} layout="vertical" margin={{ left: 90, right: 36, top: 4, bottom: 4 }}>
            <XAxis
              type="number"
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="powiat"
              tick={{ fontSize: 11, fill: '#64748b' }}
              width={88}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<TooltipLuka />} cursor={{ fill: '#fef2f2' }} />
            <Bar dataKey="luka_roczna_zl" name="Luka roczna (zł)" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {withLuka.map((entry) => (
                <Cell
                  key={entry.powiat}
                  fill={(entry.luka_roczna_zl ?? 0) > 50000 ? '#dc2626' : '#f97316'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-600 inline-block" />
            Luka &gt;50 000 zł/rok
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" />
            Luka 20 000–50 000 zł/rok
          </span>
          <span className="ml-auto">
            Powiaty bez danych cenowych pominięte. Źródło cen: MUW Małopolska 2026.
          </span>
        </div>
      </ChartSection>

      {/* Wykres 3: Trend emerytur */}
      <ChartSection
        delay={0.2}
        insight={
          emFirst && emLast
            ? `Emerytura w Małopolsce wzrosła o ${emWzrost}% w ciągu 5 lat (${emFirst.rok}–${emLast.rok}), ale wciąż nie nadąża za rosnącymi kosztami pobytu w DPS.`
            : 'Trend przeciętnej emerytury ZUS w Małopolsce.'
        }
      >
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">Trend emerytur ZUS w Małopolsce</h2>
          <p className="text-sm text-slate-500 mt-1">
            Przeciętna miesięczna emerytura brutto (z pozarolniczego systemu ubezpieczeń
            społecznych). Źródło: GUS BDL P2860.
          </p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={emerytury} margin={{ left: 10, right: 24, top: 10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="rok"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `${v.toLocaleString('pl-PL')} zł`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              width={84}
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<TooltipEmerytura />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }} />
            <ReferenceLine
              y={4500}
              stroke="#f97316"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              label={{
                value: 'min. koszt DPS ~4 500 zł',
                position: 'insideTopRight',
                fontSize: 10,
                fill: '#f97316',
                offset: 6,
              }}
            />
            <Line
              type="monotone"
              dataKey="wartosc_zl"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
          Pomarańczowa linia przerywana — orientacyjny minimalny koszt DPS w Małopolsce (~4 500 zł/mies.).
          Przekroczenie progu przez emeryturę nie oznacza pełnego pokrycia kosztów — większość DPS kosztuje znacznie więcej.
        </p>
      </ChartSection>

    </div>
  )
}
