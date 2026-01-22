import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SearchResults from '@/components/SearchResults';
import MobileFilterDrawer from '@/src/components/filters/MobileFilterDrawer';
import MobileStickyBar from '@/src/components/mobile/MobileStickyBar';
import { calculateDistance } from '@/src/utils/distance';

interface SearchPageProps {
  searchParams: Promise<{ 
    q?: string; 
    type?: string;
    woj?: string;
    powiat?: string;
    partial?: string;
    min?: string;
    max?: string;
    free?: string;
    care?: string;
    sort?: string;
    lat?: string;
    lng?: string;
    near?: string;
  }>;
}

// Normalizacja polskich znaków
function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const type = params.type || 'all';
  
  // ✅ FIX BUG #1: Apply wojewodztwo mapping IMMEDIATELY (before any logic)
  const wojewodztwoRaw = params.woj || 'all';
  const wojewodztwoMap: Record<string, string> = {
    'malopolskie': 'małopolskie',
    'slaskie': 'śląskie',
    'mazowieckie': 'mazowieckie',
    'dolnoslaskie': 'dolnośląskie',
    'wielkopolskie': 'wielkopolskie',
  };
  // Apply mapping for non-'all' values
  const wojewodztwo = wojewodztwoRaw !== 'all' ? (wojewodztwoMap[wojewodztwoRaw] || wojewodztwoRaw) : 'all';
  
  const powiatParam = params.powiat || '';
  const isPartialSearch = params.partial === 'true';

  const userLat = params.lat ? parseFloat(params.lat) : null;
  const userLng = params.lng ? parseFloat(params.lng) : null;
  const isNearSearch = params.near === 'true';

  console.log('🔍 DEBUG Search Page START:');
  console.log('  query:', query);
  console.log('  type:', type);
  console.log('  wojewodztwoRaw:', wojewodztwoRaw, '→ wojewodztwo:', wojewodztwo);
  console.log('  powiatParam:', powiatParam);
  console.log('  isPartialSearch:', isPartialSearch);
  console.log('  🗺️ Geolocation:', { userLat, userLng, isNearSearch });

  let results: any[] = [];
  let terytMatches: any[] = [];
  let message = '';

  // TRYB 3: GEOLOCATION SEARCH
  if (isNearSearch && userLat && userLng && !query) {
    console.log('🗺️ Mode: GEOLOCATION SEARCH');

    // ✅ Don't filter by type on server - let client handle it
    results = await prisma.placowka.findMany({
      orderBy: { nazwa: 'asc' },
    });

    console.log('🗺️ All facilities for geolocation:', results.length);
    message = '';
  }
  // TRYB 4: WOJEWÓDZTWO ONLY (RegionModal)
  else if (!query && wojewodztwo !== 'all') {
    console.log('🗺️ Mode: WOJEWÓDZTWO ONLY (from RegionModal)');

    // ✅ Don't filter by type on server - let client handle it
    const wojewodztwoDbName = wojewodztwo;

    const allFacilities = await prisma.placowka.findMany({
      orderBy: { nazwa: 'asc' },
    });

    results = allFacilities.filter(facility => {
      const normalizedFacilityWoj = normalizePolish(facility.wojewodztwo);
      const normalizedTargetWoj = normalizePolish(wojewodztwoDbName);
      return normalizedFacilityWoj === normalizedTargetWoj;
    });

    console.log(`🗺️ Facilities in ${wojewodztwoDbName}:`, results.length);
    message = '';
  }
  // TRYB 1: Z QUERY
  else if (query) {
    const normalizedQuery = normalizePolish(query.trim());
    console.log('  normalizedQuery:', normalizedQuery);

    // wojewodztwo już jest zmapowane na początku funkcji
    const wojewodztwoDbName = wojewodztwo;
    const wojewodztwoName = wojewodztwo === 'śląskie' ? 'Śląskie' : 
                           wojewodztwo === 'małopolskie' ? 'Małopolskie' : 
                           wojewodztwo;

    // ✅ FIX: Sprawdź czy województwo MA dane TERYT (nie tylko Małopolskie!)
    const wojewodztwaWithTeryt = ['małopolskie', 'śląskie']; // Dodaj więcej jak dodajesz dane
    const hasTerytData = wojewodztwo === 'all' || wojewodztwaWithTeryt.includes(wojewodztwoDbName.toLowerCase());
    
    console.log('  hasTerytData:', hasTerytData, '(wojewodztwo:', wojewodztwo, ')');

    // ✅ FIX: TERYT search działa ZAWSZE gdy mamy dane (nawet dla 'all')
    if (hasTerytData) {
      console.log('  Mode: TERYT (improved - works for all województwa)');

      const terytWhere: any = isPartialSearch 
        ? { nazwa_normalized: { contains: normalizedQuery } }
        : { nazwa_normalized: normalizedQuery };

      // Filtruj po województwie TYLKO jeśli user wybrał konkretne
      if (wojewodztwo !== 'all') {
        terytWhere.wojewodztwo = wojewodztwoDbName;
      }

      if (powiatParam) {
        terytWhere.powiat = powiatParam;
      }

      console.log('  🔍 TERYT query:', terytWhere);

      terytMatches = await prisma.terytLocation.findMany({
        where: terytWhere,
        select: {
          powiat: true,
          gmina: true,
          nazwa: true,
          wojewodztwo: true,
        },
      });

      console.log('  📍 TERYT matches found:', terytMatches.length);
      if (terytMatches.length > 0) {
        console.log('  📍 Sample matches:', terytMatches.slice(0, 3).map(m => ({
          nazwa: m.nazwa,
          powiat: m.powiat,
          wojewodztwo: m.wojewodztwo
        })));
      }

      let uniquePowiaty = [...new Set(terytMatches.map(t => normalizePolish(t.powiat)))];

      // ✅ FIX: NIE łącz miasta z powiatem!
      // "m. Kraków" (miasto) ≠ "krakowski" (okolice)
      // Mapowanie TYLKO dla specjalnych przypadków gdzie to samo miejsce ma różne nazwy
      const powiatMapping: Record<string, string[]> = {
        // Kraków MIASTO - szukaj tylko w mieście
        'm. krakow': ['m. krakow', 'krakow'],
        // Jeśli ktoś szuka po staremu "krakowski" - pokaż tylko okolice
        'krakowski': ['krakowski'],
      };

      uniquePowiaty = [...new Set(uniquePowiaty.flatMap(p => 
        powiatMapping[p] || [p]
      ))];

      console.log('  🗺️ Unique powiaty to search:', uniquePowiaty);

      if (uniquePowiaty.length > 0) {
        // ✅ Don't filter by type on server - let client handle it
        const allFacilities = await prisma.placowka.findMany({
          orderBy: { nazwa: 'asc' },
        });

        console.log('  🏢 All facilities (before powiat filter):', allFacilities.length);

        results = allFacilities.filter(facility => {
          const normalizedFacilityPowiat = normalizePolish(facility.powiat);
          const matches = uniquePowiaty.some(powiat => {
            return normalizedFacilityPowiat.includes(powiat) || powiat.includes(normalizedFacilityPowiat);
          });
          
          if (matches) {
            console.log('  ✅ Matched facility:', facility.nazwa, 'in powiat:', facility.powiat);
          }
          
          return matches;
        });

        console.log('  ✅ Final results after powiat filter:', results.length);

        const locationCount = terytMatches.length;
        const facilityWord = type === 'dps' ? 'DPS' : type === 'sds' ? 'ŚDS' : 'domy opieki';
        
        if (results.length > 0) {
          if (locationCount > 1) {
            const facilitiesPerPowiat = uniquePowiaty
              .map(powiat => {
                const count = results.filter(r => 
                  normalizePolish(r.powiat) === powiat
                ).length;
                return count > 0 ? `${powiat} (${count})` : null;
              })
              .filter(Boolean)
              .join(', ');
            
            message = '';
          } else {
            message = '';
          }
        } else {
          // Brak placówek w znalezionych powiatach
          const nearbyFacilities = await prisma.placowka.findMany({
            where: typeFilter,
            select: { powiat: true },
            distinct: ['powiat'],
            take: 5,
          });

          const powiatySuggestions = nearbyFacilities.map(f => f.powiat).join(', ');
          const wojewodztwoInfo = wojewodztwo === 'all' ? '' : ` (${wojewodztwoName})`;
          message = `Nie znaleźliśmy ${facilityWord} w ${uniquePowiaty.join(', ')}${wojewodztwoInfo}. Spróbuj wyszukać w: ${powiatySuggestions}`;
        }
      } else {
        // Brak dopasowań TERYT
        const searchType = isPartialSearch ? 'zawierających' : 'o nazwie';
        const wojewodztwoInfo = wojewodztwo === 'all' ? 'w naszej bazie' : `w ${wojewodztwoName}`;
        message = `Nie znaleźliśmy miejscowości ${searchType} "${query}" ${wojewodztwoInfo}. Spróbuj wpisać inną nazwę.`;
      }
    } 
    // BEZ TERYT (fallback dla województw bez danych TERYT)
    else {
      console.log('🔍 NO TERYT MODE (fallback)');

      // ✅ Don't filter by type on server - let client handle it
      const allFacilities = await prisma.placowka.findMany({
        orderBy: { nazwa: 'asc' },
      });

      results = allFacilities.filter(facility => {
        if (wojewodztwo !== 'all') {
          const normalizedFacilityWoj = normalizePolish(facility.wojewodztwo);
          const normalizedTargetWoj = normalizePolish(wojewodztwoDbName);

          if (normalizedFacilityWoj !== normalizedTargetWoj) {
            return false;
          }
        }

        const normalizedMiejscowosc = normalizePolish(facility.miejscowosc);
        return normalizedMiejscowosc.includes(normalizedQuery);
      });

      const facilityWord = type === 'dps' ? 'DPS' : type === 'sds' ? 'ŚDS' : 'domy opieki';

      if (results.length > 0) {
        message = '';
      } else {
        const wojewodztwoInfo = wojewodztwo === 'all' ? 'w żadnym województwie' : `w województwie ${wojewodztwoName}`;
        message = `Nie znaleźliśmy ${facilityWord} w okolicy "${query}" ${wojewodztwoInfo}. Spróbuj wpisać inną nazwę miejscowości.`;
      }
    }
  }

  // FILTROWANIE PO CENIE
  const minPrice = params.min ? parseInt(params.min) : undefined;
  const maxPrice = params.max ? parseInt(params.max) : undefined;
  const showFree = params.free === 'true';

  let filteredResults = results;

  if (showFree) {
    filteredResults = filteredResults.filter(f => 
      f.koszt_pobytu === null || f.koszt_pobytu === 0
    );
  } else {
    if (minPrice !== undefined || maxPrice !== undefined) {
      filteredResults = filteredResults.filter(f => {
        if (f.koszt_pobytu === null || f.koszt_pobytu === 0) return false;
        
        const price = f.koszt_pobytu;
        if (minPrice && price < minPrice) return false;
        if (maxPrice && price > maxPrice) return false;
        return true;
      });
    }
  }

  // OBLICZANIE LICZNIKÓW DLA PROFILI OPIEKI
  const careProfileCounts: Record<string, number> = {
    'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0, 'G': 0, 'H': 0, 'I': 0
  };

  const resultsBeforeCareFilter = filteredResults;

  resultsBeforeCareFilter.forEach(facility => {
    if (facility.profil_opieki) {
      const profiles = facility.profil_opieki.split(',').map((p: string) => p.trim());
      profiles.forEach((code: string) => {
        if (code in careProfileCounts) {
          careProfileCounts[code]++;
        }
      });
    }
  });

  // FILTROWANIE PO PROFILU OPIEKI
  const selectedCareTypes = params.care ? params.care.split(',') : [];

  if (selectedCareTypes.length > 0) {
    filteredResults = filteredResults.filter(facility => {
      if (!facility.profil_opieki) return false;
      
      const facilityProfiles = facility.profil_opieki.split(',').map((p: string) => p.trim());
      
      return selectedCareTypes.some(selectedType => 
        facilityProfiles.includes(selectedType)
      );
    });
  }

  if (filteredResults.length === 0 && results.length > 0) {
    message = `Znaleziono ${results.length} placówek, ale żadna nie spełnia wybranych filtrów. Zmień kryteria wyszukiwania.`;
  }

  // OBLICZANIE DYSTANSU
  let resultsWithDistance = filteredResults.map(facility => {
    let distance: number | null = null;

    if (userLat && userLng && facility.latitude && facility.longitude) {
      distance = calculateDistance(
        userLat,
        userLng,
        parseFloat(facility.latitude),
        parseFloat(facility.longitude)
      );
    }

    return {
      ...facility,
      distance,
    };
  });

  // SORTOWANIE
  const sortParam = params.sort || (userLat && userLng ? 'distance' : 'name_asc');
  let sortedResults = [...resultsWithDistance];

  switch (sortParam) {
    case 'name_asc':
      sortedResults.sort((a, b) => a.nazwa.localeCompare(b.nazwa, 'pl'));
      break;
    
    case 'name_desc':
      sortedResults.sort((a, b) => b.nazwa.localeCompare(a.nazwa, 'pl'));
      break;
    
    case 'price_asc':
      sortedResults.sort((a, b) => {
        if (a.koszt_pobytu === null || a.koszt_pobytu === 0) return 1;
        if (b.koszt_pobytu === null || b.koszt_pobytu === 0) return -1;
        return a.koszt_pobytu - b.koszt_pobytu;
      });
      break;
    
    case 'price_desc':
      sortedResults.sort((a, b) => {
        if (a.koszt_pobytu === null || a.koszt_pobytu === 0) return 1;
        if (b.koszt_pobytu === null || b.koszt_pobytu === 0) return -1;
        return b.koszt_pobytu - a.koszt_pobytu;
      });
      break;
    
    case 'distance':
      sortedResults.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
      break;
    
    default:
      break;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}

      {/* Main Content */}
      <main className="w-full h-screen flex flex-col">
        <div className="flex-1 overflow-hidden">
          {/* Mobile: Filter drawer */}
            <div className="lg:hidden">
              <MobileStickyBar
                totalResults={sortedResults.length}
                activeFiltersCount={
                  (type !== 'all' ? 1 : 0) +
                  (selectedCareTypes.length || 0) +
                  (minPrice ? 1 : 0) +
                  (maxPrice ? 1 : 0) +
                  (showFree ? 1 : 0)
                }
                hasUserLocation={!!(userLat && userLng)}
              />
              <MobileFilterDrawer
                totalResults={sortedResults.length}
                careProfileCounts={careProfileCounts}
                hasUserLocation={!!(userLat && userLng)}
              />
            </div>

            {/* Padding dla fixed sticky bar na mobile */}
            <div className="lg:hidden h-[110px]"></div>

            {/* Search Results */}
            <SearchResults 
              query={query}
              type={type}
              results={sortedResults}
              message={message}
              userLocation={userLat && userLng ? { lat: userLat, lng: userLng } : undefined}
              activeFilters={{
                wojewodztwo: wojewodztwo !== 'all' ? wojewodztwo : undefined,
                powiat: powiatParam || undefined,
                type: type !== 'all' ? type : undefined,
                careTypes: selectedCareTypes.length > 0 ? selectedCareTypes : undefined,
                minPrice,
                maxPrice,
                showFree: showFree || undefined,
              }}
            />
        </div>
      </main>
    </div>
  );
}