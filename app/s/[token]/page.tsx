'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HeartIcon, ArrowLeftIcon, ShareIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface Facility {
  id: number;
  nazwa: string;
  typ_placowki: string;
  miejscowosc: string;
  powiat: string;
  telefon?: string;
  email?: string;
  www?: string;
  koszt_pobytu?: number;
}

interface SharedListData {
  success: boolean;
  facilities: Facility[];
  created: string;
  views: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function SharedListPage() {
  const params = useParams();
  const token = params?.token as string;
  
  const [data, setData] = useState<SharedListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchSharedList = async () => {
      try {
        const response = await fetch(`/api/share/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Lista nie została znaleziona. Sprawdź czy link jest poprawny.');
          } else {
            setError('Wystąpił błąd podczas ładowania listy.');
          }
          setIsLoading(false);
          return;
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching shared list:', err);
        setError('Wystąpił błąd podczas ładowania listy.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedList();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-accent-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Ładowanie udostępnionej listy...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <ShareIcon className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">
            Nie znaleziono listy
          </h3>
          <p className="text-gray-600 mb-6">
            {error || 'Lista mogła zostać usunięta lub link jest nieprawidłowy.'}
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-medium"
          >
            Wróć do wyszukiwania
          </Link>
        </div>
      </div>
    );
  }

  const createdDate = new Date(data.created).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/search" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ShareIcon className="w-8 h-8 text-accent-600" />
                Udostępniona Lista Placówek
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {data.facilities.length} placówek • Utworzono {createdDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{data.views}</span>
              <span>👁️ wyświetleń</span>
            </div>
            <span className="text-gray-400">•</span>
            <span>Ktoś podzielił się z Tobą tą listą domów opieki</span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-4">
          {data.facilities.map((facility, index) => (
            <motion.div
              key={facility.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    {facility.nazwa}
                  </h3>

                  <div className="space-y-2 text-sm sm:text-base">
                    <p className="text-gray-600">
                      {facility.typ_placowki} • {facility.powiat}
                    </p>

                    <div>
                      <span className="font-medium text-gray-700">Lokalizacja</span>
                      <p className="text-gray-600">{facility.miejscowosc}</p>
                    </div>

                    {facility.telefon && (
                      <div>
                        <span className="font-medium text-gray-700">Telefon</span>
                        <p className="text-gray-600">
                          <a href={`tel:${facility.telefon}`} className="hover:text-accent-600">
                            {facility.telefon}
                          </a>
                        </p>
                      </div>
                    )}

                    {facility.email && (
                      <div>
                        <span className="font-medium text-gray-700">Email</span>
                        <p className="text-gray-600">
                          <a href={`mailto:${facility.email}`} className="hover:text-accent-600">
                            {facility.email}
                          </a>
                        </p>
                      </div>
                    )}

                    {facility.www && (
                      <div>
                        <span className="font-medium text-gray-700">Strona WWW</span>
                        <p className="text-gray-600">
                          <a 
                            href={facility.www} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-accent-600"
                          >
                            {facility.www}
                          </a>
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="font-medium text-gray-700">Koszt miesięczny</span>
                      <p className={`text-lg font-semibold ${facility.koszt_pobytu ? 'text-accent-600' : 'text-green-600'}`}>
                        {facility.koszt_pobytu
                          ? `${Math.round(facility.koszt_pobytu).toLocaleString('pl-PL')} zł/mc`
                          : 'Bezpłatne'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 sm:min-w-[140px]">
                  <Link
                    href={`/placowka/${facility.id}`}
                    className="flex-1 sm:w-full px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors text-center font-medium text-sm min-h-[44px] flex items-center justify-center"
                  >
                    Szczegóły
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="pt-6 border-t border-gray-200 mt-6">
          <Link
            href="/search"
            className="w-full px-6 py-4 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Wyszukaj własne placówki
          </Link>
        </div>
      </main>
    </div>
  );
}