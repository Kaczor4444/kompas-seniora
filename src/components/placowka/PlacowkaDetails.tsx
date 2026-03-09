"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getProfileOpiekiNazwy } from '@/src/data/profileopieki';
import { useAnalytics } from '@/src/hooks/useAnalytics';
import { isFavorite, addFavorite, removeFavorite } from '@/src/utils/favorites';
import {
  MapPin,
  Banknote,
  Bed,
  Users,
  Building2,
  Phone,
  Mail,
  Globe,
  ArrowLeft,
  Info,
  FileText,
  Share2,
  Heart,
  CheckCircle2,
  Trees,
  Utensils,
  Stethoscope,
  CalendarCheck,
  Clock,
  Shield,
  ShieldCheck,
  AlertCircle,
  ArrowLeftRight,
  HeartPulse,
  Book,
  Activity,
  Car,
  Cross,
  PenLine,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import dynamic from 'next/dynamic';

const FacilityMap = dynamic(() => import('@/components/FacilityMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
});

// Date formatting helpers
const formatPolishDate = (date: Date): string => {
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString('pl-PL', {
    month: '2-digit',
    year: 'numeric'
  });
};

const getSmartDateFormat = (date: Date): string => {
  const monthsAgo = Math.floor(
    (new Date().getTime() - date.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );

  // Jeśli mniej niż 12 miesięcy: "3 miesiące temu"
  if (monthsAgo < 12) {
    return formatDistanceToNow(date, { addSuffix: true, locale: pl });
  }

  // Jeśli więcej: "03/2024"
  return formatShortDate(date);
};

const isDataStale = (date: Date): boolean => {
  const monthsAgo = Math.floor(
    (new Date().getTime() - date.getTime()) / (30 * 24 * 60 * 60 * 1000)
  );
  return monthsAgo > 12;
};

interface Placowka {
  id: number;
  nazwa: string;
  typ_placowki: string;
  prowadzacy: string;
  ulica: string | null;
  miejscowosc: string;
  kod_pocztowy: string | null;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  telefon: string | null;
  email: string | null;
  www: string | null;
  facebook: string | null;
  liczba_miejsc: number | null;
  miejsca_za_zyciem?: number | null;
  profil_opieki: string | null;
  koszt_pobytu: number | null;
  data_aktualizacji: Date;
  zrodlo: string | null;
  latitude: number | null;
  longitude: number | null;
}

const SESSION_VIEWS_KEY = 'kompas-session-views';

function getSessionViewCount(): number {
  if (typeof sessionStorage === 'undefined') return 0;
  return parseInt(sessionStorage.getItem(SESSION_VIEWS_KEY) || '0');
}

function incrementSessionViews(): number {
  const count = getSessionViewCount() + 1;
  sessionStorage.setItem(SESSION_VIEWS_KEY, String(count));
  return count;
}

// Generate facility description from available data
function generateFacilityDescription(placowka: Placowka): string {
  const parts: string[] = [];

  // Type and location
  parts.push(`${placowka.typ_placowki} zlokalizowany w powiecie ${placowka.powiat}.`);

  // Provider
  if (placowka.prowadzacy) {
    parts.push(`Placówka prowadzona przez ${placowka.prowadzacy}.`);
  }

  // Capacity
  if (placowka.liczba_miejsc) {
    let capacityText = `Dysponuje ${placowka.liczba_miejsc} miejscami`;

    // Add "za życiem" info for ŚDS
    if (placowka.typ_placowki.includes('ŚDS') && placowka.miejsca_za_zyciem) {
      capacityText += `, w tym ${placowka.miejsca_za_zyciem} miejscami za życiem`;
    }

    parts.push(capacityText + '.');
  }

  return parts.join(' ');
}

export default function PlacowkaDetails({ placowka }: { placowka: Placowka }) {
  const router = useRouter();
  const { trackView, trackEvent } = useAnalytics();
  const [activeTab, setActiveTab] = useState<'info' | 'pricing'>('info');
  const [isSaved, setIsSaved] = useState(false); // localStorage czytany w useEffect po hydratacji
  const [isInComparison, setIsInComparison] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    const viewCount = incrementSessionViews();
    trackView(placowka.id);
    // Store view count in session so contact events can read it
    sessionStorage.setItem(`kompas-views-before-contact-${placowka.id}`, String(viewCount));
  }, [placowka.id, trackView]);

  // Sync saved state from localStorage after hydration
  useEffect(() => {
    setIsSaved(isFavorite(placowka.id));
    const onFavChange = () => setIsSaved(isFavorite(placowka.id));
    window.addEventListener('favoritesChanged', onFavChange);
    return () => window.removeEventListener('favoritesChanged', onFavChange);
  }, [placowka.id]);

  const profiles = getProfileOpiekiNazwy(placowka.profil_opieki);

  const handlePhoneClick = () => {
    trackEvent({
      placowkaId: placowka.id,
      eventType: 'phone_click',
      metadata: { phoneNumber: placowka.telefon, viewsInSession: getSessionViewCount() },
    });
  };

  const handleEmailClick = () => {
    trackEvent({
      placowkaId: placowka.id,
      eventType: 'email_click',
      metadata: { email: placowka.email, viewsInSession: getSessionViewCount() },
    });
  };

  const handleWebsiteClick = () => {
    trackEvent({
      placowkaId: placowka.id,
      eventType: 'website_click',
      metadata: { url: placowka.www, viewsInSession: getSessionViewCount() },
    });
  };

  const handleToggleSave = () => {
    if (isFavorite(placowka.id)) {
      removeFavorite(placowka.id);
      setIsSaved(false);
    } else {
      addFavorite({
        id: placowka.id,
        nazwa: placowka.nazwa,
        miejscowosc: placowka.miejscowosc,
        powiat: placowka.powiat,
        typ_placowki: placowka.typ_placowki,
        koszt_pobytu: placowka.koszt_pobytu,
        telefon: placowka.telefon,
        ulica: placowka.ulica,
        kod_pocztowy: placowka.kod_pocztowy,
        email: placowka.email,
        www: placowka.www,
        liczba_miejsc: placowka.liczba_miejsc || null,
        profil_opieki: placowka.profil_opieki,
        addedAt: new Date().toISOString(),
      });
      setIsSaved(true);
    }
    window.dispatchEvent(new Event('favoritesChanged'));
  };

  const handleToggleCompare = () => {
    setIsInComparison(!isInComparison);
    // TODO: Implement comparison functionality
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: placowka.nazwa,
          text: `${placowka.typ_placowki} w ${placowka.miejscowosc}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  const handleGetDirections = async () => {
    if (!placowka.latitude || !placowka.longitude) {
      // Brak koordynatów - otwórz Google Maps z wyszukiwaniem adresu
      const address = encodeURIComponent(
        `${placowka.ulica ? placowka.ulica + ', ' : ''}${placowka.miejscowosc}`
      );
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
      return;
    }

    setIsGettingLocation(true);

    try {
      // Próbuj pobrać geolokalizację użytkownika
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000, // 5 minut cache
        });
      });

      // Sukces - otwórz Google Maps z trasą origin → destination
      const origin = `${position.coords.latitude},${position.coords.longitude}`;
      const destination = `${placowka.latitude},${placowka.longitude}`;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;

      window.open(url, '_blank');

      // Track event
      trackEvent({
        placowkaId: placowka.id,
        eventType: 'website_click',
        metadata: {
          action: 'directions_with_geolocation',
          viewsInSession: getSessionViewCount()
        },
      });

    } catch (error) {
      // Użytkownik odmówił lub błąd - otwórz Google Maps bez origin
      // (użytkownik sam wpisze punkt startowy)
      const destination = `${placowka.latitude},${placowka.longitude}`;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

      window.open(url, '_blank');

      // Track event
      trackEvent({
        placowkaId: placowka.id,
        eventType: 'website_click',
        metadata: {
          action: 'directions_without_geolocation',
          error: error instanceof Error ? error.message : 'geolocation_denied',
          viewsInSession: getSessionViewCount()
        },
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Determine funding availability based on facility type
  const hasFunding = placowka.typ_placowki.includes('DPS');
  
  // Mock wait time based on facility type
  const waitTime = placowka.typ_placowki.includes('DPS') ? '3-6 miesięcy' : '1-3 miesiące';

  // Helper to get icon for features
  const getIconForFeature = (profile: string) => {
    const lower = profile.toLowerCase();
    if (lower.includes('alzheimer') || lower.includes('demencja')) return <Stethoscope size={18} className="text-primary-600" />;
    if (lower.includes('somatycz')) return <Users size={18} className="text-primary-600" />;
    if (lower.includes('intelektual')) return <CheckCircle2 size={18} className="text-primary-600" />;
    return <Users size={18} className="text-primary-600" />;
  };

  return (
    <div className="bg-stone-50 min-h-screen pb-24 animate-fade-in-up">
      {/* STICKY HEADER NAV */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-stone-200 sticky top-0 z-[60] py-4">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition-colors">
            <ArrowLeft size={20} /> <span className="hidden sm:inline">Powrót do bazy</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleCompare}
              className={`px-4 py-2.5 rounded-xl transition-all border flex items-center gap-2 font-black text-[10px] uppercase tracking-widest
              ${isInComparison ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-stone-200 text-slate-500 hover:bg-stone-50'}`}
            >
              <ArrowLeftRight size={16} />
              <span className="hidden sm:inline">{isInComparison ? 'W zestawieniu' : 'Porównaj'}</span>
            </button>

            <button
              onClick={handleToggleSave}
              className={`p-2.5 rounded-xl transition-all border
              ${isSaved ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-stone-200 text-slate-400 hover:bg-stone-50'}`}
            >
              <Heart size={20} className={isSaved ? 'fill-emerald-600' : ''} />
            </button>

            <div className="h-6 w-px bg-stone-200 mx-1 hidden sm:block"></div>

            <button onClick={handleShare} className="p-2.5 bg-stone-100 text-slate-500 hover:bg-stone-200 rounded-xl transition-all">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">

        {/* HEADER SECTION - COMPACT */}
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-slate-900 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-widest">
              {placowka.typ_placowki}
            </span>
            <span className="bg-stone-200 text-slate-600 text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-widest">
              {placowka.powiat}
            </span>
            {placowka.data_aktualizacji && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-widest flex items-center gap-1.5">
                <ShieldCheck size={12} />
                Zweryfikowano {formatShortDate(new Date(placowka.data_aktualizacji))}
              </span>
            )}
          </div>

          <div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-2">
              {placowka.nazwa}
            </h1>
            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
              <MapPin size={16} className="text-primary-600" />
              <span>{placowka.ulica && `${placowka.ulica}, `}{placowka.miejscowosc}</span>
            </div>
          </div>
        </div>

        {/* STALE DATA WARNING */}
        {placowka.data_aktualizacji && isDataStale(new Date(placowka.data_aktualizacji)) && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-xl mb-8 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-amber-900 mb-1">Dane mogą być nieaktualne</h5>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Ostatnia weryfikacja: {formatPolishDate(new Date(placowka.data_aktualizacji))}.
                  Zalecamy kontakt telefoniczny w celu potwierdzenia aktualnych warunków.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* QUICK STATS BAR - COMPACT */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100 shadow-sm">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Dostępność</div>
              <div className="font-bold text-slate-900 text-sm">{waitTime || 'Zapytaj'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100 shadow-sm">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 shrink-0">
              <Banknote size={18} />
            </div>
            <div>
              <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Koszt (mc)</div>
              <div className="font-bold text-slate-900 text-sm">
                {placowka.koszt_pobytu && placowka.koszt_pobytu > 0 ? `${placowka.koszt_pobytu.toLocaleString('pl-PL')} zł` : 'NFZ'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100 shadow-sm">
            <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-700 shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Status</div>
              <div className="font-bold text-slate-900 text-sm">{placowka.typ_placowki.includes('DPS') ? 'Publiczna' : 'Publiczna'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100 shadow-sm">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700 shrink-0">
              <MapPin size={18} />
            </div>
            <div>
              <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Powiat</div>
              <div className="font-bold text-slate-900 text-sm">{placowka.powiat}</div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT - 2 COLUMN LAYOUT (66% / 33%) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

          {/* LEFT COLUMN - CONTENT (66%) */}
          <div className="lg:col-span-2 space-y-8">

            {/* O PLACÓWCE I STANDARDY - JEDEN KAFELEK */}
            <section className="bg-white p-6 md:p-8 rounded-2xl border border-stone-100 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 mb-6 border-b border-stone-200 pb-4">
                O placówce
              </h3>
              <p className="text-slate-600 leading-relaxed text-lg mb-8">
                {generateFacilityDescription(placowka)}
              </p>

              {/* RODZAJ PLACÓWKI - WEWNĄTRZ TEGO SAMEGO KAFELKA */}
              {profiles.length > 0 && (
                <>
                  <h3 className="text-2xl font-black text-slate-900 mb-6 pt-6 border-t border-stone-200">
                    Rodzaj placówki
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profiles.map((profile, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-100 transition-all hover:border-primary-100 hover:-translate-y-0.5"
                      >
                        <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shrink-0">
                          {getIconForFeature(profile)}
                        </div>
                        <span className="font-bold text-slate-700">{profile}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* JAK ZŁOŻYĆ WNIOSEK - PROCEDURAL GUIDE */}
            <section className="bg-white p-6 md:p-8 rounded-2xl border border-stone-100 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <ClipboardList size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">
                    Jak złożyć wniosek?
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Proces ubiegania się o miejsce w {placowka.typ_placowki}
                  </p>
                </div>
              </div>

              <ol className="space-y-5 mb-6">
                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Złóż wniosek w MOPS/GOPS</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Skompletuj dokumenty (zaświadczenie lekarskie, dowód, dokumenty o dochodach) i złóż wniosek w odpowiednim ośrodku pomocy społecznej.
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Przejdź wywiad środowiskowy</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Pracownik socjalny przeprowadzi rozmowę w domu, aby ocenić sytuację i potrzeby osoby wymagającej opieki.
                    </p>
                  </div>
                </li>

                <li className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Otrzymaj decyzję i czekaj na miejsce</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      MOPS/GOPS wyda decyzję o skierowaniu. Następnie czekasz na wolne miejsce w placówce odpowiedniego profilu.
                    </p>
                  </div>
                </li>
              </ol>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="shrink-0 mt-0.5 text-amber-600" />
                  <div className="text-sm text-slate-700 leading-relaxed">
                    <p className="font-bold text-amber-900 mb-2">Ważne: Wniosek składasz według miejsca zamieszkania</p>
                    <p>
                      Nawet jeśli szukasz miejsca w {placowka.miejscowosc}, musisz złożyć wniosek w MOPS/GOPS właściwym dla
                      <strong> miejsca zameldowania seniora</strong>, a nie lokalizacji placówki.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/mops"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm"
                >
                  <ClipboardList size={18} />
                  Znajdź MOPS/GOPS
                </Link>

                <Link
                  href={placowka.typ_placowki === 'DPS' ? '/poradniki/finanse-prawne/proces-przyjecia-dps' : '/poradniki/wybor-opieki/wybor-placowki'}
                  className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm"
                >
                  <Book size={18} />
                  Szczegółowy przewodnik
                </Link>
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN - SIDEBAR (33%) */}
          <div className="lg:col-span-1 space-y-6">

            {/* DARK CTA CARD - CONVERSION GOLD */}
            <div className="bg-slate-900 p-8 rounded-2xl text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative z-10 space-y-6">

                {/* CENA */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-2">
                    Szacunkowy koszt miesięczny
                  </div>
                  <div className="text-5xl md:text-6xl font-black mb-3">
                    {placowka.koszt_pobytu && placowka.koszt_pobytu > 0 ? `${placowka.koszt_pobytu.toLocaleString('pl-PL')} zł` : 'NFZ'}
                  </div>
                  {placowka.koszt_pobytu && placowka.koszt_pobytu > 0 && (
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle2 size={16} />
                      <span className="font-bold">Dofinansowanie dostępne</span>
                    </div>
                  )}
                </div>

                {/* CTA BUTTONS */}
                <div className="space-y-3">
                  {placowka.telefon && (
                    <a
                      href={`tel:${placowka.telefon.replace(/\s/g, '')}`}
                      onClick={handlePhoneClick}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 px-6 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg flex items-center justify-center gap-3 group"
                    >
                      <Phone size={20} className="group-hover:rotate-12 transition-transform" />
                      Zadzwoń teraz
                    </a>
                  )}

                  {placowka.email && (
                    <a
                      href={`mailto:${placowka.email}`}
                      onClick={handleEmailClick}
                      className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-4 px-6 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <Mail size={20} />
                      Wyślij zapytanie
                    </a>
                  )}
                </div>

                {/* INFO NOTE — tylko DPS */}
                {placowka.typ_placowki === 'DPS' && (
                  <div className="flex items-start gap-3 text-slate-300 text-xs leading-relaxed bg-white/5 p-4 rounded-xl">
                    <Info size={16} className="shrink-0 mt-0.5 text-primary-400" />
                    <p>
                      W placówkach publicznych senior pokrywa <strong>70% swojego dochodu</strong>.
                      Powyższa kwota to pełna stawka, której różnica jest pokrywana przez rodzinę lub gminę.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CONTACT INFO CARD */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>

              <h4 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                <Phone size={20} className="text-primary-600" />
                Dane kontaktowe
              </h4>

              <div className="space-y-5 mb-6">
                {/* Address - always shown */}
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Adres</div>
                  <p className="font-bold text-slate-900 text-sm leading-snug">
                    {placowka.ulica && <>{placowka.ulica}<br /></>}
                    {placowka.kod_pocztowy && `${placowka.kod_pocztowy} `}{placowka.miejscowosc}
                  </p>
                </div>

                {/* Phone */}
                {placowka.telefon && (
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Telefon sekretariatu</div>
                    <a href={`tel:${placowka.telefon}`} onClick={handlePhoneClick} className="font-bold text-slate-900 hover:text-primary-600 transition-colors">
                      {placowka.telefon}
                    </a>
                  </div>
                )}

                {/* Email */}
                {placowka.email && (
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Adres E-mail</div>
                    <a href={`mailto:${placowka.email}`} onClick={handleEmailClick} className="font-bold text-slate-900 hover:text-primary-600 transition-colors text-sm break-all">
                      {placowka.email}
                    </a>
                  </div>
                )}

                {/* Website & Facebook — ikony */}
                {(placowka.www || placowka.facebook) && (
                  <div className="flex items-center gap-3">
                    {placowka.www && (
                      <a
                        href={placowka.www}
                        onClick={handleWebsiteClick}
                        target="_blank"
                        rel="noreferrer"
                        title="Strona internetowa"
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-stone-100 hover:bg-primary-50 border border-stone-200 hover:border-primary-300 text-slate-500 hover:text-primary-600 transition-all"
                      >
                        <Globe size={18} />
                      </a>
                    )}
                    {placowka.facebook && (
                      <a
                        href={placowka.facebook.startsWith('http') ? placowka.facebook : `https://${placowka.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Facebook"
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-stone-100 hover:bg-blue-50 border border-stone-200 hover:border-blue-300 text-slate-500 hover:text-blue-600 transition-all"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  W sprawach przyjęć zalecamy kontakt telefoniczny w godzinach pracy administracji (8:00 - 15:00).
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* LOKALIZACJA - FULL WIDTH */}
        <section className="bg-white p-6 md:p-8 rounded-2xl border border-stone-200 shadow-xl mb-8">
          {/* NAGŁÓWEK Z ADRESEM W TEJ SAMEJ LINIJCE */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <MapPin size={24} className="text-primary-600" />
              Lokalizacja
            </h3>
            <p className="text-slate-600 font-medium">
              {placowka.ulica && `${placowka.ulica}, `}
              {placowka.kod_pocztowy && `${placowka.kod_pocztowy} `}
              {placowka.miejscowosc}, {placowka.powiat}
            </p>
          </div>

          {/* DUŻA MAPA - FULL WIDTH */}
          <div className="h-[500px] mb-6 rounded-2xl overflow-hidden border border-stone-200">
            <FacilityMap
              facilities={[placowka]}
              mode="single"
              showDirections={false}
            />
          </div>

          {/* MAP ACTION BUTTONS */}
          {placowka.latitude && placowka.longitude && (
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${placowka.latitude},${placowka.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-stone-200 hover:border-primary-300 hover:bg-primary-50 text-slate-700 hover:text-primary-700 px-6 py-4 rounded-xl text-sm font-bold transition-all"
              >
                <MapPin size={20} />
                Zobacz na mapie
              </a>

              <button
                onClick={handleGetDirections}
                disabled={isGettingLocation}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-6 py-4 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:cursor-not-allowed"
              >
                {isGettingLocation ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Pobieram lokalizację...
                  </>
                ) : (
                  <>
                    <Car size={20} />
                    Wyznacz trasę
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* DANE ZWERYFIKOWANE - SZEROKOŚĆ SIDEBARA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2"></div>

          <div className="lg:col-span-1">
            <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-2xl">
              <div className="flex items-center gap-3 text-emerald-700 mb-4">
                <ShieldCheck size={20} />
                <span className="font-black text-sm uppercase tracking-wider">Dane zweryfikowane</span>
              </div>

              <div className="space-y-3 text-sm">
                {/* Źródło danych z linkiem */}
                <div>
                  <div className="text-emerald-600 font-medium mb-1">Źródło danych:</div>
                  <div className="font-bold text-emerald-900">
                    {placowka.zrodlo ? (
                      <a
                        href={placowka.zrodlo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:text-emerald-900 hover:underline transition-colors"
                      >
                        {placowka.zrodlo.includes('muw.pl')
                          ? 'Małopolski Urząd Wojewódzki'
                          : 'Urząd Miasta/Gminy'}
                      </a>
                    ) : (
                      'Urząd Miasta/Gminy'
                    )}
                  </div>
                </div>

                {/* Ostatnia aktualizacja */}
                {placowka.data_aktualizacji && (
                  <div>
                    <div className="text-emerald-600 font-medium mb-1">Ostatnia aktualizacja:</div>
                    <div className="font-bold text-emerald-900 flex items-center gap-2">
                      <CalendarCheck size={16} className="text-emerald-600" />
                      {formatPolishDate(new Date(placowka.data_aktualizacji))}
                    </div>
                  </div>
                )}

                {/* Oczekiwanie */}
                <div className="pt-3 border-t border-emerald-200">
                  <div className="text-emerald-600 font-medium mb-1">Czas oczekiwania:</div>
                  <div className="font-bold text-emerald-900">{waitTime || 'Zapytaj'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}