/**
 * 🗄️ ARCHIVED — Mapa Polski z podziałem na województwa
 *
 * Ten komponent został zamrożony gdy zaczęliśmy skupiać się na Małopolsce.
 * Aby przywrócić: zmień nazwę pliku z RegionalMap.ARCHIVED.tsx → RegionalMap.tsx
 * (lub skopiuj zawartość do nowego RegionalMap.tsx)
 *
 * Zastąpiony przez: RegionalMap.tsx (mapa Małopolski z powiatami)
 * Data archiwizacji: 2026-02-13
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Hand, CheckCircle2, Calendar, ArrowRight, Info, MapPin } from 'lucide-react';
import { POLAND_REGIONS } from '@/data/poland-regions';

interface RegionalMapProps {
  onRegionSelect: (name: string) => void;
  totalFacilities?: number;
}

const mapData = {
  meta: {
    viewBox: '0 0 612.76 577.23',
  },
  regions: POLAND_REGIONS.map(region => ({
    id: region.id,
    name: region.name,
    status: (region.active ? 'active' : (region.upcoming ? 'upcoming' : 'inactive')) as 'active' | 'upcoming' | 'inactive',
    centroid: region.centroid,
    path: region.d
  }))
};

export default function RegionalMap({ onRegionSelect, totalFacilities = 82 }: RegionalMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [legendHover, setLegendHover] = useState<'active' | 'upcoming' | null>(null);
  const [isMapActive, setIsMapActive] = useState(false);
  const [clickedActiveRegion, setClickedActiveRegion] = useState<string | null>(null);

  const handleRegionClick = (region: any) => {
    if (region.status === 'active') {
      // Double-click logic for active regions
      if (clickedActiveRegion === region.id) {
        // Second click - navigate
        onRegionSelect(region.name);
        setClickedActiveRegion(null);
      } else {
        // First click - just mark as clicked
        setClickedActiveRegion(region.id);
        // Reset after 2 seconds
        setTimeout(() => setClickedActiveRegion(null), 2000);
      }
    }
  };

  const renderedRegions = useMemo(() => {
    return [...mapData.regions].sort((a, b) => {
      let scoreA = a.id === hoveredId ? 10 : 0;
      let scoreB = b.id === hoveredId ? 10 : 0;
      return scoreA - scoreB;
    });
  }, [hoveredId]);

  const activeRegion = hoveredId ? mapData.regions.find(r => r.id === hoveredId) : null;

  const getPillStyle = (region: typeof mapData.regions[0]) => {
    const xPercent = (region.centroid.x / 612.76) * 100;
    const yPercent = (region.centroid.y / 577.23) * 100;
    
    // Mobile-specific adjustments per region
    const mobileAdjustments: Record<string, { x: number; y: number }> = {
      'PL-DS': { x: 10, y: 0 },      // Dolnośląskie: prawo 10%
      'PL-SL': { x: 10, y: 15 },     // Śląskie: prawo 10%, dół 5% (było 10%, teraz 15% total)
      'PL-PM': { x: 0, y: 10 },      // Pomorskie: dół 10%
      'PL-WN': { x: 0, y: 10 },      // Warmińsko-Mazurskie: dół 10%
      'PL-PD': { x: 0, y: 20 },      // Podlaskie: dół 20%
      'PL-MZ': { x: 5, y: 0 },       // Mazowieckie: prawo 5%
      'PL-LU': { x: 0, y: 10 },      // Lubelskie: dół 10%
      'PL-PK': { x: 0, y: 10 },      // Podkarpackie: dół 10%
      'PL-OP': { x: 0, y: 10 },      // Opolskie: dół 10%
      'PL-LB': { x: 15, y: 0 },      // Lubuskie: prawo 15%
    };
    
    const adjustment = mobileAdjustments[region.id] || { x: 0, y: 0 };
    
    return { 
      left: `${xPercent + adjustment.x}%`, 
      top: `${yPercent + adjustment.y}%` 
    };
  };

  return (
    <section className="py-12 md:py-20 bg-white relative overflow-hidden" id="regional-coverage">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-emerald-50/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start gap-8 md:gap-12 lg:gap-28">
          
          {/* TEXT CONTENT */}
          <div className="flex-1 space-y-6 md:space-y-8 order-1 lg:order-1 relative z-10">
            <div className="space-y-4 md:space-y-6">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-[0.25em] shadow-sm">
                <MapPin size={14} className="text-emerald-700" /> Lokalne Wsparcie
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 leading-[1.05]">
                Gdzie znajdziesz pomoc<br/>
                <span className="text-emerald-700 relative inline-block">
                  dla bliskich?
                  <svg className="absolute -bottom-4 left-0 w-full h-5 text-emerald-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>
              <p className="text-slate-500 text-xl leading-relaxed max-w-xl font-medium">
                Budujemy najbardziej rzetelną mapę opieki w Polsce. <strong className="text-slate-900 font-bold">Nasz pilotaż w Małopolsce to <span className="text-emerald-600 font-extrabold">{totalFacilities}</span> zweryfikowane placówki DPS i ŚDS</strong>. Na Śląsku zakończyliśmy już 65% prac nad integracją danych.
              </p>
            </div>

            {/* STATUS CARDS - DESKTOP ONLY */}
            <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 gap-6 [perspective:1000px]">
              <RegionMiniCard 
                title="Małopolskie" 
                info="82 zweryfikowane placówki" 
                active={true}
                onClick={() => {
                  // Status cards bypass double-click (direct navigation)
                  onRegionSelect('Małopolskie');
                }}
              />
              <RegionMiniCard 
                title="Śląskie" 
                info="" 
                active={false}
                upcoming={true}
                progress={65}
                onClick={() => handleRegionClick({ name: 'Śląskie', id: 'PL-SL', status: 'upcoming' } as any)}
              />
            </div>

            {/* CTA BUTTONS - DESKTOP ONLY */}
            <div className="hidden lg:flex flex-col sm:flex-row items-center gap-6 pt-6">
               <button 
                onClick={() => {
                  // CTA button bypasses double-click
                  onRegionSelect('Małopolskie');
                }}
                className="w-full sm:w-auto bg-slate-900 text-white px-12 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:bg-emerald-600 hover:-translate-y-1 transition-all active:scale-95 group"
               >
                 Przeglądaj Małopolskę <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
               </button>
               <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                  <Info size={18} className="text-emerald-400" />
                  Pełna baza Śląska już wkrótce
               </div>
            </div>
          </div>

          {/* MAP CONTAINER */}
          <div className="flex-1 order-2 lg:order-2 flex justify-center items-start relative w-full px-4 md:px-0 -mt-16 md:-mt-20 lg:mt-0">
            <div className="relative w-full max-w-[650px] aspect-[3.5/5] p-0 group/map">
              
              <svg 
                viewBox={mapData.meta.viewBox} 
                className="w-full h-full overflow-visible transition-all duration-500 -mt-4 md:-mt-20"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Interaktywna mapa Polski pokazująca dostępność placówek opieki senioralnej w poszczególnych województwach"
              >
                <defs>
                   <linearGradient id="activeGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#064e3b" /> 
                      <stop offset="100%" stopColor="#022c22" />
                   </linearGradient>
                </defs>

                {renderedRegions.map((region) => {
                  const isActive = region.status === 'active';
                  const isUpcoming = region.status === 'upcoming' || region.status === 'inactive';
                  const isHovered = hoveredId === region.id;
                  
                  let opacity = 1;
                  
                  // EMERALD BASE COLORS
                  let fill = isActive ? 'url(#activeGreen)' : '#10b981'; // emerald-500
                  let stroke = isActive ? '#020617' : '#059669'; // emerald-600

                  if (legendHover === 'upcoming') {
                    if (isActive) {
                        opacity = 0.05;
                        fill = '#f0fdf4'; 
                        stroke = '#f0fdf4';
                    }
                    if (isUpcoming) {
                      fill = '#047857'; // emerald-700
                      stroke = '#064e3b';
                    }
                  }

                  if (legendHover === 'active') {
                    if (isUpcoming) opacity = 0.15;
                  }

                  return (
                    <path
                      key={region.id}
                      d={region.path}
                      onMouseEnter={() => setHoveredId(region.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleRegionClick(region)}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isHovered ? "3" : "1"}
                      className="transition-all duration-500 ease-in-out cursor-pointer"
                      style={{ 
                        opacity,
                        transform: isHovered ? 'translateY(-10px)' : 'none',
                        transformOrigin: 'center center',
                      }}
                    />
                  );
                })}
              </svg>

              {/* TOOLTIP */}
              {activeRegion && (
                <div 
                  className="absolute z-40 pointer-events-none"
                  style={{
                    left: `${(activeRegion.centroid.x / 612.76) * 100}%`,
                    top: `${(activeRegion.centroid.y / 577.23) * 100}%`,
                    transform: 'translate(-50%, -20%)'
                  }}
                >
                  <div className={`
                    px-5 py-3 rounded-2xl shadow-2xl flex flex-col min-w-[160px] border
                    ${activeRegion.status === 'active' 
                      ? 'bg-emerald-950 border-emerald-800 text-white' 
                      : 'bg-white border-emerald-500 text-emerald-950'}
                  `}>
                    <span className={`text-[9px] font-bold uppercase tracking-[0.2em] mb-0.5 
                      ${activeRegion.status === 'active' ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {activeRegion.status === 'active' ? 'Aktywne' : 'Wkrótce'}
                    </span>
                    <span className="font-bold text-sm leading-tight">{activeRegion.name}</span>
                    
                    {activeRegion.id === 'PL-MA' && (
                      <div className="text-[10px] font-medium text-emerald-300 mt-1">
                        <span>Baza: <strong className="text-white font-extrabold text-xs">{totalFacilities}</strong> placówki</span>
                      </div>
                    )}

                    {activeRegion.id === 'PL-SL' && (
                      <div className="mt-2 space-y-1 w-full">
                        <div className="flex justify-between text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                          <span>Postęp prac</span>
                          <span className="text-emerald-950">65%</span>
                        </div>
                        <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* LEGEND */}
              <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 space-y-3 bg-white/90 backdrop-blur-xl p-3 md:p-4 rounded-2xl border border-emerald-200 shadow-[0_8px_32px_rgba(0,0,0,0.05)] z-40">
                 <div 
                  onMouseEnter={() => setLegendHover('active')} 
                  onMouseLeave={() => setLegendHover(null)} 
                  className={`flex items-center gap-3 cursor-pointer transition-all duration-300 ${legendHover === 'active' ? 'translate-x-2' : ''}`}
                 >
                    <div className="w-4 h-4 rounded-full bg-emerald-950 shadow-[0_0_15px_rgba(6,78,59,0.4)] animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-800 tracking-widest uppercase">Regiony Aktywne</span>
                 </div>
                 <div 
                  onMouseEnter={() => setLegendHover('upcoming')} 
                  onMouseLeave={() => setLegendHover(null)} 
                  className={`flex items-center gap-3 cursor-pointer transition-all duration-300 ${legendHover === 'upcoming' ? 'translate-x-2 text-slate-900' : ''}`}
                 >
                    <div className={`w-4 h-4 rounded-full border border-emerald-600 transition-colors ${legendHover === 'upcoming' ? 'bg-emerald-600' : 'bg-emerald-500'}`}></div>
                    <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${legendHover === 'upcoming' ? 'text-slate-900' : 'text-slate-400'}`}>W przygotowaniu</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATUS CARDS - MOBILE ONLY */}
      <div className="lg:hidden mt-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 [perspective:1000px]">
            <RegionMiniCard
              title="Małopolskie"
              info={`${totalFacilities} zweryfikowane placówki`}
              active={true}
              onClick={() => {
                // Status cards bypass double-click (direct navigation)
                onRegionSelect('Małopolskie');
              }}
            />
            <RegionMiniCard 
              title="Śląskie" 
              info="" 
              active={false}
              upcoming={true}
              progress={65}
              onClick={() => handleRegionClick({ name: 'Śląskie', id: 'PL-SL', status: 'upcoming' } as any)}
            />
          </div>

          {/* CTA Buttons - MOBILE ONLY */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
             <button 
              onClick={() => {
                // CTA button bypasses double-click
                onRegionSelect('Małopolskie');
              }}
              className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-600 transition-all active:scale-95 group text-sm"
             >
               Przeglądaj Małopolskę <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
             </button>
             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                <Info size={16} className="text-emerald-400" />
                Pełna baza Śląska już wkrótce
             </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
      `}</style>
    </section>
  );
}

const RegionMiniCard = ({ title, info, active, upcoming, progress, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`p-7 rounded-3xl border transition-all duration-500 flex flex-col gap-3 group relative overflow-hidden
      [transform-style:preserve-3d] 
      ${active 
        ? 'bg-white border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)] hover:shadow-2xl hover:shadow-slate-900/15 cursor-pointer hover:border-slate-200' 
        : 'bg-slate-50/80 border-slate-100/50 cursor-pointer hover:bg-white hover:border-slate-200 hover:shadow-xl hover:shadow-slate-400/10'}`}
  >
    {active && (
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-900 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
    )}

    <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full
      ${active ? 'bg-slate-500' : 'bg-slate-400'}`}></div>

    <div className="flex justify-between items-center relative z-10 [transform:translateZ(20px)]">
      <div className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-slate-600' : 'text-slate-500'}`}>
         {active ? 'Status: Aktywne' : 'W przygotowaniu'}
      </div>
      {active ? (
        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 group-hover:rotate-12 transition-transform">
          <CheckCircle2 size={20} />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center shadow-sm">
          <Calendar size={18} />
        </div>
      )}
    </div>
    
    <div className="text-2xl font-serif font-bold text-slate-900 group-hover:text-slate-700 transition-colors [transform:translateZ(30px)]">
      {title}
    </div>
    
    {info && (
      <div className={`text-sm font-medium [transform:translateZ(10px)] ${active ? 'text-slate-500' : 'text-slate-600/80'}`}>
        {info}
      </div>
    )}

    {upcoming && progress && (
      <div className="mt-2 space-y-2 relative z-10">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
          <span>Postęp prac</span>
          <span className="text-slate-600">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-slate-400 group-hover:bg-emerald-500 transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    )}
  </div>
);
