import { prisma } from '@/lib/prisma';
import { getVoivodeshipFilter, ENABLED_VOIVODESHIPS } from '@/lib/voivodeship-filter';
import { PUBLIC_PLACOWKA_SELECT } from '@/lib/public-placowka-fields';
import { normalizePolish } from '@/lib/normalize-polish';
import { mapCityCountyToPowiat } from '@/lib/city-county-mapping';
import SearchResults from '@/components/SearchResults';
import { calculateDistance } from '@/src/utils/distance';

// 🚫 BLACKLISTA STOLIC POLSKI (zawsze poza obsługiwanym regionem)
// Zawiera tylko miasta które NIE są w żadnym obsługiwanym województwie.
// ⚠️ NIE dodawaj tu miast Śląskich ani Małopolskich!
const CAPITAL_CITIES_BLACKLIST = [
  'warszawa', 'lodz', 'wroclaw', 'poznan', 'gdansk', 'szczecin',
  'bydgoszcz', 'lublin', 'bialystok', 'gdynia',
  'radom', 'torun', 'kielce', 'olsztyn',
  'rzeszow', 'plock', 'elblag', 'opole', 'gorzow wielkopolski', 'wloclawek',
  'zielona gora', 'tarnobrzeg', 'koszalin', 'kalisz',
  'legnica', 'grudziadz', 'slupsk',
];

// Geocoding result with out-of-region detection
interface GeocodingResult {
  lat: number;
  lng: number;
  state?: string; // Nominatim address.state (województwo)
  outOfRegion?: boolean; // true jeśli miasto poza obsługiwanymi województwami
}

// 🎯 HARDCODED współrzędne dla głównych miast obsługiwanych województw (centrum miasta!)
const CITY_CENTER_COORDS: Record<string, { lat: number; lng: number; wojewodztwo: string }> = {
  // Małopolska
  'krakow':    { lat: 50.0647, lng: 19.9450, wojewodztwo: 'małopolskie' },
  'tarnow':    { lat: 50.0121, lng: 20.9877, wojewodztwo: 'małopolskie' },
  'nowy sacz': { lat: 49.6247, lng: 20.6931, wojewodztwo: 'małopolskie' },
  'oswiecim':  { lat: 50.0374, lng: 19.2114, wojewodztwo: 'małopolskie' },
  'wieliczka': { lat: 49.9836, lng: 20.0643, wojewodztwo: 'małopolskie' },
  'olkusz':    { lat: 50.2812, lng: 19.5608, wojewodztwo: 'małopolskie' },
  // Śląskie — 19 miast na prawach powiatu
  'katowice':         { lat: 50.2599, lng: 19.0216, wojewodztwo: 'śląskie' },
  'czestochowa':      { lat: 50.8118, lng: 19.1203, wojewodztwo: 'śląskie' },
  'sosnowiec':        { lat: 50.2863, lng: 19.1040, wojewodztwo: 'śląskie' },
  'gliwice':          { lat: 50.2945, lng: 18.6714, wojewodztwo: 'śląskie' },
  'zabrze':           { lat: 50.3248, lng: 18.7857, wojewodztwo: 'śląskie' },
  'bytom':            { lat: 50.3484, lng: 18.9162, wojewodztwo: 'śląskie' },
  'bielsko-biala':    { lat: 49.8224, lng: 19.0584, wojewodztwo: 'śląskie' },
  'ruda slaska':      { lat: 50.2590, lng: 18.8564, wojewodztwo: 'śląskie' },
  'rybnik':           { lat: 50.0971, lng: 18.5412, wojewodztwo: 'śląskie' },
  'tychy':            { lat: 50.1357, lng: 18.9968, wojewodztwo: 'śląskie' },
  'dabrowa gornicza': { lat: 50.3249, lng: 19.1887, wojewodztwo: 'śląskie' },
  'chorzow':          { lat: 50.2974, lng: 18.9538, wojewodztwo: 'śląskie' },
  'jaworzno':         { lat: 50.2051, lng: 19.2736, wojewodztwo: 'śląskie' },
  'jastrzebie zdroj': { lat: 49.9557, lng: 18.5977, wojewodztwo: 'śląskie' },
  'siemianowice slaskie': { lat: 50.3185, lng: 19.0185, wojewodztwo: 'śląskie' },
  'myslowice':        { lat: 50.2272, lng: 19.1655, wojewodztwo: 'śląskie' },
  'piekary slaskie':  { lat: 50.3844, lng: 18.9378, wojewodztwo: 'śląskie' },
  'swietochlowice':   { lat: 50.2983, lng: 18.9185, wojewodztwo: 'śląskie' },
  'zory':             { lat: 50.0572, lng: 18.7036, wojewodztwo: 'śląskie' },
};

