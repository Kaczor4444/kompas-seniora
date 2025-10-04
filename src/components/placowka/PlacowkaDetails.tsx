"use client";

import { useRouter } from 'next/navigation';
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
import { getProfileOpiekiNazwy } from '../../data/profileOpieki';

interface Placowka {
  id: number;
  nazwa: string;
  typ_placowki: string;
  prowadzacy: string;
  miejscowosc: string;
  ulica: string | null;
  kod_pocztowy: string | null;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  koszt_pobytu: number | null;
  telefon: string | null;
  email: string | null;
  www: string | null;
  liczba_miejsc: number | null;
  profil_opieki: string | null;
  zrodlo: string | null;
  data_aktualizacji: Date;
}

interface PlacowkaDetailsProps {
  placowka: Placowka; // TODO: Fetch z API na podstawie ID
  onBack?: () => void;
}

function formatPrice(amount: number | null): string {
  if (amount === null) return 'Brak danych';
  if (amount === 0) return 'Bezpłatne';
  
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' zł';
}

function formatAddress(placowka: Placowka): string {
  const parts = [];
  
  if (placowka.ulica) parts.push(placowka.ulica);
  if (placowka.kod_pocztowy || placowka.miejscowosc) {
    const cityPart = [placowka.kod_pocztowy, placowka.miejscowosc]
      .filter(Boolean)
      .join(' ');
    parts.push(cityPart);
  }
  
  return parts.join(', ') || placowka.miejscowosc;
}

