"use client";

import { useState } from 'react';
import Link from 'next/link';
import MiniFAQSection from '../src/components/faq/MiniFAQSection';
import NewsletterSection from '../src/components/newsletter/NewsletterSection';
import KnowledgeCenter from '../src/components/knowledge/KnowledgeCenter';
import HeroSection from '../src/components/hero/HeroSection';
import RegionalMap from '../src/components/home/RegionalMap';
import { MapPin, ChevronRight, ArrowRight } from 'lucide-react';

export default function Home() {
  // ✅ State management for active tab
  const [activeTab, setActiveTab] = useState<'DPS' | 'SDS' | 'Wszystkie'>('Wszystkie');

  // ✅ State management for selected care profiles
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);

  // ✅ Handler for regional map selection
  const handleRegionSelect = (regionName: string) => {
    window.location.href = `/search?q=${encodeURIComponent(regionName)}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - synced with CategorySelector */}
      <HeroSection
        onTabChange={setActiveTab}
        selectedProfiles={selectedProfiles}
        activeTab={activeTab}
      />

      {/* Regional Map */}
      <RegionalMap onRegionSelect={handleRegionSelect} />

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

      {/* POPULAR LOCATIONS SECTION - GEMINI DESIGN 1:1 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14 gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-stone-100">
                <MapPin size={12} className="text-primary-600" />
                Dostępność lokalna
              </div>
              <h2 className="text-3xl md:text-5xl font-bold font-serif text-slate-900 leading-tight">
                Szukaj w <span className="text-primary-600">Twoim mieście</span>
              </h2>
              <p className="mt-4 text-slate-500 text-base md:text-lg font-medium">
                Placówki w najpopularniejszych miastach Małopolski.
              </p>
            </div>
            <Link 
              href="/search"
              className="hidden md:flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-widest hover:text-primary-600 transition-all group"
            >
              Wszystkie miasta <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
            
            {/* Kraków */}
            <Link href="/search?q=krakow" className="group">
              <div className="relative bg-white rounded-3xl p-6 border border-stone-100 transition-all duration-300 hover:border-primary-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 text-left flex flex-col justify-between h-28 md:h-36">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <MapPin size={20} />
                  </div>
                  <span className="text-2xl font-black text-slate-900 group-hover:text-primary-600 transition-colors">24</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Kraków</h3>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            {/* Nowy Sącz */}
            <Link href="/search?q=nowy+sacz" className="group">
              <div className="relative bg-white rounded-3xl p-6 border border-stone-100 transition-all duration-300 hover:border-primary-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 text-left flex flex-col justify-between h-28 md:h-36">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <MapPin size={20} />
                  </div>
                  <span className="text-2xl font-black text-slate-900 group-hover:text-primary-600 transition-colors">8</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Nowy Sącz</h3>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            {/* Tarnów */}
            <Link href="/search?q=tarnow" className="group">
              <div className="relative bg-white rounded-3xl p-6 border border-stone-100 transition-all duration-300 hover:border-primary-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 text-left flex flex-col justify-between h-28 md:h-36">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <MapPin size={20} />
                  </div>
                  <span className="text-2xl font-black text-slate-900 group-hover:text-primary-600 transition-colors">12</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Tarnów</h3>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            {/* Nowy Targ */}
            <Link href="/search?q=nowy+targ" className="group">
              <div className="relative bg-white rounded-3xl p-6 border border-stone-100 transition-all duration-300 hover:border-primary-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 text-left flex flex-col justify-between h-28 md:h-36">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <MapPin size={20} />
                  </div>
                  <span className="text-2xl font-black text-slate-900 group-hover:text-primary-600 transition-colors">6</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Nowy Targ</h3>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            {/* Oświęcim */}
            <Link href="/search?q=oswiecim" className="group">
              <div className="relative bg-white rounded-3xl p-6 border border-stone-100 transition-all duration-300 hover:border-primary-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 text-left flex flex-col justify-between h-28 md:h-36">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <MapPin size={20} />
                  </div>
                  <span className="text-2xl font-black text-slate-900 group-hover:text-primary-600 transition-colors">5</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Oświęcim</h3>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            {/* Wadowice */}
            <Link href="/search?q=wadowice" className="group">
              <div className="relative bg-white rounded-3xl p-6 border border-stone-100 transition-all duration-300 hover:border-primary-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 text-left flex flex-col justify-between h-28 md:h-36">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <MapPin size={20} />
                  </div>
                  <span className="text-2xl font-black text-slate-900 group-hover:text-primary-600 transition-colors">4</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Wadowice</h3>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            {/* Zakopane */}
            <Link href="/search?q=zakopane" className="group">
              <div className="relative bg-white rounded-3xl p-6 border border-stone-100 transition-all duration-300 hover:border-primary-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 text-left flex flex-col justify-between h-28 md:h-36">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <MapPin size={20} />
                  </div>
                  <span className="text-2xl font-black text-slate-900 group-hover:text-primary-600 transition-colors">3</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Zakopane</h3>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            {/* Myślenice */}
            <Link href="/search?q=myslenice" className="group">
              <div className="relative bg-white rounded-3xl p-6 border border-stone-100 transition-all duration-300 hover:border-primary-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 text-left flex flex-col justify-between h-28 md:h-36">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                    <MapPin size={20} />
                  </div>
                  <span className="text-2xl font-black text-slate-900 group-hover:text-primary-600 transition-colors">4</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Myślenice</h3>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

          </div>

          <div className="md:hidden">
            <Link 
              href="/search"
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              Pełna lista lokalizacji <ArrowRight size={16} />
            </Link>
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