// src/components/search/FacilityCard.tsx
import React from 'react';
import { MapPin, Star, Heart, ArrowLeftRight } from 'lucide-react';
import { Facility } from '../../types';

interface FacilityCardProps {
  facility: Facility;
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
  return (
    <div
      id={`facility-${facility.id}`}
      onMouseEnter={() => onHover(facility.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      className={`
        group relative
        bg-white rounded-2xl 
        border transition-all duration-200
        cursor-pointer overflow-hidden
        ${isHovered 
          ? 'border-blue-500 shadow-lg -translate-y-1' 
          : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
        }
      `}
    >
      {/* Top Badge - Polecana */}
      {facility.rating >= 4.7 && (
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-semibold text-amber-700">Polecana</span>
          </div>
        </div>
      )}

      {/* Image */}
      <div className="relative w-full h-56 bg-gray-100">
        <img 
          src={facility.image} 
          alt={facility.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Type Badge */}
        <div className="absolute bottom-4 right-4">
          <span className={`
            px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm
            ${facility.type === 'DPS' 
              ? 'bg-blue-500/90 text-white' 
              : 'bg-purple-500/90 text-white'
            }
          `}>
            {facility.type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        
        {/* Category & Rating */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {facility.category}
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-gray-900">{facility.rating}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
          {facility.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <MapPin size={16} className="text-gray-400" />
          <span>{facility.city}, {facility.powiat}</span>
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          
          {/* Price */}
          <div>
            <div className="text-xs text-gray-500 mb-1">Miesięcznie</div>
            <div className="text-2xl font-bold text-gray-900">
              {facility.price > 0 ? (
                <>
                  {facility.price} <span className="text-base font-normal text-gray-500">zł</span>
                </>
              ) : (
                <span className="text-blue-600">NFZ</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <IconButton
              active={isCompared}
              onClick={onToggleCompare}
              icon={<ArrowLeftRight size={18} />}
              title="Porównaj"
              activeColor="bg-gray-900"
            />
            <IconButton
              active={isSaved}
              onClick={onToggleSave}
              icon={<Heart size={18} className={isSaved ? 'fill-current' : ''} />}
              title="Zapisz"
              activeColor="bg-red-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component
const IconButton = ({ active, onClick, icon, title, activeColor }: any) => (
  <button
    onClick={onClick}
    className={`
      p-2.5 rounded-full transition-all
      ${active
        ? `${activeColor} text-white`
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }
    `}
    title={title}
  >
    {icon}
  </button>
);
