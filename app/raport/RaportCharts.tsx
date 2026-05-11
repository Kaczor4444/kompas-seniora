'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, ReferenceLine, Cell,
} from 'recharts'
import type { PowiatRow, EmeryRow, CenaDpsRow } from './page'
import RaportMap, { COLOR_SCALE, getColorForValue } from './RaportMap'

type Props = {
  powiaty:   (PowiatRow & { powiat: string })[]
  emerytury: EmeryRow[]
  avgDost:   number
  cenaDps:   CenaDpsRow[]
}

const fmt = (n: number) => n.toLocaleString('pl-PL')

// Miasta na prawach powiatu — wykluczone z dysproporcji
const MIASTA_POWIAT = ['m. kraków', 'm. tarnów', 'm. nowy sącz']
const isCity = (p: string) => MIASTA_POWIAT.includes(p.toLowerCase())

// ── Tooltips ─────────────────────────────────────────────────────────────────

function TooltipDostepnosc({ active, payload }: { active?: boolean; payload?: Array<{ payload: PowiatRow }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const level = COLOR_SCALE.find(l => d.dostepnosc_2024 < l.max)
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-sm min-w-[220px]">
      <div className="font-bold text-slate-900 mb-1 text-base">{d.powiat}</div>
      {level && (
        <div className="text-xs font-semibold mb-3" style={{ color: level.fill }}>
          {level.label}
        </div>
      )}
      <div className="space-y-1.5 text-slate-600">
        <div className="flex justify-between gap-4">
          <span>Dostępność 2024</span>
          <span className="font-bold text-slate-900">{d.dostepnosc_2024.toFixed(0)} / 10k</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Prognoza 2035</span>
          <span className="text-slate-400">{d.dostepnosc_2035.toFixed(0)} / 10k</span>
        </div>
        <div className="border-t border-slate-100 pt-1.5 text-xs text-slate-500">
          <div>{fmt(d.dps_miejsca)} miejsc DPS</div>
          <div>{fmt(d.pop_80plus_2024)} seniorów 80+</div>
        </div>
      </div>
    </div>
  )
}

function TooltipLuka({ active, payload }: { active?: boolean; payload?: Array<{ payload: PowiatRow & { luka_systemowa_rok?: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const smallN = (d.n_placowek_z_cena ?? 0) < 3
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-sm min-w-[240px]">
      <div className="font-bold text-slate-900 mb-2 text-base">
        {d.powiat}
        {smallN && <span className="ml-2 text-xs font-normal text-amber-600">⚠ N={d.n_placowek_z_cena}</span>}
      </div>
      <div className="space-y-1.5 text-slate-600">
        <div className="flex justify-between gap-4">
          <span>Luka nominalna/rok</span>
          <span className="font-bold text-red-700">{fmt(d.luka_roczna_zl ?? 0)} zł</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Luka systemowa/rok*</span>
          <span className="font-bold text-orange-600">{fmt(d.luka_systemowa_rok ?? 0)} zł</span>
        </div>
        <div className="border-t border-slate-100 pt-1.5 text-xs text-slate-500">
          <div>Mediana kosztu DPS: {fmt(d.cena_dps_mediana ?? 0)} zł/mies.</div>
          <div>Emerytura: {fmt(Math.round(d.emerytura_malopolska))} zł/mies.</div>
          {smallN && <div className="mt-1 text-amber-600">Mediana z {d.n_placowek_z_cena} placówki</div>}
        </div>
      </div>
      <div className="text-xs text-slate-400 mt-2 border-t border-slate-100 pt-2">
        *luka systemowa = DPS − 70% emerytury (art. 61 ups)
      </div>
    </div>
  )
}

function TooltipCenaDps({ active, payload }: { active?: boolean; payload?: Array<{ payload: CenaDpsRow; dataKey: string; value: number; color: string }> }) {
  if (!active || !payload?.length) return null
  const rok = payload[0].payload.rok
  const dps = payload[0].payload.min_cena_dps
  const em  = payload[0].payload.emerytura
  const luka = dps && em ? dps - em : null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4 text-sm min-w-[210px]">
      <div className="font-bold text-slate-900 mb-2">{rok}</div>
      <div className="space-y-1.5">
        {dps && (
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />Najtańszy DPS
            </span>
            <span className="font-bold text-slate-900">{fmt(dps)} zł</span>
          </div>
        )}
        {em && (
          <div className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />Emerytura ZUS
            </span>
            <span className="font-bold text-slate-900">{fmt(Math.round(em))} zł</span>
          </div>
        )}
        {luka && (
          <div className="flex justify-between gap-4 border-t border-slate-100 pt-1.5 mt-1">
            <span className="text-slate-500 text-xs">Luka</span>
            <span className="font-bold text-red-600 text-xs">+{fmt(Math.round(luka))} zł/mies.</span>
          </div>
        )}
        {!em && (
          <div className="text-xs text-slate-400 border-t border-slate-100 pt-1.5 mt-1">
            Dane GUS o emeryturach za {rok} jeszcze niedostępne
          </div>
        )}
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

// ── Sekcja wykresu z animacją ─────────────────────────────────────────────────

function ChartSection({ children, insight, delay = 0 }: {
  children: React.ReactNode; insight: string; delay?: number
}) {
  const ref   = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="border-l-4 border-emerald-500 bg-slate-50 border-b border-slate-200 px-6 py-3">
        <p className="text-sm font-semibold text-slate-700 leading-snug">{insight}</p>
      </div>
      <div className="p-6">{children}</div>
    </motion.section>
  )
}

// ── Wspólna legenda ───────────────────────────────────────────────────────────

function LegendaKolorow({ extra }: { extra?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
      {COLOR_SCALE.map(({ fill, label }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: fill }} />
          {label}
        </span>
      ))}
      {extra}
    </div>
  )
}

