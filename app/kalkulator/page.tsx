'use client';

import { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Calculator, AlertCircle, Phone, MapPin, CheckCircle2, Search, Heart, ArrowLeftRight, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { mapPowiatToCity } from '@/lib/powiat-to-city';
import { getGminaForCity } from '@/lib/city-to-gmina';
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
  'klucze': 'Kluczach',
  'bukowno': 'Bukownie',
  'wolbrom': 'Wolbromiu',
  'bolesław': 'Bolesławiu',
  'trzyciąż': 'Trzyciążu',
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
  typ: string;
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
    
    // KROK 2: Fallback - sprawdź gminę miejscowości
    const normalizedCityName = cityName.toLowerCase().trim()
      .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e')
      .replace(/ł/g,'l').replace(/ń/g,'n').replace(/ó/g,'o')
      .replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
      .replace(/\s+/g,'-');
    const gminaCity = getGminaForCity(normalizedCityName);
    if (gminaCity && gminaCity !== normalizedCityName) {
      console.log('🔄 Trying gmina fallback:', gminaCity);
      mops = await fetchMopsContact(gminaCity);
      if (mops) {
        console.log('✅ Found MOPS via gmina:', gminaCity);
        return { mops, usedFallback: true, fallbackCity: gminaCity };
      }
    }

    // KROK 3: Fallback - mapuj powiat → miasto powiatowe
    console.log('⚠️ No MOPS for city or gmina, trying fallback to powiat...');
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

      // Auto-preselektuj powiat z TERYT topMatch gdy wieloznaczność
      if (ambiguousPowiaty) {
        const terytTopPowiat = data.terytSuggestion?.powiat;
        if (terytTopPowiat && ambiguousPowiaty.includes(terytTopPowiat)) {
          setSelectedPowiat(terytTopPowiat);
        }
      }

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
    const params = new URLSearchParams({
      q:    result.city,
      woj:  result.wojewodztwo,
      type: 'dps',
    });
    if (selectedPowiat) params.set('powiat', selectedPowiat);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <div className="max-w-[1000px] mx-auto px-6 py-12">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Strona główna
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="h-px w-10 bg-emerald-600" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-700">Analiza Finansowa</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tight mb-4">
            Symulator Opłat DPS
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
            Sprawdź orientacyjny podział kosztów według zasady 70/30 oraz wysokość dopłaty gminy dla Twojej lokalizacji.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 mb-10 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Tylko orientacyjna symulacja</strong> — nie decyzja urzędowa. MOPS rozpatruje każdą sprawę
            indywidualnie, biorąc pod uwagę sytuację rodzinną i majątkową.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-300 rounded-2xl p-8 lg:p-12 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

            {/* Income */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block ml-1">
                Dochód netto (emerytura/renta)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="np. 3500"
                  min="0" max="50000" step="100"
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-6 py-4 text-2xl font-black text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-400 uppercase pointer-events-none">PLN</span>
              </div>
              <p className="text-xs text-slate-400 ml-1">Emerytura, renta + zasiłek pielęgnacyjny</p>
            </div>

            {/* City */}
            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 block ml-1">
                Twoje miasto / gmina
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="np. Kraków, Wieliczka..."
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-6 py-4 text-2xl font-black text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
                />
                <MapPin className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              </div>
              <div>
                <select
                  value={wojewodztwo}
                  onChange={(e) => setWojewodztwo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-500 outline-none ml-1"
                >
                  <option value="małopolskie">Województwo: Małopolskie</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 text-sm font-bold rounded-xl mb-6 flex items-center gap-3 border border-rose-200">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            onClick={handleCalculate}
            disabled={loading || !income || !city}
            className={`w-full font-black text-[12px] uppercase tracking-[0.3em] py-5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3
              ${!loading && income && city
                ? 'bg-slate-900 hover:bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Calculator size={18} /> Oblicz symulację</>
            )}
          </button>
        </div>

        {/* ── RESULTS ── */}
        {result && (() => {
          const activeFacilities = selectedPowiat
            ? result.facilities.filter(f => f.powiat === selectedPowiat)
            : result.facilities;
          const activeMops = selectedPowiat && result.mopsPerPowiat
            ? result.mopsPerPowiat[selectedPowiat]
            : result.mopsContact;
          const activeMopsFallbackUsed = selectedPowiat ? false : result.mopsFallbackUsed;
          const activeMopsFallbackCity = selectedPowiat ? undefined : result.mopsFallbackCity;

          return (
            <div id="results-section" className="space-y-20">

              {/* ── 70/30 split ── */}
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <span className="px-4 py-1.5 bg-emerald-100 rounded-full text-[11px] font-black text-emerald-700 uppercase tracking-widest">Szczegóły symulacji</span>
                  <div className="h-px flex-1 bg-stone-200" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {/* Senior contribution */}
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={20} />
                      </div>
                      <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">Wkład Seniora (70%)</span>
                    </div>
                    <div className="text-4xl lg:text-5xl font-black text-emerald-800 leading-none tracking-tight mb-3">
                      {formatCurrency(result.maxContribution)}
                    </div>
                    <p className="text-emerald-700 text-sm leading-relaxed border-t border-emerald-100 pt-3">
                      Kwota wynikająca wprost z ustawy (70% dochodu). Jest potrącana automatycznie na rzecz DPS.
                    </p>
                  </div>

                  {/* Pocket money */}
                  <div className="bg-white rounded-2xl p-6 border border-stone-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center flex-shrink-0">
                        <Heart size={20} />
                      </div>
                      <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Zostaje &quot;Na rękę&quot; (30%)</span>
                    </div>
                    <div className="text-4xl lg:text-5xl font-black text-slate-900 leading-none tracking-tight mb-3">
                      {formatCurrency(result.remainingFunds)}
                    </div>
                    <div className="text-xs text-slate-500 border-t border-stone-100 pt-3">
                      <p className="font-black uppercase tracking-widest text-[10px] mb-2">Budżet na potrzeby własne:</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg text-stone-600 border border-stone-200 font-bold">Leki</span>
                        <span className="inline-flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg text-stone-600 border border-stone-200 font-bold">Higiena</span>
                        <span className="inline-flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg text-stone-600 border border-stone-200 font-bold">Telefon</span>
                      </div>
                      {result.remainingFunds < 300 && (
                        <div className="mt-3 text-amber-700 flex items-start gap-1.5 font-bold bg-amber-50 p-2 rounded-lg border border-amber-100">
                          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                          Uwaga: ta kwota może nie wystarczyć na leki nierefundowane.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full h-14 bg-stone-100 rounded-xl overflow-hidden flex">
                  <div className="h-full bg-emerald-600 flex items-center justify-center" style={{ width: '70%' }}>
                    <span className="text-white text-[11px] font-black uppercase tracking-widest">Koszt pobytu</span>
                  </div>
                  <div className="h-full flex-1 flex items-center justify-center">
                    <span className="text-stone-400 text-[11px] font-black uppercase tracking-widest">Kwota wolna</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4 italic">
                  Symulacja wg ustawy o pomocy społecznej. MOPS rozpatruje każdą sprawę indywidualnie — nie jest to decyzja administracyjna.
                </p>
              </section>

              {/* ── Legal thresholds ── */}
              <section className="bg-slate-800 rounded-2xl p-8 lg:p-10 text-white">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Ustawowe progi dochodowe</h3>
                <p className="text-slate-300 text-sm mb-8 max-w-2xl leading-relaxed">
                  Ustawa o pomocy społecznej określa tzw. „bezpieczniki finansowe". Poniżej tych kwot gmina zazwyczaj <strong className="text-white">nie powinna</strong> żądać dopłaty od rodziny, ale każda sprawa jest badana indywidualnie.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 rounded-xl p-5 border border-white/10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dla osoby samotnej</span>
                    <span className="text-2xl font-black text-blue-300">~{THRESHOLD_SINGLE} zł <span className="text-sm font-normal text-white">netto</span></span>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">Ustawowy próg zwolnienia (300% kryterium).</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-5 border border-white/10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dla osoby w rodzinie</span>
                    <span className="text-2xl font-black text-blue-300">~{THRESHOLD_FAMILY} zł <span className="text-sm font-normal text-white">netto/os.</span></span>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">Ustawowy próg zwolnienia na osobę (300% kryterium).</p>
                  </div>
                </div>
                <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-xs text-red-200 flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <p><strong>Ważne:</strong> Nawet jeśli Twój dochód jest wyższy, dopłata nie jest automatyczna! Jej wysokość ustala się w drodze umowy z kierownikiem ośrodka pomocy. Masz prawo do negocjacji, jeśli ponosisz inne wysokie koszty życiowe.</p>
                </div>
              </section>

              {/* ── Powiat selector ── */}
              {result.ambiguousPowiaty && (
                <section>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Wybierz powiat</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    Miejscowość <strong>{result.city}</strong> występuje w kilku powiatach — wybierz właściwy, żeby zobaczyć odpowiednie DPS i MOPS:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.ambiguousPowiaty.map(p => (
                      <button
                        key={p}
                        onClick={() => setSelectedPowiat(p)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider border-2 transition-all ${
                          selectedPowiat === p
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-600 hover:text-emerald-700'
                        }`}
                      >
                        powiat {p}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* ── MOPS ── */}
              {(!result.ambiguousPowiaty || selectedPowiat) && (
                <section>
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Właściwy ośrodek pomocy</span>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>

                  {activeMops ? (
                    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                      {/* Header */}
                      <div className="bg-emerald-600 px-6 py-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">Kluczowy kontakt</p>
                          <h3 className="text-white font-black text-lg leading-tight">Wniosek o dopłatę gminy</h3>
                        </div>
                      </div>
                      <div className="p-6">
                        {activeMopsFallbackUsed && activeMopsFallbackCity && (
                          <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-5 rounded-r-xl text-sm">
                            <p className="text-amber-900">
                              Dla miejscowości <strong>{result.city}</strong> właściwym ośrodkiem pomocy społecznej jest {activeMops.typ} w <strong>{toCityLocative(activeMopsFallbackCity)}</strong> — tam złożysz wniosek o dopłatę do DPS.
                            </p>
                          </div>
                        )}
                        <p className="text-lg font-black text-slate-900 mb-5">{activeMops.name}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                          <a
                            href={`tel:${activeMops.phone.replace(/\s/g, '')}`}
                            className="flex items-center gap-3 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-200 rounded-xl px-4 py-3 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Phone size={15} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefon</p>
                              <p className="text-sm font-bold text-slate-800">{activeMops.phone}</p>
                            </div>
                          </a>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeMops.address)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-200 rounded-xl px-4 py-3 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-stone-200 text-slate-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                              <MapPin size={15} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adres</p>
                              <p className="text-sm text-slate-700">{activeMops.address}</p>
                            </div>
                          </a>
                          {activeMops.email && (
                            <a
                              href={`mailto:${activeMops.email}`}
                              className="flex items-center gap-3 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-200 rounded-xl px-4 py-3 transition-colors group"
                            >
                              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Search size={15} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                                <p className="text-sm text-slate-800 truncate">{activeMops.email}</p>
                              </div>
                            </a>
                          )}
                          {activeMops.website && (
                            <a
                              href={activeMops.website}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-200 rounded-xl px-4 py-3 transition-colors group"
                            >
                              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <ChevronRight size={15} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strona www</p>
                                <p className="text-sm text-emerald-600 truncate">{activeMops.website.replace(/^https?:\/\//, '')}</p>
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
                    <div className="bg-white border-2 border-slate-300 rounded-2xl p-8">
                      <p className="text-sm text-slate-500 mb-5">
                        Nie mamy jeszcze danych kontaktowych dla powiatu <strong>{activeFacilities[0]?.powiat || result.city}</strong> w naszej bazie.
                        Skontaktuj się bezpośrednio — to pierwszy krok do złożenia wniosku o dopłatę gminy.
                      </p>
                      <a
                        href={`https://www.google.com/search?q=MOPS+${encodeURIComponent(result.city)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-3 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:border-emerald-600 hover:text-emerald-700 transition-all"
                      >
                        <Search size={15} /> Szukaj MOPS {result.city} w Google
                      </a>
                      <p className="text-xs text-slate-400 mt-4">
                        Możesz też zadzwonić do Urzędu Gminy lub Starostwa Powiatowego — skierują Cię do właściwego ośrodka.
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* ── Facilities ── */}
              <section>
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        {result.powiatFallbackUsed ? 'DPS w okolicy' : 'Placówki w'}
                      </span>
                      <div className="h-px flex-1 bg-slate-100 w-16" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      {result.powiatFallbackUsed
                        ? `Najbliższe DPS w okolicy ${result.city}`
                        : `DPS w ${toCityLocative(result.city)}`}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                      {activeFacilities.length}{' '}
                      {activeFacilities.length === 1 ? 'placówka' : activeFacilities.length < 5 ? 'placówki' : 'placówek'} — analiza pokrycia kosztów dla Twojego dochodu
                    </p>
                  </div>
                  <button
                    onClick={navigateToSearch}
                    className="text-[11px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 hover:text-slate-900 transition-colors shrink-0 ml-4"
                  >
                    Pokaż w wyszukiwarce <ChevronRight size={14} />
                  </button>
                </div>

                {result.powiatFallbackUsed && result.powiatFallbackName && !result.ambiguousPowiaty && (
                  <p className="text-sm text-slate-500 mb-6">
                    Miejscowość <strong>{result.city}</strong> nie ma własnego DPS.
                    Poniżej pokazujemy placówki z powiatu <strong>{toPowiatGenitive(result.powiatFallbackName)}</strong>.
                  </p>
                )}

                <div className="space-y-4">
                  {(showAllFacilities ? activeFacilities : activeFacilities.slice(0, 5)).map((facility) => {
                    const hasPrice = facility.koszt_pobytu && facility.koszt_pobytu > 0;
                    const gap = hasPrice ? facility.koszt_pobytu! - result.maxContribution : 0;
                    const isCovered = hasPrice && gap <= 0;

                    return (
                      <div key={facility.id} className="bg-white border border-stone-200 rounded-2xl p-6 lg:p-8 hover:border-emerald-400 transition-all flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                              facility.typ_placowki === 'DPS' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {facility.typ_placowki}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase">{facility.miejscowosc}, pow. {facility.powiat}</span>
                          </div>
                          <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight">{facility.nazwa}</h4>
                          {hasPrice && (
                            <div className="text-sm font-bold text-slate-500">
                              Pełny koszt: <span className="text-slate-900">{formatCurrency(facility.koszt_pobytu!)}</span> / mc
                            </div>
                          )}
                          {facility.telefon && (
                            <a
                              href={`tel:${facility.telefon.replace(/\s/g, '')}`}
                              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mt-2 transition-colors"
                            >
                              <Phone size={11} /> {facility.telefon}
                            </a>
                          )}
                        </div>

                        <div className="w-full md:w-auto bg-stone-50 rounded-xl p-4 flex-shrink-0 md:min-w-[220px] border border-stone-100">
                          {!hasPrice ? (
                            <span className="text-sm font-bold text-slate-400">Cena na zapytanie</span>
                          ) : isCovered ? (
                            <span className="text-sm font-black text-emerald-600 flex items-center gap-2 uppercase tracking-tight mb-3">
                              <CheckCircle2 size={16} /> W pełni pokryte
                            </span>
                          ) : (
                            <div className="mb-3">
                              <div className="text-sm font-black text-rose-600 uppercase tracking-tighter">Brakuje: {formatCurrency(gap)}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Dopłata gminy/rodziny</div>
                            </div>
                          )}

                          {/* Gap bar */}
                          {hasPrice && !isCovered && (
                            <div className="mb-3">
                              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden flex">
                                <div className="bg-emerald-600 h-full" style={{ width: `${(result.maxContribution / facility.koszt_pobytu!) * 100}%` }} />
                                <div className="bg-amber-400 h-full" style={{ width: `${(gap / facility.koszt_pobytu!) * 100}%` }} />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>Senior</span>
                                <span>Gmina *</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => toggleCompare(facility.id)}
                              title={compareIds.includes(facility.id) ? 'Usuń z porównania' : 'Dodaj do porównania'}
                              className={`p-2 rounded-lg border-2 transition-all ${
                                compareIds.includes(facility.id)
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'border-slate-300 text-slate-400 hover:border-slate-500'
                              }`}
                            >
                              <ArrowLeftRight size={14} />
                            </button>
                            <button
                              onClick={() => toggleFavorite(facility)}
                              title={savedIds.includes(facility.id) ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                              className={`p-2 rounded-lg border-2 transition-all ${
                                savedIds.includes(facility.id)
                                  ? 'text-emerald-600 border-emerald-200'
                                  : 'border-slate-300 text-slate-400 hover:border-slate-500'
                              }`}
                            >
                              <Heart size={14} className={savedIds.includes(facility.id) ? 'fill-current' : ''} />
                            </button>
                            <Link
                              href={`/placowka/${facility.id}`}
                              className="text-[11px] font-black text-slate-900 border-b-2 border-slate-900 hover:text-emerald-600 hover:border-emerald-600 transition-all pb-0.5 uppercase tracking-wider"
                            >
                              Szczegóły
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!showAllFacilities && activeFacilities.length > 5 && (
                  <button
                    onClick={() => setShowAllFacilities(true)}
                    className="mt-6 w-full py-4 border-2 border-slate-300 rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-widest hover:border-emerald-600 hover:text-emerald-700 transition-all"
                  >
                    Pokaż więcej ({activeFacilities.length - 5} kolejnych placówek)
                  </button>
                )}
              </section>

              {/* ── Expert note ── */}
              <section className="bg-emerald-900 text-white rounded-2xl p-8 lg:p-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle size={28} className="text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-black mb-2 uppercase tracking-tight">Potrzebujesz pomocy urzędowej?</h4>
                  <p className="text-emerald-100 text-sm leading-relaxed opacity-80">
                    Ostateczna decyzja o odpłatności zawsze należy do MOPS / GOPS. Pracownik socjalny przeprowadzi wywiad środowiskowy i ustali dokładne kwoty dopłat na podstawie Twojej indywidualnej sytuacji majątkowej. Nie traktuj tego wyniku jako ostatecznego wymiaru opłat.
                  </p>
                </div>
                <a
                  href="/asystent?start=true"
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[12px] uppercase tracking-widest px-8 py-4 rounded-xl transition-all shrink-0 active:scale-95"
                >
                  Zapytaj AI
                </a>
              </section>

              {/* ── Comparison bar ── */}
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
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
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