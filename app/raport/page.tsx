import fs from 'fs'
import path from 'path'
import { parse } from 'papaparse'
import { Metadata } from 'next'
import RaportCharts from './RaportCharts'

export const metadata: Metadata = {
  title: 'Raport: Dostępność DPS w Małopolsce | Kompas Seniora',
  description: 'Dane o dostępności i kosztach Domów Pomocy Społecznej w Małopolsce. Wskaźniki nasycenia, luka finansowa, trendy cenowe 2023–2026.',
}

export type PowiatRow = {
  powiat: string
  dps_miejsca: number
  pop_80plus_2024: number
  dostepnosc_2024: number
  dostepnosc_2035: number
  cena_dps_mediana: number | null
  emerytura_malopolska: number
  luka_miesieczna_zl: number | null
  luka_roczna_zl: number | null
}

export type EmeryRow = {
  rok: number
  wartosc_zl: number
}

function loadSaturation(): PowiatRow[] {
  const file = path.join(process.cwd(), 'data', 'wskaznik_nasycenia_malopolska.csv')
  const content = fs.readFileSync(file, 'utf-8')
  const { data } = parse(content, { header: true, skipEmptyLines: true })
  return (data as Record<string, string>[])
    .map(r => ({
      powiat:               r.powiat,
      dps_miejsca:          Number(r.dps_miejsca),
      pop_80plus_2024:      Number(r.pop_80plus_2024),
      dostepnosc_2024:      Number(r.dostepnosc_2024) || 0,
      dostepnosc_2035:      Number(r.dostepnosc_2035) || 0,
      cena_dps_mediana:     r.cena_dps_mediana ? Number(r.cena_dps_mediana) : null,
      emerytura_malopolska: Number(r.emerytura_malopolska),
      luka_miesieczna_zl:   r.luka_miesieczna_zl ? Number(r.luka_miesieczna_zl) : null,
      luka_roczna_zl:       r.luka_roczna_zl ? Number(r.luka_roczna_zl) : null,
    }))
    .filter(r => r.dostepnosc_2024 > 0)
    .sort((a, b) => a.dostepnosc_2024 - b.dostepnosc_2024)
}

function loadEmerytury(): EmeryRow[] {
  const file = path.join(process.cwd(), 'data', 'gus_emerytury_wojewodztwa.csv')
  const content = fs.readFileSync(file, 'utf-8')
  const { data } = parse(content, { header: true, skipEmptyLines: true })
  return (data as Record<string, string>[])
    .filter(r => r.wojewodztwo.includes('MAŁOPOL') && r.wskaznik === 'emerytura_zus')
    .map(r => ({ rok: Number(r.rok), wartosc_zl: Number(r.wartosc_zl) }))
    .filter(r => r.rok >= 2020)
    .sort((a, b) => a.rok - b.rok)
}

function formatPowiat(s: string) {
  if (s.startsWith('m. ')) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function RaportPage() {
  const powiaty   = loadSaturation()
  const emerytury = loadEmerytury()

  const worst3  = powiaty.slice(0, 3)
  const emerytura2025 = emerytury.find(e => e.rok === 2025)?.wartosc_zl ?? 0
  const totalMiejsc = powiaty.reduce((s, r) => s + r.dps_miejsca, 0)
  const totalPop80  = powiaty.reduce((s, r) => s + r.pop_80plus_2024, 0)
  const avgDost = Math.round(totalMiejsc / totalPop80 * 10000)

  const powiatyForChart = powiaty.map(r => ({
    ...r,
    powiat: formatPowiat(r.powiat),
  }))

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Dane i Analizy · Kompas Seniora
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Dostępność DPS w Małopolsce
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mb-8">
            Analiza 22 powiatów — wskaźniki nasycenia, luka finansowa i trendy cenowe
            Domów Pomocy Społecznej. Dane: GUS BDL 2024, MUW Małopolska 2026.
          </p>

          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="text-2xl font-bold text-slate-900">{avgDost}</div>
              <div className="text-xs text-slate-500 mt-1">miejsc DPS / 10 tys. seniorów 80+<br/>średnia Małopolska</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="text-2xl font-bold text-red-700">{Math.round(worst3[0]?.dostepnosc_2024 ?? 0)}</div>
              <div className="text-xs text-red-600 mt-1">miejsc / 10 tys. seniorów 80+<br/>najgorszy powiat ({formatPowiat(worst3[0]?.powiat ?? '')})</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <div className="text-2xl font-bold text-amber-800">
                {emerytura2025 ? `${emerytura2025.toLocaleString('pl-PL', {maximumFractionDigits: 0})} zł` : '—'}
              </div>
              <div className="text-xs text-amber-700 mt-1">średnia emerytura ZUS brutto<br/>Małopolska 2025</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <div className="text-2xl font-bold text-orange-800">
                {worst3[1]?.luka_roczna_zl
                  ? `${(worst3[1].luka_roczna_zl / 1000).toFixed(0)} tys. zł`
                  : '—'}
              </div>
              <div className="text-xs text-orange-700 mt-1">roczna luka finansowa<br/>powiat {formatPowiat(worst3[1]?.powiat ?? '')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Wykresy (Client Component) */}
      <RaportCharts powiaty={powiatyForChart} emerytury={emerytury} />

      {/* Metodologia */}
      <section className="bg-white border-t border-slate-200 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Źródła i metodologia</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-slate-600">
            <div>
              <div className="font-medium text-slate-800 mb-1">Liczba miejsc DPS</div>
              <p>Baza Kompas Seniora — dane z wykazu DPS MUW Małopolska (marzec 2026). Tylko placówki typu DPS (bez ŚDS).</p>
            </div>
            <div>
              <div className="font-medium text-slate-800 mb-1">Populacja 80+</div>
              <p>GUS Bank Danych Lokalnych, zmienne 76024+76025 (80–84 + 85+ ogółem), poziom powiatowy, 2024 r.{' '}
                <a href="https://bdl.stat.gov.pl/BDL/metadane/podgrup-opis/2137" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">Źródło</a>
              </p>
            </div>
            <div>
              <div className="font-medium text-slate-800 mb-1">Emerytura ZUS</div>
              <p>GUS BDL, P2860 — przeciętna miesięczna emerytura brutto z pozarolniczego systemu ZUS, Małopolskie 2025.{' '}
                <a href="https://bdl.stat.gov.pl/BDL/dane/podgrup/tablica?rok=0&id=P2860" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">Źródło</a>
              </p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
            <strong>Uwaga interpretacyjna:</strong> Wskaźnik dostępności (miejsc/10k seniorów 80+) może być zawyżony
            dla powiatu krakowskiego — część tamtejszych DPS obsługuje mieszkańców z całego województwa.
            Dane o cenach dotyczą placówek z dostępną informacją o koszcie (
            {powiaty.reduce((s, r) => s + (r.n_placowek_z_cena ?? 0), 0)} z {powiaty.reduce((s, r) => s + r.dps_miejsca, 0)} miejsc).
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Dane pobrano: maj 2026. Kompas Seniora nie ponosi odpowiedzialności za decyzje podjęte wyłącznie na podstawie tych danych.
            Przed wyborem placówki zalecamy bezpośredni kontakt z DPS.
          </p>
        </div>
      </section>

    </main>
  )
}
