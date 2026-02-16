'use client';

import { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Calculator, AlertCircle, Phone, MapPin, Info, ShieldAlert, Pill, ShoppingBag, CheckCircle2, Wallet, Scale, Building2, Search, Heart, ArrowLeftRight, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { mapPowiatToCity } from '@/lib/powiat-to-city';
import { addFavorite, removeFavorite, isFavorite, getFavorites } from '@/src/utils/favorites';

// Locative case (miejscownik) for Polish city names
const cityLocative: Record<string, string> = {
  'kraków': 'Krakowie',
  'nowy sącz': 'Nowym Sączu',
  'tarnów': 'Tarnowie',
  'bochnia': 'Bochni',
  'brzesko': 'Brzesku',
  'chrzanów': 'Chrzanowie',
  'dąbrowa tarnowska': 'Dąbrowie Tarnowskiej',
  'gorlice': 'Gorlicach',
  'limanowa': 'Limanowej',
  'miechów': 'Miechowie',
  'myślenice': 'Myślenicach',
  'nowy targ': 'Nowym Targu',
  'olkusz': 'Olkuszu',
  'oświęcim': 'Oświęcimiu',
  'proszowice': 'Proszowicach',
  'sucha beskidzka': 'Suchej Beskidzkiej',
  'zakopane': 'Zakopanem',
  'wadowice': 'Wadowicach',
  'wieliczka': 'Wieliczce',
  'bielsko-biała': 'Bielsku-Białej',
};

const toCityLocative = (city: string): string => {
  const key = city.toLowerCase().trim();
  return cityLocative[key] ?? city.charAt(0).toUpperCase() + city.slice(1);
};

// Dopełniacz powiatu: "z powiatu krakowskiego", "olkuskiego" itp.
const powiatGenitiveMap: Record<string, string> = {
  // Małopolskie
  'krakowski':    'krakowskiego',
  'bocheński':    'bocheńskiego',
  'brzeski':      'brzeskiego',
  'chrzanowski':  'chrzanowskiego',
  'dąbrowski':    'dąbrowskiego',
  'gorlicki':     'gorlickiego',
  'limanowski':   'limanowskiego',
  'miechowski':   'miechowskiego',
  'myślenicki':   'myślenickiego',
  'nowosądecki':  'nowosądeckiego',
  'nowotarski':   'nowotarskiego',
  'olkuski':      'olkuskiego',
  'oświęcimski':  'oświęcimskiego',
  'proszowicki':  'proszowickiego',
  'suski':        'suskiego',
  'tarnowski':    'tarnowskiego',
  'tatrzański':   'tatrzańskiego',
  'wadowicki':    'wadowickiego',
  'wielicki':     'wielickiego',
  // Miasta na prawach powiatu
  'm. kraków':    'Krakowa',
  'm. tarnów':    'Tarnowa',
  'm. nowy sącz': 'Nowego Sącza',
  // Śląskie
  'bielski':      'bielskiego',
  'cieszyński':   'cieszyńskiego',
  'pszczyński':   'pszczyńskiego',
  'żywiecki':     'żywieckiego',
  'będziński':    'będzińskiego',
  'bieruńsko-lędziński': 'bieruńsko-lędzińskiego',
  'gliwicki':     'gliwickiego',
  'kłobucki':     'kłobuckiego',
  'lubliniecki':  'lublinieckiego',
  'mikołowski':   'mikołowskiego',
  'myszkowski':   'myszkowskiego',
  'raciborski':   'raciborskiego',
  'rybnicki':     'rybnickiego',
  'tarnogórski':  'tarnogórskiego',
  'wodzisławski': 'wodzisławskiego',
  'zawierciański':'zawierciańskiego',
  'częstochowski':'częstochowskiego',
  // Inne
  'lubelski':     'lubelskiego',
  'łódzki':       'łódzkiego',
  'warszawski':   'warszawskiego',
  'poznański':    'poznańskiego',
  'wrocławski':   'wrocławskiego',
};

const toPowiatGenitive = (powiat: string): string => {
  const key = powiat.toLowerCase().trim();
  if (powiatGenitiveMap[key]) return powiatGenitiveMap[key];
  // Reguła automatyczna: przymiotniki na -ki/-cki/-ski/-ński → zamień końcowe "i" na "iego"
  if (/[kszcń]ki$/.test(key)) {
    return key.slice(0, -1) + 'iego';
  }
  return powiat;
};

// Types
interface Facility {
  id: number;
  nazwa: string;
  typ_placowki: string;
  miejscowosc: string;
  powiat: string;
  koszt_pobytu: number | null;
  telefon?: string;
  profil_opieki?: string;
}

interface CalculationResult {
  income: number;
  maxContribution: number;
  remainingFunds: number;
  contributionPercent: number;
  city: string;
  wojewodztwo: string;
  facilities: Facility[];
  facilitiesWithPrices: Facility[];
  facilitiesWithoutPrices: Facility[];
  affordableFacilities: Facility[];
  needsSubsidy: Facility[];
  hasAffordable: boolean;
  allNeedSubsidy: boolean;
  mopsContact: MopsContact | null;
  mopsFallbackUsed: boolean;
  mopsFallbackCity?: string;
  powiatFallbackUsed: boolean;   // DPS z powiatu, nie z miasta
  powiatFallbackName?: string;   // nazwa powiatu gdy fallback
  ambiguousPowiaty?: string[];          // wiele powiatów dla tej samej nazwy miasta
  mopsPerPowiat?: Record<string, MopsContact | null>; // MOPS dla każdego powiatu przy wieloznaczności
}

interface MopsContact {
  id: number;
  city: string;
  cityDisplay: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  website?: string;
  wojewodztwo: string;
  verified: boolean;
}

function getIncomeBracket(income: number): string {
  if (income <= 1500) return 'do 1500';
  if (income <= 2500) return '1500-2500';
  if (income <= 3500) return '2500-3500';
  if (income <= 5000) return '3500-5000';
  return 'powyżej 5000';
}

async function trackAppEvent(eventType: string, metadata: Record<string, unknown>) {
  try {
    const language = typeof navigator !== 'undefined' ? navigator.language : undefined;
    await fetch('/api/analytics/app-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, metadata, language }),
    });
  } catch { /* silent fail */ }
}

function KalkulatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Track calculator start once per session
  useEffect(() => {
    if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('kalkulator-started')) {
      sessionStorage.setItem('kalkulator-started', '1');
      trackAppEvent('calculator_start', {});
    }
  }, []);

  // Form state — pre-fill z URL params (przekierowanie z hero kalkulatora)
  const [income, setIncome] = useState<string>(() => searchParams.get('income') || '3500');
  const [wojewodztwo, setWojewodztwo] = useState<string>('małopolskie');
  const [city, setCity] = useState<string>(() => searchParams.get('city') || '');
  
  // Result state
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedPowiat, setSelectedPowiat] = useState<string | null>(null);
  const [showAllFacilities, setShowAllFacilities] = useState(false);

  // Favorites & comparison state
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  // Sync savedIds from localStorage on mount and on changes
  useEffect(() => {
    const sync = () => setSavedIds(getFavorites().map(f => f.id));
    sync();
    window.addEventListener('favoritesChanged', sync);
    return () => window.removeEventListener('favoritesChanged', sync);
  }, []);

  // Auto-trigger kalkulacji gdy przekierowano z hero kalkulatora (oba params obecne)
  useEffect(() => {
    const incomeParam = searchParams.get('income');
    const cityParam = searchParams.get('city');
    if (incomeParam && cityParam && parseFloat(incomeParam) > 0) {
      const timer = setTimeout(() => {
        handleCalculate();
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // celowo uruchamiane raz po mount

  const toggleFavorite = (facility: Facility) => {
    if (isFavorite(facility.id)) {
      removeFavorite(facility.id);
    } else {
      addFavorite({
        id: facility.id,
        nazwa: facility.nazwa,
        miejscowosc: facility.miejscowosc,
        powiat: facility.powiat,
        typ_placowki: facility.typ_placowki,
        koszt_pobytu: facility.koszt_pobytu,
        telefon: facility.telefon ?? null,
        ulica: null,
        kod_pocztowy: null,
        email: null,
        www: null,
        liczba_miejsc: null,
        profil_opieki: facility.profil_opieki ?? null,
        addedAt: new Date().toISOString(),
      });
    }
    window.dispatchEvent(new Event('favoritesChanged'));
  };

  const toggleCompare = (id: number) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length >= 3 ? prev : [...prev, id]
    );
  };

  // Legal thresholds (300% kryterium dochodowego)
  const THRESHOLD_SINGLE = 2328;
  const THRESHOLD_FAMILY = 1800;

  // Validation
  const validateInputs = (): string | null => {
    const incomeNum = parseFloat(income);
    
    if (!income || isNaN(incomeNum)) {
      return 'Proszę podać dochód miesięczny';
    }
    
    if (incomeNum <= 0) {
      return 'Dochód musi być większy niż 0 zł';
    }
    
    if (incomeNum > 50000) {
      return 'Proszę podać realistyczny dochód (maksymalnie 50 000 zł)';
    }
    
    if (!city || city.trim().length < 2) {
      return 'Proszę podać nazwę miasta lub gminy';
    }
    
    return null;
  };

  // Fetch MOPS contact from API - ZWRACA dane zamiast tylko setować state
  const fetchMopsContact = async (cityName: string): Promise<MopsContact | null> => {
    try {
      console.log('🔍 Fetching MOPS for city:', cityName);
      console.log('🔍 Normalized city:', cityName.toLowerCase());
      
      const response = await fetch(`/api/mops?city=${encodeURIComponent(cityName.toLowerCase())}`);
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response OK?:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ MOPS data received:', data);
        return data;
      } else {
        console.log('❌ MOPS not found - status:', response.status);
        const errorData = await response.json();
        console.log('❌ Error details:', errorData);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching MOPS:', error);
      return null;
    }
  };

  // ✅ NOWA FUNKCJA - Fetch MOPS z fallbackiem do powiatu
  const fetchMopsWithFallback = async (
    cityName: string, 
    powiatName: string
  ): Promise<{ 
    mops: MopsContact | null; 
    usedFallback: boolean; 
    fallbackCity?: string 
  }> => {
    console.log('🔍 Starting MOPS search with fallback...');
    console.log('   City:', cityName);
    console.log('   Powiat:', powiatName);
    
    // KROK 1: Szukaj MOPS dla dokładnej miejscowości
    let mops = await fetchMopsContact(cityName);
    
    if (mops) {
      console.log('✅ Found MOPS for exact city:', cityName);
      return { mops, usedFallback: false };
    }
    
    // KROK 2: Fallback - mapuj powiat → miasto powiatowe
    console.log('⚠️ No MOPS for city, trying fallback to powiat...');
    const fallbackCity = mapPowiatToCity(powiatName);
    
    if (!fallbackCity) {
      console.log('❌ No mapping found for powiat:', powiatName);
      return { mops: null, usedFallback: false };
    }
    
    console.log('🔄 Mapped powiat to city:', fallbackCity);
    mops = await fetchMopsContact(fallbackCity);
    
    if (mops) {
      console.log('✅ Found MOPS via fallback:', fallbackCity);
      return { mops, usedFallback: true, fallbackCity };
    }
    
    console.log('❌ No MOPS found even with fallback');
    return { mops: null, usedFallback: false };
  };

  // Main calculation function
  const handleCalculate = async () => {
    // Reset previous state
    setError('');
    setResult(null);
    setShowAllFacilities(false);
    setSelectedPowiat(null);
    
    // Validate
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    
    try {
      const incomeNum = parseFloat(income);
      const maxContribution = incomeNum * 0.7;
      const remainingFunds = incomeNum * 0.3;
      
      // Fetch DPS facilities only (typ=DPS ensures TERYT fallback fires when city has no DPS)
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(city)}&woj=${encodeURIComponent(wojewodztwo)}&typ=DPS`
      );

      if (!response.ok) {
        throw new Error('Nie udało się pobrać danych placówek');
      }

      const data = await response.json();
      const dpsFacilities: Facility[] = data.results || [];
      // powiatFallbackUsed: TERYT rozszerzył zapytanie na powiat (brak DPS w mieście)
      const powiatFallbackUsed = !!(data.terytSuggestion?.found && dpsFacilities.length > 0);
      const powiatFallbackName: string | undefined = powiatFallbackUsed
        ? (dpsFacilities[0]?.powiat || undefined)
        : undefined;

      // Wykryj wieloznaczność: ta sama nazwa miasta w kilku powiatach
      const uniquePowiaty = [...new Set(dpsFacilities.map(f => f.powiat))];
      const ambiguousPowiaty = uniquePowiaty.length > 1 ? uniquePowiaty : undefined;

      if (dpsFacilities.length === 0) {
        trackAppEvent('calculator_no_results', { city, wojewodztwo });
        setError(`Nie znaleźliśmy domów pomocy społecznej (DPS) w okolicy "${city}". Spróbuj wpisać inne miasto lub powiat.`);
        setLoading(false);
        return;
      }

      // Separate facilities with and without prices
      const facilitiesWithPrices = dpsFacilities.filter(f => f.koszt_pobytu && f.koszt_pobytu > 0);
      const facilitiesWithoutPrices = dpsFacilities.filter(f => !f.koszt_pobytu || f.koszt_pobytu === 0);

      // Categorize facilities with prices
      const affordableFacilities = facilitiesWithPrices.filter(f => f.koszt_pobytu! <= maxContribution);
      const needsSubsidy = facilitiesWithPrices.filter(f => f.koszt_pobytu! > maxContribution);

      // Fetch MOPS contact z fallbackiem na powiat
      const powiatName = dpsFacilities[0]?.powiat || '';
      const { mops: fetchedMopsContact, usedFallback, fallbackCity } = await fetchMopsWithFallback(
        city,
        powiatName
      );

      // Przy wieloznaczności: pobierz MOPS dla każdego powiatu z osobna
      let mopsPerPowiat: Record<string, MopsContact | null> | undefined;
      if (ambiguousPowiaty) {
        const entries = await Promise.all(
          ambiguousPowiaty.map(async (p) => {
            const { mops } = await fetchMopsWithFallback(city, p);
            return [p, mops] as [string, MopsContact | null];
          })
        );
        mopsPerPowiat = Object.fromEntries(entries);
      }
      
      const calculationResult: CalculationResult = {
        income: incomeNum,
        maxContribution,
        remainingFunds,
        contributionPercent: 70,
        city,
        wojewodztwo,
        facilities: dpsFacilities,
        facilitiesWithPrices,
        facilitiesWithoutPrices,
        affordableFacilities,
        needsSubsidy,
        hasAffordable: affordableFacilities.length > 0,
        allNeedSubsidy: facilitiesWithPrices.length > 0 && affordableFacilities.length === 0,
        mopsContact: fetchedMopsContact,
        mopsFallbackUsed: usedFallback,
        mopsFallbackCity: fallbackCity,
        powiatFallbackUsed,
        powiatFallbackName,
        ambiguousPowiaty,
        mopsPerPowiat,
      };

      setResult(calculationResult);

      trackAppEvent('calculator_result', {
        income_bracket: getIncomeBracket(incomeNum),
        powiat: dpsFacilities[0]?.powiat || city,
        facilities_found: dpsFacilities.length,
        affordable_found: affordableFacilities.length,
        has_affordable: affordableFacilities.length > 0,
      });

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
      
    } catch (err) {
      console.error('Calculation error:', err);
      setError('Wystąpił błąd podczas obliczania. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Navigate to search with budget filter
  const navigateToSearch = () => {
    if (!result) return;
    router.push(`/search?q=${encodeURIComponent(result.city)}&woj=${encodeURIComponent(result.wojewodztwo)}&maxPrice=${Math.round(result.maxContribution)}&type=dps`);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Back link */}
        <Link
          href="/"
          className="group flex items-center gap-2 text-slate-600 hover:text-primary-600 font-bold mb-8 transition-colors px-4 py-2 rounded-xl hover:bg-white/50 w-fit"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center group-hover:border-primary-300 transition-colors shadow-sm">
            <ArrowLeft size={16} />
          </div>
          Wróć do strony głównej
        </Link>

        {/* Header */}
        <div className="text-center mb-8">

          <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-900/10">
            <Calculator size={32} />
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
            Symulator Kosztów DPS
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Sprawdź orientacyjny podział kosztów (zasada 70/30) dla oficjalnych placówek w Twoim regionie.
          </p>
        </div>

        {/* DISCLAIMER — zawsze widoczny, nad formularzem */}
        <div className="mb-6 flex items-start gap-4 bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-4 shadow-sm">
          <ShieldAlert className="text-amber-500 flex-shrink-0 mt-0.5" size={22} />
          <div>
            <p className="text-amber-900 font-black text-sm uppercase tracking-wide mb-0.5">
              To tylko symulacja — nie decyzja urzędowa
            </p>
            <p className="text-amber-800 text-sm leading-relaxed">
              Wynik opiera się na ogólnych przepisach ustawy o pomocy społecznej.{' '}
              <strong>Każdą sprawę MOPS rozpatruje indywidualnie</strong> — bierze pod uwagę dochód, sytuację rodzinną, majątkową i alimentacyjną.
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl shadow-stone-200/50 border border-stone-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

            {/* Income */}
            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
                Dochód miesięczny seniora (netto)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="np. 3500"
                  min="0" max="50000" step="100"
                  className="w-full pl-4 pr-12 py-4 rounded-xl bg-stone-50 border border-stone-200 text-xl font-bold text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-300 outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">PLN</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Info size={12} /> Emerytura, renta + zasiłek pielęgnacyjny.
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">
                Miejscowość
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <MapPin size={20} />
                </div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="np. Kraków, Wieliczka..."
                  className="w-full pl-11 pr-4 py-4 rounded-xl bg-stone-50 border border-stone-200 text-lg font-medium text-slate-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-300 outline-none transition-all"
                />
              </div>
              <div className="mt-2">
                <select
                  value={wojewodztwo}
                  onChange={(e) => setWojewodztwo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-sm text-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="małopolskie">Województwo: Małopolskie</option>
                  <option value="śląskie">Województwo: Śląskie</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-stone-100">
            <button
              onClick={handleCalculate}
              disabled={loading || !income || !city}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                !loading && income && city
                  ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/30'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Obliczam...
                </>
              ) : (
                <>
                  <Calculator size={20} /> Oblicz symulację
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (() => {
          // Widok zależny od wybranego powiatu (gdy wieloznaczność)
          const activeFacilities = selectedPowiat
            ? result.facilities.filter(f => f.powiat === selectedPowiat)
            : result.facilities;
          const activeMops = selectedPowiat && result.mopsPerPowiat
            ? result.mopsPerPowiat[selectedPowiat]
            : result.mopsContact;
          const activeMopsFallbackUsed = selectedPowiat ? false : result.mopsFallbackUsed;
          const activeMopsFallbackCity = selectedPowiat ? undefined : result.mopsFallbackCity;
          return (
          <div id="results-section" className="space-y-8">

            {/* Disclaimer w wynikach — powtórzony, nie do przeoczenia */}
            <div className="bg-amber-100 border-2 border-amber-400 rounded-2xl p-6 shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-amber-900 font-black text-base uppercase tracking-wide mb-2">
                    ⚠ Pamiętaj — to tylko orientacyjna symulacja!
                  </h3>
                  <p className="text-amber-900 text-sm leading-relaxed">
                    Poniższe wyliczenia opierają się na ogólnych przepisach ustawy o pomocy społecznej.
                    <strong> Każda sytuacja jest rozpatrywana indywidualnie przez pracownika socjalnego (MOPS/OPS).</strong>{' '}
                    Urzędnik bierze pod uwagę nie tylko dochód, ale też sytuację rodzinną, majątkową i alimentacyjną.
                    <strong className="block mt-1.5 text-amber-950"> Nie traktuj tego wyniku jako ostatecznego wymiaru opłat.</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Budget cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Senior contribution */}
              <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold text-sm uppercase tracking-wide">
                  <Building2 size={16} /> Wkład seniora (70%)
                </div>
                <div className="text-4xl font-serif font-bold text-emerald-800 mb-2">
                  {formatCurrency(result.maxContribution)}
                </div>
                <p className="text-emerald-700 text-sm leading-relaxed border-t border-emerald-100 pt-2 mt-2">
                  Kwota wynikająca wprost z ustawy (70% dochodu). Jest potrącana automatycznie na rzecz DPS.
                </p>
              </div>

              {/* Pocket money */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-sm uppercase tracking-wide">
                  <Wallet size={16} /> Zostaje &quot;na rękę&quot; (30%)
                </div>
                <div className="text-4xl font-serif font-bold text-slate-800 mb-2">
                  {formatCurrency(result.remainingFunds)}
                </div>
                <div className="text-xs text-slate-500 border-t border-stone-100 pt-2 mt-2">
                  <p className="font-bold mb-2">Budżet na potrzeby własne:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg text-stone-600 border border-stone-100">
                      <Pill size={12} /> Leki
                    </span>
                    <span className="inline-flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg text-stone-600 border border-stone-100">
                      <ShoppingBag size={12} /> Higiena
                    </span>
                    <span className="inline-flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg text-stone-600 border border-stone-100">
                      <Phone size={12} /> Telefon
                    </span>
                  </div>
                  {result.remainingFunds < 300 && (
                    <div className="mt-2 text-amber-600 flex items-start gap-1.5 font-medium bg-amber-50 p-2 rounded-lg border border-amber-100">
                      <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                      Uwaga: ta kwota może nie wystarczyć na leki nierefundowane.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Legal thresholds - dark section */}
            <div className="bg-slate-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Scale size={100} />
              </div>
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2 relative z-10">
                <Info className="text-blue-400" size={20} />
                Ustawowe progi dochodowe (Informacyjnie)
              </h3>
              <p className="text-slate-300 text-sm mb-6 max-w-2xl relative z-10">
                Ustawa o pomocy społecznej określa tzw. &quot;bezpieczniki finansowe&quot;.
                Poniżej tych kwot gmina zazwyczaj <strong>nie powinna</strong> żądać dopłaty od rodziny,
                ale każda sprawa jest badana indywidualnie.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Dla osoby samotnej</div>
                  <div className="text-2xl font-bold text-blue-300">~{THRESHOLD_SINGLE} zł <span className="text-sm font-normal text-white">netto</span></div>
                  <div className="text-xs text-slate-400 mt-1">Ustawowy próg zwolnienia (300% kryterium).</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Dla osoby w rodzinie</div>
                  <div className="text-2xl font-bold text-blue-300">~{THRESHOLD_FAMILY} zł <span className="text-sm font-normal text-white">netto/os.</span></div>
                  <div className="text-xs text-slate-400 mt-1">Ustawowy próg zwolnienia na osobę (300% kryterium).</div>
                </div>
              </div>
              <div className="mt-6 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-xs text-red-200 flex items-start gap-2 relative z-10">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Ważne:</strong> Nawet jeśli Twój dochód jest wyższy, dopłata nie jest automatyczna!
                  Jej wysokość ustala się w drodze umowy z kierownikiem ośrodka pomocy. Masz prawo do negocjacji,
                  jeśli ponosisz inne wysokie koszty życiowe.
                </p>
              </div>
            </div>

            {/* MOPS contact */}
            {activeMops ? (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-primary-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-primary-100 text-xs font-bold uppercase tracking-wide">Kluczowy kontakt</p>
                      <h3 className="text-white font-bold text-lg leading-tight">Wniosek o dopłatę gminy</h3>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {activeMopsFallbackUsed && activeMopsFallbackCity && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-5 rounded-r-xl text-sm">
                      <p className="text-amber-900">
                        Dla miejscowości <strong>{result.city}</strong> właściwym ośrodkiem pomocy społecznej jest MOPS w <strong>{toCityLocative(activeMopsFallbackCity)}</strong> — tam złożysz wniosek o dopłatę do DPS.
                      </p>
                    </div>
                  )}

                  {/* Name */}
                  <p className="text-lg font-bold text-slate-900 mb-5">{activeMops.name}</p>

                  {/* Contact grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <a
                      href={`tel:${activeMops.phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-3 bg-stone-50 hover:bg-primary-50 border border-stone-200 hover:border-primary-200 rounded-xl px-4 py-3 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                        <Phone size={15} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Telefon</p>
                        <p className="text-sm font-bold text-slate-800">{activeMops.phone}</p>
                      </div>
                    </a>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeMops.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-stone-50 hover:bg-primary-50 border border-stone-200 hover:border-primary-200 rounded-xl px-4 py-3 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-stone-200 text-slate-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                        <MapPin size={15} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Adres</p>
                        <p className="text-sm text-slate-700 group-hover:text-primary-700">{activeMops.address}</p>
                      </div>
                    </a>

                    {activeMops.email && (
                      <a
                        href={`mailto:${activeMops.email}`}
                        className="flex items-center gap-3 bg-stone-50 hover:bg-primary-50 border border-stone-200 hover:border-primary-200 rounded-xl px-4 py-3 transition-colors group"
                      >
                        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                          <Info size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email</p>
                          <p className="text-sm text-slate-800 truncate">{activeMops.email}</p>
                        </div>
                      </a>
                    )}

                    {activeMops.website && (
                      <a
                        href={activeMops.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-stone-50 hover:bg-primary-50 border border-stone-200 hover:border-primary-200 rounded-xl px-4 py-3 transition-colors group"
                      >
                        <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                          <ArrowLeft size={15} className="rotate-[135deg]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Strona www</p>
                          <p className="text-sm text-primary-600 truncate">{activeMops.website.replace(/^https?:\/\//, '')}</p>
                        </div>
                      </a>
                    )}
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-emerald-800">
                      Zadzwoń i umów się na rozmowę z pracownikiem socjalnym. To pierwszy krok do uzyskania dopłaty gminy do kosztów DPS.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="bg-stone-100 px-6 py-4 flex items-center gap-3 border-b border-stone-200">
                  <div className="w-9 h-9 bg-stone-200 rounded-xl flex items-center justify-center">
                    <Phone className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Kontakt</p>
                    <h3 className="text-slate-700 font-bold text-lg leading-tight">Właściwy MOPS / OPS</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 mb-5">
                    Nie mamy jeszcze danych kontaktowych dla powiatu <strong>{activeFacilities[0]?.powiat || result.city}</strong> w naszej bazie.
                    Skontaktuj się bezpośrednio — to pierwszy krok do złożenia wniosku o dopłatę gminy.
                  </p>
                  <a
                    href={`https://www.google.com/search?q=MOPS+${encodeURIComponent(result.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-stone-50 hover:bg-primary-50 border border-stone-200 hover:border-primary-200 rounded-xl px-4 py-3 transition-colors group mb-3"
                  >
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                      <Search size={15} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Wyszukaj w Google</p>
                      <p className="text-sm font-bold text-primary-600">MOPS {result.city}</p>
                    </div>
                  </a>
                  <p className="text-xs text-slate-400">
                    Możesz też zadzwonić do Urzędu Gminy lub Starostwa Powiatowego — skierują Cię do właściwego ośrodka.
                  </p>
                </div>
              </div>
            )}

            {/* Facility cards */}
            <div>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-slate-900">
                    {result.powiatFallbackUsed
                      ? <>Najbliższe DPS w okolicy miejscowości: <span className="text-primary-600">{result.city}</span></>
                      : <>DPS w: <span className="text-primary-600">{result.city}</span></>
                    }
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Znaleziono {activeFacilities.length}{' '}
                    {activeFacilities.length === 1 ? 'placówkę' : activeFacilities.length < 5 ? 'placówki' : 'placówek'}
                  </p>
                </div>
              </div>

              {result.ambiguousPowiaty && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 mb-4 text-sm text-amber-900">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
                    <p>
                      Miejscowość <strong>{result.city}</strong> występuje w kilku powiatach — wybierz właściwy, żeby zobaczyć odpowiednie DPS i MOPS:
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-6">
                    {result.ambiguousPowiaty.map(p => (
                      <button
                        key={p}
                        onClick={() => setSelectedPowiat(selectedPowiat === p ? null : p)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                          selectedPowiat === p
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white text-amber-800 border-amber-400 hover:bg-amber-100'
                        }`}
                      >
                        powiat {p}
                      </button>
                    ))}
                    {selectedPowiat && (
                      <button onClick={() => setSelectedPowiat(null)}
                        className="px-3 py-1.5 rounded-full text-xs text-amber-600 hover:text-amber-800 underline">
                        pokaż wszystkie
                      </button>
                    )}
                  </div>
                </div>
              )}

              {result.powiatFallbackUsed && result.powiatFallbackName && !result.ambiguousPowiaty && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-800 flex items-start gap-2">
                  <Info size={16} className="flex-shrink-0 mt-0.5 text-blue-500" />
                  <p>
                    Miejscowość <strong>{result.city}</strong> nie ma własnego DPS.
                    Poniżej pokazujemy Domy Pomocy Społecznej z powiatu <strong>{toPowiatGenitive(result.powiatFallbackName)}</strong>.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {(showAllFacilities ? activeFacilities : activeFacilities.slice(0, 5)).map((facility) => {
                  const hasPrice = facility.koszt_pobytu && facility.koszt_pobytu > 0;
                  const gap = hasPrice ? facility.koszt_pobytu! - result.maxContribution : 0;
                  const isCovered = hasPrice && gap <= 0;

                  return (
                    <div key={facility.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col md:flex-row gap-6 items-center hover:shadow-md transition-shadow">

                      {/* Info */}
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            facility.typ_placowki === 'DPS' ? 'bg-primary-100 text-primary-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {facility.typ_placowki}
                          </span>
                          {facility.profil_opieki && (
                            <span className="text-xs text-slate-400">{facility.profil_opieki}</span>
                          )}
                        </div>
                        <h4 className="font-bold text-lg text-slate-900">{facility.nazwa}</h4>
                        <div className="text-slate-500 text-sm mt-1 flex items-center gap-1 justify-center md:justify-start">
                          <MapPin size={13} /> {facility.miejscowosc}, pow. {facility.powiat}
                        </div>
                        {hasPrice && (
                          <div className="text-slate-500 text-sm mt-1">
                            Koszt całkowity: <span className="font-bold text-slate-800">{formatCurrency(facility.koszt_pobytu!)}/mc</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-3 justify-center md:justify-start flex-wrap">
                          <Link href={`/placowka/${facility.id}`} className="text-primary-600 hover:text-primary-700 text-sm font-bold">
                            Zobacz profil →
                          </Link>
                          {facility.telefon && (
                            <a href={`tel:${facility.telefon.replace(/\s/g, '')}`} className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1">
                              <Phone size={12} /> {facility.telefon}
                            </a>
                          )}
                          <div className="flex items-center gap-1.5 ml-auto">
                            <button
                              onClick={() => toggleCompare(facility.id)}
                              title={compareIds.includes(facility.id) ? 'Usuń z porównania' : 'Dodaj do porównania'}
                              className={`p-2 rounded-full transition-all ${
                                compareIds.includes(facility.id)
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-stone-100 text-slate-500 hover:bg-stone-200'
                              }`}
                            >
                              <ArrowLeftRight size={15} />
                            </button>
                            <button
                              onClick={() => toggleFavorite(facility)}
                              title={savedIds.includes(facility.id) ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                              className={`p-2 rounded-full transition-all ${
                                savedIds.includes(facility.id)
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-stone-100 text-slate-500 hover:bg-stone-200'
                              }`}
                            >
                              <Heart size={15} className={savedIds.includes(facility.id) ? 'fill-current' : ''} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Gap visualization */}
                      <div className="w-full md:w-auto bg-stone-50 rounded-xl p-4 min-w-[260px] border border-stone-100">
                        {!hasPrice ? (
                          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                            <Info size={16} />
                            {facility.typ_placowki === 'ŚDS' ? 'Opieka dzienna — często bezpłatna' : 'Brak oficjalnej ceny — zapytaj placówkę'}
                          </div>
                        ) : isCovered ? (
                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                            <CheckCircle2 size={18} /> W pełni pokryte z dochodu
                          </div>
                        ) : (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-slate-500 uppercase">Pozostaje do pokrycia:</span>
                              <span className="text-lg font-bold text-slate-700">{formatCurrency(gap)}</span>
                            </div>
                            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                              <div className="bg-emerald-500 h-full" style={{ width: `${(result.maxContribution / facility.koszt_pobytu!) * 100}%` }} />
                              <div
                                className="bg-amber-300 h-full opacity-60"
                                style={{
                                  width: `${(gap / facility.koszt_pobytu!) * 100}%`,
                                  backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.2) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.2) 50%,rgba(255,255,255,.2) 75%,transparent 75%,transparent)',
                                  backgroundSize: '1rem 1rem'
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] mt-2 font-medium text-slate-500">
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Senior (70%)</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300 inline-block" /> Gmina / Rodzina?</span>
                            </div>
                            <div className="text-[10px] text-center text-slate-400 mt-2 italic">
                              *O podziale tej kwoty decyduje MOPS
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Show more */}
            {!showAllFacilities && activeFacilities.length > 5 && (
              <div className="text-center">
                <button
                  onClick={() => setShowAllFacilities(true)}
                  className="bg-white border-2 border-stone-200 text-slate-700 font-bold py-3 px-8 rounded-xl hover:border-primary-400 hover:text-primary-700 transition-all"
                >
                  Pokaż więcej ({activeFacilities.length - 5} kolejnych placówek)
                </button>
              </div>
            )}

            {/* Comparison bar */}
            {compareIds.length > 0 && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl">
                <div className="bg-slate-900 text-white rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Porównanie</p>
                    <p className="text-sm font-bold">
                      {compareIds.length} / 3 placówk{compareIds.length === 1 ? 'a' : 'i'}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/ulubione/porownaj?ids=${compareIds.join(',')}`)}
                    disabled={compareIds.length < 2}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      compareIds.length >= 2
                        ? 'bg-primary-500 hover:bg-primary-400 text-white'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Porównaj <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => setCompareIds([])}
                    className="p-2 rounded-full hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                    title="Wyczyść"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={navigateToSearch}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
              >
                <MapPin size={18} /> Zobacz {activeFacilities.length === 1 ? '1 placówkę' : `${activeFacilities.length} placówki`} w wyszukiwarce
              </button>
            </div>

          </div>
          );
        })()}

      </div>
    </div>
  );
}

export default function KalkulatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <KalkulatorContent />
    </Suspense>
  );
}