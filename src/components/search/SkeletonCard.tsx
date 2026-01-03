// src/components/search/SkeletonCard.tsx
import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Image Skeleton */}
      <div className="w-full h-56 bg-gray-200 animate-pulse" />
      
      {/* Content Skeleton */}
      <div className="p-6 space-y-4">
        {/* Category & Rating */}
        <div className="flex items-center justify-between">
          <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
          <div className="w-12 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
        
        {/* Title */}
        <div className="space-y-2">
          <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse" />
          <div className="w-1/2 h-5 bg-gray-200 rounded animate-pulse" />
        </div>
        
        {/* Location */}
        <div className="w-40 h-4 bg-gray-200 rounded animate-pulse" />
        
        {/* Bottom Row */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
