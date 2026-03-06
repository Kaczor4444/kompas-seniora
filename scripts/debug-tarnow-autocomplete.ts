import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Funkcja normalizacji (skopiowana z API)
function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Funkcja mapowania (skopiowana z API)
const mapTerytPowiatToDb = (terytPowiat: string): string => {
  const normalized = normalizePolish(terytPowiat);
  if (normalized === 'm. krakow') return 'krakowski';
  if (normalized === 'm. nowy sacz') return 'nowosądecki';
  if (normalized === 'm. tarnow') return 'tarnowski';
  return terytPowiat;
};

async function debugTarnowAutocomplete() {
  console.log('🔍 DEBUGOWANIE AUTOCOMPLETE DLA "TARNÓW"\n');
  console.log('=' .repeat(60));

  // 1. Znajdź Tarnów w TERYT
  const terytLoc = await prisma.terytLocation.findFirst({
    where: {
      nazwa: 'Tarnów',
      rodzaj_miejscowosci: '96', // Miasto na prawach powiatu
      wojewodztwo: 'małopolskie'
    }
  });

  if (!terytLoc) {
    console.log('❌ Nie znaleziono Tarnowa w TERYT!');
    return;
  }

  console.log('\n✅ TERYT - Znaleziono:');
  console.log(`   Nazwa: ${terytLoc.nazwa}`);
  console.log(`   Powiat: "${terytLoc.powiat}"`);
  console.log(`   Wojewodztwo: ${terytLoc.wojewodztwo}`);
  console.log(`   RM: ${terytLoc.rodzaj_miejscowosci}`);

  // 2. Sprawdź mapowanie
  const dbPowiat = mapTerytPowiatToDb(terytLoc.powiat);
  const normalizedPowiat = normalizePolish(dbPowiat);

  console.log('\n🗺️  MAPOWANIE:');
  console.log(`   TERYT powiat: "${terytLoc.powiat}"`);
  console.log(`   Po mapowaniu: "${dbPowiat}"`);
  console.log(`   Po normalizacji: "${normalizedPowiat}"`);

  // 3. Pobierz wszystkie placówki z "Tarnów" w nazwie miejscowości
  const allFacilities = await prisma.placowka.findMany({
    where: {
      miejscowosc: {
        contains: 'Tarnów',
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

  console.log('\n🏥 PLACÓWKI w bazie (contains "Tarnów"):');
  console.log(`   Znaleziono: ${allFacilities.length}`);

  allFacilities.forEach((f, i) => {
    console.log(`\n   ${i + 1}. ${f.nazwa}`);
    console.log(`      Miejscowość: "${f.miejscowosc}"`);
    console.log(`      Powiat: "${f.powiat}"`);
    console.log(`      Typ: ${f.typ_placowki}`);
  });

  // 4. Symuluj filtrowanie (jak w API)
  const normalizedMiejscowosc = normalizePolish(terytLoc.nazwa);
  console.log('\n🔧 FILTROWANIE (logika z API):');
  console.log(`   Szukam miejscowości: "${normalizedMiejscowosc}"`);
  console.log(`   Szukam powiatu: "${normalizedPowiat}"`);

  const matchingFacilities = allFacilities.filter(f => {
    // 1. Musi być ta sama miejscowość
    const normalizedFacilityMiejscowosc = normalizePolish(f.miejscowosc.trim());
    const miejscowoscMatch = normalizedFacilityMiejscowosc === normalizedMiejscowosc;

    // 2. Musi być ten sam powiat
    const normalizedFacilityPowiat = normalizePolish(f.powiat.trim());
    const powiatMatch = normalizedFacilityPowiat.includes(normalizedPowiat) ||
                       normalizedPowiat.includes(normalizedFacilityPowiat);

    console.log(`\n   Sprawdzam: "${f.miejscowosc}" (${f.powiat})`);
    console.log(`      Miejscowość normalized: "${normalizedFacilityMiejscowosc}"`);
    console.log(`      Miejscowość match: ${miejscowoscMatch ? '✅' : '❌'}`);
    console.log(`      Powiat normalized: "${normalizedFacilityPowiat}"`);
    console.log(`      Powiat match: ${powiatMatch ? '✅' : '❌'}`);
    console.log(`      FINAL: ${miejscowoscMatch && powiatMatch ? '✅ PASUJE' : '❌ NIE PASUJE'}`);

    return miejscowoscMatch && powiatMatch;
  });

  console.log('\n📊 WYNIK:');
  console.log(`   Pasujących placówek: ${matchingFacilities.length}`);

  if (matchingFacilities.length === 0) {
    console.log('\n❌ PROBLEM: Zero placówek! Dlatego Tarnów nie pojawia się w autocomplete!');
  } else {
    console.log('\n✅ Placówki pasują:');
    matchingFacilities.forEach(f => {
      console.log(`   - ${f.nazwa}`);
    });
  }

  await prisma.$disconnect();
}

debugTarnowAutocomplete().catch(console.error);
