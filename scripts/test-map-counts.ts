import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== TEST LICZNIKÓW DLA MAPY ===\n');

  const allFacilities = await prisma.placowka.findMany({
    select: { powiat: true, miejscowosc: true }
  });

  // Symuluj logikę z app/page.tsx
  const powiatCounts: Record<string, number> = {};

  // Count facilities per powiat
  for (const facility of allFacilities) {
    if (!facility.powiat) continue;
    powiatCounts[facility.powiat] = (powiatCounts[facility.powiat] || 0) + 1;
  }

  // Miasta na prawach powiatu
  const krakowCity = allFacilities.filter(f =>
    f.powiat?.toLowerCase().includes('krakow') &&
    f.miejscowosc === 'Kraków'
  ).length;
  if (krakowCity > 0) {
    powiatCounts['Kraków'] = krakowCity;
  }

  const nowySaczCity = allFacilities.filter(f =>
    (f.powiat?.toLowerCase().includes('nowosądecki') || f.powiat?.toLowerCase().includes('nowosadecki')) &&
    f.miejscowosc === 'Nowy Sącz'
  ).length;
  if (nowySaczCity > 0) {
    powiatCounts['Nowy Sącz'] = nowySaczCity;
  }

  const tarnowCity = allFacilities.filter(f =>
    f.powiat?.toLowerCase().includes('tarnowski') &&
    f.miejscowosc === 'Tarnów'
  ).length;
  if (tarnowCity > 0) {
    powiatCounts['Tarnów'] = tarnowCity;
  }

  // Wyświetl wyniki
  console.log('📊 Liczniki dla mapy:\n');

  // Kraków
  console.log('🏙️  KRAKÓW:');
  console.log(`   Miasto Kraków: ${powiatCounts['Kraków'] || 0} placówek`);
  console.log(`   Powiat krakowski: ${powiatCounts['krakowski'] || 0} placówek`);
  console.log(`   Suma: ${(powiatCounts['Kraków'] || 0) + (powiatCounts['krakowski'] || 0)} (NIE duplikat!)`);

  // Sprawdzenie poprawności
  const krakowskiTotal = allFacilities.filter(f =>
    f.powiat?.toLowerCase().includes('krakow')
  ).length;
  console.log(`   ✅ Faktyczna suma w bazie: ${krakowskiTotal}\n`);

  // Nowy Sącz
  console.log('🏙️  NOWY SĄCZ:');
  console.log(`   Miasto: ${powiatCounts['Nowy Sącz'] || 0} placówek`);
  console.log(`   Powiat: ${powiatCounts['nowosądecki'] || 0} placówek\n`);

  // Tarnów
  console.log('🏙️  TARNÓW:');
  console.log(`   Miasto: ${powiatCounts['Tarnów'] || 0} placówek`);
  console.log(`   Powiat: ${powiatCounts['tarnowski'] || 0} placówek\n`);

  console.log('');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
