import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SearchResults from '@/components/SearchResults';
import FilterSidebar from '@/src/components/filters/FilterSidebar';
import MobileFilterDrawer from '@/src/components/filters/MobileFilterDrawer';

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
  }>;
}

// Normalizacja polskich znaków - uniwersalna dla całej Polski
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

  console.log('🔍 DEBUG Search Page START:');
  console.log('  query:', query);
  console.log('  type:', type);
  console.log('  wojewodztwo:', wojewodztwo);
  console.log('  powiatParam:', powiatParam);
  console.log('  isPartialSearch:', isPartialSearch);

  let results: any[] = [];
  let terytMatches: any[] = [];
  let message = '';

  if (query) {
    const normalizedQuery = normalizePolish(query.trim());
    console.log('  normalizedQuery:', normalizedQuery);

    // Mapowanie województw
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

    // Sprawdź czy są dane TERYT dla tego województwa
    const hasTerytData = wojewodztwo === 'malopolskie';

    console.log('  hasTerytData:', hasTerytData, '(wojewodztwo:', wojewodztwo, ')');

    // TRYB 1: Z TERYT (Małopolskie)
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

      console.log('🔍 TERYT WHERE:', JSON.stringify(terytWhere, null, 2));

      terytMatches = await prisma.terytLocation.findMany({
        where: terytWhere,
        select: {
          powiat: true,
          gmina: true,
          nazwa: true,
          wojewodztwo: true,
        },
      });

      console.log('🔍 TERYT matches found:', terytMatches.length);
      if (terytMatches.length > 0) {
        console.log('🔍 First match:', terytMatches[0]);
      }

      let uniquePowiaty = [...new Set(terytMatches.map(t => normalizePolish(t.powiat)))];
      console.log('🔍 Unique powiaty:', uniquePowiaty);

      const powiatMapping: Record<string, string[]> = {
        'krakow': ['krakow', 'krakowski'],
        'm. krakow': ['krakow', 'krakowski'],
        'krakowski': ['krakow', 'krakowski'],
      };

      uniquePowiaty = [...new Set(uniquePowiaty.flatMap(p => 
        powiatMapping[p] || [p]
      ))];
      console.log('🔍 Unique powiaty (expanded):', uniquePowiaty);

      if (uniquePowiaty.length > 0) {
        const typeFilter = type === 'dps' 
          ? { typ_placowki: 'DPS' }
          : (type === 'sds' || type === 'śds')
          ? { typ_placowki: 'ŚDS' }
          : {};

        console.log('🔍 Type filter:', typeFilter);

        const allFacilities = await prisma.placowka.findMany({
          where: typeFilter,
          orderBy: { nazwa: 'asc' },
        });

        console.log('🔍 All facilities (before powiat filter):', allFacilities.length);

        results = allFacilities.filter(facility => {
          const normalizedFacilityPowiat = normalizePolish(facility.powiat);
          
          const matches = uniquePowiaty.some(powiat => {
            const powiatContainsFacility = normalizedFacilityPowiat.includes(powiat);
            const facilityContainsPowiat = powiat.includes(normalizedFacilityPowiat);
            
            if (powiatContainsFacility || facilityContainsPowiat) {
              console.log('  ✓ Matched facility:', facility.nazwa, 'in', facility.powiat, '(matched with:', powiat, ')');
              return true;
            }
            return false;
          });
          
          return matches;
        });

        console.log('🔍 Results after powiat filter:', results.length);

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
            message = `Miejscowości ${searchType} "${query}" znalezione w ${locationCount} lokalizacjach (${wojewodztwoName}). Pokazujemy ${facilityWord} ze wszystkich: ${facilitiesPerPowiat}.`;
          } else {
            message = `Znaleźliśmy ${facilityWord} w okolicy miejscowości ${terytMatches[0].nazwa} (${wojewodztwoName}).`;
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
    // TRYB 2: BEZ TERYT (Śląskie lub 'all')
    else {
      console.log('🔍 NO TERYT MODE - Direct search in Placowka.miejscowosc');

      const where: any = type === 'dps' 
        ? { typ_placowki: 'DPS' }
        : (type === 'sds' || type === 'śds')
        ? { typ_placowki: 'ŚDS' }
        : {};

      console.log('🔍 Direct WHERE (before woj filter):', JSON.stringify(where, null, 2));

      const allFacilities = await prisma.placowka.findMany({
        where,
        orderBy: { nazwa: 'asc' },
      });

      console.log('🔍 All facilities (total):', allFacilities.length);

      const uniqueWoj = [...new Set(allFacilities.map(f => f.wojewodztwo))];
      console.log('🔍 Unique wojewodztwa in DB:', uniqueWoj);

      results = allFacilities.filter(facility => {
        if (wojewodztwo !== 'all') {
          const normalizedFacilityWoj = normalizePolish(facility.wojewodztwo);
          const normalizedTargetWoj = normalizePolish(wojewodztwoDbName);
          
          if (normalizedFacilityWoj !== normalizedTargetWoj) {
            return false;
          }
        }

        const normalizedMiejscowosc = normalizePolish(facility.miejscowosc);
        const matches = normalizedMiejscowosc.includes(normalizedQuery);
        
        if (matches) {
          console.log('  ✓ Matched facility:', facility.nazwa, 'in', facility.miejscowosc, '(woj:', facility.wojewodztwo + ')');
        }
        return matches;
      });

      console.log('🔍 Results after miejscowosc filter:', results.length);

      const facilityWord = type === 'dps' ? 'DPS' : type === 'sds' ? 'ŚDS' : 'domy opieki';
      
      if (results.length > 0) {
        const wojewodztwoInfo = wojewodztwo === 'all' ? 'we wszystkich województwach' : `w województwie ${wojewodztwoName}`;
        message = `Znaleźliśmy ${results.length} ${facilityWord} w okolicy "${query}" ${wojewodztwoInfo}.`;
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

  console.log('💰 PRICE FILTERS:', { minPrice, maxPrice, showFree });

  let filteredResults = results;

  if (showFree) {
    filteredResults = filteredResults.filter(f => 
      f.koszt_pobytu === null || f.koszt_pobytu === 0
    );
    console.log('  Filtered by: Bezpłatne only →', filteredResults.length);
  } else {
    if (minPrice !== undefined || maxPrice !== undefined) {
      filteredResults = filteredResults.filter(f => {
        if (f.koszt_pobytu === null || f.koszt_pobytu === 0) return false;
        
        const price = f.koszt_pobytu;
        if (minPrice && price < minPrice) return false;
        if (maxPrice && price > maxPrice) return false;
        return true;
      });
      console.log('  Filtered by price range →', filteredResults.length);
    }
  }

  // OBLICZANIE LICZNIKÓW DLA PROFILI OPIEKI
  const careProfileCounts: Record<string, number> = {
    'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0, 'G': 0, 'H': 0, 'I': 0
  };

  // Liczymy na podstawie wyników PRZED filtrowaniem po profilu
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

  console.log('📊 CARE PROFILE COUNTS:', careProfileCounts);

  // FILTROWANIE PO PROFILU OPIEKI
  const selectedCareTypes = params.care ? params.care.split(',') : [];
  
  console.log('🏥 CARE PROFILE FILTERS:', selectedCareTypes);

  if (selectedCareTypes.length > 0) {
    filteredResults = filteredResults.filter(facility => {
      if (!facility.profil_opieki) return false;
      
      const facilityProfiles = facility.profil_opieki.split(',').map((p: string) => p.trim());
      
      // OR logic - placówka musi mieć przynajmniej jeden z wybranych profili
      const hasMatch = selectedCareTypes.some(selectedType => 
        facilityProfiles.includes(selectedType)
      );
      
      if (hasMatch) {
        console.log('  ✓ Care match:', facility.nazwa, 'has', facilityProfiles, 'matches', selectedCareTypes);
      }
      
      return hasMatch;
    });
    console.log('  Filtered by care profiles →', filteredResults.length);
  }

  if (filteredResults.length === 0 && results.length > 0) {
    message = `Znaleziono ${results.length} placówek, ale żadna nie spełnia wybranych filtrów. Zmień kryteria wyszukiwania.`;
  }

  console.log('🔍 DEBUG Search Page END');
  console.log('  Final results:', filteredResults.length);
  console.log('  Message:', message);
  console.log('---');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700">
            KompasSeniora.pl
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT: Sidebar z filtrami (tylko desktop) */}
          <div className="hidden lg:block lg:w-80 flex-shrink-0">
            <FilterSidebar 
              totalResults={filteredResults.length}
              careProfileCounts={careProfileCounts}
            />
          </div>

          {/* RIGHT: Wyniki wyszukiwania */}
          <div className="flex-1 min-w-0">
            {/* Mobile: Filter drawer */}
            <div className="lg:hidden mb-4">
              <MobileFilterDrawer 
                totalResults={filteredResults.length}
                careProfileCounts={careProfileCounts}
              />
            </div>

            {/* Search Results */}
            <SearchResults 
              query={query}
              type={type}
              results={filteredResults}
              message={message}
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