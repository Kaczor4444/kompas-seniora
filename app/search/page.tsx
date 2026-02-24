import { prisma } from '@/lib/prisma';
import SearchResults from '@/components/SearchResults';
import { calculateDistance } from '@/src/utils/distance';

async function geocodeCity(cityName: string, powiat?: string, woj?: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Buduj zapytanie z kontekstem powiatu/województwa żeby Nominatim znalazł właściwą miejscowość
    let queryParts = [cityName];
    if (powiat) queryParts.push(powiat);
    if (woj) queryParts.push(woj);
    queryParts.push('Polska');

    const encoded = encodeURIComponent(queryParts.join(', '));
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&countrycodes=pl&limit=1&format=json`,
      { headers: { 'User-Agent': 'KompasSeniora/1.0' }, next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

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
  let terytPowiats: string[] = [];
  let powiatBreakdown: Record<string, number> = {};
  let powiatSearchCenters: Record<string, { lat: number; lng: number }> = {};

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
        select: { powiat: true, gmina: true, nazwa: true, wojewodztwo: true, rodzaj_miejscowosci: true }, // ✅ OPCJA 1b
      });

      // Fallback na partial tylko gdy brak exact matchy
      if (terytMatches.length === 0) {
        terytMatches = await prisma.terytLocation.findMany({
          where: { ...baseWhere, nazwa_normalized: { contains: normalizedQuery } },
          select: { powiat: true, gmina: true, nazwa: true, wojewodztwo: true, rodzaj_miejscowosci: true }, // ✅ OPCJA 1b
        });
      }

      // Sprawdź czy którakolwiek znaleziona miejscowość DOKŁADNIE pasuje do zapytania
      // Jeśli nie (tylko partial: np. "opole" matchuje "Nowopole", "Wielopole") →
      // miejscowość o tej nazwie nie istnieje w Małopolsce
      const hasExactNameMatch = terytMatches.some(
        (t: any) => normalizePolish(t.nazwa) === normalizedQuery
      );

      if (terytMatches.length === 0 || !hasExactNameMatch) {
        results = [];
        const displayQuery = query.charAt(0).toUpperCase() + query.slice(1);
        message = `Miejscowość „${displayQuery}" nie istnieje w Małopolsce. Wpisz nazwę miejscowości z terenu Małopolski.`;
      } else {

      // Pobierz UNIKALNE powiaty gdzie szukana miejscowość istnieje
      // Używamy Set aby usunąć duplikaty z bazy TERYT
      terytPowiats = [...new Set(terytMatches.map((t: any) => t.powiat))].sort();

      // NOWA LOGIKA: Rozróżniamy czy user wybrał z dropdownu czy kliknął "Szukaj"
      let uniquePowiaty: string[];

      // Wstępne załadowanie placówek
      const allFacilities = await prisma.placowka.findMany({
        orderBy: { nazwa: 'asc' },
      });

      if (powiatParam) {
        // User WYBRAŁ konkretny powiat z dropdownu → użyj tylko tego
        // MAPOWANIE: "m. Kraków" (TERYT) → "krakowski" (baza placówek)
        let mappedPowiat = powiatParam;
        if (normalizePolish(powiatParam) === 'm. krakow') {
          mappedPowiat = 'krakowski';
        }
        uniquePowiaty = [normalizePolish(mappedPowiat)];
      } else {
        // ✅ OPCJA 1b: User WPISAŁ i kliknął "Szukaj" bez wyboru → pokaż TYLKO powiaty z GŁÓWNYCH miejscowości
        // Filtrujemy tylko RM=01,96,98 aby banner nie pokazywał powiatów z "części"
        const mainTerytMatches = terytMatches.filter((t: any) =>
          ['01', '96', '98'].includes(t.rodzaj_miejscowosci || '')
        );
        uniquePowiaty = [...new Set(mainTerytMatches.map((t: any) => normalizePolish(t.powiat)))];
      }

      // Filtruj placówki według wybranych powiatów
      if (uniquePowiaty.length > 0) {
        results = allFacilities.filter(facility => {
          const normalizedFacilityPowiat = normalizePolish(facility.powiat);
          return uniquePowiaty.some(powiat => {
            return normalizedFacilityPowiat.includes(powiat) || powiat.includes(normalizedFacilityPowiat);
          });
        });

        // Policz rozkład placówek per powiat (dla banneru informacyjnego)
        if (!powiatParam && uniquePowiaty.length > 1) {
          // User kliknął "Szukaj" bez wyboru i mamy wiele powiatów
          for (const facility of results) {
            const powiat = facility.powiat;
            powiatBreakdown[powiat] = (powiatBreakdown[powiat] || 0) + 1;
          }

          // Użyj współrzędnych pierwszej placówki w każdym powiecie (zamiast Nominatim)
          for (const powiat of Object.keys(powiatBreakdown)) {
            const firstFacilityInPowiat = results.find(f => f.powiat === powiat && f.latitude && f.longitude);
            if (firstFacilityInPowiat) {
              powiatSearchCenters[powiat] = {
                lat: parseFloat(firstFacilityInPowiat.latitude),
                lng: parseFloat(firstFacilityInPowiat.longitude)
              };
            }
          }
        }

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

      } // koniec else (hasExactNameMatch)
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

  // FILTROWANIE PO TYPIE (DPS / SDS)
  if (type === 'dps') {
    results = results.filter(f => f.typ_placowki && f.typ_placowki.toUpperCase().includes('DPS'));
  } else if (type === 'sds') {
    results = results.filter(f => f.typ_placowki && f.typ_placowki.toUpperCase().includes('SDS'));
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

  // Geokoduj szukane miasto żeby pokazać pin "tu szukasz" na mapie
  // Tylko gdy jest query tekstowy (nie geoloc, nie województwo)
  const searchCenter = query ? await geocodeCity(
    query,
    powiatParam || undefined,
    wojewodztwo !== 'all' ? wojewodztwo : undefined
  ) : null;

  return (
    <SearchResults
      query={query}
      type={type}
      results={sortedResults}
      message={message}
      terytPowiats={terytPowiats.length > 0 ? terytPowiats : undefined}
      searchCenter={searchCenter ? { ...searchCenter, name: query } : undefined}
      userLocation={userLat && userLng ? { lat: userLat, lng: userLng } : undefined}
      powiatBreakdown={Object.keys(powiatBreakdown).length > 0 ? powiatBreakdown : undefined}
      powiatSearchCenters={Object.keys(powiatSearchCenters).length > 0 ? powiatSearchCenters : undefined}
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
  );
}
