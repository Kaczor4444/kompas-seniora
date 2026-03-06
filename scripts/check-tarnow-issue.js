// Check problematic cities in TERYT database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizePolish(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

async function checkCities() {
  const cities = [
    { nazwa: 'Tuchów', expectedPowiat: 'tarnowski' },
    { nazwa: 'Wietrzychowice', expectedPowiat: 'tarnowski' },
    { nazwa: 'Zakliczyn', expectedPowiat: 'tarnowski' },
    { nazwa: 'Żabno', expectedPowiat: 'tarnowski' },
    { nazwa: 'Mokre', expectedPowiat: 'tarnowski' },
    { nazwa: 'Tarnowiec', expectedPowiat: 'tarnowski' },
    { nazwa: 'Zakopane', expectedPowiat: 'tatrzański' },
    { nazwa: 'Białka Tatrzańska', expectedPowiat: 'tatrzański' }
  ];

  console.log('🔍 Checking TERYT database for problematic cities...\n');

  for (const city of cities) {
    const normalized = normalizePolish(city.nazwa);

    const results = await prisma.terytLocation.findMany({
      where: {
        nazwa_normalized: {
          contains: normalized
        }
      },
      select: {
        nazwa: true,
        powiat: true,
        wojewodztwo: true,
        rodzaj_miejscowosci: true,
        teryt_sym: true
      },
      orderBy: {
        nazwa: 'asc'
      },
      take: 10
    });

    console.log(`\n📍 "${city.nazwa}" (expected: pow. ${city.expectedPowiat})`);
    console.log(`   Normalized query: "${normalized}" - found ${results.length} results:`);

    if (results.length === 0) {
      console.log('   ❌ NOT FOUND in TERYT!');
    } else {
      for (const r of results) {
        const normalizedPowiat = normalizePolish(r.powiat);
        const expectedNormalized = normalizePolish(city.expectedPowiat);
        const powiatMatch = normalizedPowiat.includes(expectedNormalized);
        const icon = powiatMatch ? '✅' : '❌';

        console.log(`   ${icon} ${r.nazwa} (pow. ${r.powiat}, woj. ${r.wojewodztwo}) RM=${r.rodzaj_miejscowosci}`);

        // Check if any placówki exist
        const facilities = await prisma.placowka.count({
          where: {
            miejscowosc: {
              equals: r.nazwa,
              mode: 'insensitive'
            }
          }
        });
        if (facilities > 0) {
          console.log(`      → ${facilities} placówek w bazie`);
        }
      }
    }
  }

  // Check all unique powiaty in TERYT
  console.log('\n\n📋 Wszystkie powiaty w TERYT (Małopolskie):');
  const powiaty = await prisma.terytLocation.findMany({
    where: {
      wojewodztwo: 'małopolskie'
    },
    distinct: ['powiat'],
    select: {
      powiat: true
    },
    orderBy: {
      powiat: 'asc'
    }
  });

  powiaty.forEach(p => console.log(`   - ${p.powiat}`));

  await prisma.$disconnect();
}

checkCities().catch(console.error);
