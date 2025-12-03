import type { Section } from '@/types/article';
import { Building2, Heart, Users, Wallet, Scale } from 'lucide-react';

export const sections: Section[] = [
  {
    id: 'wybor-opieki',
    title: 'Wybór opieki',
    icon: 'Building2',
    articles: [
      {
        slug: 'rodzaje-opieki',
        sectionId: 'wybor-opieki',
        category: 'Wybór opieki',
        featured: true,
      },
      {
        slug: 'wybor-placowki',
        sectionId: 'wybor-opieki',
        category: 'Wybór opieki',
        featured: true,
      },
      {
        slug: 'zgoda-seniora',
        sectionId: 'wybor-opieki',
        category: 'Wybór opieki',
        featured: true,
      },
      {
        slug: 'proces-przyjecia',
        sectionId: 'wybor-opieki',
        category: 'Wybór opieki',
      },
      {
        slug: 'opieka-dzienna-calodobowa',
        sectionId: 'wybor-opieki',
        category: 'Wybór opieki',
      },
    ],
  },
  {
    id: 'dla-opiekuna',
    title: 'Dla opiekuna',
    icon: 'Heart',
    articles: [
      {
        slug: 'organizacja-opieki',
        sectionId: 'dla-opiekuna',
        category: 'Dla opiekuna',
        featured: true,
      },
      {
        slug: 'komunikacja-senior',
        sectionId: 'dla-opiekuna',
        category: 'Dla opiekuna',
      },
      {
        slug: 'higiena-pielegnacja',
        sectionId: 'dla-opiekuna',
        category: 'Dla opiekuna',
      },
      {
        slug: 'wsparcie-demencja',
        sectionId: 'dla-opiekuna',
        category: 'Dla opiekuna',
        featured: true,
      },
      {
        slug: 'udogodnienia-dom',
        sectionId: 'dla-opiekuna',
        category: 'Dla opiekuna',
        featured: true,
      },
    ],
  },
  {
    id: 'dla-seniora',
    title: 'Dla seniora',
    icon: 'Users',
    articles: [
      {
        slug: 'aktywnosc-fizyczna',
        sectionId: 'dla-seniora',
        category: 'Dla seniora',
      },
      {
        slug: 'internet-bezpieczenstwo',
        sectionId: 'dla-seniora',
        category: 'Dla seniora',
        featured: true,
      },
      {
        slug: 'emerytura-plan',
        sectionId: 'dla-seniora',
        category: 'Dla seniora',
      },
      {
        slug: 'zdrowie-po-70',
        sectionId: 'dla-seniora',
        category: 'Dla seniora',
        featured: true,
      },
      {
        slug: 'planowanie-dnia',
        sectionId: 'dla-seniora',
        category: 'Dla seniora',
      },
    ],
  },
  {
    id: 'finanse-i-swiadczenia',
    title: 'Finanse i świadczenia',
    icon: 'Wallet',
    articles: [
      {
        slug: 'dodatek-pielegnacyjny',
        sectionId: 'finanse-i-swiadczenia',
        category: 'Finanse i świadczenia',
        featured: true,
      },
      {
        slug: 'zasilek-opiekunczy',
        sectionId: 'finanse-i-swiadczenia',
        category: 'Finanse i świadczenia',
        featured: true,
      },
      {
        slug: 'swiadczenia-mops',
        sectionId: 'finanse-i-swiadczenia',
        category: 'Finanse i świadczenia',
      },
      {
        slug: 'dofinansowania-2025',
        sectionId: 'finanse-i-swiadczenia',
        category: 'Finanse i świadczenia',
        featured: true,
      },
      {
        slug: 'ulgi-podatkowe',
        sectionId: 'finanse-i-swiadczenia',
        category: 'Finanse i świadczenia',
      },
    ],
  },
  {
    id: 'prawne-aspekty',
    title: 'Prawne aspekty',
    icon: 'Scale',
    articles: [
      {
        slug: 'prawa-mieszkancow',
        sectionId: 'prawne-aspekty',
        category: 'Prawne aspekty',
        featured: true,
      },
      {
        slug: 'zgoda-na-opieke',
        sectionId: 'prawne-aspekty',
        category: 'Prawne aspekty',
      },
      {
        slug: 'ubezwlasnowolnienie',
        sectionId: 'prawne-aspekty',
        category: 'Prawne aspekty',
      },
      {
        slug: 'prawa-opiekunow',
        sectionId: 'prawne-aspekty',
        category: 'Prawne aspekty',
      },
      {
        slug: 'umowy-placowki',
        sectionId: 'prawne-aspekty',
        category: 'Prawne aspekty',
        featured: true,
      },
    ],
  },
];
