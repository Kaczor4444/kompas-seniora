"use client";

import Link from 'next/link'; 
import MiniFAQSection from '../src/components/faq/MiniFAQSection';
import NewsletterSection from '../src/components/newsletter/NewsletterSection';
import KnowledgeCenter from '../src/components/knowledge/KnowledgeCenter';
import HeroSection from '../src/components/hero/HeroSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
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
            {/* Desktop: 3 columns */}
            <div className="hidden md:grid md:grid-cols-3 gap-8 px-4">
              {/* Card 1: Search */}
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <div className="w-20 h-20 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary-200 transition-colors">
                  <svg className="w-10 h-10 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 text-center">Wyszukiwarka placówek</h3>
                <p className="text-neutral-700 text-center mb-6">Znajdź i porównaj domy pomocy w Twojej okolicy z oficjalnymi cenami</p>
                <a 
                  href="#search" 
                  className="flex items-center justify-center gap-2 text-secondary-600 hover:text-secondary-700 font-semibold text-sm group-hover:gap-3 transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    const heroSection = document.querySelector('[class*="hero"]') || document.querySelector('input[type="text"]');
                    heroSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  Rozpocznij wyszukiwanie
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              
              {/* Card 2: Pricing */}
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <div className="w-20 h-20 bg-success-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-success-200 transition-colors">
                  <svg className="w-10 h-10 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 text-center">Transparentne dane</h3>
                <p className="text-neutral-700 text-center mb-6">Oficjalne ceny z MOPS. Koniec z dziesiątkami PDF-ów</p>
                <a 
                  href="/search" 
                  className="flex items-center justify-center gap-2 text-success-600 hover:text-success-700 font-semibold text-sm group-hover:gap-3 transition-all"
                >
                  Zobacz placówki
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
              
              {/* Card 3: Calculator */}
              <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <div className="w-20 h-20 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-accent-200 transition-colors">
                  <svg className="w-10 h-10 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 text-center">Kalkulator kosztów</h3>
                <p className="text-neutral-700 text-center mb-6">Oblicz miesięczne koszty pobytu z uwzględnieniem dofinansowania</p>
                <Link href="/kalkulator" 
                  className="flex items-center justify-center gap-2 text-accent-600 hover:text-accent-700 font-semibold text-sm group-hover:gap-3 transition-all w-full"
                >
                  Oblicz koszty
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            
            {/* Mobile: Horizontal scroll */}
            <div className="md:hidden overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 px-4 pb-4" style={{ width: 'max-content' }}>
                {/* Card 1: Search */}
                <div className="bg-white rounded-xl p-6 shadow-sm" style={{ width: '280px' }}>
                  <div className="w-16 h-16 bg-secondary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">Wyszukiwarka placówek</h3>
                  <p className="text-sm text-neutral-700 text-center mb-4">Znajdź domy pomocy w okolicy z oficjalnymi cenami</p>
                  <a 
                    href="#search" 
                    className="flex items-center justify-center gap-2 text-secondary-600 font-semibold text-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      const heroSection = document.querySelector('[class*="hero"]') || document.querySelector('input[type="text"]');
                      heroSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                  >
                    Wyszukaj
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
                
                {/* Card 2: Pricing */}
                <div className="bg-white rounded-xl p-6 shadow-sm" style={{ width: '280px' }}>
                  <div className="w-16 h-16 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">Transparentne dane</h3>
                  <p className="text-sm text-neutral-700 text-center mb-4">Oficjalne ceny MOPS bez ukrytych kosztów</p>
                  <a 
                    href="/search" 
                    className="flex items-center justify-center gap-2 text-success-600 font-semibold text-sm"
                  >
                    Zobacz placówki
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
                
                {/* Card 3: Calculator */}
                <div className="bg-white rounded-xl p-6 shadow-sm" style={{ width: '280px' }}>
                  <div className="w-16 h-16 bg-accent-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">Kalkulator kosztów</h3>
                  <p className="text-sm text-neutral-700 text-center mb-4">Oblicz budżet opieki dla bliskiej osoby</p>
                  <Link href="/kalkulator" 
                    className="flex items-center justify-center gap-2 text-accent-600 font-semibold text-sm w-full"
                  >
                    Oblicz
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge Center */}
      <KnowledgeCenter />

      {/* CTA Section */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Rozpocznij poszukiwania już dziś</h2>
          <p className="text-xl text-neutral-700 mb-8">Pomożemy Ci znaleźć najlepszą opiekę dla Twojego bliskiego</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search" className="bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-sm hover:shadow-md">
              Znajdź dom opieki
            </Link>
            <Link href="/kalkulator" className="bg-white hover:bg-neutral-50 text-neutral-900 px-8 py-4 rounded-xl font-semibold text-lg border-2 border-neutral-300 transition-colors">
              Użyj kalkulatora
            </Link>
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
                <Link href="/search?q=krakow" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Kraków</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/search?q=limanowa" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Limanowa</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/search?q=nowy+targ" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Nowy Targ</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              <div className="space-y-4">
                <Link href="/search?q=nowy+sacz" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Nowy Sącz</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/search?q=wadowice" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Wadowice</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/search?q=oswiecim" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Oświęcim</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              <div className="space-y-4">
                <Link href="/search?q=tarnow" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Tarnów</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/search?q=zakopane" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Zakopane</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/search?q=myslenice" className="flex items-center justify-between p-4 hover:bg-neutral-50 rounded-lg transition-colors group">
                  <span className="text-neutral-900 font-medium">DPS Myślenice</span>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-accent-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <Link href="/search" className="inline-flex items-center gap-2 bg-accent-100 hover:bg-accent-200 text-accent-700 px-6 py-3 rounded-lg font-medium transition-colors">
                Zobacz wszystkie lokalizacje
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mini FAQ */}
      <MiniFAQSection />

      {/* Newsletter - Dark Theme */}
      <NewsletterSection />
    </div>
  );
}