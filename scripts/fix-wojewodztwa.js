// Skrypt do normalizacji województw
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Sprawdzam województwa w bazie...\n');

  // Pokaż aktualne województwa
  const placowki = await prisma.placowka.findMany({
    select: {
      wojewodztwo: true,
    },
  });

  const wojewodztwa = {};
  placowki.forEach(p => {
    wojewodztwa[p.wojewodztwo] = (wojewodztwa[p.wojewodztwo] || 0) + 1;
  });

  console.log('📊 Aktualne województwa:');
  Object.entries(wojewodztwa).forEach(([woj, count]) => {
    console.log(`  ${woj}: ${count} placówek`);
  });

  console.log('\n🔧 Normalizuję do małych liter...\n');

  // Zaktualizuj wszystkie do lowercase
  const result = await prisma.$executeRaw`
    UPDATE "Placowka"
    SET wojewodztwo = LOWER(wojewodztwo)
    WHERE wojewodztwo != LOWER(wojewodztwo)
  `;

  console.log(`✅ Zaktualizowano ${result} rekordów\n`);

  // Pokaż po aktualizacji
  const placowkiAfter = await prisma.placowka.findMany({
    select: {
      wojewodztwo: true,
    },
  });

  const wojewodztwaAfter = {};
  placowkiAfter.forEach(p => {
    wojewodztwaAfter[p.wojewodztwo] = (wojewodztwaAfter[p.wojewodztwo] || 0) + 1;
  });

  console.log('📊 Po aktualizacji:');
  Object.entries(wojewodztwaAfter).forEach(([woj, count]) => {
    console.log(`  ${woj}: ${count} placówek`);
  });

  console.log('\n✅ Gotowe!');
}

main()
  .catch((e) => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
