import { prisma } from '@/lib/prisma';
import SearchResults from '@/components/SearchResults';
import MobileFilterDrawer from '@/src/components/filters/MobileFilterDrawer';
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

  // Apply wojewodztwo mapping IMMEDIATELY (before any logic)
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

  let results: any[] = [];
  let terytMatches: any[] = [];
  let message = '';

  // TRYB 3: GEOLOCATION SEARCH
  if (isNearSearch && userLat && userLng && !query) {
    results = await prisma.placowka.findMany({
      orderBy: { nazwa: 'asc' },
    });
    message = '';
  }
  // TRYB 4: WOJEWÓDZTWO ONLY (RegionModal)
  else if (!query && wojewodztwo !== 'all') {
    const allFacilities = await prisma.placowka.findMany({
      orderBy: { nazwa: 'asc' },
    });

    results = allFacilities.filter(facility => {
      const normalizedFacilityWoj = normalizePolish(facility.wojewodztwo);
      const normalizedTargetWoj = normalizePolish(wojewodztwo);
      return normalizedFacilityWoj === normalizedTargetWoj;
    });

    message = '';
  }
  // TRYB 1: Z QUERY
  else if (query) {
    const normalizedQuery = normalizePolish(query.trim());

    const wojewodztwoDbName = wojewodztwo;
    const wojewodztwoName = wojewodztwo === 'śląskie' ? 'Śląskie' :
                           wojewodztwo === 'małopolskie' ? 'Małopolskie' :
                           wojewodztwo;

    // Sprawdź czy województwo MA dane TERYT
    const wojewodztwaWithTeryt = ['małopolskie', 'śląskie'];
    const hasTerytData = wojewodztwo === 'all' || wojewodztwaWithTeryt.includes(wojewodztwoDbName.toLowerCase());

    if (hasTerytData) {
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
        'm. krakow': ['m. krakow', 'krakow'],
        'krakowski': ['krakowski'],
      };

      uniquePowiaty = [...new Set(uniquePowiaty.flatMap(p =>
        powiatMapping[p] || [p]
      ))];

      if (uniquePowiaty.length > 0) {
        const allFacilities = await prisma.placowka.findMany({
          orderBy: { nazwa: 'asc' },
        });

        results = allFacilities.filter(facility => {
          const normalizedFacilityPowiat = normalizePolish(facility.powiat);
          return uniquePowiaty.some(powiat => {
            return normalizedFacilityPowiat.includes(powiat) || powiat.includes(normalizedFacilityPowiat);
          });
        });

        const facilityWord = type === 'dps' ? 'DPS' : type === 'sds' ? 'ŚDS' : 'domy opieki';

        if (results.length === 0) {
          // Brak placówek w znalezionych powiatach
          const nearbyFacilities = await prisma.placowka.findMany({
            where: {},
            select: { powiat: true },
            distinct: ['powiat'],
            take: 5,
          });

          const powiatySuggestions = nearbyFacilities.map(f => f.powiat).join(', ');
          const wojewodztwoInfo = wojewodztwo === 'all' ? '' : ` (${wojewodztwoName})`;
          message = `Nie znaleźliśmy ${facilityWord} w ${uniquePowiaty.join(', ')}${wojewodztwoInfo}. Spróbuj wyszukać w: ${powiatySuggestions}`;
        } else {
          message = '';
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
      const wojewodztwoDbName = wojewodztwo;
      const allFacilities = await prisma.placowka.findMany({
        orderBy: { nazwa: 'asc' },
      });

      results = allFacilities.filter(facility => {
        if (wojewodztwo !== 'all') {
          const normalizedFacilityWoj = normalizePolish(facility.wojewodztwo);
          const normalizedTargetWoj = normalizePolish(wojewodztwoDbName);
          if (normalizedFacilityWoj !== normalizedTargetWoj) return false;
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
    <div className="min-h-screen bg-stone-50">
      {/* Main Content */}
      <main className="w-full h-screen flex flex-col">
        <div className="flex-1 overflow-hidden">
          {/* Mobile: Filter drawer */}
            <div className="lg:hidden">
              <MobileFilterDrawer
                totalResults={sortedResults.length}
                careProfileCounts={careProfileCounts}
                hasUserLocation={!!(userLat && userLng)}
              />
            </div>

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
