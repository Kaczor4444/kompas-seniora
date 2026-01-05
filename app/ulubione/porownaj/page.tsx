'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, MapPin, CheckCircle2, Phone, 
  Info, Banknote, CalendarCheck, Building2, 
  Plus, ArrowRight, Sparkles, Minus, 
  ArrowLeftRight, Mail, Globe
} from 'lucide-react';
import { getFavorites, type FavoriteFacility } from '@/src/utils/favorites';
import { getFacilityNote } from '@/src/utils/facilityNotes';
import StarRating from '@/src/components/StarRating';

function ComparePageContent() {
  const searchParams = useSearchParams();
  const [facilities, setFacilities] = useState<FavoriteFacility[]>([]);
  const [selectedFacilities, setSelectedFacilities] = useState<FavoriteFacility[]>([]);
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const favs = getFavorites();
    setFacilities(favs);
    
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const parsedIds = idsParam.split(",").map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      const selected = favs.filter(f => parsedIds.includes(f.id));
      setSelectedFacilities(selected.length > 0 ? selected : favs);
    } else {
      setSelectedFacilities(favs);
    }
    window.scrollTo(0, 0);
  }, [searchParams]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const cardWidth = window.innerWidth - 120;
    const index = Math.round(scrollLeft / cardWidth);
    if (index !== activeIndex && index >= 0 && index < selectedFacilities.length) {
      setActiveIndex(index);
    }
  };

  // Calculate differences
  const diffs = useMemo(() => {
    if (selectedFacilities.length < 2) return { price: false, city: false, type: false };
    return {
      price: new Set(selectedFacilities.map(f => f.koszt_pobytu)).size > 1,
      city: new Set(selectedFacilities.map(f => f.miejscowosc)).size > 1,
      type: new Set(selectedFacilities.map(f => f.typ_placowki)).size > 1
    };
  }, [selectedFacilities]);

  // Find lowest price
  const costs = selectedFacilities.map(f => f.koszt_pobytu).filter(c => c !== null && c !== undefined) as number[];
  const lowestPrice = costs.length > 0 ? Math.min(...costs) : null;

  // Find max rating
  const ratings = selectedFacilities.map(f => {
    const note = getFacilityNote(f.id);
    return note?.rating || 0;
  });
  const maxRating = Math.max(...ratings);

  const emptySlotsCount = Math.max(0, 3 - selectedFacilities.length);

  if (selectedFacilities.length === 0) {
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Wróć do wyszukiwania
          </Link>
        </div>
      </div>
    );
  }

  const DataRow = ({ 
    label, 
    icon, 
    children, 
    isDifferent = false 
  }: { 
    label: string; 
    icon: React.ReactNode; 
    children: React.ReactNode; 
    isDifferent?: boolean;
  }) => {
    const isDimmed = showOnlyDiffs && !isDifferent;
    const isHighlighted = showOnlyDiffs && isDifferent;

    return (
      <div className={`grid grid-cols-[100px_repeat(3,calc(100vw-120px))] md:grid-cols-[200px_repeat(3,1fr)] border-b border-stone-100 items-stretch transition-all duration-500
        ${isDimmed ? 'opacity-20 grayscale-[1]' : 'opacity-100'}
        ${isHighlighted ? 'bg-primary-50/30' : 'bg-white'}
      `}>
        <div className={`p-4 md:p-10 flex flex-col justify-center border-r border-stone-100 sticky left-0 z-20 transition-colors
          ${isHighlighted ? 'bg-primary-50' : 'bg-white md:bg-stone-50/50'}
        `}>
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className={`${isHighlighted ? 'text-primary-600' : 'text-slate-400'}`}>{icon}</span>
            <span className={`text-[10px] md:text-xs font-black uppercase tracking-tighter leading-tight ${isHighlighted ? 'text-primary-700' : 'text-slate-500'}`}>
              {label}
            </span>
          </div>
        </div>
        {children}
      </div>
    );
  };

  const DataCell = ({ children, isBest }: { children: React.ReactNode; isBest?: boolean }) => (
    <div className={`p-6 md:p-10 flex items-center justify-center text-center border-r border-stone-100 last:border-r-0 snap-center relative transition-colors
      ${isBest ? 'bg-emerald-50/10' : ''}
    `}>
      {children}
    </div>
  );

  return (
    <div className="bg-[#FCFCFB] min-h-screen pb-24 animate-fade-in-up">
      
      {/* STICKY HEADER */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-stone-200 sticky top-0 z-[60] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/ulubione" className="p-2 -ml-2 text-slate-400 hover:text-primary-600 transition-all active:scale-75">
                <ArrowLeft size={22} />
              </Link>
              <h1 className="text-lg md:text-2xl font-serif font-bold text-slate-900 leading-tight">
                Wybrane <span className="text-primary-600">placówki</span>
              </h1>
            </div>

            <button 
              onClick={() => setShowOnlyDiffs(!showOnlyDiffs)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border
                ${showOnlyDiffs 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200' 
                  : 'bg-stone-50 text-slate-600 border-stone-200 hover:border-primary-300 hover:bg-white hover:text-primary-600'}`}
            >
              <ArrowLeftRight size={14} className={showOnlyDiffs ? 'text-primary-400' : ''} />
              <span className="hidden sm:inline">{showOnlyDiffs ? 'Ukryj różnice' : 'Pokaż różnice'}</span>
              <span className="sm:hidden">{showOnlyDiffs ? 'Wszystko' : 'Różnice'}</span>
            </button>
          </div>
          
          {/* Mobile Pager */}
          <div className="flex md:hidden justify-center gap-2 mt-3">
             {selectedFacilities.map((_, i) => (
               <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-8 bg-primary-600' : 'w-2 bg-stone-200'}`} />
             ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto md:py-8">
        <div className="relative">
          
          {/* COMPARISON GRID */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-x"
          >
            <div className="inline-block min-w-full bg-white md:rounded-[3rem] shadow-2xl border-y md:border border-stone-200 overflow-hidden">
              
              {/* HEADERS */}
              <div className="grid grid-cols-[100px_repeat(3,calc(100vw-120px))] md:grid-cols-[200px_repeat(3,1fr)] border-b-2 border-stone-100 bg-white/95 backdrop-blur-md sticky top-0 z-40">
                <div className="px-2 py-1 md:px-6 md:py-2 flex flex-col justify-end border-r border-stone-100 sticky left-0 z-50 bg-white">
                   <h3 className="font-serif text-sm md:text-xl font-bold text-slate-900 leading-tight">Zestawienie<br/>szczegółów</h3>
                </div>
                
                {selectedFacilities.map((item, idx) => (
                  <div key={item.id} className={`px-2 py-1 md:px-6 md:py-2 border-r border-stone-100 last:border-r-0 snap-center transition-opacity duration-300 ${activeIndex === idx ? 'opacity-100' : 'opacity-30 md:opacity-100'}`}>
                    <div className="relative">
                      <div className="text-[10px] md:text-xs font-black uppercase text-primary-600 mb-1">{item.typ_placowki}</div>
                      <h4 className="font-bold text-sm md:text-lg text-slate-900 font-bold line-clamp-2 min-h-[2.5rem] leading-tight">{item.nazwa}</h4>
                    </div>
                  </div>
                ))}

                {[...Array(emptySlotsCount)].map((_, i) => (
                  <div key={`head-empty-${i}`} className="p-10 border-r border-stone-100 last:border-r-0 bg-stone-50/20 hidden md:flex flex-col items-center justify-center text-stone-200 border-dashed">
                    <Plus size={40} className="opacity-20 mb-2" />
                    <span className="text-[10px] font-bold uppercase opacity-30 tracking-widest text-center">Wolne<br/>miejsce</span>
                  </div>
                ))}
              </div>

              {/* PRICE ROW */}
              <DataRow label="Koszt mies." icon={<Banknote size={18}/>} isDifferent={diffs.price}>
                 {selectedFacilities.map(item => {
                   const isLowest = item.koszt_pobytu === lowestPrice && lowestPrice !== null;
                   return (
                     <DataCell key={item.id} isBest={isLowest}>
                        <div className="w-full">
                          <div className="text-xl md:text-4xl font-serif font-bold text-slate-900">
                            {item.koszt_pobytu && item.koszt_pobytu > 0 
                              ? `${Math.round(item.koszt_pobytu).toLocaleString('pl-PL')} zł` 
                              : <span className="text-emerald-600">Bezpłatne</span>
                            }
                          </div>
                          {isLowest && item.koszt_pobytu && item.koszt_pobytu > 0 && (
                            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] md:text-[9px] font-black rounded-full uppercase">
                               <Sparkles size={10}/> Najtaniej
                            </div>
                          )}
                        </div>
                     </DataCell>
                   );
                 })}
                 {[...Array(emptySlotsCount)].map((_, i) => <DataCell key={i}><Minus className="text-stone-100"/></DataCell>)}
              </DataRow>

              {/* LOCATION ROW */}
              <DataRow label="Lokalizacja" icon={<MapPin size={18}/>} isDifferent={diffs.city}>
                 {selectedFacilities.map(item => (
                   <DataCell key={item.id}>
                      <div className="text-[10px] md:text-sm font-bold text-slate-700 leading-tight">
                        {item.miejscowosc}<br/>
                        <span className="text-[9px] font-medium text-slate-400 block mt-1">{item.powiat}</span>
                      </div>
                   </DataCell>
                 ))}
                 {[...Array(emptySlotsCount)].map((_, i) => <DataCell key={i}><Minus className="text-stone-100"/></DataCell>)}
              </DataRow>

              {/* TYPE ROW */}
              <DataRow label="Typ" icon={<Building2 size={18}/>} isDifferent={diffs.type}>
                 {selectedFacilities.map(item => (
                   <DataCell key={item.id}>
                      <div className="text-[9px] md:text-[10px] font-bold uppercase text-slate-500 bg-stone-100 px-3 py-2 rounded-xl border border-stone-200 w-full leading-tight">
                        {item.typ_placowki}
                      </div>
                   </DataCell>
                 ))}
                 {[...Array(emptySlotsCount)].map((_, i) => <DataCell key={i}><Minus className="text-stone-100"/></DataCell>)}
              </DataRow>

              {/* PLACES ROW */}
              <DataRow label="Miejsca" icon={<CheckCircle2 size={18}/>} isDifferent={false}>
                 {selectedFacilities.map(item => (
                   <DataCell key={item.id}>
                      <div className="text-lg md:text-2xl font-bold text-slate-900">
                        {item.liczba_miejsc || '—'}
                      </div>
                   </DataCell>
                 ))}
                 {[...Array(emptySlotsCount)].map((_, i) => <DataCell key={i}><Minus className="text-stone-100"/></DataCell>)}
              </DataRow>

              {/* RATING ROW */}
              <DataRow label="Twoja ocena" icon={<Sparkles size={18}/>} isDifferent={false}>
                 {selectedFacilities.map(item => {
                   const note = getFacilityNote(item.id);
                   const rating = note?.rating || 0;
                   const isBest = rating === maxRating && maxRating > 0;
                   
                   return (
                     <DataCell key={item.id} isBest={isBest}>
                        {rating > 0 ? (
                          <div>
                            <StarRating rating={rating} readonly size="sm" />
                            {isBest && (
                              <div className="text-xs text-emerald-600 font-bold mt-1">✨ Najwyższa</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Brak oceny</span>
                        )}
                     </DataCell>
                   );
                 })}
                 {[...Array(emptySlotsCount)].map((_, i) => <DataCell key={i}><Minus className="text-stone-100"/></DataCell>)}
              </DataRow>

              {/* CONTACT ROWS */}
              <DataRow label="Telefon" icon={<Phone size={18}/>} isDifferent={false}>
                 {selectedFacilities.map(item => (
                   <DataCell key={item.id}>
                      {item.telefon ? (
                        <a href={`tel:${item.telefon}`} className="text-xs md:text-sm text-primary-600 hover:text-primary-700 font-medium">
                          {item.telefon}
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                   </DataCell>
                 ))}
                 {[...Array(emptySlotsCount)].map((_, i) => <DataCell key={i}><Minus className="text-stone-100"/></DataCell>)}
              </DataRow>

              {/* ACTIONS FOOTER */}
              <div className="grid grid-cols-[100px_repeat(3,calc(100vw-120px))] md:grid-cols-[200px_repeat(3,1fr)] bg-slate-950 border-t border-slate-800">
                <div className="p-4 md:p-12 border-r border-white/5 sticky left-0 z-20 bg-slate-950 flex flex-col justify-center">
                  <Link href="/ulubione" className="text-white hover:text-primary-400 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <ArrowLeft size={16}/> <span className="hidden md:inline">Cofnij</span>
                  </Link>
                </div>
                
                {selectedFacilities.map(item => (
                  <div key={item.id} className="p-4 md:p-10 border-r border-white/5 last:border-r-0 flex flex-col gap-2 snap-center">
                    <Link 
                      href={`/placowka/${item.id}`}
                      className="w-full py-3.5 md:py-5 rounded-xl md:rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-black text-[9px] md:text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-primary-900/40 text-center"
                    >
                      Szczegóły
                    </Link>
                    {item.telefon && (
                      <a 
                        href={`tel:${item.telefon}`}
                        className="w-full py-2.5 md:py-3.5 rounded-xl md:rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-[8px] md:text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/10"
                      >
                        <Phone size={14} /> Kontakt
                      </a>
                    )}
                  </div>
                ))}
                {[...Array(emptySlotsCount)].map((_, i) => <div key={i} className="hidden md:block"></div>)}
              </div>

            </div>
          </div>
        </div>

        {/* BOTTOM INFO CARDS */}
        <div className="mt-12 md:mt-24 px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
           <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-stone-200 shadow-sm flex flex-col md:flex-row gap-8 items-start hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                 <Info size={28} />
              </div>
              <div>
                 <h4 className="text-xl font-bold text-slate-900 mb-2 leading-tight">Jak czytać porównanie?</h4>
                 <p className="text-slate-500 text-sm leading-relaxed mb-6">
                   Podane kwoty to stawki bazowe ustalane przez samorządy. Ostateczny koszt zależy od dochodu seniora (zazwyczaj 70% emerytury).
                 </p>
                 <Link href="/poradniki" className="text-primary-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 group hover:text-primary-700">
                    Zasady odpłatności <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                 </Link>
              </div>
           </div>

           <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500 opacity-20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
              <div className="relative z-10">
                <h4 className="text-2xl font-bold mb-3">Eksportuj do PDF</h4>
                <p className="text-slate-400 text-sm mb-8 max-w-sm font-medium">
                  Pobierz zestawienie tych placówek, aby móc je wydrukować lub omówić z rodziną przy stole.
                </p>
                <button className="bg-white text-slate-900 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all shadow-lg active:scale-95">
                  Generuj dokument
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}