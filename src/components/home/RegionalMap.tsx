'use client';

import React, { useState } from 'react';
import { Navigation, MousePointer2, CheckCircle2, Sparkles, ArrowRight, Info } from 'lucide-react';

const POLAND_REGIONS = [
  { id: 'PL-ZP', name: 'Zachodniopomorskie', path: 'M48,135 C52,125 55,120 58,115 C62,110 58,105 53,100 C48,95 45,90 50,98 C55,105 62,90 68,83 C75,75 80,77 88,79 C95,81 105,70 120,76 C135,83 140,75 150,111 C160,145 172,130 180,145 C175,158 165,168 160,183 C155,198 145,203 130,198 C115,193 85,188 70,193 C55,198 52,175 48,135 Z', centroid: { x: 100, y: 150 }, status: 'inactive' },
  { id: 'PL-PM', name: 'Pomorskie', path: 'M150,111 C160,95 170,90 180,87 C195,83 210,77 230,83 C245,87 260,100 265,115 C270,140 255,160 240,170 C225,180 205,175 180,145 C165,125 155,120 150,111 Z', centroid: { x: 205, y: 125 }, status: 'inactive' },
  { id: 'PL-WN', name: 'Warmińsko-Mazurskie', path: 'M265,115 C285,110 315,113 345,117 C370,120 380,135 385,160 C390,185 375,205 360,210 C345,215 325,220 305,205 C285,190 270,180 265,115 Z', centroid: { x: 325, y: 160 }, status: 'inactive' },
  { id: 'PL-PD', name: 'Podlaskie', path: 'M385,160 C405,165 430,180 440,205 C450,245 445,280 430,305 C415,330 385,335 365,320 C350,305 345,275 350,235 C355,195 370,175 385,160 Z', centroid: { x: 395, y: 245 }, status: 'inactive' },
  { id: 'PL-MZ', name: 'Mazowieckie', path: 'M270,210 C295,220 325,225 350,235 C360,275 370,315 355,355 C340,395 305,415 275,405 C245,395 235,355 245,295 C255,245 260,220 270,210 Z', centroid: { x: 300, y: 310 }, status: 'inactive' },
  { id: 'PL-WP', name: 'Wielkopolskie', path: 'M130,198 C155,198 185,193 210,183 C230,188 250,203 260,233 C270,283 265,323 245,363 C225,403 175,413 140,383 C115,353 110,293 120,243 C125,218 127,208 130,198 Z', centroid: { x: 190, y: 300 }, status: 'inactive' },
  { id: 'PL-KP', name: 'Kujawsko-Pomorskie', path: 'M210,183 C230,178 250,173 265,115 C270,140 280,180 270,210 C260,220 235,225 210,183 Z', centroid: { x: 245, y: 170 }, status: 'inactive' },
  { id: 'PL-LB', name: 'Lubuskie', path: 'M50,193 C75,193 95,198 120,243 C110,273 105,303 110,343 C105,373 75,393 50,378 C40,343 43,243 50,193 Z', centroid: { x: 85, y: 285 }, status: 'inactive' },
  { id: 'PL-DS', name: 'Dolnośląskie', path: 'M80,393 C115,403 155,413 180,423 C200,453 210,493 195,543 C170,583 115,573 90,533 C80,493 77,443 80,393 Z', centroid: { x: 137, y: 488 }, status: 'inactive' },
  { id: 'PL-LD', name: 'Łódzkie', path: 'M245,363 C275,378 305,383 315,433 C305,473 275,503 235,493 C215,473 210,433 245,363 Z', centroid: { x: 265, y: 433 }, status: 'inactive' },
  { id: 'PL-LU', name: 'Lubelskie', path: 'M355,355 C385,365 420,380 430,435 C440,485 415,525 375,545 C345,535 335,485 355,355 Z', centroid: { x: 390, y: 445 }, status: 'inactive' },
  { id: 'PL-OP', name: 'Opolskie', path: 'M195,443 C225,453 245,463 255,513 C235,553 205,563 185,533 C189,493 192,463 195,443 Z', centroid: { x: 220, y: 503 }, status: 'inactive' },
  { id: 'PL-SL', name: 'Śląskie', path: 'M255,513 C285,518 315,523 325,573 C305,623 265,633 235,613 C239,573 249,533 255,513 Z', centroid: { x: 280, y: 573 }, status: 'upcoming' },
  { id: 'PL-MA', name: 'Małopolskie', path: 'M325,523 C365,533 395,543 410,593 C400,663 335,683 305,653 C309,603 319,553 325,523 Z', centroid: { x: 357, y: 603 }, status: 'active' },
  { id: 'PL-PK', name: 'Podkarpackie', path: 'M410,573 C440,583 470,593 480,673 C460,733 395,733 370,693 C380,643 395,603 410,573 Z', centroid: { x: 435, y: 653 }, status: 'inactive' },
  { id: 'PL-SK', name: 'Świętokrzyskie', path: 'M315,433 C345,443 375,453 385,503 C365,543 335,553 325,523 C319,483 317,453 315,433 Z', centroid: { x: 350, y: 488 }, status: 'inactive' }
];

