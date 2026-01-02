"use client";

import { useState } from 'react';
import Link from 'next/link';
import MiniFAQSection from '../src/components/faq/MiniFAQSection';
import NewsletterSection from '../src/components/newsletter/NewsletterSection';
import KnowledgeCenter from '../src/components/knowledge/KnowledgeCenter';
import HeroSection from '../src/components/hero/HeroSection';
import { CategorySelector } from '../src/components/CategorySelector';

export default function Home() {
  // ✅ State management for active tab
  const [activeTab, setActiveTab] = useState<'DPS' | 'SDS' | 'Wszystkie'>('Wszystkie');
  
  // ✅ State management for selected care profiles
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - synced with CategorySelector */}
      <HeroSection 
        onTabChange={setActiveTab}
        selectedProfiles={selectedProfiles}
        activeTab={activeTab}
      />

      {/* Category Selector - receives activeTab from state */}
      <CategorySelector
        activeTab={activeTab}
        onSearch={(query) => {
          // CategorySelector handles navigation internally via window.location.href
          console.log('CategorySelector search:', query);
        }}
        onProfilesChange={setSelectedProfiles}
        location=""
      />

      {/* How It Works - 3 Steps */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
              Jak znaleźć opiekę?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Uprościliśmy proces do trzech kroków, abyś mógł szybko znaleźć bezpieczne miejsce dla bliskiego.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative">
            {/* Connecting lines (desktop only) */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-200 to-transparent"
                 style={{ width: 'calc(100% - 200px)', margin: '0 100px' }}></div>

            {/* Step 1 */}
            <div className="relative text-center group">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg z-10">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Wyszukaj placówkę</h3>
              <p className="text-slate-600 leading-relaxed">
                Wpisz miasto lub kod pocztowy. Znajdź domy pomocy w Twojej okolicy.
              </p>
            </div>

            {/* Arrow (desktop only) */}
            <div className="hidden md:flex absolute top-16 left-1/3 -translate-x-1/2 text-emerald-300">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Step 2 */}
            <div className="relative text-center group">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg z-10">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Porównaj koszty</h3>
              <p className="text-slate-600 leading-relaxed">
                Sprawdź oficjalne ceny, standard pokoi i dostępne miejsca.
              </p>
            </div>

            {/* Arrow (desktop only) */}
            <div className="hidden md:flex absolute top-16 left-2/3 -translate-x-1/2 text-emerald-300">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>

            {/* Step 3 */}
            <div className="relative text-center group">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-cyan-50 to-sky-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <div className="w-20 h-20 bg-cyan-600 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-12 h-12 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg z-10">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Skontaktuj się</h3>
              <p className="text-slate-600 leading-relaxed">
                Zadzwoń bezpośrednio do dyrektora lub wyślij zapytanie online.
              </p>
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