// Sprawdzenie placówki ID 58 - "Kraków" w powiecie "limanowski"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFacility() {
  console.log('🔍 SZCZEGÓŁY PLACÓWKI ID 58\n');

  const facility = await prisma.placowka.findUnique({
    where: { id: 58 }
  });

  if (!facility) {
    console.log('❌ Nie znaleziono placówki o ID 58');
    return;
  }

  console.log('📋 DANE PLACÓWKI:');
  console.log(`   ID: ${facility.id}`);
  console.log(`   Nazwa: ${facility.nazwa}`);
  console.log(`   Typ: ${facility.typ_placowki}`);
  console.log();
  console.log('📍 ADRES:');
  console.log(`   Ulica: ${facility.ulica || 'brak'}`);
  console.log(`   Miejscowość: "${facility.miejscowosc}"`);
  console.log(`   Kod pocztowy: ${facility.kod_pocztowy || 'brak'}`);
  console.log(`   Powiat: "${facility.powiat}"`);
  console.log(`   Województwo: ${facility.wojewodztwo}`);
  console.log();
  console.log('📞 KONTAKT:');
  console.log(`   Telefon: ${facility.telefon || 'brak'}`);
  console.log(`   Email: ${facility.email || 'brak'}`);
  console.log(`   Strona: ${facility.strona || 'brak'}`);
  console.log();

  // Sprawdź czy adres "Wincentego Witosa 24/26" w Krakowie pasuje
  console.log('🔍 ANALIZA:');

  if (facility.miejscowosc === 'Kraków' && facility.powiat === 'limanowski') {
    console.log('⚠️  POTENCJALNY BŁĄD:');
    console.log('   Miejscowość to "Kraków", ale powiat to "limanowski"');
    console.log('   Kraków znajduje się w powiecie krakowskim (lub m. Kraków)');
    console.log();
    console.log('💡 SUGEROWANE ROZWIĄZANIE:');
    console.log('   Zmień powiat "limanowski" → "krakowski"');
    console.log();

    // Sprawdź czy istnieje wieś "Kraków" w powiecie limanowskim
    const otherKrakow = await prisma.placowka.findMany({
      where: {
        miejscowosc: 'Kraków',
        powiat: 'limanowski',
        id: { not: 58 }
      }
    });

    if (otherKrakow.length > 0) {
      console.log(`ℹ️  Znaleziono ${otherKrakow.length} innych placówek "Kraków" w pow. limanowski:`);
      otherKrakow.forEach(f => {
        console.log(`   - [${f.id}] ${f.nazwa}, ${f.ulica || 'brak ulicy'}`);
      });
    } else {
      console.log('ℹ️  Brak innych placówek "Kraków" w pow. limanowski');
    }
  } else {
    console.log('✅ Dane wyglądają poprawnie');
  }

  console.log();

  // Statystyki dla kontekstu
  console.log('📊 KONTEKST:');
  const krakowskiCount = await prisma.placowka.count({
    where: {
      miejscowosc: 'Kraków',
      powiat: 'krakowski'
    }
  });

  const limanowskiCount = await prisma.placowka.count({
    where: { powiat: 'limanowski' }
  });

  console.log(`   Placówki "Kraków" w pow. krakowski: ${krakowskiCount}`);
  console.log(`   Wszystkie placówki w pow. limanowski: ${limanowskiCount}`);
}

checkFacility()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
