import fs from 'fs'
import path from 'path'
import { parse } from 'papaparse'
import { Metadata } from 'next'
import Link from 'next/link'
import RaportCharts from './RaportCharts'

const PUBLISHED = '2026-05-11'
const DATA_DATE = 'marzec 2026'

export const metadata: Metadata = {
  title: 'Raport: Dostępność DPS w Małopolsce 2026 | Kompas Seniora',
  description: 'Kompleksowa analiza dostępności i kosztów Domów Pomocy Społecznej w 22 powiatach Małopolski. Wskaźniki nasycenia, luka finansowa, trendy cenowe 2020–2026.',
  openGraph: {
    title: 'Raport: Dostępność DPS w Małopolsce 2026',
    description: 'Analiza 22 powiatów — wskaźniki nasycenia, luka finansowa i trendy cenowe DPS. Dane: GUS BDL 2024, MUW Małopolska 2026.',
    url: 'https://kompas-seniora.pl/raport',
    siteName: 'Kompas Seniora',
    type: 'article',
    publishedTime: PUBLISHED,
    locale: 'pl_PL',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dostępność DPS w Małopolsce 2026 | Kompas Seniora',
    description: 'Analiza 22 powiatów — wskaźniki nasycenia, luka finansowa i trendy cenowe DPS.',
  },
}

