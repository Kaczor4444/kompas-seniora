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
      <div className="relative w-full sm:w-[245px] h-48 sm:h-[195px] flex-shrink-0 rounded-xl sm:rounded-2xl bg-gray-200 animate-pulse">
        {/* Type badge on image */}
        <div className="absolute bottom-3 right-3">
          <div className="w-12 h-6 bg-gray-300 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1 sm:py-2">

        <div>
          {/* Category label */}
          <div className="w-40 h-3 sm:h-3.5 bg-gray-200 rounded animate-pulse mb-1.5 sm:mb-2" />

          {/* Title — 2 linie */}
          <div className="space-y-1.5 sm:space-y-2 mb-1.5 sm:mb-2">
            <div className="w-3/4 h-4 sm:h-5 md:h-6 bg-gray-200 rounded animate-pulse" />
            <div className="w-1/2 h-4 sm:h-5 md:h-6 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Location with icon */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3.5 h-3.5 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
            <div className="w-36 sm:w-44 h-3.5 sm:h-4 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Distance badge (optional) */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="w-3.5 h-3.5 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
            <div className="w-24 h-3.5 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Profile badges */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <div className="w-20 h-5 sm:h-6 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-28 h-5 sm:h-6 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Bottom: cena + 2 przyciski */}
        <div className="flex flex-wrap items-end justify-between gap-3 min-w-0 pt-3 border-t border-gray-100">
          <div>
            <div className="w-16 sm:w-20 h-2.5 sm:h-3 bg-gray-200 rounded animate-pulse mb-0.5 sm:mb-1" />
            <div className="w-24 sm:w-28 h-6 sm:h-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>

      </div>
    </div>
  );
};
