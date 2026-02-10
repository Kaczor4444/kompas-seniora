'use client';

import { useState } from 'react';
import { ArrowLeft, Calculator, AlertCircle, Phone, MapPin, Info, ShieldAlert, Pill, ShoppingBag, CheckCircle2, Wallet, Scale, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { mapPowiatToCity } from '@/lib/powiat-to-city';

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
  mopsFallbackUsed: boolean; // ✅ NOWE - czy użyto fallbacku
  mopsFallbackCity?: string; // ✅ NOWE - z jakiego miasta jest MOPS
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

export default function KalkulatorPage() {
  const router = useRouter();
  
  // Form state
  const [income, setIncome] = useState<string>('3500');
  const [wojewodztwo, setWojewodztwo] = useState<string>('małopolskie');
  const [city, setCity] = useState<string>('');
  
  // Result state
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAllFacilities, setShowAllFacilities] = useState(false);

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
      
      // Fetch facilities from existing API
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(city)}&woj=${encodeURIComponent(wojewodztwo)}`
      );
      
      if (!response.ok) {
        throw new Error('Nie udało się pobrać danych placówek');
      }
      
      const data = await response.json();
      const facilities: Facility[] = data.results || [];
      
      if (facilities.length === 0) {
        setError(`Nie znaleźliśmy placówek dla miejscowości "${city}". Spróbuj wpisać inną miejscowość z województwa ${wojewodztwo}.`);
        setLoading(false);
        return;
      }
      
      // Show only DPS (exclude ŚDS)
      const dpsFacilities = facilities.filter(f => f.typ_placowki === 'DPS');

      // Separate facilities with and without prices
      const facilitiesWithPrices = dpsFacilities.filter(f => f.koszt_pobytu && f.koszt_pobytu > 0);
      const facilitiesWithoutPrices = dpsFacilities.filter(f => !f.koszt_pobytu || f.koszt_pobytu === 0);
      
      // Categorize facilities with prices
      const affordableFacilities = facilitiesWithPrices.filter(f => f.koszt_pobytu! <= maxContribution);
      const needsSubsidy = facilitiesWithPrices.filter(f => f.koszt_pobytu! > maxContribution);

      // ✅ Fetch MOPS contact z fallbackiem
      // Używamy powiatu z pierwszej placówki (wszystkie powinny być z tego samego)
      const powiatName = facilities[0]?.powiat || '';
      const { mops: fetchedMopsContact, usedFallback, fallbackCity } = await fetchMopsWithFallback(
        city,
        powiatName
      );
      
      console.log('✅ FINAL MOPS RESULT:', {
        found: !!fetchedMopsContact,
        usedFallback,
        fallbackCity
      });
      
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
        mopsFallbackCity: fallbackCity
      };

      setResult(calculationResult);
      
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
    router.push(`/search?q=${encodeURIComponent(result.city)}&woj=${encodeURIComponent(result.wojewodztwo)}&maxPrice=${Math.round(result.maxContribution)}`);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Header */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Wróć do strony głównej
          </Link>

          <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-900/10">
            <Calculator size={32} />
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-4">
            Symulator Kosztów DPS
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Sprawdź orientacyjny podział kosztów (zasada 70/30) dla oficjalnych placówek w Twoim regionie.
            Ostateczną decyzję zawsze wydaje gmina po wywiadzie środowiskowym.
          </p>
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
        {result && (
          <div id="results-section" className="space-y-8">

            {/* Disclaimer */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl shadow-sm">
              <div className="flex items-start gap-4">
                <ShieldAlert className="text-amber-600 flex-shrink-0" size={28} />
                <div>
                  <h3 className="text-amber-900 font-bold text-lg mb-1">To tylko symulacja – nie decyzja urzędowa!</h3>
                  <p className="text-amber-800 text-sm leading-relaxed">
                    Poniższe wyliczenia opierają się na ogólnych przepisach ustawy o pomocy społecznej.
                    <strong> Każda sytuacja jest rozpatrywana indywidualnie przez pracownika socjalnego (MOPS/OPS).</strong>{' '}
                    Urzędnik bierze pod uwagę nie tylko dochód, ale też sytuację rodzinną, majątkową i alimentacyjną.
                    Nie traktuj tego wyniku jako ostatecznego wymiaru opłat.
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
            {result.mopsContact && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5" /> Kluczowy kontakt: Wniosek o dopłatę
                </h3>
                {result.mopsFallbackUsed && result.mopsFallbackCity && (
                  <div className="bg-blue-100 border-l-4 border-blue-400 p-3 mb-4 text-sm rounded-r-lg">
                    <p className="text-blue-900">
                      Nie znaleźliśmy MOPS-u dla <strong>{result.city}</strong>. Poniżej kontakt do MOPS-u
                      w <strong className="capitalize">{result.mopsFallbackCity}</strong>, który obsługuje Twój powiat.
                    </p>
                  </div>
                )}
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-bold text-blue-900">Właściwy urząd{result.mopsFallbackUsed ? ' dla Twojego powiatu' : ` dla ${result.city}`}:</span>
                    <p className="text-blue-800 mt-0.5">{result.mopsContact.name}</p>
                  </div>
                  <div>
                    <span className="font-bold text-blue-900">Telefon:</span>
                    <p className="mt-0.5">
                      <a href={`tel:${result.mopsContact.phone.replace(/\s/g, '')}`} className="text-primary-600 hover:text-primary-700 font-semibold">
                        {result.mopsContact.phone}
                      </a>
                    </p>
                  </div>
                  {result.mopsContact.email && (
                    <div>
                      <span className="font-bold text-blue-900">Email:</span>
                      <p className="mt-0.5">
                        <a href={`mailto:${result.mopsContact.email}`} className="text-primary-600 hover:text-primary-700">{result.mopsContact.email}</a>
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-blue-900">Adres:</span>
                    <p className="text-blue-800 mt-0.5">{result.mopsContact.address}</p>
                  </div>
                  {result.mopsContact.website && (
                    <div>
                      <span className="font-bold text-blue-900">Strona:</span>
                      <p className="mt-0.5">
                        <a href={result.mopsContact.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                          {result.mopsContact.website}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-blue-700 mt-4 bg-blue-100 p-3 rounded-xl">
                  💡 Zadzwoń i umów się na rozmowę. To pierwszy krok do uzyskania dopłaty Gminy.
                </p>
              </div>
            )}

            {/* Facility cards */}
            <div>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h3 className="font-serif font-bold text-2xl text-slate-900">
                    Placówki w: <span className="text-primary-600">{result.city}</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Znaleziono {result.facilities.length}{' '}
                    {result.facilities.length === 1 ? 'placówkę' : result.facilities.length < 5 ? 'placówki' : 'placówek'}
                    {result.facilitiesWithPrices.length > 0 && ` (${result.facilitiesWithPrices.length} z oficjalną ceną)`}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {(showAllFacilities ? result.facilities : result.facilities.slice(0, 5)).map((facility) => {
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
                        <div className="flex items-center gap-3 mt-3 justify-center md:justify-start">
                          <Link href={`/placowka/${facility.id}`} className="text-primary-600 hover:text-primary-700 text-sm font-bold">
                            Zobacz profil →
                          </Link>
                          {facility.telefon && (
                            <a href={`tel:${facility.telefon.replace(/\s/g, '')}`} className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1">
                              <Phone size={12} /> {facility.telefon}
                            </a>
                          )}
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
            {!showAllFacilities && result.facilities.length > 5 && (
              <div className="text-center">
                <button
                  onClick={() => setShowAllFacilities(true)}
                  className="bg-white border-2 border-stone-200 text-slate-700 font-bold py-3 px-8 rounded-xl hover:border-primary-400 hover:text-primary-700 transition-all"
                >
                  Pokaż więcej ({result.facilities.length - 5} kolejnych placówek)
                </button>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={navigateToSearch}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-xl transition-all active:scale-95 shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
              >
                <MapPin size={18} /> Zobacz placówki w wyszukiwarce
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}