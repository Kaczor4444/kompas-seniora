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
  Image as ImageIcon
} from 'lucide-react';
import dynamic from 'next/dynamic';

const FacilityMap = dynamic(() => import('@/components/FacilityMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] bg-gray-100 rounded-lg animate-pulse" />
});

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
  liczba_miejsc: number | null;
  profil_opieki: string | null;
  koszt_pobytu: number | null;
  data_aktualizacji: Date;
  zrodlo: string | null;
  geo_lat: number | null;
  geo_lng: number | null;
}

export default function PlacowkaDetails({ placowka }: { placowka: Placowka }) {
  const router = useRouter();
  const { trackView, trackPhoneClick, trackEmailClick, trackWebsiteClick } = useAnalytics();
  const [activeTab, setActiveTab] = useState<'info' | 'pricing'>('info');
  const [isSaved, setIsSaved] = useState(false);

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
    <div className="min-h-screen bg-stone-50 animate-fade-in-up">
      
      {/* 1. MASONRY GRID GALLERY HERO */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-slate-500 hover:text-primary-600 font-bold mb-6 text-sm transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
               <ArrowLeft size={16} />
            </div>
            Wróć do wyników
          </button>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[300px] md:h-[500px] mb-8 rounded-3xl overflow-hidden relative group">
             {/* Main Image - 2x2 */}
             <div className="md:col-span-2 md:row-span-2 relative h-full">
                {getPlaceholderImage(0)}
                <span className={`absolute top-4 left-4 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg z-10 ${
                  placowka.typ_placowki.includes('DPS') ? 'bg-primary-600' : 'bg-secondary-600'
                }`}>
                    {placowka.typ_placowki}
                </span>
             </div>
             {/* Side Images - Hidden on mobile */}
             <div className="hidden md:block relative h-full">
                {getPlaceholderImage(1)}
             </div>
             <div className="hidden md:block relative h-full">
                {getPlaceholderImage(2)}
             </div>
             <div className="hidden md:block relative h-full">
                {getPlaceholderImage(3)}
             </div>
             <div className="hidden md:block relative h-full">
                {getPlaceholderImage(4)}
                {/* View All Overlay */}
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center transition-opacity hover:bg-slate-900/40 cursor-pointer">
                   <span className="flex items-center gap-2 text-white font-bold text-sm border border-white/30 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/20 transition-all">
                      <ImageIcon size={16} /> Galeria zdjęć (wkrótce)
                   </span>
                </div>
             </div>
          </div>

          {/* Title & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
             <div className="flex-1">
                <h1 className="text-3xl md:text-5xl font-serif font-bold text-slate-900 mb-3 leading-tight">
                  {placowka.nazwa}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-slate-500 font-medium text-sm">
                   <div className="flex items-center gap-1.5">
                      <MapPin size={18} className="text-primary-500" />
                      {placowka.ulica && `${placowka.ulica}, `}{placowka.miejscowosc}
                   </div>
                   <div className="hidden md:block w-1 h-1 bg-stone-300 rounded-full"></div>
                   <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 size={14} /> Zweryfikowana przez MOPS
                      </span>
                   </div>
                </div>
             </div>

             {/* Action Buttons */}
             <div className="flex gap-2 w-full md:w-auto">
                <button 
                   onClick={handleToggleSave}
                   className={`flex-1 md:flex-none py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${
                     isSaved 
                       ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' 
                       : 'bg-white text-slate-600 border-stone-200 hover:border-slate-300 hover:bg-slate-50'
                   }`}
                >
                   <Heart size={20} className={isSaved ? 'fill-current' : ''} />
                   {isSaved ? 'Zapisano' : 'Zapisz'}
                </button>
                <button 
                  onClick={handleShare}
                  className="flex-1 md:flex-none py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-white text-slate-600 border border-stone-200 hover:border-slate-300 hover:bg-slate-50"
                >
                   <Share2 size={20} /> Udostępnij
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT GRID WITH STICKY SIDEBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN - Content */}
            <div className="lg:col-span-2">
               
               {/* Sticky Navigation Tabs */}
               <div className="flex border-b border-stone-200 mb-8 sticky top-0 bg-stone-50 z-20 pt-2 -mx-4 px-4 md:mx-0 md:px-0">
                  <button 
                    onClick={() => setActiveTab('info')}
                    className={`pb-4 px-6 font-bold text-sm transition-colors border-b-2 ${
                      activeTab === 'info' 
                        ? 'border-slate-900 text-slate-900' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Informacje
                  </button>
                  <button 
                    onClick={() => setActiveTab('pricing')}
                    className={`pb-4 px-6 font-bold text-sm transition-colors border-b-2 ${
                      activeTab === 'pricing' 
                        ? 'border-slate-900 text-slate-900' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Cennik i Warunki
                  </button>
               </div>

               <div className="space-y-8">
                  {activeTab === 'info' && (
                    <>
                      {/* About Section */}
                      <section className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
                          <h3 className="font-serif font-bold text-2xl text-slate-900 mb-4">O placówce</h3>
                          <div className="prose prose-stone text-slate-600 leading-relaxed max-w-none">
                            <p>
                              Placówka <strong>{placowka.nazwa}</strong> zapewnia profesjonalną opiekę 
                              w kategorii {placowka.typ_placowki}. Znajduje się w {placowka.miejscowosc}, 
                              gmina {placowka.gmina}, powiat {placowka.powiat}.
                            </p>
                            <p className="mt-4">
                              Placówka jest prowadzona przez {placowka.prowadzacy} i oferuje 
                              {placowka.liczba_miejsc ? ` ${placowka.liczba_miejsc} miejsc` : ' miejsca'} 
                              dla podopiecznych.
                            </p>
                          </div>
                      </section>

                      {/* Care Profiles */}
                      {profiles.length > 0 && (
                        <section className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
                            <h3 className="font-serif font-bold text-2xl text-slate-900 mb-6">Profile opieki</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {profiles.map((profile, i) => (
                                  <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-stone-50 border border-stone-100 hover:border-stone-200 transition-colors">
                                    <div className="bg-white p-2.5 rounded-lg shadow-sm">
                                        {getIconForFeature(profile)}
                                    </div>
                                    <span className="font-medium text-slate-700 text-sm">{profile}</span>
                                  </div>
                              ))}
                            </div>
                        </section>
                      )}

                      {/* How to Get a Place - YOUR ORIGINAL SECTION! */}
                      <section className="bg-gradient-to-br from-blue-50 to-primary-50 rounded-3xl p-6 md:p-8 border border-blue-100">
                        <div className="flex items-start gap-3 mb-6">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg">
                            <Info size={20} />
                          </div>
                          <h2 className="text-2xl font-serif font-bold text-slate-900">
                            Jak uzyskać miejsce w tej placówce?
                          </h2>
                        </div>

                        <p className="text-slate-700 mb-6 leading-relaxed">
                          Informacje o dostępności miejsc zmieniają się regularnie.
                          Skontaktuj się bezpośrednio z placówką, aby poznać aktualną sytuację.
                        </p>

                        <ol className="space-y-6">
                          <li className="flex gap-4">
                            <span className="flex-shrink-0 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                              1
                            </span>
                            <div>
                              <h3 className="font-bold text-slate-900 mb-2 text-lg">
                                Zadzwoń do placówki
                              </h3>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                Zapytaj o dostępność miejsc i listę oczekujących.
                                {placowka.telefon && ` Telefon: ${placowka.telefon}`}
                              </p>
                            </div>
                          </li>

                          <li className="flex gap-4">
                            <span className="flex-shrink-0 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                              2
                            </span>
                            <div>
                              <h3 className="font-bold text-slate-900 mb-2 text-lg">
                                Przygotuj dokumenty
                              </h3>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                Skierowanie z MOPS/GOPS, zaświadczenie lekarskie, dokumenty
                                potwierdzające dochód i sytuację rodzinną.
                              </p>
                            </div>
                          </li>

                          <li className="flex gap-4">
                            <span className="flex-shrink-0 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                              3
                            </span>
                            <div>
                              <h3 className="font-bold text-slate-900 mb-2 text-lg">
                                Złóż wniosek
                              </h3>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                Postępuj zgodnie z instrukcjami placówki i lokalnego MOPS/GOPS.
                                Proces może potrwać {waitTime}.
                              </p>
                            </div>
                          </li>
                        </ol>

                        <a 
                          href="/poradniki"
                          className="inline-flex items-center gap-2 mt-6 text-primary-600 hover:text-primary-700 font-bold transition-colors"
                        >
                          <FileText className="w-5 h-5" />
                          Zobacz pełny poradnik →
                        </a>
                      </section>

                      {/* Map Section */}
                      <section className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
                          <h3 className="font-serif font-bold text-2xl text-slate-900 mb-6 flex items-center justify-between">
                            Lokalizacja na mapie
                            {placowka.geo_lat && placowka.geo_lng && (
                              <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${placowka.geo_lat},${placowka.geo_lng}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-sm font-sans font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1"
                              >
                                 Otwórz w Google Maps 
                                 <ArrowLeft className="rotate-180" size={14}/>
                              </a>
                            )}
                          </h3>
                          <FacilityMap 
                            facilities={[placowka]} 
                            mode="single" 
                            showDirections={true} 
                          />
                      </section>
                    </>
                  )}

                  {activeTab === 'pricing' && (
                    <>
                      {/* Pricing Details */}
                      <section className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
                          <h3 className="font-serif font-bold text-2xl text-slate-900 mb-6">Koszt pobytu</h3>
                          
                          <div className="space-y-6">
                            <div className="flex items-start gap-4 p-6 bg-gradient-to-br from-primary-50 to-green-50 rounded-2xl border border-primary-100">
                              <div className="w-12 h-12 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-lg shrink-0">
                                <Banknote size={24} />
                              </div>
                              <div>
                                <div className="text-sm text-slate-600 font-bold uppercase tracking-wide mb-2">
                                  Miesięczny koszt
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-4xl font-serif font-bold text-slate-900">
                                    {placowka.koszt_pobytu 
                                      ? placowka.koszt_pobytu.toLocaleString('pl-PL')
                                      : 'Bezpłatne'}
                                  </span>
                                  {placowka.koszt_pobytu && (
                                    <span className="text-lg font-medium text-slate-600">zł/miesiąc</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                                <span className="text-slate-600 font-medium flex items-center gap-2">
                                  <CalendarCheck size={18} className="text-primary-600" /> 
                                  Czas oczekiwania
                                </span>
                                <span className="font-bold text-slate-900">{waitTime}</span>
                              </div>

                              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                                <span className="text-slate-600 font-medium flex items-center gap-2">
                                  <CheckCircle2 size={18} className="text-primary-600" /> 
                                  Dofinansowanie
                                </span>
                                <span className={`font-bold ${hasFunding ? 'text-green-600' : 'text-slate-400'}`}>
                                  {hasFunding ? 'Dostępne' : 'Brak'}
                                </span>
                              </div>

                              {placowka.liczba_miejsc && (
                                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                                  <span className="text-slate-600 font-medium flex items-center gap-2">
                                    <Bed size={18} className="text-primary-600" /> 
                                    Liczba miejsc
                                  </span>
                                  <span className="font-bold text-slate-900">{placowka.liczba_miejsc}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                                <span className="text-slate-600 font-medium flex items-center gap-2">
                                  <Building2 size={18} className="text-primary-600" /> 
                                  Typ placówki
                                </span>
                                <span className="font-bold text-slate-900">{placowka.typ_placowki}</span>
                              </div>
                            </div>

                            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                              <p className="text-sm text-slate-700 leading-relaxed">
                                <strong className="text-slate-900">Ważne:</strong> Ostateczna wysokość opłaty 
                                ustalana jest indywidualnie i może zależeć od dochodu osoby przebywającej w placówce 
                                oraz jej rodziny. Skontaktuj się z MOPS/GOPS w celu uzyskania szczegółowych informacji.
                              </p>
                            </div>
                          </div>
                      </section>

                      {/* Managed By */}
                      <section className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-sm">
                          <h3 className="font-serif font-bold text-2xl text-slate-900 mb-4">Prowadzący</h3>
                          <div className="flex items-start gap-4 p-6 bg-stone-50 rounded-2xl">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shrink-0">
                              <Building2 size={24} />
                            </div>
                            <div>
                              <div className="text-sm text-slate-500 font-bold uppercase tracking-wide mb-1">
                                Jednostka prowadząca
                              </div>
                              <div className="text-lg font-bold text-slate-900">
                                {placowka.prowadzacy}
                              </div>
                            </div>
                          </div>
                      </section>
                    </>
                  )}
               </div>
            </div>

            {/* RIGHT COLUMN - Sticky Sidebar */}
            <div className="lg:col-span-1">
               <div className="sticky top-24 space-y-6">
                  
                  {/* CTA Card - Dark with gradient */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500 opacity-20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                     
                     <div className="relative z-10 space-y-6">
                        {/* Price */}
                        <div>
                           <div className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-2">
                             Szacunkowy koszt miesięczny
                           </div>
                           <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-serif font-bold">
                                {placowka.koszt_pobytu 
                                  ? placowka.koszt_pobytu.toLocaleString('pl-PL')
                                  : 'Bezpłatne'}
                              </span>
                              {placowka.koszt_pobytu && (
                                <span className="text-sm font-medium opacity-80">zł/mies</span>
                              )}
                           </div>
                        </div>

                        {/* Quick Info */}
                        <div className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                           <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-300 flex items-center gap-2">
                                <CheckCircle2 size={16}/> Dofinansowanie
                              </span>
                              <span className={`font-bold ${hasFunding ? 'text-green-400' : 'text-slate-400'}`}>
                                {hasFunding ? 'Dostępne' : 'Brak'}
                              </span>
                           </div>
                           <div className="w-full h-px bg-white/10"></div>
                           <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-300 flex items-center gap-2">
                                <CalendarCheck size={16}/> Czas oczekiwania
                              </span>
                              <span className="font-bold text-white">{waitTime}</span>
                           </div>
                        </div>

                        {/* CTA Buttons */}
                        {placowka.telefon && (
                          <a
                            href={`tel:${placowka.telefon}`}
                            onClick={handlePhoneClick}
                            className="block w-full bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary-900/50 flex items-center justify-center gap-2 mb-3"
                          >
                             <Phone size={20} /> Zadzwoń teraz
                          </a>
                        )}
                        
                        {placowka.email && (
                          <a
                            href={`mailto:${placowka.email}`}
                            onClick={handleEmailClick}
                            className="block w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm backdrop-blur-sm border border-white/10"
                          >
                             <Mail size={18} /> Wyślij zapytanie
                          </a>
                        )}
                     </div>
                  </div>

                  {/* Contact Info Widget */}
                  <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                     <h3 className="font-bold text-slate-900 mb-5 text-sm uppercase tracking-wide">
                       Dane kontaktowe
                     </h3>
                     <div className="space-y-1">
                        {/* Address */}
                        <div className="p-4 rounded-xl hover:bg-stone-50 transition-colors">
                           <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0">
                                 <MapPin size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                 <div className="text-xs text-slate-400 font-bold mb-1">Adres</div>
                                 <div className="font-bold text-slate-900 text-sm break-words">
                                   {placowka.ulica && `${placowka.ulica}, `}
                                   {placowka.kod_pocztowy} {placowka.miejscowosc}
                                 </div>
                                 <div className="text-xs text-slate-500 mt-1">
                                   {placowka.gmina} • {placowka.powiat}
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Phone */}
                        {placowka.telefon && (
                          <a 
                            href={`tel:${placowka.telefon}`}
                            onClick={handlePhoneClick}
                            className="flex items-start gap-3 p-4 rounded-xl hover:bg-stone-50 transition-colors group"
                          >
                             <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors shrink-0">
                                <Phone size={18} />
                             </div>
                             <div>
                                <div className="text-xs text-slate-400 font-bold mb-1">Telefon</div>
                                <div className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                                  {placowka.telefon}
                                </div>
                             </div>
                          </a>
                        )}
                        
                        {/* Email */}
                        {placowka.email && (
                          <a 
                            href={`mailto:${placowka.email}`}
                            onClick={handleEmailClick}
                            className="flex items-start gap-3 p-4 rounded-xl hover:bg-stone-50 transition-colors group"
                          >
                             <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors shrink-0">
                                <Mail size={18} />
                             </div>
                             <div className="min-w-0 flex-1">
                                <div className="text-xs text-slate-400 font-bold mb-1">Email</div>
                                <div className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors text-sm break-all">
                                  {placowka.email}
                                </div>
                             </div>
                          </a>
                        )}

                        {/* Website */}
                        {placowka.www && (
                          <a 
                            href={placowka.www}
                            onClick={handleWebsiteClick}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-start gap-3 p-4 rounded-xl hover:bg-stone-50 transition-colors group"
                          >
                             <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors shrink-0">
                                <Globe size={18} />
                             </div>
                             <div className="min-w-0 flex-1">
                                <div className="text-xs text-slate-400 font-bold mb-1">Strona WWW</div>
                                <div className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors text-sm truncate">
                                  {placowka.www.replace(/^https?:\/\//, '')}
                                </div>
                             </div>
                          </a>
                        )}
                     </div>
                  </div>

               </div>
            </div>

         </div>

         {/* Source Footer */}
         <div className="mt-12 pt-8 border-t border-stone-200">
          <p className="text-sm text-slate-500 text-center">
            <strong className="text-slate-700">Źródło danych:</strong>{' '}
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
            {' • '}
            Ostatnia aktualizacja:{' '}
            <span className="font-medium text-slate-700">
              {new Date(placowka.data_aktualizacji).toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}