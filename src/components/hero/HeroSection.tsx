'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, Sparkles, MapPin,
  Navigation, AlertCircle,
  Check, ShieldCheck, Building2, ChevronRight,
  Calculator, RefreshCw
} from 'lucide-react';

// Type dla suggestion z API
interface Suggestion {
  nazwa: string;
  powiat: string;
  wojewodztwo: string;
  facilitiesCount: number;
}

interface SuggestResponse {
  suggestions: Suggestion[];
  totalCount: number;
  showAll: boolean;
}

// ===== AUTOCOMPLETE DROPDOWN =====
// Defined outside Hero so React never remounts it on re-render
interface AutocompleteDropdownProps {
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  suggestions: Suggestion[];
  totalCount: number;
  highlightedIndex: number;
  onSuggestionClick: (suggestion: Suggestion) => void;
  onShowAllClick: () => void;
  onMouseEnter: (index: number) => void;
}

const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({
  dropdownRef,
  suggestions,
  totalCount,
  highlightedIndex,
  onSuggestionClick,
  onShowAllClick,
  onMouseEnter,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-[100%] left-0 right-0 bg-white rounded-b-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-200 border-t-0 z-[100] overflow-hidden"
    >
      <ul className="divide-y divide-slate-50 bg-white max-h-[300px] overflow-y-auto">
        {suggestions.map((suggestion, index) => (
          <li
            key={`sugg-${suggestion.nazwa}-${suggestion.powiat}-${index}`}
            onMouseDown={() => onSuggestionClick(suggestion)}
            onMouseEnter={() => onMouseEnter(index)}
            className={`px-5 py-3.5 cursor-pointer transition-colors ${
              highlightedIndex === index ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm truncate">{suggestion.nazwa}</p>
                <p className="text-xs text-slate-400 truncate">Powiat {suggestion.powiat}</p>
              </div>
            </div>
          </li>
        ))}

        {suggestions.length < totalCount && (
          <li
            onMouseDown={onShowAllClick}
            className="px-5 py-3.5 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer border-t border-emerald-100 transition-colors group"
          >
            <div className="flex items-center justify-between text-emerald-700">
              <span className="font-bold text-sm">Zobacz wszystkie wyniki ({totalCount})</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </li>
        )}
      </ul>
    </div>
  );
};

const Hero = ({ totalFacilities }: { totalFacilities?: number; onTabChange?: unknown; selectedProfiles?: unknown; activeTab?: unknown }) => {
  const [cityInput, setCityInput] = useState('');
  const [selectedType, setSelectedType] = useState<'DPS' | 'ŚDS' | 'Wszystkie'>('Wszystkie');
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  // Inline kalkulator state
  const [calcIncome, setCalcIncome] = useState('');

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // API-based validation state
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Refs for click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced fetch autocomplete suggestions
  useEffect(() => {
    if (cityInput.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setValidationState('idle');
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({ q: cityInput });
        if (selectedType !== 'Wszystkie') {
          params.append('typ', selectedType);
        }

        const response = await fetch(`/api/teryt/suggest?${params}`);
        const data: SuggestResponse = await response.json();

        const sugg = data.suggestions || [];
        setSuggestions(sugg.slice(0, 5));
        setTotalCount(data.totalCount || 0);
        setShowDropdown(sugg.length > 0);
        setValidationState(sugg.length > 0 ? 'valid' : 'invalid');
        setHighlightedIndex(-1);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
        setShowDropdown(false);
        setValidationState('idle');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [cityInput, selectedType]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setCityInput(suggestion.nazwa);
    setShowDropdown(false);

    const params = new URLSearchParams();
    params.append('q', suggestion.nazwa);
    params.append('powiat', suggestion.powiat);
    if (selectedType !== 'Wszystkie') {
      params.append('type', selectedType === 'DPS' ? 'dps' : 'śds');
    }
    window.location.href = `/search?${params.toString()}`;
  };

  const handleShowAllClick = () => {
    setShowDropdown(false);

    const params = new URLSearchParams();
    params.append('q', cityInput);
    params.append('partial', 'true');
    if (selectedType !== 'Wszystkie') {
      params.append('type', selectedType === 'DPS' ? 'dps' : 'śds');
    }
    window.location.href = `/search?${params.toString()}`;
  };

  const handleSearchClick = () => {
    const params = new URLSearchParams();
    if (cityInput) params.append('q', cityInput);
    if (selectedType !== 'Wszystkie') {
      params.append('type', selectedType === 'DPS' ? 'dps' : 'śds');
    }
    window.location.href = `/search?${params.toString()}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearchClick();
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        } else {
          handleSearchClick();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Twoja przeglądarka nie obsługuje geolokalizacji');
      return;
    }
    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        window.location.href = `/search?lat=${latitude}&lng=${longitude}&near=true`;
      },
      (error) => {
        setIsGeoLoading(false);
        let message = 'Nie udało się pobrać lokalizacji.';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Dostęp do lokalizacji został zablokowany.\n\nWłącz w ustawieniach przeglądarki.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Przekroczono czas oczekiwania.\n\nSpróbuj ponownie lub wpisz miasto ręcznie.';
        } else {
          message = 'Nie można określić lokalizacji.\n\nUpewnij się że masz włączone usługi lokalizacji.';
        }
        alert(message);
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  };

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
    <div className="bg-white pt-12 pb-10 md:pt-16 md:pb-14">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-20">

        {/* === 2-COLUMN GRID === */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-20 items-start">

          {/* ── LEFT: Headline + Search ── */}
          <div className="space-y-8">

            {/* Eyebrow */}
            <div className="flex items-center gap-4">
              <span className="h-px w-10 bg-emerald-600" />
              <span className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-emerald-700">
                Oficjalny System Informacyjny
              </span>
            </div>

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
            <div className="max-w-2xl space-y-3">

              {/* Type chips */}
              <div className="flex gap-2 flex-wrap">
                <TypeChip active={selectedType === 'Wszystkie'} label="Wszystkie"      onClick={() => setSelectedType('Wszystkie')} />
                <TypeChip active={selectedType === 'DPS'}       label="DPS"  sub="Całodobowe" onClick={() => setSelectedType('DPS')} />
                <TypeChip active={selectedType === 'ŚDS'}       label="ŚDS"  sub="Dzienne"    onClick={() => setSelectedType('ŚDS')} />
              </div>

              {/* Search bar */}
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-xl shadow-sm">
                <div className="bg-white border border-slate-200 rounded-lg flex items-stretch">

                  {/* City input */}
                  <div className="relative flex-1 group">
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors pointer-events-none
                      ${validationState === 'invalid' ? 'text-amber-500' : 'text-slate-300 group-focus-within:text-emerald-600'}`}>
                      <MapPin size={18} />
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Gdzie szukasz opieki?"
                      enterKeyHint="search"
                      autoComplete="off"
                      spellCheck="false"
                      className="w-full bg-transparent py-4 pl-11 pr-4 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-medium"
                    />
                    {isLoading && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                      </div>
                    )}
                    {showDropdown && (
                      <AutocompleteDropdown
                        dropdownRef={dropdownRef}
                        suggestions={suggestions}
                        totalCount={totalCount}
                        highlightedIndex={highlightedIndex}
                        onSuggestionClick={handleSuggestionClick}
                        onShowAllClick={handleShowAllClick}
                        onMouseEnter={setHighlightedIndex}
                      />
                    )}
                  </div>

                  {/* Search button */}
                  <button
                    onClick={handleSearchClick}
                    className="bg-slate-900 hover:bg-emerald-700 text-white m-1.5 px-6 rounded-lg font-black text-[11px] uppercase tracking-[0.15em] transition-colors active:scale-95 whitespace-nowrap"
                  >
                    Szukaj
                  </button>
                </div>
              </div>

              {/* Validation / popular hint */}
              <div className="min-h-[22px] px-1">
                {validationState === 'invalid' ? (
                  <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5">
                    <AlertCircle size={13} /> {cityInput} nie jest w naszej bazie. Teraz obejmujemy Małopolskę.
                  </p>
                ) : cityInput.length === 0 ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Popularne:</span>
                    {['Kraków', 'Tarnów', 'Nowy Sącz'].map(city => (
                      <button
                        key={city}
                        onClick={() => setCityInput(city)}
                        className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 underline decoration-slate-200 underline-offset-4 hover:decoration-emerald-300 transition-all"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                ) : validationState === 'valid' && !showDropdown ? (
                  <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
                    <Check size={13} /> Region Małopolski zweryfikowany
                  </p>
                ) : null}
              </div>

              {/* Geolocation */}
              <button
                onClick={handleGeolocation}
                disabled={isGeoLoading}
                className="inline-flex items-center gap-2 text-[11px] font-black uppercase text-slate-400 tracking-widest hover:text-emerald-700 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Navigation size={13} className="text-emerald-500 group-hover:animate-bounce" />
                <span className="underline decoration-dotted underline-offset-4 decoration-2">
                  {isGeoLoading ? 'Wyszukiwanie...' : 'Namierz moją lokalizację'}
                </span>
              </button>
            </div>
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
              <h3 className="text-xl font-black text-white mb-2">Asystent Seniora</h3>
              <p className="text-sm text-slate-300 font-medium leading-relaxed mb-4">
                Odpowiedz na 4 pytania o stan zdrowia seniora. System wybierze DPS lub ŚDS i przygotuje plan działania.
              </p>
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                Uruchom doradcę <ArrowRight size={14} />
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
