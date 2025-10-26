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

        <h3 className="text-sm font-semibold text-neutral-900 mb-3">
          Typy placówek:
        </h3>

        <div className="space-y-3">
          {/* DPS */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="font-semibold text-neutral-900 flex-1">
                DPS - Dom Pomocy Społecznej
              </p>
            </div>
            <p className="text-sm text-neutral-600 ml-13">
              Całodobowa opieka dla osób niesamodzielnych, które wymagają stałej pomocy w codziennych czynnościach
            </p>
          </div>

          {/* ŚDS */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-semibold text-neutral-900 flex-1">
                ŚDS - Środowiskowy Dom Samopomocy
              </p>
            </div>
            <p className="text-sm text-neutral-600 ml-13">
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