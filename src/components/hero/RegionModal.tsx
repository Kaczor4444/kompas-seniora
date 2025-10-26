'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RegionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Region {
  id: string;
  name: string;
  count: number;
  available: boolean;
}

const REGIONS_CONFIG: Omit<Region, 'count'>[] = [
  { id: 'malopolskie', name: 'Małopolskie', available: true },
  { id: 'slaskie', name: 'Śląskie', available: true },
  { id: 'mazowieckie', name: 'Mazowieckie', available: false },
  { id: 'dolnoslaskie', name: 'Dolnośląskie', available: false },
  { id: 'wielkopolskie', name: 'Wielkopolskie', available: false },
  { id: 'zachodniopomorskie', name: 'Zachodniopomorskie', available: false },
  { id: 'lubuskie', name: 'Lubuskie', available: false },
  { id: 'kujawsko-pomorskie', name: 'Kujawsko-Pomorskie', available: false },
  { id: 'lodzkie', name: 'Łódzkie', available: false },
  { id: 'lubelskie', name: 'Lubelskie', available: false },
  { id: 'opolskie', name: 'Opolskie', available: false },
  { id: 'podkarpackie', name: 'Podkarpackie', available: false },
  { id: 'podlaskie', name: 'Podlaskie', available: false },
  { id: 'pomorskie', name: 'Pomorskie', available: false },
  { id: 'swietokrzyskie', name: 'Świętokrzyskie', available: false },
  { id: 'warminsko-mazurskie', name: 'Warmińsko-Mazurskie', available: false },
];

export default function RegionModal({ isOpen, onClose }: RegionModalProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch facility counts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCounts();
    }
  }, [isOpen]);

  async function fetchCounts() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/placowki/counts');
      const data = await response.json();

      if (data.success) {
        const counts = data.counts;
        
        // Merge counts with regions config
        const regionsWithCounts = REGIONS_CONFIG.map(region => ({
          ...region,
          count: counts[region.id] || 0,
        }));

        setRegions(regionsWithCounts);
      } else {
        console.error('Failed to fetch counts');
        // Fallback to 0 counts
        setRegions(REGIONS_CONFIG.map(r => ({ ...r, count: 0 })));
      }
    } catch (error) {
      console.error('Error fetching facility counts:', error);
      // Fallback to 0 counts
      setRegions(REGIONS_CONFIG.map(r => ({ ...r, count: 0 })));
    } finally {
      setIsLoading(false);
    }
  }

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const availableRegions = regions.filter(r => r.available);
  const upcomingRegions = regions.filter(r => !r.available);
  const totalCount = availableRegions.reduce((sum, r) => sum + r.count, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:max-w-lg
                   bg-white rounded-xl shadow-2xl z-[101] max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">
            Wybierz województwo
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Zamknij"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-3 border-accent-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <>
              {/* Available regions */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                  Dostępne teraz
                </h3>
                <div className="space-y-2">
                  {availableRegions.map((region) => (
                    <Link
                      key={region.id}
                      href={`/search?woj=${region.id}`}
                      onClick={onClose}
                      className="block p-4 rounded-lg border border-neutral-200 hover:border-accent-300 
                               hover:bg-accent-50 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 group-hover:text-accent-700">
                              {region.name}
                            </p>
                            {region.count > 0 && (
                              <p className="text-sm text-neutral-500">
                                {region.count} {region.count === 1 ? 'placówka' : 'placówek'}
                              </p>
                            )}
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-neutral-400 group-hover:text-accent-600 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Upcoming regions */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                  Wkrótce
                </h3>
                <div className="space-y-1 text-sm text-neutral-400">
                  {upcomingRegions.map((region) => (
                    <div key={region.id} className="flex items-center gap-2 py-1">
                      <span>•</span>
                      <span>{region.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* All regions link */}
              <div className="pt-4 border-t border-neutral-200">
                <Link
                  href="/search"
                  onClick={onClose}
                  className="block p-4 rounded-lg bg-accent-50 border border-accent-200 
                           hover:bg-accent-100 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-accent-700">
                          Wszystkie województwa
                        </p>
                        {totalCount > 0 && (
                          <p className="text-sm text-accent-600">
                            {totalCount} placówek
                          </p>
                        )}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-accent-600 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}