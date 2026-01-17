'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import CityCard from './CityCard';
import { POPULAR_CITIES_CONFIG } from '../../../lib/popular-cities';

interface CityData {
  name: string;
  slug: string;
  count: number;
  voivodeship: string;
}

export default function PopularLocationsSection() {
  const [popularCities, setPopularCities] = useState<CityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCityCounts() {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();

        if (data.success && data.data.byCities) {
          const citiesWithCounts = POPULAR_CITIES_CONFIG.map(config => {
            const cityStats = data.data.byCities.find(
              (city: { name: string; count: number }) =>
                city.name.toLowerCase() === config.name.toLowerCase()
            );

            return {
              name: config.name,
              slug: config.slug,
              count: cityStats?.count || 0,
              voivodeship: config.voivodeship,
            };
          });

          setPopularCities(citiesWithCounts.sort((a, b) => b.count - a.count));
        } else {
          // Fallback to config with 0 counts
          setPopularCities(
            POPULAR_CITIES_CONFIG.map(config => ({
              name: config.name,
              slug: config.slug,
              count: 0,
              voivodeship: config.voivodeship,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching city counts:', error);
        // Fallback to config with 0 counts
        setPopularCities(
          POPULAR_CITIES_CONFIG.map(config => ({
            name: config.name,
            slug: config.slug,
            count: 0,
            voivodeship: config.voivodeship,
          }))
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchCityCounts();
  }, []);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 border border-stone-100">
              <MapPin size={12} className="text-primary-600" aria-hidden="true" />
              Dostępność lokalna
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-slate-900 leading-tight">
              Szukaj w <span className="text-primary-600">Twoim mieście</span>
            </h2>
            <p className="mt-4 text-slate-500 text-base md:text-lg font-medium">
              Placówki w najpopularniejszych miastach Małopolski.
            </p>
          </div>
          <Link
            href="/search"
            className="hidden md:flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-widest hover:text-primary-600 transition-all group"
          >
            Wszystkie miasta <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 mb-10">
          {isLoading ? (
            // Loading skeleton
            POPULAR_CITIES_CONFIG.map((config) => (
              <div
                key={config.slug}
                className="relative bg-white rounded-3xl p-5 border border-stone-100 h-28 md:h-36 animate-pulse"
              >
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100"></div>
                  <div className="w-8 h-6 bg-stone-100 rounded"></div>
                </div>
                <div className="mt-auto">
                  <div className="w-24 h-6 bg-stone-100 rounded mt-4"></div>
                </div>
              </div>
            ))
          ) : (
            popularCities.map((city) => (
              <CityCard
                key={city.slug}
                name={city.name}
                slug={city.slug}
                count={city.count}
              />
            ))
          )}
        </div>

        <div className="md:hidden">
          <Link
            href="/search"
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            Pełna lista lokalizacji <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
