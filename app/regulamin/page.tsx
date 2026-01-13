'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RegulaminClient() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('sec-1');

  const sections = [
    { id: 'sec-1', title: 'Postanowienia ogólne' },
    { id: 'sec-2', title: 'Definicje' },
    { id: 'sec-3', title: 'Zakres usług' },
    { id: 'sec-4', title: 'Zasady korzystania' },
    { id: 'sec-5', title: 'Źródła danych' },
    { id: 'sec-6', title: 'Własność intelektualna' },
    { id: 'sec-7', title: 'Dane osobowe' },
    { id: 'sec-8', title: 'Cookies' },
    { id: 'sec-9', title: 'Wyłączenie odpowiedzialności' },
    { id: 'sec-10', title: 'Punkt DSA' },
    { id: 'sec-11', title: 'Zgłaszanie nieprawidłowości' },
    { id: 'sec-12', title: 'Postanowienia końcowe' },
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
                  Zgodne z prawem polskim
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
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
                    Zasady korzystania
                  </div>
                  <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Regulamin Serwisu</h1>
                  <p className="text-slate-400 font-medium">
                    Ostatnia aktualizacja: <span className="text-white">{new Date().toLocaleDateString('pl-PL')} r.</span>
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 md:p-14">
                {/* Intro */}
                <p className="text-lg text-slate-600 leading-relaxed italic border-l-4 border-primary-500 pl-6 mb-12">
                  Niniejszy Regulamin określa zasady korzystania z serwisu internetowego <strong>kompaseniora.pl</strong> (zwanego dalej „Serwisem").
                </p>

                {/* Section 1 */}
                <section id="sec-1" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    1. Postanowienia ogólne
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    Niniejszy Regulamin określa zasady korzystania z serwisu internetowego 
                    <strong> kompaseniora.pl</strong> (zwanego dalej „Serwisem").
                  </p>
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-700 mb-4">Właściciel i administrator Serwisu:</p>
                    <div className="text-slate-800 space-y-1">
                      <p className="font-bold text-lg">[NAZWA FIRMY UK - np. Senior Compass Ltd.]</p>
                      <p className="text-sm">Company Number: <strong>[NUMER REJESTRACYJNY]</strong></p>
                      <p className="text-sm">Adres siedziby: <strong>[ADRES UK - np. 123 Business Street, London, E1 6AN, United Kingdom]</strong></p>
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Korzystanie z Serwisu jest równoznaczne z akceptacją niniejszego Regulaminu.
                  </p>
                </section>

                {/* Section 2 */}
                <section id="sec-2" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    2. Definicje
                  </h2>
                  <ul className="space-y-3 text-slate-600 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="text-primary-500 font-bold mt-0.5">→</span>
                      <span><strong>Serwis</strong> – serwis internetowy dostępny pod adresem kompaseniora.pl</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-500 font-bold mt-0.5">→</span>
                      <span><strong>Użytkownik</strong> – każda osoba fizyczna lub prawna korzystająca z Serwisu</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-500 font-bold mt-0.5">→</span>
                      <span><strong>Placówka</strong> – publiczna placówka opieki dla seniorów (DPS lub ŚDS) prezentowana w Serwisie</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-primary-500 font-bold mt-0.5">→</span>
                      <span><strong>Administrator</strong> – podmiot wskazany w punkcie 1, odpowiedzialny za funkcjonowanie Serwisu</span>
                    </li>
                  </ul>
                </section>

                {/* Section 3 */}
                <section id="sec-3" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    3. Zakres usług Serwisu
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Serwis świadczy usługi informacyjne polegające na:
                  </p>
                  <ul className="space-y-2 text-slate-600 text-sm mb-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Udostępnianiu informacji o publicznych placówkach opieki dla seniorów (DPS i ŚDS)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Prezentowaniu oficjalnych cen z MOPS (Miejskich Ośrodków Pomocy Społecznej)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Umożliwianiu wyszukiwania placówek według lokalizacji i innych kryteriów</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Wyświetlaniu kontaktów do placówek (telefon, email, strona www)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Wizualizacji placówek na mapie interaktywnej</span>
                    </li>
                  </ul>
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
                    <svg className="w-6 h-6 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-blue-900 font-bold mb-2">Ważne:</p>
                      <p className="text-sm text-blue-900">
                        Serwis pełni wyłącznie funkcję informacyjną. Nie pośredniczymy w rezerwacjach miejsc 
                        w placówkach ani nie prowadzimy działalności pośrednictwa. Wszelkie decyzje dotyczące 
                        wyboru placówki i kontaktu z nią podejmuje Użytkownik samodzielnie.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Section 4 */}
                <section id="sec-4" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    4. Zasady korzystania z Serwisu
                  </h2>
                  <div className="space-y-6">
                    <div className="border-l-4 border-emerald-500 pl-4 py-2">
                      <h3 className="font-bold text-sm mb-2 text-slate-900">4.1. Dostęp do Serwisu</h3>
                      <p className="text-slate-600 text-sm">Korzystanie z Serwisu jest <strong>bezpłatne</strong> i nie wymaga rejestracji.</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <h3 className="font-bold text-sm mb-2 text-slate-900">4.2. Wymogi techniczne</h3>
                      <p className="text-slate-600 text-sm mb-2">Dostęp do Serwisu wymaga:</p>
                      <ul className="space-y-1 text-slate-600 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>Urządzenia z dostępem do Internetu</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>Przeglądarki internetowej (Chrome, Firefox, Safari, Edge)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>Włączonej obsługi JavaScript</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>Akceptacji plików cookies (opcjonalnie dla pełnej funkcjonalności)</span>
                        </li>
                      </ul>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                      <h3 className="font-bold text-sm mb-2 text-slate-900">4.3. Zakazy</h3>
                      <p className="text-slate-600 text-sm mb-2">Użytkownik zobowiązuje się do:</p>
                      <ul className="space-y-1 text-slate-600 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">•</span>
                          <span>Nieingerowania w funkcjonowanie Serwisu</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">•</span>
                          <span>Niekopiowania treści w sposób naruszający prawa autorskie</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">•</span>
                          <span>Nieużywania Serwisu w sposób sprzeczny z prawem lub dobrymi obyczajami</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-purple-500 mt-0.5">•</span>
                          <span>Niepodejmowania prób nieautoryzowanego dostępu do systemów</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Section 5 */}
                <section id="sec-5" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    5. Źródła danych i odpowiedzialność
                  </h2>
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4 mb-6">
                    <svg className="w-6 h-6 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm text-amber-900 font-bold mb-2">Ważne zastrzeżenie:</p>
                      <p className="text-sm text-amber-900">
                        Informacje prezentowane w Serwisie pochodzą z oficjalnych źródeł publicznych 
                        (MOPS, strony BIP, strony placówek). Dokładamy wszelkich starań, aby dane były 
                        aktualne i poprawne, jednak:
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-slate-600 text-sm mb-4">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Administrator nie ponosi odpowiedzialności za ewentualne nieścisłości w danych pochodzących ze źródeł zewnętrznych</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Ceny i dostępność miejsc mogą ulec zmianie bez powiadomienia</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span><strong>Użytkownik powinien zawsze weryfikować informacje bezpośrednio z placówką przed podjęciem decyzji</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Administrator nie ponosi odpowiedzialności za decyzje podjęte wyłącznie na podstawie informacji z Serwisu</span>
                    </li>
                  </ul>
                  <p className="text-slate-600 text-sm">
                    <strong>Aktualizacja danych:</strong> Dane są weryfikowane i aktualizowane regularnie 
                    (co najmniej raz w roku). Data ostatniej aktualizacji jest widoczna przy każdej placówce.
                  </p>
                </section>

                {/* Section 6 */}
                <section id="sec-6" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    6. Prawa własności intelektualnej
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Wszelkie treści zamieszczone w Serwisie, w tym grafika, układ strony, kod źródłowy, 
                    są chronione prawami autorskimi i stanowią własność Administratora.
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Użytkownik może korzystać z treści Serwisu wyłącznie na użytek osobisty, niekomercyjny. 
                    Kopiowanie, rozpowszechnianie lub publiczne udostępnianie treści w celach komercyjnych 
                    wymaga pisemnej zgody Administratora.
                  </p>
                </section>

                {/* Section 7 */}
                <section id="sec-7" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    7. Ochrona danych osobowych
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    Zasady przetwarzania danych osobowych określa 
                    {' '}<a href="/polityka-prywatnosci" className="text-primary-700 underline underline-offset-4 font-bold">
                      Polityka Prywatności
                    </a>.
                  </p>
                </section>

                {/* Section 8 */}
                <section id="sec-8" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    8. Pliki cookies
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    Szczegółowe informacje na temat wykorzystywania plików cookies znajdują się w 
                    {' '}<a href="/polityka-cookies" className="text-primary-700 underline underline-offset-4 font-bold">
                      Polityce Cookies
                    </a>.
                  </p>
                </section>

                {/* Section 9 */}
                <section id="sec-9" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    9. Wyłączenie odpowiedzialności
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Administrator nie ponosi odpowiedzialności za:
                  </p>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Przerwy w dostępie do Serwisu wynikające z przyczyn technicznych lub działania siły wyższej</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Działania osób trzecich (placówek, MOPS-ów) nieprzestrzegających podanych informacji</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Szkody wynikłe z korzystania lub niemożności korzystania z Serwisu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Treści dostępne na stronach zewnętrznych linkowanych z Serwisu</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Decyzje Użytkowników podjęte na podstawie informacji z Serwisu</span>
                    </li>
                  </ul>
                </section>

                {/* Section 10 */}
                <section id="sec-10" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    10. Punkt kontaktowy (DSA)
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Zgodnie z Rozporządzeniem o Usługach Cyfrowych (DSA), wyznaczamy punkt kontaktowy:
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

                {/* Section 11 */}
                <section id="sec-11" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    11. Zgłaszanie nieprawidłowości
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Jeśli zauważysz nieprawidłowe, nieaktualne lub niezgodne z prawem informacje w Serwisie, 
                    prosimy o kontakt:
                  </p>
                  <ul className="space-y-2 text-slate-600 text-sm mb-4">
                    <li className="flex items-center gap-2">
                      <span className="text-primary-500">•</span>
                      <span>Email: <a href="mailto:kontakt@kompaseniora.pl" className="text-primary-700 underline underline-offset-4 font-bold">kontakt@kompaseniora.pl</a></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary-500">•</span>
                      <span><a href="/kontakt" className="text-primary-700 underline underline-offset-4 font-bold">Formularz kontaktowy</a></span>
                    </li>
                  </ul>
                  <p className="text-slate-600 leading-relaxed">
                     Zgłoszenie rozpatrzymy niezwłocznie.
                  </p>
                </section>

                {/* Section 12 */}
                <section id="sec-12" className="mb-12 scroll-mt-32">
                  <h2 className="flex items-center gap-3 text-2xl font-serif font-bold mb-6 text-slate-900">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    12. Postanowienia końcowe
                  </h2>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    Administrator zastrzega sobie prawo do:
                  </p>
                  <ul className="space-y-2 text-slate-600 text-sm mb-6">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Zmiany Regulaminu (użytkownicy zostaną poinformowani o zmianach na stronie Serwisu)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Czasowego zawieszenia działania Serwisu z przyczyn technicznych</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>Modyfikacji funkcjonalności Serwisu w celu jego ulepszenia</span>
                    </li>
                  </ul>
                </section>

                {/* Quote */}
                <div className="bg-slate-900 text-white p-8 rounded-3xl text-center mt-12">
                  <p className="font-serif text-xl mb-4 italic">"Jasne zasady, przejrzysta komunikacja."</p>
                  <div className="w-12 h-1 bg-primary-500 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>

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