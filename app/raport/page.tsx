import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ChevronRight, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import PowiatTable, { type PowiatStat } from './_components/PowiatTable';
import KpiHeroWolne from './_components/KpiHeroWolne';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Wolne miejsca w DPS Małopolska — aktualny rejestr | Kompas Seniora',
  description: 'Aktualne wolne miejsca w domach pomocy społecznej w Małopolsce z podziałem na powiaty. Dane z oficjalnego rejestru MUW Małopolska, aktualizowane co miesiąc.',
};

// Profile specjalistyczne — skrajnie długie kolejki, nie dotyczą seniora "standardowego"
const SPEC_PROFILES = [
  'dla dorosłych niepełnosprawnych intelektualnie',
  'dla dzieci i młodzieży niepełnosprawnych intelektualnie',
  'dla osób przewlekle psychicznie chorych',
];

function isSpecProfile(typ: string | null): boolean {
  if (!typ) return false;
  const t = typ.toLowerCase();
  return SPEC_PROFILES.some(p => t.includes(p.split(' ').slice(2).join(' ')));
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function WolneMiejscaPage() {
  // Ostatnie 2 snapshoty
  const latestDates = await prisma.placowkaWolneMiejsca.findMany({
    where: { placowka: { typ_placowki: 'DPS', wojewodztwo: 'małopolskie' } },
    distinct: ['data_stanu'],
    orderBy: { data_stanu: 'desc' },
    take: 2,
    select: { data_stanu: true },
  });

  const dateFilter = latestDates.map(r => r.data_stanu);
  const lastDate = latestDates[0]?.data_stanu;
  const prevDate = latestDates[1]?.data_stanu;

  const records = await prisma.placowkaWolneMiejsca.findMany({
    where: {
      placowka: { typ_placowki: 'DPS', wojewodztwo: 'małopolskie' },
      data_stanu: { in: dateFilter },
    },
    select: {
      data_stanu: true,
      typ_opieki: true,
      wolne_ogolem: true,
      oczekujacych: true,
      czas_oczekiwania_dni: true,
      placowka: { select: { powiat: true } },
    },
  });

  // Agreguj per (powiat, data_stanu)
  type Agg = { wolne: number; oczek: number; maxCzas: number; maxCzasSpec: number };
  const agg = new Map<string, Agg>();

  for (const r of records) {
    const d = r.data_stanu.toISOString().split('T')[0];
    const key = `${r.placowka.powiat}|${d}`;
    const prev = agg.get(key) ?? { wolne: 0, oczek: 0, maxCzas: 0, maxCzasSpec: 0 };
    const spec = isSpecProfile(r.typ_opieki);
    agg.set(key, {
      wolne: prev.wolne + (r.wolne_ogolem ?? 0),
      oczek: prev.oczek + (r.oczekujacych ?? 0),
      maxCzas: spec ? prev.maxCzas : Math.max(prev.maxCzas, r.czas_oczekiwania_dni ?? 0),
      maxCzasSpec: spec ? Math.max(prev.maxCzasSpec, r.czas_oczekiwania_dni ?? 0) : prev.maxCzasSpec,
    });
  }

  // Zbuduj listę powiatów dla ostatniego snapshotu
  const lastDateStr = lastDate?.toISOString().split('T')[0] ?? '';
  const prevDateStr = prevDate?.toISOString().split('T')[0] ?? '';

  const powiaty = new Set(records.map(r => r.placowka.powiat));
  const rows: PowiatStat[] = Array.from(powiaty).map(powiat => {
    const curr = agg.get(`${powiat}|${lastDateStr}`) ?? { wolne: 0, oczek: 0, maxCzas: 0, maxCzasSpec: 0 };
    const prev = agg.get(`${powiat}|${prevDateStr}`);
    return {
      powiat,
      wolne: curr.wolne,
      wolnePrev: prev?.wolne ?? null,
      oczek: curr.oczek,
      maxCzasDni: curr.maxCzas > 0 ? curr.maxCzas : null,
      maxCzasSpecDni: curr.maxCzasSpec > 0 ? curr.maxCzasSpec : null,
    };
  });

  // Statystyki podsumowania
  const totalWolne = rows.reduce((s, r) => s + r.wolne, 0);
  const totalOczek = rows.reduce((s, r) => s + r.oczek, 0);
  const totalWolnePrev = rows.reduce((s, r) => s + (r.wolnePrev ?? 0), 0);
  const diffWolne = prevDate ? totalWolne - totalWolnePrev : null;
  const withWolne = rows.filter(r => r.wolne > 0).length;

  const dataStanuLabel = lastDate ? formatDate(lastDate) : '';
  const prevLabel = prevDate ? formatDate(prevDate) : '';

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-20">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-8">
            <Link href="/" className="hover:text-slate-200 transition-colors">Kompas Seniora</Link>
            <ChevronRight size={12} />
            <span className="text-slate-300">Raporty</span>
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Rejestr MUW Małopolska · aktualizowany co miesiąc
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Wolne miejsca w DPS<br />
            <span className="text-emerald-400">Małopolska</span>
          </h1>
          <p className="text-slate-300 text-base max-w-xl mb-10">
            Oficjalny rejestr Małopolskiego Urzędu Wojewódzkiego. Stan na <strong className="text-white">{dataStanuLabel}</strong>.
            {prevDate && <span className="text-slate-400"> Poprzedni okres: {prevLabel}.</span>}
          </p>

          {/* KPI */}
          <KpiHeroWolne
            totalWolne={totalWolne}
            totalOczek={totalOczek}
            withWolne={withWolne}
            totalPowiaty={rows.length}
            diffWolne={diffWolne}
          />
        </div>
      </div>

      {/* Treść */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* Tabela */}
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Wolne miejsca według powiatu</h2>
          <p className="text-slate-500 text-sm mb-6">
            Dane łączne dla wszystkich DPS w powiecie. Kolumna <em>Trend</em> pokazuje zmianę liczby wolnych miejsc względem poprzedniego miesiąca.
          </p>
          <PowiatTable rows={rows} dataStanu={dataStanuLabel} />
        </section>

        {/* Sekcja edukacyjna: profil opieki */}
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6 md:p-8">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <h2 className="text-lg font-black text-slate-900">Profil opieki ma znaczenie</h2>
          </div>
          <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <p>
              Ekstremalnie długie kolejki (powyżej 2–3 lat) dotyczą prawie wyłącznie <strong>profili specjalistycznych</strong> — osób z niepełnosprawnością intelektualną lub przewlekłymi chorobami psychicznymi. Dla tych profili liczba miejsc w całej Polsce jest bardzo ograniczona.
            </p>
            <p>
              Jeśli szukasz miejsca dla seniora w podeszłym wieku lub osoby przewlekle somatycznie chorej, rzeczywisty czas oczekiwania jest zwykle <strong>znacznie krótszy</strong> — w wielu powiatach Małopolski miejsca są dostępne od ręki.
            </p>
            <p className="text-slate-500 text-xs">
              Przy sprawdzaniu konkretnego DPS zawsze zapytaj, do jakiego profilu opieki są aktualnie wolne miejsca.
            </p>
          </div>
        </section>

        {/* Sekcja praktyczna */}
        <section>
          <div className="flex items-start gap-3 mb-5">
            <Clock size={20} className="text-slate-400 shrink-0 mt-0.5" />
            <h2 className="text-2xl font-black text-slate-900">Co zrobić, gdy w Twoim powiecie nie ma miejsc?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                n: '1',
                title: 'Złóż wniosek do kilku DPS jednocześnie',
                desc: 'Prawo pozwala być na liście oczekujących w wielu placówkach równocześnie. Nie czekaj na odpowiedź z jednego miejsca.',
              },
              {
                n: '2',
                title: 'Rozważ powiaty sąsiednie',
                desc: 'Tabela powyżej pokazuje, że dostępność różni się istotnie między powiatami. Dąbrowski, Nowotarski czy Brzeski mają często wolne miejsca.',
              },
              {
                n: '3',
                title: 'Zapytaj o konkretny profil',
                desc: 'DPS może mieć wolne miejsca w jednym profilu (np. somatyczny), ale nie w innym. Zawsze pytaj wprost — rejestr to dane zbiorcze.',
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="bg-slate-50 rounded-2xl p-5 border border-stone-100">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center mb-3">{n}</div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-emerald-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-black mb-2">Szukasz konkretnego DPS?</h2>
          <p className="text-emerald-100 text-sm mb-6 max-w-md mx-auto">
            Wyszukiwarka Kompas Seniora pokazuje wszystkie placówki z filtrem "tylko wolne miejsca" — z telefonami, adresami i cennikami.
          </p>
          <Link
            href="/search?wolneMiejsca=true"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors text-sm"
          >
            Znajdź DPS z wolnym miejscem <ArrowRight size={15} />
          </Link>
        </section>

        {/* Link do raportu dostępności */}
        <section className="border border-stone-200 rounded-2xl p-5 flex items-center justify-between gap-4 group hover:border-slate-400 transition-colors">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Raport analityczny · Edycja 2026</div>
            <div className="font-bold text-slate-900 text-sm">Dostępność DPS w Małopolsce — analiza 22 powiatów</div>
            <div className="text-slate-500 text-xs mt-0.5">Wskaźniki nasycenia, luka finansowa, trendy cenowe · dane GUS BDL 2024</div>
          </div>
          <Link href="/raport/dostepnosc-2026" className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
            Czytaj <ArrowRight size={13} />
          </Link>
        </section>

        {/* Stopka źródła */}
        <div className="text-xs text-slate-400 border-t border-stone-100 pt-6 space-y-1">
          <p><strong>Źródło danych:</strong> Rejestr wolnych miejsc w DPS — Małopolski Urząd Wojewódzki w Krakowie.</p>
          <p>Dane aktualizowane co miesiąc na podstawie sprawozdań dyrektorów placówek. Kompas Seniora pobiera plik automatycznie i importuje do bazy.</p>
          <p>Masz pytania lub znalazłeś błąd? <Link href="/" className="underline hover:text-slate-700">Napisz do nas</Link>.</p>
        </div>

      </div>
    </div>
  );
}
