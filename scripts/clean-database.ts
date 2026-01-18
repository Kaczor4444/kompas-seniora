import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🔧 Starting database cleanup...\n');

  try {
    // 1. Show current state
    const totalBefore = await prisma.placowka.count();
    console.log(`📊 Total facilities before: ${totalBefore}`);

    const krakowBefore = await prisma.placowka.findMany({
      where: {
        miejscowosc: {
          contains: 'Krak',
        },
      },
      select: { miejscowosc: true, powiat: true },
    });
    console.log(`📍 Kraków entries before: ${krakowBefore.length}`);
    console.log('Sample:', krakowBefore.slice(0, 5));

    // 2. Get all records to clean
    const allFacilities = await prisma.placowka.findMany();
    console.log(`\n🔍 Processing ${allFacilities.length} records...\n`);

    let updatedCount = 0;

    for (const facility of allFacilities) {
      const updates: any = {};
      let needsUpdate = false;

      // Trim and normalize miejscowosc
      const cleanedMiejscowosc = facility.miejscowosc
        .trim()
        .replace(/\s+/g, ' ')
        .normalize('NFC'); // Normalize Unicode to NFC form

      if (cleanedMiejscowosc !== facility.miejscowosc) {
        updates.miejscowosc = cleanedMiejscowosc;
        needsUpdate = true;
      }

      // Trim, lowercase, and normalize powiat
      let cleanedPowiat = facility.powiat
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

      // Fix incorrect powiat names for Kraków
      if (cleanedMiejscowosc === 'Kraków') {
        // Map all Kraków powiat variations to 'krakowski'
        // (except 'limanowski' which is a different location)
        if (['kraków', 'm. kraków'].includes(cleanedPowiat)) {
          cleanedPowiat = 'krakowski';
        }
      }

      if (cleanedPowiat !== facility.powiat) {
        updates.powiat = cleanedPowiat;
        needsUpdate = true;
      }

      // Update if needed
      if (needsUpdate) {
        await prisma.placowka.update({
          where: { id: facility.id },
          data: updates,
        });
        updatedCount++;

        if (updatedCount % 10 === 0) {
          console.log(`✅ Updated ${updatedCount} records...`);
        }
      }
    }

    console.log(`\n✅ Updated ${updatedCount} records total\n`);

    // 3. Show final state
    const totalAfter = await prisma.placowka.count();
    console.log(`📊 Total facilities after: ${totalAfter}`);

    const krakowAfter = await prisma.placowka.groupBy({
      by: ['miejscowosc', 'powiat'],
      _count: { id: true },
      where: {
        miejscowosc: {
          contains: 'Krak',
        },
      },
    });
    console.log(`\n📍 Kraków entries after cleanup:`);
    krakowAfter.forEach((entry) => {
      console.log(
        `  ${entry.miejscowosc} | ${entry.powiat} | ${entry._count.id}`
      );
    });

    // 4. Show top cities
    const topCities = await prisma.placowka.groupBy({
      by: ['miejscowosc', 'powiat'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
    console.log(`\n🏙️  Top 10 cities after cleanup:`);
    topCities.forEach((city) => {
      console.log(`  ${city.miejscowosc} | ${city.powiat} | ${city._count.id}`);
    });

    console.log('\n✨ Database cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
