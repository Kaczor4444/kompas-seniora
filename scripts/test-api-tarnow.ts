import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Skopiuj funkcje z API
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

async function testApiTarnow() {
  const query = 'tarnow';
  const normalizedQuery = normalizePolish(query);

  console.log('🔍 SYMULACJA API: /api/teryt/suggest?q=tarnow\n');
  console.log('Query:', query);
  console.log('Normalized:', normalizedQuery);
  console.log('');

  // 1. Znajdź pasujące lokalizacje TERYT
  const terytMatches = await prisma.terytLocation.findMany({
    where: {
      nazwa_normalized: {
        contains: normalizedQuery
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
      rodzaj_miejscowosci: true,
      teryt_sym: true,
      teryt_sympod: true
    }
  });

  console.log(`📍 TERYT matches: ${terytMatches.length}\n`);

  // 2. Dla każdej lokalizacji sprawdź placówki
  const suggestionsWithCount = await Promise.all(
    terytMatches.map(async (loc) => {
      const normalizedMiejscowosc = normalizePolish(loc.nazwa);
      const dbPowiat = mapTerytPowiatToDb(loc.powiat);
      const normalizedPowiat = normalizePolish(dbPowiat);

      // Pobierz wszystkie placówki
      const allFacilities = await prisma.placowka.findMany({
        select: { miejscowosc: true, powiat: true, typ_placowki: true }
      });

      // Filtruj
      const matchingFacilities = allFacilities.filter(f => {
        const normalizedFacilityMiejscowosc = normalizePolish(f.miejscowosc);
        if (normalizedFacilityMiejscowosc !== normalizedMiejscowosc) {
          return false;
        }

        const normalizedFacilityPowiat = normalizePolish(f.powiat);
        const powiatMatch = normalizedFacilityPowiat.includes(normalizedPowiat) ||
                           normalizedPowiat.includes(normalizedFacilityPowiat);

        if (!powiatMatch) {
          return false;
        }

        return true;
      });

      return {
        nazwa: loc.nazwa,
        powiat: loc.powiat,
        wojewodztwo: loc.wojewodztwo,
        facilitiesCount: matchingFacilities.length,
        rodzaj_miejscowosci: loc.rodzaj_miejscowosci
      };
    })
  );

  // 3. Filtruj tylko te z placówkami
  let withFacilities = suggestionsWithCount
    .filter(s => s.facilitiesCount > 0)
    .sort((a, b) => {
      // Exact match first
      const aExact = normalizePolish(a.nazwa).toLowerCase() === normalizedQuery;
      const bExact = normalizePolish(b.nazwa).toLowerCase() === normalizedQuery;

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Main locations before parts
      const aIsMain = ['01', '96', '98'].includes(a.rodzaj_miejscowosci || '');
      const bIsMain = ['01', '96', '98'].includes(b.rodzaj_miejscowosci || '');

      if (aIsMain && !bIsMain) return -1;
      if (!aIsMain && bIsMain) return 1;

      // Sort by facility count
      return b.facilitiesCount - a.facilitiesCount;
    });

  console.log(`✅ Suggestions with facilities: ${withFacilities.length}\n`);

  if (withFacilities.length === 0) {
    console.log('❌ BRAK WYNIKÓW! Dlatego autocomplete nic nie pokazuje!\n');
  } else {
    console.log('📋 Wyniki autocomplete (top 10):\n');
    withFacilities.slice(0, 10).forEach((s, i) => {
      const isExact = normalizePolish(s.nazwa).toLowerCase() === normalizedQuery;
      const isMain = ['01', '96', '98'].includes(s.rodzaj_miejscowosci || '');
      const rmLabel = isMain ? '⭐' : '🟡';
      console.log(`${i + 1}. "${s.nazwa}" (${s.facilitiesCount} placówek) - ${s.powiat} ${rmLabel}${isExact ? ' EXACT' : ''} RM=${s.rodzaj_miejscowosci}`);
    });
  }

  await prisma.$disconnect();
}

testApiTarnow().catch(console.error);
