// src/components/search/FacilityCard.tsx
// ✅ SIMPLIFIED & FLATTENED - No image, compact layout
import React from 'react';
import { MapPin, Heart, Navigation, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { estimateDriveTime } from '@/src/utils/distance';

interface FacilityCardProps {
  facility: {
    id: number;
    name: string;
    type: 'DPS' | 'ŚDS';
    city: string;
    powiat: string;
    category: string;
    price: number;
    street?: string | null;
    image: string;
    waitTime: string;
    profileLabels?: string[];
    distance?: number | null;
  };
  isHovered: boolean;
  isSaved: boolean;
  isCompared: boolean;
  onHover: (id: number | null) => void;
  onClick: () => void;
  onToggleSave: (e: React.MouseEvent) => void;
  onToggleCompare: (e: React.MouseEvent) => void;
  userLocation?: { lat: number; lng: number };
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  isHovered,
  isSaved,
  isCompared,
  onHover,
  onClick,
  onToggleSave,
  onToggleCompare,
  userLocation
}) => {
  return (
    <div
      id={`facility-${facility.id}`}
      onMouseEnter={() => onHover(facility.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      className={`
        group relative
        bg-white rounded-xl
        border transition-all duration-200
        cursor-pointer
        p-4
        ${isHovered
          ? 'border-emerald-400 shadow-lg -translate-y-0.5'
          : 'border-stone-200 shadow-sm hover:shadow-md hover:border-stone-300'
        }
      `}
    >

      {/* Single compact layout - 2 rows max */}
      <div className="space-y-2">

        {/* Row 1: Badge + Name + Price + Actions */}
        <div className="flex items-start justify-between gap-4">

          {/* Left: Badge + Name */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Type Badge */}
            <span className={`
              flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider
              ${facility.type === 'DPS'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-blue-100 text-blue-700'
              }
            `}>
              {facility.type}
            </span>

            {/* Name */}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2 flex-1">
              {facility.name}
            </h3>
          </div>

          {/* Right: Price + Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Price */}
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {facility.price > 0 ? (
                  <>
                    {facility.price} <span className="text-sm font-medium text-slate-500">zł</span>
                  </>
                ) : (
                  <span className="text-emerald-600">NFZ</span>
                )}
              </div>
              {facility.price > 0 && (
                <div className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">miesięcznie</div>
              )}
            </div>

            {/* Compare Button */}
            <button
              onClick={onToggleCompare}
              className={`
                p-2 rounded-lg transition-all
                ${isCompared
                  ? 'bg-slate-900 text-white'
                  : 'bg-stone-100 text-slate-400 hover:bg-stone-200 hover:text-slate-600'
                }
              `}
              aria-label={isCompared ? "Usuń z porównania" : "Dodaj do porównania"}
            >
              <ArrowLeftRight size={18} />
            </button>

            {/* Save Button */}
            <button
              onClick={onToggleSave}
              className={`
                p-2 rounded-lg transition-all
                ${isSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 text-slate-400 hover:bg-stone-200 hover:text-slate-600'
                }
              `}
              aria-label={isSaved ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
            >
              <Heart size={18} className={isSaved ? 'fill-current' : ''} />
            </button>

            {/* Arrow indicator */}
            <div className="text-slate-300 group-hover:text-emerald-600 transition-all group-hover:translate-x-1">
              <ChevronRight size={24} strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Row 2: Address + Distance */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
          {/* Address */}
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-slate-400 flex-shrink-0" />
            <span className="font-medium">
              {facility.street && `${facility.street}, `}{facility.city}
            </span>
          </div>

          {/* Distance */}
          {facility.distance !== null && facility.distance !== undefined && (
            <>
              <div className="text-slate-300">•</div>
              <div className="flex items-center gap-1.5">
                <Navigation size={14} className="text-slate-400 flex-shrink-0" />
                <span className="font-semibold text-slate-700">
                  {facility.distance < 1
                    ? `${Math.round(facility.distance * 1000)} m`
                    : `${facility.distance.toFixed(1)} km`
                  }
                  <span className="text-slate-500 font-normal">
                    {facility.distance >= 1 && ` (${estimateDriveTime(facility.distance)})`}
                  </span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Row 3: Profile Badges */}
        {facility.profileLabels && facility.profileLabels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {facility.profileLabels.slice(0, 3).map((label, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md"
              >
                {label}
              </span>
            ))}
            {facility.profileLabels.length > 3 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-md">
                +{facility.profileLabels.length - 3}
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
