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

async function debugNowyScz() {
  console.log('🔬 SZCZEGÓŁOWY DEBUG: Nowy Sącz\n');
  console.log('=' .repeat(70));

  // 1. TERYT
  const teryt = await prisma.terytLocation.findFirst({
    where: {
      nazwa: 'Nowy Sącz',
      rodzaj_miejscowosci: '96'
    }
  });

  console.log('\n1️⃣ TERYT:');
  console.log(`   nazwa: "${teryt?.nazwa}"`);
  console.log(`   powiat: "${teryt?.powiat}"`);
  console.log(`   RM: ${teryt?.rodzaj_miejscowosci}`);

  // 2. Mapowanie
  const mapTerytPowiatToDb = (terytPowiat: string): string => {
    const normalized = normalizePolish(terytPowiat);
    if (normalized === 'm. krakow' || normalized === 'miasto krakow') return 'krakowski';
    if (normalized === 'm. nowy sacz' || normalized === 'miasto nowy sacz') return 'nowosądecki';
    if (normalized === 'm. tarnow' || normalized === 'miasto tarnow') return 'tarnowski';
    return terytPowiat;
  };

  if (teryt) {
    const dbPowiat = mapTerytPowiatToDb(teryt.powiat);
    console.log('\n2️⃣ MAPOWANIE:');
    console.log(`   TERYT powiat: "${teryt.powiat}"`);
    console.log(`   Normalized: "${normalizePolish(teryt.powiat)}"`);
    console.log(`   Zmapowany na: "${dbPowiat}"`);
    console.log(`   Normalized po mapowaniu: "${normalizePolish(dbPowiat)}"`);

    // 3. Placówki
    const placowki = await prisma.placowka.findMany({
      where: {
        miejscowosc: {
          contains: 'Nowy Sącz',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        nazwa: true,
        miejscowosc: true,
        powiat: true
      }
    });

    console.log('\n3️⃣ PLACÓWKI:');
    placowki.forEach(p => {
      console.log(`\n   [ID ${p.id}] ${p.nazwa.substring(0, 50)}...`);
      console.log(`   miejscowosc: "${p.miejscowosc}"`);
      console.log(`   powiat: "${p.powiat}"`);
      console.log(`   powiat normalized: "${normalizePolish(p.powiat)}"`);
    });

    // 4. Test dopasowania
    console.log('\n4️⃣ TEST DOPASOWANIA:');
    const normalizedMiejscowosc = normalizePolish(teryt.nazwa);
    const normalizedPowiat = normalizePolish(dbPowiat);

    console.log(`   Szukam miejscowości: "${normalizedMiejscowosc}"`);
    console.log(`   Szukam powiatu: "${normalizedPowiat}"`);

    placowki.forEach(p => {
      const normFacMiejsc = normalizePolish(p.miejscowosc);
      const normFacPow = normalizePolish(p.powiat);

      const miejscMatch = normFacMiejsc === normalizedMiejscowosc;
      const powiatMatch = normFacPow.includes(normalizedPowiat) || normalizedPowiat.includes(normFacPow);

      console.log(`\n   Placówka [ID ${p.id}]:`);
      console.log(`      miejscowosc normalized: "${normFacMiejsc}"`);
      console.log(`      miejscowosc match: ${miejscMatch ? '✅' : '❌'}`);
      console.log(`      powiat normalized: "${normFacPow}"`);
      console.log(`      powiat match: ${powiatMatch ? '✅' : '❌'}`);
      console.log(`      FINAL: ${miejscMatch && powiatMatch ? '✅ PASUJE' : '❌ NIE PASUJE'}`);
    });
  }

  await prisma.$disconnect();
}

debugNowyScz().catch(console.error);
