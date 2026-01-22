import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePrices() {
  console.log('🔄 Starting price migration...');

  // Pobierz wszystkie placówki z ceną
  const placowki = await prisma.placowka.findMany({
    where: {
      koszt_pobytu: { not: null }
    },
    select: {
      id: true,
      koszt_pobytu: true,
      zrodlo_cena: true,
      data_zrodla_cena: true,
      verified: true,
      createdAt: true
    }
  });

  console.log(`📊 Found ${placowki.length} facilities with prices`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const placowka of placowki) {
    try {
      // Sprawdź czy już nie istnieje
      const existing = await prisma.placowkaCena.findFirst({
        where: {
          placowkaId: placowka.id,
          rok: 2024
        }
      });

      if (existing) {
        console.log(`⏭️  Skipping facility ${placowka.id} - price already exists`);
        skippedCount++;
        continue;
      }

      // Utwórz wpis historyczny dla 2024
      await prisma.placowkaCena.create({
        data: {
          placowkaId: placowka.id,
          rok: 2024,
          kwota: placowka.koszt_pobytu!,
          typ_kosztu: 'podstawowy',
          zrodlo: placowka.zrodlo_cena || 'Dane z 2024',
          data_pobrania: placowka.data_zrodla_cena || placowka.createdAt,
          verified: placowka.verified,
          notatki: 'Migracja z głównej tabeli Placowka'
        }
      });

      migratedCount++;

      if (migratedCount % 10 === 0) {
        console.log(`✅ Migrated ${migratedCount}/${placowki.length}...`);
      }

    } catch (error) {
      console.error(`❌ Error migrating facility ${placowka.id}:`, error);
    }
  }

  console.log('\n🎉 Migration complete!');
  console.log(`✅ Migrated: ${migratedCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`📊 Total: ${placowki.length}`);
}

migratePrices()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
