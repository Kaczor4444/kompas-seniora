import { PrismaClient } from '@prisma/client';
import { formatPhoneNumber } from '../lib/phone-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Standaryzuję numery telefonów w bazie MOPS/GOPS...\n');

  const records = await prisma.mopsContact.findMany({
    orderBy: { cityDisplay: 'asc' }
  });

  console.log(`📊 Znaleziono ${records.length} rekordów\n`);

  let fixedCount = 0;
  let alreadyOkCount = 0;
  let examples: string[] = [];

  for (const record of records) {
    const original = record.phone;
    const formatted = formatPhoneNumber(original);

    if (original !== formatted) {
      await prisma.mopsContact.update({
        where: { id: record.id },
        data: { phone: formatted }
      });

      if (examples.length < 10) {
        examples.push(`  ✅ ${record.cityDisplay}: "${original}" → "${formatted}"`);
      }
      fixedCount++;
    } else {
      alreadyOkCount++;
    }
  }

  console.log('📝 Przykłady zmian (pierwsze 10):');
  examples.forEach(ex => console.log(ex));

  console.log(`\n📊 PODSUMOWANIE:`);
  console.log(`  ✅ Sformatowano: ${fixedCount} numerów`);
  console.log(`  ✓ Już poprawne: ${alreadyOkCount} numerów`);
  console.log(`  📦 Razem: ${records.length} rekordów`);
  console.log(`\n✨ Format: XX XXX XX XX (np. 12 345 67 89)`);
}

main()
  .catch(e => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
