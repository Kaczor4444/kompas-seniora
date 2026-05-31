import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Kompas Seniora',
    short_name: 'Kompas Seniora',
    description: 'Wyszukiwarka placówek opieki dla seniorów — DPS, Klub Seniora, Dzienny Dom Senior+',
    start_url: '/',
    display: 'browser',
    background_color: '#1e293b',
    theme_color: '#1e293b',
    icons: [
      {
        src: '/images/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
