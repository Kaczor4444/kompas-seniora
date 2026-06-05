// src/components/search/FacilityCard.tsx
import React from 'react';
import { MapPin, Heart, Navigation, ChevronRight, ArrowLeftRight, Car } from 'lucide-react';
import { estimateDriveTime } from '@/src/utils/distance';

interface FacilityCardProps {
  facility: {
    id: number;
    name: string;
    type: string;
    city: string;
    powiat: string;
    category: string;
    price: number | null;
    priceDate?: string | null;
    street?: string | null;
    image: string;
    waitTime: string;
    profileLabels?: string[];
    distance?: number | null;
    wolneMiejsca?: Array<{ wolne_ogolem: number | null; oczekujacych: number | null; data_stanu: string }> | null;
  };
  isHovered: boolean;
  isSaved: boolean;
  isCompared: boolean;
  onHover: (id: number | null) => void;
  onClick: () => void;
  onToggleSave: (e: React.MouseEvent) => void;
  onToggleCompare: (e: React.MouseEvent) => void;
  onAskAI?: (e: React.MouseEvent) => void;
  userLocation?: { lat: number; lng: number };
}

const TYPE_STYLES = {
  DPS:    { border: 'border-emerald-200', hover: 'hover:border-emerald-300', badge: 'bg-emerald-100 text-emerald-700' },
  ŚDS:    { border: 'border-blue-200',    hover: 'hover:border-blue-300',    badge: 'bg-blue-100 text-blue-700'    },
  Senior: { border: 'border-amber-200',   hover: 'hover:border-amber-300',   badge: 'bg-amber-100 text-amber-700'  },
};

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  isHovered,
  isSaved,
  isCompared,
  onHover,
  onClick,
  onToggleSave,
  onToggleCompare,
}) => {
  const colors = facility.type === 'DPS' ? TYPE_STYLES.DPS
    : facility.type === 'ŚDS' ? TYPE_STYLES.ŚDS
    : TYPE_STYLES.Senior;

  const typeLabel = facility.type === 'Dzienny Dom Senior+' ? 'DD Senior+' : facility.type;

  const isFree = facility.type === 'ŚDS' || facility.type.includes('Senior+');

  return (
    <div
      id={`facility-${facility.id}`}
      onMouseEnter={() => onHover(facility.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      className={`
        group relative bg-white rounded-2xl cursor-pointer
        border-[0.5px] ${colors.border} ${colors.hover}
        transition-all duration-200
        p-5
        ${isHovered ? 'shadow-lg -translate-y-0.5' : 'shadow-sm hover:shadow-md'}
      `}
    >
      <div className="space-y-3">

        {/* Row 1: Type badge + wolne miejsca + action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${colors.badge}`}>
              {typeLabel}
            </span>

            {/* Wolne miejsca badge */}
            {facility.wolneMiejsca && facility.wolneMiejsca.length > 0 && (() => {
              const entries = facility.wolneMiejsca!;
              const latestDate = entries.map(e => new Date(e.data_stanu).getTime()).reduce((a, b) => Math.max(a, b), 0);
              const latest = entries.filter(e => new Date(e.data_stanu).getTime() === latestDate);
              const totalWolne = latest.reduce((s, e) => s + (e.wolne_ogolem ?? 0), 0);
              const totalOczekujacych = latest.reduce((s, e) => s + (e.oczekujacych ?? 0), 0);
              if (totalWolne === 0) return null;
              const miesiac = new Date(latestDate).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' });
              const hasQueue = totalOczekujacych > 0;
              return (
                <div className="relative group/tooltip">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold cursor-default ${hasQueue ? 'bg-amber-100 text-amber-800' : 'bg-emerald-600 text-white'}`}>
                    {totalWolne} wolne {totalWolne === 1 ? 'miejsce' : totalWolne < 5 ? 'miejsca' : 'miejsc'}
                    {hasQueue && <span className="opacity-60">·</span>}
                    {hasQueue && <span>{totalOczekujacych} w kolejce</span>}
                  </span>
                  <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-64 px-3 py-2 rounded-lg bg-slate-800 text-white text-xs leading-relaxed opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-30 shadow-lg">
                    Stan na {miesiac}.{hasQueue && ` Na wolne miejsca czeka ${totalOczekujacych} ${totalOczekujacych === 1 ? 'osoba' : 'osoby/osób'}.`} Skontaktuj się z placówką — dostępność może się zmieniać.
                    <div className="absolute top-full left-4 border-4 border-transparent border-t-slate-800" />
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Compare */}
            <div className="relative flex">
              <button
                onClick={onToggleCompare}
                className={`peer p-2 rounded-lg transition-all ${isCompared ? 'bg-blue-600 text-white' : 'bg-stone-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600'}`}
                aria-label={isCompared ? 'Usuń z porównania' : 'Dodaj do porównania'}
              >
                <ArrowLeftRight size={16} />
              </button>
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-slate-800 text-white text-[11px] whitespace-nowrap opacity-0 peer-hover:opacity-100 transition-opacity z-20">
                {isCompared ? 'Usuń z porównania' : 'Porównaj placówki'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
              </div>
            </div>

            {/* Save */}
            <div className="relative">
              <button
                onClick={onToggleSave}
                className={`peer p-2 rounded-lg transition-all ${isSaved ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-slate-400 hover:bg-stone-200 hover:text-slate-600'}`}
                aria-label={isSaved ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
              >
                <Heart size={16} className={isSaved ? 'fill-current' : ''} />
              </button>
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-slate-800 text-white text-[11px] whitespace-nowrap opacity-0 peer-hover:opacity-100 transition-opacity z-20">
                {isSaved ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
              </div>
            </div>

            {/* Arrow */}
            <div className="text-slate-300 group-hover:text-emerald-600 transition-all group-hover:translate-x-1 ml-1">
              <ChevronRight size={22} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Row 2: Name — dominujący */}
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
          {facility.name}
        </h3>

        {/* Row 3: Price + address + distance */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          {/* Price */}
          <div className="flex items-baseline gap-1">
            {facility.price && facility.price > 0 ? (
              <>
                <span className="text-xl font-black text-slate-900">{facility.price.toLocaleString('pl-PL')}</span>
                <span className="text-sm font-medium text-slate-500">zł / mies.</span>
              </>
            ) : isFree ? (
              <span className="text-base font-bold text-emerald-600">Bezpłatne</span>
            ) : (
              <span className="text-base font-semibold text-slate-400">Zapytaj o cenę</span>
            )}
          </div>

          <div className="text-stone-300 hidden sm:block">|</div>

          {/* Address */}
          <div className="flex items-center gap-1.5 text-slate-500">
            <MapPin size={13} className="flex-shrink-0" />
            <span>{facility.street && `${facility.street}, `}{facility.city}</span>
          </div>

          {/* Distance */}
          {facility.distance !== null && facility.distance !== undefined && (
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
              <Navigation size={13} className="text-slate-400 flex-shrink-0" />
              <span>
                {facility.distance < 1
                  ? `${Math.round(facility.distance * 1000)} m`
                  : `${facility.distance.toFixed(1)} km`}
              </span>
              {facility.distance >= 1 && (
                <span className="inline-flex items-center gap-1 text-slate-400 font-normal">
                  {estimateDriveTime(facility.distance)}
                  <Car size={13} />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Row 4: Profile chips */}
        {facility.profileLabels && facility.profileLabels.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {facility.profileLabels.slice(0, 4).map((label, idx) => (
              <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                {label}
              </span>
            ))}
            {facility.profileLabels.length > 4 && (
              <span className="px-3 py-1 bg-slate-100 text-slate-400 text-xs font-medium rounded-full">
                +{facility.profileLabels.length - 4}
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
