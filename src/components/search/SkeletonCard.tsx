// src/components/search/SkeletonCard.tsx
import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="
      bg-white rounded-2xl sm:rounded-3xl
      border-2 border-gray-100
      flex flex-col sm:flex-row gap-4 sm:gap-6
      p-4 sm:p-4
    ">
      {/* Image skeleton — identyczne wymiary jak w FacilityCard */}
      <div className="
        w-full sm:w-[245px] h-48 sm:h-[195px]
        flex-shrink-0 rounded-xl sm:rounded-2xl
        bg-gray-200 animate-pulse
      " />

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1 sm:py-2">

        <div>
          {/* Category label */}
          <div className="w-36 h-3 bg-gray-200 rounded animate-pulse mb-2" />

          {/* Title — 2 linie */}
          <div className="space-y-2 mb-3">
            <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="w-1/2 h-5 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Location */}
          <div className="w-44 h-4 bg-gray-200 rounded animate-pulse mb-4" />

          {/* Profile badges */}
          <div className="flex gap-2">
            <div className="w-20 h-5 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-28 h-5 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Bottom: cena + 2 przyciski */}
        <div className="flex items-end justify-between gap-3 pt-3 border-t border-gray-100 mt-3">
          <div>
            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mb-1" />
            <div className="w-24 h-7 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>

      </div>
    </div>
  );
};
