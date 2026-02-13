'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, Sparkles, MapPin,
  Search, Navigation, AlertCircle,
  Check, ShieldCheck, Building2, ChevronRight,
  Calculator
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

const Hero = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'calculator' | 'assistant'>('search');
  const [cityInput, setCityInput] = useState("");
  const [selectedType, setSelectedType] = useState<'DPS' | 'ŚDS' | 'Wszystkie'>('Wszystkie');
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  // Kalkulator inline state
  const [calcIncome, setCalcIncome] = useState('');
  const [calcCity, setCalcCity] = useState('');

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

  // Helper function for Polish pluralization
  const getPluralForm = (count: number): string => {
    if (count === 1) return "placówka";
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "placówek";
    if (lastDigit >= 2 && lastDigit <= 4) return "placówki";
    return "placówek";
  };

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
          params.append("typ", selectedType);
        }

        const response = await fetch(`/api/teryt/suggest?${params}`);
        const data: SuggestResponse = await response.json();

        const suggestions = data.suggestions || [];
        setSuggestions(suggestions.slice(0, 5)); // Max 5 suggestions
        setTotalCount(data.totalCount || 0);
        setShowDropdown(suggestions.length > 0);
        setValidationState(suggestions.length > 0 ? 'valid' : 'invalid');
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setCityInput(suggestion.nazwa);
    setShowDropdown(false);

    const params = new URLSearchParams();
    params.append("q", suggestion.nazwa);
    params.append("powiat", suggestion.powiat);

    if (selectedType !== 'Wszystkie') {
      params.append("type", selectedType === 'DPS' ? 'dps' : 'śds');
    }

    window.location.href = `/search?${params.toString()}`;
  };

  const handleShowAllClick = () => {
    setShowDropdown(false);

    const params = new URLSearchParams();
    params.append("q", cityInput);
    params.append("partial", "true");

    if (selectedType !== 'Wszystkie') {
      params.append("type", selectedType === 'DPS' ? 'dps' : 'śds');
    }

    window.location.href = `/search?${params.toString()}`;
  };

  const handleSearchClick = () => {
    const params = new URLSearchParams();
    if (cityInput) {
      params.append("q", cityInput);
    }
    if (selectedType !== 'Wszystkie') {
      params.append("type", selectedType === 'DPS' ? 'dps' : 'śds');
    }
    window.location.href = `/search?${params.toString()}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSearchClick();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        } else {
          handleSearchClick();
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Twoja przeglądarka nie obsługuje geolokalizacji");
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
        console.error("Geolocation error:", error);

        let message = "Nie udało się pobrać lokalizacji.";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Dostęp do lokalizacji został zablokowany.\n\nWłącz w ustawieniach przeglądarki.";
        } else if (error.code === error.TIMEOUT) {
          message = "Przekroczono czas oczekiwania.\n\nSpróbuj ponownie lub wpisz miasto ręcznie.";
        } else {
          message = "Nie można określić lokalizacji.\n\nUpewnij się że masz włączone usługi lokalizacji.";
        }
        alert(message);
      },
      {
        timeout: 10000,
        maximumAge: 60000,
        enableHighAccuracy: false,
      }
    );
  };

  // Inline kalkulator: obliczenia bez API (tylko matematyka 70/30)
  const calcIncomeNum = parseFloat(calcIncome) || 0;
  const calcContribution = Math.round(calcIncomeNum * 0.7);
  const calcRemaining = Math.round(calcIncomeNum * 0.3);
  const showCalcResult = calcIncomeNum > 0;

  const handleCalcGoFull = () => {
    const params = new URLSearchParams();
    if (calcIncome) params.append('income', calcIncome);
    if (calcCity) params.append('city', calcCity);
    window.location.href = `/kalkulator?${params.toString()}`;
  };

  const formatPLN = (amount: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(amount);

  // Subtitle per tab
  const subtitles = {
    search: "Przeszukaj bazę publicznych placówek w Małopolsce.",
    calculator: "Sprawdź ile realnie wyniesie Twój wkład w koszty DPS.",
    assistant: "Dobierzemy odpowiedni typ opieki w 2 minuty.",
  };

  // Tab slider position (3 tabs)
  const tabPositions = {
    search: '4px',
    calculator: 'calc(33.333% + 1px)',
    assistant: 'calc(66.667% - 2px)',
  };

  // Autocomplete Dropdown Component - Seamless Design (Fixed clipping)
  const AutocompleteDropdown = () => {
    if (!showDropdown || suggestions.length === 0) return null;

    console.log('🎨 RENDERING DROPDOWN:', {
      suggestionsLength: suggestions.length,
      totalCount,
      showDropdown,
      suggestions: suggestions.map(s => `${s.nazwa} (${s.powiat}) - ${s.facilitiesCount}`)
    });

    return (
      <div
        ref={dropdownRef}
        className="absolute top-[100%] -translate-y-3 left-0 right-0 bg-white rounded-b-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-primary-200 border-t-0 z-[100] overflow-visible"
      >
        {/* Lista - BEZ max-height aby pokazać wszystkie 5 sugestii */}
        <ul className="divide-y divide-stone-50 bg-white pt-3">
          {suggestions.map((suggestion, index) => (
            <li
              key={`sugg-${suggestion.nazwa}-${suggestion.powiat}-${index}`}
              onMouseDown={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-6 py-4 cursor-pointer transition-colors ${
                highlightedIndex === index ? "bg-stone-50" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-base truncate">{suggestion.nazwa}</p>
                  <p className="text-xs text-slate-400 truncate">Powiat {suggestion.powiat}</p>
                </div>
              </div>
            </li>
          ))}

          {suggestions.length < totalCount && (
            <li
              onMouseDown={handleShowAllClick}
              className="px-6 py-4 bg-primary-50/30 hover:bg-primary-50 cursor-pointer border-t border-primary-100 transition-colors group"
            >
              <div className="flex items-center justify-between text-primary-600">
                <span className="font-bold text-sm">Zobacz wszystkie wyniki ({totalCount})</span>
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </li>
          )}
        </ul>
      </div>
    );
  };

  return (
    <div className="bg-white pt-6 pb-4 md:pt-8 md:pb-8 relative overflow-hidden">
      {/* Background Decor - Subtle Grid */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-emerald-50/30 via-white to-white pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">

        {/* HEADER */}
        <div className="text-center mb-4 md:mb-6">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Szukasz opieki <br />
            <span className="relative inline-block text-primary-600">
              dla seniora?
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary-200/60" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 12 100 5" stroke="currentColor" strokeWidth="10" fill="none" />
              </svg>
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed h-12 md:h-auto">
            {subtitles[activeTab]}
          </p>
        </div>

        {/* COMMAND CENTER HUB */}
        <div className="bg-white rounded-2xl p-2.5 md:p-3 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-stone-200 relative z-[20]">

          {/* TAB SWITCHER — 3 zakładki */}
          <div className="flex p-1 bg-stone-100/80 rounded-xl mb-2 relative">
            <div
              className="absolute top-1 bottom-1 bg-slate-900 rounded-lg shadow-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-0"
              style={{
                left: tabPositions[activeTab],
                width: 'calc(33.333% - 3px)',
              }}
            />

            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all relative z-10
                ${activeTab === 'search' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Search size={15} />
              <span className="hidden sm:inline">Wyszukiwarka</span>
              <span className="sm:hidden">Szukaj</span>
            </button>

            <button
              onClick={() => setActiveTab('calculator')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all relative z-10
                ${activeTab === 'calculator' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Calculator size={15} />
              <span className="hidden sm:inline">Kalkulator</span>
              <span className="sm:hidden">Koszt</span>
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all relative z-10
                ${activeTab === 'assistant' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Sparkles size={15} />
              <span className="hidden sm:inline">Doradca</span>
              <span className="sm:hidden">Doradca</span>
            </button>
          </div>

          {/* CONTENT AREA */}
          <div className="relative overflow-visible">

            {/* SEARCH VIEW */}
            <div className={`p-4 md:p-6 transition-all duration-300 ease-out flex flex-col justify-center w-full
              ${activeTab === 'search'
                ? 'opacity-100 translate-y-0 pointer-events-auto relative'
                : 'opacity-0 -translate-y-4 pointer-events-none absolute inset-0'}`}
            >
               <div className="space-y-4 md:space-y-5">
                  {/* Facility Type Selection */}
                  <div className="flex justify-center gap-2 flex-wrap">
                     <TypeChip active={selectedType === 'Wszystkie'} label="Wszystkie" onClick={() => setSelectedType('Wszystkie')} />
                     <TypeChip active={selectedType === 'DPS'} label="DPS" sub="Całodobowe" onClick={() => setSelectedType('DPS')} />
                     <TypeChip active={selectedType === 'ŚDS'} label="ŚDS" sub="Dzienne" onClick={() => setSelectedType('ŚDS')} />
                  </div>

                  {/* Form Row */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                       <div className="md:col-span-8 relative group">
                          <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${validationState === 'invalid' ? 'text-amber-500' : 'text-slate-300 group-focus-within:text-primary-500'}`}>
                             <MapPin size={22} />
                          </div>
                          <input
                             ref={inputRef}
                             type="text"
                             value={cityInput}
                             onChange={(e) => setCityInput(e.target.value)}
                             onKeyDown={handleKeyDown}
                             placeholder="Miejscowość lub powiat..."
                             enterKeyHint="search"
                             autoComplete="off"
                             spellCheck="false"
                             className={`w-full bg-stone-50 border-2 py-5 pl-14 pr-6 rounded-2xl text-lg font-bold text-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-400 placeholder:font-medium shadow-inner
                               ${validationState === 'invalid' ? 'border-amber-200' : 'border-transparent focus:border-primary-200'}`}
                          />

                          {isLoading && (
                            <div className="absolute right-5 top-1/2 -translate-y-1/2">
                              <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full" />
                            </div>
                          )}

                          <AutocompleteDropdown />
                       </div>

                       <div className="md:col-span-4">
                          <button
                             onClick={handleSearchClick}
                             className={`w-full h-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3
                               ${selectedType === 'DPS' ? 'bg-primary-600 hover:bg-primary-500 shadow-primary-600/20' : selectedType === 'ŚDS' ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'}`}
                          >
                             Szukaj <ArrowRight size={18} />
                          </button>
                       </div>
                    </div>

                    {/* INLINE VALIDATION & QUICK LINKS */}
                    <div className="min-h-[24px] px-2">
                       {validationState === 'invalid' ? (
                         <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5 animate-fade-in">
                            <AlertCircle size={14} /> {cityInput} nie jest w naszej bazie. Teraz obejmujemy Małopolskę.
                         </p>
                       ) : cityInput.length === 0 ? (
                         <div className="flex flex-wrap items-center gap-3 animate-fade-in">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Popularne:</span>
                            {["Kraków", "Tarnów", "Nowy Sącz"].map(city => (
                              <button
                                key={city}
                                onClick={() => setCityInput(city)}
                                className="text-[10px] font-bold text-slate-500 hover:text-primary-600 underline decoration-slate-200 underline-offset-4 hover:decoration-primary-300 transition-all"
                              >
                                {city}
                              </button>
                            ))}
                         </div>
                       ) : validationState === 'valid' && !showDropdown ? (
                         <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5 animate-fade-in">
                            <Check size={14} /> Region Małopolski zweryfikowany
                         </p>
                       ) : null}
                    </div>
                  </div>

                  <div className="text-center pt-2">
                     <button
                       onClick={handleGeolocation}
                       disabled={isGeoLoading}
                       className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-primary-600 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <Navigation size={14} className="text-primary-500 group-hover:animate-bounce" />
                        <span className="underline decoration-dotted underline-offset-4 decoration-2">
                          {isGeoLoading ? 'Wyszukiwanie...' : 'Namierz moją lokalizację'}
                        </span>
                     </button>
                  </div>
               </div>
            </div>

            {/* CALCULATOR VIEW — inline 70/30, bez API */}
            <div className={`p-4 md:p-6 transition-all duration-300 ease-out flex flex-col justify-center w-full
              ${activeTab === 'calculator'
                ? 'opacity-100 translate-y-0 pointer-events-auto relative'
                : activeTab === 'search'
                  ? 'opacity-0 translate-y-4 pointer-events-none absolute inset-0'
                  : 'opacity-0 -translate-y-4 pointer-events-none absolute inset-0'}`}
            >
              <div className="space-y-4 md:space-y-5">

                {/* Dwa inputy: dochód + miasto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                  {/* Dochód */}
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none">
                      <Calculator size={20} />
                    </div>
                    <input
                      type="number"
                      value={calcIncome}
                      onChange={(e) => setCalcIncome(e.target.value)}
                      placeholder="Dochód seniora (zł/mc)"
                      min="0" max="50000" step="100"
                      className="w-full bg-stone-50 border-2 border-transparent focus:border-primary-200 py-5 pl-14 pr-16 rounded-2xl text-lg font-bold text-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-400 placeholder:font-medium shadow-inner"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">PLN</span>
                  </div>

                  {/* Miejscowość */}
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none">
                      <MapPin size={20} />
                    </div>
                    <input
                      type="text"
                      value={calcCity}
                      onChange={(e) => setCalcCity(e.target.value)}
                      placeholder="Miejscowość (opcjonalnie)"
                      className="w-full bg-stone-50 border-2 border-transparent focus:border-primary-200 py-5 pl-14 pr-6 rounded-2xl text-lg font-bold text-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-400 placeholder:font-medium shadow-inner"
                    />
                  </div>
                </div>

                {/* Wynik 70/30 — pojawia się natychmiast gdy wpisano dochód */}
                <div className={`transition-all duration-300 ${showCalcResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none h-0 overflow-hidden'}`}>
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-3">

                    {/* Pasek wizualny */}
                    <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: '70%' }} />
                      <div className="bg-amber-300/70 h-full" style={{ width: '30%' }} />
                    </div>

                    {/* Kwoty */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-0.5 flex items-center justify-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          Wkład seniora (70%)
                        </p>
                        <p className="text-2xl font-serif font-bold text-slate-900">{formatPLN(calcContribution)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">odprowadzane do DPS</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-0.5 flex items-center justify-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-300 inline-block" />
                          Zostaje na rękę (30%)
                        </p>
                        <p className="text-2xl font-serif font-bold text-slate-900">{formatPLN(calcRemaining)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">leki, higiena, telefon</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* CTA — pełna analiza + placówki */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-12">
                    <button
                      onClick={handleCalcGoFull}
                      disabled={!showCalcResult}
                      className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3
                        ${showCalcResult
                          ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-600/20'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                    >
                      <Calculator size={17} />
                      {calcCity
                        ? `Sprawdź DPS w ${calcCity} →`
                        : showCalcResult
                          ? 'Pełna analiza z listą placówek →'
                          : 'Wpisz dochód aby kontynuować'}
                    </button>
                  </div>
                </div>

                {/* Drobna nota */}
                <p className="text-center text-[10px] text-slate-400 font-medium">
                  Symulacja wg ustawy o pomocy społecznej. Ostateczną decyzję wydaje MOPS po wywiadzie środowiskowym.
                </p>

              </div>
            </div>

            {/* ASSISTANT VIEW */}
            <div className={`p-4 md:p-8 transition-all duration-300 ease-out flex flex-col items-center text-center justify-center w-full
              ${activeTab === 'assistant'
                ? 'opacity-100 translate-y-0 pointer-events-auto relative'
                : 'opacity-0 translate-y-4 pointer-events-none absolute inset-0'}`}
            >
                <h3 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 mb-3 tracking-tight">
                  Potrzebujesz przewodnika?
                </h3>

                <p className="text-slate-500 text-base md:text-lg max-w-lg mb-8 leading-relaxed font-medium px-4">
                  Odpowiedz na 4 pytania o stan zdrowia seniora. System podpowie czy lepszy będzie DPS czy ŚDS i przygotuje plan działania.
                </p>

                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => window.location.href = '/asystent?start=true'}
                    className="inline-flex items-center gap-4 bg-primary-600 hover:bg-primary-700 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary-600/20 transition-all active:scale-95 group"
                  >
                    Uruchom Doradcę <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                  </button>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Zajmie to mniej niż 2 minuty</span>
                </div>
            </div>
          </div>
        </div>

        {/* TRUST BAR */}
        <div className="mt-4 md:mt-6 flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
           <TrustItem icon={<ShieldCheck size={18}/>} text="Oficjalne dane BIP" />
           <TrustItem icon={<Building2 size={18}/>} text="36 Placówek Małopolski" />
           <TrustItem icon={<Check size={18}/>} text="Brak opłat i reklam" />
        </div>

      </div>
    </div>
  );
};

const TypeChip = ({ active, label, sub, onClick }: { active: boolean, label: string, sub?: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center min-w-[85px] sm:min-w-[110px]
      ${active
        ? 'bg-white border-primary-500 shadow-md ring-4 ring-primary-50 scale-105'
        : 'bg-stone-50 border-transparent text-slate-400 hover:bg-white hover:border-stone-200'}`}
  >
    <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${active ? 'text-slate-900' : ''}`}>{label}</span>
    {sub && <span className={`hidden sm:block text-[8px] font-bold uppercase tracking-widest mt-0.5 ${active ? 'text-primary-600' : 'opacity-50'}`}>{sub}</span>}
  </button>
);

const TrustItem = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <div className="flex items-center gap-2 group cursor-default">
    <div className="text-primary-600 transition-transform group-hover:scale-110">{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">{text}</span>
  </div>
);

export default Hero;
