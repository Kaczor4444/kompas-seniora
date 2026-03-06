// Sprawdź różne scenariusze URL
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

async function testScenario(query: string, powiatParam: string, type: string) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST: /search?q=' + query + '&powiat=' + encodeURIComponent(powiatParam) + '&type=' + type);
  console.log('='.repeat(80));
  
  const normalizedQuery = normalizePolish(query);
  
  const allFacilities = await prisma.placowka.findMany({
    orderBy: { nazwa: 'asc' },
  });
  
  let mappedPowiat = powiatParam;
  const normalized = normalizePolish(powiatParam);
  
  if (normalized === 'm. krakow' || normalized === 'krakow' || normalized === 'krakowski') {
    mappedPowiat = 'krakowski';
  }
  
  const uniquePowiaty = [normalizePolish(mappedPowiat)];
  
  const results = allFacilities.filter(facility => {
    let facilityPowiat = facility.powiat;
    const normFacilityPowiat = normalizePolish(facilityPowiat);
    
    if (normFacilityPowiat === 'krakow') {
      facilityPowiat = 'krakowski';
    }
    
    const normalizedFacilityPowiat = normalizePolish(facilityPowiat);
    const powiatMatches = uniquePowiaty.some(powiat => {
      return normalizedFacilityPowiat.includes(powiat) || powiat.includes(normalizedFacilityPowiat);
    });
    
    if (!powiatMatches) return false;
    
    const normalizedFacilityCity = normalizePolish(facility.miejscowosc || '');
    return normalizedFacilityCity.includes(normalizedQuery) || normalizedQuery.includes(normalizedFacilityCity);
  });
  
  console.log('Po filtrach miasto+powiat:', results.length);
  
  // FILTROWANIE PO TYPIE (kod z page.tsx linie 401-405)
  let filteredResults = results;
  if (type === 'dps') {
    filteredResults = results.filter(f => f.typ_placowki && f.typ_placowki.toUpperCase().includes('DPS'));
  } else if (type === 'sds') {
    filteredResults = results.filter(f => f.typ_placowki && f.typ_placowki.toUpperCase().includes('SDS'));
  }
  
  const dpsCo = filteredResults.filter(f => f.typ_placowki === 'DPS').length;
  const sdsCo = filteredResults.filter(f => f.typ_placowki === 'ŚDS').length;
  
  console.log('Po filtrze typu:', filteredResults.length, 'placówek');
  console.log('  - DPS:', dpsCo);
  console.log('  - ŚDS:', sdsCo);
  
  // Pokaż które ŚDS zostały odfiltrowane
  if (type === 'sds' && sdsCo === 0) {
    console.log('\n❌ PROBLEM: Filtr "sds" odfiltrował WSZYSTKIE ŚDS!');
    console.log('\nSprawdzenie logiki filtra:');
    console.log('  Code: f.typ_placowki.toUpperCase().includes("SDS")');
    
    const testFacilities = results.filter(f => f.typ_placowki === 'ŚDS').slice(0, 3);
    testFacilities.forEach(f => {
      console.log('\n  Placówka:', f.nazwa);
      console.log('    typ_placowki:', JSON.stringify(f.typ_placowki));
      console.log('    .toUpperCase():', f.typ_placowki?.toUpperCase());
      console.log('    .toUpperCase().includes("SDS"):', f.typ_placowki?.toUpperCase().includes('SDS'));
      console.log('    .includes("ŚDS"):', f.typ_placowki?.includes('ŚDS'));
    });
  }
}

async function runTests() {
  await testScenario('Kraków', 'm. Kraków', 'all');
  await testScenario('Kraków', 'm. Kraków', 'dps');
  await testScenario('Kraków', 'm. Kraków', 'sds');
}

runTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
