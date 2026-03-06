import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Symuluj dokładnie logikę z app/search/page.tsx
async function simulateSearch(query: string, type: string) {
  console.log(`\n=== SYMULACJA: ?q=${query}&type=${type} ===\n`);

  const normalizePolish = (str: string): string => {
    return str
      .trim()
      .toLowerCase()
      .replace(/ł/g, 'l')
      .replace(/Ł/g, 'l')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const normalizedQuery = normalizePolish(query.trim());
  let powiatParam = ''; // User NIE wybrał z dropdown

  // Znajdź w TERYT
  const terytMatches = await prisma.terytLocation.findMany({
    where: {
      nazwa_normalized: normalizedQuery,
      wojewodztwo: 'małopolskie'
    },
    select: { powiat: true, rodzaj_miejscowosci: true }
  });

  console.log(`✅ TERYT matches: ${terytMatches.length}`);

  // Filtruj główne miejscowości
  const mainTerytMatches = terytMatches.filter((t: any) =>
    ['01', '96', '98'].includes(t.rodzaj_miejscowosci || '')
  );

  // Mapuj powiaty
  const terytPowiaty = [...new Set(mainTerytMatches.map((t: any) => t.powiat))];
  const mappedPowiaty = terytPowiaty.map(powiat => {
    const normalized = normalizePolish(powiat);
    if (normalized === 'm. krakow') return 'krakowski';
    if (normalized === 'm. nowy sacz') return 'nowosądecki';
    if (normalized === 'm. tarnow') return 'tarnowski';
    return powiat;
  });

  const uniquePowiaty = [...new Set(mappedPowiaty.map(p => normalizePolish(p)))];

  console.log(`✅ Mapped powiaty: ${uniquePowiaty.join(', ')}`);

  // Pobierz wszystkie placówki
  const allFacilities = await prisma.placowka.findMany({
    orderBy: { nazwa: 'asc' },
  });

  // Filtruj (NOWA LOGIKA z app/search/page.tsx)
  let results = allFacilities.filter(facility => {
    // Mapuj powiat facility
    let facilityPowiat = facility.powiat;
    const normFacilityPowiat = normalizePolish(facilityPowiat);

    if (normFacilityPowiat === 'krakow') {
      facilityPowiat = 'krakowski';
    } else if (normFacilityPowiat === 'nowy sacz') {
      facilityPowiat = 'nowosądecki';
    } else if (normFacilityPowiat === 'tarnow') {
      facilityPowiat = 'tarnowski';
    }

    const normalizedFacilityPowiat = normalizePolish(facilityPowiat);
    const powiatMatches = uniquePowiaty.some(powiat => {
      return normalizedFacilityPowiat.includes(powiat) || powiat.includes(normalizedFacilityPowiat);
    });

    if (!powiatMatches) return false;

    // ✅ NOWA LOGIKA
    const isCityCounty = ['krakow', 'nowy sacz', 'tarnow'].includes(normalizedQuery);

    if (isCityCounty && !powiatParam) {
      return true; // Pokaż cały powiat
    }

    const normalizedFacilityCity = normalizePolish(facility.miejscowosc || '');
    return normalizedFacilityCity.includes(normalizedQuery) || normalizedQuery.includes(normalizedFacilityCity);
  });

  console.log(`\n📊 WYNIKI PO FILTROWANIU (SERWER):`);
  console.log(`   Total: ${results.length}`);
  console.log(`   ŚDS: ${results.filter(r => r.typ_placowki === 'ŚDS').length}`);
  console.log(`   DPS: ${results.filter(r => r.typ_placowki === 'DPS').length}`);

  // Filtruj po typie (to robi serwer w app/search/page.tsx)
  if (type === 'dps') {
    results = results.filter(f => f.typ_placowki === 'DPS');
  } else if (type === 'sds') {
    results = results.filter(f => f.typ_placowki === 'ŚDS');
  }

  console.log(`\n📊 WYNIKI PO TYPIE (typ=${type}):`);
  console.log(`   Total: ${results.length}`);
  console.log(`   ŚDS: ${results.filter(r => r.typ_placowki === 'ŚDS').length}`);
  console.log(`   DPS: ${results.filter(r => r.typ_placowki === 'DPS').length}`);

  // Pokaż miasta
  const byCity = results.reduce((acc, r) => {
    const city = r.miejscowosc || 'BRAK';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`\n📍 Rozkład po miejscowościach:`);
  Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => {
      console.log(`   ${city}: ${count}`);
    });

  console.log('\n');
}

async function main() {
  await simulateSearch('krakow', 'sds');
  await simulateSearch('krakow', 'dps');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
