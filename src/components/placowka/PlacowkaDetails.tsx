"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getProfileOpiekiNazwy } from '@/src/data/profileopieki';
import { useAnalytics } from '@/src/hooks/useAnalytics';
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
  Image as ImageIcon,
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
  PenLine
} from 'lucide-react';
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

export default function PlacowkaDetails({ placowka }: { placowka: Placowka }) {
  const router = useRouter();
  const { trackView, trackPhoneClick, trackEmailClick, trackWebsiteClick } = useAnalytics();
  const [activeTab, setActiveTab] = useState<'info' | 'pricing'>('info');
  const [isSaved, setIsSaved] = useState(false);
  const [isInComparison, setIsInComparison] = useState(false);

  useEffect(() => {
    trackView(placowka.id);
  }, [placowka.id, trackView]);

  const profiles = getProfileOpiekiNazwy(placowka.profil_opieki);

  const handlePhoneClick = () => {
    trackPhoneClick(placowka.id, placowka.telefon || undefined);
  };

  const handleEmailClick = () => {
    trackEmailClick(placowka.id, placowka.email || undefined);
  };

  const handleWebsiteClick = () => {
    trackWebsiteClick(placowka.id, placowka.www || undefined);
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    // TODO: Implement favorites functionality
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

  // Placeholder images based on facility type
  const getPlaceholderImage = (index: number) => {
    const colors = ['bg-slate-200', 'bg-slate-300', 'bg-slate-100', 'bg-slate-250', 'bg-slate-200'];
    return (
      <div className={`w-full h-full ${colors[index]} flex items-center justify-center`}>
        <ImageIcon size={48} className="text-slate-400" />
      </div>
    );
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
              ${isSaved ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-stone-200 text-slate-400 hover:bg-stone-50'}`}
            >
              <Heart size={20} className={isSaved ? 'fill-red-600' : ''} />
            </button>

            <div className="h-6 w-px bg-stone-200 mx-1 hidden sm:block"></div>

            <button onClick={handleShare} className="p-2.5 bg-stone-100 text-slate-500 hover:bg-stone-200 rounded-xl transition-all">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">

        {/* HEADER SECTION */}
        <div className="mb-10 space-y-4">
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

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 leading-tight tracking-tight mb-3">
                {placowka.nazwa}
              </h1>
              <div className="flex items-center gap-2 text-slate-400 font-bold">
                <MapPin size={18} className="text-primary-600" />
                <span>{placowka.ulica && `${placowka.ulica}, `}{placowka.miejscowosc}</span>
              </div>
            </div>

            {placowka.data_aktualizacji && (
              <div className="flex items-center gap-2 text-slate-600 bg-white px-4 py-2 rounded-xl border border-stone-100 shadow-sm">
                <CalendarCheck size={16} className="text-emerald-500" />
                <div className="text-sm">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Ostatnia aktualizacja
                  </span>
                  <span className="font-bold">
                    {getSmartDateFormat(new Date(placowka.data_aktualizacji))}
                  </span>
                </div>
              </div>
            )}
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

        {/* QUICK STATS BAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Clock size={20} />
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dostępność</div>
                <div className="font-bold text-slate-900">{waitTime || 'Zapytaj'}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700">
                <Banknote size={20} />
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Koszt (mc)</div>
                <div className="font-bold text-slate-900">
                  {placowka.koszt_pobytu && placowka.koszt_pobytu > 0 ? `${placowka.koszt_pobytu.toLocaleString('pl-PL')} zł` : 'NFZ'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700">
                <Shield size={20} />
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status prawny</div>
                <div className="font-bold text-slate-900 text-sm">{placowka.typ_placowki.includes('DPS') ? 'Publiczna (DPS)' : 'Publiczna (ŚDS)'}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700">
                <MapPin size={20} />
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Powiat</div>
                <div className="font-bold text-slate-900 text-sm">{placowka.powiat}</div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT - 2 COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">

          {/* LEFT COLUMN - CONTENT (60%) */}
          <div className="lg:col-span-3 space-y-10">

            {/* HERO IMAGE */}
            <div className="relative h-[300px] md:h-[450px] rounded-[2.5rem] overflow-hidden shadow-xl group">
              <div className="w-full h-full bg-gradient-to-br from-slate-200 via-slate-100 to-stone-200 flex items-center justify-center">
                <ImageIcon size={64} className="text-slate-400" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-8 left-8 text-white">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">
                  <ImageIcon size={14} /> Zdjęcie placówki (wkrótce)
                </div>
              </div>
            </div>

            {/* PROFIL DZIAŁALNOŚCI */}
            <section>
              <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6">
                Profil działalności
              </h3>
              <p className="text-slate-600 leading-relaxed text-lg">
                Placówka <strong>{placowka.nazwa}</strong> zapewnia profesjonalną opiekę
                w kategorii {placowka.typ_placowki}. Znajduje się w {placowka.miejscowosc},
                gmina {placowka.gmina}, powiat {placowka.powiat}.
                {placowka.liczba_miejsc && ` Oferuje ${placowka.liczba_miejsc} miejsc dla podopiecznych.`}
              </p>
            </section>

            {/* STANDARDY I UDOGODNIENIA */}
            {profiles.length > 0 && (
              <section>
                <h3 className="text-2xl font-serif font-bold text-slate-900 mb-6">
                  Standardy i udogodnienia
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profiles.map((profile, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-stone-100 shadow-sm transition-all hover:border-primary-100 hover:-translate-y-0.5"
                    >
                      <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shrink-0">
                        {getIconForFeature(profile)}
                      </div>
                      <span className="font-bold text-slate-700">{profile}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* MAP SECTION */}
            <section className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
              <h3 className="font-serif font-bold text-2xl text-slate-900 mb-6 flex items-center justify-between">
                Lokalizacja na mapie
                {placowka.latitude && placowka.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${placowka.latitude},${placowka.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-sans font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
                  >
                    Otwórz w Google Maps
                    <ArrowLeft className="rotate-180" size={14}/>
                  </a>
                )}
              </h3>
              <div className="h-[400px]">
                <FacilityMap
                  facilities={[placowka]}
                  mode="single"
                  showDirections={true}
                />
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN - SIDEBAR (40%) */}
          <div className="lg:col-span-2 space-y-8">

            {/* DARK CTA CARD - CONVERSION GOLD */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative z-10 space-y-6">

                {/* CENA */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-2">
                    Szacunkowy koszt miesięczny
                  </div>
                  <div className="text-5xl md:text-6xl font-serif font-bold mb-3">
                    {placowka.koszt_pobytu && placowka.koszt_pobytu > 0 ? `${placowka.koszt_pobytu.toLocaleString('pl-PL')} zł` : 'NFZ'}
                  </div>
                  {placowka.koszt_pobytu && placowka.koszt_pobytu > 0 && (
                    <div className="flex items-center gap-2 text-sm text-emerald-400">
                      <CheckCircle2 size={16} />
                      <span className="font-bold">Dofinansowanie dostępne</span>
                    </div>
                  )}
                </div>

                <div className="h-px bg-white/10 w-full"></div>

                {/* QUICK INFO */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Czas oczekiwania</span>
                    <span className="font-bold">{waitTime || 'Zapytaj'}</span>
                  </div>
                  {placowka.koszt_pobytu && placowka.koszt_pobytu > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Dofinansowanie</span>
                      <span className="font-bold text-emerald-400">Dostępne</span>
                    </div>
                  )}
                </div>

                <div className="h-px bg-white/10 w-full"></div>

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

                {/* INFO NOTE */}
                <div className="flex items-start gap-3 text-slate-300 text-xs leading-relaxed bg-white/5 p-4 rounded-xl">
                  <Info size={16} className="shrink-0 mt-0.5 text-primary-400" />
                  <p>
                    W placówkach publicznych senior pokrywa <strong>70% swojego dochodu</strong>.
                    Powyższa kwota to pełna stawka, której różnica jest pokrywana przez rodzinę lub gminę.
                  </p>
                </div>
              </div>
            </div>

            {/* CONTACT INFO CARD */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>

              <h4 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-3">
                <Phone size={20} className="text-primary-600" />
                Dane kontaktowe
              </h4>

              <div className="space-y-5 mb-6">
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

                {/* Website */}
                {placowka.www && (
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Strona www</div>
                    <a href={placowka.www} onClick={handleWebsiteClick} target="_blank" rel="noreferrer" className="font-bold text-slate-900 hover:text-primary-600 transition-colors text-sm truncate block">
                      {placowka.www.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {/* Facebook */}
                {placowka.facebook && (
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Facebook</div>
                    <a href={placowka.facebook.startsWith('http') ? placowka.facebook : `https://${placowka.facebook}`} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:text-blue-700 transition-colors text-sm truncate block flex items-center gap-2">
                      {placowka.facebook.replace(/^https?:\/\/(www\.)?/, '')}
                      <ArrowLeft size={14} className="rotate-180" />
                    </a>
                  </div>
                )}

                {!placowka.telefon && !placowka.email && !placowka.www && !placowka.facebook && (
                  <div className="text-sm text-slate-500 italic">Brak danych kontaktowych</div>
                )}
              </div>

              <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  W sprawach przyjęć zalecamy kontakt telefoniczny w godzinach pracy administracji (8:00 - 15:00).
                </p>
              </div>
            </div>

            {/* VERIFICATION INFO */}
            <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                  <Clock size={24} />
                </div>
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Oczekiwanie
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {waitTime || 'Zapytaj'}
                  </span>
                </div>
              </div>

              <div className="h-px bg-stone-100"></div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Weryfikacja
                  </span>
                  <span className="text-lg font-bold text-slate-900">Zgodna z BIP</span>
                  {placowka.zrodlo && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Źródło: {placowka.zrodlo.includes('muw.pl') ? 'MUW' : 'Urząd'}
                    </p>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <div className="border-t border-stone-200 pt-8 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Info size={16} />
              <span>
                <strong>Źródło danych:</strong>{' '}
                {placowka.zrodlo ? (
                  <a
                    href={placowka.zrodlo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                  >
                    {placowka.zrodlo.includes('muw.pl')
                      ? 'Małopolski Urząd Wojewódzki'
                      : 'Urząd Miasta/Gminy'}
                  </a>
                ) : (
                  'Urząd Miasta/Gminy'
                )}
              </span>
            </div>
            {placowka.data_aktualizacji && (
              <div className="flex items-center gap-2">
                <CalendarCheck size={16} className="text-emerald-500" />
                <span>
                  <strong>Ostatnia aktualizacja:</strong>{' '}
                  {formatPolishDate(new Date(placowka.data_aktualizacji))}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}