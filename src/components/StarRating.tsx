'use client';

import { useState } from 'react';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface StarRatingProps {
  rating: number; // 0-5
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function StarRating({
  rating,
  onChange,
  readonly = false,
  size = 'md',
  showLabel = false
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const starSize = sizeClasses[size];
  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleClick = (value: number) => {
    if (!readonly && onChange) {
      // Click same rating = remove rating (set to 0)
      onChange(rating === value ? 0 : value);
    }
  };

  const getRatingLabel = (r: number): string => {
    if (r === 0) return 'Brak oceny';
    if (r === 1) return 'Słaba';
    if (r === 2) return 'Przeciętna';
    if (r === 3) return 'Dobra';
    if (r === 4) return 'Bardzo dobra';
    if (r === 5) return 'Doskonała';
    return '';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const StarIcon = isFilled ? StarSolid : StarOutline;

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => !readonly && setHoverRating(star)}
              onMouseLeave={() => !readonly && setHoverRating(null)}
              disabled={readonly}
              className={`
                ${starSize}
                ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                ${isFilled ? 'text-yellow-400' : 'text-gray-300'}
                transition-all duration-150
                ${!readonly && 'focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 rounded'}
              `}
              aria-label={`Ocena ${star} z 5`}
            >
              <StarIcon className="w-full h-full" />
            </button>
          );
        })}
      </div>

      {showLabel && (
        <span className="text-sm text-gray-600 font-medium">
          {getRatingLabel(displayRating)}
        </span>
      )}

      {!readonly && rating > 0 && (
        <button
          type="button"
          onClick={() => onChange && onChange(0)}
          className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
        >
          Usuń ocenę
        </button>
      )}
    </div>
  );
}