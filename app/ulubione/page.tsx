'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Trash2, ArrowLeft, Share2, Printer, ArrowLeftRight,
  MapPin, Phone, CheckCircle2, Plus, X, Building2, Wallet,
  ExternalLink, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getFavorites, removeFavorite, getMaxFavorites, type FavoriteFacility } from '@/src/utils/favorites';
import FacilityNotesDisplay from '@/src/components/FacilityNotesDisplay';
import { getProfileOpiekiNazwy } from '@/src/data/profileopieki';

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteFacility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
    setIsLoading(false);

    const handleFavoritesChange = () => setFavorites(getFavorites());
    window.addEventListener('favoritesChanged', handleFavoritesChange);
    window.addEventListener('storage', handleFavoritesChange);
    return () => {
      window.removeEventListener('favoritesChanged', handleFavoritesChange);
      window.removeEventListener('storage', handleFavoritesChange);
    };
  }, []);

  const handleRemove = (facilityId: number, facilityName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = removeFavorite(facilityId);
    if (result.success) {
      setFavorites(prev => prev.filter(f => f.id !== facilityId));
      setSelectedForCompare(prev => prev.filter(id => id !== facilityId));
      toast.success(`Usunięto ${facilityName} z ulubionych`, { icon: '💔', duration: 2000 });
      window.dispatchEvent(new CustomEvent('favoritesChanged'));
    } else {
      toast.error(result.message);
    }
  };

  const toggleCompare = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForCompare(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length >= 3 ? prev : [...prev, id]
    );
  };

  const handleShare = async () => {
    if (favorites.length === 0) { toast.error('Brak placówek do udostępnienia'); return; }
    setIsSharing(true);
    try {
      const ids = favorites.map(f => f.id);
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error('Failed to create share link');
      const data = await response.json();
      await navigator.clipboard.writeText(data.url);
      toast.success(
        <div><p className="font-semibold">Link skopiowany! 📋</p><p className="text-sm mt-1">Wklej w SMS, email lub WhatsApp</p></div>,
        { duration: 4000, icon: '🔗' }
      );
    } catch {
      toast.error('Nie udało się utworzyć linku. Spróbuj ponownie.');
    } finally {
      setIsSharing(false);
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Otwarto podgląd wydruku', { icon: '🖨️', duration: 2000 });
  };

  const handleBack = () => {
    const returnUrl = sessionStorage.getItem('returnUrl');
    if (returnUrl && returnUrl.includes('/search')) {
      router.push(returnUrl);
      sessionStorage.removeItem('returnUrl');
    } else {
      router.push('/search');
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(amount);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24">

      {/* Print header */}
      <div className="print-only">
        <div className="text-center mb-6 pb-4 border-b-2 border-stone-300">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Ulubione Placówki – kompas-seniora.pl</h1>
          <p className="text-slate-600">Wydrukowano: {new Date().toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p className="text-slate-600 mt-1">Liczba placówek: {favorites.length}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back link */}
        <button
          onClick={handleBack}
          className="group flex items-center gap-2 text-slate-600 hover:text-primary-600 font-bold mb-8 transition-colors px-4 py-2 rounded-xl hover:bg-white/80 w-fit no-print"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center group-hover:border-primary-300 transition-colors shadow-sm">
            <ArrowLeft size={16} />
          </div>
          Wróć do wyszukiwania
        </button>

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6 no-print">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-red-100">
              <Heart size={12} className="fill-current" /> Schowek ulubionych
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-none">
              Twoje miejsca
            </h1>
            <p className="text-slate-500 text-lg">
              {favorites.length} / {getMaxFavorites()} placówek · Wybierz do 3, aby porównać
            </p>
          </div>

          {favorites.length >= 2 && (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => {
                  if (selectedForCompare.length >= 2) {
                    router.push(`/ulubione/porownaj?ids=${selectedForCompare.join(',')}`);
                  } else {
                    router.push('/ulubione/porownaj');
                  }
                }}
                disabled={selectedForCompare.length < 2}
                className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-extrabold flex items-center justify-center gap-3 transition-all shadow-xl ${
                  selectedForCompare.length >= 2
                    ? 'bg-slate-900 text-white hover:bg-primary-600 active:scale-95'
                    : 'bg-stone-100 text-stone-300 cursor-not-allowed border border-stone-200 shadow-none'
                }`}
              >
                <ArrowLeftRight size={20} />
                Porównaj wybrane ({selectedForCompare.length})
              </button>
              {selectedForCompare.length > 0 && (
                <button
                  onClick={() => setSelectedForCompare([])}
                  className="text-slate-400 hover:text-red-500 font-bold text-sm underline underline-offset-4 transition-colors"
                >
                  Wyczyść wybór
                </button>
              )}
            </div>
          )}
        </div>

        {/* Empty state */}
        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-stone-100 shadow-sm p-12 text-center max-w-lg mx-auto"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-red-50/50">
              <Heart size={36} className="text-red-300" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-3">Twój schowek jest pusty</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Przeglądaj placówki i klikaj serce, aby zapisywać te, które Cię zainteresują.
            </p>
            <button
              onClick={handleBack}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-extrabold hover:bg-primary-600 transition-all shadow-xl flex items-center gap-3 mx-auto active:scale-95"
            >
              <ArrowLeft size={18} /> Przejdź do wyszukiwarki
            </button>
          </motion.div>
        ) : (
          <>
            {/* Cards grid */}
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((facility, index) => {
                  const profileNazwy = facility.profil_opieki ? getProfileOpiekiNazwy(facility.profil_opieki) : [];
                  const isSelected = selectedForCompare.includes(facility.id);
                  const isDPS = facility.typ_placowki === 'DPS';

                  return (
                    <motion.div
                      key={facility.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -80 }}
                      transition={{ duration: 0.25, delay: index * 0.04 }}
                      layout
                      className={`group bg-white rounded-3xl border transition-all duration-300 overflow-hidden relative print-card ${
                        isSelected
                          ? 'border-slate-900 ring-4 ring-slate-100 -translate-y-1 shadow-xl'
                          : 'border-stone-100 hover:border-stone-300 hover:shadow-lg'
                      }`}
                    >
                      {/* Colored header */}
                      <div className={`relative h-36 flex flex-col justify-end p-5 ${
                        isDPS
                          ? 'bg-gradient-to-br from-primary-600 to-primary-800'
                          : 'bg-gradient-to-br from-indigo-500 to-indigo-700'
                      }`}>
                        {/* Remove button */}
                        <button
                          onClick={(e) => handleRemove(facility.id, facility.nazwa, e)}
                          className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-red-500 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all no-print"
                          title="Usuń z ulubionych"
                        >
                          <Trash2 size={16} />
                        </button>

                        {/* Compare toggle */}
                        <button
                          onClick={(e) => toggleCompare(facility.id, e)}
                          disabled={!isSelected && selectedForCompare.length >= 3}
                          className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all no-print ${
                            isSelected
                              ? 'bg-white text-slate-900'
                              : 'bg-white/20 text-white hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed'
                          }`}
                        >
                          {isSelected ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                          {isSelected ? 'DO PORÓWNANIA' : 'PORÓWNAJ'}
                        </button>

                        {/* Price & type */}
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-[10px] font-extrabold text-white/60 uppercase tracking-widest mb-1">
                              {facility.typ_placowki}
                            </div>
                            <div className="text-2xl font-serif font-bold text-white">
                              {facility.koszt_pobytu
                                ? formatCurrency(facility.koszt_pobytu) + '/mc'
                                : <span className="text-emerald-300">Bezpłatne</span>
                              }
                            </div>
                          </div>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDPS ? 'bg-white/20' : 'bg-white/20'}`}>
                            <Building2 size={20} className="text-white/80" />
                          </div>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-5">
                        <h3 className="font-serif text-xl font-bold text-slate-900 mb-1 leading-snug group-hover:text-primary-700 transition-colors line-clamp-2">
                          {facility.nazwa}
                        </h3>

                        <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
                          <MapPin size={14} className="text-primary-500 flex-shrink-0" />
                          {facility.miejscowosc}
                          {facility.powiat && <span className="text-slate-400">· pow. {facility.powiat}</span>}
                        </div>

                        {facility.telefon && (
                          <a
                            href={`tel:${facility.telefon.replace(/\s/g, '')}`}
                            onClick={e => e.stopPropagation()}
                            className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 mb-3 transition-colors"
                          >
                            <Phone size={13} className="text-slate-400" /> {facility.telefon}
                          </a>
                        )}

                        {profileNazwy.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {profileNazwy.slice(0, 3).map((nazwa, idx) => (
                              <span key={idx} className="text-[10px] font-bold uppercase px-2 py-1 bg-stone-50 text-slate-500 rounded-lg border border-stone-100 tracking-wide">
                                {nazwa}
                              </span>
                            ))}
                          </div>
                        )}

                        <FacilityNotesDisplay facilityId={facility.id} facilityName={facility.nazwa} compact />

                        {/* Actions */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100 no-print">
                          <Link
                            href={`/placowka/${facility.id}`}
                            className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm text-center transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          >
                            Zobacz profil <ChevronRight size={14} />
                          </Link>
                          {facility.www && (
                            <a
                              href={facility.www}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-slate-600 rounded-xl transition-colors"
                              title="Strona www"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>

            {/* Bottom actions */}
            <div className="mt-10 pt-8 border-t border-stone-200 flex flex-wrap gap-3 justify-center no-print">
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 text-slate-700 rounded-xl font-bold text-sm hover:border-primary-300 hover:text-primary-700 transition-all disabled:opacity-50 shadow-sm"
              >
                <Share2 size={16} /> Udostępnij listę
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 text-slate-700 rounded-xl font-bold text-sm hover:border-slate-400 transition-all shadow-sm"
              >
                <Printer size={16} /> Drukuj / PDF
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4 no-print">
              💡 Drukuj → &quot;Zapisz jako PDF&quot; żeby mieć kopię do zabrania do urzędu
            </p>
          </>
        )}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .print-card { page-break-inside: avoid; border: 1px solid #e5e7eb !important; margin-bottom: 1rem !important; box-shadow: none !important; }
        }
        .print-only { display: none; }
      `}</style>
    </div>
  );
}
