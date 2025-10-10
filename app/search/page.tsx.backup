import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SearchResults from '@/components/SearchResults';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
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

  let results: any[] = [];
  let terytMatches: any[] = [];
  let message = '';

  if (query) {
    const normalizedQuery = normalizePolish(query.trim());

    // Szukaj w TERYT po znormalizowanej nazwie - EXACT MATCH
    terytMatches = await prisma.terytLocation.findMany({
      where: {
        nazwa_normalized: normalizedQuery,
      },
      select: {
        powiat: true,
        gmina: true,
        nazwa: true,
      },
    });

    // Zbierz unikalne powiaty
    let uniquePowiaty = [...new Set(terytMatches.map(t => normalizePolish(t.powiat)))];

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

    if (uniquePowiaty.length > 0) {
      // Filtr typu placówki - exact match zamiast contains
      const typeFilter = type === 'dps' 
        ? { typ_placowki: 'DPS' }
        : (type === 'sds' || type === 'śds')
        ? { typ_placowki: 'ŚDS' }
        : {};

      // Pobierz placówki z filtrem typu
      const allFacilities = await prisma.placowka.findMany({
        where: typeFilter,
        orderBy: { nazwa: 'asc' },
      });

      // Filtruj po powiatach - EXACT MATCH
      results = allFacilities.filter(facility => {
        const normalizedFacilityPowiat = normalizePolish(facility.powiat);
        return uniquePowiaty.some(powiat => 
          normalizedFacilityPowiat === powiat
        );
      });

      // Komunikaty
      const locationCount = terytMatches.length;
      const facilityWord = type === 'dps' ? 'DPS' : type === 'sds' ? 'ŚDS' : 'domy opieki';
      
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
          
          message = `Miejscowość "${query}" znaleziona w ${locationCount} powiatach. Pokazujemy ${facilityWord} ze wszystkich lokalizacji: ${facilitiesPerPowiat}.`;
        } else {
          message = `Znaleźliśmy ${facilityWord} w okolicy miejscowości ${terytMatches[0].nazwa}.`;
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
        message = `Nie znaleźliśmy ${facilityWord} w ${uniquePowiaty.join(', ')}. Spróbuj wyszukać w: ${powiatySuggestions}`;
      }
    } else {
      message = `Nie znaleźliśmy miejscowości "${query}" w Małopolsce. Spróbuj wpisać inną nazwę.`;
    }
  }

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