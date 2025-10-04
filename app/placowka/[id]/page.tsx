import { notFound } from 'next/navigation';
import PlacowkaDetails from '../../../src/components/placowka/PlacowkaDetails';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function PlacowkaPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  
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
