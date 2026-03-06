import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== ANALIZA PLACÓWEK KRAKÓW ===\n');

  // 1. Ile placówek w powiecie krakowskim?
  const krakowskiPowiat = await prisma.placowka.findMany({
    where: {
      OR: [
        { powiat: { contains: 'krakow', mode: 'insensitive' } },
        { powiat: { contains: 'krakowski', mode: 'insensitive' } }
      ]
    }
  });

  console.log(`📊 Placówki w powiecie krakowskim: ${krakowskiPowiat.length}`);

  // 2. Rozkład po miejscowościach
  const byCity = krakowskiPowiat.reduce((acc, p) => {
    const city = p.miejscowosc || 'BRAK';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n📍 Rozkład po miejscowościach:');
  Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => {
      console.log(`  ${city}: ${count}`);
    });

  // 3. Ile ŚDS vs DPS?
  const sds = krakowskiPowiat.filter(p => p.typ_placowki === 'ŚDS').length;
  const dps = krakowskiPowiat.filter(p => p.typ_placowki === 'DPS').length;

  console.log(`\n🏥 Typy placówek:`);
  console.log(`  ŚDS: ${sds}`);
  console.log(`  DPS: ${dps}`);

  // 4. Ile placówek tylko w mieście Kraków?
  const onlyKrakow = krakowskiPowiat.filter(p =>
    p.miejscowosc?.toLowerCase().includes('krakow')
  );

  console.log(`\n🏙️  Placówki TYLKO w mieście Kraków: ${onlyKrakow.length}`);
  console.log(`   ŚDS: ${onlyKrakow.filter(p => p.typ_placowki === 'ŚDS').length}`);
  console.log(`   DPS: ${onlyKrakow.filter(p => p.typ_placowki === 'DPS').length}`);

  console.log('\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
