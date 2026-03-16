'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import TerytAutocomplete from '../_components/TerytAutocomplete';
import { useRouter } from 'next/navigation';
import { formatPhoneNumber } from '@/lib/phone-utils';

// Zod validation schema
const placowkaSchema = z.object({
  nazwa: z.string().min(3, 'Minimum 3 znaki').max(200, 'Maksimum 200 znaków'),
  typ_placowki: z.enum(['DPS', 'ŚDS'], {
    required_error: 'Wybierz typ placówki',
  }),
  prowadzacy: z.string().optional(),
  miejscowosc: z.string().min(2, 'Wymagane'),
  ulica: z.string().optional(),
  kod_pocztowy: z
    .string()
    .regex(/^\d{2}-\d{3}$/, 'Format: XX-XXX')
    .optional()
    .or(z.literal('')),
  gmina: z.string().optional(),
  powiat: z.string().min(2, 'Wymagane'),
  wojewodztwo: z.string().min(2, 'Wymagane'),
  telefon: z.string().optional(),
  email: z.string().email('Nieprawidłowy email').optional().or(z.literal('')),
  www: z.string().url('Nieprawidłowy URL').optional().or(z.literal('')),
  facebook: z.string().url('Nieprawidłowy URL').optional().or(z.literal('')),
  liczba_miejsc: z.coerce.number().int().positive().optional(),
  miejsca_za_zyciem: z.coerce.number().nonnegative().optional().nullable(),
  koszt_pobytu: z.coerce.number().nonnegative().optional(),
  rok_ceny: z.coerce.number().int().min(2024).max(2030).default(2026),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  profil_opieki: z.string().optional(),

  // Weryfikacja z oficjalnym wykazem PDF
  oficjalne_id: z.coerce.number().int().positive().optional().nullable(),
  nazwa_oficjalna: z.string().optional(),

  // Źródła
  zrodlo_dane: z.string().url('Nieprawidłowy URL').optional().or(z.literal('')),
  zrodlo_cena: z.string().url('Nieprawidłowy URL').optional().or(z.literal('')),
  data_zrodla_dane: z.string().optional(),
  data_zrodla_cena: z.string().optional(),
  data_weryfikacji: z.string().optional(),
  notatki: z.string().optional(),
  
  verified: z.boolean().default(false),
});

type PlacowkaFormData = z.infer<typeof placowkaSchema>;

interface DuplicateData {
  id: number;
  nazwa: string;
  typ_placowki: string;
  miejscowosc: string;
  ulica: string | null;
  powiat: string;
  wojewodztwo: string;
  telefon: string | null;
  email: string | null;
  www: string | null;
  verified: boolean;
  createdAt: string;
}

