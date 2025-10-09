"use client";

import MiniFAQSection from '../src/components/faq/MiniFAQSection';
import KnowledgeCenter from '../src/components/knowledge/KnowledgeCenter';
import HeroSection from '../src/components/hero/HeroSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-semibold text-neutral-900">Kompas Seniora</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-neutral-700 hover:text-neutral-900 font-medium">
                Wyszukiwarka
              </a>
              <a href="#" className="text-neutral-700 hover:text-neutral-900 font-medium">
                Kalkulator
              </a>
              <a href="#" className="text-neutral-700 hover:text-neutral-900 font-medium">
                Poradnik
              </a>
              <button className="bg-accent-500 hover:bg-accent-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Kontakt
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-primary-700">32</span>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Placówki w bazie</h3>
              <p className="text-sm text-neutral-600">Sprawdzone domy pomocy społecznej</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-success-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-success-700">100%</span>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Oficjalne dane</h3>
              <p className="text-sm text-neutral-600">Ceny z urzędów miast i MOPS</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center px-4 h-14 bg-accent-100 rounded-full mb-4">
                <span className="text-sm font-bold text-accent-600">Małopolska</span>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Aktualnie dostępne</h3>
              <p className="text-sm text-neutral-600">Rozszerzamy na kolejne województwa</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <div className="md:px-4">
            <div className="hidden md:grid md:grid-cols-3 gap-8 px-4">
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 text-center">Inteligentna wyszukiwarka</h3>
                <p className="text-neutral-700 text-center">Wpisz "Kamienica" - system znajdzie powiat limanowski</p>
              </div>
              
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">💰</span>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 text-center">Transparentne ceny</h3>
                <p className="text-neutral-700 text-center">Oficjalne dane z MOPS. Koniec z dziesiątkami PDFów</p>
              </div>
              
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-20 h-20 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🧮</span>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 text-center">Kalkulator kosztów</h3>
                <p className="text-neutral-700 text-center">Zaplanuj budżet opieki i porównaj różne opcje</p>
              </div>
            </div>
            
            <div className="md:hidden overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 px-4 pb-4" style={{ width: 'max-content' }}>
                <div className="bg-white rounded-xl p-6 shadow-sm" style={{ width: '280px' }}>
                  <div className="w-16 h-16 bg-secondary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔍</span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">Inteligentna wyszukiwarka</h3>
                  <p className="text-sm text-neutral-700 text-center">Wpisz miejscowość - znajdziemy odpowiedni powiat</p>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm" style={{ width: '280px' }}>
                  <div className="w-16 h-16 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💰</span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">Transparentne ceny</h3>
                  <p className="text-sm text-neutral-700 text-center">Oficjalne dane MOPS bez ukrytych kosztów</p>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm" style={{ width: '280px' }}>
                  <div className="w-16 h-16 bg-accent-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🧮</span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">Kalkulator kosztów</h3>
                  <p className="text-sm text-neutral-700 text-center">Zaplanuj budżet opieki dla bliskiej osoby</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <KnowledgeCenter />

      <section className="py-16 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Rozpocznij poszukiwania już dziś</h2>
          <p className="text-xl text-neutral-700 mb-8">Pomożemy Ci znaleźć najlepszą opiekę dla Twojego bliskiego</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/search" className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-sm hover:shadow-md">
              Znajdź dom opieki
            </a>
            <button className="bg-white hover:bg-neutral-50 text-neutral-900 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-neutral-300 transition-colors">
              Użyj kalkulatora
            </button>
          </div>
        </div>
      </section>

      {/* Location Search */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h2 className="text-3xl font-bold text-neutral-900">Szukasz w konkretnej lokalizacji?</h2>
          </div>
          
          <div className="bg-white rounded-xl border border-neutral-200 p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <a href="/search?q=krakow" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Kraków</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a href="/search?q=limanowa" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Limanowa</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a href="/search?q=nowy+targ" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Nowy Targ</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              
              <div className="space-y-4">
                <a href="/search?q=nowy+sacz" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Nowy Sącz</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a href="/search?q=wadowice" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Wadowice</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a href="/search?q=oswiecim" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Oświęcim</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              
              <div className="space-y-4">
                <a href="/search?q=tarnow" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Tarnów</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a href="/search?q=zakopane" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Zakopane</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
                <a href="/search?q=myslenice" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Myślenice</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <a href="/search" className="inline-flex items-center gap-2 bg-accent-100 hover:bg-accent-200 text-accent-700 px-6 py-3 rounded-lg font-medium transition-colors">
                Zobacz wszystkie lokalizacje
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <MiniFAQSection />

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-br from-accent-500 to-accent-600">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Bądź na bieżąco z kompaseniora.pl</h2>
            <p className="text-lg text-accent-50 max-w-2xl mx-auto">Otrzymuj aktualizacje o nowych domach opieki, zmianach cen oraz wsparcie dla całej rodziny w opiece nad bliskimi.</p>
          </div>
          <form className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="email" placeholder="Twój adres email" className="flex-1 px-6 py-4 rounded-lg text-lg text-neutral-900 placeholder:text-white border-2 border-white bg-white/10 backdrop-blur-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-white" />
              <button type="submit" className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors whitespace-nowrap">Zapisz się</button>
            </div>
            <p className="text-sm text-accent-50 mt-4 text-center">Nie dzielimy się danymi z nikim. Wypisz się kiedy chcesz.</p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-semibold text-neutral-900">Kompas Seniora</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-neutral-700">
              <a href="#" className="hover:text-neutral-900 transition-colors">Polityka prywatności</a>
              <a href="#" className="hover:text-neutral-900 transition-colors">Regulamin</a>
              <a href="#" className="hover:text-neutral-900 transition-colors">Kontakt</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-neutral-200 text-center">
            <p className="text-neutral-500 text-sm">© 2024 Kompas Seniora. Dane z oficjalnych źródeł MOPS i urzędów miast.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}