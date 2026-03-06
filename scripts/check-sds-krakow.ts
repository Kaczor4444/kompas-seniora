import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizePolish(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function main() {
  console.log('\n=== ANALIZA ŚDS W KRAKOWIE ===\n');

  // Wszystkie placówki w powiecie krakowskim
  const allKrakowski = await prisma.placowka.findMany({
    where: {
      OR: [
        { powiat: { contains: 'krakow', mode: 'insensitive' } },
        { powiat: { contains: 'krakowski', mode: 'insensitive' } }
      ]
    }
  });

  const sdsPowiat = allKrakowski.filter(p => p.typ_placowki === 'ŚDS');
  console.log(`📊 Wszystkie ŚDS w powiecie krakowskim: ${sdsPowiat.length}`);

  // ŚDS w mieście Kraków (exact match)
  const sdsInCity = sdsPowiat.filter(p => p.miejscowosc === 'Kraków');
  console.log(`🏙️  ŚDS w mieście Kraków (exact): ${sdsInCity.length}`);

  // ŚDS gdzie miejscowość zawiera "krakow" po normalizacji
  const sdsNormalized = sdsPowiat.filter(p => {
    const norm = normalizePolish(p.miejscowosc || '');
    return norm.includes('krakow');
  });
  console.log(`🔍 ŚDS gdzie miejscowosc.includes('krakow'): ${sdsNormalized.length}`);

  // Pokaż miasta gdzie są ŚDS poza Krakowem
  console.log('\n📍 ŚDS w powiecie krakowskim (wszystkie miejscowości):');
  const byCity = sdsPowiat.reduce((acc, p) => {
    const city = p.miejscowosc || 'BRAK';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => {
      console.log(`  ${city}: ${count}`);
    });

  console.log('\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
