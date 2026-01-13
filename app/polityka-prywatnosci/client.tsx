'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PolitykaPrywatnosciClient() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('sec-1');

  const sections = [
    { id: 'sec-1', title: 'Administrator' },
    { id: 'sec-2', title: 'Przedstawiciel RODO' },
    { id: 'sec-3', title: 'Rodzaje danych' },
    { id: 'sec-4', title: 'Analityka' },
    { id: 'sec-5', title: 'Cele i podstawy' },
    { id: 'sec-6', title: 'Udostępnianie' },
    { id: 'sec-7', title: 'Okres przechowywania' },
    { id: 'sec-8', title: 'Twoje prawa' },
    { id: 'sec-9', title: 'Profilowanie' },
    { id: 'sec-10', title: 'Cookies' },
    { id: 'sec-11', title: 'Źródła danych' },
    { id: 'sec-12', title: 'Zmiany' },
    { id: 'sec-13', title: 'Punkt DSA' },
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
      // Progress bar
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight > 0) {
        setScrollProgress((totalScroll / windowHeight) * 100);
      }

      // ScrollSpy for active section
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
    <div className="min-h-screen bg-stone-50">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-stone-200 z-50">
        <div
          className="h-full bg-primary-600 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-10 pb-24 md:pt-16">
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

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">

          {/* TOC Sidebar - Desktop Only */}
          <aside className="hidden lg:block w-72 sticky top-32 shrink-0">
            <div className="bg-white rounded-[2rem] border border-stone-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          ? 'bg-primary-600 text-white shadow-lg translate-x-1'
                          : 'text-slate-500 hover:bg-stone-50 hover:text-slate-900'
                        }`}
                    >
                      {s.title}
                      {isActive && <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-stone-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Zgodne z RODO i DSA
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content - owinięty w flex-1 */}
          <div className="flex-1">
            <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-xl shadow-slate-900/5 overflow-hidden">
              {/* Header Banner */}
              <div className="bg-slate-900 p-8 md:p-14 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10">
                    <svg className="w-3 h-3 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Ochrona danych osobowych
                  </div>
                  <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Polityka Prywatności</h1>
                  <p className="text-slate-400 font-medium">
                    Ostatnia aktualizacja: <span className="text-white">{new Date().toLocaleDateString('pl-PL')} r.</span>
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 md:p-14">
                {/* Intro */}
                <p className="text-lg text-slate-600 leading-relaxed italic border-l-4 border-primary-500 pl-6 mb-12">
                  Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych
                  użytkowników serwisu <strong>kompaseniora.pl</strong> (zwanego dalej „Serwisem").
                </p>

                {/* Section 1 */}
                <section id="sec-1" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    1. Postanowienia ogólne i Administrator
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych
                    użytkowników serwisu <strong>kompaseniora.pl</strong> (zwanego dalej „Serwisem").
                  </p>
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-700 mb-4">Administrator danych osobowych:</p>
                    <div className="text-slate-800 space-y-1">
                      <p className="font-bold text-lg">[NAZWA FIRMY UK - np. Senior Compass Ltd.]</p>
                      <p className="text-sm">Company Number: <strong>[NUMER REJESTRACYJNY]</strong></p>
                      <p className="text-sm">Adres siedziby: <strong>[ADRES UK - np. 123 Business Street, London, E1 6AN, United Kingdom]</strong></p>
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Ochrona danych odbywa się zgodnie z wymogami powszechnie obowiązujących przepisów prawa,
                    w tym Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r.
                    w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie
                    swobodnego przepływu takich danych (RODO).
                  </p>
                </section>

                {/* Section 2 */}
                <section id="sec-2" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    2. Przedstawiciel RODO w Unii Europejskiej
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    Zgodnie z art. 27 RODO, Administrator wyznaczył przedstawiciela w Polsce,
                    z którym można kontaktować się we wszystkich sprawach związanych z przetwarzaniem
                    danych osobowych i korzystaniem z praw:
                  </p>
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <ul className="space-y-3 list-none text-emerald-900 font-medium">
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <span><strong>Przedstawiciel:</strong> [NAZWA FIRMY UK - np. Senior Compass Ltd.]</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <span><strong>Adres w Polsce:</strong> [ADRES WIRTUALNY - np. ul. Marszałkowska 10/5, 00-001 Warszawa]</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <span><strong>Email:</strong> <a href="mailto:kontakt@kompaseniora.pl" className="text-primary-700 underline underline-offset-4 font-bold">kontakt@kompaseniora.pl</a></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                        <span><strong>Języki komunikacji:</strong> polski, angielski</span>
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Section 3 */}
                <section id="sec-3" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    3. Rodzaje przetwarzanych danych
                  </h2>
                  <p className="text-slate-600 mb-6">Serwis przetwarza następujące kategorie danych:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="block font-bold text-slate-900 text-sm mb-1">Dane analityczne</span>
                      <span className="text-xs text-slate-500">Informacje o aktywności w Serwisie (szczegóły poniżej)</span>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="block font-bold text-slate-900 text-sm mb-1">Dane techniczne</span>
                      <span className="text-xs text-slate-500">Typ przeglądarki, system operacyjny, czas wizyty</span>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="block font-bold text-slate-900 text-sm mb-1">Dane bezpieczeństwa</span>
                      <span className="text-xs text-slate-500">Adres IP (tylko w logach bezpieczeństwa panelu)</span>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <span className="block font-bold text-slate-900 text-sm mb-1">Dane lokalizacyjne</span>
                      <span className="text-xs text-slate-500">Opcjonalnie, za Twoją zgodą - nie przechowywane</span>
                    </div>
                  </div>
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4">
                    <svg className="w-6 h-6 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-amber-900 font-bold mb-2">Ważne:</p>
                      <p className="text-sm text-amber-900">
                        Serwis nie wymaga rejestracji ani logowania użytkowników.
                        Nie zbieramy danych osobowych takich jak imię, nazwisko, email czy numer telefonu
                        (z wyjątkiem dobrowolnego kontaktu przez formularz lub newsletter).
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 3.1 - Analytics */}
                <section id="sec-4" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    3.1. Analityka strony - szczegóły
                  </h2>

                  {/* Własna analityka */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Własna analityka (anonimowa, zawsze aktywna)</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Zbieramy podstawowe, anonimowe statystyki o korzystaniu z Serwisu, aby poprawić jego działanie:
                    </p>
                    <ul className="space-y-2 text-sm text-slate-600 mb-4">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 mt-1">•</span>
                        <span>Liczba odsłon placówek</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 mt-1">•</span>
                        <span>Częstotliwość korzystania z funkcji kontaktu</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 mt-1">•</span>
                        <span>Popularne wyszukiwania i filtry</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 mt-1">•</span>
                        <span>Ogólne informacje techniczne (rodzaj urządzenia, przeglądarka)</span>
                      </li>
                    </ul>
                    <p className="text-slate-600 text-sm mb-4">
                      <strong>Dane są całkowicie anonimowe</strong> - nie identyfikujemy użytkowników,
                      nie łączymy wizyt z konkretnymi osobami, nie śledzimy aktywności poza naszą stroną.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 border-t-2 border-slate-200">
                      <p className="mb-1"><strong>Podstawa prawna:</strong> Art. 6 ust. 1 lit. f) RODO (uzasadniony interes administratora)</p>
                      <p className="mb-1"><strong>Cel:</strong> Poprawa jakości serwisu, zrozumienie potrzeb użytkowników, optymalizacja funkcji</p>
                      <p><strong>Okres przechowywania:</strong> maksymalnie 24 miesiące</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 italic">
                      <strong>Jak zablokować?</strong> Możesz użyć trybu prywatnego w przeglądarce lub zainstalować dodatki blokujące śledzenie.
                    </p>
                  </div>

                  {/* Google Analytics */}
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Google Analytics (opcjonalne, wymaga zgody)</h3>
                    <p className="text-slate-600 text-sm mb-4">
                      Jeśli <strong>zaakceptujesz cookies analityczne</strong> w bannerze, dodatkowo używamy Google Analytics
                      do bardziej szczegółowych statystyk:
                    </p>
                    <ul className="space-y-2 text-sm text-slate-600 mb-4">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Źródła ruchu (skąd przyszli użytkownicy)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Słowa kluczowe w wyszukiwarkach</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Analiza zachowań na stronie</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Ogólne dane demograficzne (jeśli dostępne)</span>
                      </li>
                    </ul>
                    <p className="text-slate-600 text-sm font-bold mb-2">Informacje techniczne:</p>
                    <ul className="space-y-2 text-sm text-slate-600 mb-4">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Google może ustawiać cookies na Twoim urządzeniu</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Anonimizacja IP jest <strong>włączona</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Dane są przekazywane do Google LLC z odpowiednimi zabezpieczeniami RODO</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>Cookies są blokowane do momentu wyrażenia zgody</span>
                      </li>
                    </ul>
                    <div className="bg-white p-4 rounded-xl text-xs text-slate-500 border-t-2 border-blue-200">
                      <p className="mb-1"><strong>Podstawa prawna:</strong> Art. 6 ust. 1 lit. a) RODO (zgoda użytkownika)</p>
                      <p className="mb-1"><strong>Zarządzanie zgodą:</strong> Banner cookies + przycisk "Ustawienia cookies" w stopce</p>
                      <p><strong>Cofnięcie zgody:</strong> Możesz zmienić ustawienia w każdej chwili</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 italic">
                      <strong>Odmowa:</strong> Jeśli odrzucisz cookies analityczne, Google Analytics nie będzie działać.
                      Nadal będziemy zbierać podstawowe anonimowe statystyki (własna analityka powyżej).
                    </p>
                  </div>
                </section>

                {/* Section 4 */}
                <section id="sec-5" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                    4. Cel i podstawa prawna przetwarzania
                  </h2>
                  <div className="space-y-4">
                    <div className="border-l-4 border-emerald-500 pl-4 py-2">
                      <h3 className="font-bold text-sm mb-1 text-slate-900">Świadczenie usług Serwisu</h3>
                      <p className="text-xs text-slate-500 font-medium">Art. 6 ust. 1 lit. b) RODO (wykonanie umowy)</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <h3 className="font-bold text-sm mb-1 text-slate-900">Analiza statystyczna i poprawa Serwisu</h3>
                      <p className="text-xs text-slate-500 font-medium">Art. 6 ust. 1 lit. f) RODO (prawnie uzasadniony interes administratora)</p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                      <h3 className="font-bold text-sm mb-1 text-slate-900">Marketing i komunikacja (newsletter)</h3>
                      <p className="text-xs text-slate-500 font-medium">Art. 6 ust. 1 lit. a) RODO (zgoda użytkownika)</p>
                    </div>
                    <div className="border-l-4 border-orange-500 pl-4 py-2">
                      <h3 className="font-bold text-sm mb-1 text-slate-900">Wyszukiwanie w pobliżu (funkcja opcjonalna)</h3>
                      <p className="text-xs text-slate-500 font-medium mb-2">Art. 6 ust. 1 lit. a) RODO (zgoda użytkownika wyrażona w przeglądarce)</p>
                      <p className="text-xs text-slate-500 italic">Gdy aktywujesz funkcję lokalizacji, przeglądarka zapyta o zgodę. Współrzędne są używane wyłącznie w bieżącej sesji.</p>
                    </div>
                  </div>
                </section>

                {/* Section 5 */}
                <section id="sec-6" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    5. Udostępnianie danych i przechowywanie
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Dane mogą być udostępniane następującym kategoriom odbiorców:
                  </p>
                  <ul className="space-y-2 text-slate-600 text-sm mb-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Dostawcom usług hostingowych i baz danych</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Dostawcom usług geolokalizacji (OpenStreetMap)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Google Analytics (jeśli zaakceptujesz cookies analityczne)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Organom państwowym na podstawie przepisów prawa</span>
                    </li>
                  </ul>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    <strong>Nie sprzedajemy</strong> ani nie udostępniamy danych osobowych firmom trzecim
                    w celach marketingowych.
                  </p>
                  <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 opacity-20 rounded-full blur-2xl" />
                    <p className="text-sm leading-relaxed relative z-10">
                      <strong>Lokalizacja i bezpieczeństwo danych:</strong> Korzystamy z profesjonalnych
                      dostawców usług chmurowych i email zgodnych z RODO/GDPR. Wszyscy dostawcy posiadają
                      odpowiednie zabezpieczenia techniczne i organizacyjne oraz certyfikaty zgodności
                      z przepisami ochrony danych osobowych. Dane są przetwarzane w sposób zapewniający
                      zgodność z wymogami europejskimi.
                    </p>
                  </div>
                </section>

                {/* Section 6 */}
                <section id="sec-7" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    6. Okres przechowywania danych
                  </h2>
                  <ul className="space-y-3 text-slate-600 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="text-primary-500 font-bold mt-0.5">→</span>
                      <span><strong>Dane analityczne własne:</strong> 24 miesiące od zebrania</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-500 font-bold mt-0.5">→</span>
                      <span><strong>Google Analytics:</strong> zgodnie z polityką Google (możesz zarządzać w ustawieniach cookies)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-500 font-bold mt-0.5">→</span>
                      <span><strong>Dane lokalizacyjne:</strong> wykorzystywane wyłącznie w danej sesji, nie są przechowywane na serwerze</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-500 font-bold mt-0.5">→</span>
                      <span><strong>Logi bezpieczeństwa:</strong> 12 miesięcy (dotyczą wyłącznie panelu administracyjnego)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-500 font-bold mt-0.5">→</span>
                      <span><strong>Pliki cookies:</strong> zgodnie z Polityką Cookies (maksymalnie 12 miesięcy)</span>
                    </li>
                  </ul>
                </section>

                {/* Section 7 - Rights */}
                <section id="sec-8" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    7. Twoje prawa
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    Zgodnie z RODO, przysługują Ci następujące prawa:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    {[
                      'Prawo dostępu - możesz zapytać, jakie dane o Tobie przetwarzamy',
                      'Prawo do poprawiania - możesz poprosić o zmianę nieprawidłowych danych',
                      'Prawo do usunięcia - możesz poprosić o usunięcie swoich danych',
                      'Prawo do cofnięcia zgody - możesz w każdej chwili zmienić zdanie'
                    ].map((right, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-emerald-900 font-medium text-sm">{right}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-600 font-bold mb-3">Jak skorzystać z praw?</p>
                  <ul className="space-y-2 text-slate-600 text-sm mb-6">
                    <li className="flex items-center gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Email: <a href="mailto:kontakt@kompaseniora.pl" className="text-primary-700 underline underline-offset-4 font-bold">kontakt@kompaseniora.pl</a></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary-500">•</span>
                      <span><a href="/kontakt" className="text-primary-700 underline underline-offset-4 font-bold">Formularz kontaktowy</a></span>
                    </li>
                  </ul>
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <p className="text-slate-700 text-sm leading-relaxed">
                      <strong>Prawo do skargi:</strong> Jeśli uważasz, że nieprawidłowo przetwarzamy Twoje dane,
                      możesz złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (PUODO):
                      <a href="https://uodo.gov.pl" target="_blank" rel="noopener" className="text-blue-700 underline underline-offset-4 font-bold ml-1">uodo.gov.pl</a>
                    </p>
                  </div>
                </section>

                {/* Section 8 */}
                <section id="sec-9" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    8. Profilowanie
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Ważne:</strong> Serwis <strong>nie profiluje</strong> użytkowników w sposób zautomatyzowany
                    ani nie podejmuje decyzji wpływających na Twoje prawa wyłącznie na podstawie automatycznego
                    przetwarzania danych.
                  </p>
                </section>

                {/* Section 9 */}
                <section id="sec-10" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    9. Pliki cookies
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    Szczegółowe informacje na temat wykorzystywania plików cookies znajdują się w
                    {' '}<a href="/polityka-cookies" className="text-primary-700 underline underline-offset-4 font-bold">
                      Polityce Cookies
                    </a>. Możesz zarządzać ustawieniami cookies klikając przycisk
                    {' '}<strong>"Ustawienia cookies"</strong> w stopce strony.
                  </p>
                </section>

                {/* Section 10 */}
                <section id="sec-11" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    10. Źródła danych o placówkach
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Informacje o placówkach opieki prezentowane w Serwisie pochodzą z oficjalnych źródeł publicznych
                    (MOPS, strony BIP, strony internetowe placówek).
                  </p>
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4">
                    <svg className="w-6 h-6 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm text-amber-900 font-bold mb-2">Ważne:</p>
                      <p className="text-sm text-amber-900">
                        Dane są regularnie weryfikowane i aktualizowane (co najmniej raz w roku).
                        Zalecamy jednak bezpośrednią weryfikację aktualnych cen i dostępności miejsc z placówką.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 11 */}
                <section id="sec-12" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    11. Zmiany w Polityce Prywatności
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    Administrator zastrzega sobie prawo do wprowadzania zmian w niniejszej Polityce Prywatności.
                    O wszelkich zmianach użytkownicy zostaną poinformowani poprzez komunikat w Serwisie.
                  </p>
                </section>

                {/* Section 12 */}
                <section id="sec-13" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    12. Punkt kontaktowy (DSA)
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Zgodnie z Rozporządzeniem o Usługach Cyfrowych (DSA), punkt kontaktowy dla użytkowników,
                    organów państwowych i Komisji Europejskiej:
                  </p>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Email: <a href="mailto:kontakt@kompaseniora.pl" className="text-primary-700 underline underline-offset-4 font-bold">kontakt@kompaseniora.pl</a></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Języki komunikacji: polski, angielski</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary-500">•</span>
                      <span><a href="/kontakt" className="text-primary-700 underline underline-offset-4 font-bold">Formularz kontaktowy</a></span>
                    </li>
                  </ul>
                </section>

                {/* Quote - Zostaje bez id, bo nie jest w TOC */}
                <div className="bg-slate-900 text-white p-8 rounded-3xl text-center mt-12">
                  <p className="font-serif text-xl mb-4 italic">"Z pasją dla rodzin, z szacunkiem dla prywatności."</p>
                  <div className="w-12 h-1 bg-primary-500 mx-auto" />
                </div>
              </div>
            </div>
          </div> {/* Zamyka flex-1 */}
        </div> {/* Zamyka flex container */}

        {/* Footer Navigation */}
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
