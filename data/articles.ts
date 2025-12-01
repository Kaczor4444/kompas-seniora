import type { Section } from '@/types/article';
import { Building2, Heart, Users, Wallet, Scale } from 'lucide-react';

export const sections: Section[] = [
    {
      id: 'wybor-opieki',
      title: 'Wybór opieki',
      icon: 'Building2',
      articles: [
        {
          title: 'DPS, ZOL, ŚDS, opieka domowa – czym się różnią',
          slug: 'rodzaje-opieki',
          thumbnail: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
          category: 'Wybór opieki',
          categoryColor: 'bg-blue-50 text-blue-700',
          excerpt: 'Poznaj różnice między placówkami i formami opieki, aby wybrać najlepszą opcję dla seniora.',
          readTime: 7,
          isPopular: true
        },
        {
          title: 'Jak znaleźć dobrą placówkę – checklista',
          slug: 'wybor-placowki',
          thumbnail: 'https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=800&q=80',
          category: 'Wybór opieki',
          categoryColor: 'bg-blue-50 text-blue-700',
          excerpt: 'Praktyczna lista kontrolna, która pomoże Ci ocenić jakość domu pomocy społecznej.',
          readTime: 5,
          isNew: true
        },
        {
          title: 'Czy senior musi wyrazić zgodę na DPS',
          slug: 'zgoda-seniora',
          thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
          category: 'Wybór opieki',
          categoryColor: 'bg-blue-50 text-blue-700',
          excerpt: 'Wyjaśniamy kwestie prawne związane ze zgodą seniora na umieszczenie w placówce.',
          readTime: 6,
          isPopular: true
        },
        {
          title: 'Proces przyjęcia do DPS krok po kroku',
          slug: 'proces-przyjecia',
          thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
          category: 'Wybór opieki',
          categoryColor: 'bg-blue-50 text-blue-700',
          excerpt: 'Szczegółowy przewodnik po procedurze przyjęcia do domu pomocy społecznej.',
          readTime: 8
        },
        {
          title: 'Opieka dzienna vs całodobowa',
          slug: 'opieka-dzienna-calodobowa',
          thumbnail: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80',
          category: 'Wybór opieki',
          categoryColor: 'bg-blue-50 text-blue-700',
          excerpt: 'Porównanie form opieki dziennej i całodobowej - zalety, wady i koszty.',
          readTime: 5
        },
      ],
    },
    {
      id: 'opiekunowie',
      title: 'Porady dla opiekunów',
      icon: 'Heart',
      articles: [
        {
          title: 'Jak zorganizować opiekę nad seniorem krok po kroku',
          slug: 'organizacja-opieki',
          thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
          category: 'Porady dla opiekunów',
          categoryColor: 'bg-purple-50 text-purple-700',
          excerpt: 'Kompleksowy przewodnik jak zaplanować i zorganizować opiekę nad osobą starszą.',
          readTime: 10,
          isPopular: true
        },
        {
          title: 'Komunikacja z seniorem – sprawdzone techniki',
          slug: 'komunikacja-senior',
          thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
          category: 'Porady dla opiekunów',
          categoryColor: 'bg-purple-50 text-purple-700',
          excerpt: 'Praktyczne wskazówki jak rozmawiać z seniorem i budować pozytywne relacje.',
          readTime: 6
        },
        {
          title: 'Higiena i pielęgnacja seniora – praktyczny poradnik',
          slug: 'higiena-pielegnacja',
          thumbnail: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800&q=80',
          category: 'Porady dla opiekunów',
          categoryColor: 'bg-purple-50 text-purple-700',
          excerpt: 'Szczegółowe instrukcje dotyczące codziennej pielęgnacji osoby starszej.',
          readTime: 8
        },
        {
          title: 'Jak wspierać seniora z demencją i problemami pamięci',
          slug: 'wsparcie-demencja',
          thumbnail: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80',
          category: 'Porady dla opiekunów',
          categoryColor: 'bg-purple-50 text-purple-700',
          excerpt: 'Praktyczne strategie wspierania seniora z zaburzeniami pamięci i demencją.',
          readTime: 9,
          isPopular: true
        },
        {
          title: 'Udogodnienia w domu seniora – co warto przygotować',
          slug: 'udogodnienia-dom',
          thumbnail: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&q=80',
          category: 'Porady dla opiekunów',
          categoryColor: 'bg-purple-50 text-purple-700',
          excerpt: 'Lista niezbędnych adaptacji domu dla bezpieczeństwa i komfortu seniora.',
          readTime: 7,
          isNew: true
        },
      ],
    },
    {
      id: 'seniorzy',
      title: 'Porady dla seniorów',
      icon: 'Users',
      articles: [
        {
          title: 'Aktywność fizyczna dla seniorów – proste ćwiczenia',
          slug: 'aktywnosc-fizyczna',
          thumbnail: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80',
          category: 'Porady dla seniorów',
          categoryColor: 'bg-green-50 text-green-700',
          excerpt: 'Bezpieczne i skuteczne ćwiczenia dla osób starszych do wykonania w domu.',
          readTime: 6
        },
        {
          title: 'Jak bezpiecznie senior może korzystać z internetu',
          slug: 'internet-bezpieczenstwo',
          thumbnail: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800&q=80',
          category: 'Porady dla seniorów',
          categoryColor: 'bg-green-50 text-green-700',
          excerpt: 'Zasady bezpieczeństwa w sieci i ochrona przed oszustwami online.',
          readTime: 7,
          isNew: true
        },
        {
          title: 'Emerytura z dobrym planem – porady finansowe',
          slug: 'emerytura-plan',
          thumbnail: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80',
          category: 'Porady dla seniorów',
          categoryColor: 'bg-green-50 text-green-700',
          excerpt: 'Jak mądrze planować budżet i zarządzać finansami na emeryturze.',
          readTime: 8
        },
        {
          title: 'Jak dbać o zdrowie i sprawność po 70 roku życia',
          slug: 'zdrowie-po-70',
          thumbnail: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
          category: 'Porady dla seniorów',
          categoryColor: 'bg-green-50 text-green-700',
          excerpt: 'Kompleksowy przewodnik po profilaktyce zdrowotnej i aktywności po 70.',
          readTime: 9,
          isPopular: true
        },
        {
          title: 'Jak zaplanować dzień, by zachować energię',
          slug: 'planowanie-dnia',
          thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80',
          category: 'Porady dla seniorów',
          categoryColor: 'bg-green-50 text-green-700',
          excerpt: 'Strategie organizacji dnia, które pomogą zachować witalność i dobry nastrój.',
          readTime: 5
        },
      ],
    },
    {
      id: 'finanse',
      title: 'Finanse i świadczenia',
      icon: 'Wallet',
      articles: [
        {
          title: 'Dodatek pielęgnacyjny – ile wynosi i jak złożyć wniosek',
          slug: 'dodatek-pielegnacyjny',
          thumbnail: 'https://images.unsplash.com/photo-1554224311-beee460ae6ba?w=800&q=80',
          category: 'Finanse i świadczenia',
          categoryColor: 'bg-amber-50 text-amber-700',
          excerpt: 'Szczegółowy przewodnik po dodatku pielęgnacyjnym - kwoty, zasady i proces składania wniosku.',
          readTime: 7,
          isPopular: true
        },
        {
          title: 'Zasiłek opiekuńczy dla opiekunów – zasady i dokumenty',
          slug: 'zasilek-opiekunczy',
          thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
          category: 'Finanse i świadczenia',
          categoryColor: 'bg-amber-50 text-amber-700',
          excerpt: 'Kto może ubiegać się o zasiłek opiekuńczy i jakie dokumenty są potrzebne.',
          readTime: 6,
          isPopular: true
        },
        {
          title: 'Świadczenia z MOPS – kto ma prawo do pomocy',
          slug: 'swiadczenia-mops',
          thumbnail: 'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?w=800&q=80',
          category: 'Finanse i świadczenia',
          categoryColor: 'bg-amber-50 text-amber-700',
          excerpt: 'Przegląd świadczeń z miejskiego ośrodka pomocy społecznej i kryteria ich przyznawania.',
          readTime: 8
        },
        {
          title: 'Jak uzyskać dofinansowania dla seniorów w 2025',
          slug: 'dofinansowania-2025',
          thumbnail: 'https://images.unsplash.com/photo-1633158829875-e5316a358c6f?w=800&q=80',
          category: 'Finanse i świadczenia',
          categoryColor: 'bg-amber-50 text-amber-700',
          excerpt: 'Aktualna lista dostępnych dofinansowań i programów wsparcia finansowego.',
          readTime: 9,
          isNew: true
        },
        {
          title: 'Ulgi podatkowe dla seniorów i opiekunów',
          slug: 'ulgi-podatkowe',
          thumbnail: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&q=80',
          category: 'Finanse i świadczenia',
          categoryColor: 'bg-amber-50 text-amber-700',
          excerpt: 'Poznaj wszystkie ulgi podatkowe przysługujące seniorom i opiekunom.',
          readTime: 7
        },
      ],
    },
    {
      id: 'prawne',
      title: 'Prawne aspekty',
      icon: 'Scale',
      articles: [
        {
          title: 'Prawa mieszkańców DPS i pacjentów ZOL – przewodnik',
          slug: 'prawa-mieszkancow',
          thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
          category: 'Prawne aspekty',
          categoryColor: 'bg-red-50 text-red-700',
          excerpt: 'Kompleksowy przewodnik po prawach osób przebywających w placówkach opiekuńczych.',
          readTime: 10,
          isPopular: true
        },
        {
          title: 'Czy senior musi wyrazić zgodę na opiekę lub DPS',
          slug: 'zgoda-na-opieke',
          thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
          category: 'Prawne aspekty',
          categoryColor: 'bg-red-50 text-red-700',
          excerpt: 'Wyjaśnienie przepisów dotyczących zgody seniora na umieszczenie w placówce.',
          readTime: 6
        },
        {
          title: 'Ubezwłasnowolnienie – co warto wiedzieć',
          slug: 'ubezwlasnowolnienie',
          thumbnail: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&q=80',
          category: 'Prawne aspekty',
          categoryColor: 'bg-red-50 text-red-700',
          excerpt: 'Kiedy i jak przebiega proces ubezwłasnowolnienia - informacje prawne.',
          readTime: 8
        },
        {
          title: 'Prawa opiekunów rodzinnych',
          slug: 'prawa-opiekunow',
          thumbnail: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?w=800&q=80',
          category: 'Prawne aspekty',
          categoryColor: 'bg-red-50 text-red-700',
          excerpt: 'Co przysługuje opiekunom rodzinnym - prawa, świadczenia i wsparcie.',
          readTime: 7
        },
        {
          title: 'Umowy z placówkami – na co uważać',
          slug: 'umowy-placowki',
          thumbnail: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=800&q=80',
          category: 'Prawne aspekty',
          categoryColor: 'bg-red-50 text-red-700',
          excerpt: 'Najważniejsze klauzule umów z domami opieki i na co zwracać szczególną uwagę.',
          readTime: 9,
          isNew: true
        },
      ],
    },
  ];
