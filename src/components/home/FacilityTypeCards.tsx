'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Home, Users, Star, Sun } from 'lucide-react';

interface TypeCounts {
  DPS: number;
  SDS: number;
  KlubSenior: number;
  DDSenior: number;
}

const CARDS = [
  {
    key: 'DPS' as const,
    label: 'DPS',
    fullName: 'Dom Pomocy Społecznej',
    subtitle: 'Całodobowa opieka stacjonarna',
    description:
      'Placówka dla osób, które ze względu na wiek lub stan zdrowia wymagają stałej, całodobowej opieki. Zapewnia zakwaterowanie, wyżywienie, opiekę pielęgniarską i rehabilitację — wszystko pod jednym dachem.',
    href: '/search?type=dps',
    image: '/images/senior_opiekunka.webp',
    icon: Home,
    color: {
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-50',
      iconText: 'text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700',
      cta: 'bg-emerald-600 hover:bg-emerald-700',
      label: 'text-emerald-600',
    },
  },
  {
    key: 'KlubSenior' as const,
    label: 'Klub Seniora',
    fullName: 'Klub Seniora',
    subtitle: 'Aktywność i integracja',
    description:
      'Dzienne miejsce aktywności dla samodzielnych seniorów — zajęcia kulturalne, sportowe, warsztaty i wyjazdy. Obejmuje rządowe Kluby Senior+ oraz miejskie kluby seniorów (jak MDDPS w Krakowie). Bezpłatne, bez skierowania.',
    href: '/search?type=klub-senior',
    image: '/images/aktywnosc_seniora.webp',
    icon: Star,
    color: {
      border: 'border-amber-200',
      iconBg: 'bg-amber-50',
      iconText: 'text-amber-600',
      badge: 'bg-amber-50 text-amber-700',
      cta: 'bg-amber-500 hover:bg-amber-600',
      label: 'text-amber-600',
    },
  },
  {
    key: 'DDSenior' as const,
    label: 'DD Senior+',
    fullName: 'Dzienny Dom Senior+',
    subtitle: 'Dzienna opieka dla potrzebujących',
    description:
      'Wsparcie dla seniorów wymagających pomocy w codziennym funkcjonowaniu, ale mieszkających we własnym domu. Zapewnia posiłki, opiekę i zajęcia przez kilka godzin dziennie. Bezpłatny. Uwaga: duże miasta jak Kraków prowadzą własne dzienne domy pomocy poza programem Senior+.',
    href: '/search?type=dzienny-dom-senior',
    image: '/images/babcia_dom_opieki.webp',
    icon: Sun,
    color: {
      border: 'border-orange-200',
      iconBg: 'bg-orange-50',
      iconText: 'text-orange-600',
      badge: 'bg-orange-50 text-orange-700',
      cta: 'bg-orange-500 hover:bg-orange-600',
      label: 'text-orange-600',
    },
  },
];

export default function FacilityTypeCards({ typeCounts }: { typeCounts: TypeCounts }) {
  return (
    <section className="bg-stone-50 py-10 md:py-14 border-t border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map((card) => {
            const count = typeCounts[card.key];
            return (
              <Link
                key={card.key}
                href={card.href}
                className={`
                  group relative flex flex-col rounded-2xl border bg-white overflow-hidden
                  transition-all duration-200
                  hover:shadow-lg hover:-translate-y-0.5
                  ${card.color.border}
                `}
              >
                {/* Image header — zdjęcie jako tło z overlayem */}
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.fullName}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Treść na tle zdjęcia */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    {/* Liczba placówek — góra */}
                    <span className="self-end text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30">
                      {count} placówek
                    </span>
                    {/* Typ — dół */}
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-0.5">
                        {card.label}
                      </div>
                      <h3 className="text-lg font-black text-white leading-snug tracking-tight drop-shadow">
                        {card.fullName}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-5 gap-4">
                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed flex-1">
                    {card.description}
                  </p>

                  {/* CTA */}
                  <div className={`
                    flex items-center justify-center gap-2
                    text-white text-xs font-black uppercase tracking-widest
                    py-3 px-4 rounded-xl transition-all
                    ${card.color.cta}
                  `}>
                    Przeglądaj
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
