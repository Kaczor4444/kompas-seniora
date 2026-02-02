'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Sparkles, MapPin, 
  Search, Navigation, AlertCircle,
  Check, ShieldCheck, Building2
} from 'lucide-react';

const Hero = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'assistant'>('search');
  const [cityInput, setCityInput] = useState("");
  const [selectedType, setSelectedType] = useState<'DPS' | 'ŚDS' | 'Wszystkie'>('Wszystkie');
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  
  // API-based validation state
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // API-based location validation
  useEffect(() => {
    if (cityInput.length < 2) {
      setValidationState('idle');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/teryt/suggest?q=${cityInput}`);
        const data = await res.json();
        setValidationState(data.suggestions?.length > 0 ? 'valid' : 'invalid');
      } catch (error) {
        console.error('Validation error:', error);
        setValidationState('idle');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [cityInput]);

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
    if (e.key === "Enter") {
      handleSearchClick();
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("Twoja przeglądarka nie obsługuje geolokalizacji");
      return;
    }

    setIsGeoLoading(true);
    console.log("📍 Requesting geolocation...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("✅ Geolocation success:", { latitude, longitude });
        window.location.href = `/search?lat=${latitude}&lng=${longitude}&near=true`;
      },
      (error) => {
        setIsGeoLoading(false);
        console.error("❌ Geolocation error:", error);

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

  return (
    <div className="bg-white pt-6 pb-12 md:pt-12 md:pb-24 relative overflow-hidden">
      {/* Background Decor - Subtle Grid */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-emerald-50/30 via-white to-white pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* HEADER */}
        <div className="text-center mb-10">
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
            {activeTab === 'search' 
              ? "Przeszukaj bazę publicznych placówek w Małopolsce."
              : "Dobierzemy odpowiedni typ opieki w 2 minuty."}
          </p>
        </div>

        {/* COMMAND CENTER HUB */}
        <div className="bg-white rounded-[2.5rem] p-2.5 md:p-3 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-stone-200">
          
          {/* TAB SWITCHER */}
          <div className="flex p-1 bg-stone-100/80 rounded-[2rem] mb-2 relative overflow-hidden">
            <div 
              className="absolute top-1 bottom-1 bg-slate-900 rounded-[1.8rem] shadow-lg transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-0"
              style={{
                left: activeTab === 'search' ? '4px' : 'calc(50%)',
                width: 'calc(50% - 4px)',
              }}
            />
            
            <button 
              onClick={() => setActiveTab('search')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[1.8rem] text-xs font-black uppercase tracking-widest transition-all relative z-10
                ${activeTab === 'search' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Search size={16} />
              <span className="hidden sm:inline">Szybka wyszukiwarka</span>
              <span className="sm:hidden">Wyszukiwarka</span>
            </button>
            <button 
              onClick={() => setActiveTab('assistant')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[1.8rem] text-xs font-black uppercase tracking-widest transition-all relative z-10
                ${activeTab === 'assistant' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Sparkles size={16} />
              <span className="hidden sm:inline">Inteligentny doradca</span>
              <span className="sm:hidden">Doradca</span>
            </button>
          </div>

          {/* CONTENT AREA */}
          <div className="relative overflow-hidden min-h-auto sm:min-h-[320px]">
            
            {/* SEARCH VIEW */}
            <div className={`p-4 md:p-8 transition-all duration-300 ease-out flex flex-col justify-center w-full
              ${activeTab === 'search' 
                ? 'opacity-100 translate-y-0 pointer-events-auto relative' 
                : 'opacity-0 -translate-y-4 pointer-events-none absolute inset-0'}`}
            >
               <div className="space-y-6 md:space-y-8">
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
                             type="text" 
                             value={cityInput} 
                             onChange={(e) => setCityInput(e.target.value)}
                             onKeyDown={handleKeyDown}
                             placeholder="Miejscowość lub powiat..."
                             enterKeyHint="search"
                             autoComplete="off"
                             spellCheck="false"
                             className={`w-full bg-stone-50 border-2 py-5 pl-14 pr-6 rounded-2xl text-lg font-bold text-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-300 shadow-inner
                               ${validationState === 'invalid' ? 'border-amber-200' : 'border-transparent focus:border-primary-200'}`}
                          />
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
                       ) : validationState === 'valid' ? (
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

            {/* ASSISTANT VIEW */}
            <div className={`p-6 md:p-14 transition-all duration-300 ease-out flex flex-col items-center text-center justify-center w-full
              ${activeTab === 'assistant' 
                ? 'opacity-100 translate-y-0 pointer-events-auto relative' 
                : 'opacity-0 translate-y-4 pointer-events-none absolute inset-0'}`}
            >
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mb-6 border border-primary-100 shadow-sm">
                  <Sparkles size={28} />
                </div>
                
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
        <div className="mt-12 flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
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