// Check if Mogilno, Szaflary, Raba Wyżna are in TERYT database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCities() {
  const cities = ['mogilno', 'szaflary', 'raba'];

  console.log('🔍 Checking TERYT database for cities...\n');

  for (const city of cities) {
    const results = await prisma.terytLocation.findMany({
      where: {
        nazwa_normalized: {
          contains: city
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
      }
    });

    console.log(`\n📍 "${city}" - found ${results.length} results:`);
    results.forEach(r => {
      console.log(`  - ${r.nazwa} (pow. ${r.powiat}, woj. ${r.wojewodztwo}) RM=${r.rodzaj_miejscowosci}`);
    });

    // Check if any placówki exist
    if (results.length > 0) {
      for (const loc of results) {
        const facilities = await prisma.placowka.count({
          where: {
            miejscowosc: {
              contains: loc.nazwa,
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
