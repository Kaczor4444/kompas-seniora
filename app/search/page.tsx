import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SearchResults from '@/components/SearchResults';
import FilterSidebar from '@/src/components/filters/FilterSidebar';
import MobileFilterDrawer from '@/src/components/filters/MobileFilterDrawer';
import MobileStickyBar from '@/src/components/mobile/MobileStickyBar';
// ✅ USUNIĘTO: import SearchBarCompact
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
  const wojewodztwo = params.woj || 'all';
  const powiatParam = params.powiat || '';
  const isPartialSearch = params.partial === 'true';

  const userLat = params.lat ? parseFloat(params.lat) : null;
  const userLng = params.lng ? parseFloat(params.lng) : null;
  const isNearSearch = params.near === 'true';

  console.log('🔍 DEBUG Search Page START:');
  console.log('  query:', query);
  console.log('  type:', type);
  console.log('  wojewodztwo:', wojewodztwo);
  console.log('  powiatParam:', powiatParam);
  console.log('  isPartialSearch:', isPartialSearch);
  console.log('  🗺️ Geolocation:', { userLat, userLng, isNearSearch });

  let results: any[] = [];
  let terytMatches: any[] = [];
  let message = '';

  // TRYB 3: GEOLOCATION SEARCH
  if (isNearSearch && userLat && userLng && !query) {
    console.log('🗺️ Mode: GEOLOCATION SEARCH');

    const typeFilter = type === 'dps' 
      ? { typ_placowki: 'DPS' }
      : (type === 'sds' || type === 'śds')
      ? { typ_placowki: 'ŚDS' }
      : {};

    results = await prisma.placowka.findMany({
      where: typeFilter,
      orderBy: { nazwa: 'asc' },
    });

    console.log('🗺️ All facilities for geolocation:', results.length);
    // ✅ USUNIĘTO: Niebieski banner z message - user widzi 🧭 na kartach
    message = '';
  }
  // TRYB 1: Z QUERY
  else if (query) {
    const normalizedQuery = normalizePolish(query.trim());
    console.log('  normalizedQuery:', normalizedQuery);

    const wojewodztwoMap: Record<string, string> = {
      'malopolskie': 'małopolskie',
      'slaskie': 'śląskie',
      'mazowieckie': 'mazowieckie',
      'dolnoslaskie': 'dolnośląskie',
      'wielkopolskie': 'wielkopolskie',
    };

    const wojewodztwoDbName = wojewodztwoMap[wojewodztwo] || wojewodztwo;
    const wojewodztwoName = wojewodztwo === 'slaskie' ? 'Śląskie' : 
                           wojewodztwo === 'malopolskie' ? 'Małopolskie' : 
                           wojewodztwoDbName;

    const hasTerytData = wojewodztwo === 'malopolskie';
    console.log('  hasTerytData:', hasTerytData, '(wojewodztwo:', wojewodztwo, ')');

    // Z TERYT (Małopolskie)
    if (hasTerytData && wojewodztwo !== 'all') {
      console.log('  Mode: TERYT');

      const terytWhere: any = isPartialSearch 
        ? { nazwa_normalized: { contains: normalizedQuery } }
        : { nazwa_normalized: normalizedQuery };

      if (wojewodztwo !== 'all') {
        terytWhere.wojewodztwo = wojewodztwoDbName;
      }

      if (powiatParam) {
        terytWhere.powiat = powiatParam;
      }

      terytMatches = await prisma.terytLocation.findMany({
        where: terytWhere,
        select: {
          powiat: true,
          gmina: true,
          nazwa: true,
          wojewodztwo: true,
        },
      });

      let uniquePowiaty = [...new Set(terytMatches.map(t => normalizePolish(t.powiat)))];

      const powiatMapping: Record<string, string[]> = {
        'krakow': ['krakow', 'krakowski'],
        'm. krakow': ['krakow', 'krakowski'],
        'krakowski': ['krakow', 'krakowski'],
      };

      uniquePowiaty = [...new Set(uniquePowiaty.flatMap(p => 
        powiatMapping[p] || [p]
      ))];

      if (uniquePowiaty.length > 0) {
        const typeFilter = type === 'dps' 
          ? { typ_placowki: 'DPS' }
          : (type === 'sds' || type === 'śds')
          ? { typ_placowki: 'ŚDS' }
          : {};

        const allFacilities = await prisma.placowka.findMany({
          where: typeFilter,
          orderBy: { nazwa: 'asc' },
        });

        results = allFacilities.filter(facility => {
          const normalizedFacilityPowiat = normalizePolish(facility.powiat);
          return uniquePowiaty.some(powiat => {
            return normalizedFacilityPowiat.includes(powiat) || powiat.includes(normalizedFacilityPowiat);
          });
        });

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
            
            const searchType = isPartialSearch ? 'zawierających' : 'o nazwie';
            message = '';
          } else {
            message = '';
          }
        } else {
          const nearbyFacilities = await prisma.placowka.findMany({
            where: typeFilter,
            select: { powiat: true },
            distinct: ['powiat'],
            take: 5,
          });

          const powiatySuggestions = nearbyFacilities.map(f => f.powiat).join(', ');
          message = `Nie znaleźliśmy ${facilityWord} w ${uniquePowiaty.join(', ')} (${wojewodztwoName}). Spróbuj wyszukać w: ${powiatySuggestions}`;
        }
      } else {
        const searchType = isPartialSearch ? 'zawierających' : 'o nazwie';
        message = `Nie znaleźliśmy miejscowości ${searchType} "${query}" w ${wojewodztwoName}. Spróbuj wpisać inną nazwę.`;
      }
    } 
    // BEZ TERYT (Śląskie lub 'all')
    else {
      console.log('🔍 NO TERYT MODE');

      const where: any = type === 'dps' 
        ? { typ_placowki: 'DPS' }
        : (type === 'sds' || type === 'śds')
        ? { typ_placowki: 'ŚDS' }
        : {};

      const allFacilities = await prisma.placowka.findMany({
        where,
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
        const wojewodztwoInfo = wojewodztwo === 'all' ? 'we wszystkich województwach' : `w województwie ${wojewodztwoName}`;
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ✅ USUNIĘTO: <SearchBarCompact /> */}

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT: Sidebar z filtrami (tylko desktop) */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0 sticky top-20 h-screen overflow-y-auto">
            <FilterSidebar 
              totalResults={sortedResults.length}
              careProfileCounts={careProfileCounts}
              hasUserLocation={!!(userLat && userLng)}
              showSorting={true}
            />
          </div>

          {/* RIGHT: Wyniki wyszukiwania */}
          <div className="flex-1 min-w-0">
            {/* Mobile: Filter drawer */}
            {/* ✅ Mobile: Sticky Bar + Hidden Filter Button */}
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
              {/* MobileFilterDrawer z własnym buttonem - triggerowany przez sticky bar */}
              <MobileFilterDrawer
                totalResults={sortedResults.length}
                careProfileCounts={careProfileCounts}
                hasUserLocation={!!(userLat && userLng)}
              />
            </div>


            {/* Padding dla fixed sticky bar na mobile */}
            <div className="lg:hidden h-[60px]"></div>

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

        </div>
      </main>
    </div>
  );
}
