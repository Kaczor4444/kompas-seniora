// Finalna analiza - symulacja całej ścieżki backend + frontend
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

async function finalDebug() {
  console.log('='.repeat(80));
  console.log('FINALNA ANALIZA: Backend + Frontend');
  console.log('URL: /search?q=Kraków&powiat=m.+Kraków&type=all');
  console.log('='.repeat(80));
  
  const query = 'Kraków';
  const powiatParam = 'm. Kraków';
  const type = 'all'; // !!! Parametr type z URL
  const normalizedQuery = normalizePolish(query);
  
  // BACKEND (app/search/page.tsx)
  console.log('\n📦 BACKEND (app/search/page.tsx):');
  
  const allFacilities = await prisma.placowka.findMany({
    orderBy: { nazwa: 'asc' },
  });
  
  let mappedPowiat = powiatParam;
  const normalized = normalizePolish(powiatParam);
  
  if (normalized === 'm. krakow' || normalized === 'krakow' || normalized === 'krakowski') {
    mappedPowiat = 'krakowski';
  }
  
  const uniquePowiaty = [normalizePolish(mappedPowiat)];
  
  // Filtrowanie (linie 259-286)
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
  
  console.log('  ✅ Po filtrach miasto+powiat:', results.length, 'placówek');
  
  // FILTROWANIE PO TYPIE (linie 401-405) - BACKEND
  let filteredResults = results;
  if (type === 'dps') {
    filteredResults = results.filter(f => f.typ_placowki && f.typ_placowki.toUpperCase().includes('DPS'));
  } else if (type === 'sds') {
    filteredResults = results.filter(f => f.typ_placowki && f.typ_placowki.toUpperCase().includes('SDS'));
  }
  
  console.log('  type parametr:', type);
  console.log('  ✅ Po filtrze typu (BACKEND):', filteredResults.length, 'placówek');
  
  const dpsBe = filteredResults.filter(f => f.typ_placowki === 'DPS').length;
  const sdsBe = filteredResults.filter(f => f.typ_placowki === 'ŚDS').length;
  console.log('    - DPS:', dpsBe);
  console.log('    - ŚDS:', sdsBe);
  
  // FRONTEND (SearchResults.tsx)
  console.log('\n🎨 FRONTEND (SearchResults.tsx):');
  console.log('  Otrzymane wyniki z backendu:', filteredResults.length, 'placówek');
  
  // selectedType initial value (linia 137-139)
  const selectedType = type === 'dps' ? 'DPS' : type === 'sds' ? 'ŚDS' : (type || 'all');
  console.log('  selectedType (initial):', selectedType);
  
  // useEffect filtering (linie 364-370)
  let frontendFiltered = filteredResults;
  if (selectedType !== 'all') {
    frontendFiltered = frontendFiltered.filter(f => {
      return f.typ_placowki === selectedType;
    });
  }
  
  console.log('  ✅ Po filtrze typu (FRONTEND):', frontendFiltered.length, 'placówek');
  
  const dpsFe = frontendFiltered.filter(f => f.typ_placowki === 'DPS').length;
  const sdsFe = frontendFiltered.filter(f => f.typ_placowki === 'ŚDS').length;
  console.log('    - DPS:', dpsFe);
  console.log('    - ŚDS:', sdsFe);
  
  console.log('\n' + '='.repeat(80));
  console.log('WYNIKI KOŃCOWE:');
  console.log('='.repeat(80));
  console.log('  BACKEND zwraca:', filteredResults.length, 'placówek');
  console.log('  FRONTEND pokazuje:', frontendFiltered.length, 'placówek');
  console.log('  DPS:', dpsFe, '/ 10');
  console.log('  ŚDS:', sdsFe, '/ 15');
  
  if (frontendFiltered.length !== 25) {
    console.log('\n❌ PROBLEM ZIDENTYFIKOWANY!');
    console.log('  Oczekiwano: 25 placówek (10 DPS + 15 ŚDS)');
    console.log('  Otrzymano:', frontendFiltered.length);
    console.log('\n  ROOT CAUSE:');
    
    // Sprawdź czy problem jest w backend czy frontend
    if (filteredResults.length !== 25) {
      console.log('  🔴 BACKEND - filtr typu nie działa poprawnie');
      console.log('     Linia 401-405 w app/search/page.tsx');
      console.log('     Problem: .toUpperCase().includes("SDS") nie matchuje "ŚDS"');
      console.log('     Rozwiązanie: Użyj normalizacji polskich znaków przed porównaniem');
    }
    
    if (filteredResults.length === 25 && frontendFiltered.length !== 25) {
      console.log('  🔴 FRONTEND - dodatkowe filtrowanie usuwa placówki');
      console.log('     Linia 364-370 w SearchResults.tsx');
    }
  } else {
    console.log('\n✅ WSZYSTKO DZIAŁA POPRAWNIE!');
  }
}

finalDebug()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
