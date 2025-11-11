import { notFound } from 'next/navigation';
import PlacowkaDetails from '../../../src/components/placowka/PlacowkaDetails';
import { prisma } from '@/lib/prisma';

export default async function PlacowkaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = parseInt(idParam);
  
  if (isNaN(id)) {
    notFound();
  }

  const placowka = await prisma.placowka.findUnique({
    where: { id }
  });

  if (!placowka) {
    notFound();
  }

  await prisma.$disconnect();

  return <PlacowkaDetails placowka={placowka} />;
}