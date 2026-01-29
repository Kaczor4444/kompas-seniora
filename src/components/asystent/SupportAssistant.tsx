'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight, ArrowLeft, Heart, Sun, Moon,
  MapPin, ClipboardList, CheckCircle2,
  Download, Sparkles, Building2, Info,
  User, UserCheck, RotateCcw, MessageSquare,
  Check, AlertCircle, Printer, Search, ArrowUpRight,
  ShieldAlert
} from 'lucide-react';

interface SupportAssistantProps {
  // No props needed - używamy Link do nawigacji
}

type Step = 'start' | 'who' | 'independence' | 'mode' | 'location' | 'analyzing' | 'results';

const LOADING_MESSAGES = [
  "Przeszukujemy bazę placówek...",
  "Weryfikujemy ceny i ostatnie aktualizacje...",
  "Dobieramy profil medyczny do Twoich potrzeb...",
  "Sprawdzamy dostępność w Twojej okolicy...",
  "Generujemy spersonalizowany plan działania..."
];

export const SupportAssistant: React.FC<SupportAssistantProps> = () => {
  const [currentStep, setCurrentStep] = useState<Step>('start');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Auto-start from query param
  useEffect(() => {
    // Check if URL has ?start=true
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('start') === 'true') {
        console.log('🚀 Auto-starting wizard from query param');
        setCurrentStep('who'); // Skip intro, go directly to first question
      }
    }
  }, []); // Run only once on mount

  const [answers, setAnswers] = useState({
    who: '',
    independence: '' as 'green' | 'yellow' | 'red' | '',
    mode: '' as 'day' | 'full' | 'unknown' | '',
    location: ''
  });

  const [checklist, setChecklist] = useState<string[]>([]);

  // Load checklist from localStorage on mount
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

  const toggleChecklist = (item: string) => {
    const newChecklist = checklist.includes(item)
      ? checklist.filter(i => i !== item)
      : [...checklist, item];

    setChecklist(newChecklist);
    localStorage.setItem('kompas_assistant_checklist', JSON.stringify(newChecklist));
  };

  const handleNext = (step: Step) => {
    if (step === 'results') {
      setCurrentStep('analyzing');

      // Rotating loading messages
      const interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 600);

      setTimeout(() => {
        clearInterval(interval);
        setCurrentStep('results');
      }, 2400); // 2.4s zamiast 1.8s (4 rotacje po 600ms)
    } else {
      setCurrentStep(step);
    }
  };

  // Helper: poprawna forma gramatyczna
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

  // Helper: forma dla summary (Babcia, Dziadek, nie "Twoja Babcia")
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
    // Uwaga: ZOL nie jest dostępny w bazie - rekomendujemy DPS z disclaimerem
    if (answers.mode === 'day' || (answers.independence === 'green' && answers.mode !== 'full')) return 'ŚDS';
    return 'DPS';
  }, [answers]);

  // Real facilities from API
  const [facilities, setFacilities] = useState<any[]>([]);
  const [totalFacilities, setTotalFacilities] = useState(0);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [facilitiesError, setFacilitiesError] = useState('');

  const displayedFacilities = useMemo(() => facilities.slice(0, 3), [facilities]);
  const hasMoreFacilities = totalFacilities > 3;

  // Fetch facilities from API
  const fetchRecommendations = async () => {
    setIsLoadingFacilities(true);
    setFacilitiesError('');

    try {
      console.log('🔄 Fetching recommendations...', {
        recommendation,
        location: answers.location
      });

      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation: recommendation,
          location: answers.location
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();

      console.log('✅ Received facilities:', data);

      setFacilities(data.facilities || []);
      setTotalFacilities(data.total || data.facilities?.length || 0);

      if (data.facilities.length === 0) {
        setFacilitiesError('Brak placówek w tej lokalizacji');
      }

    } catch (error) {
      console.error('❌ Error fetching facilities:', error);
      setFacilitiesError('Wystąpił błąd podczas pobierania placówek');
      setFacilities([]);
    } finally {
      setIsLoadingFacilities(false);
    }
  };

  // Trigger fetch when entering results step
  useEffect(() => {
    if (currentStep === 'results') {
      fetchRecommendations();
    }
  }, [currentStep, recommendation, answers.location]);

  const handleDownloadPlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      window.print();
    }, 1000);
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
              Nie wiesz, od czego <br/> zacząć? <span className="text-primary-600 font-medium">Pomożemy Ci.</span>
            </h2>
            <p className="text-slate-500 text-xl max-w-2xl mx-auto mb-14 leading-relaxed">
              System opieki senioralnej bywa skomplikowany. Przejdź krótką ścieżkę, a my dobierzemy najlepsze rozwiązanie i damy Ci plan działania.
            </p>
            <button
              onClick={() => handleNext('who')}
              className="w-full sm:w-auto bg-slate-900 text-white px-14 py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 group"
            >
              Rozpocznij analizę <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        );

      case 'who':
        return (
          <div className="animate-fade-in-up max-w-2xl mx-auto">
             <StepHeader title="Dla kogo szukasz pomocy?" current={1} total={4} onBack={() => {
               // Back button wraca do intro (nie do landing page)
               if (typeof window !== 'undefined') {
                 window.history.pushState({}, '', '/asystent'); // Remove query param
               }
               handleNext('start');
             }} />
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-12">
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
             <StepHeader
               title={`Jak radzi sobie ${getProperForm(answers.who)}?`}
               current={2}
               total={4}
               onBack={() => handleNext('who')}
             />
             <div className="space-y-4 mt-12">
                <StatusTile
                   color="green" title="W pełni samodzielna" desc="Potrzebuje głównie towarzystwa, posiłków i ciekawych zajęć w ciągu dnia."
                   active={answers.independence === 'green'}
                   onClick={() => {setAnswers({...answers, independence: 'green'}); handleNext('mode');}}
                />
                <StatusTile
                   color="yellow" title="Wymaga częściowej pomocy" desc="Pomoc przy higienie, lekach, ubieraniu się lub trudniejszych czynnościach."
                   active={answers.independence === 'yellow'}
                   onClick={() => {setAnswers({...answers, independence: 'yellow'}); handleNext('mode');}}
                />
                <StatusTile
                   color="red" title="Wymaga stałej opieki 24/7" desc="Osoba leżąca, wymagająca stałego nadzoru pielęgniarskiego lub lekarskiego."
                   active={answers.independence === 'red'}
                   onClick={() => {setAnswers({...answers, independence: 'red'}); handleNext('mode');}}
                />
             </div>
          </div>
        );

      case 'mode':
        return (
          <div className="animate-fade-in-up max-w-2xl mx-auto">
             <StepHeader title="Jaki tryb opieki rozważasz?" current={3} total={4} onBack={() => handleNext('independence')} />
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                <Tile
                  label="Tryb dzienny" sub="Zajęcia rano, powrót na noc do domu" icon={<Sun size={32} className="text-amber-500" />}
                  active={answers.mode === 'day'} onClick={() => {setAnswers({...answers, mode: 'day'}); handleNext('location');}}
                />
                <Tile
                  label="Tryb całodobowy" sub="Zamieszkanie na stałe w placówce" icon={<Moon size={32} className="text-blue-500" />}
                  active={answers.mode === 'full'} onClick={() => {setAnswers({...answers, mode: 'full'}); handleNext('location');}}
                />
                <Tile
                  label="Nie jestem pewien(na)" sub="Dobierzcie najlepszą opcję na podstawie stanu zdrowia" icon={<AlertCircle size={32} className="text-slate-400" />}
                  active={answers.mode === 'unknown'} onClick={() => {setAnswers({...answers, mode: 'unknown'}); handleNext('location');}}
                />
             </div>
          </div>
        );

      case 'location':
        return (
          <div className="animate-fade-in-up max-w-2xl mx-auto">
             <StepHeader title="Gdzie szukasz pomocy?" current={4} total={4} onBack={() => handleNext('mode')} />
             <div className="mt-12 space-y-8">
                <div className="flex items-center bg-white border-2 border-stone-200 rounded-2xl p-2 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-50 transition-all group shadow-sm">
                   <div className="px-5 text-slate-300 group-focus-within:text-primary-500 transition-colors">
                      <MapPin size={24} />
                   </div>
                   <input
                      type="text" value={answers.location} onChange={e => setAnswers({...answers, location: e.target.value})}
                      placeholder="Wpisz miasto lub powiat..."
                      className="flex-1 py-5 pr-8 bg-transparent text-lg font-bold outline-none placeholder:text-stone-300 placeholder:font-medium"
                   />
                </div>

                {/* Hint gdy pole puste */}
                {(!answers.location || answers.location.trim().length < 2) && (
                  <p className="text-sm text-slate-400 text-center">
                    Wpisz nazwę miasta lub powiatu (np. "Kraków", "wielicki")
                  </p>
                )}

                <button
                  onClick={() => handleNext('results')}
                  disabled={!answers.location || answers.location.trim().length < 2}
                  className={`w-full py-6 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 group
                    ${!answers.location || answers.location.trim().length < 2
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-50'
                      : 'bg-slate-900 text-white hover:bg-primary-600 shadow-xl active:scale-95'
                    }`}
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
                <div className="absolute w-[300px] h-[300px] border border-primary-400 rounded-full animate-pulse" />
             </div>
             <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 bg-primary-500/20 rounded-2xl animate-ping" />
                <div className="relative w-20 h-20 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner">
                   <Search size={32} className="animate-pulse" />
                </div>
             </div>
             <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">{LOADING_MESSAGES[loadingMsgIndex]}</h3>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Weryfikujemy ceny i dostępność w: {answers.location || 'całej Polsce'}</p>
          </div>
        );

      case 'results':
        return (
          <div className="animate-fade-in-up pb-12">
             <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-2xl">

                {/* PODSUMOWANIE WYBORÓW */}
                <div className="bg-slate-50 border-b border-stone-100 px-8 py-4 flex flex-wrap gap-4 items-center">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Twoje parametry:</span>
                   <SummaryPill label="Dla kogo" value={getProperFormSummary(answers.who)} />
                   <SummaryPill label="Tryb" value={answers.mode === 'day' ? 'Dzienny' : 'Całodobowy'} />
                   <SummaryPill label="Gdzie" value={answers.location || 'Dowolna lokalizacja'} />
                </div>

                {/* NAGŁÓWEK REKOMENDACJI */}
                <div className="bg-slate-900 p-8 md:p-20 text-white relative">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] -mr-40 -mt-40" />
                   <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/20 text-primary-400 rounded-lg text-[10px] font-black uppercase tracking-widest mb-10 border border-primary-500/20">
                         <Sparkles size={14} /> Wynik Analizy Systemowej
                      </div>
                      <h3 className="text-4xl md:text-6xl font-serif font-bold mb-8 leading-tight tracking-tight">
                         Proponujemy: <span className="text-primary-400">
                           {recommendation === 'ŚDS' ? 'Wsparcie dzienne (ŚDS)' : 'Pobyt stały (DPS)'}
                         </span>
                      </h3>
                      <p className="text-slate-400 text-lg max-w-3xl leading-relaxed opacity-90">
                         {recommendation === 'ŚDS' && "Idealny wybór, by senior pozostał w domu, ale spędzał czas z rówieśnikami i brał udział w profesjonalnych terapiach."}
                         {recommendation === 'DPS' && "Najlepsze rozwiązanie, gdy opieka domowa staje się zbyt wymagająca. Zapewnia pełne bezpieczeństwo i profesjonalną pomoc 24/7."}
                      </p>

                      {/* Disclaimer o ZOL - gdy ciężki stan zdrowia */}
                      {answers.independence === 'red' && (
                        <div className="mt-8 p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                          <ShieldAlert size={24} className="text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-amber-200 text-sm m-0 leading-relaxed">
                            <strong>Rekomendacja medyczna:</strong> Przy stanie wymagającym stałej opieki medycznej,
                            warto rozważyć także Zakład Opiekuńczo-Leczniczy (ZOL). Skonsultuj to z lekarzem prowadzącym.
                          </p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="p-8 md:p-20 grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24">
                   <div className="lg:col-span-7 space-y-16">

                      {/* PLACÓWKI */}
                      <div>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-8 flex items-center gap-3">
                            <Building2 size={20} className="text-primary-500" />
                            {!isLoadingFacilities && displayedFacilities.length > 0 ? `Polecane placówki (${answers.location || 'w regionie'})` : 'Brak wyników w tej lokalizacji'}
                         </h4>

                         {isLoadingFacilities ? (
                           // Loading state - skeletons
                           <div className="space-y-4">
                             {[1, 2, 3].map(i => (
                               <div key={i} className="animate-pulse bg-stone-100 h-32 rounded-2xl border border-stone-200" />
                             ))}
                           </div>

                         ) : facilitiesError ? (
                           // Error state
                           <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-[2rem] p-12 text-center">
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-stone-300 mx-auto mb-6 shadow-sm">
                                 <MapPin size={32} />
                              </div>
                              <h5 className="text-xl font-bold text-slate-800 mb-2">Nie znaleźliśmy nic w: {answers.location}</h5>
                              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
                                Wygląda na to, że w tej bezpośredniej okolicy nie ma placówek typu {recommendation}. Spróbuj wyszukać w całym województwie lub wpisz większe miasto.
                              </p>
                              <button
                                onClick={() => handleNext('location')}
                                className="bg-white border border-stone-200 px-8 py-3 rounded-xl font-bold text-slate-700 hover:border-primary-400 hover:text-primary-600 transition-all shadow-sm active:scale-95"
                              >
                                Zmień lokalizację
                              </button>
                           </div>

                         ) : displayedFacilities.length > 0 ? (
                           <div className="space-y-4">
                              <div className="grid grid-cols-1 gap-4">
                                {displayedFacilities.map(f => (
                                   <div
                                     key={f.id}
                                     onClick={() => window.location.href = `/placowka/${f.id}`}
                                     className="group flex items-center gap-6 p-6 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-white hover:shadow-xl hover:border-primary-200 transition-all cursor-pointer"
                                   >
                                      {/* Gradient placeholder zamiast zdjęcia (bo nie mamy f.image w bazie) */}
                                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary-100 via-primary-50 to-secondary-50 flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform">
                                        <Building2 size={32} className="text-primary-600" />
                                      </div>

                                      <div className="flex-1">
                                         <h5 className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors mb-1">
                                           {f.nazwa}
                                         </h5>
                                         <div className="flex items-center gap-4 text-xs font-medium">
                                            <span className="text-slate-500 flex items-center gap-1.5">
                                              <MapPin size={14} className="text-primary-500"/>
                                              {f.miejscowosc}, {f.powiat}
                                            </span>
                                            {f.koszt_pobytu && (
                                              <span className="text-primary-700 font-bold flex items-center gap-1">
                                                💰 {f.koszt_pobytu.toLocaleString('pl-PL')} zł/mies.
                                              </span>
                                            )}
                                         </div>
                                      </div>

                                      <div className="w-10 h-10 rounded-full bg-white border border-stone-100 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all shadow-sm">
                                        <ChevronRight size={20} />
                                      </div>
                                   </div>
                                ))}
                              </div>

                              {hasMoreFacilities && (
                                <Link
                                  href={`/search?type=${recommendation.toLowerCase()}&q=${answers.location}`}
                                  className="w-full py-6 mt-4 border-2 border-dashed border-stone-200 rounded-2xl text-slate-400 font-bold text-sm hover:border-primary-400 hover:text-primary-600 transition-all flex items-center justify-center gap-2 group shadow-sm hover:bg-white"
                                >
                                  Zobacz wszystkie placówki {recommendation} w okolicy: {answers.location} ({totalFacilities})
                                  <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </Link>
                              )}
                           </div>
                         ) : null}
                      </div>

                      {/* TWOJA CHECKLISTA */}
                      <div>
                         <div className="flex items-center justify-between mb-8">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-3">
                             <ClipboardList size={20} className="text-primary-500" /> Twoja lista zadań
                           </h4>
                           {checklist.length > 0 && (
                             <button
                               onClick={() => {
                                 setChecklist([]);
                                 localStorage.removeItem('kompas_assistant_checklist');
                               }}
                               className="text-[9px] font-bold text-slate-300 hover:text-red-400 uppercase tracking-widest transition-colors"
                             >
                               Resetuj postęp
                             </button>
                           )}
                         </div>
                         <div className="space-y-3">
                            <ChecklistItem checked={checklist.includes('1')} onClick={() => toggleChecklist('1')} text="Pobierz wniosek o skierowanie w swoim OPS / MOPS" />
                            <ChecklistItem checked={checklist.includes('2')} onClick={() => toggleChecklist('2')} text="Umów wizytę u lekarza POZ w celu wystawienia zaświadczenia" />
                            <ChecklistItem checked={checklist.includes('3')} onClick={() => toggleChecklist('3')} text="Przygotuj ostatnią decyzję o wysokości emerytury lub renty" />
                         </div>
                      </div>
                   </div>

                   {/* PRAWA KOLUMNA: WSPARCIE */}
                   <div className="lg:col-span-5 space-y-10">
                      <div className="bg-primary-50 rounded-3xl p-10 border border-primary-100 relative overflow-hidden shadow-sm">
                         <h4 className="text-xl font-serif font-bold text-primary-900 mb-6 flex items-center gap-3">
                            <MessageSquare size={24} /> O co zapytać w urzędzie?
                         </h4>
                         <ul className="space-y-6">
                            <QuestionItem text="Ile obecnie czeka się na wolne miejsce w tym typie placówki?" />
                            <QuestionItem text="Czy senior kwalifikuje się do dodatku pielęgnacyjnego?" />
                            <QuestionItem text="Jakie załączniki medyczne są wymagane w naszym powiecie?" />
                         </ul>
                      </div>

                      <div className="bg-slate-900 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500 opacity-5 rounded-full -mr-16 -mt-16" />
                         <h4 className="text-xl font-bold mb-3 relative z-10">Pobierz i udostępnij</h4>
                         <p className="text-slate-400 text-sm leading-relaxed mb-10 opacity-80 relative z-10">Miej plan działania zawsze przy sobie. Możesz go wydrukować lub wysłać bliskim.</p>
                         <button
                          onClick={handleDownloadPlan}
                          disabled={isGenerating}
                          className="w-full bg-primary-600 hover:bg-primary-500 text-white py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 relative z-10"
                         >
                            {isGenerating ? "Generowanie..." : <><Download size={18} /> Pobierz plan PDF</>}
                         </button>
                         <div className="flex items-center justify-center gap-3 mt-8 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                            <Printer size={14} /> Gotowe do wydruku
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-stone-50 p-8 border-t border-stone-100 flex items-center justify-center">
                   <button onClick={() => setCurrentStep('start')} className="text-slate-400 hover:text-primary-600 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 transition-colors">
                      <RotateCcw size={16}/> Rozpocznij od nowa
                   </button>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <section className="py-24 bg-[#FAF9F6] overflow-hidden" id="assistant">
      <div className="max-w-7xl mx-auto px-4">
        {renderStep()}
      </div>
    </section>
  );
};

