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
        slug: 'typy-dps',
        sectionId: 'wybor-opieki',
        category: 'Wybór opieki',
        featured: true,
      },
      {
        slug: 'proces-przyjecia-dps',
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
    title: 'Finanse',
    icon: 'Wallet',
    articles: [
      {
        slug: 'dodatek-pielegnacyjny',
        sectionId: 'finanse-i-swiadczenia',
        category: 'Finanse',
        featured: true,
      },
      {
        slug: 'zasilek-opiekunczy',
        sectionId: 'finanse-i-swiadczenia',
        category: 'Finanse',
        featured: true,
      },
      {
        slug: 'swiadczenia-mops',
        sectionId: 'finanse-i-swiadczenia',
        category: 'Finanse',
      },
      {
        slug: 'dofinansowania-2025',
        sectionId: 'finanse-i-swiadczenia',
        category: 'Finanse',
        featured: true,
      },
      {
        slug: 'ulgi-podatkowe',
        sectionId: 'finanse-i-swiadczenia',
        category: 'Finanse',
      },
    ],
  },
  {
    id: 'prawne-aspekty',
    title: 'Prawne',
    icon: 'Scale',
    articles: [
      {
        slug: 'prawa-mieszkancow',
        sectionId: 'prawne-aspekty',
        category: 'Prawne',
        featured: true,
      },
      {
        slug: 'zgoda-na-opieke',
        sectionId: 'prawne-aspekty',
        category: 'Prawne',
      },
      {
        slug: 'ubezwlasnowolnienie',
        sectionId: 'prawne-aspekty',
        category: 'Prawne',
      },
      {
        slug: 'prawa-opiekunow',
        sectionId: 'prawne-aspekty',
        category: 'Prawne',
      },
      {
        slug: 'umowy-placowki',
        sectionId: 'prawne-aspekty',
        category: 'Prawne',
        featured: true,
      },
    ],
  },
];
