"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
  FileText
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

  // ✅ TRACK VIEW - gdy komponent się zamontuje
  useEffect(() => {
    trackView(placowka.id);
  }, [placowka.id, trackView]);

  const profiles = getProfileOpiekiNazwy(placowka.profil_opieki);

  // ✅ Handler dla kliknięcia w telefon
  const handlePhoneClick = () => {
    trackPhoneClick(placowka.id, placowka.telefon || undefined);
  };

  // ✅ Handler dla kliknięcia w email
  const handleEmailClick = () => {
    trackEmailClick(placowka.id, placowka.email || undefined);
  };

  // ✅ Handler dla kliknięcia w stronę WWW
  const handleWebsiteClick = () => {
    trackWebsiteClick(placowka.id, placowka.www || undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-accent-600 hover:text-accent-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Wróć do wyników
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{placowka.nazwa}</h1>
          <p className="text-lg text-gray-600 mt-2">
            {placowka.typ_placowki} • {placowka.miejscowosc}
          </p>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Koszty */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-3">
                <Banknote className="w-6 h-6 text-accent-600 mt-1" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Koszt miesięczny
                  </h2>
                  <p className="text-3xl font-bold text-accent-600">
                    {placowka.koszt_pobytu
                      ? `${placowka.koszt_pobytu.toLocaleString('pl-PL')} zł/mc`
                      : 'Bezpłatne'}
                  </p>
                </div>
              </div>
            </section>

            {/* Miejsca i prowadzący */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {placowka.liczba_miejsc && (
                  <div className="flex items-start gap-3">
                    <Bed className="w-6 h-6 text-accent-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Liczba miejsc
                      </h3>
                      <p className="text-gray-700">{placowka.liczba_miejsc}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Building2 className="w-6 h-6 text-accent-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Prowadzący
                    </h3>
                    <p className="text-gray-700">{placowka.prowadzacy}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Lokalizacja */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-accent-600 mt-1" />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Lokalizacja
                  </h2>
                  <div className="space-y-2">
                    <p className="text-gray-700">
                      <span className="font-medium">Powiat:</span> {placowka.powiat}
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Gmina:</span> {placowka.gmina}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Profile opieki */}
            {profiles.length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-accent-600 mt-1" />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                      Profile opieki
                    </h2>
                    <ul className="space-y-2">
                      {profiles.map((profile, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-accent-600 mt-1">•</span>
                          <span className="text-gray-700">{profile}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Kontakt */}
            <section className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Kontakt
              </h2>

              {/* Adres */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Adres</h3>
                <p className="text-gray-700">
                  {placowka.ulica && `${placowka.ulica}, `}
                  {placowka.kod_pocztowy} {placowka.miejscowosc}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Gmina: {placowka.gmina} • Powiat: {placowka.powiat}
                </p>
              </div>

              {/* Telefon - ✅ Z TRACKINGIEM */}
              {placowka.telefon && (
                <div className="flex items-start gap-3 mb-3">
                  <Phone className="w-5 h-5 text-accent-600 mt-0.5" />
                  <a 
                    href={`tel:${placowka.telefon}`}
                    onClick={handlePhoneClick}
                    className="text-accent-600 hover:text-accent-700 hover:underline"
                  >
                    {placowka.telefon}
                  </a>
                </div>
              )}

              {/* Email - ✅ Z TRACKINGIEM */}
              {placowka.email && (
                <div className="flex items-start gap-3 mb-3">
                  <Mail className="w-5 h-5 text-accent-600 mt-0.5" />
                  <a 
                    href={`mailto:${placowka.email}`}
                    onClick={handleEmailClick}
                    className="text-accent-600 hover:text-accent-700 hover:underline break-all"
                  >
                    Wyślij email
                  </a>
                </div>
              )}

              {/* Strona WWW - ✅ Z TRACKINGIEM */}
              {placowka.www && (
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-accent-600 mt-0.5" />
                  <a 
                    href={placowka.www}
                    onClick={handleWebsiteClick}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-600 hover:text-accent-700 hover:underline break-all"
                  >
                    Strona WWW
                  </a>
                </div>
              )}
            </section>

            {/* Jak uzyskać miejsce */}
            <section className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-start gap-3 mb-4">
                <Info className="w-6 h-6 text-blue-600 mt-1" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Jak uzyskać miejsce w tej placówce?
                </h2>
              </div>

              <p className="text-gray-700 mb-4">
                Informacje o dostępności miejsc zmieniają się regularnie.
                Skontaktuj się bezpośrednio z placówką.
              </p>

              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-accent-600 text-white rounded-full flex items-center justify-center font-semibold">
                    1
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Zadzwoń do placówki
                    </h3>
                    <p className="text-sm text-gray-600">
                      Zapytaj o dostępność miejsc i listę oczekujących.
                      {placowka.telefon && ` Tel: ${placowka.telefon}`}
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-accent-600 text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Przygotuj dokumenty
                    </h3>
                    <p className="text-sm text-gray-600">
                      Skierowanie z MOPS/GOPS, zaświadczenie lekarskie, dokumenty
                      potwierdzające dochód
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-accent-600 text-white rounded-full flex items-center justify-center font-semibold">
                    3
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Złóż wniosek
                    </h3>
                    <p className="text-sm text-gray-600">
                      Postępuj zgodnie z instrukcjami placówki i lokalnego MOPS/GOPS
                    </p>
                  </div>
                </li>
              </ol>

              <a 
                href="#"
                className="inline-flex items-center gap-2 mt-4 text-accent-600 hover:text-accent-700 font-medium"
              >
                <FileText className="w-5 h-5" />
                Przeczytaj pełny poradnik (wkrótce)
              </a>
            </section>
          </div>
        </div>

        {/* Lokalizacja na mapie */}
        <section className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Lokalizacja na mapie
          </h2>
          <FacilityMap 
            facilities={[placowka]} 
            mode="single" 
            showDirections={true} 
          />
        </section>

        {/* Źródło danych */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            <strong>Źródło danych:</strong>{' '}
            {placowka.zrodlo ? (
              <a 
                href={placowka.zrodlo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-600 hover:underline"
              >
                {placowka.zrodlo.includes('muw.pl')
                  ? 'MUW Kraków'
                  : 'Urząd Miasta/Gminy'}
              </a>
            ) : (
              'Urząd Miasta/Gminy'
            )}
            • Ostatnia aktualizacja:{' '}
            {new Date(placowka.data_aktualizacji).toLocaleDateString('pl-PL')}
          </p>
        </div>
      </div>
    </div>
  );
}