const StepHeader = ({ title, current, total, onBack }: any) => (
  <div className="mb-14">
     <button
       onClick={onBack}
       className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-600 hover:text-slate-900 font-bold text-sm transition-all mb-10 group"
     >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Poprzedni krok
     </button>
     <div className="flex justify-between items-end gap-8">
        <h3 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 leading-tight tracking-tight">{title}</h3>
        <div className="text-[10px] font-black text-primary-600 bg-primary-50 px-4 py-1.5 rounded-lg border border-primary-100 shadow-sm whitespace-nowrap">KROK {current} / {total}</div>
     </div>
     <div className="w-full h-1.5 bg-stone-100 rounded-full mt-10 overflow-hidden shadow-inner">
        <div className="h-full bg-primary-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{width: `${(current/total)*100}%`}} />
     </div>
  </div>
);

const Tile = ({ label, sub, active, onClick, icon }: any) => (
  <button
    onClick={onClick}
    className={`p-8 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-5 group
      ${active ? 'border-primary-500 bg-primary-50 shadow-lg scale-[1.03]' : 'border-stone-100 bg-white hover:border-primary-200 hover:shadow-xl shadow-sm'}
    `}
  >
    <div className={`w-20 h-20 rounded-xl flex items-center justify-center transition-all duration-500 ${active ? 'bg-primary-600 text-white rotate-3 shadow-md' : 'bg-stone-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-primary-500 group-hover:-rotate-2'}`}>
      {icon}
    </div>
    <div>
      <span className={`block font-black text-lg tracking-tight ${active ? 'text-primary-900' : 'text-slate-800'}`}>{label}</span>
      {sub && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] block mt-2 opacity-60 leading-tight">{sub}</span>}
    </div>
  </button>
);

