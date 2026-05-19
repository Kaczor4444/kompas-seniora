"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import QuestionnaireIcon from '@/components/icons/QuestionnaireIcon';
import AccountingCalculatorIcon from '@/components/icons/AccountingCalculatorIcon';
import MiniFAQSection from './faq/MiniFAQSection';
import NewsletterSection from './newsletter/NewsletterSection';
import KnowledgeCenter from './knowledge/KnowledgeCenter';
import HeroSection from './hero/HeroSection';
import RegionalMap from './home/RegionalMap';
import PopularLocationsSection from './home/PopularLocationsSection';
import FacilityTypeCards from './home/FacilityTypeCards';
import type { ArticleWithMetadata } from '@/lib/articleHelpers';

interface HomeClientProps {
  totalFacilities: number;
  powiatCounts: Record<string, number>;
  featuredArticles: ArticleWithMetadata[];
  typeCounts: { DPS: number; SDS: number; KlubSenior: number; DDSenior: number; UTW: number };
  typeCountsSlaskie: { DPS: number; SDS: number; KlubSenior: number; DDSenior: number; UTW: number };
  powiatCountsByType: Record<'DPS' | 'KlubSenior' | 'DDSenior', Record<string, number>>;
  powiatCountsByTypeSlaskie: Record<'DPS' | 'KlubSenior' | 'DDSenior', Record<string, number>>;
}

export default function HomeClient({ totalFacilities, powiatCounts, featuredArticles, typeCounts, typeCountsSlaskie, powiatCountsByType, powiatCountsByTypeSlaskie }: HomeClientProps) {
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

      {/* Facility Type Cards — łączna liczba ze wszystkich województw */}
      <FacilityTypeCards typeCounts={{
        DPS:        typeCounts.DPS        + typeCountsSlaskie.DPS,
        SDS:        typeCounts.SDS        + typeCountsSlaskie.SDS,
        KlubSenior: typeCounts.KlubSenior + typeCountsSlaskie.KlubSenior,
        DDSenior:   typeCounts.DDSenior   + typeCountsSlaskie.DDSenior,
        UTW:        typeCounts.UTW        + typeCountsSlaskie.UTW,
      }} />

      {/* How It Works - 3 Steps */}
      <section className="bg-slate-900 py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="mb-12 md:mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 mb-3">Jak to działa</p>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight max-w-2xl">
              Znajdź odpowiednią placówkę w trzech prostych krokach.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Step 1 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 relative overflow-hidden group hover:bg-white/10 transition-colors">
              <div className="absolute top-4 right-5 text-[80px] font-black text-white/5 leading-none select-none">01</div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 block mb-3">Krok 01</span>
              <h3 className="text-xl font-black text-white mb-3 tracking-tight">Wyszukaj placówkę</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Wpisz miasto i wybierz rodzaj placówki — DPS, Klub Senior+ lub Dzienny Dom Senior+. Pokażemy tylko to, co faktycznie pasuje do Twojej okolicy.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 relative overflow-hidden group hover:bg-white/10 transition-colors">
              <div className="absolute top-4 right-5 text-[80px] font-black text-white/5 leading-none select-none">02</div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <AccountingCalculatorIcon size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 block mb-3">Krok 02</span>
              <h3 className="text-xl font-black text-white mb-3 tracking-tight">Sprawdź koszty i dostępność</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Zobacz aktualne ceny DPS z oficjalnych źródeł i sprawdź podział kosztów między seniora, rodzinę a gminę. Kluby i Domy Senior+ są bezpłatne.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 relative overflow-hidden group hover:bg-white/10 transition-colors">
              <div className="absolute top-4 right-5 text-[80px] font-black text-white/5 leading-none select-none">03</div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500 block mb-3">Krok 03</span>
              <h3 className="text-xl font-black text-white mb-3 tracking-tight">Skontaktuj się</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Bezpośredni numer i adres placówki w Twojej okolicy. Dla DPS — umów się na wizytę i złóż wniosek. Dla Senior+ — wystarczy zadzwonić.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA - Doradca + Poradniki */}
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Heading */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-[1.0] mb-3">
              Nie musisz wiedzieć<br />
              <span className="text-emerald-600 relative inline-block">
                wszystkiego od razu.
                <svg className="absolute -bottom-2 left-0 w-full overflow-visible" viewBox="0 0 400 16" fill="none" preserveAspectRatio="none">
                  <path d="M0 12 Q100 2 200 10 Q300 18 400 6" stroke="#bbf7d0" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </span>
            </h2>
            <p className="text-slate-500 text-base max-w-2xl leading-relaxed border-l-4 border-emerald-100 pl-4 mt-4">
              Skorzystaj z asystenta, który pomoże dopasować właściwą formę opieki — lub przeczytaj nasze poradniki, które pomogą Ci podjąć decyzję.
            </p>
          </div>

          {/* 1/3 + 2/3 layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">

            {/* Left 1/3 — Asystent */}
            <div className="bg-slate-900 rounded-2xl p-6 flex flex-col justify-between group lg:col-span-1">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <QuestionnaireIcon size={24} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em]">Ankieta</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Asystent Wyboru</h3>
                <p className="text-slate-300 leading-relaxed mb-8">
                  Odpowiedz na 4 pytania o potrzeby seniora — podpowiemy właściwą formę opieki i pokażemy placówki w Twojej okolicy.
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
              <KnowledgeCenter articles={featuredArticles} />
            </div>

          </div>
        </div>
      </section>

      {/* Regional Map */}
      <RegionalMap
        powiatCounts={powiatCounts}
        totalFacilities={totalFacilities}
        powiatCountsByType={powiatCountsByType}
        typeCounts={typeCounts}
        typeCountsSlaskie={typeCountsSlaskie}
        powiatCountsByTypeSlaskie={powiatCountsByTypeSlaskie}
      />

      {/* POPULAR LOCATIONS - Now with dynamic data */}
      <PopularLocationsSection />

      {/* Mini FAQ */}
      <MiniFAQSection />

      {/* Newsletter - Dark Theme */}
      {/* <NewsletterSection /> */}
    </div>
  );
}
