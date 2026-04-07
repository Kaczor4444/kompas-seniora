/**
 * HYBRID SYSTEM - How it works:
 *
 * This file contains ORGANIZATIONAL data only:
 * - slug (identifier)
 * - sectionId (which section)
 * - category (which category)
 * - featured (priority flag)
 *
 * CONTENT data comes from MDX frontmatter:
 * - title (heading)
 * - excerpt (description)
 * - readTime (minutes)
 * - publishedAt (date)
 *
 * To add a new article:
 * 1. Add entry here: { slug: "...", sectionId: "...", category: "...", featured: true }
 * 2. Create MDX: content/articles/[sectionId]/[slug].mdx
 * 3. System auto-loads metadata from frontmatter
 *
 * Articles without MDX show placeholder: "Artykuł w przygotowaniu..."
 */

import type { Section } from '@/types/article';
import { Building2, Heart, Users, Wallet, Scale, FileText } from 'lucide-react';

export const sections: Section[] = [
  {
    id: 'wybor-opieki',
    title: 'Wybór opieki',
    icon: 'Building2',
    articles: [
      // WKRÓTCE - odkomentuj gdy artykuł będzie gotowy
      // {
      //   slug: 'rodzaje-opieki',
      //   sectionId: 'wybor-opieki',
      //   category: 'Wybór opieki',
      // },
      {
        slug: 'wybor-placowki',
        sectionId: 'wybor-opieki',
        category: 'Wybór opieki',
        badge: 'POLECAMY',
        thumbnail: '/images/senior_opiekunka.webp',
        featuredOrder: 1,
      },
      {
        slug: 'typy-dps',
        sectionId: 'wybor-opieki',
        category: 'Wybór opieki',
        badge: 'NOWE',
        thumbnail: '/images/seniorzy_puzle.webp',
        featuredOrder: 2,
      },
      {
        slug: 'proces-przyjecia-dps',
        sectionId: 'wybor-opieki',
        category: 'Wybór opieki',
        badge: 'NOWY ARTYKUŁ',
        thumbnail: '/images/seniorzy_ciasto.png',
        featuredOrder: 3,
      },
      // WKRÓTCE - odkomentuj gdy artykuł będzie gotowy
      // {
      //   slug: 'zgoda-seniora',
      //   sectionId: 'wybor-opieki',
      //   category: 'Wybór opieki',
      // },
      {
        slug: 'dps-vs-sds',
        sectionId: 'wybor-opieki',
        category: 'Wybór opieki',
        badge: 'NOWY ARTYKUŁ',
        thumbnail: '/images/babcia_dom_opieki.webp',
        isActive: true,
      },
      // WKRÓTCE - odkomentuj gdy artykuł będzie gotowy
      // {
      //   slug: 'opieka-dzienna-calodobowa',
      //   sectionId: 'wybor-opieki',
      //   category: 'Wybór opieki',
      // },
    ],
  },
  {
    id: 'dla-opiekuna',
    title: 'Dla opiekuna',
    icon: 'Heart',
    articles: [
      // WKRÓTCE - odkomentuj gdy artykuły będą gotowe
      // {
      //   slug: 'organizacja-opieki',
      //   sectionId: 'dla-opiekuna',
      //   category: 'Dla opiekuna',
      // },
      // {
      //   slug: 'komunikacja-senior',
      //   sectionId: 'dla-opiekuna',
      //   category: 'Dla opiekuna',
      // },
      // {
      //   slug: 'higiena-pielegnacja',
      //   sectionId: 'dla-opiekuna',
      //   category: 'Dla opiekuna',
      // },
      {
        slug: 'wsparcie-demencja',
        sectionId: 'dla-opiekuna',
        category: 'Dla opiekuna',
        badge: 'NOWE',
        thumbnail: '/images/demencja.webp',
      },
      // WKRÓTCE - odkomentuj gdy artykuł będzie gotowy
      // {
      //   slug: 'udogodnienia-dom',
      //   sectionId: 'dla-opiekuna',
      //   category: 'Dla opiekuna',
      // },
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
        badge: 'NOWE',
        thumbnail: '/images/aktywnosc_seniora.webp',
      },
      {
        slug: 'internet-bezpieczenstwo',
        sectionId: 'dla-seniora',
        category: 'Dla seniora',
        badge: 'WKRÓTCE',
        thumbnail: '/images/babcia_tablet.webp',
        isActive: false,
      },
      // {
      //   slug: 'emerytura-plan',
      //   sectionId: 'dla-seniora',
      //   category: 'Dla seniora',
      // },
      {
        slug: 'zdrowie-po-70',
        sectionId: 'dla-seniora',
        category: 'Dla seniora',
        badge: 'NOWE',
        thumbnail: '/images/senior_cwiczenia.webp',
      },
      // WKRÓTCE - odkomentuj gdy artykuł będzie gotowy
      // {
      //   slug: 'planowanie-dnia',
      //   sectionId: 'dla-seniora',
      //   category: 'Dla seniora',
      // },
      // WKRÓTCE - odkomentuj gdy artykuł będzie gotowy
      // {
      //   slug: 'przygotowanie-seniora',
      //   sectionId: 'dla-seniora',
      //   category: 'Dla seniora',
      //   badge: 'WKRÓTCE',
      //   isActive: false,
      // },
    ],
  },
  {
    id: 'finanse-prawne',
    title: 'Finanse i prawo',
    icon: 'Wallet',
    articles: [
      // Finanse
      // WKRÓTCE - odkomentuj gdy artykuły będą gotowe
      // {
      //   slug: 'dodatek-pielegnacyjny',
      //   sectionId: 'finanse-prawne',
      //   category: 'Finanse',
      // },
      // {
      //   slug: 'zasilek-opiekunczy',
      //   sectionId: 'finanse-prawne',
      //   category: 'Finanse',
      // },
      // {
      //   slug: 'swiadczenia-mops',
      //   sectionId: 'finanse-prawne',
      //   category: 'Finanse',
      // },
      // {
      //   slug: 'dofinansowania-2025',
      //   sectionId: 'finanse-prawne',
      //   category: 'Finanse',
      // },
      // {
      //   slug: 'ulgi-podatkowe',
      //   sectionId: 'finanse-prawne',
      //   category: 'Finanse',
      // },
      // WKRÓTCE - odkomentuj gdy artykuł będzie gotowy
      // {
      //   slug: 'koszty-opieki',
      //   sectionId: 'finanse-prawne',
      //   category: 'Finanse',
      //   badge: 'WKRÓTCE',
      //   thumbnail: '/images/senior_obliczenia.webp',
      //   isActive: false,
      //   featuredOrder: 4,
      // },
      // Prawne
      // WKRÓTCE - odkomentuj gdy artykuły będą gotowe
      // {
      //   slug: 'prawa-mieszkancow',
      //   sectionId: 'finanse-prawne',
      //   category: 'Prawne',
      // },
      // {
      //   slug: 'zgoda-na-opieke',
      //   sectionId: 'finanse-prawne',
      //   category: 'Prawne',
      // },
      // {
      //   slug: 'ubezwlasnowolnienie',
      //   sectionId: 'finanse-prawne',
      //   category: 'Prawne',
      // },
      // {
      //   slug: 'prawa-opiekunow',
      //   sectionId: 'finanse-prawne',
      //   category: 'Prawne',
      // },
      // {
      //   slug: 'umowy-placowki',
      //   sectionId: 'finanse-prawne',
      //   category: 'Prawne',
      // },
      // WKRÓTCE - odkomentuj gdy artykuł będzie gotowy
      // {
      //   slug: 'dokumenty-wniosek',
      //   sectionId: 'finanse-prawne',
      //   category: 'Prawne',
      //   badge: 'WKRÓTCE',
      //   isActive: false,
      // },
      // WKRÓTCE - odkomentuj gdy artykuł będzie gotowy
      // {
      //   slug: 'prawa-mieszkanca',
      //   sectionId: 'finanse-prawne',
      //   category: 'Prawne',
      //   badge: 'WKRÓTCE',
      //   isActive: false,
      // },
    ],
  },
];