interface RegionalMapProps {
  onRegionSelect: (name: string) => void;
}

export default function RegionalMap({ onRegionSelect }: RegionalMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleRegionClick = (region: typeof POLAND_REGIONS[0]) => {
    if (region.status === 'active') {
      onRegionSelect(region.name);
    }
  };

  const activeRegion = hoveredId ? POLAND_REGIONS.find(r => r.id === hoveredId) : null;

  return (
    <section className="py-24 bg-white overflow-hidden relative" id="regional-coverage">
      {/* Background soft depth glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-slate-50 rounded-full blur-[160px] pointer-events-none opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-20 lg:gap-32">

          {/* TEXT CONTENT */}
          <div className="flex-1 space-y-10 order-2 lg:order-1">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-[10px] font-bold uppercase tracking-[0.25em] shadow-sm">
                <Navigation size={14} className="animate-bounce" /> Zasięg Terytorialny
              </div>
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 leading-[1.05]">
                Dostępność w<br/>
                <span className="text-primary-600 relative inline-block">
                  Twoim Regionie
                  <svg className="absolute -bottom-4 left-0 w-full h-5 text-primary-200" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="8" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
              </h2>
              <p className="text-slate-500 text-xl leading-relaxed max-w-xl font-medium">
                Naszym celem jest objęcie opieką całej Polski. Aktualnie oferujemy pełną bazę placówek w regionie pilotażowym.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <RegionMiniCard
                title="Małopolskie"
                info="Pełna Baza (Aktywne)"
                active={true}
                onClick={() => onRegionSelect('Małopolskie')}
              />
              <RegionMiniCard
                title="Śląskie"
                info="Integracja danych"
                active={false}
                upcoming={true}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-6">
               <button
                onClick={() => onRegionSelect('Małopolskie')}
                className="w-full sm:w-auto bg-slate-900 text-white px-12 py-5 rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-2xl hover:bg-primary-600 transition-all active:scale-95 group"
               >
                 Przeszukaj Małopolskę <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
               </button>
               <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                  <Info size={18} className="text-primary-400" />
                  Rozwój ogólnopolski w toku
               </div>
            </div>
          </div>

          {/* MAP CONTAINER */}
          <div className="flex-1 order-1 lg:order-2 flex justify-center items-center relative">
            <div className="relative w-full max-w-[650px] aspect-[4/5] bg-white rounded-[5rem] border border-stone-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] p-12 md:p-16 overflow-hidden">

              <svg
                viewBox="0 0 550 750"
                className="w-full h-full"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                   <filter id="map-elevate" x="-30%" y="-30%" width="160%" height="160%">
                     <feGaussianBlur in="SourceAlpha" stdDeviation="15" />
                     <feOffset dx="0" dy="15" result="offsetblur" />
                     <feComponentTransfer>
                       <feFuncA type="linear" slope="0.25" />
                     </feComponentTransfer>
                     <feMerge>
                       <feMergeNode />
                       <feMergeNode in="SourceGraphic" />
                     </feMerge>
                   </filter>

                   <linearGradient id="activeRegionFill" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#ecfdf5" />
                   </linearGradient>
                </defs>

                {/* WATER BODY (BALTIC SEA) */}
                <path
                  d="M0,80 Q275,100 550,80 L550,0 L0,0 Z"
                  fill="#b3e5fc"
                  className="opacity-40"
                />
                <path d="M0,80 Q275,100 550,80" stroke="#90caf9" strokeWidth="1" fill="none" opacity="0.3" />

                {/* REGIONS - RENDERED DETERMINISTICALLY */}
                {POLAND_REGIONS.map((region) => {
                  const isActive = region.status === 'active';
                  const isUpcoming = region.status === 'upcoming';
                  const isHovered = hoveredId === region.id;

                  return (
                    <path
                      key={region.id}
                      d={region.path}
                      onMouseEnter={() => setHoveredId(region.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => handleRegionClick(region)}
                      className={`transition-all duration-700 ease-[cubic-bezier(0.2,1,0.3,1)] stroke-black stroke-[0.7]
                        ${isActive
                          ? 'fill-[url(#activeRegionFill)] cursor-pointer hover:fill-primary-100 hover:stroke-[1.2]'
                          : isUpcoming
                            ? 'fill-white cursor-help hover:fill-slate-50'
                            : 'fill-white hover:fill-slate-50'
                        }
                        ${isHovered ? 'scale-[1.04] translate-y-[-10px]' : ''}
                      `}
                      style={{
                        transformOrigin: 'center center',
                        filter: isHovered ? 'url(#map-elevate)' : 'none',
                        zIndex: isHovered ? 50 : 1
                      }}
                    />
                  );
                })}
              </svg>

              {/* DYNAMIC TOOLTIP USING CENTROID FROM DATA */}
              {activeRegion && (
                <div
                  className="absolute z-50 pointer-events-none animate-fade-in-up"
                  style={{
                    left: `${(activeRegion.centroid.x / 550) * 100}%`,
                    top: `${(activeRegion.centroid.y / 750) * 100}%`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <div className="bg-slate-900/90 text-white px-5 py-3 rounded-[2rem] shadow-3xl border border-white/10 backdrop-blur-2xl ring-1 ring-white/20 flex flex-col items-center">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${activeRegion.status === 'active' ? 'text-primary-400' : 'text-slate-400'}`}>
                       {activeRegion.status === 'active' ? 'Dostępne' : 'Wkrótce'}
                    </span>
                    <span className="font-bold text-sm flex items-center gap-2 mt-1 whitespace-nowrap">
                       {activeRegion.name}
                       {activeRegion.status === 'active' && <CheckCircle2 size={14} className="text-primary-400" />}
                    </span>
                  </div>
                  <div className="w-4 h-4 bg-slate-900/90 rotate-45 mx-auto -mt-2 border-r border-b border-white/10"></div>
                </div>
              )}

              <div className="absolute top-12 right-12 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                 <MousePointer2 size={14} className="animate-pulse" /> Mapa Interaktywna
              </div>

              <div className="absolute bottom-12 left-12 space-y-3">
                 <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-primary-500 border-2 border-white shadow-md"></div>
                    <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Aktywne Regiony</span>
                 </div>
                 <div className="flex items-center gap-3 opacity-60">
                    <div className="w-4 h-4 rounded-full bg-slate-200 border-2 border-white shadow-sm"></div>
                    <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">W Kolejce</span>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

const RegionMiniCard = ({ title, info, active, upcoming, onClick }: any) => (
  <div
    onClick={onClick}
    className={`p-8 rounded-[3rem] border transition-all duration-500 flex flex-col gap-3 group relative overflow-hidden
      ${active
        ? 'bg-white border-primary-100 shadow-sm hover:shadow-2xl hover:shadow-primary-900/10 cursor-pointer'
        : 'bg-stone-50 border-stone-200 opacity-60'}`}
  >
    <div className="flex justify-between items-center relative z-10">
      <div className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-primary-600' : 'text-slate-400'}`}>
         {active ? 'Status: Aktywne' : 'Status: Weryfikacja'}
      </div>
      {active && <CheckCircle2 className="text-primary-500" size={24} />}
      {upcoming && <Sparkles className="text-secondary-400 animate-pulse" size={24} />}
    </div>
    <div className="text-3xl font-serif font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
      {title}
    </div>
    <div className="text-sm font-medium text-slate-500">{info}</div>
  </div>
);
