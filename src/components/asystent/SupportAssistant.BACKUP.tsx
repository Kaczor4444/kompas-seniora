"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  ArrowLeftIcon,
  HomeIcon,
  BuildingOffice2Icon,
  SparklesIcon,
  MapPinIcon,
  PhoneIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// Types
type FacilityType = 'DPS' | 'ŚDS';
type IndependenceLevel = 'green' | 'yellow' | 'red';
type TimeNeed = 'fulltime' | 'daytime' | 'occasional';

interface Answers {
  independence: IndependenceLevel | null;
  timeNeed: TimeNeed | null;
  medicalNeeds: boolean | null;
  budget: 'low' | 'medium' | 'high' | null;
  location: string;  // NOWE
}

interface Recommendation {
  type: FacilityType;
  confidence: number;
  reason: string;
}

// Helper Components
const StepHeader = ({ stepNumber, title, subtitle }: { stepNumber: number; title: string; subtitle: string }) => (
  <div className="text-center mb-8 md:mb-12">
    <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-primary-100 text-primary-700 rounded-full font-bold text-xl md:text-2xl mb-4 shadow-lg">
      {stepNumber}
    </div>
    <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2">
      {title}
    </h2>
    <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
      {subtitle}
    </p>
  </div>
);

const Tile = ({
  icon,
  label,
  description,
  onClick,
  selected
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  selected: boolean;
}) => (
  <button
    onClick={onClick}
    className={`group relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-105 active:scale-95
      ${selected
        ? 'border-primary-600 bg-primary-50 shadow-xl ring-4 ring-primary-100'
        : 'border-stone-200 bg-white hover:border-primary-300 hover:shadow-lg'
      }`}
  >
    <div className={`mb-4 transition-colors ${selected ? 'text-primary-600' : 'text-slate-400 group-hover:text-primary-500'}`}>
      {icon}
    </div>
    <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">{label}</h3>
    <p className="text-sm md:text-base text-slate-600 leading-relaxed">{description}</p>
    {selected && (
      <div className="absolute top-4 right-4">
        <CheckCircleIcon className="w-6 h-6 text-primary-600" />
      </div>
    )}
  </button>
);

