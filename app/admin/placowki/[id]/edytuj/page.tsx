'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import TerytAutocomplete from '@/app/admin/placowki/_components/TerytAutocomplete';
import { useRouter, useParams } from 'next/navigation';
import { formatPhoneNumber } from '@/lib/phone-utils';
import toast from 'react-hot-toast';

// Zod validation schema (ten sam co w dodaj)
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
  liczba_miejsc: z.coerce.number().int().positive().optional(),
  miejsca_za_zyciem: z.coerce.number().nonnegative().optional().nullable(),
  koszt_pobytu: z.coerce.number().nonnegative().optional(),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  profil_opieki: z.string().optional(),
  
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

export default function EdytujPlacowkePage() {
  const router = useRouter();
  const params = useParams();
  const placowkaId = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<PlacowkaFormData>({
    resolver: zodResolver(placowkaSchema),
  });

  const telefon = watch('telefon');

  // Load placowka data
  useEffect(() => {
    const loadPlacowka = async () => {
      try {
        const res = await fetch(`/api/admin/placowki/${placowkaId}`);
        if (!res.ok) {
          throw new Error('Nie znaleziono placówki');
        }
        const data = await res.json();
        
        // Pre-fill form with existing data
        reset({
          nazwa: data.placowka.nazwa,
          typ_placowki: data.placowka.typ_placowki,
          prowadzacy: data.placowka.prowadzacy || '',
          miejscowosc: data.placowka.miejscowosc,
          ulica: data.placowka.ulica || '',
          kod_pocztowy: data.placowka.kod_pocztowy || '',
          gmina: data.placowka.gmina || '',
          powiat: data.placowka.powiat,
          wojewodztwo: data.placowka.wojewodztwo,
          telefon: data.placowka.telefon || '',
          email: data.placowka.email || '',
          www: data.placowka.www || '',
          liczba_miejsc: data.placowka.liczba_miejsc ?? undefined,
          miejsca_za_zyciem: data.placowka.miejsca_za_zyciem ?? undefined,
          koszt_pobytu: data.placowka.koszt_pobytu ?? undefined,
          latitude: data.placowka.latitude ?? undefined,
          longitude: data.placowka.longitude ?? undefined,
          profil_opieki: data.placowka.profil_opieki || '',
          zrodlo_dane: data.placowka.zrodlo_dane || '',
          zrodlo_cena: data.placowka.zrodlo_cena || '',
          data_zrodla_dane: data.placowka.data_zrodla_dane || '',
          data_zrodla_cena: data.placowka.data_zrodla_cena || '',
          data_weryfikacji: data.placowka.data_weryfikacji || '',
          notatki: data.placowka.notatki || '',
          verified: data.placowka.verified,
        });
      } catch (err) {
        console.error('Error loading placowka:', err);
        setError(err instanceof Error ? err.message : 'Błąd podczas ładowania');
        toast.error('Nie można załadować danych placówki');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlacowka();
  }, [placowkaId, reset]);

  // Auto-formatowanie telefonu
  useEffect(() => {
    if (telefon && telefon.length >= 9) {
      const formatted = formatPhoneNumber(telefon);
      if (formatted !== telefon) {
        setValue('telefon', formatted);
      }
    }
  }, [telefon, setValue]);

  const onSubmit = async (data: PlacowkaFormData) => {
    // Formatuj telefon przed zapisem
    if (data.telefon) {
      data.telefon = formatPhoneNumber(data.telefon);
    }

    // 🆕 Użyj ręcznych współrzędnych jeśli są podane, lub spróbuj auto-geocoding
    let latitude = data.latitude ?? undefined;
    let longitude = data.longitude ?? undefined;

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
        }
      } catch (geoError) {
        console.error("Geocoding error:", geoError);
      }
    } else if (latitude && longitude) {
      console.log("✅ Using manual coordinates:", latitude, longitude);
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const processedData = {
        ...data,
        data_zrodla_dane: data.data_zrodla_dane ? new Date(data.data_zrodla_dane).toISOString() : null,
        data_zrodla_cena: data.data_zrodla_cena ? new Date(data.data_zrodla_cena).toISOString() : null,
        data_weryfikacji: data.data_weryfikacji ? new Date(data.data_weryfikacji).toISOString() : null,
        latitude,
        longitude,
      };

      const response = await fetch(`/api/admin/placowki/${placowkaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas zapisywania');
      }

      toast.success('Placówka zaktualizowana pomyślnie!');
      router.push('/admin/placowki');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Ładowanie danych placówki...</p>
        </div>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-medium">Błąd: {error}</p>
          <button
            onClick={() => router.push('/admin/placowki')}
            className="mt-2 text-sm underline"
          >
            Powrót do listy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edytuj placówkę</h1>
        <p className="mt-2 text-gray-600">
          Zaktualizuj dane placówki DPS lub ŚDS
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
                  setValue("gmina", data.gmina || data.miejscowosc);
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
            onClick={() => router.push('/admin/placowki')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </div>
      </form>
    </div>
  );
}