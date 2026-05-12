'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { ArrowLeft, AlertCircle, Phone, MapPin, CheckCircle2, Search, Heart, ArrowLeftRight, ChevronRight, X, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { mapPowiatToCity } from '@/lib/powiat-to-city';
import { getGminaForCity } from '@/lib/city-to-gmina';
import { addFavorite, removeFavorite, isFavorite, getFavorites } from '@/src/utils/favorites';

const cityLocative: Record<string, string> = {
  'kraków': 'Krakowie', 'nowy sącz': 'Nowym Sączu', 'tarnów': 'Tarnowie',
  'bochnia': 'Bochni', 'brzesko': 'Brzesku', 'chrzanów': 'Chrzanowie',
  'dąbrowa tarnowska': 'Dąbrowie Tarnowskiej', 'gorlice': 'Gorlicach',
  'limanowa': 'Limanowej', 'miechów': 'Miechowie', 'myślenice': 'Myślenicach',
  'nowy targ': 'Nowym Targu', 'olkusz': 'Olkuszu', 'oświęcim': 'Oświęcimiu',
  'proszowice': 'Proszowicach', 'sucha beskidzka': 'Suchej Beskidzkiej',
  'zakopane': 'Zakopanem', 'wadowice': 'Wadowicach', 'wieliczka': 'Wieliczce',
  'bielsko-biała': 'Bielsku-Białej',
};
const toCityLocative = (c: string) =>
  cityLocative[c.toLowerCase().trim()] ?? c.charAt(0).toUpperCase() + c.slice(1);

const powiatGenitiveMap: Record<string, string> = {
  'krakowski': 'krakowskiego', 'bocheński': 'bocheńskiego', 'brzeski': 'brzeskiego',
  'chrzanowski': 'chrzanowskiego', 'dąbrowski': 'dąbrowskiego', 'gorlicki': 'gorlickiego',
  'limanowski': 'limanowskiego', 'miechowski': 'miechowskiego', 'myślenicki': 'myślenickiego',
  'nowosądecki': 'nowosądeckiego', 'nowotarski': 'nowotarskiego', 'olkuski': 'olkuskiego',
  'oświęcimski': 'oświęcimskiego', 'proszowicki': 'proszowickiego', 'suski': 'suskiego',
  'tarnowski': 'tarnowskiego', 'tatrzański': 'tatrzańskiego', 'wadowicki': 'wadowickiego',
  'wielicki': 'wielickiego', 'm. kraków': 'Krakowa', 'm. tarnów': 'Tarnowa',
  'm. nowy sącz': 'Nowego Sącza',
};
const toPowiatGenitive = (p: string) => {
  const k = p.toLowerCase().trim();
  if (powiatGenitiveMap[k]) return powiatGenitiveMap[k];
  if (/[kszcń]ki$/.test(k)) return k.slice(0, -1) + 'iego';
  return p;
};

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

interface LookupResult {
  city: string;
  facilities: Facility[];
  facilitiesWithPrices: Facility[];
  mopsContact: MopsContact | null;
  mopsFallbackUsed: boolean;
  mopsFallbackCity?: string;
  powiatFallbackUsed: boolean;
  powiatFallbackName?: string;
  ambiguousPowiaty?: string[];
  mopsPerPowiat?: Record<string, MopsContact | null>;
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

const fmt = (n: number) =>
  new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(n);

// Animowany licznik — nakręca się od aktualnej wartości do nowej (350ms, ease-out)
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = displayRef.current;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const startTime = performance.now();
    const duration = 350;

