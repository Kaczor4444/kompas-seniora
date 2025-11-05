'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getFavorites, type FavoriteFacility } from '@/src/utils/favorites';
import { getFacilityNote } from '@/src/utils/facilityNotes';
import StarRating from '@/src/components/StarRating';
import NoteModal from '@/src/components/compare/NoteModal';

export default function ComparePage() {
  const [facilities, setFacilities] = useState<FavoriteFacility[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  
  // Modal state
  const [selectedNote, setSelectedNote] = useState<{
    facilityName: string;
    rating: number;
    notes: string;
  } | null>(null);

  useEffect(() => {
    const favs = getFavorites();
    setFacilities(favs);
    // Auto-select all favorites (no limit)
    setSelectedIds(favs.map(f => f.id));
  }, []);

  const selectedFacilities = facilities.filter(f => selectedIds.includes(f.id));

  const removeFromComparison = (id: number) => {
    setSelectedIds(prev => prev.filter(fid => fid !== id));
    // Adjust current pair if needed
    const totalPairs = Math.ceil((selectedFacilities.length - 1) / 2);
    if (currentPairIndex >= totalPairs) {
      setCurrentPairIndex(Math.max(0, totalPairs - 1));
    }
  };

  const addToComparison = (id: number) => {
    if (selectedIds.length >= 10) {
      // Max 10 for performance
      return;
    }
    setSelectedIds(prev => [...prev, id]);
  };

  // Split facilities into pairs of 2
  const totalPairs = Math.ceil(selectedFacilities.length / 2);
  const currentPair = selectedFacilities.slice(currentPairIndex * 2, currentPairIndex * 2 + 2);

  const nextPair = () => {
    setCurrentPairIndex(prev => Math.min(prev + 1, totalPairs - 1));
  };

  const prevPair = () => {
    setCurrentPairIndex(prev => Math.max(prev - 1, 0));
  };

  // Find min/max for highlighting
  const costs = selectedFacilities
    .map(f => f.koszt_pobytu)
    .filter(c => c !== null && c !== undefined) as number[];
  
  const minCost = costs.length > 0 ? Math.min(...costs) : null;
  const maxCost = costs.length > 0 ? Math.max(...costs) : null;

  const places = selectedFacilities
    .map(f => f.liczba_miejsc)
    .filter(p => p !== null && p !== undefined) as number[];
  
  const maxPlaces = places.length > 0 ? Math.max(...places) : null;

  const ratings = selectedFacilities.map(f => {
    const note = getFacilityNote(f.id);
    return note?.rating || 0;
  });
  
  const maxRating = Math.max(...ratings);

  if (facilities.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">
            Brak placówek do porównania
          </h3>
          <p className="text-gray-600 mb-6">
            Dodaj najpierw placówki do ulubionych
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-medium"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Wróć do wyszukiwania
          </Link>
        </div>
      </div>
    );
  }

  if (selectedFacilities.length < 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">
            Wybierz przynajmniej 2 placówki
          </h3>
          <p className="text-gray-600 mb-6">
            Dodaj więcej placówek do ulubionych aby porównać
          </p>
          <Link
            href="/ulubione"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors font-medium"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Wróć do ulubionych
          </Link>
        </div>
      </div>
    );
  }

  const ComparisonRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="border-b border-gray-200 last:border-b-0">
      <div className="font-medium text-gray-700 bg-gray-50 px-3 py-2 text-xs border-b border-gray-200">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-px bg-gray-200">
        {children}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/ulubione" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Porównanie Placówek
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Porównujesz {selectedFacilities.length} placówek
              </p>
            </div>
          </div>

          {facilities.length > selectedIds.length && selectedIds.length < 10 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-gray-700 mb-2">
                💡 Możesz dodać więcej placówek (max 10)
              </p>
              <div className="flex flex-wrap gap-2">
                {facilities
                  .filter(f => !selectedIds.includes(f.id))
                  .map(f => (
                    <button
                      key={f.id}
                      onClick={() => addToComparison(f.id)}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded-lg text-sm font-medium transition-colors"
                    >
                      + {f.nazwa}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Desktop - Table */}
      <div className="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 w-48">
                    Parametr
                  </th>
                  {selectedFacilities.map((facility) => (
                    <th key={facility.id} className="px-6 py-4 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-gray-900 mb-1">
                            {facility.nazwa}
                          </div>
                          <div className="text-xs text-gray-500 font-normal">
                            {facility.typ_placowki}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromComparison(facility.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Usuń z porównania"
                        >
                          <XMarkIcon className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Cost */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    Koszt miesięczny
                  </td>
                  {selectedFacilities.map((facility) => {
                    const isMin = facility.koszt_pobytu === minCost && minCost !== null;
                    const isMax = facility.koszt_pobytu === maxCost && maxCost !== null && minCost !== maxCost;
                    
                    return (
                      <td key={facility.id} className="px-6 py-4">
                        <div className={`text-lg font-semibold ${
                          isMin ? 'text-green-600' : 
                          isMax ? 'text-red-600' : 
                          facility.koszt_pobytu ? 'text-gray-900' : 'text-green-600'
                        }`}>
                          {facility.koszt_pobytu
                            ? `${Math.round(facility.koszt_pobytu).toLocaleString('pl-PL')} zł/mc`
                            : 'Bezpłatne'}
                        </div>
                        {isMin && minCost !== null && (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            ✅ Najtańsza
                          </div>
                        )}
                        {isMax && (
                          <div className="text-xs text-red-600 font-medium mt-1">
                            ⚠️ Najdroższa
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Places */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    Liczba miejsc
                  </td>
                  {selectedFacilities.map((facility) => {
                    const isMax = facility.liczba_miejsc === maxPlaces && maxPlaces !== null;
                    
                    return (
                      <td key={facility.id} className="px-6 py-4">
                        <div className="text-lg font-semibold text-gray-900">
                          {facility.liczba_miejsc || '—'}
                        </div>
                        {isMax && (
                          <div className="text-xs text-green-600 font-medium mt-1">
                            ✅ Najwięcej miejsc
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Location */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    Lokalizacja
                  </td>
                  {selectedFacilities.map((facility) => (
                    <td key={facility.id} className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {facility.miejscowosc}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {facility.powiat}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Phone */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    Telefon
                  </td>
                  {selectedFacilities.map((facility) => (
                    <td key={facility.id} className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {facility.telefon || '—'}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Email */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    Email
                  </td>
                  {selectedFacilities.map((facility) => (
                    <td key={facility.id} className="px-6 py-4">
                      {facility.email ? (
                        <a 
                          href={`mailto:${facility.email}`}
                          className="text-sm text-accent-600 hover:text-accent-700 break-all"
                        >
                          {facility.email}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* WWW */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    Strona WWW
                  </td>
                  {selectedFacilities.map((facility) => (
                    <td key={facility.id} className="px-6 py-4">
                      {facility.www ? (
                        <a 
                          href={facility.www}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-accent-600 hover:text-accent-700"
                        >
                          Odwiedź
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* ✅ POPRAWIONE: Your Rating - Desktop */}
                <tr>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    Twoja ocena
                  </td>
                  {selectedFacilities.map((facility) => {
                    const note = getFacilityNote(facility.id);
                    const rating = note?.rating || 0;
                    const isMax = rating === maxRating && maxRating > 0;
                    const hasNote = note?.notes && note.notes.length > 0;
                    const notePreview = hasNote && note.notes.length > 50 
                      ? note.notes.substring(0, 50) + '...' 
                      : note?.notes;
                    
                    return (
                      <td key={facility.id} className="px-6 py-4">
                        {hasNote ? (
                          // MA NOTATKĘ - pokazuj i umożliw kliknięcie
                          <div
                            onClick={() => {
                              setSelectedNote({
                                facilityName: facility.nazwa,
                                rating: rating,
                                notes: note.notes
                              });
                            }}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            {rating > 0 && (
                              <>
                                <StarRating rating={rating} readonly size="sm" />
                                {isMax && (
                                  <div className="text-xs text-green-600 font-medium mt-1">
                                    ✅ Najwyżej oceniona
                                  </div>
                                )}
                              </>
                            )}
                            <div className="text-xs text-accent-600 mt-2 font-medium break-words">
                              📝 "{notePreview}" <span className="text-gray-500">(kliknij aby zobaczyć)</span>
                            </div>
                          </div>
                        ) : rating > 0 ? (
                          // MA TYLKO GWIAZDKI BEZ NOTATKI
                          <div>
                            <StarRating rating={rating} readonly size="sm" />
                            {isMax && (
                              <div className="text-xs text-green-600 font-medium mt-1">
                                ✅ Najwyżej oceniona
                              </div>
                            )}
                          </div>
                        ) : (
                          // NIE MA NIC
                          <span className="text-sm text-gray-400">Brak oceny</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Actions */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    Akcje
                  </td>
                  {selectedFacilities.map((facility) => (
                    <td key={facility.id} className="px-6 py-4">
                      <Link
                        href={`/placowka/${facility.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors text-sm font-medium"
                      >
                        Szczegóły
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile - 2x2 Comparison Grid with Swipe */}
      <div className="lg:hidden max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Headers - 2 facilities side by side */}
          <div className="bg-gray-50 border-b border-gray-200 p-3">
            <div className="grid grid-cols-2 gap-3">
              {currentPair.map((facility) => (
                <div key={facility.id} className="text-center">
                  <div className="font-semibold text-xs text-gray-900 mb-1 leading-tight">
                    {facility.nazwa}
                  </div>
                  <div className="text-xs text-gray-500">{facility.typ_placowki}</div>
                  <button
                    onClick={() => removeFromComparison(facility.id)}
                    className="mt-1.5 px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100 transition-colors"
                  >
                    Usuń
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Koszt */}
          <ComparisonRow label="Koszt miesięczny">
            {currentPair.map((facility) => {
              const isMin = facility.koszt_pobytu === minCost && minCost !== null;
              return (
                <div key={facility.id} className="bg-white p-2.5 text-center">
                  <div className={`font-bold text-base ${isMin ? 'text-green-600' : 'text-gray-900'}`}>
                    {facility.koszt_pobytu
                      ? `${Math.round(facility.koszt_pobytu).toLocaleString('pl-PL')} zł`
                      : 'Bezpłatne'}
                  </div>
                  {isMin && <div className="text-xs text-green-600 mt-0.5">✅ Najtańsza</div>}
                </div>
              );
            })}
          </ComparisonRow>

          {/* Miejsca */}
          <ComparisonRow label="Liczba miejsc">
            {currentPair.map((facility) => {
              const isMax = facility.liczba_miejsc === maxPlaces && maxPlaces !== null;
              return (
                <div key={facility.id} className="bg-white p-2.5 text-center">
                  <div className="font-semibold text-sm text-gray-900">
                    {facility.liczba_miejsc || '—'}
                  </div>
                  {isMax && <div className="text-xs text-green-600 mt-0.5">✅ Najwięcej</div>}
                </div>
              );
            })}
          </ComparisonRow>

          {/* Lokalizacja */}
          <ComparisonRow label="Lokalizacja">
            {currentPair.map((facility) => (
              <div key={facility.id} className="bg-white p-2.5 text-center">
                <div className="text-xs font-medium text-gray-900">{facility.miejscowosc}</div>
                <div className="text-xs text-gray-500">{facility.powiat}</div>
              </div>
            ))}
          </ComparisonRow>

          {/* Telefon */}
          <ComparisonRow label="Telefon">
            {currentPair.map((facility) => (
              <div key={facility.id} className="bg-white p-2.5 text-center">
                <div className="text-xs text-gray-900 break-all">{facility.telefon || '—'}</div>
              </div>
            ))}
          </ComparisonRow>

          {/* Email */}
          <ComparisonRow label="Email">
            {currentPair.map((facility) => (
              <div key={facility.id} className="bg-white p-2.5 text-center">
                {facility.email ? (
                  <a 
                    href={`mailto:${facility.email}`}
                    className="text-xs text-accent-600 hover:text-accent-700 break-all"
                  >
                    {facility.email}
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>
            ))}
          </ComparisonRow>

          {/* WWW */}
          <ComparisonRow label="Strona WWW">
            {currentPair.map((facility) => (
              <div key={facility.id} className="bg-white p-2.5 text-center">
                {facility.www ? (
                  <a 
                    href={facility.www}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent-600 hover:text-accent-700"
                  >
                    Odwiedź
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>
            ))}
          </ComparisonRow>

          {/* Ocena - Mobile (już działa dobrze) */}
          <ComparisonRow label="Twoja ocena">
            {currentPair.map((facility) => {
              const note = getFacilityNote(facility.id);
              const rating = note?.rating || 0;
              const isMax = rating === maxRating && maxRating > 0;
              const hasNote = note?.notes && note.notes.length > 0;
              
              return (
                <div key={facility.id} className="bg-white p-2.5 flex flex-col items-center justify-center">
                  {hasNote ? (
                    // MA NOTATKĘ - pokaż button do otwarcia modalu
                    <div
                      onClick={() => {
                        setSelectedNote({
                          facilityName: facility.nazwa,
                          rating: rating,
                          notes: note.notes
                        });
                      }}
                      className="cursor-pointer hover:opacity-80 transition-opacity text-center"
                    >
                      {rating > 0 && <StarRating rating={rating} readonly size="sm" />}
                      <div className="text-xs text-accent-600 mt-0.5 font-medium break-words">
                        📝 Kliknij aby zobaczyć notatkę
                      </div>
                      {isMax && <div className="text-xs text-green-600 mt-0.5">✅ Najwyższa</div>}
                    </div>
                  ) : rating > 0 ? (
                    // MA TYLKO GWIAZDKI BEZ NOTATKI
                    <>
                      <StarRating rating={rating} readonly size="sm" />
                      {isMax && <div className="text-xs text-green-600 mt-0.5">✅ Najwyższa</div>}
                    </>
                  ) : (
                    // NIE MA NIC
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>
              );
            })}
          </ComparisonRow>

          {/* Akcje */}
          <div className="bg-gray-50 p-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              {currentPair.map((facility) => (
                <Link
                  key={facility.id}
                  href={`/placowka/${facility.id}`}
                  className="px-3 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors text-center text-xs font-medium"
                >
                  Szczegóły
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation - only show if more than 2 facilities */}
          {selectedFacilities.length > 2 && (
            <div className="border-t border-gray-200 p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={prevPair}
                  disabled={currentPairIndex === 0}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
                </button>

                {/* Dots indicator */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPairs }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPairIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentPairIndex
                          ? 'bg-accent-600 w-6'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextPair}
                  disabled={currentPairIndex === totalPairs - 1}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              <div className="text-center text-xs text-gray-600">
                Para {currentPairIndex + 1} z {totalPairs} 
                {totalPairs > 1 && ' • Przesuń palcem'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <Link
          href="/ulubione"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Wróć do ulubionych
        </Link>
      </div>

      {/* Note Modal */}
      {selectedNote && (
        <NoteModal
          isOpen={selectedNote !== null}
          onClose={() => setSelectedNote(null)}
          facilityName={selectedNote.facilityName}
          rating={selectedNote.rating}
          notes={selectedNote.notes}
        />
      )}
    </div>
  );
}