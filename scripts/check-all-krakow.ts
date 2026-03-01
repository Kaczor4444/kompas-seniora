// Sprawdzenie wszystkich placówek z miejscowością "Kraków"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllKrakow() {
  console.log('🔍 WSZYSTKIE PLACÓWKI Z MIEJSCOWOŚCIĄ "KRAKÓW"\n');

  const krakows = await prisma.placowka.findMany({
    where: { miejscowosc: 'Kraków' },
    select: {
      id: true,
      nazwa: true,
      ulica: true,
      miejscowosc: true,
      kod_pocztowy: true,
      powiat: true,
      wojewodztwo: true,
      typ_placowki: true,
      email: true,
      telefon: true
    },
    orderBy: [
      { powiat: 'asc' },
      { id: 'asc' }
    ]
  });

  console.log(`📊 TOTAL: ${krakows.length} placówek z miejscowością "Kraków"\n`);

  // Grupuj po powiecie
  const byPowiat = krakows.reduce((acc, f) => {
    if (!acc[f.powiat]) {
      acc[f.powiat] = [];
    }
    acc[f.powiat].push(f);
    return acc;
  }, {} as Record<string, typeof krakows>);

  Object.entries(byPowiat).forEach(([powiat, facilities]) => {
    console.log(`\n📍 POWIAT: "${powiat}" (${facilities.length} placówek)`);
    console.log('='.repeat(80));

    facilities.forEach(f => {
      console.log(`\n  [ID: ${f.id}] ${f.nazwa}`);
      console.log(`  Typ: ${f.typ_placowki}`);
      console.log(`  Adres: ${f.ulica || 'brak ulicy'}, ${f.miejscowosc}`);
      console.log(`  Kod pocztowy: ${f.kod_pocztowy || 'brak'}`);
      console.log(`  Email: ${f.email || 'brak'}`);
      console.log(`  Telefon: ${f.telefon || 'brak'}`);

      // Analiza czy kod pocztowy pasuje
      if (f.kod_pocztowy) {
        const kod = f.kod_pocztowy;
        let expectedPowiat = '';

        if (kod.startsWith('30-') || kod.startsWith('31-')) {
          expectedPowiat = 'krakowski (Kraków)';
        } else if (kod.startsWith('33-')) {
          expectedPowiat = 'tarnowski lub inny';
        } else if (kod.startsWith('34-')) {
          expectedPowiat = 'limanowski, nowosądecki lub inny';
        }

        if (expectedPowiat) {
          console.log(`  ℹ️  Kod ${kod} sugeruje powiat: ${expectedPowiat}`);
        }
      }
    });
  });

  console.log('\n\n📊 PODSUMOWANIE:');
  console.log('='.repeat(80));
  Object.entries(byPowiat).forEach(([powiat, facilities]) => {
    const dps = facilities.filter(f => f.typ_placowki === 'DPS').length;
    const sds = facilities.filter(f => f.typ_placowki === 'ŚDS').length;
    console.log(`  ${powiat}: ${facilities.length} (${dps} DPS, ${sds} ŚDS)`);
  });

  console.log('\n\n💡 OCZEKIWANE LICZBY (po naprawach):');
  console.log('  - Wszystkie "Kraków" powinny być w powiecie "krakowski"');
  console.log('  - Oczekiwana liczba: 25 placówek (10 DPS + 15 ŚDS)');
  console.log('  - Kody pocztowe: 30-xxx, 31-xxx\n');
}

checkAllKrakow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
