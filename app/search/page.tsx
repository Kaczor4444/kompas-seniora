import { prisma } from '@/lib/prisma';
import SearchResults from '@/components/SearchResults';
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
    .trim()
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
  // TRYB 5: POWIAT ONLY (klik z mapy Małopolski)
  else if (!query && powiatParam && wojewodztwo === 'all') {
    const allFacilities = await prisma.placowka.findMany({
      orderBy: { nazwa: 'asc' },
    });
    const normalizedTarget = normalizePolish(powiatParam);
    results = allFacilities.filter(facility => {
      const normalizedFacilityPowiat = normalizePolish(facility.powiat);
      return normalizedFacilityPowiat === normalizedTarget || normalizedFacilityPowiat.includes(normalizedTarget);
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
      const baseWhere: any = {};
      if (wojewodztwo !== 'all') baseWhere.wojewodztwo = wojewodztwoDbName;
      if (powiatParam) baseWhere.powiat = powiatParam;

      // Zawsze próbuj najpierw exact match — unika "Krakowska" w nowosądeckim
      // gdy user wpisał "Kraków"
      terytMatches = await prisma.terytLocation.findMany({
        where: { ...baseWhere, nazwa_normalized: normalizedQuery },
        select: { powiat: true, gmina: true, nazwa: true, wojewodztwo: true },
      });

      // Fallback na partial tylko gdy brak exact matchy
      if (terytMatches.length === 0) {
        terytMatches = await prisma.terytLocation.findMany({
          where: { ...baseWhere, nazwa_normalized: { contains: normalizedQuery } },
          select: { powiat: true, gmina: true, nazwa: true, wojewodztwo: true },
        });
      }

      // Sortuj powiaty po liczbie dopasowań
      const powiatFrequency: Record<string, number> = {};
      for (const t of terytMatches) {
        const p = normalizePolish(t.powiat);
        powiatFrequency[p] = (powiatFrequency[p] || 0) + 1;
      }

      // Jeśli jest powiat "m. {query}" (miasto wyodrębnione), użyj TYLKO jego —
      // ignoruje wioski o tej samej nazwie w innych powiatach (np. wioska "Kraków" w tarnowskim)
      const cityPowiat = `m. ${normalizedQuery}`;
      let uniquePowiaty: string[];
      if (powiatFrequency[cityPowiat]) {
        uniquePowiaty = [cityPowiat];
      } else {
        uniquePowiaty = Object.entries(powiatFrequency)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([p]) => p);
      }

      // Wstępne załadowanie placówek potrzebne do weryfikacji
      const allFacilities = await prisma.placowka.findMany({
        orderBy: { nazwa: 'asc' },
      });

      // Sprawdź czy uniquePowiaty (exact match) dały jakiekolwiek wyniki
      // Jeśli nie (np. "m. tarnow" nie ma odpowiednika w DB, bo DB ma "tarnowski"),
      // wróć do partial search i znajdź powiat który faktycznie ma placówki
      const checkResults = allFacilities.filter(facility => {
        const norm = normalizePolish(facility.powiat);
        return uniquePowiaty.some(p => norm.includes(p) || p.includes(norm));
      });

      if (checkResults.length === 0 && uniquePowiaty.length === 1 && uniquePowiaty[0] === cityPowiat) {
        // Brak placówek dla "m. {city}" → partial fallback, wyklucz "m." powiaty
        const partialTeryt = await prisma.terytLocation.findMany({
          where: { ...baseWhere, nazwa_normalized: { contains: normalizedQuery } },
          select: { powiat: true },
        });
        const partialFreq: Record<string, number> = {};
        for (const t of partialTeryt) {
          const p = normalizePolish(t.powiat);
          partialFreq[p] = (partialFreq[p] || 0) + 1;
        }
        // Wyklucz powiaty "m." i weź top-1 który MA placówki w DB
        const candidatePowiaty = Object.entries(partialFreq)
          .filter(([p]) => !p.startsWith('m. '))
          .sort((a, b) => b[1] - a[1])
          .map(([p]) => p);

        for (const candidate of candidatePowiaty) {
          const has = allFacilities.some(f => {
            const norm = normalizePolish(f.powiat);
            return norm.includes(candidate) || candidate.includes(norm);
          });
          if (has) {
            uniquePowiaty = [candidate];
            break;
          }
        }
      }

      if (uniquePowiaty.length > 0) {
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
