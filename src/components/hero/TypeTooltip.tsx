'use client';

import { useState, useEffect } from 'react';

export default function TypeTooltip() {
  const [isOpen, setIsOpen] = useState(false);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside the tooltip
      if (target.closest('.tooltip-content')) return;
      setIsOpen(false);
    };

    // Small delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block z-10">
      {/* Info Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="ml-2 text-neutral-400 hover:text-neutral-600 transition-colors touch-manipulation"
        aria-label="Wyjaśnienie typów placówek"
        type="button"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {/* Tooltip - always rendered but hidden/visible with CSS */}
      <div
        className={`tooltip-content fixed md:absolute left-4 right-4 top-1/2 md:top-auto md:right-0 md:left-0 
                   md:bottom-full md:mb-2 -translate-y-1/2 md:translate-y-0
                   md:w-80 bg-white rounded-lg shadow-2xl border border-neutral-200 p-4 z-[60]
                   transition-opacity duration-200 pointer-events-auto
                   ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-2 right-2 p-1 hover:bg-neutral-100 rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Typy placówek:
        </h3>

        <div className="space-y-3">
          {/* DPS - NO ICON */}
          <div>
            <p className="font-semibold text-gray-900 mb-1">
              DPS - Dom Pomocy Społecznej
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Całodobowa opieka dla osób niesamodzielnych, które wymagają stałej pomocy w codziennych czynnościach
            </p>
          </div>

          {/* ŚDS - NO ICON */}
          <div>
            <p className="font-semibold text-gray-900 mb-1">
              ŚDS - Środowiskowy Dom Samopomocy
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Dzienna opieka i aktywizacja społeczna dla osób z niepełnosprawnościami (bez noclegu)
            </p>
          </div>
        </div>

        {/* Arrow (desktop only) */}
        <div className="hidden md:block absolute left-4 -bottom-2 w-4 h-4 bg-white border-b border-r border-neutral-200 transform rotate-45" />
      </div>
    </div>
  );
}