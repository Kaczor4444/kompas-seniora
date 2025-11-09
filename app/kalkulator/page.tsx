'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, AlertCircle, Phone, MapPin, TrendingUp, TrendingDown, Info } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
}

// MOPS Contact data (placeholder - do rozbudowy w przyszłości)
const MOPS_CONTACTS: Record<string, { name: string; phone: string; address: string }> = {
  'kraków': {
    name: 'Miejski Ośrodek Pomocy Społecznej w Krakowie',
    phone: '12 616 43 00',
    address: 'ul. Józefińska 14, 30-529 Kraków'
  },
  'wieliczka': {
    name: 'Ośrodek Pomocy Społecznej w Wieliczce',
    phone: '12 278 12 34',
    address: 'ul. Krakowska 26, 32-020 Wieliczka'
  },
  // Można rozbudować o inne miasta
};

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

  // Main calculation function
  const handleCalculate = async () => {
    // Reset previous state
    setError('');
    setResult(null);
    
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
      
      // Separate facilities with and without prices
      const facilitiesWithPrices = facilities.filter(f => f.koszt_pobytu && f.koszt_pobytu > 0);
      const facilitiesWithoutPrices = facilities.filter(f => !f.koszt_pobytu || f.koszt_pobytu === 0);
      
      // Categorize facilities with prices
      const affordableFacilities = facilitiesWithPrices.filter(f => f.koszt_pobytu! <= maxContribution);
      const needsSubsidy = facilitiesWithPrices.filter(f => f.koszt_pobytu! > maxContribution);
      
      const calculationResult: CalculationResult = {
        income: incomeNum,
        maxContribution,
        remainingFunds,
        contributionPercent: 70,
        city,
        wojewodztwo,
        facilities,
        facilitiesWithPrices,
        facilitiesWithoutPrices,
        affordableFacilities,
        needsSubsidy,
        hasAffordable: affordableFacilities.length > 0,
        allNeedSubsidy: facilitiesWithPrices.length > 0 && affordableFacilities.length === 0
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

  // Get MOPS contact for city
  const getMopsContact = () => {
    const cityLower = result?.city.toLowerCase() || '';
    return MOPS_CONTACTS[cityLower] || null;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-accent-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Powrót do strony głównej</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Hero Section */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 md:p-8 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-accent-50 rounded-lg">
              <Calculator className="w-8 h-8 text-accent-600" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
                Kalkulator Kosztów Opieki
              </h1>
              <p className="text-neutral-600 text-lg">
                Oszacuj budżet na opiekę i porównaj z oficjalnymi cenami DPS/ŚDS w Twoim regionie
              </p>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded">
            <p className="text-sm text-neutral-700">
              💡 Wykorzystujemy oficjalne dane cenowe publikowane przez Miejskie i Gminne Ośrodki Pomocy Społecznej (MOPS/OPS)
            </p>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 md:p-8 mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">
            Podaj dane do obliczeń
          </h2>

          {/* Income Input */}
          <div className="mb-6">
            <label htmlFor="income" className="block text-sm font-medium text-neutral-700 mb-2">
              1. Dochód miesięczny seniora (emerytura/renta)
            </label>
            <div className="relative">
              <input
                type="number"
                id="income"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="np. 3500"
                min="0"
                max="50000"
                step="100"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">
                zł
              </span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              Wpisz całkowity miesięczny dochód (emerytura + renta + inne świadczenia)
            </p>
          </div>

          {/* Województwo Select */}
          <div className="mb-6">
            <label htmlFor="wojewodztwo" className="block text-sm font-medium text-neutral-700 mb-2">
              2. Województwo
            </label>
            <select
              id="wojewodztwo"
              value={wojewodztwo}
              onChange={(e) => setWojewodztwo(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-lg"
            >
              <option value="małopolskie">Małopolskie</option>
              <option value="śląskie">Śląskie</option>
            </select>
          </div>

          {/* City Input */}
          <div className="mb-6">
            <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
              3. Miasto/Gmina
            </label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="np. Kraków, Wieliczka, Bochnia..."
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-lg"
            />
            <p className="text-sm text-neutral-500 mt-1">
              Wpisz miejscowość, w której szukasz placówki
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full bg-accent-600 hover:bg-accent-700 disabled:bg-neutral-300 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Obliczam...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5" />
                Oblicz budżet i porównaj ceny
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div id="results-section" className="space-y-6">
            
            {/* Alert Message (if all need subsidy) */}
            {result.allNeedSubsidy && result.facilitiesWithPrices.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">
                      ⚠️ Żadna placówka z oficjalną ceną nie mieści się w budżecie seniora
                    </h3>
                    <p className="text-sm text-red-800">
                      To normalna sytuacja! Oznacza to, że <strong>musisz złożyć wniosek o dopłatę</strong>, 
                      który ureguluje zobowiązanie finansowe Rodziny i Gminy. Poniżej znajdziesz szczegóły.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info about facilities without prices */}
            {result.facilitiesWithoutPrices.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      ℹ️ Znaleziono {result.facilitiesWithoutPrices.length} placówek bez oficjalnej ceny
                    </h3>
                    <p className="text-sm text-blue-800">
                      {result.facilitiesWithoutPrices.filter(f => f.typ_placowki === 'ŚDS').length > 0 && (
                        <>Ośrodki ŚDS często oferują opiekę dzienną bezpłatnie lub za symboliczną opłatę. </>
                      )}
                      Skontaktuj się bezpośrednio z placówką w sprawie aktualnych opłat.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Budget Visualization */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 md:p-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">
                📊 Analiza Finansowa
              </h2>

              {/* Budget Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-600">
                    Dochód miesięczny
                  </span>
                  <span className="text-lg font-bold text-neutral-900">
                    {formatCurrency(result.income)}
                  </span>
                </div>

                <div className="h-10 bg-neutral-200 rounded-lg overflow-hidden flex">
                  <div 
                    className="bg-accent-600 flex items-center justify-center text-white text-sm font-semibold"
                    style={{ width: '70%' }}
                  >
                    70% na opiekę
                  </div>
                  <div 
                    className="bg-success-500 flex items-center justify-center text-white text-sm font-semibold"
                    style={{ width: '30%' }}
                  >
                    30% na życie
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-accent-700 font-medium">
                    {formatCurrency(result.maxContribution)}
                  </span>
                  <span className="text-success-700 font-medium">
                    {formatCurrency(result.remainingFunds)}
                  </span>
                </div>
              </div>

              {/* Key Numbers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-accent-50 rounded-lg p-4">
                  <div className="text-sm text-accent-700 font-medium mb-1">
                    Maksymalny wkład na DPS (70%)
                  </div>
                  <div className="text-2xl font-bold text-accent-900">
                    {formatCurrency(result.maxContribution)}
                  </div>
                </div>
                <div className="bg-success-50 rounded-lg p-4">
                  <div className="text-sm text-success-700 font-medium mb-1">
                    Zostanie "na rękę" (30%)
                  </div>
                  <div className="text-2xl font-bold text-success-900">
                    {formatCurrency(result.remainingFunds)}
                  </div>
                </div>
              </div>

              {/* Legal Info */}
              <div className="mt-6 text-sm text-neutral-600 bg-neutral-50 p-4 rounded-lg">
                ℹ️ Zgodnie z ustawą o pomocy społecznej, senior może przeznaczyć <strong>maksymalnie 70% dochodu</strong> na opiekę w DPS/ŚDS. 
                Pozostałe 30% musi pozostać do dyspozycji seniora.
              </div>
            </div>

            {/* Family Disclaimer (if needed) */}
            {result.allNeedSubsidy && result.facilitiesWithPrices.length > 0 && (
              <div className="bg-warning-50 border-l-4 border-warning-500 p-6 rounded-lg">
                <h3 className="font-semibold text-warning-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Pamiętaj o zobowiązaniach rodziny
                </h3>
                <p className="text-sm text-warning-800">
                  Zanim Gmina (MOPS) dopłaci, Ośrodek ustala, czy <strong>małżonek lub zstępni (dzieci, wnuki)</strong> są 
                  zobowiązani pokryć brakującą kwotę. To może zmienić ostateczne obciążenie Gminy.
                </p>
              </div>
            )}

            {/* MOPS Contact Card (if no affordable options) */}
            {result.allNeedSubsidy && result.facilitiesWithPrices.length > 0 && getMopsContact() && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Kluczowy kontakt: Wniosek o dopłatę
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-blue-900">Właściwy urząd dla {result.city}:</span>
                    <br />
                    <span className="text-blue-800">{getMopsContact()!.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Telefon:</span>
                    <br />
                    <a href={`tel:${getMopsContact()!.phone.replace(/\s/g, '')}`} className="text-accent-600 hover:text-accent-700 font-semibold">
                      {getMopsContact()!.phone}
                    </a>
                  </div>
                  <div>
                    <span className="font-medium text-blue-900">Adres:</span>
                    <br />
                    <span className="text-blue-800">{getMopsContact()!.address}</span>
                  </div>
                </div>
                <p className="text-sm text-blue-700 mt-4 bg-blue-100 p-3 rounded">
                  💡 Zadzwoń i umów się na rozmowę. To pierwszy krok do uzyskania dopłaty Gminy.
                </p>
              </div>
            )}

            {/* Comparison Table */}
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-neutral-200">
                <h2 className="text-xl font-semibold text-neutral-900">
                  Porównanie placówek w: {result.city}
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Znaleziono {result.facilities.length} {result.facilities.length === 1 ? 'placówkę' : result.facilities.length < 5 ? 'placówki' : 'placówek'}
                  {result.facilitiesWithPrices.length > 0 && ` (${result.facilitiesWithPrices.length} z oficjalną ceną)`}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Placówka
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Typ
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Cena/miesiąc
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Twoja sytuacja
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                        Akcja
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {result.facilities.map((facility) => {
                      const hasPrice = facility.koszt_pobytu && facility.koszt_pobytu > 0;
                      const difference = hasPrice ? facility.koszt_pobytu! - result.maxContribution : 0;
                      const isAffordable = hasPrice && difference <= 0;

                      return (
                        <tr key={facility.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-neutral-900">
                              {facility.nazwa}
                            </div>
                            <div className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {facility.miejscowosc}, pow. {facility.powiat}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              facility.typ_placowki === 'DPS' 
                                ? 'bg-primary-100 text-primary-800' 
                                : 'bg-secondary-100 text-secondary-800'
                            }`}>
                              {facility.typ_placowki}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {hasPrice ? (
                              <div className="text-sm font-semibold text-neutral-900">
                                {formatCurrency(facility.koszt_pobytu!)}
                              </div>
                            ) : (
                              <div className="text-sm text-neutral-500 italic">
                                Brak danych
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {hasPrice ? (
                              isAffordable ? (
                                <div className="flex items-center gap-2 text-success-700">
                                  <TrendingDown className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    Budżet wystarczający
                                  </span>
                                </div>
                              ) : (
                                <div className="text-sm">
                                  <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                                    <TrendingUp className="w-4 h-4" />
                                    Brakuje: {formatCurrency(difference)}
                                  </div>
                                  <div className="text-xs text-neutral-600">
                                    (Potencjalna dopłata Rodziny/Gminy)
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="text-sm">
                                <div className="flex items-center gap-2 text-blue-700 mb-1">
                                  <Info className="w-4 h-4" />
                                  <span className="font-medium">Brak oficjalnej ceny</span>
                                </div>
                                <div className="text-xs text-neutral-600">
                                  {facility.typ_placowki === 'ŚDS' 
                                    ? 'Opieka dzienna - często bezpłatna'
                                    : 'Skontaktuj się z placówką'
                                  }
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <Link
                                href={`/placowka/${facility.id}`}
                                className="text-accent-600 hover:text-accent-700 text-sm font-medium"
                              >
                                Zobacz profil →
                              </Link>
                              {facility.telefon && (
                                <a
                                  href={`tel:${facility.telefon.replace(/\s/g, '')}`}
                                  className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" />
                                  {facility.telefon}
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {result.hasAffordable || result.facilitiesWithoutPrices.length > 0 ? (
                <button
                  onClick={navigateToSearch}
                  className="flex-1 bg-accent-600 hover:bg-accent-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Zobacz placówki w wyszukiwarce
                </button>
              ) : (
                <button
                  onClick={() => alert('Funkcja w przygotowaniu - link do szczegółowej instrukcji o procedurze dopłat MOPS')}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
                >
                  Zobacz procedurę uzyskania dopłaty MOPS
                </button>
              )}
            </div>

            {/* Legal Disclaimer */}
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-6">
              <p className="text-sm text-warning-900">
                ℹ️ <strong>Ważne:</strong> To szacunkowa kalkulacja możliwości finansowych. 
                Ostateczną i aktualną cenę oraz wysokość dopłaty Gminy ustala Ośrodek Pomocy Społecznej 
                na podstawie indywidualnego wywiadu środowiskowego. 
                Zawsze skonsultuj się z lokalnym MOPS/OPS przed podjęciem decyzji.
              </p>
            </div>

            {/* Lead Magnet Placeholder */}
            <div className="bg-neutral-100 border border-dashed border-neutral-300 rounded-lg p-8 text-center">
              <p className="text-neutral-600 italic">
                💡 Funkcja <strong>"Wyślij szczegółowy raport PDF na email"</strong> będzie dostępna wkrótce
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}