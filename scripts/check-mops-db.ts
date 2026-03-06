import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Sprawdzanie stanu bazy danych MOPS/GOPS...\n');

  // Liczba wszystkich rekordów
  const total = await prisma.mopsContact.count();
  console.log(`📊 Łącznie rekordów: ${total}`);

  // Liczba po województwach
  const byWoj = await prisma.mopsContact.groupBy({
    by: ['wojewodztwo'],
    _count: true,
  });

  console.log('\n📍 Rozkład po województwach:');
  byWoj.forEach(w => {
    console.log(`  - ${w.wojewodztwo}: ${w._count} rekordów`);
  });

  // Liczba po typie (MOPS/GOPS)
  const byType = await prisma.mopsContact.groupBy({
    by: ['typ'],
    _count: true,
  });

  console.log('\n🏢 Rozkład po typie:');
  byType.forEach(t => {
    console.log(`  - ${t.typ}: ${t._count} rekordów`);
  });

  // Zweryfikowane vs niezweryfikowane
  const verified = await prisma.mopsContact.count({ where: { verified: true } });
  const unverified = await prisma.mopsContact.count({ where: { verified: false } });

  console.log('\n✅ Status weryfikacji:');
  console.log(`  - Zweryfikowane: ${verified}`);
  console.log(`  - Niezweryfikowane: ${unverified}`);

  // Pierwsze 10 rekordów
  const sample = await prisma.mopsContact.findMany({
    take: 10,
    orderBy: { city: 'asc' },
  });

  console.log('\n📋 Przykładowe rekordy (pierwsze 10):');
  sample.forEach(m => {
    console.log(`  - ${m.cityDisplay} (${m.wojewodztwo}) - ${m.name}`);
    console.log(`    Tel: ${m.phone}, typ: ${m.typ}`);
  });
}

main()
  .catch(e => {
    console.error('❌ Błąd:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
