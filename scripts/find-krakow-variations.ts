import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findVariations() {
  // Find all unique combinations of miejscowosc + powiat containing "Krak"
  const records = await prisma.placowka.groupBy({
    by: ['miejscowosc', 'powiat'],
    _count: { id: true },
    where: {
      OR: [
        { miejscowosc: { contains: 'Krak' } },
        { powiat: { contains: 'krak' } },
      ],
    },
    orderBy: { _count: { id: 'desc' } },
  });

  console.log('All Kraków-related combinations:\n');
  records.forEach((r) => {
    const miasto = Buffer.from(r.miejscowosc, 'utf8').toString('hex');
    const pow = Buffer.from(r.powiat, 'utf8').toString('hex');
    console.log(`${r._count.id}x | "${r.miejscowosc}" | "${r.powiat}"`);
    console.log(`     hex: ${miasto} | ${pow}\n`);
  });

  await prisma.$disconnect();
}

findVariations();
