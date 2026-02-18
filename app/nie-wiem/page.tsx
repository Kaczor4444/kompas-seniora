import Link from 'next/link';
import { Sparkles, ChevronRight, Clock, Home, Sun, Check, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Nie wiesz co wybrać? DPS czy ŚDS — Kompas Seniora',
  description: 'Wyjaśniamy różnicę między DPS (całodobowy) a ŚDS (dzienny). Znajdź odpowiednią formę opieki dla swojego bliskiego.',
};

const dpsFeatures = [
  'Pobyt całodobowy — senior mieszka w placówce',
  'Opieka medyczna i pielęgniarska przez całą dobę',
  'Koszt: 70% dochodu seniora, resztę dopłaca gmina',
  'Dla osób z demencją, po udarze, ze znaczną niepełnosprawnością',
  'Wymaga skierowania przez MOPS i orzeczenia o niezbędności',
];

const sdsFeatures = [
  'Opieka dzienna — senior wraca do domu wieczorem',
  'Wsparcie terapeutyczne, rehabilitacja, zajęcia grupowe',
  'Koszty uzależnione od dochodu — często bezpłatne',
  'Dla osób z niepełnosprawnością intelektualną lub psychiczną',
  'Brak długich list oczekujących, szybszy dostęp',
];

export default function NieWiemPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <section className="bg-slate-50 border-b border-slate-100 py-14 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Pomoc w wyborze
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-[1.0] mb-5">
            Nie wiesz<br />
            <span className="text-emerald-600 relative inline-block">
              co wybrać?
              <svg className="absolute -bottom-2 left-0 w-full overflow-visible" viewBox="0 0 400 16" fill="none" preserveAspectRatio="none">
                <path d="M0 12 Q100 2 200 10 Q300 18 400 6" stroke="#bbf7d0" strokeWidth="5" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>
          <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto leading-relaxed mt-6">
            Spokojnie. Poniżej wyjaśniamy czym różni się <strong className="text-slate-900">DPS</strong> od <strong className="text-slate-900">ŚDS</strong> — i który lepiej pasuje do sytuacji Twojego bliskiego.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="py-14 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* DPS Card */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-900 transition-colors overflow-hidden group">
              {/* Top accent */}
              <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Home size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400">Całodobowy</p>
                    <p className="text-white font-black text-lg leading-tight">DPS</p>
                  </div>
                </div>
                <span className="bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Clock size={11} /> 24h / 7 dni
                </span>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Dom Pomocy Społecznej</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">
                  Senior <strong className="text-slate-700">mieszka w placówce</strong> i ma zapewnioną opiekę przez całą dobę. Rozwiązanie dla osób, które nie są w stanie samodzielnie funkcjonować w domu.
                </p>

                <ul className="space-y-2.5 mb-6">
                  {dpsFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/search?type=dps"
                  className="w-full bg-slate-900 hover:bg-emerald-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] transition-all active:scale-95 flex items-center justify-center gap-2 group-hover:bg-emerald-600"
                >
                  Szukaj DPS w Małopolsce <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* ŚDS Card */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-500 transition-colors overflow-hidden group">
              {/* Top accent */}
              <div className="bg-emerald-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Sun size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-100">Dzienny</p>
                    <p className="text-white font-black text-lg leading-tight">ŚDS</p>
                  </div>
                </div>
                <span className="bg-white/20 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <Sun size={11} /> Rano–popołudnie
                </span>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Środowiskowy Dom Samopomocy</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">
                  Senior <strong className="text-slate-700">wraca do domu wieczorem</strong>. ŚDS zapewnia wsparcie w ciągu dnia — terapię, rehabilitację i kontakt z innymi. Dla osób w miarę samodzielnych.
                </p>

                <ul className="space-y-2.5 mb-6">
                  {sdsFeatures.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/search?type=śds"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.15em] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Szukaj ŚDS w Małopolsce <ArrowRight size={14} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Still unsure → AI Assistant CTA */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-slate-900 rounded-2xl p-8 md:p-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center mx-auto mb-5">
              <Sparkles size={22} />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-3">
              Nadal nie masz pewności?
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-7 max-w-md mx-auto">
              Odpowiedz na 4 pytania o stan zdrowia i potrzeby seniora. Asystent AI wskaże właściwą opcję i przygotuje konkretny plan działania.
            </p>
            <Link
              href="/asystent?start=true"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.15em] transition-all active:scale-95"
            >
              <Sparkles size={14} />
              Uruchom Asystenta AI
              <ChevronRight size={14} />
            </Link>
            <p className="text-slate-500 text-[11px] mt-4 font-medium">2 minuty · Bez rejestracji · Bezpłatnie</p>
          </div>
        </div>
      </section>

    </div>
  );
}