// ── Główny komponent ─────────────────────────────────────────────────────────

export default function RaportCharts({ powiaty, emerytury, avgDost, cenaDps }: Props) {
  const [mapYear, setMapYear] = useState<'2024' | '2035'>('2024')

  // Outlierzy wykluczeni z analiz porównawczych
  const OUTLIERS = ['krakowski', 'm. kraków', 'm. tarnów', 'm. nowy sącz']
  const powiatyZiemskie = powiaty.filter(r => !OUTLIERS.includes(r.powiat.toLowerCase()))

  // Luka systemowa (art. 61 uos): pensjonariusz płaci max 70% dochodu
  const powiatyZLuka = powiaty
    .filter(r => r.luka_roczna_zl !== null && r.cena_dps_mediana !== null)
    .map(r => ({
      ...r,
      luka_systemowa_rok: Math.round(((r.cena_dps_mediana ?? 0) - 0.7 * r.emerytura_malopolska) * 12),
    }))
    .sort((a, b) => b.luka_systemowa_rok - a.luka_systemowa_rok)

  // Worst/best tylko powiaty ziemskie
  const worst = powiatyZiemskie[0]
  const best  = powiatyZiemskie[powiatyZiemskie.length - 1]
  const disparity = best && worst ? Math.round(best.dostepnosc_2024 / worst.dostepnosc_2024) : 0

  // Insight luki — najgorszy wiarygodny powiat ziemski (N≥3, bez outlierów)
  const worstLuka = powiatyZLuka
    .filter(r => (r.n_placowek_z_cena ?? 0) >= 3 && !OUTLIERS.includes(r.powiat.toLowerCase().trim()))[0]
  const emFirst = emerytury[0]
  const emLast  = emerytury[emerytury.length - 1]
  const emWzrost = emFirst && emLast
    ? Math.round((emLast.wartosc_zl / emFirst.wartosc_zl - 1) * 100) : 0

  // Luka per rok dla insight
  const lukaData = cenaDps.filter(r => r.min_cena_dps && r.emerytura)
  const lukaRast = lukaData.length >= 2
    ? Math.round((lukaData[lukaData.length-1].min_cena_dps! - lukaData[lukaData.length-1].emerytura!)
      - (lukaData[0].min_cena_dps! - lukaData[0].emerytura!))
    : 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">

      {/* Wykres: najtańszy DPS vs emerytura */}
      <ChartSection
        delay={0}
        insight={
          lukaRast > 0
            ? `Luka między najtańszym DPS a emeryturą wzrosła o ${fmt(lukaRast)} zł/mies. w ciągu 2 lat (2023–2025) — mimo wzrostu emerytur o 23%.`
            : 'Porównanie najtańszego kosztu DPS z przeciętną emeryturą ZUS w Małopolsce.'
        }
      >
        <h2 className="text-xl font-bold text-slate-900 mb-1">Najtańszy DPS vs emerytura — Małopolska</h2>
        <p className="text-sm text-slate-500 mb-4">
          Oficjalny minimalny koszt utrzymania DPS (MUW Małopolska) vs przeciętna emerytura ZUS brutto.
          Dane 2023–2025 wspólne dla obu linii; 2026 tylko dla DPS (GUS nie opublikował jeszcze emerytur za 2026).
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-red-500 inline-block rounded" />Najtańszy DPS (oficjalny koszt MUW)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-emerald-500 inline-block rounded" />Emerytura ZUS brutto (GUS BDL)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-red-300 inline-block rounded border-dashed border-t border-red-300" style={{borderStyle:'dashed'}} />2026 DPS (brak danych GUS o emeryturze)
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={cenaDps} margin={{ left: 10, right: 24, top: 10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="rok" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={v => `${(v/1000).toFixed(1)}k zł`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              width={64} domain={[2500, 6500]}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<TooltipCenaDps />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }} />
            {/* Obszar luki */}
            <ReferenceLine
              y={0} stroke="transparent"
              label={{ value: '', position: 'insideLeft' }}
            />
            <Line
              type="monotone" dataKey="min_cena_dps" name="Najtańszy DPS"
              stroke="#ef4444" strokeWidth={2.5}
              dot={(props: any) => {
                const { cx, cy, payload } = props
                if (!payload.min_cena_dps) return <g key={`dot-dps-${payload.rok}`} />
                const isDashed = !payload.emerytura
                return (
                  <circle key={`dot-dps-${payload.rok}`} cx={cx} cy={cy} r={5}
                    fill={isDashed ? '#fca5a5' : '#ef4444'}
                    stroke="white" strokeWidth={2} />
                )
              }}
              strokeDasharray={(d: any) => d?.emerytura ? '0' : '6 3'}
              connectNulls
            />
            <Line
              type="monotone" dataKey="emerytura" name="Emerytura ZUS"
              stroke="#10b981" strokeWidth={2.5}
              dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
          Emerytura podana w kwocie brutto (netto jest niższa — realna luka większa).
          Najtańszy DPS to placówka z najniższym oficjalnym kosztem utrzymania w danym roku —
          może być inny powiat w każdym roku. Źródło cen: PDF MUW Małopolska.
        </p>
      </ChartSection>

      {/* Mapa + Top/Bottom 5 */}
      <ChartSection
        delay={0}
        insight={`Czerwone powiaty mają krytyczny deficyt miejsc DPS względem populacji 80+. Kliknij toggle żeby zobaczyć prognozę 2035 — większość regionu pogłębia się.`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Mapa dostępności DPS — Małopolska</h2>
            <p className="text-sm text-slate-500 mt-1">Miejsc DPS na 10 000 mieszkańców 80+. Najedź na powiat po szczegóły.</p>
          </div>
          {/* Toggle 2024 / 2035 */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden flex-shrink-0 self-start">
            {(['2024', '2035'] as const).map(y => (
              <button
                key={y}
                onClick={() => setMapYear(y)}
                className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
                  mapYear === y
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        <LegendaKolorow />

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Mapa */}
          <div className="w-full lg:max-w-sm xl:max-w-md flex-shrink-0">
            <RaportMap powiaty={powiaty} year={mapYear} />
          </div>

          {/* Top 5 / Bottom 5 */}
          <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">
                Najgorszy dostęp
              </div>
              <div className="space-y-1.5">
                {powiaty.slice(0, 5).map(r => (
                  <div key={r.powiat} className="flex items-center justify-between gap-2">
                    <span className="capitalize text-slate-700 text-xs truncate">{r.powiat}</span>
                    <span
                      className="font-bold text-xs px-2 py-0.5 rounded-md text-white flex-shrink-0"
                      style={{ background: getColorForValue(r.dostepnosc_2024).fill }}
                    >
                      {r.dostepnosc_2024.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
                Najlepszy dostęp
              </div>
              <div className="space-y-1.5">
                {[...powiaty].reverse().slice(0, 5).map(r => (
                  <div key={r.powiat} className="flex items-center justify-between gap-2">
                    <span className="capitalize text-slate-700 text-xs truncate">{r.powiat}</span>
                    <span
                      className="font-bold text-xs px-2 py-0.5 rounded-md text-white flex-shrink-0"
                      style={{ background: getColorForValue(r.dostepnosc_2024).fill }}
                    >
                      {r.dostepnosc_2024.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {mapYear === '2035' && (
              <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <strong>Scenariusz braku inwestycji 2035</strong> — zakłada stałą liczbę miejsc DPS
                przy rosnącej populacji 80+. Nie uwzględnia planowanych inwestycji samorządowych.
              </div>
            )}
          </div>
        </div>
      </ChartSection>

      {/* Wykres 1: Ranking dostępności */}
      <ChartSection
        delay={0.1}
        insight={
          disparity > 0
            ? `Powiat ${worst?.powiat ?? ''} ma ${disparity}× gorszy dostęp do DPS niż ${best?.powiat ?? ''}. Średnia Małopolska: ${avgDost} miejsc/10k seniorów 80+.`
            : 'Ranking dostępności DPS dla 22 powiatów Małopolski.'
        }
      >
        <h2 className="text-xl font-bold text-slate-900 mb-1">Ranking dostępności — 22 powiaty</h2>
        <p className="text-sm text-slate-500 mb-4">Miejsca DPS na 10 000 mieszkańców w wieku 80+. Małopolska, 2024.</p>
        <LegendaKolorow extra={
          <span className="flex items-center gap-1.5 ml-auto">
            <span className="w-3 h-3 rounded-sm bg-slate-200 inline-block" />Prognoza 2035
          </span>
        } />
        <ResponsiveContainer width="100%" height={560}>
          <BarChart data={powiaty} layout="vertical" margin={{ left: 92, right: 24, top: 4, bottom: 4 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickFormatter={v => `${v}/10k`} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="powiat" tick={{ fontSize: 11, fill: '#64748b' }}
              width={90} axisLine={false} tickLine={false} />
            <Tooltip content={<TooltipDostepnosc />} cursor={{ fill: '#f8fafc' }} />
            <ReferenceLine x={avgDost} stroke="#6366f1" strokeDasharray="4 4" strokeWidth={1.5}
              label={{ value: `śr. ${avgDost}`, position: 'top', fontSize: 10, fill: '#6366f1' }} />
            <Bar dataKey="dostepnosc_2024" name="2024" radius={[0, 4, 4, 0]} maxBarSize={14}>
              {powiaty.map(r => (
                <Cell key={r.powiat} fill={getColorForValue(r.dostepnosc_2024).fill} />
              ))}
            </Bar>
            <Bar dataKey="dostepnosc_2035" name="2035" fill="#e2e8f0"
              radius={[0, 4, 4, 0]} maxBarSize={6} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
          Fioletowa linia przerywana = średnia Małopolska ({avgDost}/10k). Szary pasek = prognoza 2035 przy braku nowych inwestycji.
        </p>
      </ChartSection>

      {/* Wykres 2: Luka finansowa */}
      <ChartSection
        delay={0.15}
        insight={
          worstLuka
            ? `W powiecie ${worstLuka.powiat} luka systemowa (co musi pokryć rodzina lub gmina) wynosi ${fmt(Math.round(worstLuka.luka_systemowa_rok / 1000) * 1000)} zł rocznie.`
            : 'Różnica między kosztem DPS a maksymalną odpłatnością seniora (70% dochodu).'
        }
      >
        <h2 className="text-xl font-bold text-slate-900 mb-1">Luka finansowa — co musi dopłacić rodzina lub gmina</h2>
        <p className="text-sm text-slate-500 mb-1">
          <strong>Luka systemowa</strong> = mediana kosztu DPS − 70% emerytury ZUS (art. 61 ustawy o pomocy społecznej).
          Pensjonariusz płaci max 70% swojego dochodu — resztę pokrywa rodzina lub gmina/MOPS.
        </p>
        <p className="text-xs text-slate-400 mb-4">
          ⚠ Powiaty z N&lt;3 placówkami z ceną oznaczone są jako niepewne.
        </p>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={powiatyZLuka} layout="vertical" margin={{ left: 92, right: 36, top: 4, bottom: 4 }}>
            <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="powiat" tick={{ fontSize: 11, fill: '#64748b' }}
              width={90} axisLine={false} tickLine={false} />
            <Tooltip content={<TooltipLuka />} cursor={{ fill: '#fef2f2' }} />
            <Bar dataKey="luka_systemowa_rok" name="Luka systemowa (zł/rok)"
              radius={[0, 4, 4, 0]} maxBarSize={18}>
              {powiatyZLuka.map(r => (
                <Cell
                  key={r.powiat}
                  fill={r.luka_systemowa_rok > 50000 ? '#dc2626' : '#f97316'}
                  opacity={(r.n_placowek_z_cena ?? 0) < 3 ? 0.5 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-600" />Luka &gt;50 tys. zł/rok
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-orange-400" />Luka 20–50 tys. zł/rok
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-orange-400 opacity-50" />Niepewne (N&lt;3)
          </span>
        </div>
      </ChartSection>

      {/* Wykres 3: Trend emerytur */}
      <ChartSection
        delay={0.2}
        insight={
          emFirst && emLast
            ? `Emerytura w Małopolsce wzrosła o ${emWzrost}% w ciągu ${emLast.rok - emFirst.rok} lat (${emFirst.rok}–${emLast.rok}), ale wciąż nie pokrywa nawet najtańszego DPS w regionie — brakuje ~415 zł miesięcznie.`
            : 'Trend przeciętnej emerytury ZUS w Małopolsce.'
        }
      >
        <h2 className="text-xl font-bold text-slate-900 mb-1">Trend emerytur ZUS — Małopolska</h2>
        <p className="text-sm text-slate-500 mb-4">
          Przeciętna miesięczna emerytura brutto (z pozarolniczego systemu ZUS). Źródło: GUS BDL P2860.
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={emerytury} margin={{ left: 10, right: 24, top: 10, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="rok" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `${v.toLocaleString('pl-PL')} zł`}
              tick={{ fontSize: 11, fill: '#94a3b8' }} width={84}
              domain={['auto', 'auto']} axisLine={false} tickLine={false} />
            <Tooltip content={<TooltipEmerytura />} cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }} />
            <ReferenceLine y={4500} stroke="#f97316" strokeDasharray="5 5" strokeWidth={1.5}
              label={{ value: 'min. DPS ~4 500 zł', position: 'insideTopRight', fontSize: 10, fill: '#f97316', offset: 6 }} />
            <Line type="monotone" dataKey="wartosc_zl" stroke="#10b981" strokeWidth={2.5}
              dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-400 mt-3 border-t border-slate-100 pt-3">
          Emerytura ZUS brutto. Kwota netto jest niższa — realna luka dla seniora jest zatem większa.
          Pomarańczowa linia = orientacyjny minimalny koszt DPS w Małopolsce.
        </p>
      </ChartSection>

    </div>
  )
}
