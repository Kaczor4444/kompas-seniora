'use client';

import React, { useState, useMemo } from 'react';
import { Navigation, Hand, CheckCircle2, Calendar, ArrowRight, Info, MapPin } from 'lucide-react';
import { POLAND_REGIONS } from '@/data/poland-regions';

interface RegionalMapProps {
  onRegionSelect: (name: string) => void;
}

// Map POLAND_REGIONS to expected format with correct viewBox
const mapData = {
  meta: {
    viewBox: '0 0 612.76 577.23',
    waterBodyColor: '#b3e5fc'
  },
  regions: POLAND_REGIONS.map(region => ({
    id: region.id,
    name: region.name,
    status: (region.active ? 'active' : (region.upcoming ? 'upcoming' : 'inactive')) as 'active' | 'upcoming' | 'inactive',
    centroid: region.centroid,
    path: region.d
  }))
};

export default function RegionalMap({ onRegionSelect }: RegionalMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [legendHover, setLegendHover] = useState<'active' | 'upcoming' | null>(null);
  const [isMapActive, setIsMapActive] = useState(false);

  const handleRegionClick = (region: typeof mapData.regions[0]) => {
    if (region.status === 'active') {
      onRegionSelect(region.name);
    }
    // Dla nieaktywnych: tooltip pokazuje "W przygotowaniu" automatycznie
  };

  const renderedRegions = useMemo(() => {
    return [...mapData.regions].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;
      if (a.status === 'active') scoreA += 1;
      if (b.status === 'active') scoreB += 1;
      if (legendHover === 'upcoming') {
        if (a.status === 'upcoming') scoreA += 50;
        if (b.status === 'upcoming') scoreB += 50;
      }
      if (a.id === hoveredId) scoreA += 100;
      if (b.id === hoveredId) scoreB += 100;
      return scoreA - scoreB;
    });
  }, [hoveredId, legendHover]);

  const activeRegion = hoveredId ? mapData.regions.find(r => r.id === hoveredId) : null;

  const getPillPosition = (region: typeof mapData.regions[0]) => {
    const xPercent = (region.centroid.x / 612.76) * 100;
    const yPercent = (region.centroid.y / 577.23) * 100;
    
    const translateY = yPercent > 65 ? '-135%' : yPercent < 20 ? '25%' : '-115%';
    
    const rightSideIds = ['PL-PK', 'PL-LU', 'PL-PD', 'PL-MZ', 'PL-WN'];
    const leftSideIds = ['PL-ZP', 'PL-LB', 'PL-DS'];
    
    let translateX = -50;

    if (rightSideIds.includes(region.id)) {
      translateX = -85;
    } else if (leftSideIds.includes(region.id)) {
      translateX = -15;
    }

    return {
      left: `${xPercent}%`,
      top: `${yPercent}%`,
      transform: `translate(${translateX}%, ${translateY})`
    };
  };

  return (
    <section 
      className="py-24 bg-white relative overflow-hidden" 
      id="regional-coverage"
      aria-labelledby="regional-coverage-heading"
    >
      {/* Background soft depth glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary-50/40 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-28">
          
          {/* TEXT CONTENT */}
          <div className="flex-1 space-y-10 order-1 lg:order-1 relative z-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 text-[10px] font-bold uppercase tracking-[0.25em] shadow-sm">
                <MapPin size={14} className="text-primary-600" /> Lokalne Wsparcie
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 leading-[1.05]" id="regional-coverage-heading">
                Gdzie znajdziesz pomoc<br/>
                <span className="text-primary-600 relative inline-block">
                  dla bliskich?
                  <svg className="absolute -bottom-4 left-0 w-full h-5 text-primary-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>
              <p className="text-slate-500 text-xl leading-relaxed max-w-xl font-medium">
                Budujemy najbardziej rzetelną mapę opieki w Polsce. <strong className="text-slate-900 font-bold">Nasz pilotaż w Małopolsce to <span className="text-primary-600 font-extrabold">82</span> zweryfikowane placówki DPS i ŚDS</strong>. Na Śląsku zakończyliśmy już 65% prac nad integracją danych.
              </p>
            </div>

            <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 gap-6 [perspective:1000px]">
              <RegionMiniCard
                title="Małopolskie"
                info="82 zweryfikowane placówki"
                active={true}
                onClick={() => onRegionSelect('Małopolskie')}
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

            <div className="hidden lg:flex flex-col sm:flex-row items-center gap-6 pt-6">
               <button
                onClick={() => onRegionSelect('Małopolskie')}
                className="w-full sm:w-auto bg-slate-900 text-white px-12 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:bg-primary-600 hover:-translate-y-1 transition-all active:scale-95 group"
               >
                 Przeglądaj Małopolskę <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
               </button>
               <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                  <Info size={18} className="text-primary-400" />
                  Pełna baza Śląska już wkrótce
               </div>
            </div>
          </div>

          {/* MAP CONTAINER */}
          <div className="flex-1 order-2 lg:order-2 flex justify-center items-center relative w-full px-4 md:px-0">
            <div className="relative w-full max-w-[650px] aspect-[3.5/5] p-2 md:p-8 group/map">
              
              {/* Radial glow on hover */}
              <div className="absolute inset-0 bg-gradient-radial from-primary-500/5 to-transparent blur-3xl opacity-0 group-hover/map:opacity-100 transition-opacity duration-1000"></div>

              {/* Interaction Overlay for Mobile */}
              {!isMapActive && (
                <div 
                  onClick={() => setIsMapActive(true)}
                  className="md:hidden absolute inset-0 z-[110] bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center cursor-pointer"
                >
                  <div className="bg-white/95 p-5 rounded-3xl shadow-2xl flex flex-col items-center gap-2 border border-stone-100 animate-fade-in-up">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                      <Hand size={20} />
                    </div>
                    <span className="font-bold text-slate-800 text-xs">Dotknij, aby użyć mapy</span>
                  </div>
                </div>
              )}

              <svg 
                viewBox={mapData.meta.viewBox} 
                className={`w-full h-full overflow-visible drop-shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-500 ${!isMapActive ? 'pointer-events-none md:pointer-events-auto opacity-80 md:opacity-100' : 'pointer-events-auto opacity-100'}`}
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Interaktywna mapa Polski pokazująca dostępność placówek opieki senioralnej w poszczególnych województwach"
              >
                <defs>
                   {/* Physical texture filter - DISABLED ON MOBILE */}
                   <filter id="physical-texture">
                      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
                      <feColorMatrix type="saturate" values="0" />
                      <feComponentTransfer><feFuncA type="linear" slope="0.04" /></feComponentTransfer>
                      <feComposite operator="in" in2="SourceGraphic" />
                   </filter>

                   {/* Piece depth shadow - SIMPLIFIED ON MOBILE */}
                   <filter id="piece-depth" x="-10%" y="-10%" width="120%" height="120%">
                     <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
                     <feOffset dx="0" dy="1" result="offsetblur" />
                     <feComponentTransfer><feFuncA type="linear" slope="0.08" /></feComponentTransfer>
                     <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                   </filter>

                   {/* Hover elevation - DISABLED ON MOBILE */}
                   <filter id="map-elevate" x="-20%" y="-20%" width="140%" height="140%">
                     <feGaussianBlur in="SourceAlpha" stdDeviation="10" />
                     <feOffset dx="0" dy="10" result="offsetblur" />
                     <feComponentTransfer><feFuncA type="linear" slope="0.2" /></feComponentTransfer>
                     <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                   </filter>

                   {/* Active region gradient fill */}
                   <linearGradient id="activeFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#334155" /> 
                      <stop offset="100%" stopColor="#0f172a" />
                   </linearGradient>

                   {/* Inactive region gradient */}
                   <linearGradient id="inactiveFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" /> 
                      <stop offset="100%" stopColor="#f8fafc" />
                   </linearGradient>
                </defs>

                {/* REGIONS - with all effects */}
                {renderedRegions.map((region) => {
                  const isActive = region.status === 'active';
                  const isHovered = hoveredId === region.id;
                  const isUpcoming = !isActive;
                  const isGroupHighlight = isUpcoming && legendHover === 'upcoming';
                  const isIndividualActiveHover = isActive && (isHovered || legendHover === 'active');
                  
                  return (
                    <g key={region.id}>
                      <path
                        d={region.path}
                        onMouseEnter={() => setHoveredId(region.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => handleRegionClick(region)}
                        aria-label={`${region.name} - ${region.status === 'active' ? 'dostępne' : 'wkrótce dostępne'}`}
                        role="button"
                        tabIndex={0}
                        className={`transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] stroke-slate-200 stroke-[1.2]
                          ${isActive 
                            ? 'fill-[url(#activeFill)] cursor-pointer hover:stroke-slate-400 md:active-region-breath' 
                            : 'fill-[url(#inactiveFill)] cursor-pointer hover:fill-slate-100 hover:stroke-slate-300'
                          }
                          ${isIndividualActiveHover ? 'md:scale-[1.04] md:translate-y-[-15px] scale-[1.02] translate-y-[-8px]' : ''}
                          ${isHovered && isUpcoming && !isGroupHighlight ? 'md:scale-[1.04] md:translate-y-[-15px] scale-[1.02] translate-y-[-8px]' : ''}
                          ${isGroupHighlight ? '!fill-slate-200 !stroke-slate-300' : ''}
                        `}
                        style={{ 
                          transformOrigin: 'center center',
                          filter: isGroupHighlight 
                            ? 'none' 
                            : (isHovered || (isActive && legendHover === 'active')
                               ? 'url(#map-elevate)' 
                               : 'url(#piece-depth)'),
                          pointerEvents: 'auto'
                        }}
                      />
                      {/* Texture overlay - ONLY ON DESKTOP */}
                      <path 
                        d={region.path} 
                        className="pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] hidden md:block"
                        fill="transparent" 
                        filter="url(#physical-texture)"
                        style={{ 
                          transformOrigin: 'center center',
                          transform: (isIndividualActiveHover || (isHovered && isUpcoming && !isGroupHighlight)) ? 'scale(1.04) translateY(-15px)' : 'none'
                        }}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* DYNAMIC TOOLTIP with smart positioning */}
              {activeRegion && (
                <div 
                  className="absolute z-[140] pointer-events-none animate-fade-in-up"
                  style={getPillPosition(activeRegion)}
                >
                  <div className="bg-white/80 backdrop-blur-2xl text-slate-900 px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-white/50 ring-1 ring-black/5 flex flex-col gap-1 min-w-[180px] max-w-[calc(100vw-60px)] sm:max-w-[280px]">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col overflow-hidden">
                            <span className={`text-[8px] font-bold uppercase tracking-[0.2em] truncate ${activeRegion.status === 'active' ? 'text-slate-600' : 'text-slate-400'}`}>
                            {activeRegion.status === 'active' ? 'AKTYWNE' : 'W przygotowaniu'}
                            </span>
                            <span className="font-bold text-sm flex items-center gap-2 leading-none mt-1 truncate">
                            {activeRegion.name}
                            </span>
                        </div>
                        {activeRegion.status === 'active' ? (
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 shadow-inner shrink-0">
                                <CheckCircle2 size={16} />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-slate-400 shrink-0">
                                <Calendar size={16} className="text-slate-400" />
                            </div>
                        )}
                    </div>
                    
                    {activeRegion.id === 'PL-MA' && (
                      <div className="text-[10px] font-medium text-slate-500 mt-1">
                        <span>Baza: <strong className="text-slate-900 font-extrabold text-xs">82</strong> placówki</span>
                      </div>
                    )}

                    {activeRegion.id === 'PL-SL' && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          <span>Postęp prac</span>
                          <span className="text-slate-600">65%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-500 rounded-full animate-progress" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interactive Legend */}
              <div className="absolute bottom-2 left-2 md:bottom-4 md:left-8 space-y-3 bg-white/40 backdrop-blur-xl p-4 md:p-5 rounded-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.05)] z-[120]">
                 <div 
                  onMouseEnter={() => setLegendHover('active')}
                  onMouseLeave={() => setLegendHover(null)}
                  className={`flex items-center gap-3 cursor-pointer transition-all duration-300 ${legendHover === 'active' ? 'translate-x-2' : ''}`}
                 >
                    <div className="w-4 h-4 rounded-full bg-slate-900 shadow-[0_0_15px_rgba(15,23,42,0.4)] animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-800 tracking-widest uppercase">Regiony Aktywne</span>
                 </div>
                 <div 
                  onMouseEnter={() => setLegendHover('upcoming')}
                  onMouseLeave={() => setLegendHover(null)}
                  className={`flex items-center gap-3 cursor-pointer transition-all duration-300 ${legendHover === 'upcoming' ? 'translate-x-2 text-slate-900' : ''}`}
                 >
                    <div className={`w-4 h-4 rounded-full border border-slate-300 transition-colors ${legendHover === 'upcoming' ? 'bg-slate-400' : 'bg-white'}`}></div>
                    <span className={`text-[10px] font-bold tracking-widest uppercase transition-colors ${legendHover === 'upcoming' ? 'text-slate-900' : 'text-slate-400'}`}>W przygotowaniu</span>
                 </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* STATUS CARDS - MOBILE ONLY (poza głównym flex) */}
      <div className="lg:hidden mt-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 [perspective:1000px]">
            <RegionMiniCard
              title="Małopolskie"
              info="82 zweryfikowane placówki"
              active={true}
              onClick={() => onRegionSelect('Małopolskie')}
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
              onClick={() => onRegionSelect('Małopolskie')}
              className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-primary-600 transition-all active:scale-95 group text-sm"
             >
               Przeglądaj Małopolskę <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
             </button>
             <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                <Info size={16} className="text-primary-400" />
                Pełna baza Śląska już wkrótce
             </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 65%; }
        }
        @keyframes active-breath {
          0% { transform: scale(1); }
          50% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        .active-region-breath {
          animation: active-breath 4.5s ease-in-out infinite;
          transform-origin: center center;
        }
        .animate-progress {
          animation: progress 1.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        .bg-gradient-radial {
          background-image: radial-gradient(var(--tw-gradient-stops));
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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
            className="h-full bg-slate-400 group-hover:bg-primary-500 transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    )}
  </div>
);