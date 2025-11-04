'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartIcon, TrashIcon, ArrowLeftIcon, ShareIcon, PrinterIcon, ScaleIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { getFavorites, removeFavorite, getMaxFavorites, type FavoriteFacility } from '@/src/utils/favorites';
import FacilityNotesDisplay from '@/src/components/FacilityNotesDisplay';
import { getProfileOpiekiNazwy } from '@/src/data/profileopieki';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -100 }
};

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    setFavorites(getFavorites());
    setIsLoading(false);

    const handleFavoritesChange = () => {
      setFavorites(getFavorites());
    };

    window.addEventListener('favoritesChanged', handleFavoritesChange);
    window.addEventListener('storage', handleFavoritesChange);

    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChange);
      window.removeEventListener('storage', handleFavoritesChange);
    };
  }, []);

  const handleRemove = (facilityId: number, facilityName: string) => {
    const result = removeFavorite(facilityId);
    
    if (result.success) {
      setFavorites(prev => prev.filter(f => f.id !== facilityId));
      toast.success(`Usunięto ${facilityName} z ulubionych`, {
        icon: '💔',
        duration: 2000,
      });
      window.dispatchEvent(new CustomEvent('favoritesChanged'));
    } else {
      toast.error(result.message);
    }
  };

  const handleShare = async () => {
    if (favorites.length === 0) {
      toast.error('Brak placówek do udostępnienia');
      return;
    }

    setIsSharing(true);

    try {
      const ids = favorites.map(f => f.id);
      
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await response.json();

      await navigator.clipboard.writeText(data.url);

      toast.success(
        <div>
          <p className="font-semibold">Link skopiowany do schowka! 📋</p>
          <p className="text-sm mt-1">Wklej go w SMS, email lub WhatsApp</p>
        </div>,
        {
          duration: 4000,
          icon: '🔗',
        }
      );
    } catch (error) {
      console.error('Error creating share link:', error);
      toast.error('Nie udało się utworzyć linku. Spróbuj ponownie.');
    } finally {
      setIsSharing(false);
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Otwarto podgląd wydruku', {
      icon: '🖨️',
      duration: 2000,
    });
  };

  const handleCompare = () => {
    if (favorites.length < 2) {
      toast.error('Dodaj przynajmniej 2 placówki aby porównać');
      return;
    }
    router.push('/ulubione/porownaj');
  };

  // ✅ NOWA FUNKCJA: Inteligentny powrót z sessionStorage
  const handleBack = () => {
    // Sprawdź czy mamy zapisany URL powrotu
    const returnUrl = sessionStorage.getItem('returnUrl');
    
    if (returnUrl && returnUrl.includes('/search')) {
      router.push(returnUrl); // Wróć z parametrami!
      sessionStorage.removeItem('returnUrl'); // Wyczyść
    } else {
      router.push('/search'); // Fallback jeśli przyszedł z zewnątrz
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-accent-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-neutral-200 no-print">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-4">
            {/* ✅ ZMIENIONE: Button zamiast Link + handleBack */}
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Wróć"
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <HeartIconSolid className="w-8 h-8 text-red-500" />
                Twoje Ulubione Placówki
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {favorites.length} / {getMaxFavorites()} placówek
              </p>
            </div>
          </div>

          {favorites.length > 0 && (
            <p className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              💡 Możesz zapisać do {getMaxFavorites()} placówek, aby później je porównać, udostępnić lub wydrukować
            </p>
          )}
        </div>
      </div>

      {/* Print header */}
      <div className="print-only">
        <div className="text-center mb-6 pb-4 border-b-2 border-gray-300">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ulubione Placówki - kompaseniora.pl
          </h1>
          <p className="text-gray-600">
            Wydrukowano: {new Date().toLocaleDateString('pl-PL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-gray-600 mt-1">
            Liczba placówek: {favorites.length}
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <HeartIcon className="w-10 h-10 text-gray-400" />
            </div>

            <h3 className="text-2xl font-semibold text-gray-900 mb-3">
              Nie masz jeszcze ulubionych placówek
            </h3>

            <p className="text-gray-600 mb-8 leading-relaxed">
              Dodaj placówki do ulubionych, aby móc je łatwo porównać i wrócić do nich później.
            </p>

            {/* ✅ ZMIENIONE: Button zamiast Link + handleBack */}
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-medium"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Wróć do wyszukiwania
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {favorites.map((facility, index) => {
                const profileNazwy = facility.profil_opieki
                  ? getProfileOpiekiNazwy(facility.profil_opieki)
                  : [];

                return (
                  <motion.div
                    key={facility.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow print-card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                          {facility.nazwa}
                        </h3>

                        <div className="space-y-3 sm:space-y-2 text-sm sm:text-base">
                          {/* ➕ Typ placówki */}
                          <p className="text-gray-600">
                            {facility.typ_placowki}
                          </p>

                          {/* ➕ ADRES PEŁNY (jak w SearchResults) */}
                          <div>
                            <span className="font-medium text-gray-700">Adres</span>
                            <p className="text-gray-600 mt-0.5">
                              {facility.ulica && <>{facility.ulica}, </>}
                              {facility.kod_pocztowy && <>{facility.kod_pocztowy} </>}
                              {facility.miejscowosc}
                              {facility.powiat && (
                                <span className="text-gray-500"> • powiat {facility.powiat}</span>
                              )}
                            </p>
                          </div>

                          {/* ➕ LICZBA MIEJSC */}
                          {facility.liczba_miejsc && (
                            <div>
                              <span className="font-medium text-gray-700">Ilość miejsc</span>
                              <p className="text-gray-600 mt-0.5">
                                👥 {facility.liczba_miejsc}
                              </p>
                            </div>
                          )}

                          {/* ➕ PROFIL OPIEKI */}
                          {profileNazwy.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">Profil opieki</span>
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {profileNazwy.map((nazwa, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-2 py-1 text-xs bg-accent-50 text-accent-700 rounded-md"
                                  >
                                    {nazwa}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ➕ EMAIL + WWW */}
                          {(facility.email || facility.www) && (
                            <div>
                              <span className="font-medium text-gray-700">Kontakt online</span>
                              <div className="mt-1 space-y-1">
                                {facility.email && (
                                  <a 
                                    href={`mailto:${facility.email}`}
                                    className="text-sm text-accent-600 hover:text-accent-700 hover:underline block"
                                  >
                                    📧 {facility.email}
                                  </a>
                                )}
                                {facility.www && (
                                  <a 
                                    href={facility.www}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-accent-600 hover:text-accent-700 hover:underline block"
                                  >
                                    🌐 Strona internetowa →
                                  </a>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Telefon */}
                          {facility.telefon && (
                            <div>
                              <span className="font-medium text-gray-700">Telefon</span>
                              <p className="text-gray-600">{facility.telefon}</p>
                            </div>
                          )}

                          {/* Koszt */}
                          <div>
                            <span className="font-medium text-gray-700">Koszt miesięczny</span>
                            <p className={`text-lg font-semibold ${facility.koszt_pobytu ? 'text-accent-600' : 'text-green-600'}`}>
                              {facility.koszt_pobytu
                                ? `${Math.round(facility.koszt_pobytu).toLocaleString('pl-PL')} zł/mc`
                                : 'Bezpłatne'}
                            </p>
                          </div>

                          {/* Notes Display */}
                          <FacilityNotesDisplay
                            facilityId={facility.id}
                            facilityName={facility.nazwa}
                            compact
                          />
                        </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 sm:min-w-[140px] no-print">
                        <Link
                          href={`/placowka/${facility.id}`}
                          className="flex-1 sm:w-full px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors text-center font-medium text-sm min-h-[44px] flex items-center justify-center"
                        >
                          Szczegóły
                        </Link>

                        <button
                          onClick={() => handleRemove(facility.id, facility.nazwa)}
                          className="flex-1 sm:w-full px-4 py-2 bg-red-50 text-red-600 border-2 border-red-500 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm min-h-[44px] flex items-center justify-center gap-2"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Usuń
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="pt-6 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 no-print">
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="px-6 py-4 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShareIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Udostępnij listę</span>
                <span className="sm:hidden">Udostępnij</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-6 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
              >
                <PrinterIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Drukuj listę</span>
                <span className="sm:hidden">Drukuj</span>
              </button>

              {/* Show compare button only if 2+ favorites */}
              {favorites.length >= 2 && (
                <button
                  onClick={handleCompare}
                  className="px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
                >
                  <ScaleIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Porównaj ({favorites.length})</span>
                  <span className="sm:hidden">Porównaj</span>
                </button>
              )}

              {/* ✅ ZMIENIONE: Button zamiast Link + handleBack */}
              <button
                onClick={handleBack}
                className="px-6 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-lg flex items-center justify-center gap-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Wróć</span>
                <span className="sm:hidden">Wróć</span>
              </button>
            </div>

            {/* Print hint */}
            <div className="no-print mt-4 text-center text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
              💡 <strong>Wskazówka:</strong> Po kliknięciu "Drukuj listę" możesz zapisać stronę jako PDF wybierając "Zapisz jako PDF" w oknie drukowania
            </div>
          </div>
        )}
      </main>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          body {
            background: white !important;
          }

          .print-card {
            page-break-inside: avoid;
            border: 1px solid #e5e7eb !important;
            margin-bottom: 1rem !important;
            box-shadow: none !important;
          }

          main {
            padding: 0 !important;
          }
        }

        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
}