const StatusTile = ({ title, desc, color, active, onClick }: any) => {
  const colors: any = {
    green: active ? 'border-primary-500 bg-primary-50 shadow-lg' : 'hover:border-primary-200',
    yellow: active ? 'border-amber-500 bg-amber-50 shadow-lg' : 'hover:border-amber-200',
    red: active ? 'border-red-500 bg-red-50 shadow-lg' : 'hover:border-red-200'
  };
  const iconColors: any = {
    green: 'bg-primary-500', yellow: 'bg-amber-500', red: 'bg-red-500'
  };

  return (
    <button onClick={onClick} className={`w-full p-8 rounded-2xl border-2 transition-all text-left flex items-center gap-8 ${colors[color]} bg-white shadow-sm group`}>
       <div className={`w-6 h-6 rounded-full ${iconColors[color]} shrink-0 shadow-lg ${active ? 'animate-pulse scale-110' : 'opacity-30 group-hover:opacity-100 transition-opacity'}`} />
       <div className="flex-1">
          <span className={`block font-black text-xl mb-1 ${active ? 'text-slate-900' : 'text-slate-700'}`}>{title}</span>
          <span className="text-slate-400 text-sm font-medium leading-relaxed line-clamp-1 md:line-clamp-none">{desc}</span>
       </div>
       {active ? (
         <div className="bg-primary-600 text-white p-2.5 rounded-lg shadow-md"><Check size={20} strokeWidth={4} /></div>
       ) : (
         <div className="text-stone-200 group-hover:text-primary-300 transition-colors"><ChevronRight size={24} /></div>
       )}
    </button>
  );
};

const ChecklistItem = ({ checked, onClick, text }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-5 p-5 rounded-xl border-2 transition-all text-left group
      ${checked ? 'bg-primary-50 border-primary-500 shadow-sm' : 'bg-white border-stone-100 hover:border-primary-200'}
    `}
  >
    <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all
      ${checked ? 'bg-primary-600 border-primary-600 text-white shadow-sm' : 'border-stone-200 group-hover:border-primary-500'}
    `}>
      {checked && <Check size={18} strokeWidth={4} />}
    </div>
    <span className={`text-base font-bold ${checked ? 'text-primary-900' : 'text-slate-700'}`}>{text}</span>
  </button>
);

const QuestionItem = ({ text }: { text: string }) => (
  <li className="flex items-start gap-4">
    <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
    <span className="text-sm font-bold text-primary-800/80 leading-relaxed italic">"{text}"</span>
  </li>
);

const SummaryPill = ({ label, value }: { label: string, value: string }) => (
  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{label}:</span>
    <span className="text-[11px] font-bold text-slate-700">{value}</span>
  </div>
);

export default SupportAssistant;
