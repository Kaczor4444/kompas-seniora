// src/components/filters/MobileFilterDrawer.tsx
'use client';

import { useState } from 'react';
import FilterSidebar from './FilterSidebar';

interface MobileFilterDrawerProps {
  totalResults: number;
}

export default function MobileFilterDrawer({ totalResults }: MobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span className="font-medium">Filtry</span>
        <span className="text-sm text-gray-500">
          ({totalResults})
        </span>
      </button>

      {/* Backdrop - ✅ FIXED: z-50 (poniżej drawer) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer - ✅ FIXED: z-[60] (powyżej backdrop) */}
      <div 
        className={`
          fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[60]
          transform transition-transform duration-300 ease-out lg:hidden
          max-h-[85vh] overflow-y-auto
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Handle (drag indicator) */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filtry</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filter Content */}
        <div className="px-6 py-4">
          <FilterSidebar totalResults={totalResults} />
        </div>

        {/* Bottom Action - ✅ FIXED: sticky z wyższym z-index */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 z-10">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-accent-600 hover:bg-accent-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Pokaż wyniki ({totalResults})
          </button>
        </div>
      </div>
    </>
  );
}