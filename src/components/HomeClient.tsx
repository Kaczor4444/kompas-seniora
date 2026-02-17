"use client";

import { useState } from 'react';
import Link from 'next/link';
import { SparklesIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import MiniFAQSection from './faq/MiniFAQSection';
import NewsletterSection from './newsletter/NewsletterSection';
import KnowledgeCenter from './knowledge/KnowledgeCenter';
import HeroSection from './hero/HeroSection';
import RegionalMap from './home/RegionalMap';
import PopularLocationsSection from './home/PopularLocationsSection';

interface HomeClientProps {
  totalFacilities: number;
  powiatCounts: Record<string, number>;
}

export default function HomeClient({ totalFacilities, powiatCounts }: HomeClientProps) {
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
        totalFacilities={totalFacilities}
      />

      {/* How It Works - 3 Steps */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-0 tracking-tighter">
              System opieki to labirynt.<br className="hidden md:block" /> Przeprowadzimy Cię przez to krok po kroku.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x md:divide-slate-100">

            {/* Step 1 */}
            <div className="px-0 md:px-10 pb-10 md:pb-0 border-b md:border-b-0 border-slate-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Krok 01</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Wyszukaj placówkę</h3>
              <p className="text-slate-500 leading-relaxed text-base">
                Wpisz miasto i wybierz typ placówki — DPS lub ŚDS. Pokażemy tylko to, co faktycznie pasuje.
              </p>
            </div>

            {/* Step 2 */}
            <div className="px-0 md:px-10 py-10 md:py-0 border-b md:border-b-0 border-slate-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Krok 02</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Porównaj koszty</h3>
              <p className="text-slate-500 leading-relaxed text-base">
                Zobacz ile wynoszą opłaty za pobyt w DPS i sprawdź jak wygląda podział kosztów między rodzinę a gminę.
              </p>
            </div>

            {/* Step 3 */}
            <div className="px-0 md:px-10 pt-10 md:pt-0">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Krok 03</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Skontaktuj się</h3>
              <p className="text-slate-500 leading-relaxed text-base">
                Bezpośredni numer do placówki. Zapytaj o wolne miejsca i umów się na wizytę.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA - Doradca + Poradniki */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-[0.25em] mb-6">
              <SparklesIcon className="w-4 h-4 text-emerald-700" /> Nie wiesz od czego zacząć?
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-[1.0] mb-4">
              Nie musisz wiedzieć<br />
              <span className="text-emerald-600 relative inline-block">
                wszystkiego od razu.
                <svg className="absolute -bottom-2 left-0 w-full overflow-visible" viewBox="0 0 400 16" fill="none" preserveAspectRatio="none">
                  <path d="M0 12 Q100 2 200 10 Q300 18 400 6" stroke="#bbf7d0" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </span>
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl leading-relaxed border-l-4 border-emerald-100 pl-5 mt-6">
              Skorzystaj z doradcy, który podpowie co będzie lepszym wyborem dla seniora — DPS czy ŚDS — lub przeczytaj nasze poradniki, które pomogą Ci podjąć decyzję.
            </p>
          </div>

          {/* 1/3 + 2/3 layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

            {/* Left 1/3 — Asystent */}
            <div className="bg-slate-900 rounded-2xl p-8 flex flex-col justify-between group lg:col-span-1">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <SparklesIcon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em]">Sztuczna inteligencja</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Doradca Seniora</h3>
                <p className="text-slate-300 leading-relaxed mb-8">
                  Odpowiedz na 4 pytania o potrzeby seniora. System wskaże DPS lub ŚDS i przygotuje konkretny plan działania.
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-400 mb-8">
                  <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>2 minuty</span>
                  <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Bez rejestracji</span>
                  <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Konkretny plan</span>
                </div>
              </div>
              <Link
                href="/asystent?start=true"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-[0.15em] transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Rozpocznij analizę <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>

            {/* Right 2/3 — Poradniki (KnowledgeCenter) */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 overflow-hidden">
              <KnowledgeCenter />
            </div>

          </div>
        </div>
      </section>

      {/* Regional Map */}
      <RegionalMap
        powiatCounts={powiatCounts}
        totalFacilities={totalFacilities}
      />

      {/* POPULAR LOCATIONS - Now with dynamic data */}
      <PopularLocationsSection />

      {/* Mini FAQ */}
      <MiniFAQSection />

      {/* Newsletter - Dark Theme */}
      <NewsletterSection />
    </div>
  );
}
