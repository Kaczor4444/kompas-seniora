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
        where: { typ_kosztu: 'podstawowy', verified: true },
        orderBy: { rok: 'asc' },
      },
    },
  });

  if (!placowka) {
    notFound();
  }

  await prisma.$disconnect();

  return <PlacowkaDetails placowka={placowka} />;
}