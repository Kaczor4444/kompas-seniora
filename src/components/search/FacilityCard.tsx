// src/components/search/FacilityCard.tsx
// ✅ FULLY RESPONSIVE - Mobile/Tablet/Desktop
import React from 'react';
import { MapPin, Star, Heart, ArrowLeftRight } from 'lucide-react';
import { Facility } from '../../types';

interface FacilityCardProps {
  facility: {
    id: number;
    name: string;
    type: 'DPS' | 'ŚDS';
    city: string;
    powiat: string;
    category: string;
    price: number;
    rating: number;
    image: string;
    waitTime: string;
  };
  isHovered: boolean;
  isSaved: boolean;
  isCompared: boolean;
  onHover: (id: number | null) => void;
  onClick: () => void;
  onToggleSave: (e: React.MouseEvent) => void;
  onToggleCompare: (e: React.MouseEvent) => void;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  isHovered,
  isSaved,
  isCompared,
  onHover,
  onClick,
  onToggleSave,
  onToggleCompare
}) => {
  const isHighlighted = facility.rating >= 4.7;

  return (
    <div
      id={`facility-${facility.id}`}
      onMouseEnter={() => onHover(facility.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      className={`
        group relative
        bg-white rounded-2xl sm:rounded-3xl
        border-2 transition-all duration-200
        cursor-pointer
        flex flex-col sm:flex-row gap-4 sm:gap-6
        p-4 sm:p-4
        ${isHovered 
          ? 'border-emerald-400 shadow-xl -translate-y-0.5' 
          : 'border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300'
        }
      `}
    >
      {/* Top Left Badge - WYRÓŻNIONA */}
      {isHighlighted && (
        <div className="absolute -top-2 -left-2 z-10">
          <div className="
            bg-yellow-400 text-gray-900
            px-3 sm:px-4 py-1 sm:py-1.5 rounded-full
            text-[10px] sm:text-xs font-bold uppercase tracking-wide
            shadow-md
            flex items-center gap-1 sm:gap-1.5
          ">
            <Star size={12} className="fill-gray-900" />
            WYRÓŻNIONA
          </div>
        </div>
      )}

      {/* Image - RESPONSIVE */}
      <div className="relative w-full sm:w-[245px] h-48 sm:h-[195px] flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100">
        <img 
          src={facility.image} 
          alt={facility.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Type Badge on Image */}
        <div className="absolute bottom-3 right-3">
          <span className={`
            px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm
            ${facility.type === 'DPS' 
              ? 'bg-emerald-500/90 text-white' 
              : 'bg-blue-500/90 text-white'
            }
          `}>
            {facility.type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between py-1 sm:py-2">
        
        {/* Top Section */}
        <div>
          {/* Category Label */}
          <div className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1.5 sm:mb-2">
            {facility.category}
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2 break-words overflow-hidden">
            {facility.name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-3">
            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{facility.city}, {facility.powiat}</span>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex items-end justify-between pt-3 border-t border-gray-100">
          
          {/* Price */}
          <div>
            <div className="text-[9px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 uppercase tracking-wide">Cena pobytu</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">
              {facility.price > 0 ? (
                <>
                  {facility.price} <span className="text-sm sm:text-base font-normal text-gray-500">zł</span>
                </>
              ) : (
                <span className="text-emerald-600">NFZ</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            
            {/* Rating */}
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gray-50">
              <Star size={14} className="text-yellow-500 fill-yellow-500" />
              <span className="text-xs sm:text-sm font-bold text-gray-900">{facility.rating}</span>
            </div>

            {/* Compare Button */}
            <button
              onClick={onToggleCompare}
              className={`
                p-2 sm:p-2.5 rounded-full transition-all
                ${isCompared
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
              title="Porównaj"
            >
              <ArrowLeftRight size={18} className="sm:w-5 sm:h-5" />
            </button>

            {/* Save Button */}
            <button
              onClick={onToggleSave}
              className={`
                p-2 sm:p-2.5 rounded-full transition-all
                ${isSaved
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
              title="Zapisz"
            >
              <Heart size={18} className={`sm:w-5 sm:h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};