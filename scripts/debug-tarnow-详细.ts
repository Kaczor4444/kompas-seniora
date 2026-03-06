import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const mapTerytPowiatToDb = (terytPowiat: string): string => {
  const normalized = normalizePolish(terytPowiat);
  if (normalized === 'm. krakow') return 'krakowski';
  if (normalized === 'm. nowy sacz') return 'nowosądecki';
  if (normalized === 'm. tarnow') return 'tarnowski';
  return terytPowiat;
};

async function debugTarnowDetailed() {
  const query = 'tarnow';
  const normalizedQuery = normalizePolish(query);

  console.log('🔬 SZCZEGÓŁOWY DEBUG: Dlaczego Tarnów nie pojawia się?\n');
  console.log('=' .repeat(70));

  // Znajdź dokładnie Tarnów (miasto na prawach powiatu)
  const tarnowTeryt = await prisma.terytLocation.findFirst({
    where: {
      nazwa: 'Tarnów',
      rodzaj_miejscowosci: '96',
      wojewodztwo: 'małopolskie'
    }
  });

  if (!tarnowTeryt) {
    console.log('❌ Nie ma Tarnowa w TERYT!');
    return;
  }

  console.log('\n1️⃣ TERYT - Tarnów:');
  console.log(`   nazwa: "${tarnowTeryt.nazwa}"`);
  console.log(`   nazwa_normalized: "${tarnowTeryt.nazwa_normalized}"`);
  console.log(`   powiat: "${tarnowTeryt.powiat}"`);
  console.log(`   rodzaj_miejscowosci: "${tarnowTeryt.rodzaj_miejscowosci}"`);

  // Mapowanie
  const normalizedMiejscowosc = normalizePolish(tarnowTeryt.nazwa);
  const dbPowiat = mapTerytPowiatToDb(tarnowTeryt.powiat);
  const normalizedPowiat = normalizePolish(dbPowiat);

  console.log('\n2️⃣ MAPOWANIE:');
  console.log(`   TERYT powiat: "${tarnowTeryt.powiat}"`);
  console.log(`   Zmapowany na: "${dbPowiat}"`);
  console.log(`   Normalized miejscowosc: "${normalizedMiejscowosc}"`);
  console.log(`   Normalized powiat: "${normalizedPowiat}"`);

  // Pobierz WSZYSTKIE placówki
  const allFacilities = await prisma.placowka.findMany({
    select: {
      id: true,
      miejscowosc: true,
      powiat: true,
      typ_placowki: true,
      nazwa: true
    }
  });

  console.log(`\n3️⃣ WSZYSTKIE PLACÓWKI w bazie: ${allFacilities.length}`);

  // Filtruj krok po kroku
  console.log('\n4️⃣ FILTROWANIE (sprawdzam każdą placówkę):');

  let matchCount = 0;

  allFacilities.forEach((f, idx) => {
    const normalizedFacilityMiejscowosc = normalizePolish(f.miejscowosc);
    const miejscowoscMatch = normalizedFacilityMiejscowosc === normalizedMiejscowosc;

    // Pokazuj tylko potencjalne kandydaty (zawierają "tarnow")
    if (normalizedFacilityMiejscowosc.includes('tarnow')) {
      const normalizedFacilityPowiat = normalizePolish(f.powiat);
      const powiatMatch = normalizedFacilityPowiat.includes(normalizedPowiat) ||
                         normalizedPowiat.includes(normalizedFacilityPowiat);

      console.log(`\n   Placówka #${f.id}: ${f.nazwa.substring(0, 50)}...`);
      console.log(`      miejscowosc RAW: "${f.miejscowosc}" (length: ${f.miejscowosc.length})`);
      console.log(`      miejscowosc NORMALIZED: "${normalizedFacilityMiejscowosc}"`);
      console.log(`      powiat RAW: "${f.powiat}"`);
      console.log(`      powiat NORMALIZED: "${normalizedFacilityPowiat}"`);
      console.log(`      ✓ Szukam miejscowości: "${normalizedMiejscowosc}"`);
      console.log(`      ✓ Miejscowość match: ${miejscowoscMatch ? '✅ TAK' : '❌ NIE'}`);
      console.log(`      ✓ Szukam powiatu: "${normalizedPowiat}"`);
      console.log(`      ✓ Powiat match: ${powiatMatch ? '✅ TAK' : '❌ NIE'}`);

      if (miejscowoscMatch && powiatMatch) {
        console.log(`      ✅✅ FINAL: PASUJE!`);
        matchCount++;
      } else {
        console.log(`      ❌ FINAL: NIE PASUJE`);
      }
    }
  });

  console.log(`\n5️⃣ WYNIK:`);
  console.log(`   Placówek pasujących do "Tarnów" (powiat: ${dbPowiat}): ${matchCount}`);

  if (matchCount === 0) {
    console.log('\n❌ PROBLEM ZIDENTYFIKOWANY:');
    console.log('   Tarnów NIE pojawi się w autocomplete, bo ma 0 placówek!');
    console.log('   Autocomplete filtruje wyniki i pokazuje tylko miejscowości z placówkami > 0');
  } else {
    console.log(`\n✅ Tarnów ma ${matchCount} placówkę/placówki, powinien się pojawić!`);
  }

  // Sprawdź trailing spaces
  console.log('\n6️⃣ SPRAWDZENIE TRAILING SPACES:');
  const tarnowFacilities = allFacilities.filter(f =>
    normalizePolish(f.miejscowosc).includes('tarnow')
  );

  tarnowFacilities.forEach(f => {
    const hasTrailing = f.miejscowosc !== f.miejscowosc.trim();
    console.log(`   "${f.miejscowosc}" (ID: ${f.id})`);
    console.log(`      Length: ${f.miejscowosc.length}`);
    console.log(`      Trailing space: ${hasTrailing ? '❌ TAK!' : '✅ NIE'}`);
    console.log(`      Powiat: "${f.powiat}"`);
  });

  await prisma.$disconnect();
}

debugTarnowDetailed().catch(console.error);
