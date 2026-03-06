// Debug - symulacja wyszukiwania "Kraków" jak w app/search/page.tsx
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

async function debugSearch() {
  console.log('='.repeat(80));
  console.log('DEBUG: Symulacja wyszukiwania "Kraków" z URL: ?q=Kraków&powiat=m.+Kraków');
  console.log('='.repeat(80));
  
  const query = 'Kraków';
  const powiatParam = 'm. Kraków';
  const normalizedQuery = normalizePolish(query);
  
  console.log('\nPARAMETRY WEJŚCIOWE:');
  console.log('  Query:', query);
  console.log('  powiatParam:', powiatParam);
  console.log('  normalizedQuery:', normalizedQuery);

  const allFacilities = await prisma.placowka.findMany({
    orderBy: { nazwa: 'asc' },
  });
  
  console.log('\n✅ KROK 1: Pobrano', allFacilities.length, 'placówek z bazy');

  let mappedPowiat = powiatParam;
  const normalized = normalizePolish(powiatParam);
  
  console.log('\n✅ KROK 2: Mapowanie powiatu (linie 216-230):');
  console.log('  Wejście:', powiatParam);
  console.log('  Normalized:', normalized);
  
  if (normalized === 'm. krakow' || normalized === 'krakow' || normalized === 'krakowski') {
    mappedPowiat = 'krakowski';
  }
  
  console.log('  Zmapowany:', mappedPowiat);

  const uniquePowiaty = [normalizePolish(mappedPowiat)];
  console.log('  uniquePowiaty:', uniquePowiaty);

  console.log('\n✅ KROK 3: Filtrowanie placówek (linie 259-286)...\n');
  
  const results = allFacilities.filter(facility => {
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
    
    if (facility.miejscowosc === 'Kraków' && facility.typ_placowki === 'DPS') {
      const normalizedFacilityCity = normalizePolish(facility.miejscowosc || '');
      const cityMatches = normalizedFacilityCity.includes(normalizedQuery) || normalizedQuery.includes(normalizedFacilityCity);
      
      const passed = powiatMatches && cityMatches;
      
      if (!passed) {
        console.log('❌ ODRZUCONY DPS:', facility.id, '-', facility.nazwa);
        console.log('   Powiat w bazie:', facility.powiat, '→ zmapowany:', facilityPowiat, '→ normalized:', normalizedFacilityPowiat);
        console.log('   Miejscowość:', facility.miejscowosc, '→ normalized:', normalizedFacilityCity);
        console.log('   powiatMatches:', powiatMatches);
        console.log('   cityMatches:', cityMatches);
        console.log('');
      }
    }
    
    if (!powiatMatches) return false;
    
    const normalizedFacilityCity = normalizePolish(facility.miejscowosc || '');
    return normalizedFacilityCity.includes(normalizedQuery) || normalizedQuery.includes(normalizedFacilityCity);
  });
  
  console.log('\n✅ KROK 4: Po filtrach:', results.length, 'placówek\n');

  const dpsResults = results.filter(f => f.typ_placowki && f.typ_placowki.toUpperCase().includes('DPS'));
  const sdsResults = results.filter(f => f.typ_placowki && f.typ_placowki.toUpperCase().includes('SDS'));
  
  console.log('='.repeat(80));
  console.log('WYNIKI KOŃCOWE:');
  console.log('='.repeat(80));
  console.log('  Total:', results.length, 'placówek');
  console.log('  DPS:', dpsResults.length);
  console.log('  ŚDS:', sdsResults.length);
  
  console.log('\nDPS znalezione:', dpsResults.length);
  dpsResults.forEach(f => {
    console.log('  ✓ [ID:', f.id, ']', f.nazwa);
  });
  
  const allKrakowDPS = await prisma.placowka.findMany({
    where: {
      miejscowosc: 'Kraków',
      typ_placowki: 'DPS'
    },
    orderBy: { id: 'asc' }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('BRAKUJĄCE DPS:', allKrakowDPS.length - dpsResults.length);
  console.log('='.repeat(80));
  allKrakowDPS.forEach(f => {
    const isIncluded = dpsResults.some(r => r.id === f.id);
    if (!isIncluded) {
      console.log('  ❌ [ID:', f.id, ']', f.nazwa);
      console.log('      Adres:', f.ulica, ',', f.miejscowosc);
      console.log('      Powiat:', f.powiat);
      console.log('');
    }
  });
}

debugSearch()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