const StatusTile = ({
  icon,
  label,
  color,
  onClick,
  selected
}: {
  icon: React.ReactNode;
  label: string;
  color: 'green' | 'yellow' | 'red';
  onClick: () => void;
  selected: boolean;
}) => {
  const colorClasses = {
    green: selected
      ? 'border-emerald-600 bg-emerald-50 ring-4 ring-emerald-100'
      : 'border-stone-200 bg-white hover:border-emerald-400',
    yellow: selected
      ? 'border-amber-600 bg-amber-50 ring-4 ring-amber-100'
      : 'border-stone-200 bg-white hover:border-amber-400',
    red: selected
      ? 'border-rose-600 bg-rose-50 ring-4 ring-rose-100'
      : 'border-stone-200 bg-white hover:border-rose-400',
  };

  const iconColorClasses = {
    green: selected ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500',
    yellow: selected ? 'text-amber-600' : 'text-slate-400 group-hover:text-amber-500',
    red: selected ? 'text-rose-600' : 'text-slate-400 group-hover:text-rose-500',
  };

  return (
    <button
      onClick={onClick}
      className={`group relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 ${colorClasses[color]}`}
    >
      <div className={`mb-3 transition-colors ${iconColorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-base md:text-lg font-bold text-slate-900">{label}</p>
      {selected && (
        <div className="absolute top-4 right-4">
          <CheckCircleIcon className={`w-6 h-6 ${iconColorClasses[color]}`} />
        </div>
      )}
    </button>
  );
};

const ChecklistItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-slate-700">
    <CheckCircleIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
    <span className="text-base md:text-lg leading-relaxed">{children}</span>
  </li>
);

const QuestionItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 text-slate-700">
    <QuestionMarkCircleIcon className="w-5 h-5 text-secondary-500 flex-shrink-0 mt-0.5" />
    <span className="text-base md:text-lg leading-relaxed">{children}</span>
  </li>
);

// Main Component
export default function SupportAssistant() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    independence: null,
    timeNeed: null,
    medicalNeeds: null,
    budget: null,
    location: '',  // NOWE
  });

  // Real facilities from database
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [facilitiesError, setFacilitiesError] = useState('');

  const totalSteps = 5;

  // Fetch facilities when reaching results step
  const fetchRecommendations = async () => {
    setIsLoadingFacilities(true);
    setFacilitiesError('');

    const recommendation = getRecommendation();

    try {
      console.log('🔄 Fetching recommendations...', {
        recommendation: recommendation.type,
        location: answers.location
      });

      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation: recommendation.type,
          location: answers.location
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();

      console.log('✅ Received facilities:', data);

      setFacilities(data.facilities || []);

      if (data.facilities.length === 0) {
        setFacilitiesError('Nie znaleziono placówek w wybranej lokalizacji');
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
    if (currentStep === 6) {
      fetchRecommendations();
    }
  }, [currentStep]);

  // Recommendation logic (zmieniona - bez ZOL)
  const getRecommendation = (): Recommendation => {
    const { independence, timeNeed, medicalNeeds } = answers;

    // ✅ OPCJA B: independence === 'red' → DPS (nie ZOL)
    if (independence === 'red' || timeNeed === 'fulltime') {
      return {
        type: 'DPS',
        confidence: 95,
        reason: 'Całodobowa opieka w Domu Pomocy Społecznej zapewni stałą opiekę, wyżywienie i wsparcie medyczne 24/7.',
      };
    }

    if (independence === 'green' && timeNeed === 'daytime') {
      return {
        type: 'ŚDS',
        confidence: 90,
        reason: 'Środowiskowy Dom Samopomocy to idealne rozwiązanie - aktywizacja w ciągu dnia, powrót do domu wieczorem.',
      };
    }

    if (independence === 'yellow') {
      if (medicalNeeds) {
        return {
          type: 'DPS',
          confidence: 80,
          reason: 'Dom Pomocy Społecznej zapewni odpowiednią opiekę medyczną i wsparcie w codziennych czynnościach.',
        };
      }
      return {
        type: 'ŚDS',
        confidence: 75,
        reason: 'Środowiskowy Dom Samopomocy pomoże w aktywizacji, zachowując możliwość mieszkania w domu.',
      };
    }

    // Default fallback
    return {
      type: 'ŚDS',
      confidence: 70,
      reason: 'Na podstawie Twoich odpowiedzi, Środowiskowy Dom Samopomocy wydaje się najlepszym rozwiązaniem.',
    };
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(6); // Results screen
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const recommendation = currentStep === 6 ? getRecommendation() : null;

  const canProceed = () => {
    switch (currentStep) {
      case 1: return answers.independence !== null;
      case 2: return answers.timeNeed !== null;
      case 3: return answers.medicalNeeds !== null;
      case 4: return answers.budget !== null;
      case 5: return answers.location.length >= 2;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white py-8 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-xs font-bold uppercase mb-4 border border-primary-200">
            <SparklesIcon className="w-4 h-4" /> Asystent wyboru
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 mb-4">
            Pomożemy Ci wybrać
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Nie wiesz, czy DPS czy ŚDS? Odpowiedz na 5 pytań, a podpowiemy najlepsze rozwiązanie dla Ciebie.
          </p>
        </div>

        {/* Progress Bar */}
        {currentStep <= totalSteps && (
          <div className="mb-8 md:mb-12">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Krok {currentStep} z {totalSteps}</span>
              <span className="text-sm font-medium text-primary-600">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Independence Level */}
        {currentStep === 1 && (
          <div>
            <StepHeader
              stepNumber={1}
              title="Samodzielność seniora"
              subtitle="Oceń obecny poziom samodzielności w codziennych czynnościach"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <StatusTile
                icon={<CheckCircleIcon className="w-12 h-12" />}
                label="Samodzielny - radzi sobie w podstawowych czynnościach"
                color="green"
                selected={answers.independence === 'green'}
                onClick={() => setAnswers({ ...answers, independence: 'green' })}
              />
              <StatusTile
                icon={<QuestionMarkCircleIcon className="w-12 h-12" />}
                label="Częściowo samodzielny - potrzebuje pomocy w niektórych czynnościach"
                color="yellow"
                selected={answers.independence === 'yellow'}
                onClick={() => setAnswers({ ...answers, independence: 'yellow' })}
              />
              <StatusTile
                icon={<XCircleIcon className="w-12 h-12" />}
                label="Niesamodzielny - wymaga stałej pomocy"
                color="red"
                selected={answers.independence === 'red'}
                onClick={() => setAnswers({ ...answers, independence: 'red' })}
              />
            </div>
          </div>
        )}

        {/* Step 2: Time Need */}
        {currentStep === 2 && (
          <div>
            <StepHeader
              stepNumber={2}
              title="Czas opieki"
              subtitle="Jak często senior potrzebuje wsparcia?"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Tile
                icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>}
                label="Całodobowo"
                description="Senior potrzebuje stałej opieki 24/7, również w nocy"
                selected={answers.timeNeed === 'fulltime'}
                onClick={() => setAnswers({ ...answers, timeNeed: 'fulltime' })}
              />
              <Tile
                icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>}
                label="W ciągu dnia"
                description="Opieka i aktywizacja w dzień, powrót do domu wieczorem"
                selected={answers.timeNeed === 'daytime'}
                onClick={() => setAnswers({ ...answers, timeNeed: 'daytime' })}
              />
              <Tile
                icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>}
                label="Okresowo"
                description="Wsparcie kilka razy w tygodniu, możliwość pobytu w domu"
                selected={answers.timeNeed === 'occasional'}
                onClick={() => setAnswers({ ...answers, timeNeed: 'occasional' })}
              />
            </div>
          </div>
        )}

        {/* Step 3: Medical Needs */}
        {currentStep === 3 && (
          <div>
            <StepHeader
              stepNumber={3}
              title="Potrzeby medyczne"
              subtitle="Czy senior wymaga regularnej opieki medycznej lub rehabilitacji?"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Tile
                icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>}
                label="Tak"
                description="Potrzebuje regularnej opieki pielęgniarskiej, podawania leków, rehabilitacji"
                selected={answers.medicalNeeds === true}
                onClick={() => setAnswers({ ...answers, medicalNeeds: true })}
              />
              <Tile
                icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>}
                label="Nie"
                description="Jest w dobrej kondycji zdrowotnej, nie wymaga specjalistycznej opieki medycznej"
                selected={answers.medicalNeeds === false}
                onClick={() => setAnswers({ ...answers, medicalNeeds: false })}
              />
            </div>
          </div>
        )}

        {/* Step 4: Budget */}
        {currentStep === 4 && (
          <div>
            <StepHeader
              stepNumber={4}
              title="Budżet miesięczny"
              subtitle="Jaki miesięczny budżet możesz przeznaczyć na opiekę?"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <Tile
                icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>}
                label="Do 2000 zł"
                description="Szukam najbardziej przystępnych cenowo opcji"
                selected={answers.budget === 'low'}
                onClick={() => setAnswers({ ...answers, budget: 'low' })}
              />
              <Tile
                icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>}
                label="2000 - 4000 zł"
                description="Średni budżet, szukam dobrego balansu ceny i jakości"
                selected={answers.budget === 'medium'}
                onClick={() => setAnswers({ ...answers, budget: 'medium' })}
              />
              <Tile
                icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>}
                label="Powyżej 4000 zł"
                description="Jakość i standard są dla mnie najważniejsze"
                selected={answers.budget === 'high'}
                onClick={() => setAnswers({ ...answers, budget: 'high' })}
              />
            </div>
          </div>
        )}

        {/* Step 5: Location */}
        {currentStep === 5 && (
          <div>
            <StepHeader
              stepNumber={5}
              title="Gdzie szukasz pomocy?"
              subtitle="Wpisz miasto lub powiat, w którym szukasz placówki"
            />
            <div className="space-y-6">
              {/* Search input z ikoną */}
              <div className="flex items-center bg-white border-2 border-stone-200 rounded-2xl p-4 md:p-6 focus-within:border-primary-500 focus-within:ring-4 focus-within:ring-primary-100 transition-all group shadow-lg">
                <MapPinIcon className="w-6 h-6 md:w-7 md:h-7 text-slate-400 mr-4 group-focus-within:text-primary-500 transition-colors flex-shrink-0" />
                <input
                  type="text"
                  value={answers.location}
                  onChange={e => setAnswers({...answers, location: e.target.value})}
                  placeholder="Wpisz miasto lub powiat (np. Kraków, Wieliczka)"
                  className="flex-1 bg-transparent text-base md:text-lg font-bold outline-none placeholder:text-stone-300 placeholder:font-medium"
                  autoFocus
                />
              </div>

              {/* Hint text */}
              <div className="bg-primary-50 rounded-2xl p-6 md:p-8 border border-primary-100">
                <p className="text-sm md:text-base text-slate-700 leading-relaxed">
                  <strong className="text-primary-900">💡 Wskazówka:</strong> Możesz wpisać nazwę miasta (np. "Kraków")
                  lub powiatu (np. "wielicki"). Pokażemy Ci placówki z tej okolicy.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Results */}
        {currentStep === 6 && recommendation && (
          <div>
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
                <CheckCircleIcon className="w-12 h-12 text-primary-600" />
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
                Mamy rekomendację!
              </h2>
              <p className="text-lg md:text-xl text-slate-600">
                Na podstawie Twoich odpowiedzi polecamy:
              </p>
            </div>

            {/* Recommendation Card */}
            <div className="bg-gradient-to-br from-primary-50 to-white border-2 border-primary-200 rounded-2xl p-8 md:p-12 mb-12 shadow-xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center">
                  <BuildingOffice2Icon className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2">
                    {recommendation.type === 'DPS' ? 'Dom Pomocy Społecznej (DPS)' : 'Środowiskowy Dom Samopomocy (ŚDS)'}
                  </h3>
                  <div className="flex items-center gap-2 text-primary-700 font-medium">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-5 h-5 ${i < Math.round(recommendation.confidence / 20) ? 'text-primary-600' : 'text-stone-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm">{recommendation.confidence}% dopasowania</span>
                  </div>
                </div>
              </div>

              <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-8">
                {recommendation.reason}
              </p>

              {/* Charakterystyka */}
              <div className="bg-white rounded-xl p-6 border border-primary-100">
                <h4 className="font-bold text-slate-900 mb-4 text-lg">
                  {recommendation.type === 'DPS' ? 'Charakterystyka DPS:' : 'Charakterystyka ŚDS:'}
                </h4>
                <ul className="space-y-3">
                  {recommendation.type === 'DPS' ? (
                    <>
                      <ChecklistItem>Całodobowa opieka i wyżywienie</ChecklistItem>
                      <ChecklistItem>Stała opieka pielęgniarska i lekarska</ChecklistItem>
                      <ChecklistItem>Aktywizacja i rehabilitacja</ChecklistItem>
                      <ChecklistItem>Pobyt stały lub czasowy</ChecklistItem>
                    </>
                  ) : (
                    <>
                      <ChecklistItem>Opieka dzienna (8:00 - 16:00)</ChecklistItem>
                      <ChecklistItem>Jeden posiłek w ciągu dnia</ChecklistItem>
                      <ChecklistItem>Terapia zajęciowa i aktywizacja społeczna</ChecklistItem>
                      <ChecklistItem>Powrót do domu na wieczór</ChecklistItem>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* ✅ DISCLAIMER o ZOL (gdy independence === 'red') */}
            {answers.independence === 'red' && (
              <div className="bg-secondary-50 border-l-4 border-secondary-600 rounded-xl p-6 mb-12">
                <div className="flex gap-4">
                  <QuestionMarkCircleIcon className="w-6 h-6 text-secondary-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-secondary-900 mb-2">Uwaga o Zakładach Opiekuńczo-Leczniczych (ZOL)</h4>
                    <p className="text-secondary-800 leading-relaxed">
                      W przypadku <strong>ciężkich schorzeń wymagających stałej opieki medycznej</strong> (np. po udarze, w zaawansowanych chorobach neurologicznych),
                      warto skonsultować z lekarzem możliwość skierowania do <strong>Zakładu Opiekuńczo-Leczniczego (ZOL)</strong>.
                      ZOL zapewnia bardziej intensywną opiekę medyczną niż DPS.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recommended Facilities */}
            <div className="mb-12">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-6 flex items-center gap-3">
                <BuildingOffice2Icon className="w-8 h-8 text-primary-500" />
                Placówki w okolicy: {answers.location}
              </h3>

              {/* Loading state */}
              {isLoadingFacilities ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="animate-pulse bg-stone-100 h-32 rounded-2xl" />
                  ))}
                </div>
              ) : facilitiesError ? (
                // Error state
                <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                  <BuildingOffice2Icon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                  <h5 className="text-lg font-bold text-slate-900 mb-2">
                    {facilitiesError}
                  </h5>
                  <p className="text-slate-600 mb-6 text-sm">
                    Spróbuj wpisać inną lokalizację lub poszukaj w całym regionie
                  </p>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-500 transition-all"
                  >
                    Zmień lokalizację
                  </button>
                </div>
              ) : facilities.length === 0 ? (
                // EMPTY STATE - brak placówek w lokalizacji
                <div className="text-center py-16 bg-gradient-to-br from-stone-50 to-stone-100 rounded-3xl border border-stone-200">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6">
                    <MapPinIcon className="w-10 h-10 text-stone-400" />
                  </div>

                  <h5 className="text-2xl font-bold text-slate-900 mb-3">
                    Brak placówek w tej lokalizacji
                  </h5>

                  <p className="text-slate-600 mb-8 max-w-md mx-auto text-base leading-relaxed">
                    Nie znaleźliśmy placówek typu <strong>{recommendation.type}</strong> w okolicy: <strong>{answers.location}</strong>
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {/* Opcja 1: Zmień lokalizację */}
                    <button
                      onClick={() => setCurrentStep(5)}
                      className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:scale-105"
                    >
                      <MapPinIcon className="w-5 h-5" />
                      Zmień lokalizację
                    </button>

                    {/* Opcja 2: Zobacz wszystkie bez filtru lokalizacji */}
                    <Link
                      href={`/search?type=${recommendation.type.toLowerCase()}`}
                      className="inline-flex items-center gap-2 bg-white hover:bg-stone-50 text-slate-900 px-6 py-3 rounded-xl font-bold border-2 border-stone-200 transition-all"
                    >
                      Zobacz wszystkie {recommendation.type}
                      <ChevronRightIcon className="w-5 h-5" />
                    </Link>
                  </div>

                  {/* Helpful tip */}
                  <div className="mt-8 pt-6 border-t border-stone-200 max-w-lg mx-auto">
                    <p className="text-sm text-slate-500 flex items-start gap-3">
                      <span className="text-lg shrink-0">💡</span>
                      <span className="text-left">
                        <strong>Wskazówka:</strong> Spróbuj wpisać nazwę większego miasta
                        lub powiatu (np. "Kraków" zamiast małej miejscowości)
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                // Facilities list
                <div className="space-y-5">
                  {facilities.map(f => (
                    <div
                      key={f.id}
                      onClick={() => router.push(`/placowka/${f.id}`)}
                      className="group flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 p-6 md:p-8 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-white hover:shadow-xl hover:border-primary-200 transition-all cursor-pointer"
                    >
                      {/* Gradient placeholder instead of image */}
                      <div className="w-full md:w-24 h-24 md:h-24 rounded-2xl bg-gradient-to-br from-primary-100 via-primary-50 to-secondary-50 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                        <BuildingOffice2Icon className="w-12 h-12 text-primary-600" />
                      </div>

                      <div className="flex-1 w-full">
                        <h5 className="text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors mb-2">
                          {f.nazwa}
                        </h5>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-2 font-medium">
                            <MapPinIcon className="w-4 h-4 text-primary-500"/>
                            {f.miejscowosc}, {f.powiat}
                          </span>
                          {f.koszt_pobytu && (
                            <span className="flex items-center gap-2 font-bold text-primary-700">
                              💰 {f.koszt_pobytu.toLocaleString('pl-PL')} zł/mies.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="hidden md:flex w-12 h-12 rounded-full bg-white border border-stone-100 items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all shadow-sm">
                        <ChevronRightIcon className="w-6 h-6" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* "Zobacz więcej" link - TYLKO gdy więcej niż 3 placówki */}
              {!isLoadingFacilities && facilities.length > 3 && (
                <div className="text-center mt-10 pt-8 border-t border-stone-100">
                  <Link
                    href={`/search?type=${recommendation.type.toLowerCase()}&q=${answers.location}`}
                    className="inline-flex items-center gap-3 text-lg font-bold text-primary-600 hover:text-primary-700 transition-colors group"
                  >
                    <span>Zobacz wszystkie placówki {recommendation.type} w okolicy: {answers.location}</span>
                    <ChevronRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <p className="text-sm text-slate-500 mt-3 max-w-xl mx-auto leading-relaxed">
                    Użyj wyszukiwarki aby porównać więcej placówek, sprawdzić szczegóły
                    i zastosować dodatkowe filtry (koszt, profil opieki, wolne miejsca)
                  </p>
                </div>
              )}
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-2xl border border-stone-200 p-8 md:p-10 shadow-lg">
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-6">
                Co dalej? Następne kroki
              </h3>
              <ul className="space-y-4 mb-8">
                <QuestionItem>
                  <strong>Wyszukaj placówki w Twojej okolicy</strong> - użyj naszej wyszukiwarki z filtrami
                </QuestionItem>
                <QuestionItem>
                  <strong>Porównaj ceny i warunki</strong> - sprawdź koszty miesięczne i dostępne miejsca
                </QuestionItem>
                <QuestionItem>
                  <strong>Odwiedź wybrane placówki</strong> - umów się na wizytę i zobacz warunki na miejscu
                </QuestionItem>
                <QuestionItem>
                  <strong>Skontaktuj się z dyrektorem</strong> - zapytaj o dostępność miejsc i dokumenty
                </QuestionItem>
              </ul>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push(`/search?type=${recommendation.type.toLowerCase()}`)}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Szukaj placówek {recommendation.type}
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 bg-white hover:bg-stone-50 text-slate-700 border-2 border-stone-300 px-8 py-4 rounded-xl font-bold text-lg hover:border-primary-400 transition-all flex items-center justify-center gap-2"
                >
                  <HomeIcon className="w-6 h-6" />
                  Wróć do strony głównej
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep <= totalSteps && (
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-stone-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Wstecz
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-primary-600 hover:bg-primary-700 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {currentStep === totalSteps ? 'Zobacz rekomendację' : 'Dalej'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
