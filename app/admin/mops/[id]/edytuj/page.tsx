'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/phone-utils';

const WOJEWODZTWA = [
  'małopolskie', 'śląskie', 'mazowieckie', 'dolnośląskie',
  'wielkopolskie', 'łódzkie', 'podkarpackie', 'lubelskie',
  'kujawsko-pomorskie', 'lubuskie', 'opolskie', 'podlaskie',
  'pomorskie', 'świętokrzyskie', 'warmińsko-mazurskie', 'zachodniopomorskie',
];

const mopsSchema = z.object({
  city:        z.string().min(1, 'Wymagane'),
  cityDisplay: z.string().min(1, 'Wymagane'),
  typ:         z.enum(['MOPS', 'GOPS', 'OPS', 'MOPR', 'CUS']),
  gmina:       z.string().optional().or(z.literal('')),
  name:        z.string().min(1, 'Wymagane'),
  phone:       z.string().min(1, 'Wymagane'),
  email:       z.string().email('Nieprawidłowy email').optional().or(z.literal('')),
  address:     z.string().min(1, 'Wymagane'),
  website:     z.string().url('Nieprawidłowy URL').optional().or(z.literal('')),
  wojewodztwo: z.string().min(1, 'Wymagane'),
  latitude:    z.number().nullable().optional(),
  longitude:   z.number().nullable().optional(),
  verified:    z.boolean(),
  notes:       z.string().optional().or(z.literal('')),
});

type MopsFormData = z.infer<typeof mopsSchema>;

export default function EdytujMopsPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MopsFormData>({
    resolver: zodResolver(mopsSchema),
  });

  const phone = watch('phone');

  // Auto-formatowanie telefonu
  useEffect(() => {
    if (phone && phone.length >= 9) {
      const formatted = formatPhoneNumber(phone);
      if (formatted !== phone) setValue('phone', formatted);
    }
  }, [phone, setValue]);

  useEffect(() => {
    fetch(`/api/admin/mops/${id}`)
      .then(res => res.json())
      .then(data => {
        reset({
          city:        data.city,
          cityDisplay: data.cityDisplay,
          typ:         data.typ ?? 'MOPS',
          gmina:       data.gmina || '',
          name:        data.name,
          phone:       data.phone,
          email:       data.email || '',
          address:     data.address,
          website:     data.website || '',
          wojewodztwo: data.wojewodztwo,
          latitude:    data.latitude ?? undefined,
          longitude:   data.longitude ?? undefined,
          verified:    data.verified,
          notes:       data.notes || '',
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Nie udało się pobrać danych wpisu.');
        setLoading(false);
      });
  }, [id, reset]);

  const handleCityDisplayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('cityDisplay', val);
    setValue('city', val.trim().toLowerCase()
      .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e')
      .replace(/ł/g,'l').replace(/ń/g,'n').replace(/ó/g,'o')
      .replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z')
      .replace(/\s+/g, '-')
    );
  };

  const onSubmit = async (data: MopsFormData) => {
    setIsSubmitting(true);
    setError(null);

    // Formatuj telefon przed zapisem
    if (data.phone) data.phone = formatPhoneNumber(data.phone);

    try {
      const res = await fetch(`/api/admin/mops/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Błąd podczas zapisywania');
      }
      router.push('/admin/mops?success=updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          Ładowanie...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/mops" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edytuj MOPS/GOPS</h1>
          <p className="text-sm text-gray-500 mt-0.5">ID: {id}</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Podstawowe informacje */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Podstawowe informacje</h2>
          <div className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ ośrodka *
                </label>
                <select {...register('typ')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="MOPS">MOPS</option>
                  <option value="GOPS">GOPS</option>
                  <option value="OPS">OPS</option>
                  <option value="MOPR">MOPR</option>
                  <option value="CUS">CUS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Województwo *
                </label>
                <select {...register('wojewodztwo')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  {WOJEWODZTWA.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                {errors.wojewodztwo && <p className="mt-1 text-xs text-red-600">{errors.wojewodztwo.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miasto (nazwa wyświetlana) *
              </label>
              <input
                type="text"
                value={watch('cityDisplay') || ''}
                onChange={handleCityDisplayChange}
                placeholder="np. Kraków"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.cityDisplay && <p className="mt-1 text-xs text-red-600">{errors.cityDisplay.message}</p>}
              <p className="mt-1 text-xs text-gray-400">
                Klucz (city): <code className="bg-gray-100 px-1 rounded">{watch('city') || '—'}</code>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gmina (opcjonalnie)
              </label>
              <input
                type="text"
                {...register('gmina')}
                placeholder="np. Klucze (dla wiejskich ośrodków obsługujących gminę)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="mt-1 text-xs text-gray-400">Wypełnij jeśli ośrodek obsługuje gminę inną niż miasto (np. CUS Klucze obsługuje gminę Klucze)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pełna nazwa ośrodka *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="np. Miejski Ośrodek Pomocy Społecznej w Krakowie"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>

          </div>
        </div>

        {/* Adres i kontakt */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Adres i kontakt</h2>
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adres *
              </label>
              <input
                type="text"
                {...register('address')}
                placeholder="np. ul. Józefińska 14, 30-529 Kraków"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon *
              </label>
              <input
                type="tel"
                {...register('phone')}
                placeholder="np. 12 616 54 00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (opcjonalnie)
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="np. mops@krakow.pl"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strona WWW (opcjonalnie)
              </label>
              <input
                type="url"
                {...register('website')}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {errors.website && <p className="mt-1 text-xs text-red-600">{errors.website.message}</p>}
            </div>

          </div>
        </div>

        {/* Geolokalizacja */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Geolokalizacja</h2>
          <p className="text-xs text-gray-400 mb-4">Opcjonalnie — możesz poprawić ręcznie jeśli współrzędne są błędne.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Szerokość (lat)</label>
              <input
                type="number"
                step="any"
                {...register('latitude', { valueAsNumber: true })}
                placeholder="np. 50.0614"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Długość (lng)</label>
              <input
                type="number"
                step="any"
                {...register('longitude', { valueAsNumber: true })}
                placeholder="np. 19.9383"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Weryfikacja i notatki */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Weryfikacja</h2>
          <div className="space-y-4">

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('verified')}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Wpis zweryfikowany (dane sprawdzone ręcznie)</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notatki (opcjonalnie)
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="np. Weryfikacja na stronie 2026-02-16, nr telefonu aktualny"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

          </div>
        </div>

        <div className="flex items-center justify-between pb-8">
          <button type="button" onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Anuluj
          </button>
          <button type="submit" disabled={isSubmitting}
            className="px-6 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium">
            {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </button>
        </div>
      </form>
    </div>
  );
}
