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

async function checkCity(cityName: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`🔍 SPRAWDZAM: ${cityName.toUpperCase()}`);
  console.log('='.repeat(70));

  // 1. Sprawdź TERYT
  const terytResults = await prisma.terytLocation.findMany({
    where: {
      OR: [
        { nazwa: { contains: cityName, mode: 'insensitive' } },
        { nazwa_normalized: { contains: normalizePolish(cityName) } }
      ]
    },
    orderBy: { nazwa: 'asc' },
    take: 10
  });

  console.log(`\n📍 TERYT - znaleziono ${terytResults.length} wyników:`);
  terytResults.forEach((loc, i) => {
    console.log(`\n${i + 1}. ${loc.nazwa}`);
    console.log(`   Powiat: "${loc.powiat}"`);
    console.log(`   Wojewodztwo: ${loc.wojewodztwo}`);
    console.log(`   RM: ${loc.rodzaj_miejscowosci}`);
  });

  // 2. Sprawdź placówki
  const placowki = await prisma.placowka.findMany({
    where: {
      miejscowosc: {
        contains: cityName,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      nazwa: true,
      miejscowosc: true,
      powiat: true,
      typ_placowki: true
    }
  });

  console.log(`\n🏥 PLACÓWKI - znaleziono ${placowki.length}:`);
  placowki.forEach((p, i) => {
    const hasTrailing = p.miejscowosc !== p.miejscowosc.trim();
    console.log(`\n${i + 1}. [ID ${p.id}] ${p.nazwa.substring(0, 50)}...`);
    console.log(`   Miejscowość: "${p.miejscowosc}" (length: ${p.miejscowosc.length}) ${hasTrailing ? '⚠️ TRAILING SPACE!' : '✅'}`);
    console.log(`   Powiat: "${p.powiat}"`);
    console.log(`   Typ: ${p.typ_placowki}`);
  });

  // 3. Test autocomplete
  const query = normalizePolish(cityName);
  console.log(`\n🔧 TEST AUTOCOMPLETE dla query="${query}":`);

  const terytMatches = await prisma.terytLocation.findMany({
    where: {
      nazwa_normalized: {
        contains: query
      }
    },
    distinct: ['nazwa', 'powiat'],
    take: 50,
    orderBy: {
      nazwa: 'asc'
    },
    select: {
      nazwa: true,
      powiat: true,
      wojewodztwo: true,
      rodzaj_miejscowosci: true
    }
  });

  console.log(`   TERYT matches: ${terytMatches.length}`);

  const mapTerytPowiatToDb = (terytPowiat: string): string => {
    const normalized = normalizePolish(terytPowiat);
    if (normalized === 'm. krakow' || normalized === 'miasto krakow') return 'krakowski';
    if (normalized === 'm. nowy sacz' || normalized === 'miasto nowy sacz') return 'nowosądecki';
    if (normalized === 'm. tarnow' || normalized === 'miasto tarnow') return 'tarnowski';
    return terytPowiat;
  };

  let matchCount = 0;
  for (const loc of terytMatches) {
    const normalizedMiejscowosc = normalizePolish(loc.nazwa);
    const dbPowiat = mapTerytPowiatToDb(loc.powiat);
    const normalizedPowiat = normalizePolish(dbPowiat);

    const allFacilities = await prisma.placowka.findMany({
      select: { miejscowosc: true, powiat: true }
    });

    const matching = allFacilities.filter(f => {
      const normFacMiejsc = normalizePolish(f.miejscowosc);
      const normFacPow = normalizePolish(f.powiat);

      const miejscMatch = normFacMiejsc === normalizedMiejscowosc;
      const powiatMatch = normFacPow.includes(normalizedPowiat) || normalizedPowiat.includes(normFacPow);

      return miejscMatch && powiatMatch;
    });

    if (matching.length > 0) {
      matchCount++;
      console.log(`   ✅ "${loc.nazwa}" (${loc.powiat}) → ${matching.length} placówek`);
    }
  }

  if (matchCount === 0) {
    console.log(`   ❌ PROBLEM: Żadna lokalizacja TERYT nie ma pasujących placówek!`);
    console.log(`      Dlatego "${cityName}" NIE pojawi się w autocomplete!`);
  } else {
    console.log(`   ✅ OK: ${matchCount} lokalizacji z placówkami`);
  }
}

async function main() {
  const citiesToCheck = [
    'Nowy Sącz',
    'Muszyna',
    'Gródek'
  ];

  for (const city of citiesToCheck) {
    await checkCity(city);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
