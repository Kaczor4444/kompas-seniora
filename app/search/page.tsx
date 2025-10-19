import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SearchResults from '@/components/SearchResults';

interface SearchPageProps {
  searchParams: Promise<{ 
    q?: string; 
    type?: string;
    woj?: string;
    powiat?: string;
    partial?: string;
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
  const wojewodztwo = params.woj || 'all'; // ✅ CHANGED: domyślnie 'all' zamiast 'malopolskie'
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

    // ✅ NEW: Sprawdź czy województwo ma dane TERYT
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
    const hasTerytData = wojewodztwo === 'malopolskie' || wojewodztwo === 'all';

    console.log('  hasTerytData:', hasTerytData);

    // ✅ TRYB 1: Z TERYT (Małopolskie)
    if (hasTerytData && wojewodztwo !== 'all') {
      // Szukaj w TERYT - EXACT lub PARTIAL match
      const terytWhere: any = isPartialSearch 
        ? {
            nazwa_normalized: { contains: normalizedQuery }
          }
        : {
            nazwa_normalized: normalizedQuery
          };

      // Filtr województwa
      if (wojewodztwo !== 'all') {
        terytWhere.wojewodztwo = wojewodztwoDbName;
      }

      // Filtr powiatu (jeśli wybrany)
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

      // Zbierz unikalne powiaty
      let uniquePowiaty = [...new Set(terytMatches.map(t => normalizePolish(t.powiat)))];
      console.log('🔍 Unique powiaty:', uniquePowiaty);

      // Mapowanie wariantów powiatów - Kraków miasto + powiat
      const powiatMapping: Record<string, string[]> = {
        'krakow': ['krakow', 'krakowski'],
        'm. krakow': ['krakow', 'krakowski'],
        'krakowski': ['krakow', 'krakowski'],
      };

      // Rozszerz uniquePowiaty o wszystkie warianty
      uniquePowiaty = [...new Set(uniquePowiaty.flatMap(p => 
        powiatMapping[p] || [p]
      ))];
      console.log('🔍 Unique powiaty (expanded):', uniquePowiaty);

      if (uniquePowiaty.length > 0) {
        // Filtr typu placówki
        const typeFilter = type === 'dps' 
          ? { typ_placowki: 'DPS' }
          : (type === 'sds' || type === 'śds')
          ? { typ_placowki: 'ŚDS' }
          : {};

        console.log('🔍 Type filter:', typeFilter);

        // Pobierz placówki z filtrem typu
        const allFacilities = await prisma.placowka.findMany({
          where: typeFilter,
          orderBy: { nazwa: 'asc' },
        });

        console.log('🔍 All facilities (before powiat filter):', allFacilities.length);

        // Filtruj po powiatach - CONTAINS zamiast EXACT
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

        // Komunikaty
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
          // Brak placówek - sugeruj sąsiednie powiaty
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
    // ✅ TRYB 2: BEZ TERYT (Śląskie lub 'all') - bezpośrednie szukanie w miejscowosc
    else {
      console.log('🔍 NO TERYT MODE - Direct search in Placowka.miejscowosc');

      // Filtr typu placówki
      const where: any = type === 'dps' 
        ? { typ_placowki: 'DPS' }
        : (type === 'sds' || type === 'śds')
        ? { typ_placowki: 'ŚDS' }
        : {};

      console.log('🔍 Direct WHERE (before woj filter):', JSON.stringify(where, null, 2));

      // ✅ FIX: Pobierz wszystkie placówki NAJPIERW (bez filtra woj)
      const allFacilities = await prisma.placowka.findMany({
        where,
        orderBy: { nazwa: 'asc' },
      });

      console.log('🔍 All facilities (total):', allFacilities.length);

      // Pokaż przykładowe województwa w bazie (debug)
      const uniqueWoj = [...new Set(allFacilities.map(f => f.wojewodztwo))];
      console.log('🔍 Unique wojewodztwa in DB:', uniqueWoj);

      // ✅ FIX: Filtruj po województwie I miejscowości (case-insensitive)
      results = allFacilities.filter(facility => {
        // Filtr województwa (case-insensitive)
        if (wojewodztwo !== 'all') {
          const normalizedFacilityWoj = normalizePolish(facility.wojewodztwo);
          const normalizedTargetWoj = normalizePolish(wojewodztwoDbName);
          
          if (normalizedFacilityWoj !== normalizedTargetWoj) {
            return false; // Nie pasuje województwo
          }
        }

        // Filtr miejscowości - CONTAINS match
        const normalizedMiejscowosc = normalizePolish(facility.miejscowosc);
        const matches = normalizedMiejscowosc.includes(normalizedQuery);
        
        if (matches) {
          console.log('  ✓ Matched facility:', facility.nazwa, 'in', facility.miejscowosc, '(woj:', facility.wojewodztwo + ')');
        }
        return matches;
      });

      console.log('🔍 Results after miejscowosc filter:', results.length);

      // Komunikaty
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

  console.log('🔍 DEBUG Search Page END');
  console.log('  Final results:', results.length);
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
        <SearchResults 
          query={query}
          type={type}
          results={results}
          message={message}
        />
      </main>
    </div>
  );
}