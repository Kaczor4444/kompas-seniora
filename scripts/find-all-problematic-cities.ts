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

async function findProblematicCities() {
  console.log('🔍 SZUKAM WSZYSTKICH PROBLEMATYCZNYCH MIEJSCOWOŚCI\n');
  console.log('=' .repeat(70));

  // Pobierz wszystkie unikalne miejscowości z placówek
  const placowki = await prisma.placowka.findMany({
    select: {
      miejscowosc: true,
      powiat: true,
      wojewodztwo: true
    },
    where: {
      wojewodztwo: {
        in: ['małopolskie', 'śląskie']
      }
    }
  });

  // Grupuj po miejscowości
  const cityGroups = new Map<string, { count: number; powiaty: Set<string> }>();

  placowki.forEach(p => {
    const key = normalizePolish(p.miejscowosc);
    if (!cityGroups.has(key)) {
      cityGroups.set(key, { count: 0, powiaty: new Set() });
    }
    cityGroups.get(key)!.count++;
    cityGroups.get(key)!.powiaty.add(p.powiat);
  });

  console.log(`📊 Znaleziono ${cityGroups.size} unikalnych miejscowości w placówkach\n`);

  // Sprawdź każdą w TERYT i autocomplete
  const problematic: Array<{
    city: string;
    facilityCount: number;
    inTeryt: boolean;
    inAutocomplete: boolean;
    reason: string;
  }> = [];

  for (const [cityNormalized, data] of cityGroups.entries()) {
    // Znajdź oryginalną nazwę
    const originalCity = placowki.find(p => normalizePolish(p.miejscowosc) === cityNormalized)?.miejscowosc || cityNormalized;

    // Sprawdź TERYT
    const terytMatch = await prisma.terytLocation.findFirst({
      where: {
        nazwa_normalized: cityNormalized
      }
    });

    if (!terytMatch) {
      problematic.push({
        city: originalCity,
        facilityCount: data.count,
        inTeryt: false,
        inAutocomplete: false,
        reason: 'Brak w TERYT (województwo poza Małopolskim/Śląskim lub błąd)'
      });
      continue;
    }

    // Test autocomplete (uproszczony)
    const mapTerytPowiatToDb = (terytPowiat: string): string => {
      const normalized = normalizePolish(terytPowiat);
      if (normalized === 'm. krakow' || normalized === 'miasto krakow') return 'krakowski';
      if (normalized === 'm. nowy sacz' || normalized === 'miasto nowy sacz') return 'nowosądecki';
      if (normalized === 'm. tarnow' || normalized === 'miasto tarnow') return 'tarnowski';
      return terytPowiat;
    };

    const dbPowiat = mapTerytPowiatToDb(terytMatch.powiat);
    const normalizedPowiat = normalizePolish(dbPowiat);

    // Sprawdź czy którakolwiek placówka pasuje
    const matchingFacility = placowki.find(f => {
      if (normalizePolish(f.miejscowosc) !== cityNormalized) return false;

      const normFacPow = normalizePolish(f.powiat);
      return normFacPow.includes(normalizedPowiat) || normalizedPowiat.includes(normFacPow);
    });

    if (!matchingFacility) {
      problematic.push({
        city: originalCity,
        facilityCount: data.count,
        inTeryt: true,
        inAutocomplete: false,
        reason: `Nie pasuje powiat: TERYT="${terytMatch.powiat}" → mapowane="${dbPowiat}", ale placówki mają: ${Array.from(data.powiaty).join(', ')}`
      });
    }
  }

  console.log(`\n❌ PROBLEMATYCZNE MIEJSCOWOŚCI: ${problematic.length}\n`);

  if (problematic.length === 0) {
    console.log('✅ Wszystkie miejscowości działają poprawnie!');
  } else {
    problematic.forEach((p, i) => {
      console.log(`${i + 1}. "${p.city}" (${p.facilityCount} placówek)`);
      console.log(`   W TERYT: ${p.inTeryt ? '✅' : '❌'}`);
      console.log(`   W autocomplete: ${p.inAutocomplete ? '✅' : '❌'}`);
      console.log(`   Powód: ${p.reason}`);
      console.log('');
    });
  }

  // Sprawdź trailing spaces
  console.log('\n🔍 SPRAWDZANIE TRAILING SPACES:\n');
  const withTrailing = placowki.filter(p => p.miejscowosc !== p.miejscowosc.trim());

  if (withTrailing.length === 0) {
    console.log('✅ Brak trailing spaces w miejscowościach!');
  } else {
    console.log(`❌ Znaleziono ${withTrailing.length} placówek z trailing spaces:\n`);
    withTrailing.forEach((p, i) => {
      console.log(`${i + 1}. "${p.miejscowosc}" (length: ${p.miejscowosc.length})`);
      console.log(`   Powiat: ${p.powiat}`);
    });
  }

  await prisma.$disconnect();
}

findProblematicCities().catch(console.error);
