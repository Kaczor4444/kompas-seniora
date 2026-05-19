'use client';

import { memo } from 'react';
import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';

interface CityCardProps {
  name: string;
  slug: string;
  count: number;
  voivodeship?: string;
}

const CityCard = memo(({ name, count, voivodeship }: CityCardProps) => {
  const getCitySearchUrl = () => {
    const params = new URLSearchParams({ q: name, city: 'true' });
    if (voivodeship && voivodeship !== 'małopolskie') {
      params.set('woj', voivodeship === 'śląskie' ? 'slaskie' : voivodeship);
    }
    return `/search?${params.toString()}`;
  };

  return (
    <Link
      href={getCitySearchUrl()}
      className="group"
      aria-label={`Zobacz ${count} ${count === 1 ? 'placówkę' : count < 5 ? 'placówki' : 'placówek'} w ${name}`}
    >
      <div className="relative bg-white rounded-2xl px-4 py-3 border border-stone-200 transition-all duration-200 hover:border-primary-300 hover:shadow-md hover:-translate-y-0.5 text-left flex items-center gap-4">
        <div
          className="w-9 h-9 rounded-xl bg-stone-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors shrink-0"
          aria-hidden="true"
        >
          <MapPin size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-700 transition-colors leading-tight truncate">
            {name}
          </h3>
          <p className="text-[11px] font-semibold text-slate-400">
            {count} {count === 1 ? 'placówka' : count < 5 ? 'placówki' : 'placówek'}
          </p>
        </div>
        <span className="text-2xl font-black text-slate-900 group-hover:text-primary-600 transition-colors shrink-0">
          {count}
        </span>
      </div>
    </Link>
  );
});

CityCard.displayName = 'CityCard';

export default CityCard;
