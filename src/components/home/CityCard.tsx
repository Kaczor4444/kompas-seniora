'use client';

import { memo } from 'react';
import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';

interface CityCardProps {
  name: string;
  slug: string;
  count: number;
}

const CityCard = memo(({ name, slug, count }: CityCardProps) => {
  return (
    <Link
      href={`/search?q=${slug}`}
      className="group"
      aria-label={`Zobacz ${count} ${count === 1 ? 'placówkę' : count < 5 ? 'placówki' : 'placówek'} w ${name}`}
    >
      <div className="relative bg-white rounded-3xl p-5 border border-stone-100 transition-all duration-300 hover:border-primary-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-1 text-left flex flex-col justify-between h-28 md:h-36">
        <div className="flex justify-between items-start">
          <div
            className="w-10 h-10 rounded-2xl bg-stone-50 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors"
            aria-hidden="true"
          >
            <MapPin size={20} />
          </div>
          <span
            className="text-xl font-black text-slate-900 group-hover:text-primary-600 transition-colors"
            aria-label={`${count} placówek`}
          >
            {count}
          </span>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-primary-700 transition-colors">
            {name}
          </h3>
          <ChevronRight
            size={16}
            aria-hidden="true"
            className="text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-all"
          />
        </div>
      </div>
    </Link>
  );
});

CityCard.displayName = 'CityCard';

export default CityCard;
