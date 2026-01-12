import { Metadata } from 'next';
import MisjaClient from './client';

export const metadata: Metadata = {
  title: 'Misja - Kompas Seniora | Pomoc w wyborze opieki nad seniorem',
  description: 'Dowiedz się, dlaczego powstał Kompas Seniora. Pomagamy rodzinom znaleźć najlepszą opiekę dla seniorów - DPS, ŚDS, wsparcie dzienne.',
  keywords: 'misja, kompas seniora, opieka nad seniorem, DPS, dom opieki',
};

export default function MisjaPage() {
  return <MisjaClient />;
}