export default function DodajPlacowkePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<DuplicateData | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [forceAdd, setForceAdd] = useState(false);
  const [matchedBy, setMatchedBy] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PlacowkaFormData>({
    resolver: zodResolver(placowkaSchema),
    defaultValues: {
      verified: true,
      data_weryfikacji: new Date().toISOString().split('T')[0],
    },
  });

  const nazwa = watch('nazwa');
  const miejscowosc = watch('miejscowosc');
  const ulica = watch('ulica');
  const telefon = watch('telefon');

  // 🆕 AUTO-FORMATOWANIE TELEFONU
  useEffect(() => {
    if (telefon && telefon.length >= 9) {
      const formatted = formatPhoneNumber(telefon);
      if (formatted !== telefon) {
        setValue('telefon', formatted);
      }
    }
  }, [telefon, setValue]);

  // Debounced duplicate check
  useEffect(() => {
    if (!miejscowosc || miejscowosc.length < 2) {
      setDuplicate(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const params = new URLSearchParams({
          miejscowosc,
        });
        
        if (nazwa && nazwa.length >= 3) params.append('nazwa', nazwa);
        if (ulica && ulica.length >= 3) params.append('ulica', ulica);
        if (telefon && telefon.length >= 9) params.append('telefon', telefon);

        const response = await fetch(
          `/api/admin/placowki/check-duplicate?${params.toString()}`
        );
        const data = await response.json();
        
        if (data.exists && data.placowka) {
          setDuplicate(data.placowka);
          setMatchedBy(data.matchedBy || 'nazwa');
        } else {
          setDuplicate(null);
          setMatchedBy('');
        }
      } catch (err) {
        console.error('Error checking duplicate:', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [nazwa, miejscowosc, ulica, telefon]);

  const onSubmit = async (data: PlacowkaFormData) => {
    if (duplicate && !forceAdd) {
      return;
    }

    // 🆕 FORMATUJ TELEFON PRZED ZAPISEM
    if (data.telefon) {
      data.telefon = formatPhoneNumber(data.telefon);
    }

    // 🆕 Użyj ręcznych współrzędnych jeśli są podane, lub spróbuj auto-geocoding
    let latitude = data.latitude || null;
    let longitude = data.longitude || null;

    // Auto-geocoding tylko jeśli nie ma ręcznych współrzędnych
    if (data.miejscowosc && !latitude && !longitude) {
      try {
        const geoParams = new URLSearchParams({
          miejscowosc: data.miejscowosc,
          ...(data.ulica && { ulica: data.ulica }),
          ...(data.wojewodztwo && { wojewodztwo: data.wojewodztwo }),
        });

        const geoResponse = await fetch(`/api/geocode?${geoParams}`);
        const geoData = await geoResponse.json();

        if (geoData.success) {
          latitude = geoData.latitude;
          longitude = geoData.longitude;
          console.log("✅ Geocoding success:", latitude, longitude);
        } else {
          console.log("⚠️ Geocoding failed:", geoData.message);
        }
      } catch (geoError) {
        console.error("Geocoding error:", geoError);
        // Nie blokujemy zapisu jeśli geocoding nie działa
      }
    } else if (latitude && longitude) {
      console.log("✅ Using manual coordinates:", latitude, longitude);
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Convert date strings to DateTime objects
      const processedData = {
        data_zrodla_dane: data.data_zrodla_dane ? new Date(data.data_zrodla_dane).toISOString() : null,
        ...data,
        data_zrodla_cena: data.data_zrodla_cena ? new Date(data.data_zrodla_cena).toISOString() : null,
        data_weryfikacji: data.data_weryfikacji ? new Date(data.data_weryfikacji).toISOString() : null,
        latitude,
        longitude,
      };

      const response = await fetch('/api/admin/placowki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...processedData, forceAdd }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas zapisywania');
      }

      const result = await response.json();
      router.push(`/admin/placowki?success=added&id=${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMatchLabel = () => {
    if (matchedBy === 'ulica') return '(znaleziono po adresie)';
    if (matchedBy === 'telefon') return '(znaleziono po telefonie)';
    return '(znaleziono po nazwie)';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dodaj placówkę</h1>
        <p className="mt-2 text-gray-600">
          Wypełnij formularz aby dodać zweryfikowaną placówkę DPS lub ŚDS
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Błąd: {error}</p>
        </div>
      )}

      {/* Duplicate Warning */}
      {duplicate && !forceAdd && (
        <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-3xl">⚠️</span>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Uwaga: Podobna placówka już istnieje w bazie! {getMatchLabel()}
              </h3>
              
              <div className="bg-white rounded-lg p-4 mb-4 border border-yellow-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Nazwa:</span>
                    <p className="text-gray-900">{duplicate.nazwa}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Typ:</span>
                    <p className="text-gray-900">{duplicate.typ_placowki}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Miejscowość:</span>
                    <p className="text-gray-900">{duplicate.miejscowosc}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Ulica:</span>
                    <p className="text-gray-900">{duplicate.ulica || '—'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Powiat:</span>
                    <p className="text-gray-900">{duplicate.powiat}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Województwo:</span>
                    <p className="text-gray-900">{duplicate.wojewodztwo}</p>
                  </div>
                  {duplicate.telefon && (
                    <div>
                      <span className="font-medium text-gray-700">Telefon:</span>
                      <p className="text-gray-900">{duplicate.telefon}</p>
                    </div>
                  )}
                  {duplicate.www && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">WWW:</span>
                      <p className="text-gray-900 truncate">
                        <a 
                          href={duplicate.www} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {duplicate.www}
                        </a>
                      </p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Status:</span>
                    <p className="text-gray-900">
                      {duplicate.verified ? '✅ Zweryfikowana' : '⚠️ Niezweryfikowana'} • 
                      ID: {duplicate.id} • 
                      Dodano: {new Date(duplicate.createdAt).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/placowki')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={() => setForceAdd(true)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Dodaj mimo to (to inna placówka)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {checkingDuplicate && (
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
          <p className="text-sm">🔍 Sprawdzam czy placówka już istnieje...</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Error Summary Banner */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Popraw {Object.keys(errors).length} {Object.keys(errors).length === 1 ? 'błąd' : 'błędy'} walidacji
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(errors).map(([field, error]: [string, any]) => (
                      <li key={field}>
                        <span className="font-medium capitalize">
                          {field.replace(/_/g, ' ')}:
                        </span>{' '}
                        {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Podstawowe informacje */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Podstawowe informacje
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa placówki *
              </label>
              <input
                type="text"
                {...register('nazwa')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="np. Dom Pomocy Społecznej w Krakowie"
              />
              {errors.nazwa && (
                <p className="mt-1 text-sm text-red-600">{errors.nazwa.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Typ placówki *
              </label>
              <select
                {...register('typ_placowki')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Wybierz typ</option>
                <option value="DPS">DPS - Dom Pomocy Społecznej</option>
                <option value="ŚDS">ŚDS - Środowiskowy Dom Samopomocy</option>
              </select>
              {errors.typ_placowki && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.typ_placowki.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prowadzący (opcjonalnie)
              </label>
              <input
                type="text"
                {...register('prowadzacy')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="np. Gmina Kraków, Caritas"
              />
            </div>
          </div>
        </div>

        {/* Lokalizacja */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Lokalizacja
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miejscowość *
              </label>
              <TerytAutocomplete
                value={watch("miejscowosc") || ""}
                onChange={(value) => setValue("miejscowosc", value)}
                onSelect={(data) => {
                  setValue("miejscowosc", data.miejscowosc);
                  setValue("gmina", data.gmina || data.miejscowosc); // Fallback jeśli TERYT nie ma gminy
                  setValue("powiat", data.powiat);
                  setValue("wojewodztwo", data.wojewodztwo);
                }}
                placeholder="Wpisz miejscowość, np. Kraków"
                error={errors.miejscowosc?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ulica (opcjonalnie)
              </label>
              <input
                type="text"
                {...register('ulica')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="np. ul. Długa 12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kod pocztowy (opcjonalnie)
              </label>
              <input
                type="text"
                {...register('kod_pocztowy')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="XX-XXX"
              />
              {errors.kod_pocztowy && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.kod_pocztowy.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gmina
                </label>
                <input
                  type="text"
                  {...register('gmina')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Powiat *
                </label>
                <input
                  type="text"
                  {...register('powiat')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.powiat && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.powiat.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Województwo *
                </label>
                <input
                  type="text"
                  {...register('wojewodztwo')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.wojewodztwo && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.wojewodztwo.message}
                  </p>
                )}
              </div>
            </div>

            {/* 🆕 NOWE POLA: Współrzędne geograficzne */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude (szerokość geograficzna)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  {...register('latitude')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="np. 50.0647"
                />
                <p className="mt-1 text-xs text-gray-500">
                  💡 Zostaw puste - auto-geocoding wypełni automatycznie
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude (długość geograficzna)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  {...register('longitude')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="np. 19.9450"
                />
                <p className="mt-1 text-xs text-gray-500">
                  💡 Lub wpisz ręcznie jeśli znasz współrzędne
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kontakt */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kontakt</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon (opcjonalnie)
              </label>
              <input
                type="tel"
                {...register('telefon')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="np. 12 345 67 89"
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 Automatycznie formatowane do: XX XXX XX XX
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (opcjonalnie)
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="np. kontakt@placowka.pl"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strona WWW (opcjonalnie)
              </label>
              <input
                type="url"
                {...register('www')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://..."
              />
              {errors.www && (
                <p className="mt-1 text-sm text-red-600">{errors.www.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facebook
                <span className="text-xs text-gray-500 ml-2">(opcjonalnie)</span>
              </label>
              <input
                type="url"
                placeholder="https://facebook.com/..."
                {...register('facebook')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.facebook && (
                <p className="mt-1 text-sm text-red-600">{errors.facebook.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Link do profilu Facebook placówki
              </p>
            </div>
          </div>
        </div>

        {/* Szczegóły */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Szczegóły</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Liczba miejsc (opcjonalnie)
                </label>
                <input
                  type="number"
                  {...register('liczba_miejsc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="np. 50"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Miejsca "Za życiem" 💚
                  <span className="text-xs text-gray-500 ml-2">(opcjonalnie, tylko dla ŚDS)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Liczba miejsc z podwyższoną dotacją"
                  {...register('miejsca_za_zyciem', {
                    valueAsNumber: true,
                    setValueAs: (v) => v === '' ? null : Number(v)
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Program dla osób z głębszą niepełnosprawnością (część z ogólnej liczby miejsc, nie dodatek)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Koszt pobytu [zł/mies.] (opcjonalnie)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('koszt_pobytu')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="np. 2500"
                  min="0"
                />
              </div>

              {/* ROK CENY - NEW FIELD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rok obowiązywania ceny *
                </label>
                <select
                  {...register('rok_ceny')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="2026">2026 (aktualny)</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2027">2027</option>
                </select>
                {errors.rok_ceny && (
                  <p className="mt-1 text-sm text-red-600">{errors.rok_ceny.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Wybierz rok, którego dotyczy podana cena powyżej
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profil opieki (opcjonalnie)
              </label>
              <textarea
                {...register('profil_opieki')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="np. Osoby przewlekle somatycznie chore, osoby z niepełnosprawnością intelektualną"
              />
            </div>
          </div>
        </div>

        {/* Źródła i weryfikacja */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Źródła danych i weryfikacja
          </h2>
          <div className="space-y-4">
            {/* 🆕 Weryfikacja z oficjalnym wykazem PDF */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h3 className="text-sm font-bold text-emerald-900 mb-3">
                📄 Weryfikacja z oficjalnym wykazem województwa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oficjalne ID (l.p. z wykazu PDF)
                  </label>
                  <input
                    type="number"
                    {...register('oficjalne_id')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="np. 1, 2, 3..."
                    min="1"
                  />
                  {errors.oficjalne_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.oficjalne_id.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Numer z kolumny "l.p." w oficjalnym wykazie DPS/ŚDS
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Oficjalna nazwa (z wykazu PDF)
                  </label>
                  <input
                    type="text"
                    {...register('nazwa_oficjalna')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Dokładna nazwa z oficjalnego dokumentu"
                  />
                  {errors.nazwa_oficjalna && (
                    <p className="mt-1 text-sm text-red-600">{errors.nazwa_oficjalna.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Nazwa 1:1 z wykazu województwa (np. "Dom Pomocy Społecznej w...")
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Źródło danych (URL do BIP)
                </label>
                <input
                  type="url"
                  {...register('zrodlo_dane')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://bip.malopolska.pl/..."
                />
                {errors.zrodlo_dane && (
                  <p className="mt-1 text-sm text-red-600">{errors.zrodlo_dane.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Źródło cen (URL do wykazu)
                </label>
                <input
                  type="url"
                  {...register('zrodlo_cena')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
                {errors.zrodlo_cena && (
                  <p className="mt-1 text-sm text-red-600">{errors.zrodlo_cena.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data źródła danych
                </label>
                <input
                  type="date"
                  {...register('data_zrodla_dane')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data źródła cen
                </label>
                <input
                  type="date"
                  {...register('data_zrodla_cena')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data weryfikacji
                </label>
                <input
                  type="date"
                  {...register('data_weryfikacji')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notatki z weryfikacji
              </label>
              <textarea
                {...register('notatki')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="np. Telefon zweryfikowany, www działa, dane aktualne na dzień..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('verified')}
                id="verified"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="verified" className="ml-2 text-sm text-gray-700">
                Placówka zweryfikowana (dane sprawdzone ręcznie)
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (duplicate && !forceAdd)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Zapisywanie...' : 'Dodaj placówkę'}
          </button>
        </div>
      </form>
    </div>
  );
}