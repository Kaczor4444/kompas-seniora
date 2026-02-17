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
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-3xl mx-auto px-6 py-10 md:py-14">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-10"
        >
          <ArrowLeft size={14} /> Strona główna
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-700 mb-4">Kalkulator kosztów</p>
          <h1 className="text-4xl md:text-[56px] font-black text-slate-900 leading-tight mb-4 tracking-tight">
            Symulator DPS
          </h1>
          <p className="text-slate-500 text-lg max-w-xl leading-relaxed">
            Sprawdź orientacyjny podział kosztów (zasada 70/30) dla oficjalnych placówek w Twoim regionie.
          </p>
        </div>

        {/* Disclaimer — subtle */}
        <div className="flex items-start gap-3 mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <strong>Tylko orientacyjna symulacja</strong> — nie decyzja urzędowa. MOPS rozpatruje każdą sprawę
            indywidualnie, biorąc pod uwagę sytuację rodzinną i majątkową.
          </p>
        </div>

        {/* Form */}
        <div className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Income */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                Dochód miesięczny (netto)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="np. 3500"
                  min="0" max="50000" step="100"
                  className="w-full pl-4 pr-14 py-4 border-2 border-slate-100 rounded-xl text-2xl font-black text-slate-900 bg-slate-50 focus:border-emerald-400 focus:bg-white outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">PLN</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Emerytura, renta + zasiłek pielęgnacyjny</p>
            </div>

            {/* City */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                Miejscowość
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="np. Kraków, Wieliczka..."
                  className="w-full pl-10 pr-4 py-4 border-2 border-slate-100 rounded-xl text-lg font-semibold text-slate-900 bg-slate-50 focus:border-emerald-400 focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="mt-2">
                <select
                  value={wojewodztwo}
                  onChange={(e) => setWojewodztwo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-500 outline-none"
                >
                  <option value="małopolskie">Województwo: Małopolskie</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-100 rounded-xl mb-4">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleCalculate}
            disabled={loading || !income || !city}
            className={`w-full py-4 rounded-xl font-black text-[12px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2
              ${!loading && income && city
                ? 'bg-slate-900 hover:bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Obliczam...</>
            ) : (
              <><Calculator size={15} /> Oblicz symulację</>
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
            <div id="results-section" className="space-y-0">

              {/* ── 70 / 30 split ── */}
              <div className="pt-10 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Podział 70 / 30</p>

                {/* Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex mb-8">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: '70%' }} />
                  <div className="bg-amber-300 h-full" style={{ width: '30%' }} />
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 flex items-center gap-1.5 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Wkład seniora (70%)
                    </p>
                    <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-1">{formatCurrency(result.maxContribution)}</p>
                    <p className="text-xs text-slate-400">odprowadzane do DPS</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1.5 mb-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Zostaje na rękę (30%)
                    </p>
                    <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-1">{formatCurrency(result.remainingFunds)}</p>
                    <p className="text-xs text-slate-400">leki, higiena, telefon</p>
                    {result.remainingFunds < 300 && (
                      <p className="text-xs text-amber-600 font-bold mt-2 flex items-center gap-1">
                        <AlertCircle size={12} /> Kwota może nie wystarczyć na leki
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 italic">
                  Symulacja wg ustawy o pomocy społecznej. MOPS rozpatruje każdą sprawę indywidualnie — nie jest to decyzja administracyjna.
                </p>
              </div>

              {/* ── Legal thresholds ── */}
              <div className="pt-10 mt-10 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Ustawowe progi zwolnienia</p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Osoba samotna</p>
                    <p className="text-2xl font-black text-slate-900">~{THRESHOLD_SINGLE} zł</p>
                    <p className="text-xs text-slate-400 mt-1">300% kryterium dochodowego</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Osoba w rodzinie</p>
                    <p className="text-2xl font-black text-slate-900">~{THRESHOLD_FAMILY} zł</p>
                    <p className="text-xs text-slate-400 mt-1">na osobę, 300% kryterium</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nawet jeśli dochód przekracza próg, dopłata nie jest automatyczna — jej wysokość ustala MOPS w drodze umowy.
                  Masz prawo do negocjacji przy wysokich kosztach życia.
                </p>
              </div>

              {/* ── Powiat selector ── */}
              {result.ambiguousPowiaty && (
                <div className="pt-10 mt-10 border-t border-slate-100">
                  <p className="text-sm text-slate-600 mb-3">
                    Miejscowość <strong>{result.city}</strong> występuje w kilku powiatach — wybierz właściwy:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.ambiguousPowiaty.map(p => (
                      <button
                        key={p}
                        onClick={() => setSelectedPowiat(p)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                          selectedPowiat === p
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        powiat {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── MOPS ── */}
              {(!result.ambiguousPowiaty || selectedPowiat) && (
                <div className="pt-10 mt-10 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Właściwy ośrodek pomocy</p>

                  {activeMops ? (
                    <>
                      {activeMopsFallbackUsed && activeMopsFallbackCity && (
                        <p className="text-sm text-slate-500 mb-4">
                          Dla <strong>{result.city}</strong> właściwym ośrodkiem jest {activeMops.typ} w <strong>{toCityLocative(activeMopsFallbackCity)}</strong>.
                        </p>
                      )}
                      <p className="text-xl font-black text-slate-900 mb-4">{activeMops.name}</p>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={`tel:${activeMops.phone.replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                        >
                          <Phone size={14} /> {activeMops.phone}
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeMops.address)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-500 hover:border-slate-400 transition-colors"
                        >
                          <MapPin size={14} /> {activeMops.address}
                        </a>
                        {activeMops.email && (
                          <a
                            href={`mailto:${activeMops.email}`}
                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-500 hover:border-slate-400 transition-colors"
                          >
                            {activeMops.email}
                          </a>
                        )}
                        {activeMops.website && (
                          <a
                            href={activeMops.website}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-500 hover:border-slate-400 transition-colors"
                          >
                            {activeMops.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-4">
                        Zadzwoń i umów się na rozmowę z pracownikiem socjalnym — to pierwszy krok do uzyskania dopłaty gminy.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-slate-500 mb-4">
                        Brak danych w bazie dla powiatu <strong>{activeFacilities[0]?.powiat || result.city}</strong>.
                      </p>
                      <a
                        href={`https://www.google.com/search?q=MOPS+${encodeURIComponent(result.city)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                      >
                        <Search size={14} /> Szukaj MOPS {result.city} w Google
                      </a>
                      <p className="text-xs text-slate-400 mt-3">
                        Możesz też zadzwonić do Urzędu Gminy lub Starostwa Powiatowego — skierują Cię do właściwego ośrodka.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* ── Facilities ── */}
              <div className="pt-10 mt-10 border-t border-slate-100">
                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Dostępne placówki</p>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {result.powiatFallbackUsed ? `DPS w okolicy ${result.city}` : `DPS w ${result.city}`}
                  </h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {activeFacilities.length}{' '}
                    {activeFacilities.length === 1 ? 'placówka' : activeFacilities.length < 5 ? 'placówki' : 'placówek'}
                  </p>
                </div>

                {result.powiatFallbackUsed && result.powiatFallbackName && !result.ambiguousPowiaty && (
                  <p className="text-sm text-slate-500 mb-5">
                    <strong>{result.city}</strong> nie ma własnego DPS — poniżej placówki z powiatu <strong>{toPowiatGenitive(result.powiatFallbackName)}</strong>.
                  </p>
                )}

                <div className="space-y-3">
                  {(showAllFacilities ? activeFacilities : activeFacilities.slice(0, 5)).map((facility) => {
                    const hasPrice = facility.koszt_pobytu && facility.koszt_pobytu > 0;
                    const gap = hasPrice ? facility.koszt_pobytu! - result.maxContribution : 0;
                    const isCovered = hasPrice && gap <= 0;

                    return (
                      <div key={facility.id} className="border border-slate-100 rounded-xl p-5 hover:border-slate-200 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                facility.typ_placowki === 'DPS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {facility.typ_placowki}
                              </span>
                              <span className="text-xs text-slate-400">{facility.miejscowosc}, pow. {facility.powiat}</span>
                            </div>
                            <h4 className="font-black text-slate-900 text-base leading-tight mb-1.5">{facility.nazwa}</h4>
                            {hasPrice && (
                              <p className="text-sm text-slate-500">
                                Koszt: <span className="font-black text-slate-900">{formatCurrency(facility.koszt_pobytu!)}/mc</span>
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            {!hasPrice ? (
                              <span className="text-[11px] font-bold text-slate-500">Cena na zapytanie</span>
                            ) : isCovered ? (
                              <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={13} /> W pełni pokryte
                              </span>
                            ) : (
                              <span className="text-[11px] font-black text-amber-600">Brakuje {formatCurrency(gap)}</span>
                            )}

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleCompare(facility.id)}
                                title="Porównaj"
                                className={`p-1.5 rounded-lg transition-all ${compareIds.includes(facility.id) ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'}`}
                              >
                                <ArrowLeftRight size={14} />
                              </button>
                              <button
                                onClick={() => toggleFavorite(facility)}
                                title="Ulubione"
                                className={`p-1.5 rounded-lg transition-all ${savedIds.includes(facility.id) ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'}`}
                              >
                                <Heart size={14} className={savedIds.includes(facility.id) ? 'fill-current' : ''} />
                              </button>
                              <Link href={`/placowka/${facility.id}`} className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors">
                                <ChevronRight size={16} />
                              </Link>
                            </div>

                            {facility.telefon && (
                              <a
                                href={`tel:${facility.telefon.replace(/\s/g, '')}`}
                                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                              >
                                <Phone size={11} /> {facility.telefon}
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Gap bar — only when subsidy needed */}
                        {hasPrice && !isCovered && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden flex mb-1.5">
                              <div className="bg-emerald-500 h-full" style={{ width: `${(result.maxContribution / facility.koszt_pobytu!) * 100}%` }} />
                              <div className="bg-amber-300 h-full" style={{ width: `${(gap / facility.koszt_pobytu!) * 100}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Senior: {formatCurrency(result.maxContribution)}</span>
                              <span>Gmina/Rodzina: {formatCurrency(gap)} *</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 italic">* O podziale decyduje MOPS</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!showAllFacilities && activeFacilities.length > 5 && (
                  <button
                    onClick={() => setShowAllFacilities(true)}
                    className="mt-4 w-full py-3 border border-slate-100 rounded-xl text-sm font-black text-slate-500 uppercase tracking-widest hover:border-slate-300 transition-colors"
                  >
                    Pokaż więcej ({activeFacilities.length - 5} kolejnych)
                  </button>
                )}
              </div>

              {/* ── CTA ── */}
              <div className="pt-8 mt-8 border-t border-slate-100">
                <button
                  onClick={navigateToSearch}
                  className="w-full py-4 bg-slate-900 hover:bg-emerald-700 text-white font-black text-[12px] uppercase tracking-[0.15em] rounded-xl transition-colors active:scale-95 flex items-center justify-center gap-2"
                >
                  <MapPin size={15} /> Zobacz {activeFacilities.length === 1 ? '1 placówkę' : `${activeFacilities.length} placówki`} w wyszukiwarce
                </button>
              </div>

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