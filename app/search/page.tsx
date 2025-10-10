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
  const wojewodztwo = params.woj || 'malopolskie';
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

    // Szukaj w TERYT - EXACT lub PARTIAL match
    const terytWhere: any = isPartialSearch 
      ? {
          // PARTIAL: zawiera query (jak autocomplete)
          nazwa_normalized: {
            contains: normalizedQuery
          }
        }
      : {
          // EXACT: dokładnie równe
          nazwa_normalized: normalizedQuery
        };

    // Filtr województwa - MUSIMY ZNORMALIZOWAĆ BO W BAZIE SĄ POLSKIE ZNAKI
    if (wojewodztwo) {
      // Mapowanie URL param → nazwa w bazie
      const wojewodztwoMap: Record<string, string> = {
        'malopolskie': 'małopolskie',
        'slaskie': 'śląskie',
        'mazowieckie': 'mazowieckie',
        'dolnoslaskie': 'dolnośląskie',
        'wielkopolskie': 'wielkopolskie',
      };
      terytWhere.wojewodztwo = wojewodztwoMap[wojewodztwo] || wojewodztwo;
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
      // Filtr typu placówki - exact match zamiast contains
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

      // Filtruj po powiatach - EXACT MATCH
      results = allFacilities.filter(facility => {
        const normalizedFacilityPowiat = normalizePolish(facility.powiat);
        const matches = uniquePowiaty.some(powiat => 
          normalizedFacilityPowiat === powiat
        );
        if (matches) {
          console.log('  ✓ Matched facility:', facility.nazwa, 'in', facility.powiat);
        }
        return matches;
      });

      console.log('🔍 Results after powiat filter:', results.length);

      // Komunikaty
      const locationCount = terytMatches.length;
      const facilityWord = type === 'dps' ? 'DPS' : type === 'sds' ? 'ŚDS' : 'domy opieki';
      const wojewodztwoName = wojewodztwo === 'slaskie' ? 'Śląskie' : 'Małopolskie';
      
      if (results.length > 0) {
        if (locationCount > 1) {
          // Policz placówki per powiat
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
        const nearbyWhere: any = typeFilter;
        
        // Szukaj w tym samym województwie
        const nearbyFacilities = await prisma.placowka.findMany({
          where: nearbyWhere,
          select: { powiat: true },
          distinct: ['powiat'],
          take: 5,
        });

        const powiatySuggestions = nearbyFacilities.map(f => f.powiat).join(', ');
        message = `Nie znaleźliśmy ${facilityWord} w ${uniquePowiaty.join(', ')} (${wojewodztwoName}). Spróbuj wyszukać w: ${powiatySuggestions}`;
      }
    } else {
      const wojewodztwoName = wojewodztwo === 'slaskie' ? 'Śląskim' : 'Małopolsce';
      const searchType = isPartialSearch ? 'zawierających' : 'o nazwie';
      message = `Nie znaleźliśmy miejscowości ${searchType} "${query}" w ${wojewodztwoName}. Spróbuj wpisać inną nazwę.`;
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