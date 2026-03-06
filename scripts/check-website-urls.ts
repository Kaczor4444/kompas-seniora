import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const records = await prisma.mopsContact.findMany({
    where: {
      website: { not: null }
    },
    orderBy: { cityDisplay: 'asc' }
  });

  console.log('🔍 Sprawdzanie formatów URL www w bazie:\n');

  const withHttps = records.filter(r => r.website?.startsWith('https://'));
  const withHttp = records.filter(r => r.website?.startsWith('http://') && !r.website?.startsWith('https://'));
  const withoutProtocol = records.filter(r => r.website && !r.website.startsWith('http://') && !r.website.startsWith('https://'));

  console.log(`📊 PODSUMOWANIE (${records.length} rekordów z www):`);
  console.log(`  ✅ Z https://: ${withHttps.length}`);
  console.log(`  ⚠️  Z http://: ${withHttp.length}`);
  console.log(`  ❌ BEZ protokołu: ${withoutProtocol.length}\n`);

  if (withoutProtocol.length > 0) {
    console.log('❌ Przykłady BEZ protokołu (pierwsze 10):');
    withoutProtocol.slice(0, 10).forEach(r => {
      console.log(`  - ${r.cityDisplay}: "${r.website}"`);
    });
  }
}

main()
  .catch(e => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
