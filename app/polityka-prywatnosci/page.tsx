import { Metadata } from 'next';
import PolitykaPrywatnosciClient from './client';

export const metadata: Metadata = {
  title: 'Polityka Prywatności | Kompas Seniora',
  description: 'Polityka prywatności i ochrony danych osobowych serwisu Kompas Seniora zgodnie z RODO.',
  robots: 'index, follow',
};

export default function PolitykaPrywatnosciPage() {
  return <PolitykaPrywatnosciClient />;
}