export default function PlacowkaDetails({ placowka }: PlacowkaDetailsProps) {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Navigation */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Powrót do wyników
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                {placowka.nazwa}
              </h1>
              <p className="text-lg text-neutral-600">
                {placowka.typ_placowki} • {placowka.miejscowosc}
              </p>
            </div>
            
            {/* Koszt - prominent display */}
            <div className="text-right">
              <p className="text-sm text-neutral-500 mb-1">Koszt miesięczny</p>
              <p className={`text-4xl font-bold ${placowka.koszt_pobytu === 0 ? 'text-green-600' : 'text-accent-600'}`}>
                {formatPrice(placowka.koszt_pobytu)}
                {placowka.koszt_pobytu !== null && placowka.koszt_pobytu > 0 && (
                  <span className="text-lg font-normal text-neutral-600">/mc</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Liczba miejsc */}
          {placowka.liczba_miejsc && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent-50 rounded-lg">
                  <Bed className="w-5 h-5 text-accent-600" />
                </div>
                <p className="text-sm font-medium text-neutral-500">Liczba miejsc</p>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{placowka.liczba_miejsc}</p>
            </div>
          )}

          {/* Prowadzący */}
          {placowka.prowadzacy && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-neutral-500">Prowadzący</p>
              </div>
              <p className="text-sm text-neutral-900 leading-relaxed">{placowka.prowadzacy}</p>
            </div>
          )}

          {/* Region */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-neutral-500">Lokalizacja</p>
            </div>
            <p className="text-sm text-neutral-900">Powiat: {placowka.powiat}</p>
            <p className="text-sm text-neutral-900">Gmina: {placowka.gmina}</p>
          </div>
        </div>

        {/* Profile opieki - jeśli istnieją */}
        {placowka.profil_opieki && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-accent-600" />
              <h2 className="text-xl font-semibold text-neutral-900">Profile opieki</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {(() => {
                const profil = placowka.profil_opieki.trim();
                const isKody = /^[A-I](,[A-I])*$/.test(profil);
                
                if (isKody) {
                  return getProfileOpiekiNazwy(profil).map((nazwa, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-accent-50 rounded-lg">
                      <span className="text-accent-600 font-bold mt-0.5">•</span>
                      <p className="text-neutral-800 text-sm font-medium">{nazwa}</p>
                    </div>
                  ));
                } else {
                  return profil.split(',')
                    .map(opis => opis.trim())
                    .filter(opis => opis.length > 0)
                    .map((opis, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-3 bg-accent-50 rounded-lg">
                        <span className="text-accent-600 font-bold mt-0.5">•</span>
                        <p className="text-neutral-800 text-sm font-medium">{opis}</p>
                      </div>
                    ));
                }
              })()}
            </div>
          </div>
        )}

        {/* Kontakt */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Kontakt</h2>
          
          {/* Adres */}
          <div className="mb-4 pb-4 border-b border-neutral-200">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-accent-600 mt-1" />
              <div>
                <p className="font-medium text-neutral-900 mb-1">Adres</p>
                <p className="text-neutral-700">{formatAddress(placowka)}</p>
                <p className="text-sm text-neutral-600 mt-1">
                  Gmina: {placowka.gmina} • Powiat: {placowka.powiat}
                </p>
              </div>
            </div>
          </div>

          {/* Przyciski kontaktowe */}
          <div className="flex flex-wrap gap-3">
            {placowka.telefon && (
              <a 
                href={`tel:${placowka.telefon}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-white hover:bg-accent-600 rounded-lg font-medium transition-colors"
              >
                <Phone className="w-4 h-4" />
                {placowka.telefon}
              </a>
            )}

            {placowka.email && (
              <a 
                href={`mailto:${placowka.email}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                Wyślij email
              </a>
            )}

            {placowka.www && (
              <a 
                href={placowka.www}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
              >
                <Globe className="w-4 h-4" />
                Strona WWW
              </a>
            )}
          </div>
        </div>

        {/* Jak uzyskać miejsce? */}
        <div className="bg-gradient-to-br from-accent-50 to-blue-50 rounded-xl border border-accent-200 p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Info className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Jak uzyskać miejsce w tej placówce?
              </h2>
              <p className="text-sm text-neutral-600">
                Informacje o dostępności miejsc zmieniają się regularnie. Skontaktuj się bezpośrednio z placówką.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-accent-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium text-neutral-900 mb-1">Zadzwoń do placówki</p>
                <p className="text-sm text-neutral-600">
                  Zapytaj o dostępność miejsc i listę oczekujących. {placowka.telefon && `Tel: ${placowka.telefon}`}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-accent-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium text-neutral-900 mb-1">Przygotuj dokumenty</p>
                <p className="text-sm text-neutral-600">
                  Skierowanie z MOPS/GOPS, zaświadczenie lekarskie, dokumenty potwierdzające dochód
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-white rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-accent-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium text-neutral-900 mb-1">Złóż wniosek</p>
                <p className="text-sm text-neutral-600">
                  Postępuj zgodnie z instrukcjami placówki i lokalnego MOPS/GOPS
                </p>
              </div>
            </div>
          </div>

          {/* Link do poradnika - TODO */}
          <div className="mt-4 pt-4 border-t border-accent-200">
            <a 
              href="#"
              className="inline-flex items-center gap-2 text-accent-700 hover:text-accent-800 font-medium text-sm"
            >
              <FileText className="w-4 h-4" />
              Przeczytaj pełny poradnik (wkrótce)
            </a>
          </div>
        </div>

        {/* Źródło danych */}
        {placowka.zrodlo && (
          <div className="bg-neutral-100 rounded-lg p-4 text-sm text-neutral-600">
            <p>
              <strong>Źródło danych:</strong> {placowka.zrodlo}
              {placowka.data_aktualizacji && (
                <span className="ml-2">
                  • Ostatnia aktualizacja: {new Date(placowka.data_aktualizacji).toLocaleDateString('pl-PL')}
                </span>
              )}
            </p>
          </div>
        )}

        {/* TODO: Mapa - placeholder */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Lokalizacja na mapie</h2>
          <div className="h-64 bg-neutral-100 rounded-lg flex items-center justify-center">
            <p className="text-neutral-500">Mapa z lokalizacją - wkrótce</p>
          </div>
        </div>
      </div>
    </div>
  );
}