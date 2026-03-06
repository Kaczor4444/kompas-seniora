import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const records = await prisma.mopsContact.findMany({
    orderBy: [{ city: 'asc' }, { typ: 'asc' }]
  });

  console.log('🔍 Sprawdzanie duplikatów (city + typ):\n');

  const seen = new Map<string, any>();
  const duplicates: any[] = [];

  for (const r of records) {
    const key = `${r.city}|${r.typ}`;

    if (seen.has(key)) {
      duplicates.push({ existing: seen.get(key), duplicate: r });
      console.log(`❌ DUPLIKAT: ${r.city} + ${r.typ}`);
      console.log(`   1) ID ${seen.get(key).id}: ${seen.get(key).name}`);
      console.log(`   2) ID ${r.id}: ${r.name}\n`);
    } else {
      seen.set(key, r);
    }
  }

  if (duplicates.length === 0) {
    console.log('✅ Brak duplikatów! Można bezpiecznie dodać @@unique([city, typ])');
  } else {
    console.log(`\n⚠️  Znaleziono ${duplicates.length} duplikatów - trzeba je najpierw usunąć!`);
  }
}

main()
  .catch(e => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
