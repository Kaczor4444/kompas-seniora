'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine, Cell,
} from 'recharts'
import type { PowiatRow, EmeryRow } from './page'

type Props = {
  powiaty:   (PowiatRow & { powiat: string })[]
  emerytury: EmeryRow[]
}

const fmt = (n: number) => n.toLocaleString('pl-PL')

function TooltipDostepnosc({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as PowiatRow
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <div className="font-semibold text-slate-800 mb-1">{d.powiat}</div>
      <div className="text-slate-600">Dostępność 2024: <span className="font-medium text-slate-900">{d.dostepnosc_2024.toFixed(0)}</span> miejsc/10k</div>
      <div className="text-slate-500 text-xs">Prognoza 2035: {d.dostepnosc_2035.toFixed(0)} miejsc/10k</div>
      <div className="text-slate-500 text-xs mt-1">{fmt(d.dps_miejsca)} miejsc DPS · {fmt(d.pop_80plus_2024)} seniorów 80+</div>
    </div>
  )
}

function TooltipLuka({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as PowiatRow
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <div className="font-semibold text-slate-800 mb-1">{d.powiat}</div>
      <div className="text-red-700">Luka roczna: <span className="font-medium">{fmt(d.luka_roczna_zl ?? 0)} zł</span></div>
      <div className="text-slate-500 text-xs mt-1">
        Mediana DPS: {fmt(d.cena_dps_mediana ?? 0)} zł/mies.<br/>
        Emerytura: {fmt(Math.round(d.emerytura_malopolska))} zł/mies.
      </div>
    </div>
  )
}

function TooltipEmerytura({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as EmeryRow
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <div className="font-semibold text-slate-800">{d.rok}</div>
      <div className="text-emerald-700">Emerytura ZUS: <span className="font-medium">{fmt(d.wartosc_zl)} zł</span></div>
    </div>
  )
}

export default function RaportCharts({ powiaty, emerytury }: Props) {
  const withLuka = powiaty
    .filter(r => r.luka_roczna_zl !== null)
    .sort((a, b) => (b.luka_roczna_zl ?? 0) - (a.luka_roczna_zl ?? 0))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

      {/* Wykres 1: Dostępność per powiat */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-1">
          <h2 className="text-lg font-bold text-slate-900">Dostępność DPS per powiat</h2>
          <p className="text-sm text-slate-500">Miejsc DPS na 10 000 mieszkańców w wieku 80+. Im wyżej, tym lepsza dostępność. Małopolska 2024.</p>
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 mb-2">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />2024</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-slate-300 inline-block" />Prognoza 2035</span>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={powiaty} layout="vertical" margin={{ left: 90, right: 20, top: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${v}`} />
            <YAxis type="category" dataKey="powiat" tick={{ fontSize: 11 }} width={88} />
            <Tooltip content={<TooltipDostepnosc />} />
            <Bar dataKey="dostepnosc_2024" name="2024" radius={[0, 3, 3, 0]}>
              {powiaty.map((entry) => (
                <Cell
                  key={entry.powiat}
                  fill={entry.dostepnosc_2024 < 250 ? '#ef4444' : entry.dostepnosc_2024 < 500 ? '#f59e0b' : '#10b981'}
                />
              ))}
            </Bar>
            <Bar dataKey="dostepnosc_2035" name="Prognoza 2035" fill="#cbd5e1" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-2">
          🔴 &lt;250 — krytyczny deficyt &nbsp;·&nbsp; 🟡 250–500 — niedobór &nbsp;·&nbsp; 🟢 &gt;500 — relatywnie dobra dostępność
        </p>
      </section>

      {/* Wykres 2: Luka finansowa */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Luka finansowa — ile brakuje rocznie</h2>
        <p className="text-sm text-slate-500 mb-4">
          Różnica między medianą kosztu DPS a średnią emeryturą ZUS w Małopolsce (4 085 zł, 2025) × 12 miesięcy.
          Pokazuje ile senior (lub rodzina) musi dopłacić rocznie.
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={withLuka} layout="vertical" margin={{ left: 90, right: 30, top: 0, bottom: 0 }}>
            <XAxis type="number" tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="powiat" tick={{ fontSize: 11 }} width={88} />
            <Tooltip content={<TooltipLuka />} />
            <Bar dataKey="luka_roczna_zl" name="Luka roczna (zł)" radius={[0, 3, 3, 0]}>
              {withLuka.map((entry) => (
                <Cell
                  key={entry.powiat}
                  fill={(entry.luka_roczna_zl ?? 0) > 50000 ? '#dc2626' : '#f97316'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-2">Powiaty bez danych cenowych zostały pominięte. Źródło cen: MUW Małopolska 2026.</p>
      </section>

      {/* Wykres 3: Trend emerytur */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Trend emerytur w Małopolsce</h2>
        <p className="text-sm text-slate-500 mb-4">
          Przeciętna miesięczna emerytura ZUS brutto (z pozarolniczego systemu ubezpieczeń społecznych). Źródło: GUS BDL P2860.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={emerytury} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="rok" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => `${v.toLocaleString('pl-PL')} zł`} tick={{ fontSize: 11 }} width={80} domain={['auto', 'auto']} />
            <Tooltip content={<TooltipEmerytura />} />
            <ReferenceLine y={4500} stroke="#f97316" strokeDasharray="4 4"
              label={{ value: '~min. DPS', position: 'right', fontSize: 10, fill: '#f97316' }} />
            <Line
              type="monotone" dataKey="wartosc_zl" stroke="#10b981"
              strokeWidth={2} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-2">
          Pomarańczowa linia przerywana (~4 500 zł) — orientacyjny minimalny koszt DPS w Małopolsce.
        </p>
      </section>

    </div>
  )
}
