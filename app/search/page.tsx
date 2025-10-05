import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import SearchResults from '@/components/SearchResults';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

// Normalizacja polskich znaków
function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0142]/g, 'l')
    .replace(/[\u0141]/g, 'l')
    .replace(/[\u0105]/g, 'a')
    .replace(/[\u0104]/g, 'a')
    .replace(/[\u0119]/g, 'e')
    .replace(/[\u0118]/g, 'e')
    .replace(/[\u015B]/g, 's')
    .replace(/[\u015A]/g, 's')
    .replace(/[\u0107]/g, 'c')
    .replace(/[\u0106]/g, 'c')
    .replace(/[\u017C\u017A]/g, 'z')
    .replace(/[\u017B\u0179]/g, 'z')
    .replace(/[\u0144]/g, 'n')
    .replace(/[\u0143]/g, 'n')
    .replace(/[\u00F3]/g, 'o')
    .replace(/[\u00D3]/g, 'o');
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

    // 1. Szukaj w TERYT
    terytMatches = await prisma.terytLocation.findMany({
      where: {
        nazwa: {
          contains: normalizedQuery,
        },
      },
      select: {
        powiat: true,
        gmina: true,
        nazwa: true,
      },
    });

    // 2. Zbierz unikalne powiaty
    const uniquePowiaty = [...new Set(terytMatches.map(t => normalizePolish(t.powiat)))];

    if (uniquePowiaty.length > 0) {
      // 3. Szukaj placówek w znalezionych powiatach
      const typeFilter = type === 'dps' 
        ? { typ_placowki: { contains: 'DPS' } }
        : type === 'sds'
        ? { typ_placowki: { contains: 'ŚDS' } }
        : {};

      // Pobierz wszystkie placówki z tym filtrem typu
      const allFacilities = await prisma.placowka.findMany({
        where: typeFilter,
        orderBy: { nazwa: 'asc' },
      });

      // Filtruj po znormalizowanych powiatach (w pamięci)
      results = allFacilities.filter(facility => {
        const normalizedFacilityPowiat = normalizePolish(facility.powiat);
        return uniquePowiaty.some(powiat => 
          normalizedFacilityPowiat.includes(powiat) || powiat.includes(normalizedFacilityPowiat)
        );
      });

      // 4. Komunikaty
      const locationCount = terytMatches.length;
      const facilityWord = type === 'dps' ? 'DPS' : type === 'sds' ? 'ŚDS' : 'domy opieki';

      if (results.length > 0) {
        if (locationCount > 1) {
          message = `Jest ${locationCount} ${locationCount === 1 ? 'miejscowość' : locationCount < 5 ? 'miejscowości' : 'miejscowości'} ${query} w Małopolsce. Znaleźliśmy ${facilityWord} w kilku z nich.`;
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

        const suggestions = nearbyFacilities.map(f => f.powiat).join(', ');
        message = `Nie znaleźliśmy ${facilityWord} w okolicy miejscowości ${query}. Spróbuj wyszukać w pobliskich powiatach: ${suggestions}.`;
      }
    } else {
      message = `Nie znaleźliśmy miejscowości "${query}" w Małopolsce. Spróbuj wpisać inną nazwę.`;
    }
  }

  const typeLabel = type === 'dps' ? 'DPS' : type === 'sds' ? 'ŚDS' : 'wszystkie';
  const resultsCount = results.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-accent-600">
            kompaseniora.pl
          </Link>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <form action="/search" method="GET" className="flex gap-3">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Wpisz miejscowość..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <input type="hidden" name="type" value={type} />
            <button
              type="submit"
              className="px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 font-medium"
            >
              Szukaj
            </button>
          </form>

          {/* Type filters */}
          <div className="mt-4 flex gap-2">
            <Link
              href={`/search?q=${query}&type=all`}
              className={`px-4 py-2 rounded-lg ${
                type === 'all'
                  ? 'bg-accent-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Wszystkie
            </Link>
            <Link
              href={`/search?q=${query}&type=dps`}
              className={`px-4 py-2 rounded-lg ${
                type === 'dps'
                  ? 'bg-accent-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              DPS
            </Link>
            <Link
              href={`/search?q=${query}&type=sds`}
              className={`px-4 py-2 rounded-lg ${
                type === 'sds'
                  ? 'bg-accent-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ŚDS
            </Link>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {query && (
          <>
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Wyniki dla: &ldquo;{query}&rdquo;
                {type !== 'all' && (
                  <span className="text-accent-600"> • Typ: {typeLabel}</span>
                )}
              </h1>
              <p className="text-gray-600">
                Znaleziono {resultsCount} {resultsCount === 1 ? 'placówkę' : 'placówek'}
              </p>
            </div>

            {/* Client Component z mapą */}
            <SearchResults 
              results={results}
              message={message}
              resultsCount={resultsCount}
            />
          </>
        )}

        {!query && (
          <div className="text-center py-12">
            <p className="text-gray-600">Wpisz miejscowość aby wyszukać placówki</p>
          </div>
        )}
      </div>
    </div>
  );
}