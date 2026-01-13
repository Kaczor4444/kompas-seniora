'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function MisjaClient() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-stone-200 z-50">
        <div
          className="h-full bg-primary-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-10 pb-24 md:pt-16">

        {/* Back Button */}
        <Link
          href="/"
          className="group flex items-center gap-2 text-slate-600 hover:text-primary-600 font-bold mb-8 transition-colors px-4 py-2 rounded-xl hover:bg-white/50 w-fit"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center group-hover:border-primary-300 transition-colors shadow-sm">
            <ArrowLeft size={16} />
          </div>
          Wróć do strony głównej
        </Link>

        {/* Main Card */}
        <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-xl shadow-slate-900/5 overflow-hidden">

          {/* Dark Header - LEFT ALIGNED */}
          <div className="bg-slate-900 p-8 md:p-14 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10">
                <svg className="w-3 h-3 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Dlaczego powstaliśmy
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Misja</h1>
              <p className="text-slate-400 font-medium">
                Jesteśmy tu, żebyś w trudnym momencie nie był sam
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-14">

            {/* Introduction */}
            <section className="mb-16">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
                Rozmowy o opiece nad seniorem pojawiają się zwykle nagle — często wtedy, gdy jesteśmy już zmęczeni, zmartwieni albo pełni niepewności — i boimy się podjąć złą decyzję.
              </p>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-6">
                Nagle trzeba przebrnąć przez setki stron, różne przepisy i instytucje, które tłumaczą te same rzeczy na różne sposoby. Łatwo w tym wszystkim poczuć się przytłoczonym.
              </p>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-semibold">
                Właśnie dlatego powstał Kompas Seniora — żeby uporządkować informacje, uspokoić chaos i pomóc Ci zrozumieć, od czego zacząć.
              </p>
            </section>

            {/* Mission */}
            <section className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="m-0 text-3xl md:text-4xl font-serif font-bold text-gray-900">
                  Nasza misja
                </h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Tworzymy miejsce, które w prosty sposób pokazuje, jakie formy opieki są dostępne dla osób starszych: czym różni się dom pomocy społecznej od opieki długoterminowej, czym są placówki dzienne i jakie dokumenty trzeba przygotować, aby złożyć wniosek.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed italic">
                Wszystko tłumaczymy tak, jak sami chcielibyśmy to przeczytać, gdy szukaliśmy wsparcia dla kogoś bliskiego.
              </p>
            </section>

            {/* Professional Approach */}
            <section className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="m-0 text-3xl md:text-4xl font-serif font-bold text-gray-900">
                  Profesjonalnie — ale po ludzku
                </h2>
              </div>

              <div className="bg-white border-2 border-emerald-200 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-emerald-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Nasze źródła danych
                </h3>
                <p className="text-gray-700 mb-4">
                  Korzystamy wyłącznie z oficjalnych, wiarygodnych informacji:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Biuletyn Informacji Publicznej (BIP)
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Miejskie i Gminne Ośrodki Pomocy Społecznej (MOPS/OPS)
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Obowiązujące akty prawne i rozporządzenia
                  </li>
                  <li className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Oficjalne strony instytucji prowadzących placówki
                  </li>
                </ul>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Dane aktualizujemy regularnie, ale ich tempo zależy również od tego, jak często publikują je instytucje.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Dlatego zamiast obiecywać konkretne liczby czy dostępność, skupiamy się na tym, co naprawdę pomaga: <strong>procedurach, kontaktach i wskazówkach, gdzie szukać wsparcia w swoim powiecie.</strong>
              </p>
            </section>

            {/* Why We Do This */}
            <section className="mb-16 bg-emerald-50 rounded-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h2 className="m-0 text-3xl md:text-4xl font-serif font-bold text-gray-900">
                  Po co to wszystko?
                </h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Bo wielu z nas przeszło przez ten proces osobiście — w swoich rodzinach, w sytuacjach wymagających szybkich i trudnych decyzji.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                I wiemy jedno: <strong>nikt nie powinien uczyć się tego wszystkiego od zera, gdy troszczy się o bliską osobę.</strong>
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Kompas Seniora powstał po to, żeby wyjaśnić to, co bywa niejasne. Żeby pokazać wszystkie możliwości — od DPS i ŚDS, po inne formy wsparcia, które mogą pomóc w Twojej sytuacji.
              </p>
            </section>

            {/* What You'll Find */}
            <section className="mb-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </div>
                <h2 className="m-0 text-3xl md:text-4xl font-serif font-bold text-gray-900">
                  Co tu znajdziesz?
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Feature 1 */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-emerald-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link href="/search" className="hover:text-emerald-600 transition-colors">
                          Bazę placówek DPS i ŚDS
                        </Link>
                      </h3>
                      <p className="text-gray-600">
                        Z oficjalnymi danymi kontaktowymi i informacjami o kosztach.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-emerald-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link href="/poradniki" className="hover:text-emerald-600 transition-colors">
                          Listę dokumentów krok po kroku
                        </Link>
                      </h3>
                      <p className="text-gray-600">
                        Jasne wskazówki, co przygotować, żeby złożyć wniosek bez stresu.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-emerald-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link href="/kalkulator" className="hover:text-emerald-600 transition-colors">
                          Kalkulator kosztów opieki
                        </Link>
                      </h3>
                      <p className="text-gray-600">
                        Prosty, bezpieczny i bez zbierania danych osobowych — żeby szybko oszacować, z czym trzeba się liczyć.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-emerald-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link href="/poradniki" className="hover:text-emerald-600 transition-colors">
                          Poradniki w prostym języku
                        </Link>
                      </h3>
                      <p className="text-gray-600">
                        Praktyczne przewodniki, które przeprowadzą Cię przez cały proces — bez trudnych określeń.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Final Message */}
            <section className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="m-0 text-3xl md:text-4xl font-serif font-bold text-gray-900">
                  Na końcu chodzi o jedno
                </h2>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Każdy z nas kiedyś będzie seniorem. I każdy z nas już dziś ma kogoś bliskiego, kto może potrzebować wsparcia.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Kompas Seniora nie powstał po to, by zastąpić instytucje. Powstał po to, żeby pomóc Ci przejść tę drogę spokojniej — krok po kroku.
              </p>
              <p className="text-xl text-gray-900 leading-relaxed font-semibold">
                Jeśli stoisz przed ważną decyzją dotyczącą opieki nad bliską osobą, jesteśmy tu, żeby Ci to ułatwić.
              </p>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 md:p-12 text-white text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Gotowy na kolejny krok?
              </h2>
              <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
                Zobacz, od czego zacząć: przeczytaj poradnik dla rodzin lub wyszukaj placówki w swojej okolicy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/poradniki"
                  className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  Przeczytaj poradnik
                </Link>
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-800 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-900 transition-colors border-2 border-emerald-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  Wyszukaj placówki
                </Link>
              </div>
            </section>

          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold uppercase text-xs tracking-widest transition-all"
          >
            Powrót do strony głównej
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}