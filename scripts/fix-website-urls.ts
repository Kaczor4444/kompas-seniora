import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Naprawiam adresy www w bazie danych...\n');

  // Znajdź wszystkie rekordy bez protokołu
  const records = await prisma.mopsContact.findMany({
    where: {
      website: { not: null }
    }
  });

  console.log(`📊 Znaleziono ${records.length} rekordów z www\n`);

  let fixedCount = 0;
  let alreadyOkCount = 0;

  for (const record of records) {
    if (!record.website) continue;

    // Sprawdź czy już ma protokół
    if (record.website.startsWith('http://') || record.website.startsWith('https://')) {
      alreadyOkCount++;
      continue;
    }

    // Dodaj https://
    const fixedUrl = `https://${record.website}`;

    await prisma.mopsContact.update({
      where: { id: record.id },
      data: { website: fixedUrl }
    });

    console.log(`✅ ${record.cityDisplay}: "${record.website}" → "${fixedUrl}"`);
    fixedCount++;
  }

  console.log(`\n📊 PODSUMOWANIE:`);
  console.log(`  ✅ Naprawiono: ${fixedCount} rekordów`);
  console.log(`  ✓ Już poprawne: ${alreadyOkCount} rekordów`);
  console.log(`  📦 Razem: ${records.length} rekordów`);
}

main()
  .catch(e => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
