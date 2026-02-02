'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronRight, ArrowLeft, Heart, Sun, Moon,
  MapPin, ClipboardList, CheckCircle2,
  Download, Sparkles, Building2, Info,
  User, UserCheck, RotateCcw, MessageSquare,
  Check, AlertCircle, Search, ArrowUpRight,
  Share2, ShieldCheck, Clock, Brain, 
  Accessibility, Activity, Edit3, ChevronDown
} from 'lucide-react';

interface SupportAssistantProps {
  onFacilityClick?: (id: number) => void;
  onSearchRedirect?: (type: 'DPS' | 'ŚDS' | 'Wszystkie', location: string) => void;
  prefilledLocation?: string;
}

type Step = 'start' | 'who' | 'independence' | 'mode' | 'location' | 'analyzing' | 'results';

const LOADING_MESSAGES = [
  "Przeszukujemy bazę placówek...",
  "Weryfikujemy ceny i ostatnie aktualizacje...",
  "Dobieramy profil medyczny do Twoich potrzeb...",
  "Sprawdzamy dostępność w Twojej okolicy...",
  "Generujemy spersonalizowany plan działania..."
];

const DIAGNOSIS_OPTIONS = [
  { id: 'demencja', label: 'Demencja / Alzheimer', icon: <Brain size={18} /> },
  { id: 'ruchowa', label: 'Niepełnosprawność ruchowa', icon: <Accessibility size={18} /> },
  { id: 'psychiatryczne', label: 'Schorzenia psychiatryczne', icon: <Activity size={18} /> },
  { id: 'inne', label: 'Inne schorzenia przewlekłe', icon: <Info size={18} /> }
];