export type PowiatRow = {
  powiat: string
  dps_placowki: number
  dps_miejsca: number
  pop_80plus_2024: number
  pop_80plus_prog2035: number
  dostepnosc_2024: number
  dostepnosc_2035: number
  cena_dps_mediana: number | null
  n_placowek_z_cena: number
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
      dps_placowki:         Number(r.dps_placowki) || 0,
      dps_miejsca:          Number(r.dps_miejsca),
      pop_80plus_2024:      Number(r.pop_80plus_2024),
      pop_80plus_prog2035:  Number(r.pop_80plus_prog2035) || 0,
      dostepnosc_2024:      Number(r.dostepnosc_2024) || 0,
      dostepnosc_2035:      Number(r.dostepnosc_2035) || 0,
      cena_dps_mediana:     r.cena_dps_mediana ? Number(r.cena_dps_mediana) : null,
      n_placowek_z_cena:    Number(r.n_placowek_z_cena) || 0,
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

  const emerytura2025 = emerytury.find(e => e.rok === 2025)?.wartosc_zl ?? 0
  const totalMiejsc = powiaty.reduce((s, r) => s + r.dps_miejsca, 0)
  const totalPop80  = powiaty.reduce((s, r) => s + r.pop_80plus_2024, 0)
  const avgDost = Math.round(totalMiejsc / totalPop80 * 10000)
  const totalPlacowek = powiaty.reduce((s, r) => s + r.dps_placowki, 0)
  const totalZCena = powiaty.reduce((s, r) => s + r.n_placowek_z_cena, 0)

  // Outlierzy — powiaty zaburzające statystyki (porównanie case-insensitive)
  const OUTLIERS = ['krakowski', 'm. kraków', 'm. tarnów', 'm. nowy sącz']
  const isOutlier = (p: string) => OUTLIERS.includes(p.toLowerCase())
  const powiatyZiemskie = powiaty.filter(r => !isOutlier(r.powiat))

  // Dysproporcja: tylko powiaty ziemskie (bez miast i krakowskiego)
  const worst = powiaty[0]                                    // chrzanowski (171)
  const bestZiemski = powiatyZiemskie[powiatyZiemskie.length - 1] // miechowski (1365)
  const disparity = bestZiemski && worst
    ? Math.round(bestZiemski.dostepnosc_2024 / worst.dostepnosc_2024)
    : null

  // KPI luka — najgorszy WIARYGODNY powiat ziemski (N≥3, nie outlier)
  const powiatyRzetelneLuka = powiatyZiemskie
    .filter(r => !isOutlier(r.powiat) && r.n_placowek_z_cena >= 3 && r.cena_dps_mediana !== null)
    .map(r => ({
      ...r,
      luka_systemowa_rok: Math.round(((r.cena_dps_mediana ?? 0) - 0.7 * r.emerytura_malopolska) * 12),
    }))
    .sort((a, b) => b.luka_systemowa_rok - a.luka_systemowa_rok)
  const worstLukaKPI = powiatyRzetelneLuka[0]

  // Top 3 najgorsze / najlepsze — powiaty ziemskie (bez outlierów w zestawieniu)
  const top3Najgorsze = powiatyZiemskie.slice(0, 3)
  const top3Najlepsze = [...powiatyZiemskie].reverse().slice(0, 3)

  const powiatyForChart = powiaty.map(r => ({
    ...r,
    powiat: formatPowiat(r.powiat),
  }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Dostępność DPS w Małopolsce 2026',
    description: 'Wskaźniki dostępności Domów Pomocy Społecznej w 22 powiatach Małopolski: miejsca DPS na 10 000 mieszkańców 80+, luka finansowa, trend cen 2023–2026.',
    url: 'https://kompas-seniora.pl/raport',
    creator: { '@type': 'Organization', name: 'Kompas Seniora', url: 'https://kompas-seniora.pl' },
    datePublished: PUBLISHED,
    temporalCoverage: '2024/2026',
    spatialCoverage: 'Małopolska, Polska',
    license: 'https://creativecommons.org/licenses/by/4.0/',
    distribution: [{
      '@type': 'DataDownload',
      encodingFormat: 'text/csv',
      contentUrl: 'https://kompas-seniora.pl/data/wskaznik_nasycenia_malopolska.csv',
    }],
    variableMeasured: [
      'Wskaźnik dostępności DPS (miejsca/10k seniorów 80+)',
      'Luka finansowa (mediana kosztu DPS − emerytura ZUS)',
      'Populacja 80+ per powiat (GUS BDL 2024)',
    ],
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero — ciemny, raportowy */}
      <section className="relative bg-slate-900 overflow-hidden">
        {/* Subtelny pattern w tle */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
        {/* Emerald accent bar na górze */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-12">

          {/* Breadcrumb + tag */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <nav className="flex items-center gap-2 text-sm text-slate-400">
              <Link href="/" className="hover:text-emerald-400 transition-colors">Kompas Seniora</Link>
              <span>/</span>
              <span className="text-slate-300">Raport</span>
            </nav>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
              Raport #1 · Edycja 2026
            </span>
            <span className="text-slate-500 text-xs">
              Opublikowano: 11 maja 2026 · Dane: {DATA_DATE}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            Dostępność DPS<br className="hidden md:block" />
            <span className="text-emerald-400"> w Małopolsce</span>
          </h1>

          <p className="text-slate-300 text-lg max-w-2xl mb-2">
            Kompleksowa analiza 22 powiatów — wskaźniki nasycenia, luka finansowa
            i trendy cenowe Domów Pomocy Społecznej.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Metodologia: liczba miejsc DPS (MUW Małopolska, marzec 2026) na 10 000 mieszkańców
            w wieku 80+ (GUS BDL 2024). Ceny i luka finansowa dla {totalZCena} z {totalPlacowek} placówek
            posiadających dane cenowe.
          </p>

          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">

            {/* KPI 1 — średnia */}
            <div className="bg-slate-800 border border-slate-600 rounded-2xl p-5">
              <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Średnia Małopolska
              </div>
              <div className="text-4xl font-black text-white mb-1">{avgDost}</div>
              <div className="text-slate-300 text-xs mt-2 leading-relaxed">
                miejsc DPS na 10 tys.<br />seniorów 80+
              </div>
            </div>

            {/* KPI 2 — najgorszy */}
            <div className="bg-red-900 border border-red-700 rounded-2xl p-5">
              <div className="text-[10px] font-semibold text-red-200 uppercase tracking-wider mb-3">
                Najgorszy powiat
              </div>
              <div className="text-4xl font-black text-white mb-1">
                {Math.round(worst?.dostepnosc_2024 ?? 0)}
              </div>
              <div className="text-red-200 text-xs mt-2 leading-relaxed">
                miejsc / 10 tys. 80+<br />
                <span className="font-semibold">{formatPowiat(worst?.powiat ?? '')}</span>
              </div>
            </div>

            {/* KPI 3 — emerytura */}
            <div className="bg-slate-800 border border-slate-600 rounded-2xl p-5">
              <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Emerytura ZUS 2025
              </div>
              <div className="text-3xl font-black text-white mb-1">
                {emerytura2025
                  ? `${emerytura2025.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł`
                  : '—'}
              </div>
              <div className="text-slate-300 text-xs mt-2 leading-relaxed">
                średnia brutto · Małopolska
              </div>
            </div>

            {/* KPI 4 — luka systemowa */}
            <div className="bg-slate-800 border border-slate-600 rounded-2xl p-5">
              <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Luka systemowa / rok
              </div>
              <div className="text-3xl font-black text-white mb-1">
                {worstLukaKPI
                  ? `${Math.round(worstLukaKPI.luka_systemowa_rok / 1000)} tys. zł`
                  : '—'}
              </div>
              <div className="text-slate-300 text-xs mt-2 leading-relaxed">
                co dopłaca rodzina lub gmina<br />
                <span className="font-semibold text-white capitalize">{worstLukaKPI?.powiat ?? ''}</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Top 3 / Bottom 3 */}
      <div className="bg-slate-800 border-t border-slate-600">
        <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-2 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Najgorszy dostęp</span>
            </div>
            {top3Najgorsze.map((r, i) => (
              <div key={r.powiat} className="flex items-center gap-3 py-2 border-b border-slate-600 last:border-0">
                <span className="text-slate-400 text-xs w-4 flex-shrink-0">{i + 1}.</span>
                <span className="capitalize text-white text-sm font-semibold">{formatPowiat(r.powiat)}</span>
                <span className="ml-auto bg-slate-700 text-white font-bold text-xs px-2 py-1 rounded-lg tabular-nums">{r.dostepnosc_2024.toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Najlepszy dostęp</span>
            </div>
            {top3Najlepsze.map((r, i) => (
              <div key={r.powiat} className="flex items-center gap-3 py-2 border-b border-slate-600 last:border-0">
                <span className="text-slate-400 text-xs w-4 flex-shrink-0">{i + 1}.</span>
                <span className="capitalize text-white text-sm font-semibold">{formatPowiat(r.powiat)}</span>
                <span className="ml-auto bg-slate-700 text-white font-bold text-xs px-2 py-1 rounded-lg tabular-nums">{r.dostepnosc_2024.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 pb-4 px-4">Powiaty ziemskie — bez miast na prawach powiatu i powiatu krakowskiego</p>
      </div>

      {/* Gradient przejście hero → jasna treść */}
      <div className="h-8 bg-gradient-to-b from-slate-900 to-slate-50" />

      {/* Wykresy (Client Component) */}
      <RaportCharts powiaty={powiatyForChart} emerytury={emerytury} avgDost={avgDost} />

      {/* Metodologia */}
      <section className="bg-slate-100 border-t border-slate-200 mt-4">
        <div className="max-w-5xl mx-auto px-4 py-12">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-slate-400 rounded-full" />
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              Źródła i metodologia
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600 mb-8">
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="font-semibold text-slate-800 mb-2">Liczba miejsc DPS</div>
              <p className="leading-relaxed">
                Baza Kompas Seniora — dane z oficjalnego wykazu DPS Małopolskiego Urzędu
                Wojewódzkiego (marzec 2026). Uwzględniono wyłącznie placówki typu DPS
                (Domy Pomocy Społecznej), bez Środowiskowych Domów Samopomocy.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="font-semibold text-slate-800 mb-2">Koszty pobytu w DPS</div>
              <p className="leading-relaxed">
                Oficjalny miesięczny koszt utrzymania ogłaszany przez Małopolski Urząd Wojewódzki
                na podstawie art. 60 ust. 2 ustawy o pomocy społecznej — publikowany corocznie
                do 31 marca, obowiązujący od 1 kwietnia danego roku. Dane za lata 2023–2026
                z PDF-ów MUW. Nie są to ceny rynkowe ani self-reported — wyłącznie stawki
                z oficjalnego rejestru.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="font-semibold text-slate-800 mb-2">Populacja 80+</div>
              <p className="leading-relaxed">
                GUS Bank Danych Lokalnych, zmienne 76024 + 76025 (grupy wiekowe 80–84 oraz
                85+ ogółem), poziom powiatowy, dane za rok 2024.{' '}
                <a
                  href="https://bdl.stat.gov.pl/BDL/metadane/podgrup-opis/2137"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline underline-offset-2 hover:text-emerald-600"
                >
                  Źródło GUS BDL
                </a>
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="font-semibold text-slate-800 mb-2">Emerytura ZUS</div>
              <p className="leading-relaxed">
                GUS BDL, P2860 — przeciętna miesięczna emerytura brutto z pozarolniczego
                systemu ZUS, Małopolskie 2025.{' '}
                <a
                  href="https://bdl.stat.gov.pl/BDL/dane/podgrup/tablica?rok=0&id=P2860"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 underline underline-offset-2 hover:text-emerald-600"
                >
                  Źródło GUS BDL
                </a>
              </p>
            </div>
          </div>

          {/* Uwagi interpretacyjne */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 text-sm text-slate-600 mb-4">
            <div className="font-semibold text-slate-700 mb-2">Uwagi interpretacyjne</div>
            <ul className="space-y-2 list-disc list-inside text-slate-500">
              <li>
                Wskaźnik dostępności może być zawyżony dla powiatu krakowskiego — część
                tamtejszych DPS przyjmuje mieszkańców z całego województwa (efekt ponadlokalny).
                Powiat krakowski jest wyłączony z KPI dysproporcji.
              </li>
              <li>
                <strong className="text-slate-600">Luka finansowa to koszt utrzymania</strong>,
                nie faktyczna dopłata rodziny. Gmina/MOPS może dofinansować pobyt do
                wysokości dochodu seniora — faktyczna dopłata rodziny jest zazwyczaj niższa.
                Raport pokazuje skalę problemu systemowego, nie indywidualny rachunek.
              </li>
              <li>
                Emerytura podana jest w kwocie <strong className="text-slate-600">brutto</strong>.
                Kwota netto jest niższa o podatek i składki — luka finansowa netto jest zatem
                większa niż wykazana.
              </li>
              <li>
                Prognoza 2035 to <strong className="text-slate-600">scenariusz braku
                inwestycji</strong> — zakłada stałą liczbę miejsc DPS przy rosnącej populacji
                80+. Nie uwzględnia planowanych inwestycji samorządowych.
              </li>
              <li>
                Dane o cenach dotyczą {totalZCena} z {totalPlacowek} placówek posiadających
                publicznie dostępną informację o koszcie pobytu. Przy N=1 mediana = cena
                jedynej placówki w powiecie.
              </li>
            </ul>
          </div>

          <p className="text-xs text-slate-400">
            Dane pobrano: maj 2026. Kompas Seniora nie ponosi odpowiedzialności za decyzje
            podjęte wyłącznie na podstawie tych danych. Przed wyborem placówki zalecamy
            bezpośredni kontakt z DPS i weryfikację aktualnych kosztów.
          </p>
        </div>
      </section>

      {/* Tabela surowych danych */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Surowe dane — wszystkie powiaty</h2>
          <p className="text-sm text-slate-500 mb-5">Małopolska 2024. Kliknij nagłówek kolumny żeby posortować.</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Powiat</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Miejsc DPS</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Seniorów 80+</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Dost. 2024</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Dost. 2035*</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Med. cena DPS</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">N cen</th>
                </tr>
              </thead>
              <tbody>
                {powiaty.map((r, i) => (
                  <tr key={r.powiat} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="px-4 py-2.5 font-medium text-slate-800 capitalize">{r.powiat}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.dps_miejsca.toLocaleString('pl-PL')}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{r.pop_80plus_2024.toLocaleString('pl-PL')}</td>
                    <td className="px-4 py-2.5 text-right font-bold"
                      style={{ color: r.dostepnosc_2024 < 250 ? '#ef4444' : r.dostepnosc_2024 < 500 ? '#f97316' : '#10b981' }}>
                      {r.dostepnosc_2024.toFixed(0)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{r.dostepnosc_2035.toFixed(0)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">
                      {r.cena_dps_mediana ? `${r.cena_dps_mediana.toLocaleString('pl-PL')} zł` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`text-xs font-medium ${(r.n_placowek_z_cena ?? 0) < 3 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {r.n_placowek_z_cena ?? 0}
                        {(r.n_placowek_z_cena ?? 0) < 3 ? ' ⚠' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            *Prognoza 2035 = scenariusz braku inwestycji (stała liczba miejsc, rosnąca populacja GUS).
            ⚠ = mniej niż 3 placówki z danymi cenowymi — mediana mało wiarygodna.
          </p>
        </div>
      </section>

      {/* Pobierz dane */}
      <section className="bg-emerald-950 border-t border-emerald-900">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Otwarte dane · CC BY 4.0</div>
            <div className="font-bold text-white mb-1">Pobierz surowe dane</div>
            <p className="text-emerald-300/70 text-sm">
              Pliki CSV do dalszej analizy. Cytując, podaj źródło: <span className="text-emerald-400">Kompas Seniora, kompas-seniora.pl/raport</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <a
              href="/data/wskaznik_nasycenia_malopolska.csv"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              ↓ Wskaźnik nasycenia (CSV)
            </a>
            <a
              href="/data/gus_populacja_malopolska.csv"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              ↓ Populacja 80+ GUS (CSV)
            </a>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-semibold text-slate-800 mb-1">Masz pytania do danych?</div>
            <p className="text-sm text-slate-500">
              Jeśli zauważysz nieścisłość lub chcesz zgłosić aktualizację danych — napisz do nas.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a
              href="mailto:kontakt@kompas-seniora.pl?subject=Pytanie do raportu DPS Małopolska"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Napisz do nas
            </a>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Szukaj placówki
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
