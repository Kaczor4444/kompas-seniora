import { Metadata } from 'next';
import SupportAssistant from '@/src/components/asystent/SupportAssistant';

export const metadata: Metadata = {
  title: 'Asystent Wyboru Opieki Senioralnej | Kompas Seniora',
  description: 'Nie wiesz, czy DPS, ŚDS czy ZOL? Wypełnij 4 pytania, a pomożemy Ci wybrać najlepszą formę opieki dla seniora. Bezpłatnie, bez rejestracji.',
  keywords: 'asystent wyboru, dps czy śds, jak wybrać dom seniora, wybór opieki dla seniora, pomoc w wyborze domu pomocy',
  openGraph: {
    title: 'Asystent Wyboru Opieki Senioralnej',
    description: 'Nie wiesz, od czego zacząć? Wypełnij 4 proste pytania, a podpowiemy najlepszą formę opieki.',
    type: 'website',
    locale: 'pl_PL',
  },
};

export default function AsystentPage() {
  return (
    <main>
      <SupportAssistant />
    </main>
  );
}
