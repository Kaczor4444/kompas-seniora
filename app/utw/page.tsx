import { prisma } from '@/lib/prisma';
import { getVoivodeshipFilter } from '@/lib/voivodeship-filter';
import { Metadata } from 'next';
import UtwResults from './UtwResults';

export const metadata: Metadata = {
  title: 'Uniwersytety Trzeciego Wieku w Małopolsce | Kompas Seniora',
  description: 'Znajdź Uniwersytet Trzeciego Wieku w Małopolsce. 52 placówki edukacji i aktywności dla seniorów — wykłady, warsztaty, kursy językowe, wycieczki.',
};

export default async function UtwPage() {
  const utw = await prisma.placowka.findMany({
    where: getVoivodeshipFilter({ typ_placowki: 'UTW' }),
    select: {
      id:           true,
      nazwa:        true,
      ulica:        true,
      miejscowosc:  true,
      kod_pocztowy: true,
      powiat:       true,
      telefon:      true,
      email:        true,
      www:          true,
      latitude:     true,
      longitude:    true,
    },
    orderBy: [{ powiat: 'asc' }, { miejscowosc: 'asc' }],
  });

  // Unikalne powiaty do filtra
  const powiaty = [...new Set(utw.map(u => u.powiat).filter(Boolean))].sort() as string[];

  return <UtwResults utw={utw} powiaty={powiaty} />;
}