export const SupportAssistant: React.FC<SupportAssistantProps> = ({ onFacilityClick, onSearchRedirect, prefilledLocation }) => {
  const [currentStep, setCurrentStep] = useState<Step>('start');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [isQuestionsExpanded, setIsQuestionsExpanded] = useState(false);
  
  const [answers, setAnswers] = useState({
    who: '',
    independence: '' as 'green' | 'yellow' | 'red' | 'diagnosis' | '',
    diagnosis: '',
    mode: '' as 'day' | 'full' | 'unknown' | '',
    location: ''
  });

  const [checklist, setChecklist] = useState<string[]>([]);
  
  // API-based validation state
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');

  useEffect(() => {
    if (prefilledLocation) {
      setAnswers(prev => ({ ...prev, location: prefilledLocation }));
      if (currentStep === 'start') setCurrentStep('who');
    }
  }, [prefilledLocation]);

  useEffect(() => {
    const savedChecklist = localStorage.getItem('kompas_assistant_checklist');
    if (savedChecklist) {
      try {
        setChecklist(JSON.parse(savedChecklist));
      } catch (e) {
        console.error('Error loading checklist', e);
      }
    }
  }, []);

  // API-based location validation
  useEffect(() => {
    if (answers.location.length < 2) {
      setValidationState('idle');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/teryt/suggest?q=${answers.location}`);
        const data = await res.json();
        setValidationState(data.suggestions?.length > 0 ? 'valid' : 'invalid');
      } catch (error) {
        console.error('Validation error:', error);
        setValidationState('idle');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [answers.location]);

  const toggleChecklist = (item: string) => {
    const newChecklist = checklist.includes(item) 
      ? checklist.filter(i => i !== item) 
      : [...checklist, item];
    setChecklist(newChecklist);
    try {
      localStorage.setItem('kompas_assistant_checklist', JSON.stringify(newChecklist));
    } catch (e) {
      console.error('Cannot save checklist to localStorage', e);
    }
  };

  const handleNext = (step: Step) => {
    if (step === 'results') {
      setCurrentStep('analyzing');
      const interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 600);

      setTimeout(() => {
        clearInterval(interval);
        setCurrentStep('results');
      }, 2400);
    } else {
      setCurrentStep(step);
    }
  };

  const resetAssistant = () => {
    setAnswers({
      who: '',
      independence: '',
      diagnosis: '',
      mode: '',
      location: ''
    });
    setCurrentStep('who');
  };

  const getProperForm = (who: string) => {
    const forms: Record<string, string> = {
      'babcia': 'Twoja Babcia',
      'dziadek': 'Twój Dziadek',
      'mama': 'Twoja Mama',
      'tata': 'Twój Tata',
      'bliska osoba': 'Twoja bliska osoba'
    };
    return forms[who] || 'Twoja bliska osoba';
  };

  const getProperFormSummary = (who: string) => {
    const forms: Record<string, string> = {
      'babcia': 'Babcia',
      'dziadek': 'Dziadek',
      'mama': 'Mama',
      'tata': 'Tata',
      'bliska osoba': 'Bliska osoba'
    };
    return forms[who] || 'Bliska osoba';
  };

  const recommendation = useMemo(() => {
    if (answers.diagnosis === 'psychiatryczne' || answers.diagnosis === 'demencja') return 'DPS';
    if (answers.mode === 'day' || (answers.independence === 'green' && answers.mode !== 'full')) return 'ŚDS';
    return 'DPS';
  }, [answers]);

  const handleDownloadPlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      window.print();
    }, 1000);
  };

  const handleShare = async () => {
    const shareTitle = "Kompas Seniora - Plan Wsparcia";
    const shareText = `Cześć, wygenerowałem plan wsparcia dla osoby bliskiej (${getProperFormSummary(answers.who)}) na kompaseniora.pl. Rekomendacja dla ${answers.location || 'naszego regionu'}: ${recommendation === 'DPS' ? 'Pobyt całodobowy (DPS)' : 'Wsparcie dzienne (ŚDS)'}.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} Więcej: ${shareUrl}`);
        setIsSharing(true);
        setTimeout(() => setIsSharing(false), 3000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
    }
  };

  const isSkipPath = answers.diagnosis === 'demencja' || answers.diagnosis === 'psychiatryczne';
  const totalSteps = isSkipPath ? 3 : 4;
  const currentStepNum = useMemo(() => {
    if (currentStep === 'who') return 1;
    if (currentStep === 'independence') return 2;
    if (currentStep === 'mode') return 3;
    if (currentStep === 'location') return isSkipPath ? 3 : 4;
    return 0;
  }, [currentStep, isSkipPath]);

  const SelectionPills = () => {
    if (currentStep === 'start' || currentStep === 'who' || currentStep === 'analyzing' || currentStep === 'results') return null;

    const pills: { label: string; icon: React.ReactNode }[] = [];
    if (answers.who) pills.push({ label: getProperFormSummary(answers.who), icon: <User size={10} /> });
    
    if (currentStepNum > 2 || currentStep === 'location') {
      let label = '';
      if (answers.independence === 'green') label = 'Samodzielna';
      else if (answers.independence === 'yellow') label = 'Pomoc częściowa';
      else if (answers.independence === 'red') label = 'Stała opieka';
      else if (answers.independence === 'diagnosis') {
        const diag = DIAGNOSIS_OPTIONS.find(d => d.id === answers.diagnosis);
        label = diag ? diag.label : 'Diagnoza';
      }
      if (label) pills.push({ label, icon: <CheckCircle2 size={10} /> });
    }

    if ((currentStep === 'location' && !isSkipPath) && answers.mode) {
      pills.push({ 
        label: answers.mode === 'day' ? 'Tryb dzienny' : (answers.mode === 'full' ? 'Całodobowy' : 'Nie wiem'), 
        icon: answers.mode === 'day' ? <Sun size={10} /> : <Moon size={10} />
      });
    }

    if (pills.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-6 animate-fade-in pointer-events-none">
        {pills.map((pill, idx) => (
          <div 
            key={idx} 
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 border border-stone-200 text-stone-500 rounded-full text-[10px] font-bold"
          >
            <span className="opacity-70">{pill.icon}</span>
            {pill.label}
          </div>
        ))}
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'start':
        return (
          <div className="text-center py-20 px-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-black uppercase tracking-widest mb-10 border border-primary-100">
               <Sparkles size={14} className="text-primary-500" /> Inteligentny Asystent Wyboru
            </div>
            <h2 className="text-4xl md:text-7xl font-serif font-bold text-slate-900 mb-8 leading-tight tracking-tight">
              Dopasuj pomoc <br/> do potrzeb bliskiej osoby.
            </h2>
            <p className="text-slate-500 text-xl max-w-2xl mx-auto mb-14 leading-relaxed">
              Odpowiedz na kilka prostych pytań, a we współpracy z systemem wygenerujemy dla Ciebie plan działania.
            </p>
            <button
              onClick={() => handleNext('who')}
              className="w-full sm:w-auto bg-primary-600 text-white px-14 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-700 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 group"
            >
              Rozpocznij analizę <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        );

      case 'who':
        return (
          <div className="animate-fade-in-up max-w-2xl mx-auto">
             <StepHeader title="Dla kogo szukasz pomocy?" current={currentStepNum} total={totalSteps} onBack={() => handleNext('start')} />
             <SelectionPills />
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-4">
                {[
                  { value: 'babcia', label: 'Babci', icon: <User size={28}/> },
                  { value: 'dziadek', label: 'Dziadka', icon: <UserCheck size={28}/> },
                  { value: 'mama', label: 'Mamy', icon: <User size={28}/> },
                  { value: 'tata', label: 'Taty', icon: <UserCheck size={28}/> },
                  { value: 'bliska osoba', label: 'Innej osoby', icon: <User size={28}/> }
                ].map(option => (
                   <Tile
                     key={option.value}
                     label={option.label}
                     active={answers.who === option.value}
                     onClick={() => {setAnswers({...answers, who: option.value}); handleNext('independence');}}
                     icon={option.icon}
                   />
                ))}
             </div>
          </div>
        );

      case 'independence':
        return (
          <div className="animate-fade-in-up max-w-3xl mx-auto">
             <StepHeader title={`Jak radzi sobie ${getProperForm(answers.who)}?`} current={currentStepNum} total={totalSteps} onBack={() => handleNext('who')} />
             <SelectionPills />
             <div className="space-y-4 mt-4">
                <StatusTile color="green" title="W pełni samodzielna" desc="Potrzebuje głównie towarzystwa, posiłków i ciekawych zajęć w ciągu dnia." active={answers.independence === 'green'} onClick={() => {setAnswers({...answers, independence: 'green', diagnosis: '', mode: ''}); handleNext('mode');}} />
                <StatusTile color="yellow" title="Wymaga częściowej pomocy" desc="Pomoc przy higienie, lekach, ubieraniu się lub trudniejszych czynnościach." active={answers.independence === 'yellow'} onClick={() => {setAnswers({...answers, independence: 'yellow', diagnosis: '', mode: ''}); handleNext('mode');}} />
                <StatusTile color="red" title="Wymaga stałej opieki 24/7" desc="Osoba leżąca, wymagająca stałego nadzoru pielęgniarskiego lub lekarskiego." active={answers.independence === 'red'} onClick={() => {setAnswers({...answers, independence: 'red', diagnosis: '', mode: ''}); handleNext('mode');}} />
                
                <div className="space-y-3">
                  <StatusTile 
                    color="dark-green" 
                    title="Ma konkretną diagnozę" 
                    desc="Wybierz specjalizację, abyśmy mogli lepiej dopasować profil placówki." 
                    active={answers.independence === 'diagnosis'} 
                    hideCheck={true}
                    onClick={() => {
                      setAnswers({...answers, independence: 'diagnosis'});
                    }} 
                  />
                  
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${answers.independence === 'diagnosis' ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <div className="bg-white rounded-2xl border-2 border-stone-100 p-6 shadow-lg shadow-primary-900/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {DIAGNOSIS_OPTIONS.map(opt => (
                         <button
                           key={opt.id}
                           onClick={() => {
                             const isSkipEligible = opt.id === 'demencja' || opt.id === 'psychiatryczne';
                             setAnswers({
                               ...answers, 
                               diagnosis: opt.id,
                               mode: isSkipEligible ? 'full' : ''
                             });
                             handleNext(isSkipEligible ? 'location' : 'mode');
                           }}
                           className="flex items-center gap-3 p-4 rounded-xl border border-stone-100 bg-stone-50 hover:bg-primary-700 hover:text-white hover:border-primary-700 transition-all text-left group"
                         >
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary-700 shadow-sm group-hover:bg-primary-500 group-hover:text-white transition-colors">
                              {opt.icon}
                            </div>
                            <span className="text-sm font-bold">{opt.label}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                </div>
             </div>
          </div>
        );

      case 'mode':
        return (
          <div className="animate-fade-in-up max-w-2xl mx-auto">
             <StepHeader title="Jaki tryb opieki rozważasz?" current={currentStepNum} total={totalSteps} onBack={() => handleNext('independence')} />
             <SelectionPills />
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                <Tile label="Tryb dzienny" sub="Zajęcia rano, powrót na noc" icon={<Sun size={32} className="text-amber-500" />} active={answers.mode === 'day'} onClick={() => {setAnswers({...answers, mode: 'day'}); handleNext('location');}} />
                <Tile label="Całodobowy" sub="Zamieszkanie na stałe" icon={<Moon size={32} className="text-blue-500" />} active={answers.mode === 'full'} onClick={() => {setAnswers({...answers, mode: 'full'}); handleNext('location');}} />
                <Tile label="Nie wiem" sub="Dobierzemy po analizie" icon={<AlertCircle size={32} className="text-slate-400" />} active={answers.mode === 'unknown'} onClick={() => {setAnswers({...answers, mode: 'unknown'}); handleNext('location');}} />
             </div>
          </div>
        );

      case 'location':
        return (
          <div className="animate-fade-in-up max-w-2xl mx-auto">
             <StepHeader title="Gdzie szukasz pomocy?" current={currentStepNum} total={totalSteps} onBack={() => handleNext(isSkipPath ? 'independence' : 'mode')} />
             <SelectionPills />
             
             <div className="mt-4 space-y-6">
                {isSkipPath && (
                  <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold border border-primary-200 animate-fade-in">
                    <Check size={14} /> Tryb: Całodobowy (zalecany przy tej diagnozie)
                  </div>
                )}

                <div className="space-y-3">
                  <div className={`flex items-center bg-white border-2 rounded-2xl p-2 transition-all group shadow-sm ${validationState === 'invalid' ? 'border-amber-200 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-50' : 'border-stone-200 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-50'}`}>
                     <div className={`px-5 transition-colors ${validationState === 'invalid' ? 'text-amber-500' : 'text-slate-300 group-focus-within:text-primary-500'}`}>
                        <MapPin size={24} />
                     </div>
                     <input 
                        type="text" 
                        value={answers.location} 
                        onChange={e => setAnswers({...answers, location: e.target.value})} 
                        placeholder="Wpisz miasto lub powiat..." 
                        autoComplete="off"
                        spellCheck="false"
                        className="flex-1 py-5 pr-8 bg-transparent text-lg font-bold outline-none placeholder:text-stone-300 placeholder:font-medium" 
                     />
                  </div>
                  
                  <div className="min-h-[24px] px-2">
                     {validationState === 'invalid' ? (
                       <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5 animate-fade-in">
                          <AlertCircle size={14} /> Obsługujemy tylko region Małopolski.
                       </p>
                     ) : answers.location.length >= 3 && validationState === 'valid' ? (
                       <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5 animate-fade-in">
                          <Check size={14} /> Lokalizacja dostępna w bazie.
                       </p>
                     ) : answers.location.length === 0 ? (
                        <div className="flex flex-wrap items-center gap-3 animate-fade-in">
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Wybierz:</span>
                           {["Kraków", "Tarnów", "Nowy Sącz"].map(city => (
                             <button 
                               key={city}
                               onClick={() => setAnswers({...answers, location: city})}
                               className="text-[10px] font-bold text-slate-500 hover:text-primary-600 underline decoration-slate-200 underline-offset-4 hover:decoration-primary-300 transition-all"
                             >
                               {city}
                             </button>
                           ))}
                        </div>
                     ) : null}
                  </div>
                </div>

                <button 
                   onClick={() => handleNext('results')} 
                   disabled={validationState === 'invalid' || answers.location.length < 3}
                   className={`w-full py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 group
                     ${(validationState === 'invalid' || answers.location.length < 3) 
                       ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none' 
                       : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                >
                  Generuj plan wsparcia <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </div>
        );

      case 'analyzing':
        return (
          <div className="text-center py-40 animate-fade-in overflow-hidden relative">
             <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <div className="w-[500px] h-[500px] border border-primary-500 rounded-full animate-ping" />
             </div>
             <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 bg-primary-500/20 rounded-2xl animate-ping" />
                <div className="relative w-20 h-20 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner">
                   <Search size={32} className="animate-pulse" />
                </div>
             </div>
             <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">{LOADING_MESSAGES[loadingMsgIndex]}</h3>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Weryfikujemy dane w: {answers.location || 'całej Małopolsce'}</p>
          </div>
        );

      case 'results':
        return (
          <div className="animate-fade-in-up pb-12">
             <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-stone-200 overflow-hidden shadow-2xl">
                
                <div className="bg-slate-50 border-b border-stone-100 px-6 md:px-10 py-4 md:py-5 flex flex-wrap gap-3 md:gap-4 items-center">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Podsumowanie wyboru:</span>
                   <SummaryPill label="Osoba" value={getProperFormSummary(answers.who)} />
                   {answers.diagnosis && <SummaryPill label="Diagnoza" value={DIAGNOSIS_OPTIONS.find(o => o.id === answers.diagnosis)?.label || ''} />}
                   <SummaryPill label="Tryb" value={answers.mode === 'day' ? 'Dzienny' : (answers.mode === 'full' ? 'Całodobowy' : 'Nieustalony')} />
                   <SummaryPill label="Region" value={answers.location || 'Małopolska'} />
                </div>

                {/* Sekcja Rekomendacji - Adaptive Hero */}
                <div className="bg-slate-900 p-6 md:p-16 lg:p-24 text-white relative text-center md:text-left overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-primary-500/10 rounded-full blur-[80px] md:blur-[120px] -mr-20 md:-mr-40 -mt-20 md:-mt-40" />
                   <div className="relative z-10 max-w-4xl">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/20 text-primary-400 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-4 md:mb-8 border border-primary-500/20">
                         <Sparkles size={14} /> Rekomendacja Systemu
                      </div>
                      <h3 className="text-3xl md:text-6xl lg:text-7xl font-serif font-bold mb-4 md:mb-8 leading-tight tracking-tight">
                         Najlepszy będzie <br className="hidden md:block" /> 
                         <span className="text-primary-400 italic">
                           {recommendation === 'ŚDS' ? 'Dom Dzienny (ŚDS)' : 'Pobyt całodobowy (DPS)'}
                         </span>
                      </h3>
                      <p className="text-slate-400 text-base md:text-xl leading-relaxed opacity-90 max-w-2xl">
                         {recommendation === 'ŚDS' && "To rozwiązanie wspierające aktywność seniora w ciągu dnia, które pozwala na powrót do własnego domu na noc."}
                         {recommendation === 'DPS' && "Zapewnia profesjonalną, całodobową opiekę medyczną oraz pełne bezpieczeństwo w sytuacjach wymagających stałego nadzoru."}
                      </p>
                   </div>
                </div>

                <div className="p-6 md:p-16 lg:p-24 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16">
                   <div className="lg:col-span-7 space-y-10 md:space-y-16">
                      
                      <div className="bg-stone-50/50 p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-stone-100">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-6 md:mb-10 flex items-center gap-3">
                            <Building2 size={20} className="text-primary-500" />
                            Placówki w pobliżu: {answers.location}
                         </h4>
                         <div className="space-y-4 md:space-y-6">
                            <div 
                              onClick={() => onSearchRedirect?.(recommendation as any, answers.location)}
                              className="p-6 md:p-8 rounded-2xl border border-stone-200 bg-white flex items-center justify-between group cursor-pointer hover:border-primary-500 transition-all shadow-sm"
                            >
                               <div className="flex items-center gap-4 md:gap-6">
                                  <div className="w-12 md:w-16 h-12 md:h-16 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                                     <Building2 size={24} />
                                  </div>
                                  <div>
                                     <h5 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors text-sm md:text-base">Wstępne wyniki dla Twojej lokalizacji</h5>
                                     <span className="text-[10px] md:text-xs text-slate-500 font-medium">Zasięg: powiat {answers.location || 'region'}</span>
                                  </div>
                               </div>
                               <ChevronRight size={20} className="text-slate-300 group-hover:text-primary-500 transition-all shrink-0" />
                            </div>
                            <button 
                              onClick={() => onSearchRedirect?.(recommendation as any, answers.location)}
                              className="w-full py-4 md:py-5 bg-primary-600 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl flex items-center justify-center gap-3"
                            >
                               Przeglądaj wszystkie ({recommendation}) <ArrowUpRight size={16} />
                            </button>
                         </div>
                      </div>

                      <div>
                         <div className="flex items-center justify-between mb-6 md:mb-10">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-3">
                               <ClipboardList size={20} className="text-primary-500" /> Twój plan działania
                            </h4>
                         </div>
                         <div className="space-y-3 md:space-y-4">
                            <ChecklistItem checked={checklist.includes('1')} onClick={() => toggleChecklist('1')} text="Pobierz wniosek o skierowanie w swoim OPS / MOPS" />
                            <ChecklistItem checked={checklist.includes('2')} onClick={() => toggleChecklist('2')} text="Umów wizytę u lekarza POZ po zaświadczenie" />
                            {answers.diagnosis && <ChecklistItem checked={checklist.includes('diag-doc')} onClick={() => toggleChecklist('diag-doc')} text={`Dokumentacja medyczna: ${DIAGNOSIS_OPTIONS.find(o => o.id === answers.diagnosis)?.label}`} />}
                            <ChecklistItem checked={checklist.includes('3')} onClick={() => toggleChecklist('3')} text="Przygotuj ostatnią decyzję o wysokości emerytury" />
                         </div>
                      </div>
                   </div>

                   <div className="lg:col-span-5 space-y-6 md:space-y-10">
                      {/* Pytania do urzędnika - Collapsed on mobile */}
                      <div className="bg-primary-50 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 border border-primary-100 relative overflow-hidden shadow-sm">
                         <button 
                           onClick={() => setIsQuestionsExpanded(!isQuestionsExpanded)}
                           className="w-full text-left flex items-center justify-between group"
                         >
                            <h4 className="text-xl md:text-2xl font-serif font-bold text-primary-900 flex items-center gap-3">
                               <MessageSquare size={26} className="text-primary-600" /> Pytania do urzędnika
                            </h4>
                            <ChevronDown className={`text-primary-400 transition-transform md:hidden ${isQuestionsExpanded ? 'rotate-180' : ''}`} />
                         </button>
                         
                         <div className={`mt-6 md:mt-8 space-y-6 transition-all duration-300 overflow-hidden ${isQuestionsExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 md:max-h-none opacity-0 md:opacity-100'}`}>
                            <ul className="space-y-6 md:space-y-8">
                               <QuestionItem text="Ile wynosi średni czas oczekiwania na wolne miejsce?" />
                               {answers.diagnosis === 'demencja' && <QuestionItem text="Czy placówka posiada oddział dla osób z Alzheimerem?" />}
                               <QuestionItem text="Czy senior kwalifikuje się do dodatku pielęgnacyjnego?" />
                               <QuestionItem text="Jakie konkretnie badania są wymagane w naszym powiecie?" />
                            </ul>
                         </div>
                      </div>

                      <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                         <h4 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-white">Zapisz plan działania</h4>
                         <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 md:mb-12 opacity-80">Możesz go zapisać jako PDF lub udostępnić rodzinie przez dowolną aplikację.</p>
                         
                         <div className="space-y-3 md:space-y-4">
                            <button onClick={handleDownloadPlan} disabled={isGenerating} className="w-full bg-white text-slate-900 py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 hover:bg-stone-50">
                               {isGenerating ? "Przygotowywanie..." : <><Download size={18} /> Pobierz PDF</>}
                            </button>
                            
                            <button 
                              onClick={handleShare} 
                              className={`w-full py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 border border-white/20
                                ${isSharing ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/5 text-white hover:bg-white/10'}`}
                            >
                               {isSharing ? <><Check size={18} /> Skopiowano link</> : <><Share2 size={18} /> Udostępnij plan</>}
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-stone-50 p-6 md:p-10 border-t border-stone-100 flex items-center justify-center">
                   <button onClick={resetAssistant} className="text-slate-400 hover:text-primary-600 font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 transition-colors group">
                      <RotateCcw size={16} className="group-hover:rotate-[-45deg] transition-transform"/> Rozpocznij analizę od nowa
                   </button>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <section className="py-12 md:py-24 bg-[#FAF9F6] overflow-hidden" id="assistant">
      <div className="max-w-7xl mx-auto px-4">{renderStep()}</div>
    </section>
  );
};

const StepHeader = ({ title, current, total, onBack }: any) => (
  <div className="mb-10">
     <button onClick={onBack} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-600 hover:text-slate-900 font-bold text-sm transition-all mb-8 group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Wróć
     </button>
     <div className="flex justify-between items-end gap-8">
        <h3 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 leading-tight tracking-tight">{title}</h3>
        <div className="text-[10px] font-black text-primary-700 bg-primary-50 px-5 py-2 rounded-xl border border-primary-100 shadow-sm whitespace-nowrap uppercase tracking-widest">KROK {current} / {total}</div>
     </div>
     <div className="w-full h-2 bg-stone-100 rounded-full mt-10 overflow-hidden shadow-inner">
        <div className="h-full bg-primary-500 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(16,185,129,0.3)]" style={{width: `${(current/total)*100}%`}} />
     </div>
  </div>
);

const Tile = ({ label, sub, active, onClick, icon }: any) => (
  <button onClick={onClick} className={`p-8 rounded-3xl border-2 transition-all flex flex-col items-center justify-center text-center gap-5 group ${active ? 'border-primary-500 bg-primary-50 shadow-xl scale-[1.03]' : 'border-stone-100 bg-white hover:border-primary-200 hover:shadow-2xl shadow-sm'}`}>
    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${active ? 'bg-primary-600 text-white rotate-3 shadow-lg' : 'bg-stone-50 text-slate-300 group-hover:bg-primary-50 group-hover:text-primary-600 group-hover:-rotate-2'}`}>{icon}</div>
    <div>
      <span className={`block font-black text-xl tracking-tight ${active ? 'text-primary-900' : 'text-slate-800'}`}>{label}</span>
      {sub && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mt-2 opacity-70 leading-tight">{sub}</span>}
    </div>
  </button>
);

const StatusTile = ({ title, desc, color, active, onClick, hideCheck = false }: any) => {
  const colors: any = {
    green: active ? 'border-primary-500 bg-primary-50 shadow-xl' : 'hover:border-primary-200',
    yellow: active ? 'border-amber-500 bg-amber-50 shadow-xl' : 'hover:border-amber-200',
    red: active ? 'border-red-500 bg-red-50 shadow-xl' : 'hover:border-red-200',
    'dark-green': active ? 'border-primary-800 bg-emerald-50/50 shadow-xl' : 'hover:border-primary-200'
  };
  const iconColors: any = { 
    green: 'bg-primary-500', 
    yellow: 'bg-amber-500', 
    red: 'bg-red-500', 
    'dark-green': 'bg-primary-700' 
  };

  return (
    <button onClick={onClick} className={`w-full p-8 rounded-3xl border-2 transition-all text-left flex items-center gap-8 ${colors[color]} bg-white shadow-sm group`}>
       <div className={`w-7 h-7 rounded-full ${iconColors[color]} shrink-0 shadow-lg ${active ? 'animate-pulse scale-110' : 'opacity-40 group-hover:opacity-100 transition-opacity'}`} />
       <div className="flex-1">
          <span className={`block font-black text-2xl mb-1.5 ${active ? 'text-slate-900' : 'text-slate-800'}`}>{title}</span>
          <span className={`text-sm font-medium leading-relaxed line-clamp-1 md:line-clamp-none ${active ? 'text-slate-600' : 'text-slate-500'}`}>{desc}</span>
       </div>
       {active && !hideCheck ? (
         <div className="bg-primary-600 text-white p-3 rounded-xl shadow-lg"><Check size={24} strokeWidth={4} /></div>
       ) : (
         <div className="text-stone-200 group-hover:text-primary-300 transition-colors"><ChevronRight size={28} /></div>
       )}
    </button>
  );
};

const ChecklistItem = ({ checked, onClick, text }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-6 p-6 rounded-2xl border-2 transition-all text-left group ${checked ? 'bg-primary-50 border-primary-500 shadow-sm' : 'bg-white border-stone-100 hover:border-primary-300'}`}>
    <div className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'border-stone-200 group-hover:border-primary-500'}`}>{checked && <Check size={20} strokeWidth={4} />}</div>
    <span className={`text-lg font-bold ${checked ? 'text-primary-900' : 'text-slate-700'}`}>{text}</span>
  </button>
);

const QuestionItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-4 md:gap-5">
    <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-primary-500 mt-2 md:mt-2.5 shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
    <span className="text-sm md:text-base font-bold text-primary-900/80 leading-relaxed italic">"{text}"</span>
  </li>
);

const SummaryPill = ({ label, value }: { label: string, value: string }) => (
  <div className="flex items-center gap-2 bg-white px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-stone-200 shadow-sm">
    <span className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-tighter">{label}:</span>
    <span className="text-[10px] md:text-xs font-bold text-slate-700">{value}</span>
  </div>
);

export default SupportAssistant;