// Test search logic for Kraków (simulating app/search/page.tsx)
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

async function main() {
  console.log('\n=== TEST WYSZUKIWANIA "krakow" ===\n');

  const query = 'krakow';
  const normalizedQuery = normalizePolish(query);
  const powiatParam = ''; // User NIE wybrał z dropdown (kliknął Enter szybko)

  // Symuluj logikę z app/search/page.tsx

  // 1. Znajdź w TERYT
  const terytMatches = await prisma.terytLocation.findMany({
    where: {
      nazwa_normalized: normalizedQuery,
      wojewodztwo: 'małopolskie'
    },
    select: { powiat: true, nazwa: true, rodzaj_miejscowosci: true }
  });

  console.log(`✅ TERYT matches: ${terytMatches.length}`);
  terytMatches.forEach(t => {
    console.log(`   ${t.nazwa} (powiat: ${t.powiat}, RM: ${t.rodzaj_miejscowosci})`);
  });

  // 2. Mapuj powiaty
  const mainTerytMatches = terytMatches.filter((t: any) =>
    ['01', '96', '98'].includes(t.rodzaj_miejscowosci || '')
  );

  const terytPowiaty = [...new Set(mainTerytMatches.map((t: any) => t.powiat))];
  const mappedPowiaty = terytPowiaty.map(powiat => {
    const normalized = normalizePolish(powiat);
    if (normalized === 'm. krakow') return 'krakowski';
    if (normalized === 'm. nowy sacz') return 'nowosądecki';
    if (normalized === 'm. tarnow') return 'tarnowski';
    return powiat;
  });

  const uniquePowiaty = [...new Set(mappedPowiaty.map(p => normalizePolish(p)))];

  console.log(`\n✅ Mapped powiaty: ${uniquePowiaty.join(', ')}`);

  // 3. Pobierz placówki
  const allFacilities = await prisma.placowka.findMany({
    orderBy: { nazwa: 'asc' },
  });

  // 4. Filtruj (NOWA LOGIKA)
  const results = allFacilities.filter(facility => {
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

  console.log(`\n📊 WYNIKI:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   ŚDS: ${results.filter(r => r.typ_placowki === 'ŚDS').length}`);
  console.log(`   DPS: ${results.filter(r => r.typ_placowki === 'DPS').length}`);

  // Expected: 23 ŚDS, 22 DPS (45 total)
  const expectedSDS = 23;
  const actualSDS = results.filter(r => r.typ_placowki === 'ŚDS').length;

  if (actualSDS === expectedSDS) {
    console.log(`\n✅ SUKCES! Pokazuje ${actualSDS} ŚDS (oczekiwano ${expectedSDS})`);
  } else {
    console.log(`\n❌ BŁĄD! Pokazuje ${actualSDS} ŚDS (oczekiwano ${expectedSDS})`);
  }

  console.log('\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
