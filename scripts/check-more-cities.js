// Check if these cities are in TERYT database
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
    'Zator',
    'Koniusza',
    'Pałecznica',
    'Łętownia',
    'Maków Podhalański'
  ];

  console.log('🔍 Checking TERYT database for cities...\n');

  for (const city of cities) {
    const normalized = normalizePolish(city);

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
      take: 5
    });

    console.log(`\n📍 "${city}" (normalized: "${normalized}") - found ${results.length} results:`);

    if (results.length === 0) {
      console.log('  ❌ NOT FOUND in TERYT!');
    } else {
      for (const r of results) {
        console.log(`  - ${r.nazwa} (pow. ${r.powiat}, woj. ${r.wojewodztwo}) RM=${r.rodzaj_miejscowosci}`);

        // Check if any placówki exist
        const facilities = await prisma.placowka.count({
          where: {
            miejscowosc: {
              equals: r.nazwa,
              mode: 'insensitive'
            }
          }
        });
        console.log(`    → ${facilities} placówek w bazie`);
      }
    }
  }

  await prisma.$disconnect();
}

checkCities().catch(console.error);
