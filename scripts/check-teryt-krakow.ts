// Sprawdzenie miejscowości "Kraków" w bazie TERYT
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTerytKrakow() {
  console.log('🔍 MIEJSCOWOŚCI "KRAKÓW" W BAZIE TERYT\n');

  const krakows = await prisma.terytLocation.findMany({
    where: { nazwa: 'Kraków' },
    select: {
      id: true,
      nazwa: true,
      powiat: true,
      wojewodztwo: true,
      rodzaj_miejscowosci: true,
      teryt_sym: true,
      teryt_sympod: true
    },
    orderBy: [
      { wojewodztwo: 'asc' },
      { powiat: 'asc' }
    ]
  });

  console.log(`📊 TOTAL: ${krakows.length} wpisów "Kraków" w TERYT\n`);

  krakows.forEach((loc, i) => {
    console.log(`${i + 1}. "${loc.nazwa}"`);
    console.log(`   Województwo: ${loc.wojewodztwo}`);
    console.log(`   Powiat: ${loc.powiat}`);
    console.log(`   Rodzaj miejscowości: ${loc.rodzaj_miejscowosci} (${getRodzajLabel(loc.rodzaj_miejscowosci)})`);
    console.log(`   TERYT SYM: ${loc.teryt_sym}`);
    console.log(`   TERYT SYMPOD: ${loc.teryt_sympod || 'brak'}`);
    console.log();
  });

  // Sprawdź ile placówek jest w każdym powiecie
  console.log('📊 LICZBA PLACÓWEK W KAŻDYM POWIECIE:\n');

  for (const loc of krakows) {
    const count = await prisma.placowka.count({
      where: { powiat: loc.powiat }
    });

    const krakowCount = await prisma.placowka.count({
      where: {
        miejscowosc: 'Kraków',
        powiat: loc.powiat
      }
    });

    console.log(`  Powiat "${loc.powiat}" (${loc.wojewodztwo}):`);
    console.log(`    - TOTAL placówek w powiecie: ${count}`);
    console.log(`    - Placówek z miejscowością "Kraków": ${krakowCount}`);
    console.log();
  }

  // Sprawdź czy są inne miejscowości zawierające "Kraków"
  console.log('🔍 INNE MIEJSCOWOŚCI ZAWIERAJĄCE "KRAKÓW" W TERYT:\n');

  const otherKrakows = await prisma.terytLocation.findMany({
    where: {
      nazwa: {
        contains: 'Kraków',
        mode: 'insensitive'
      },
      NOT: {
        nazwa: 'Kraków'
      }
    },
    select: {
      nazwa: true,
      powiat: true,
      wojewodztwo: true,
      rodzaj_miejscowosci: true
    },
    orderBy: [
      { nazwa: 'asc' }
    ]
  });

  console.log(`  Znaleziono: ${otherKrakows.length} innych miejscowości\n`);

  otherKrakows.forEach(loc => {
    console.log(`  - "${loc.nazwa}" / pow. ${loc.powiat} / ${loc.wojewodztwo}`);
  });
}

function getRodzajLabel(kod: string | null): string {
  if (!kod) return 'nieznany';
  const labels: Record<string, string> = {
    '01': 'wieś',
    '02': 'kolonia',
    '03': 'przysiółek',
    '04': 'osada',
    '05': 'osada leśna',
    '96': 'miasto',
    '98': 'miasto - delegatura',
    '00': 'część miejscowości'
  };
  return labels[kod] || `kod ${kod}`;
}

checkTerytKrakow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
