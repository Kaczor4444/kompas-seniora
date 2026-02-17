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
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tighter">
              Nie musisz wiedzieć wszystkiego od razu.
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              System opieki to labirynt przepisów. Przeprowadzimy Cię przez to krok po kroku.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:divide-x md:divide-slate-100">

            {/* Step 1 */}
            <div className="px-0 md:px-10 pb-10 md:pb-0 border-b md:border-b-0 border-slate-100">
              <p className="text-[80px] md:text-[96px] font-black text-emerald-600 leading-none tracking-tighter mb-4 select-none">01</p>
              <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Wyszukaj placówkę</h3>
              <p className="text-slate-500 leading-relaxed text-base">
                Wpisz miasto i wybierz typ placówki — DPS lub ŚDS. Pokażemy tylko to, co faktycznie pasuje.
              </p>
            </div>

            {/* Step 2 */}
            <div className="px-0 md:px-10 py-10 md:py-0 border-b md:border-b-0 border-slate-100">
              <p className="text-[80px] md:text-[96px] font-black text-emerald-600 leading-none tracking-tighter mb-4 select-none">02</p>
              <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Porównaj koszty</h3>
              <p className="text-slate-500 leading-relaxed text-base">
                Zobacz ile wynoszą opłaty za pobyt w DPS i sprawdź jak wygląda podział kosztów w Twojej sytuacji.
              </p>
            </div>

            {/* Step 3 */}
            <div className="px-0 md:px-10 pt-10 md:pt-0">
              <p className="text-[80px] md:text-[96px] font-black text-emerald-600 leading-none tracking-tighter mb-4 select-none">03</p>
              <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Skontaktuj się</h3>
              <p className="text-slate-500 leading-relaxed text-base">
                Bezpośredni numer do placówki. Zapytaj o wolne miejsca bez pośredników.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Regional Map */}
      <RegionalMap
        powiatCounts={powiatCounts}
        totalFacilities={totalFacilities}
      />

      {/* CTA - Asystent Wyboru */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-16 shadow-xl border border-stone-100 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-xs font-bold uppercase mb-6 border border-primary-200">
              <SparklesIcon className="w-4 h-4" /> Potrzebujesz pomocy?
            </div>

            <h3 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tighter">
              Nie wiesz, od czego zacząć?
            </h3>

            <p className="text-slate-600 text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Wypełnij 4 proste pytania, a pomożemy Ci wybrać odpowiednią formę opieki dla Twojego bliskiego.
            </p>

            <Link
              href="/asystent?start=true"
              className="inline-flex items-center gap-3 bg-slate-900 hover:bg-primary-600 text-white px-8 md:px-10 py-4 md:py-5 rounded-2xl font-bold text-base md:text-lg transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              Rozpocznij analizę <ChevronRightIcon className="w-5 h-5" />
            </Link>

            <div className="flex items-center justify-center flex-wrap gap-4 md:gap-6 mt-6 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                2 minuty
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Bez rejestracji
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Konkretny plan
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Knowledge Center */}
      <KnowledgeCenter />

      {/* POPULAR LOCATIONS - Now with dynamic data */}
      <PopularLocationsSection />

      {/* Mini FAQ */}
      <MiniFAQSection />

      {/* Newsletter - Dark Theme */}
      <NewsletterSection />
    </div>
  );
}
