'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Heart, Globe, ShieldCheck, Check, User } from 'lucide-react';

const CheckItem = ({ title, desc }: { title: string; desc: string }) => (
  <div className="flex items-start gap-4">
    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
      <Check size={14} strokeWidth={3} />
    </div>
    <div>
      <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed mt-1">{desc}</p>
    </div>
  </div>
);

export default function MisjaClient() {
  return (
    <div className="min-h-screen bg-[#FCFCFB]">

      <div className="max-w-4xl mx-auto px-4 pt-10 pb-24 md:pt-16">

        {/* Back */}
        <Link
          href="/"
          className="group flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold mb-8 transition-all px-4 py-2 rounded-xl hover:bg-white w-fit"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Wróć do strony głównej
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-[3rem] border border-stone-200 shadow-2xl shadow-slate-900/5 overflow-hidden">

          {/* Header */}
          <div className="bg-slate-950 p-8 md:p-20 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600 opacity-10 rounded-full blur-[120px] -mr-32 -mt-32" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10">
                <Heart size={10} className="text-primary-400" />
                Historia, która stoi za tym projektem
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 tracking-tight leading-[1.1]">
                Misja
              </h1>
              <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl leading-relaxed">
                Jestem Polakiem mieszkającym za granicą. Znam ten moment gdy próbujesz pomóc
                rodzinie przez telefon i nie wiesz nawet od czego zacząć pytać.
              </p>
            </div>
          </div>

          <div className="p-8 md:p-20 space-y-20">

            {/* Origin Story */}
            <section>
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 border border-primary-100 text-primary-600">
                  <Heart size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-serif font-bold text-slate-900 mb-6">
                    Skąd się to wzięło
                  </h2>
                  <div className="space-y-5 text-lg text-slate-600 leading-relaxed">
                    <p>
                      Kiedy ktoś bliski w mojej rodzinie potrzebował opieki, zderzyłem się ze ścianą.
                      Internet był pełen nieaktualnych stron i urzędowego języka.
                      <strong> Nikt nie potrafił jasno powiedzieć, ile to kosztuje i ile się czeka.</strong>
                    </p>
                    <p>
                      Nie brakowało informacji. Brakowało jednego miejsca, które zbiera je razem
                      i podaje po ludzku. Postanowiłem to zbudować.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* For whom - prose, not cards */}
            <section>
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0 border border-primary-100 text-primary-600">
                  <Globe size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-serif font-bold text-slate-900 mb-6">
                    Dla kogo
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed mb-6">
                    Ten projekt tworzę z myślą o trzech grupach, które łączy jedno: stanęły przed
                    trudną decyzją bez wystarczających informacji.
                  </p>
                  <ul className="space-y-4 text-slate-600">
                    <li className="flex items-start gap-3">
                      <span className="text-primary-500 mt-1 shrink-0">—</span>
                      <span>Dzieci i wnuki, którzy pod presją czasu muszą podjąć najlepszą możliwą decyzję o opiece dla kogoś bliskiego.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-500 mt-1 shrink-0">—</span>
                      <span>Polacy mieszkający za granicą, którzy próbują pomóc rodzicom z odległości — przez telefon, bez znajomości lokalnych procedur.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-500 mt-1 shrink-0">—</span>
                      <span>Seniorzy, którzy sami chcą świadomie zaplanować swoją przyszłość — zanim ktoś inny będzie musiał to robić za nich.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Principles */}
            <section className="bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-stone-100">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-xl bg-white text-primary-600 flex items-center justify-center shadow-sm">
                  <ShieldCheck size={28} />
                </div>
                <h2 className="text-3xl font-serif font-bold text-slate-900">Moje zasady</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <CheckItem
                    title="Tylko oficjalne dane"
                    desc="Korzystam wyłącznie z oficjalnych źródeł: BIP, MOPS, rejestry publiczne. Żadnych danych od placówek płacących za lepszą pozycję."
                  />
                  <CheckItem
                    title="Bez reklam i prowizji"
                    desc="Nie biorę pieniędzy od placówek. Wyniki są obiektywne — zawsze i bezpłatnie."
                  />
                </div>
                <div className="space-y-4">
                  <CheckItem
                    title="Twoje dane są twoje"
                    desc="Nie zapisuję Twoich wyszukiwań na serwerze. Notatki i ulubione zostają wyłącznie w Twojej przeglądarce."
                  />
                  <CheckItem
                    title="Ludzki język"
                    desc="Tłumaczę przepisy i procedury na konkretne kroki — bez urzędowego żargonu."
                  />
                </div>
              </div>
            </section>

            {/* One man band */}
            <section>
              <div className="flex flex-col md:flex-row gap-10 items-start">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 text-emerald-600">
                  <User size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-serif font-bold text-slate-900 mb-6">
                    Jeden człowiek, otwarty na więcej
                  </h2>
                  <div className="space-y-5 text-lg text-slate-600 leading-relaxed">
                    <p>
                      Nazywam się Szymon J. Prowadzę ten projekt sam, w wolnym czasie,
                      bez inwestorów i bez ukrytych interesów.
                    </p>
                    <p>
                      Jeśli jesteś pracownikiem socjalnym, dyrektorem placówki lub masz pomysł
                      jak to usprawnić — chętnie porozmawiam. Każda placówka która chce samodzielnie
                      aktualizować swoje dane jest mile widziana.
                    </p>
                  </div>
                  <div className="mt-8">
                    <a
                      href="mailto:kontakt@kompaseniora.pl"
                      className="inline-flex items-center justify-center gap-3 bg-slate-950 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg active:scale-95"
                    >
                      <Mail size={16} />
                      kontakt@kompaseniora.pl
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Manifesto closing */}
            <section className="border-t border-stone-100 pt-16 text-center">
              <p className="text-2xl md:text-3xl font-serif text-slate-800 leading-relaxed max-w-2xl mx-auto">
                Chcę, żeby żadna rodzina w Polsce nie podejmowała tej decyzji w chaosie.
              </p>
              <div className="w-12 h-1 bg-primary-500 mx-auto mt-8" />
            </section>

          </div>

          {/* Footer */}
          <div className="bg-stone-50 border-t border-stone-100 py-6 text-center">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">
              Stworzone z pasji dla seniorów • 2025
            </p>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="mt-12 flex items-center justify-center gap-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-600 font-black uppercase text-[10px] tracking-[0.3em] transition-all group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Powrót na stronę główną
          </Link>
          <span className="text-stone-200">|</span>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-primary-600 font-black uppercase text-[10px] tracking-[0.3em] transition-all"
          >
            Wyszukaj placówki
            <ArrowLeft size={14} className="rotate-180" />
          </Link>
        </div>

      </div>
    </div>
  );
}
