import { Metadata } from 'next';
import RegulaminClient from './client';

export const metadata: Metadata = {
  title: 'Regulamin | Kompas Seniora',
  description: 'Regulamin korzystania z serwisu Kompas Seniora - zasady użytkowania platformy.',
  robots: 'index, follow',
};

export default function RegulaminPage() {
  return <RegulaminClient />;
}