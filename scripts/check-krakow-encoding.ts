import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function normalizePolish(str: string): Promise<string> {
  return str
    .trim()
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function main() {
  console.log('\n=== ANALIZA KODOWANIA MIEJSCOWOŚCI ===\n');

  const facilities = await prisma.placowka.findMany({
    where: {
      miejscowosc: 'Kraków'
    },
    select: {
      id: true,
      nazwa: true,
      miejscowosc: true,
      typ_placowki: true
    }
  });

  console.log(`✅ Exact match (miejscowosc = 'Kraków'): ${facilities.length}`);

  if (facilities.length > 0) {
    console.log('\nPierwsze 5 placówek:');
    facilities.slice(0, 5).forEach(f => {
      const normalized = normalizePolish(f.miejscowosc || '');
      console.log(`  ${f.typ_placowki} | ${f.miejscowosc} | normalized: "${normalized}"`);

      // Check unicode
      const bytes = Buffer.from(f.miejscowosc || '', 'utf-8');
      console.log(`    Bytes: ${bytes.toString('hex')}`);
    });
  }

  // Test lowercase contains
  const lowerCaseTest = await prisma.placowka.findMany({
    where: {
      miejscowosc: {
        contains: 'krakow',
        mode: 'insensitive'
      }
    }
  });

  console.log(`\n🔍 Case-insensitive contains 'krakow': ${lowerCaseTest.length}`);

  // Test exact lowercase
  const exactLowerTest = await prisma.placowka.findMany({
    where: {
      miejscowosc: {
        equals: 'krakow',
        mode: 'insensitive'
      }
    }
  });

  console.log(`🔍 Case-insensitive equals 'krakow': ${exactLowerTest.length}`);

  console.log('\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