    const tick = () => {
      const t = Math.min((performance.now() - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      const current = Math.round(from + (value - from) * eased);
      displayRef.current = current;
      setDisplay(current);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else rafRef.current = null;
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <>{fmt(display)}</>;
}

async function trackAppEvent(eventType: string, metadata: Record<string, unknown>) {
  try {
    await fetch('/api/analytics/app-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, metadata, language: navigator?.language }),
    });
  } catch { /* silent */ }
}

// ─── Field sub-components ────────────────────────────────────────────────────

function CalcField({ label, help, children }: { label: string; help: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      {children}
      <p className="text-xs text-slate-400 leading-relaxed">{help}</p>
    </div>
  );
}

function NumInput({ value, onChange, placeholder, min = '0', max, step = '100' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  min?: string; max?: string; step?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min} max={max} step={step}
      inputMode="numeric"
      className="w-full bg-stone-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-xl font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
    />
  );
}

// ─── Result card ─────────────────────────────────────────────────────────────

function ResultCard({ label, value, accent }: { label: string; value: number; accent?: 'green' | 'blue' | 'amber' }) {
  const bg = accent === 'green' ? 'bg-emerald-600' : accent === 'blue' ? 'bg-blue-600' : accent === 'amber' ? 'bg-amber-500' : 'bg-white/10';
  return (
    <div className={`${bg} rounded-xl p-4`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1.5">{label}</div>
      <div className="text-2xl font-bold font-mono text-white"><AnimatedNumber value={value} /></div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function KalkulatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Calculator inputs (live, no API)
  const [hasInteracted, setHasInteracted] = useState(false);
  const interact = (setter: (v: string) => void) => (v: string) => { setter(v); setHasInteracted(true); };

  const [dpsCost, setDpsCost] = useState(searchParams.get('cost') || '6000');
  const [seniorIncome, setSeniorIncome] = useState(searchParams.get('income') || '3500');
  const [spouseIncome, setSpouseIncome] = useState('0');
  const [numChildren, setNumChildren] = useState('2');
  const [childSituation, setChildSituation] = useState<'rodzina' | 'samotnie'>('rodzina');
  const [childHouseholdIncome, setChildHouseholdIncome] = useState('8000');
  const [childHouseholdPersons, setChildHouseholdPersons] = useState('3');

  // DPS lookup state
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [selectedPowiat, setSelectedPowiat] = useState<string | null>(null);
  const [showAllFacilities, setShowAllFacilities] = useState(false);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  useEffect(() => {
    const sync = () => setSavedIds(getFavorites().map(f => f.id));
    sync();
    window.addEventListener('favoritesChanged', sync);
    return () => window.removeEventListener('favoritesChanged', sync);
  }, []);

  // ── Live calculation (1:1 port z JS stasik-kancelaria.pl) ─────────────────
  const PROG_SAMOTNY = 3030;   // 300% × 1 010 zł
  const PROG_RODZINA = 2469;   // 300% × 823 zł, per osoba

  const koszt       = Math.max(0, parseFloat(dpsCost) || 0);
  const incSenior   = Math.max(0, parseFloat(seniorIncome) || 0);
  const incSpouse   = Math.max(0, parseFloat(spouseIncome) || 0);
  const nKids       = Math.max(0, parseInt(numChildren) || 0);
  const incChild    = Math.max(0, parseFloat(childHouseholdIncome) || 0);
  const nPersons    = childSituation === 'samotnie' ? 1 : Math.max(1, parseInt(childHouseholdPersons) || 1);

  const oplataSeniora = koszt > 0 ? Math.min(incSenior * 0.7, koszt) : 0;
  const po1           = Math.max(0, koszt - oplataSeniora);

  const oplataM = (incSpouse > PROG_SAMOTNY && po1 > 0)
    ? Math.min(incSpouse - PROG_SAMOTNY, po1) : 0;
  const po2 = Math.max(0, po1 - oplataM);

  const prog300Dz    = childSituation === 'samotnie' ? PROG_SAMOTNY : PROG_RODZINA * nPersons;
  const nadwyzkaDz   = Math.max(0, incChild - prog300Dz);
  const oplataD      = (nKids > 0 && po2 > 0 && nadwyzkaDz > 0)
    ? Math.min(nadwyzkaDz * nKids, po2) : 0;

  const oplataGminy  = koszt > 0 ? Math.max(0, koszt - oplataSeniora - oplataM - oplataD) : 0;

  const dochodNaOsobe  = incChild / nPersons;
  const progNaOsobe    = childSituation === 'samotnie' ? PROG_SAMOTNY : PROG_RODZINA;
  const dzieciZwolnione = nKids > 0 && dochodNaOsobe <= progNaOsobe;

  let calcWarning = '';
  if (koszt === 0) {
    calcWarning = '';
  } else if (oplataSeniora >= koszt) {
    calcWarning = `Mieszkaniec pokrywa pełny koszt z własnego dochodu (70% × ${fmt(incSenior)} ≥ ${fmt(koszt)}). Rodzina ani gmina nie dopłacają.`;
  } else if (dzieciZwolnione) {
    calcWarning = `Dochód na osobę w gospodarstwie dziecka (${fmt(dochodNaOsobe)}) nie przekracza progu 300% kryterium (${fmt(progNaOsobe)} zł). Dzieci są zwolnione z dopłaty — resztę pokrywa gmina (art. 61 ust. 2 ups).`;
  } else if (nKids === 0) {
    calcWarning = `Brak zstępnych zobowiązanych — pozostałą część kosztu pokrywa gmina (po wpłacie mieszkańca${oplataM > 0 ? ' i małżonka' : ''}).`;
  }

  // ── MOPS fetch helpers ────────────────────────────────────────────────────

  const fetchMopsContact = async (cityName: string): Promise<MopsContact | null> => {
    try {
      const res = await fetch(`/api/mops?city=${encodeURIComponent(cityName.toLowerCase())}`);
      return res.ok ? await res.json() : null;
    } catch { return null; }
  };

  const fetchMopsWithFallback = async (cityName: string, powiatName: string) => {
    let mops = await fetchMopsContact(cityName);
    if (mops) return { mops, usedFallback: false };

    const norm = cityName.toLowerCase().trim()
      .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e').replace(/ł/g,'l')
      .replace(/ń/g,'n').replace(/ó/g,'o').replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
      .replace(/\s+/g,'-');
    const gminaCity = getGminaForCity(norm);
    if (gminaCity && gminaCity !== norm) {
      mops = await fetchMopsContact(gminaCity);
      if (mops) return { mops, usedFallback: true, fallbackCity: gminaCity };
    }

    const fallbackCity = mapPowiatToCity(powiatName);
    if (fallbackCity) {
      mops = await fetchMopsContact(fallbackCity);
      if (mops) return { mops, usedFallback: true, fallbackCity };
    }
    return { mops: null, usedFallback: false };
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoError('Twoja przeglądarka nie obsługuje geolokalizacji.');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pl`,
            { headers: { 'User-Agent': 'KompasSeniora/1.0' } }
          );
          const data = await res.json();
          const detected =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality ||
            '';
          if (detected) {
            setCity(detected);
            // krótkie opóźnienie żeby React zdążył zaktualizować city przed wywołaniem lookup
            setTimeout(() => {
              setGeoLoading(false);
            }, 100);
          } else {
            setGeoError('Nie udało się określić miejscowości. Wpisz ją ręcznie.');
            setGeoLoading(false);
          }
        } catch {
          setGeoError('Błąd geolokalizacji. Spróbuj ponownie.');
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Dostęp do lokalizacji zablokowany — włącz w ustawieniach przeglądarki.');
        } else {
          setGeoError('Nie można określić lokalizacji. Wpisz miasto ręcznie.');
        }
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  };


  // ── DPS lookup ────────────────────────────────────────────────────────────

  const handleLookup = async () => {
    if (!city.trim() || city.trim().length < 2) {
      setLookupError('Proszę podać nazwę miasta lub gminy.');
      return;
    }
    setLookupError('');
    setLookupResult(null);
    setShowAllFacilities(false);
    setSelectedPowiat(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(city)}&woj=ma%C5%82opolskie&typ=DPS`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const facilities: Facility[] = data.results || [];

      if (facilities.length === 0) {
        setLookupError(`Nie znaleźliśmy DPS w okolicy "${city}". Spróbuj wpisać inne miasto lub powiat.`);
        setLoading(false);
        return;
      }

      const withPrices = facilities
        .filter(f => f.koszt_pobytu && f.koszt_pobytu > 0)
        .sort((a, b) => a.koszt_pobytu! - b.koszt_pobytu!);
      const sorted = [
        ...withPrices,
        ...facilities.filter(f => !f.koszt_pobytu || f.koszt_pobytu === 0),
      ];
      const uniquePowiaty = [...new Set(sorted.map(f => f.powiat))];
      const powiatName = facilities[0]?.powiat || '';
      const { mops, usedFallback, fallbackCity } = await fetchMopsWithFallback(city, powiatName);

      let mopsPerPowiat: Record<string, MopsContact | null> | undefined;
      if (uniquePowiaty.length > 1) {
        const entries = await Promise.all(
          uniquePowiaty.map(async p => [p, (await fetchMopsWithFallback(city, p)).mops] as [string, MopsContact | null])
        );
        mopsPerPowiat = Object.fromEntries(entries);
      }

      const powiatFallbackUsed = !!(data.terytSuggestion?.found && facilities.length > 0);

      setLookupResult({
        city,
        facilities: sorted,
        facilitiesWithPrices: withPrices,
        mopsContact: mops,
        mopsFallbackUsed: usedFallback,
        mopsFallbackCity: fallbackCity,
        powiatFallbackUsed,
        powiatFallbackName: powiatFallbackUsed ? (facilities[0]?.powiat || undefined) : undefined,
        ambiguousPowiaty: uniquePowiaty.length > 1 ? uniquePowiaty : undefined,
        mopsPerPowiat,
      });

      if (uniquePowiaty.length > 1) {
        const topPowiat = data.terytSuggestion?.powiat;
        if (topPowiat && uniquePowiaty.includes(topPowiat)) setSelectedPowiat(topPowiat);
      }

      // Pre-fill dpsCost with cheapest facility found
      if (withPrices.length > 0) {
        const cheapest = Math.min(...withPrices.map(f => f.koszt_pobytu!));
        setDpsCost(String(cheapest));
      }

      trackAppEvent('calculator_lookup', { city, facilities_found: facilities.length });
    } catch {
      setLookupError('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (facility: Facility) => {
    if (isFavorite(facility.id)) {
      removeFavorite(facility.id);
    } else {
      addFavorite({
        id: facility.id, nazwa: facility.nazwa, miejscowosc: facility.miejscowosc,
        powiat: facility.powiat, typ_placowki: facility.typ_placowki,
        koszt_pobytu: facility.koszt_pobytu, telefon: facility.telefon ?? null,
        ulica: null, kod_pocztowy: null, email: null, www: null,
        liczba_miejsc: null, profil_opieki: facility.profil_opieki ?? null,
        addedAt: new Date().toISOString(),
      });
    }
    window.dispatchEvent(new Event('favoritesChanged'));
  };

  const toggleCompare = (id: number) =>
    setCompareIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : prev.length >= 3 ? prev : [...prev, id]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <div className="max-w-[1100px] mx-auto px-6 py-12">

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-10">
          <ArrowLeft size={14} /> Strona główna
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <span className="h-px w-10 bg-emerald-600" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-700">Kalkulator kosztów</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight mb-3">
            Ile naprawdę zapłaci Twoja rodzina?
          </h1>
          <p className="text-slate-500 text-base max-w-2xl leading-relaxed mb-8">
            Cena widoczna na karcie DPS to koszt utrzymania placówki — nie kwota z Twojego konta.
            Senior płaci najwyżej <strong className="text-slate-700">70% swojej emerytury</strong>.
            Rodzina dopłaca tylko wtedy, gdy jej dochód przekracza ustawowy próg —
            w przeciwnym razie brakującą kwotę <strong className="text-slate-700">pokrywa gmina</strong>.
          </p>

          {/* 3-step explainer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            {[
              { step: '1', title: 'Senior płaci z emerytury', desc: 'Maksymalnie 70% dochodu — ustawowa granica, której MOPS nie może przekroczyć.' },
              { step: '2', title: 'Rodzina dopłaca nadwyżkę', desc: 'Tylko jeśli dochód przekracza 3 030 zł (singiel) lub 2 469 zł/os. w rodzinie.' },
              { step: '3', title: 'Gmina pokrywa resztę', desc: 'Jeśli suma seniora i rodziny nie pokrywa kosztu — gmina dopłaca z urzędu.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                <div>
                  <p className="text-sm font-black text-slate-900 mb-0.5">{title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2-column layout: form + sticky results ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start mb-16">

          {/* ── LEFT: Form ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-7">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <CalcField
                label="Miesięczny koszt utrzymania w DPS (zł)"
                help="Ustala wójt/burmistrz. W 2026 r. średnio 5 000–7 500 zł. Możesz pobrać z wyszukiwarki poniżej."
              >
                <NumInput value={dpsCost} onChange={interact(setDpsCost)} placeholder="6000" min="0" max="20000" />
              </CalcField>
              <CalcField
                label="Dochód netto mieszkańca DPS (zł)"
                help="Emerytura, renta, inne świadczenia po odliczeniu składek zdrowotnych. Mieszkaniec płaci max 70% tego dochodu."
              >
                <NumInput value={seniorIncome} onChange={setSeniorIncome} placeholder="3500" />
              </CalcField>
            </div>

            <CalcField
              label="Dochód netto małżonka mieszkańca (zł, opcjonalnie)"
              help="Małżonek jest pierwszy w kolejności po mieszkańcu (art. 61 ust. 1 pkt 2). Dopłaca nadwyżkę ponad 3 030 zł. Wpisz 0 jeśli brak małżonka."
            >
              <NumInput value={spouseIncome} onChange={setSpouseIncome} placeholder="0" />
            </CalcField>

            <CalcField
              label="Liczba dzieci (zstępnych) zobowiązanych"
              help="Dzieci, wnuki, prawnuki mieszkańca. Przyjmujemy, że wszyscy mają dochód na podobnym poziomie. Wpisz 0 jeśli brak."
            >
              <NumInput value={numChildren} onChange={setNumChildren} placeholder="0" min="0" max="10" step="1" />
            </CalcField>

            {nKids > 0 && (
              <>
                <CalcField
                  label="Sytuacja rodzinna dziecka"
                  help="Wpływa na próg obowiązku: 3 030 zł (samotne) lub 2 469 zł/os. w rodzinie."
                >
                  <select
                    value={childSituation}
                    onChange={e => { setChildSituation(e.target.value as 'rodzina' | 'samotnie'); setHasInteracted(true); }}
                    className="w-full bg-stone-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="rodzina">Dziecko ma rodzinę (małżonek, dzieci)</option>
                    <option value="samotnie">Dziecko gospodaruje samotnie</option>
                  </select>
                </CalcField>

                <CalcField
                  label={childSituation === 'samotnie' ? 'Dochód netto dziecka (zł)' : 'Łączny dochód netto gospodarstwa dziecka (zł)'}
                  help={childSituation === 'samotnie'
                    ? `Próg obowiązku: 3 030 zł. Poniżej tego → dziecko zwolnione z dopłaty. Nie wliczamy 800+.`
                    : `Łączny dochód netto (dziecko + małżonek + wnuki). Próg: 2 469 zł/os. w rodzinie. Nie wliczamy 800+.`}
                >
                  <NumInput value={childHouseholdIncome} onChange={setChildHouseholdIncome} placeholder="8000" step="500" />
                </CalcField>

                {childSituation === 'rodzina' && (
                  <CalcField
                    label="Liczba osób w gospodarstwie dziecka"
                    help="Dziecko + małżonek + osoby na utrzymaniu (wnuki itp.). Używane do wyliczenia dochodu na osobę."
                  >
                    <NumInput value={childHouseholdPersons} onChange={setChildHouseholdPersons} placeholder="3" min="1" max="10" step="1" />
                  </CalcField>
                )}
              </>
            )}

            {/* Legal notes */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                'Rodzeństwo NIE jest zobowiązane — zamknięty katalog art. 61',
                'Nieruchomości nie wchodzą w obliczenia — tylko bieżący dochód',
                'Art. 64 ups — zwolnienie przy chorobie, bezrobociu, niepełnosprawności',
              ].map(note => (
                <div key={note} className="flex items-start gap-2 text-xs text-slate-500">
                  <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Live results (sticky) ── */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-white">

              {/* 4 wiersze — styl rachunku */}
              <div className="space-y-0 mb-2">
                {([
                  { key: 'senior', label: 'Mieszkaniec DPS',    value: oplataSeniora, color: 'bg-emerald-500', dot: 'bg-emerald-500' },
                  { key: 'malzon', label: 'Małżonek',           value: oplataM,       color: 'bg-blue-400',   dot: 'bg-blue-400'   },
                  { key: 'dzieci', label: `Dzieci (×${nKids})`, value: oplataD,       color: 'bg-amber-400',  dot: 'bg-amber-400'  },
                  { key: 'gmina',  label: 'Gmina',              value: oplataGminy,   color: 'bg-slate-500',  dot: 'bg-slate-500'  },
                ] as { key: string; label: string; value: number; color: string; dot: string }[]).map(({ key, label, value, color, dot }) => {
                  const pct = koszt > 0 ? (value / koszt) * 100 : 0;
                  return (
                    <div key={key} className="py-3 border-b border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                          <span className="text-sm text-slate-300">{label}</span>
                        </div>
                        <span className="text-sm font-bold font-mono text-white tabular-nums">
                          <AnimatedNumber value={value} />
                        </span>
                      </div>
                      <div className="w-full h-0.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`${color} h-full rounded-full transition-[width] duration-[350ms] ease-out`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Suma na dole — jak w rachunku */}
              <div className="flex items-center justify-between pt-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Łącznie / mc</span>
                <span className="text-3xl font-bold font-mono text-white">
                  <AnimatedNumber value={koszt} />
                </span>
              </div>

              {/* Warning */}
              {calcWarning && (
                <div className="bg-white/8 border border-white/10 rounded-xl p-3 mb-4 text-xs text-slate-300 leading-relaxed">
                  {calcWarning}
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-slate-400 leading-relaxed mt-4">
                Wynik orientacyjny. Ostateczną kwotę ustala MOPS/GOPS indywidualnie po przeprowadzeniu wywiadu środowiskowego.
              </p>
            </div>
          </div>
        </div>

        {/* ── DPS Lookup section ── */}
        <div className="border-t-2 border-slate-200 pt-12">
          <div className="flex items-center gap-4 mb-4">
            <span className="h-px w-10 bg-emerald-600" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-700">Wyszukiwarka DPS</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Znajdź DPS w Twojej okolicy</h2>
          <p className="text-slate-500 text-sm mb-8 max-w-xl">
            Podaj miasto lub miejscowość — znajdziemy publiczne DPS w powiecie i automatycznie
            podstawimy najtańszą cenę do kalkulatora powyżej.
          </p>

          <div className="flex gap-3 mb-2 max-w-lg">
            <div className="relative flex-1">
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                placeholder="np. Kraków, Wieliczka, Nowy Sącz…"
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-5 py-4 text-base font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
              <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
            <button
              onClick={handleLookup}
              disabled={loading || !city.trim()}
              className={`px-7 py-4 rounded-xl font-black text-[12px] uppercase tracking-widest transition-all active:scale-[0.98] flex items-center gap-2 ${
                !loading && city.trim()
                  ? 'bg-slate-900 hover:bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Search size={15} /> Szukaj</>
              }
            </button>
          </div>

          {/* Geolokalizacja */}
          <div className="flex items-center gap-3 mb-4 max-w-lg">
            <button
              onClick={handleGeolocate}
              disabled={geoLoading}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
            >
              {geoLoading
                ? <div className="w-3.5 h-3.5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                : <MapPin size={14} />
              }
              {geoLoading ? 'Wykrywam lokalizację…' : 'Szukaj w mojej okolicy'}
            </button>
            {geoError && <span className="text-xs text-rose-500">{geoError}</span>}
          </div>

          {lookupError && (
            <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-bold mb-6 max-w-lg">
              <AlertCircle size={15} /> {lookupError}
            </div>
          )}

          {lookupResult && (() => {
            const activeFacilities = selectedPowiat
              ? lookupResult.facilities.filter(f => f.powiat === selectedPowiat)
              : lookupResult.facilities;
            const activeMops = selectedPowiat && lookupResult.mopsPerPowiat
              ? lookupResult.mopsPerPowiat[selectedPowiat]
              : lookupResult.mopsContact;
            const activeFallbackCity = selectedPowiat ? undefined : lookupResult.mopsFallbackCity;
            const activeFallbackUsed = selectedPowiat ? false : lookupResult.mopsFallbackUsed;

            return (
              <div className="space-y-12 mt-6">

                {/* Powiat selector */}
                {lookupResult.ambiguousPowiaty && (
                  <section>
                    <p className="text-sm text-slate-600 mb-3">
                      Miejscowość <strong>{lookupResult.city}</strong> występuje w kilku powiatach — wybierz właściwy:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {lookupResult.ambiguousPowiaty.map(p => (
                        <button
                          key={p}
                          onClick={() => setSelectedPowiat(p)}
                          className={`px-5 py-2 rounded-xl text-sm font-black uppercase tracking-wider border-2 transition-all ${
                            selectedPowiat === p
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-500 hover:text-emerald-700'
                          }`}
                        >
                          powiat {p}
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Facility list */}
                <section>
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">
                        {lookupResult.powiatFallbackUsed
                          ? `Najbliższe DPS w okolicy ${lookupResult.city}`
                          : `DPS w ${toCityLocative(lookupResult.city)}`}
                      </h3>
                      {lookupResult.powiatFallbackUsed && lookupResult.powiatFallbackName && !lookupResult.ambiguousPowiaty && (
                        <p className="text-sm text-slate-500 mt-1">
                          Brak DPS bezpośrednio w {lookupResult.city} — pokazujemy placówki z powiatu <strong>{toPowiatGenitive(lookupResult.powiatFallbackName)}</strong>.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => router.push(`/search?q=${encodeURIComponent(lookupResult.city)}&woj=ma%C5%82opolskie&typ=dps`)}
                      className="text-[11px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1 hover:text-slate-900 transition-colors shrink-0 ml-4"
                    >
                      Pokaż w wyszukiwarce <ChevronRight size={13} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(showAllFacilities ? activeFacilities : activeFacilities.slice(0, 6)).map(facility => {
                      const hasPrice = !!facility.koszt_pobytu;
                      const seniorMax = incSenior * 0.7;
                      const gap = hasPrice ? facility.koszt_pobytu! - seniorMax : 0;
                      const isCovered = hasPrice && gap <= 0;

                      return (
                        <div
                          key={facility.id}
                          className="bg-white border border-stone-200 rounded-2xl p-5 lg:p-6 hover:border-emerald-300 transition-all flex flex-col sm:flex-row justify-between items-start gap-5"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700">DPS</span>
                              <span className="text-[11px] text-slate-400 font-bold uppercase">{facility.miejscowosc}, pow. {facility.powiat}</span>
                            </div>
                            <h4 className="text-lg font-black text-slate-900 leading-tight mb-1.5">{facility.nazwa}</h4>
                            {facility.telefon && (
                              <a href={`tel:${facility.telefon.replace(/\s/g,'')}`} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                                <Phone size={10} /> {facility.telefon}
                              </a>
                            )}
                          </div>

                          <div className="w-full sm:w-auto sm:min-w-[200px] bg-stone-50 rounded-xl p-4 border border-stone-100 flex-shrink-0">
                            {!hasPrice ? (
                              <div className="text-sm font-bold text-slate-400 mb-3">Cena na zapytanie</div>
                            ) : isCovered ? (
                              <div className="text-sm font-black text-emerald-600 flex items-center gap-1.5 mb-3">
                                <CheckCircle2 size={14} /> Pokryte z emerytury
                              </div>
                            ) : (
                              <div className="mb-3">
                                <div className="text-xs font-black text-slate-900">{fmt(facility.koszt_pobytu!)}<span className="text-slate-400 font-normal">/mc</span></div>
                                <div className="text-xs text-rose-600 font-bold mt-0.5">Brakuje: {fmt(gap)}</div>
                              </div>
                            )}

                            {hasPrice && !isCovered && (
                              <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden flex mb-3">
                                <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (seniorMax / facility.koszt_pobytu!) * 100)}%` }} />
                                <div className="bg-amber-400 h-full" style={{ width: `${Math.min(100, (Math.max(0,gap) / facility.koszt_pobytu!) * 100)}%` }} />
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              {hasPrice && (
                                <button
                                  onClick={() => setDpsCost(String(facility.koszt_pobytu))}
                                  title="Podstaw tę cenę do kalkulatora"
                                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider transition-all text-center"
                                >
                                  Użyj ceny ↑
                                </button>
                              )}
                              <button onClick={() => toggleCompare(facility.id)} title="Porównaj"
                                className={`p-1.5 rounded-lg border-2 transition-all ${compareIds.includes(facility.id) ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-400 hover:border-slate-400'}`}>
                                <ArrowLeftRight size={13} />
                              </button>
                              <button onClick={() => toggleFavorite(facility)} title="Ulubione"
                                className={`p-1.5 rounded-lg border-2 transition-all ${savedIds.includes(facility.id) ? 'text-emerald-600 border-emerald-200' : 'border-slate-200 text-slate-400 hover:border-slate-400'}`}>
                                <Heart size={13} className={savedIds.includes(facility.id) ? 'fill-current' : ''} />
                              </button>
                              <Link href={`/placowka/${facility.id}`}
                                className="text-[10px] font-black text-slate-700 border-b-2 border-slate-300 hover:text-emerald-600 hover:border-emerald-500 transition-all pb-0.5 uppercase tracking-wide">
                                Szczegóły
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!showAllFacilities && activeFacilities.length > 6 && (
                    <button
                      onClick={() => setShowAllFacilities(true)}
                      className="mt-4 w-full py-4 border-2 border-slate-200 rounded-xl text-[11px] font-black text-slate-500 uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-700 transition-all"
                    >
                      Pokaż więcej ({activeFacilities.length - 6} kolejnych)
                    </button>
                  )}
                </section>

                {/* MOPS */}
                {(!lookupResult.ambiguousPowiaty || selectedPowiat) && (
                  <section>
                    <h3 className="text-xl font-black text-slate-900 mb-5">Właściwy ośrodek pomocy społecznej</h3>
                    {activeMops ? (
                      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden max-w-xl">
                        <div className="bg-emerald-600 px-6 py-4 flex items-center gap-3">
                          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                            <Phone className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">Wniosek o dopłatę gminy</p>
                            <h4 className="text-white font-black text-base leading-tight">{activeMops.name}</h4>
                          </div>
                        </div>
                        <div className="p-5 space-y-3">
                          {activeFallbackUsed && activeFallbackCity && (
                            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-xl text-sm text-amber-900">
                              Dla miejscowości <strong>{lookupResult.city}</strong> właściwym ośrodkiem jest {activeMops.typ} w <strong>{toCityLocative(activeFallbackCity)}</strong>.
                            </div>
                          )}
                          <a href={`tel:${activeMops.phone.replace(/\s/g,'')}`}
                            className="flex items-center gap-3 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-200 rounded-xl px-4 py-3 transition-colors">
                            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Phone size={14} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefon</p>
                              <p className="text-sm font-bold text-slate-800">{activeMops.phone}</p>
                            </div>
                          </a>
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeMops.address)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-200 rounded-xl px-4 py-3 transition-colors">
                            <div className="w-8 h-8 bg-stone-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <MapPin size={14} className="text-slate-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adres</p>
                              <p className="text-sm text-slate-700">{activeMops.address}</p>
                            </div>
                          </a>
                          {activeMops.website && (
                            <a href={activeMops.website} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-3 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-200 rounded-xl px-4 py-3 transition-colors">
                              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <ChevronRight size={14} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strona www</p>
                                <p className="text-sm text-emerald-600 truncate">{activeMops.website.replace(/^https?:\/\//,'')}</p>
                              </div>
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-xl">
                        <p className="text-sm text-slate-500 mb-4">Brak danych kontaktowych dla tego powiatu w naszej bazie.</p>
                        <a href={`https://www.google.com/search?q=MOPS+${encodeURIComponent(lookupResult.city)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-3 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-all">
                          <Search size={14} /> Szukaj MOPS {lookupResult.city} w Google
                        </a>
                      </div>
                    )}
                  </section>
                )}
              </div>
            );
          })()}
        </div>

        {/* Expert note */}
        <div className="mt-16 bg-emerald-900 text-white rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-center">
          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle size={24} className="text-emerald-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-black mb-1.5 uppercase tracking-tight">Potrzebujesz pomocy urzędowej?</h4>
            <p className="text-emerald-100 text-sm leading-relaxed opacity-80">
              Ostateczna decyzja o odpłatności zawsze należy do MOPS/GOPS. Pracownik socjalny przeprowadzi
              wywiad środowiskowy i ustali dokładne kwoty na podstawie Twojej indywidualnej sytuacji.
              Nie traktuj tego wyniku jako decyzji administracyjnej.
            </p>
          </div>
          <a href="/asystent?start=true"
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[12px] uppercase tracking-widest px-8 py-4 rounded-xl transition-all shrink-0 active:scale-95">
            Zapytaj AI
          </a>
        </div>

        {/* Comparison bar */}
        {compareIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl">
            <div className="bg-slate-900 text-white rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">Porównanie</p>
                <p className="text-sm font-bold">{compareIds.length} / 3 placówk{compareIds.length === 1 ? 'a' : 'i'}</p>
              </div>
              <button
                onClick={() => router.push(`/ulubione/porownaj?ids=${compareIds.join(',')}`)}
                disabled={compareIds.length < 2}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  compareIds.length >= 2 ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                Porównaj <ChevronRight size={15} />
              </button>
              <button onClick={() => setCompareIds([])} className="p-2 rounded-full hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
                <X size={15} />
              </button>
            </div>
          </div>
        )}
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
