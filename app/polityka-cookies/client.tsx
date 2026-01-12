import { Metadata } from 'next';
import PolitykaCookiesClient from './client';

export const metadata: Metadata = {
  title: 'Polityka Cookies | Kompas Seniora',
  description: 'Polityka wykorzystywania plików cookies w serwisie Kompas Seniora.',
  robots: 'index, follow',
};

export default function PolitykaCookiesPage() {
  return <PolitykaCookiesClient />;
}