async function geocodeCity(cityName: string, powiat?: string, woj?: string): Promise<GeocodingResult | null> {
  try {
    // 🚫 BLACKLISTA: Jeśli to stolica Polski BEZ kontekstu powiatu - natychmiast zwróć outOfRegion=true
    // Jeśli user wybrał z autocomplete (powiat jest znany) - geokoduj normalnie (może być wieś o tej samej nazwie)
    const normalizedCity = normalizePolish(cityName).toLowerCase();
    if (CAPITAL_CITIES_BLACKLIST.includes(normalizedCity) && !powiat) {
      console.log(`🚫 BLACKLIST HIT: "${cityName}" jest stolicą Polski (bez kontekstu powiatu) - outOfRegion=true`);
      return {
        lat: 0,
        lng: 0,
        state: undefined,
        outOfRegion: true
      };
    }

    // 🎯 HARDCODED: Użyj dokładnych współrzędnych dla głównych miast Małopolski
    if (CITY_CENTER_COORDS[normalizedCity]) {
      const coords = CITY_CENTER_COORDS[normalizedCity];
      console.log(`🎯 Używam hardcoded współrzędnych dla "${cityName}" (centrum miasta)`);
      return {
        lat: coords.lat,
        lng: coords.lng,
        state: coords.wojewodztwo,
        outOfRegion: false,
      };
    }

    // Buduj zapytanie z kontekstem powiatu/województwa żeby Nominatim znalazł właściwą miejscowość
    // 🔧 ULEPSZONE: Dla miast na prawach powiatu (m. Tarnów) dodaj słowo "miasto" żeby Nominatim
    // zwrócił centrum miasta zamiast punktu administracyjnego gminy
    const isCityCounty = powiat?.startsWith('m. ');
    let queryParts = [isCityCounty ? `${cityName} miasto` : cityName];
    if (powiat && !isCityCounty) queryParts.push(powiat); // Nie dodawaj "m. Tarnów" bo już mamy "Tarnów miasto"
    if (woj) queryParts.push(woj);
    queryParts.push('Polska');

    const encoded = encodeURIComponent(queryParts.join(', '));
    console.log(`🌍 GEOCODING: "${cityName}" (powiat: ${powiat || 'brak'}, woj: ${woj || 'brak'})${isCityCounty ? ' [+miasto]' : ''}`);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&countrycodes=pl&limit=1&format=json&addressdetails=1&featuretype=settlement`,
      { headers: { 'User-Agent': 'KompasSeniora/1.0' }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) {
      console.log(`❌ Nominatim API error: ${res.status}`);
      return null;
    }
    const data = await res.json();
    if (!data.length) {
      console.log(`❌ Nominatim: brak wyników dla "${queryParts.join(', ')}"`);
      return null;
    }

    const result = data[0];
    const state = result.address?.state; // Województwo (np. "Małopolskie", "Mazowieckie")

    console.log(`📍 Nominatim result:`, {
      display_name: result.display_name,
      lat: result.lat,
      lon: result.lon,
      state: state,
      county: result.address?.county,
      city: result.address?.city,
      town: result.address?.town,
      village: result.address?.village
    });

    // Sprawdź czy województwo jest w ENABLED_VOIVODESHIPS
    // Domyślnie true (bezpieczniejsze - jeśli brak state, zakładamy że poza regionem)
    let outOfRegion = true;
    if (state) {
      // Nominatim zwraca "województwo małopolskie" - wytnij prefix "województwo"
      let stateName = state.toLowerCase().replace(/^województwo\s+/, '');
      const normalizedState = normalizePolish(stateName);
      const enabledNormalized = ENABLED_VOIVODESHIPS.map(v => normalizePolish(v).toLowerCase());
      outOfRegion = !enabledNormalized.includes(normalizedState);
      console.log(`🔍 State check: "${state}" → wytnij prefix → "${stateName}" → normalized: "${normalizedState}" → outOfRegion: ${outOfRegion}`);
    } else {
      console.log(`⚠️ Brak 'state' w odpowiedzi Nominatim - domyślnie outOfRegion=true`);
    }

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      state,
      outOfRegion
    };
  } catch (error) {
    console.log(`❌ geocodeCity() error:`, error);
    return null;
  }
}

// Reverse geocoding - zamienia współrzędne GPS na nazwę miasta
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pl`,
      { headers: { 'User-Agent': 'KompasSeniora/1.0' }, next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();

    // Priorytetyzuj: city > town > village > county
    const location = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
    return location || null;
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
    view?: 'list' | 'map';
    partial?: string;
    min?: string;
    max?: string;
    free?: string;
    care?: string;
    sort?: string;
    lat?: string;
    lng?: string;
    near?: string;
    city?: string;  // true when searching for city-only (miasta na prawach powiatu)
    cn?: string;    // city name (from CityCard near=true click, for dynamic distance message)
    spaces?: string; // true = pre-select "only with free spots" filter
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const type = params.type || 'all';
  const initialView = params.view || 'list';

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

  let powiatParam = params.powiat || ''; // let zamiast const - może być auto-assigned przez exact match detection
  const isPartialSearch = params.partial === 'true';
  const cityOnly = params.city === 'true';  // true = szukaj tylko w miejscowości (miasta na prawach powiatu)

  const userLat = params.lat ? parseFloat(params.lat) : null;
  const userLng = params.lng ? parseFloat(params.lng) : null;
  const isNearSearch = params.near === 'true';
  const nearCityParam = params.cn || null; // city name from CityCard near=true click

  console.log('🔍 SEARCH PAGE - Search params:', {
    query: query || '(empty)',
    type,
    wojewodztwo,
    powiatParam: powiatParam || '(empty)',
    isNearSearch,
  });

  let results: any[] = [];
  let terytMatches: any[] = [];
  let message = '';
  let terytPowiats: string[] = [];
  let powiatBreakdown: Record<string, number> = {};
  let powiatSearchCenters: Record<string, { lat: number; lng: number }> = {};

  // 🔧 OPTYMALIZACJA: Pobierz wszystkie placówki RAZ (zamiast 5x w różnych trybach)
  const allFacilities = await prisma.placowka.findMany({
    where: getVoivodeshipFilter({ typ_placowki: { not: 'ŚDS' } }),
    orderBy: { nazwa: 'asc' },
    select: {
      ...PUBLIC_PLACOWKA_SELECT,
      wolneMiejsca: {
        select: { wolne_ogolem: true, oczekujacych: true, data_stanu: true },
        orderBy: { data_stanu: 'desc' },
        take: 5,
      },
    },
  });

  // TRYB 3: GEOLOCATION SEARCH
  if (isNearSearch && userLat && userLng && !query) {
    // ⚠️ ZMIENIONO: 50km → 30km (50km dawało 60 placówek dla Krakowa = za dużo)
    // 30km = ~20 minut jazdy, powinno dać 15-25 placówek
    const DEFAULT_RADIUS_KM = 30;
    const MIN_RESULTS = 3;
    const EXTENDED_RADIUS_KM = 50; // Zmniejszono też extended: 100km → 50km

    // Oblicz dystanse dla wszystkich placówek
    const facilitiesWithDistance = allFacilities.map(facility => {
      const distance = facility.latitude && facility.longitude
        ? calculateDistance(
            userLat,
            userLng,
            parseFloat(facility.latitude.toString()),
            parseFloat(facility.longitude.toString())
          )
        : 999999; // Placówki bez koordynatów na końcu

      return {
        ...facility,
        distance,
      };
    });

    // Sortuj po odległości
    facilitiesWithDistance.sort((a, b) => a.distance - b.distance);

    const getCityGenitive = (city: string) => {
      const genitiveCases: Record<string, string> = {
        'Kraków': 'Krakowa', 'Olkusz': 'Olkusza', 'Tarnów': 'Tarnowa',
        'Nowy Sącz': 'Nowego Sącza', 'Zakopane': 'Zakopanego',
        'Oświęcim': 'Oświęcimia', 'Wieliczka': 'Wieliczki',
        'Wadowice': 'Wadowic', 'Chrzanów': 'Chrzanowa',
        // Śląskie
        'Katowice': 'Katowic', 'Zabrze': 'Zabrza', 'Gliwice': 'Gliwic',
        'Bytom': 'Bytomia', 'Częstochowa': 'Częstochowy', 'Cieszyn': 'Cieszyna',
        'Sosnowiec': 'Sosnowca', 'Rybnik': 'Rybnika', 'Tychy': 'Tychów',
        'Bielsko-Biała': 'Bielska-Białej', 'Chorzów': 'Chorzowa',
      };
      return genitiveCases[city] || city;
    };

    const getPlacowkaForm = (count: number): string => {
      if (count === 1) return 'placówkę';
      const lastDigit = count % 10;
      const lastTwoDigits = count % 100;
      if (lastTwoDigits >= 12 && lastTwoDigits <= 14) return 'placówek';
      if (lastDigit >= 2 && lastDigit <= 4) return 'placówki';
      return 'placówek';
    };

    // ✅ TRYB MIASTO (woj≠'all') — klik z PopularLocations / CityCard
    // Zwracamy WSZYSTKIE placówki województwa posortowane odległościowo.
    // Klient filtruje suwakiem (domyślnie 30km, max 100km).
    // Dzięki temu suwak działa i liczba placówek rośnie przy zwiększaniu dystansu.
    if (wojewodztwo !== 'all') {
      // Klient wygeneruje dynamiczny tekst z getCityGenitive z nearCityGenitive prop
      message = '';
      results = facilitiesWithDistance; // wszystkie — klient filtruje suwakiem
    } else {
      // ✅ TRYB GEOLOKALIZACJA (woj='all') — GPS użytkownika, filtruj na serwerze
      let nearbyFacilities = facilitiesWithDistance.filter(f => f.distance <= DEFAULT_RADIUS_KM);

      if (nearbyFacilities.length < MIN_RESULTS) {
        nearbyFacilities = facilitiesWithDistance.filter(f => f.distance <= EXTENDED_RADIUS_KM);
        const countIn30km = facilitiesWithDistance.filter(f => f.distance <= DEFAULT_RADIUS_KM).length;
        if (countIn30km === 0) {
          message = `W promieniu ${DEFAULT_RADIUS_KM} km nie znaleźliśmy żadnych placówek. Pokazujemy ${nearbyFacilities.length} ${getPlacowkaForm(nearbyFacilities.length)} w promieniu ${EXTENDED_RADIUS_KM} km.`;
        } else {
          message = `Znaleźliśmy tylko ${countIn30km} ${getPlacowkaForm(countIn30km)} w promieniu ${DEFAULT_RADIUS_KM} km. Pokazujemy także ${nearbyFacilities.length - countIn30km} więcej w promieniu ${EXTENDED_RADIUS_KM} km.`;
        }
      } else {
        const userLocationName = await reverseGeocode(userLat, userLng);
        const locationInfo = userLocationName ? ` w okolicy ${getCityGenitive(userLocationName)}` : '';
        message = `Znaleźliśmy ${nearbyFacilities.length} ${getPlacowkaForm(nearbyFacilities.length)} w promieniu ${DEFAULT_RADIUS_KM} km${locationInfo}.`;
      }

      results = nearbyFacilities;
    }
  }
  // TRYB 5: POWIAT ONLY (klik z mapy Małopolski)
  else if (!query && powiatParam && wojewodztwo === 'all') {
    console.log('🗺️ TRYB 5: POWIAT ONLY (klik z mapy)');
    console.log('  powiatParam:', powiatParam);
    console.log('  wojewodztwo:', wojewodztwo);
    console.log('  allFacilities count:', allFacilities.length);

    // Apply city county mapping before filtering
    const mappedPowiat = mapCityCountyToPowiat(powiatParam);
    const normalizedTarget = normalizePolish(mappedPowiat);

    console.log('  mappedPowiat:', mappedPowiat);
    console.log('  normalizedTarget:', normalizedTarget);

    results = allFacilities.filter(facility => {
      const normalizedFacilityPowiat = normalizePolish(facility.powiat);
      return normalizedFacilityPowiat === normalizedTarget || normalizedFacilityPowiat.includes(normalizedTarget);
    });

    console.log('  ✅ Results after filter:', results.length);
    if (results.length === 0) {
      // Debug: Show all unique powiat values in DB
      const uniquePowiats = [...new Set(allFacilities.map(f => f.powiat))].sort();
      console.log('  📋 All unique powiats in DB:', uniquePowiats);
      console.log('  📋 Normalized powiats:');
      uniquePowiats.forEach(p => console.log(`      "${p}" → "${normalizePolish(p)}"`));
    }

    message = '';
  }
  // TRYB 4: WOJEWÓDZTWO ONLY (RegionModal)
  else if (!query && wojewodztwo !== 'all') {
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
      // ✅ NIE filtruj po powiatParam w zapytaniu TERYT - chcemy zobaczyć WSZYSTKIE
      // miejscowości o danej nazwie, żeby móc sugerować alternatywy
      // if (powiatParam) baseWhere.powiat = powiatParam;

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
      // LUB zaczyna się od zapytania (np. "Kwaśniów" → "Kwaśniów Górny", "Kwaśniów Dolny")
      // Jeśli nie (tylko partial w środku: np. "opole" matchuje "Nowopole", "Wielopole") →
      // miejscowość o tej nazwie nie istnieje w Małopolsce
      const hasExactOrPrefixMatch = terytMatches.some(
        (t: any) => {
          const normalized = normalizePolish(t.nazwa);
          return normalized === normalizedQuery || normalized.startsWith(normalizedQuery + ' ');
        }
      );

      if (terytMatches.length === 0 || !hasExactOrPrefixMatch) {
        results = [];
        const displayQuery = query.charAt(0).toUpperCase() + query.slice(1);
        message = `Miejscowość „${displayQuery}" nie istnieje w Małopolsce. Wpisz nazwę miejscowości z terenu Małopolski.`;
      } else {

      // Pobierz UNIKALNE powiaty gdzie szukana miejscowość istnieje
      // Używamy Set aby usunąć duplikaty z bazy TERYT
      // 🔧 FILTR: Tylko główne miejscowości (RM=01,96,98,03) - eliminuje części wsi (RM=00)
      const mainLocations = terytMatches.filter((t: any) =>
        ['01', '96', '98', '03'].includes(t.rodzaj_miejscowosci || '')
      );
      terytPowiats = [...new Set(mainLocations.map((t: any) => t.powiat))].sort();

      // AUTO-ASSIGN powiat gdy exact match (Opcja 1 - fallback dla szybkich userów)
      // Jeśli user wpisał np. "Olkusz" i kliknął Enter zanim załadowały się sugestie,
      // automatycznie przypisz powiat z TERYT exact match
      // ✅ WYŁĄCZ dla miast na prawach powiatu (Kraków, Nowy Sącz, Tarnów)
      // ✅ WYŁĄCZ gdy cityOnly=true (klik na miasto z mapy homepage)
      const isCityCountyQuery = ['krakow', 'nowy sacz', 'tarnow'].includes(normalizedQuery);

      if (!powiatParam && terytMatches.length > 0 && !isCityCountyQuery && !cityOnly) {
        const exactMatches = terytMatches.filter((t: any) =>
          normalizePolish(t.nazwa) === normalizedQuery
        );

        if (exactMatches.length > 0) {
          // Priorytetyzuj miasta na prawach powiatu (gdy miasto = powiat, np. "m. Kraków")
          // To unika wybrania wsi "Kraków" w pow. tarnowskim zamiast miasta Kraków
          const cityCountyMatch = exactMatches.find((t: any) => {
            const normalizedPowiat = normalizePolish(t.powiat);
            return normalizedPowiat.includes(normalizedQuery) || normalizedQuery.includes(normalizedPowiat);
          });

          powiatParam = cityCountyMatch ? cityCountyMatch.powiat : exactMatches[0].powiat;
        }
      }

      // NOWA LOGIKA: Rozróżniamy czy user wybrał z dropdownu czy kliknął "Szukaj"
      let uniquePowiaty: string[];

      if (powiatParam) {
        // User WYBRAŁ konkretny powiat z dropdownu → użyj tylko tego
        // MAPOWANIE: "m. Kraków" / "Kraków" (TERYT/dropdown) → "krakowski" (baza placówek)
        // Analogicznie dla innych miast na prawach powiatu
        const mappedPowiat = mapCityCountyToPowiat(powiatParam);
        uniquePowiaty = [normalizePolish(mappedPowiat)];
      } else {
        // ✅ OPCJA 1b: User WPISAŁ i kliknął "Szukaj" bez wyboru → pokaż TYLKO powiaty z GŁÓWNYCH miejscowości
        // Filtrujemy tylko RM=01,96,98 aby banner nie pokazywał powiatów z "części"
        const mainTerytMatches = terytMatches.filter((t: any) =>
          ['01', '96', '98'].includes(t.rodzaj_miejscowosci || '')
        );

        // Mapuj powiaty z TERYT na powiaty w bazie placówek (miasta na prawach powiatu)
        const terytPowiaty = [...new Set(mainTerytMatches.map((t: any) => t.powiat))];
        const mappedPowiaty = terytPowiaty.map(mapCityCountyToPowiat);

        uniquePowiaty = [...new Set(mappedPowiaty.map(p => normalizePolish(p)))];
      }

      // ⚠️ NOWA LOGIKA: Zawsze zwracaj wszystkie z województwa gdy jest query
      // Client-side będzie filtrował po powiecie i odległości slider
      // To pozwala userowi dynamicznie zmieniać filtry bez re-fetchu

      // Zwróć wszystkie placówki z województwa
      results = allFacilities.filter(facility => {
        if (wojewodztwo !== 'all') {
          const normalizedFacilityWoj = normalizePolish(facility.wojewodztwo);
          const normalizedTargetWoj = normalizePolish(wojewodztwo);
          return normalizedFacilityWoj === normalizedTargetWoj;
        }
        return true;
      });

      // ✅ CITY ONLY MODE: Filtruj tylko placówki w tej miejscowości (miasta na prawach powiatu)
      // Gdy klikamy na miasto Kraków na mapie, pokazuj tylko placówki gdzie miejscowosc="Kraków"
      if (cityOnly && query) {
        results = results.filter(facility => {
          return facility.miejscowosc === query;
        });
        console.log(`🏙️ CITY ONLY MODE: "${query}" → ${results.length} placówek`);
      }

        // ✅ ROZDZIELENIE LOGIKI:
        // 1. powiatBreakdown - TYLKO gdy user NIE wybrał konkretnego powiatu (dla banneru informacyjnego)
        // 2. powiatSearchCenters - ZAWSZE gdy miejscowość w wielu powiatach (dla client-side zmiany powiatu)

        // 1. Banner informacyjny - tylko gdy user nie wybrał konkretnego powiatu
        if (!powiatParam && uniquePowiaty.length > 1) {
          for (const facility of results) {
            const powiat = facility.powiat;
            powiatBreakdown[powiat] = (powiatBreakdown[powiat] || 0) + 1;
          }
        }

        // 2. Współrzędne dla wszystkich powiatów - GEOKODUJ miejscowość w każdym powiecie
        // To pozwala client-side dynamicznie zmieniać pulsujący punkt gdy user zmienia filtr powiatu
        // Używamy geocodeCity() zamiast współrzędnych pierwszej placówki (bo Zarzecze to nie placówka!)
        if (terytPowiats && terytPowiats.length > 1) {
          // Geokoduj równolegle dla wszystkich powiatów (cache przez Next.js revalidate)
          const geocodePromises = terytPowiats.map(async (terytPowiat) => {
            const mappedPowiat = mapCityCountyToPowiat(terytPowiat);
            const coords = await geocodeCity(
              query,
              mappedPowiat,
              wojewodztwo !== 'all' ? wojewodztwo : undefined
            );
            return { powiat: mappedPowiat, coords };
          });

          const geocodedPowiats = await Promise.all(geocodePromises);

          for (const { powiat, coords } of geocodedPowiats) {
            if (coords) {
              powiatSearchCenters[powiat] = coords;
            }
          }
        }

        const facilityWord = type === 'dps' ? 'DPS' : type === 'sds' ? 'ŚDS' : 'domy opieki';

        if (results.length === 0) {
          // Brak placówek w znalezionych powiatach
          const displayQuery = query.charAt(0).toUpperCase() + query.slice(1);
          const wojewodztwoInfo = wojewodztwo === 'all' ? '' : ` (${wojewodztwoName})`;

          // PRZYPADEK 1: User wybrał konkretny powiat z autocomplete
          if (powiatParam) {
            // Sprawdź czy miejscowość istnieje w innych powiatach (potencjalne alternatywy)
            const otherPowiats = terytPowiats.filter(p => normalizePolish(p) !== normalizePolish(powiatParam));

            if (otherPowiats.length > 0) {
              // Miejscowość istnieje w innych lokalizacjach - zasugeruj je
              const suggestions = otherPowiats.map(p => {
                // Czytelne wyświetlanie nazw powiatów
                const norm = normalizePolish(p);
                if (norm === 'm. krakow') return 'miasto Kraków';
                if (norm === 'm. nowy sacz') return 'miasto Nowy Sącz';
                if (norm === 'm. tarnow') return 'miasto Tarnów';
                // Dla zwykłych powiatów dodaj "powiat"
                return `powiat ${p}`;
              }).join(' lub ');

              message = `Nie znaleźliśmy ${facilityWord} w miejscowości "${displayQuery}" (powiat ${powiatParam}). Czy chodziło Ci o ${suggestions}?`;
            } else {
              // Miejscowość istnieje tylko w jednym powiecie
              message = `Nie znaleźliśmy ${facilityWord} w miejscowości "${displayQuery}" (powiat ${powiatParam})${wojewodztwoInfo}.`;
            }
          }
          // PRZYPADEK 2: User kliknął "Szukaj" bez wyboru konkretnego powiatu
          else {
            if (uniquePowiaty.length > 1) {
              // Przeszukano wiele powiatów - pokaż które
              const displayPowiats = terytPowiats.map(p => {
                const norm = normalizePolish(p);
                if (norm === 'm. krakow') return 'm. Kraków';
                if (norm === 'm. nowy sacz') return 'm. Nowy Sącz';
                if (norm === 'm. tarnow') return 'm. Tarnów';
                return p;
              }).join(', ');
              message = `Nie znaleźliśmy ${facilityWord} w okolicy miejscowości "${displayQuery}". Przeszukaliśmy powiaty: ${displayPowiats}${wojewodztwoInfo}.`;
            } else if (uniquePowiaty.length === 1) {
              // Przeszukano jeden powiat
              const displayPowiat = terytPowiats.length > 0 ? terytPowiats[0] : uniquePowiaty[0];
              message = `Nie znaleźliśmy ${facilityWord} w miejscowości "${displayQuery}" (powiat ${displayPowiat})${wojewodztwoInfo}.`;
            } else {
              // Fallback (nie powinno się zdarzyć)
              message = `Nie znaleźliśmy ${facilityWord} dla "${displayQuery}"${wojewodztwoInfo}.`;
            }
          }
        } else {
          message = '';
        }
      } // koniec else (hasExactNameMatch)
    }
    // BEZ TERYT (fallback dla województw bez danych TERYT)
    else {
      // FIX: Jeśli brak województwa ALE jest query tekstowy → domyślnie Małopolska
      // Zapobiega znalezieniu miast poza obsługiwanym regionem (np. Olsztyn na mapie)
      const effectiveWojewodztwo = wojewodztwo === 'all' && query ? 'małopolskie' : wojewodztwo;
      const wojewodztwoDbName = effectiveWojewodztwo;

      results = allFacilities.filter(facility => {
        if (effectiveWojewodztwo !== 'all') {
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
  // TRYB 6: BRAK PARAMETRÓW (przycisk "Wszystkie miasta")
  else {
    console.log('📋 TRYB 6: WSZYSTKIE PLACÓWKI (brak parametrów)');
    results = allFacilities;
    message = '';
  }

  // FILTROWANIE PO TYPIE (DPS / ŚDS)
  // ⚠️ UWAGA: W bazie wartości to "DPS" i "ŚDS" (z polskim znakiem Ś!)
  if (type === 'dps') {
    results = results.filter(f => f.typ_placowki === 'DPS');
  } else if (type === 'sds') {
    results = results.filter(f => f.typ_placowki === 'ŚDS');
  }

  // FILTROWANIE PO CENIE
  const minPrice = params.min ? parseInt(params.min) : undefined;
  const maxPrice = params.max ? parseInt(params.max) : undefined;
  const showFree = params.free === 'true';
  const onlyFreeSpaces = params.spaces === 'true';

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
  let searchCenter = query ? await geocodeCity(
    query,
    powiatParam || undefined,
    wojewodztwo !== 'all' ? wojewodztwo : undefined
  ) : null;

  // 🎯 OPTYMALIZACJA: Jeśli są placówki w wynikach - użyj współrzędnych pierwszej placówki
  // zamiast Nominatim (bardziej precyzyjny punkt, zawsze w centrum miasta!)
  // ⚠️ ALE: tylko jeśli pierwsza placówka jest w TYM SAMYM mieście co query
  // (żeby nie nadpisać hardcoded współrzędnych miasta współrzędnymi placówki z innego miasta!)
  if (sortedResults.length > 0 && sortedResults[0].latitude && sortedResults[0].longitude) {
    const firstFacility = sortedResults[0];
    const normalizedFacilityCity = normalizePolish(firstFacility.miejscowosc).toLowerCase();
    const normalizedQueryCity = normalizePolish(query).toLowerCase();

    // Użyj współrzędnych placówki TYLKO gdy jest w tym samym mieście co query
    if (normalizedFacilityCity === normalizedQueryCity) {
      console.log(`🎯 Używam współrzędnych pierwszej placówki jako searchCenter: "${firstFacility.nazwa}" (${firstFacility.miejscowosc})`);
      searchCenter = {
        lat: parseFloat(firstFacility.latitude.toString()),
        lng: parseFloat(firstFacility.longitude.toString()),
        state: firstFacility.wojewodztwo,
        outOfRegion: false, // Jeśli placówka jest w wynikach, to na pewno w regionie
      };
    } else {
      console.log(`⏭️ Pierwsza placówka jest w innym mieście (${firstFacility.miejscowosc} ≠ ${query}) - zostawiam searchCenter z geocodingu`);
    }
  }

  // 🚫 NIE pokazuj searchCenter jeśli miasto jest poza obsługiwanym regionem
  const validSearchCenter = searchCenter && !searchCenter.outOfRegion ? searchCenter : null;

  // Genitivus nazwy miasta dla dynamicznego komunikatu odległości (near=true, klik z CityCard)
  const GENITIVE_MAP: Record<string, string> = {
    'Kraków': 'Krakowa', 'Olkusz': 'Olkusza', 'Tarnów': 'Tarnowa',
    'Nowy Sącz': 'Nowego Sącza', 'Zakopane': 'Zakopanego',
    'Oświęcim': 'Oświęcimia', 'Wieliczka': 'Wieliczki',
    'Wadowice': 'Wadowic', 'Chrzanów': 'Chrzanowa',
    'Katowice': 'Katowic', 'Zabrze': 'Zabrza', 'Gliwice': 'Gliwic',
    'Bytom': 'Bytomia', 'Częstochowa': 'Częstochowy', 'Cieszyn': 'Cieszyna',
    'Sosnowiec': 'Sosnowca', 'Rybnik': 'Rybnika', 'Tychy': 'Tychów',
    'Bielsko-Biała': 'Bielska-Białej', 'Chorzów': 'Chorzowa',
  };
  const nearCityGenitive = nearCityParam ? (GENITIVE_MAP[nearCityParam] ?? nearCityParam) : null;

  // ⚠️ WYKRYJ: user szukał stolicę Polski ALE wybrał z autocomplete (powiat znany)
  // Pokazujemy ostrzeżenie "to część wsi, nie stolica!"
  const normalizedQuery = normalizePolish(query).toLowerCase();
  const isCapitalCity = CAPITAL_CITIES_BLACKLIST.includes(normalizedQuery);
  const capitalCityWarning = isCapitalCity && powiatParam && sortedResults.length > 0
    ? { cityName: query, powiat: powiatParam }
    : undefined;

  console.log('📤 Passing to SearchResults:', {
    query: query || '(empty)',
    resultsCount: sortedResults.length,
    message,
    searchCenter: validSearchCenter ? 'yes' : 'undefined',
    powiatParam: powiatParam || '(empty)',
  });

  return (
    <SearchResults
      query={query}
      type={type}
      results={sortedResults}
      message={message}
      terytPowiats={terytPowiats.length > 0 ? terytPowiats : undefined}
      searchCenter={validSearchCenter ? {
        ...validSearchCenter,
        name: query,
        isPartOfVillage: isCapitalCity && !!powiatParam // Flaguj że to część wsi o nazwie stolicy
      } : undefined}
      capitalCityWarning={capitalCityWarning}
      nearCityGenitive={nearCityGenitive ?? undefined}
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
        onlyFreeSpaces: onlyFreeSpaces || undefined,
      }}
      initialView={initialView}
    />
  );
}
