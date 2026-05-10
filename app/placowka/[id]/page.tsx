import { notFound } from 'next/navigation';
import PlacowkaDetails from '../../../src/components/placowka/PlacowkaDetails';
import { prisma } from '@/lib/prisma';
import { PUBLIC_PLACOWKA_SELECT } from '@/lib/public-placowka-fields';

export default async function PlacowkaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseInt(idParam);

  if (isNaN(id)) {
    notFound();
  }

  const placowka = await prisma.placowka.findUnique({
    where: { id },
    select: {
      ...PUBLIC_PLACOWKA_SELECT,
      ceny: {
        select: { rok: true, kwota: true },
        where: { typ_kosztu: 'podstawowy' },
        orderBy: { rok: 'asc' },
      },
      wolneMiejsca: {
        select: {
          typ_opieki: true,
          wolne_ogolem: true,
          wolne_kobiety: true,
          wolne_mezczyzni: true,
          oczekujacych: true,
          czas_oczekiwania_dni: true,
          data_stanu: true,
        },
        orderBy: { data_stanu: 'desc' },
        take: 20,
      },
    },
  });

  if (!placowka) {
    notFound();
  }

  await prisma.$disconnect();

  return <PlacowkaDetails placowka={placowka} />;
}