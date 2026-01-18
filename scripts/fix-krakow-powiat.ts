import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixKrakowPowiat() {
  console.log('🔧 Fixing remaining Kraków powiat entries...\n');

  // Find all Kraków records (any Unicode variation)
  const allKrakow = await prisma.placowka.findMany({
    where: {
      miejscowosc: { contains: 'Krak' },
      NOT: { powiat: 'limanowski' }, // Keep the one that's actually in limanowski
    },
  });

  console.log(`Found ${allKrakow.length} Kraków records to check\n`);

  let fixed = 0;

  for (const record of allKrakow) {
    // Normalize the city name to consistent Unicode
    const normalizedCity = 'Kraków'; // Use literal string to ensure consistent encoding

    // Check if it's actually Kraków and powiat should be krakowski
    if (record.miejscowosc.includes('Krak') && record.powiat !== 'krakowski') {
      await prisma.placowka.update({
        where: { id: record.id },
        data: {
          miejscowosc: normalizedCity,
          powiat: 'krakowski',
        },
      });

      console.log(`✅ Fixed ID ${record.id}: "${record.powiat}" → "krakowski"`);
      fixed++;
    }
  }

  console.log(`\n✅ Fixed ${fixed} records\n`);

  // Verify the result
  const result = await prisma.placowka.groupBy({
    by: ['miejscowosc', 'powiat'],
    _count: { id: true },
    where: {
      miejscowosc: { contains: 'Krak' },
    },
  });

  console.log('Final Kraków groups:');
  result.forEach((r) => {
    console.log(`  ${r.miejscowosc} | ${r.powiat} | ${r._count.id}`);
  });

  await prisma.$disconnect();
}

fixKrakowPowiat();
