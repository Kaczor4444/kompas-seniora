'use client';

import React, { useState } from 'react';
import {
  ArrowRight, Sparkles, ShieldCheck, Building2, ChevronRight,
  Calculator, RefreshCw
} from 'lucide-react';
import { SearchBar } from '@/src/components/search/SearchBar';


const Hero = ({ totalFacilities }: { totalFacilities?: number; onTabChange?: unknown; selectedProfiles?: unknown; activeTab?: unknown }) => {
  // Inline kalkulator state
  const [calcIncome, setCalcIncome] = useState('');

  // Inline kalkulator
  const calcIncomeNum = parseFloat(calcIncome) || 0;
  const calcContribution = Math.round(calcIncomeNum * 0.7);
  const calcRemaining = Math.round(calcIncomeNum * 0.3);
  const showCalcResult = calcIncomeNum > 0;

  const handleCalcGoFull = () => {
    const params = new URLSearchParams();
    if (calcIncome) params.append('income', calcIncome);
    window.location.href = `/kalkulator?${params.toString()}`;
  };

  const formatPLN = (amount: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(amount);

  return (
    <div className="bg-white pt-11 pb-10 md:pt-12 md:pb-14">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-20">

        {/* === 2-COLUMN GRID === */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-20 items-start">

          {/* ── LEFT: Headline + Search ── */}
          <div className="space-y-8">

            {/* Headline */}
            <h1 className="text-[52px] md:text-[80px] lg:text-[96px] font-black text-slate-900 leading-[0.9] tracking-tighter">
              Szukasz opieki<br />
              <span className="text-emerald-600 relative inline-block">
                dla seniora?
                <svg className="absolute -bottom-3 left-0 w-full overflow-visible" viewBox="0 0 400 16" fill="none" preserveAspectRatio="none">
                  <path d="M0 12 Q100 2 200 10 Q300 18 400 6" stroke="#bbf7d0" strokeWidth="5" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-lg md:text-xl font-medium max-w-xl leading-relaxed border-l-4 border-emerald-100 pl-6">
              Niezależny przewodnik po domach opieki w <strong className="text-slate-900 font-black">Małopolsce</strong>. Pomagamy zrozumieć formalności, finanse i krok po kroku znaleźć najlepsze miejsce.
            </p>

            {/* Search block */}
            <SearchBar />
          </div>

          {/* ── RIGHT: Tool cards ── */}
          <div className="space-y-4 lg:pt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 pl-1">
              Polecane narzędzia
            </p>

            {/* Calculator card */}
            <div className="bg-white border border-slate-300 rounded-xl p-6 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Calculator size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">Finanse</span>
                </div>
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-1">Kalkulator Opłat</h3>
              <p className="text-sm text-slate-500 font-medium mb-4 leading-relaxed">
                Sprawdź koszt pobytu i wysokość dopłat z budżetu gminy.
              </p>

              {/* Mini calc */}
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="number"
                    value={calcIncome}
                    onChange={(e) => setCalcIncome(e.target.value)}
                    placeholder="Dochód seniora (zł/mc)"
                    min="0" max="50000" step="100"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-400 placeholder:font-medium"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">PLN</span>
                </div>

                {showCalcResult && (
                  <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-2 text-center border border-slate-200">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5">Wkład (70%)</p>
                      <p className="text-xl font-black text-slate-900">{formatPLN(calcContribution)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-0.5">Zostaje (30%)</p>
                      <p className="text-xl font-black text-slate-900">{formatPLN(calcRemaining)}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCalcGoFull}
                  className={`w-full py-3 rounded-lg font-black text-[11px] uppercase tracking-[0.15em] transition-all active:scale-95 flex items-center justify-center gap-2
                    ${showCalcResult
                      ? 'bg-slate-900 hover:bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  disabled={!showCalcResult}
                >
                  <Calculator size={14} />
                  {showCalcResult ? 'Pełna analiza →' : 'Wpisz dochód aby kontynuować'}
                </button>
              </div>
            </div>

            {/* Assistant card */}
            <button
              onClick={() => { window.location.href = '/asystent?start=true'; }}
              className="w-full bg-slate-900 hover:bg-slate-800 border-2 border-slate-900 p-6 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Sparkles size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Sztuczna Inteligencja</span>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Asystent Wyboru</h3>
              <p className="text-sm text-slate-300 font-medium leading-relaxed mb-4">
                Odpowiedz na 4 pytania o potrzeby seniora - podpowiemy która forma opieki DPS czy ŚDS będzie właściwa i co zrobić dalej.
              </p>
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                Uruchom asystenta <ArrowRight size={14} />
              </span>
            </button>
          </div>
        </div>

        {/* === TRUST BAR === */}
        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-10 lg:gap-20">
          <TrustItem icon={<ShieldCheck size={16} />} label="Dane" value="Oficjalne BIP" />
          <TrustItem icon={<Building2 size={16} />} label="Placówki" value={`${totalFacilities ?? 36} w Małopolsce`} />
          <TrustItem icon={<RefreshCw size={16} />} label="Aktualizacja" value="Stale aktualizowane" />
        </div>

      </div>
    </div>
  );
};

// ─── Helper components ───────────────────────────────────────────────────────

const TypeChip = ({ active, label, sub, onClick }: { active: boolean; label: string; sub?: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg border-2 transition-all flex flex-col items-center justify-center min-w-[80px]
      ${active
        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
  >
    <span className="text-[11px] font-black uppercase tracking-wider">{label}</span>
    {sub && (
      <span className={`hidden sm:block text-[9px] font-bold uppercase tracking-widest mt-0.5 ${active ? 'text-slate-300' : 'text-slate-400'}`}>
        {sub}
      </span>
    )}
  </button>
);

const TrustItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-3 group cursor-default">
    <div className="text-emerald-600">{icon}</div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">{label}</p>
      <p className="text-base font-black text-slate-900">{value}</p>
    </div>
  </div>
);

export default Hero;
