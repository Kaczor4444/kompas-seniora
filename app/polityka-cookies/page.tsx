'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PolitykaCookiesClient() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('sec-1');

  const sections = [
    { id: 'sec-1', title: 'Czym są cookies?' },
    { id: 'sec-2', title: 'Jak wykorzystujemy?' },
    { id: 'sec-3', title: 'Cookies trzecich' },
    { id: 'sec-4', title: 'Zarządzanie cookies' },
    { id: 'sec-5', title: 'Twoje prawa' },
    { id: 'sec-6', title: 'Zmiany' },
    { id: 'sec-7', title: 'Kontakt' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }

      const sectionElements = sections.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 200;

      sectionElements.forEach((el) => {
        if (el) {
          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;
          if (scrollPosition >= top && scrollPosition <= bottom) {
            setActiveSection(el.id);
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-100 z-50">
        <div
          className="h-full bg-emerald-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-24 md:pt-16">
        {/* Back Button */}
        <Link
          href="/"
          className="group flex items-center gap-2 text-slate-600 hover:text-emerald-700 font-bold mb-8 transition-colors px-4 py-2 rounded-xl hover:bg-slate-50 w-fit"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-emerald-300 transition-colors shadow-sm">
            <ArrowLeft size={16} />
          </div>
          Wróć do strony głównej
        </Link>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

          {/* TOC Sidebar - Desktop Only */}
          <aside className="hidden lg:block w-72 sticky top-32 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Spis treści
                </h4>
              </div>

              <nav className="space-y-1">
                {sections.map(s => {
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all
                        ${isActive
                          ? 'bg-slate-900 text-white shadow-sm translate-x-1'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                      {s.title}
                      {isActive && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  Zgodne z RODO
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header Banner */}
              <div className="bg-slate-900 p-8 md:p-14 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Pliki cookies
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">Polityka Cookies</h1>
                  <p className="text-slate-400 font-medium">
                    Ostatnia aktualizacja: <span className="text-white">{new Date().toLocaleDateString('pl-PL')} r.</span>
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 md:p-14">
                {/* Intro */}
                <p className="text-lg text-slate-600 leading-relaxed border-l-4 border-emerald-100 pl-6 mb-12">
                  Pliki cookies (tzw. „ciasteczka") to niewielkie pliki tekstowe zapisywane na Twoim urządzeniu podczas przeglądania stron internetowych.
                </p>

                {/* Section 1 */}
                <section id="sec-1" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-black tracking-tighter mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    1. Czym są pliki cookies?
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Pliki cookies (tzw. „ciasteczka") to niewielkie pliki tekstowe zapisywane na Twoim
                    urządzeniu (komputerze, tablecie, smartfonie) podczas przeglądania stron internetowych.
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Cookies umożliwiają rozpoznanie Twojego urządzenia i dostosowanie wyświetlanej treści
                    do Twoich preferencji oraz potrzeb.
                  </p>
                </section>

                {/* Section 2 */}
                <section id="sec-2" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-black tracking-tighter mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    2. Jak wykorzystujemy cookies?
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    Serwis <strong>kompaseniora.pl</strong> wykorzystuje pliki cookies w następujących celach:
                  </p>

                  <div className="space-y-6">
                    <div className="border-l-4 border-emerald-500 pl-4 py-2">
                      <h3 className="font-bold text-sm mb-2 text-slate-900 flex items-center gap-2">
                        🔧 Cookies niezbędne (techniczne)
                      </h3>
                      <p className="text-slate-600 text-sm mb-2">
                        Niezbędne do prawidłowego funkcjonowania Serwisu. Bez nich korzystanie z podstawowych
                        funkcji nie byłoby możliwe.
                      </p>
                      <p className="text-xs text-slate-500 italic mb-2">
                        Przykłady: zapamiętywanie ustawień, sesja użytkownika
                      </p>
                      <p className="text-xs text-slate-500">
                        <strong>Okres przechowywania:</strong> sesja lub do 12 miesięcy
                      </p>
                      <p className="text-xs text-emerald-600 font-bold mt-2">
                        ✓ Ładowane automatycznie (nie wymagają zgody)
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <h3 className="font-bold text-sm mb-2 text-slate-900 flex items-center gap-2">
                        📊 Cookies analityczne
                      </h3>
                      <p className="text-slate-600 text-sm mb-2">
                        Pozwalają nam zrozumieć, w jaki sposób użytkownicy korzystają z Serwisu
                        (np. które placówki są najczęściej przeglądane, jakie filtry są używane).
                      </p>
                      <p className="text-xs text-slate-500 italic mb-2">
                        Cel: poprawa funkcjonalności i doświadczenia użytkowników
                      </p>
                      <p className="text-xs text-slate-500">
                        <strong>Okres przechowywania:</strong> do 24 miesięcy
                      </p>
                      <p className="text-xs text-blue-600 font-bold mt-2">
                        ⚠ Wymagają aktywnej zgody użytkownika
                      </p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                      <h3 className="font-bold text-sm mb-2 text-slate-900 flex items-center gap-2">
                        ⚙️ Cookies funkcjonalne
                      </h3>
                      <p className="text-slate-600 text-sm mb-2">
                        Zapamiętują Twoje preferencje (np. preferowany widok listy vs. mapy,
                        ostatnio wybrane filtry wyszukiwania).
                      </p>
                      <p className="text-xs text-slate-500 italic mb-2">
                        Przykłady: preferencje wyświetlania, zapamiętane filtry
                      </p>
                      <p className="text-xs text-slate-500">
                        <strong>Okres przechowywania:</strong> do 12 miesięcy
                      </p>
                      <p className="text-xs text-purple-600 font-bold mt-2">
                        ⚠ Wymagają aktywnej zgody użytkownika
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 3 */}
                <section id="sec-3" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-black tracking-tighter mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    3. Cookies stron trzecich
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Serwis może wykorzystywać cookies podmiotów trzecich, w szczególności:
                  </p>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span><strong>Mapy interaktywne</strong> - do wyświetlania map z lokalizacjami placówek</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span><strong>Usługi hostingowe</strong> - cookies techniczne związane z działaniem infrastruktury</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span><strong>Narzędzia analityczne</strong> (jeśli zostaną wdrożone) - do analizy ruchu na stronie</span>
                    </li>
                  </ul>
                  <p className="text-slate-600 leading-relaxed mt-4 text-sm">
                    Te podmioty mogą przetwarzać dane zgodnie z własnymi politykami prywatności.
                    Zalecamy zapoznanie się z ich dokumentami.
                  </p>
                </section>

                {/* Section 4 */}
                <section id="sec-4" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-black tracking-tighter mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    4. Jak zarządzać plikami cookies?
                  </h2>

                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex gap-4 mb-6">
                    <svg className="w-6 h-6 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div>
                      <p className="text-sm text-blue-900 font-bold mb-2">💡 Masz pełną kontrolę nad plikami cookies!</p>
                      <p className="text-sm text-blue-900">
                        Możesz zarządzać cookies lub je całkowicie zablokować w ustawieniach swojej przeglądarki.
                      </p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <p className="text-slate-600 text-sm mb-4">
                      Możesz też zarządzać preferencjami cookies bezpośrednio w naszym serwisie:
                    </p>
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-cookie-settings'))}
                      className="inline-flex items-center gap-2 bg-slate-900 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-[0.15em] transition-all active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M21.598 11.064a1.006 1.006 0 0 0-.854-.172A2.938 2.938 0 0 1 20 11c-1.654 0-3-1.346-3-3 0-.217.031-.444.099-.716a1 1 0 0 0-1.067-1.236A9.956 9.956 0 0 0 2 12c0 5.514 4.486 10 10 10s10-4.486 10-10c0-.049-.003-.097-.007-.16a1.004 1.004 0 0 0-.395-.776zM8.5 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm-2 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm2.5-6.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm3.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                      </svg>
                      Zarządzaj preferencjami cookies
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 mb-4">Instrukcje dla popularnych przeglądarek:</h3>

                  <div className="space-y-3 text-slate-600 text-sm bg-slate-50 p-6 rounded-xl">
                    <div className="flex items-start gap-3">
                      <span className="font-bold min-w-[140px]">Google Chrome:</span>
                      <span>Ustawienia → Prywatność i bezpieczeństwo → Pliki cookie i inne dane witryn</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-bold min-w-[140px]">Mozilla Firefox:</span>
                      <span>Opcje → Prywatność i bezpieczeństwo → Pliki cookie i dane witryn</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-bold min-w-[140px]">Safari:</span>
                      <span>Preferencje → Prywatność → Zarządzaj danymi witryn</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-bold min-w-[140px]">Microsoft Edge:</span>
                      <span>Ustawienia → Pliki cookie i uprawnienia witryny → Pliki cookie i dane witryn</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 flex gap-4 mt-6">
                    <svg className="w-6 h-6 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm text-amber-900 font-bold mb-2">⚠️ Uwaga:</p>
                      <p className="text-sm text-amber-900">
                        Zablokowanie cookies może ograniczyć funkcjonalność Serwisu
                        (np. preferencje wyszukiwania nie będą zapamiętywane, mapa może nie działać poprawnie).
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 5 */}
                <section id="sec-5" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-black tracking-tighter mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    5. Twoje prawa
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Zgodnie z RODO i przepisami o telekomunikacji, przysługują Ci następujące prawa:
                  </p>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span><strong>Prawo do wycofania zgody</strong> - możesz w każdej chwili zmienić ustawienia cookies w przeglądarce</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span><strong>Prawo dostępu</strong> - możesz sprawdzić jakie cookies są zapisane w przeglądarce</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">•</span>
                      <span><strong>Prawo do usunięcia</strong> - możesz usunąć wszystkie cookies w ustawieniach przeglądarki</span>
                    </li>
                  </ul>
                </section>

                {/* Section 6 */}
                <section id="sec-6" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-black tracking-tighter mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    6. Zmiany w Polityce Cookies
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    Administrator zastrzega sobie prawo do wprowadzania zmian w niniejszej Polityce Cookies.
                    O wszelkich istotnych zmianach użytkownicy zostaną poinformowani poprzez komunikat w Serwisie.
                  </p>
                </section>

                {/* Section 7 */}
                <section id="sec-7" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-black tracking-tighter mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    7. Więcej informacji
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Jeśli masz pytania dotyczące wykorzystywania plików cookies, skontaktuj się z nami:
                  </p>
                  <ul className="space-y-2 text-slate-600 text-sm mb-6">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">•</span>
                      <span>Email: <a href="mailto:kontakt@kompas-seniora.pl" className="text-emerald-700 underline underline-offset-4 font-bold">kontakt@kompas-seniora.pl</a></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-500">•</span>
                      <span><a href="/kontakt" className="text-emerald-700 underline underline-offset-4 font-bold">Formularz kontaktowy</a></span>
                    </li>
                  </ul>
                  <p className="text-slate-600 leading-relaxed text-sm mb-2">
                    Zobacz także: <a href="/polityka-prywatnosci" className="text-emerald-700 underline underline-offset-4 font-bold">Polityka Prywatności</a>
                  </p>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Więcej informacji o plikach cookies: <a href="https://wszystkoociasteczkach.pl" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline underline-offset-4 font-bold">wszystkoociasteczkach.pl</a>
                  </p>
                </section>

                {/* Quote */}
                <div className="bg-slate-900 text-white p-8 rounded-2xl text-center mt-12">
                  <p className="font-black tracking-tighter text-xl mb-4">"Twoja prywatność, Twoja kontrola."</p>
                  <div className="w-12 h-1 bg-emerald-500 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-black uppercase text-xs tracking-widest transition-all"
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
