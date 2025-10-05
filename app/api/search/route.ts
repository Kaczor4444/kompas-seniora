import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateMatchScore } from '@/lib/teryt';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const typ = searchParams.get('typ') || 'all';

    // Build type filter
    const whereClause: any = {};
    if (typ !== 'all' && typ !== 'WSZYSTKIE') {
      whereClause.typ_placowki = { contains: typ };
    }

    // Get all matching placówki
    const allPlacowki = await prisma.placowka.findMany({
      where: whereClause,
      select: {
        id: true,
        nazwa: true,
        typ_placowki: true,
        miejscowosc: true,
        gmina: true,
        powiat: true,
        wojewodztwo: true,
        ulica: true,
        kod_pocztowy: true,
        telefon: true,
        email: true,
        www: true,
        koszt_pobytu: true,
        liczba_miejsc: true,
      },
    });

    // If no search query, return all
    if (!query || query.trim() === '') {
      await prisma.$disconnect();
      return NextResponse.json(allPlacowki.sort((a, b) => a.nazwa.localeCompare(b.nazwa)));
    }

    // Apply TERYT fuzzy search with scoring
    const scoredResults = allPlacowki
      .map(placowka => ({
        ...placowka,
        score: calculateMatchScore(query, {
          nazwa: placowka.nazwa,
          miejscowosc: placowka.miejscowosc,
          gmina: placowka.gmina,
          powiat: placowka.powiat,
        }),
      }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score);

    // If no results, check TERYT database for smart suggestions
    let terytSuggestion = null;
    if (scoredResults.length === 0) {
      const terytLocations = await prisma.terytLocation.findMany();
      const terytMatches = terytLocations
        .map(loc => ({
          ...loc,
          score: calculateMatchScore(query, {
            nazwa: loc.nazwa,
            gmina: loc.gmina || undefined,
            powiat: loc.powiat,
          }),
        }))
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score);

      if (terytMatches.length > 0) {
        const topMatch = terytMatches[0];
        
        // Get unique powiaty from TERYT matches
        const matchedPowiaty = [...new Set(terytMatches.map(m => m.powiat))];
        
        // Check which powiaty have placówki (with type filter)
        const powiatsWithPlacowki = await Promise.all(
          matchedPowiaty.map(async (powiat) => {
            const count = await prisma.placowka.count({
              where: {
                ...whereClause,
                powiat
              }
            });
            return { powiat, count };
          })
        );

        const availablePowiaty = powiatsWithPlacowki.filter(p => p.count > 0);

        // If found placówki in ANY matching powiat, return those
        if (availablePowiaty.length > 0) {
          const placowkiInMatchedPowiaty = await prisma.placowka.findMany({
            where: {
              ...whereClause,
              powiat: { in: availablePowiaty.map(p => p.powiat) }
            },
            select: {
              id: true,
              nazwa: true,
              typ_placowki: true,
              miejscowosc: true,
              gmina: true,
              powiat: true,
              wojewodztwo: true,
              ulica: true,
              kod_pocztowy: true,
              telefon: true,
              email: true,
              www: true,
              koszt_pobytu: true,
              liczba_miejsc: true,
            },
          });

          await prisma.$disconnect();
          return NextResponse.json({
            results: placowkiInMatchedPowiaty,
            terytSuggestion: {
              found: true,
              nazwa: topMatch.nazwa,
              typ: topMatch.typ,
              powiat: topMatch.powiat,
              locationsCount: terytMatches.length,
              message: terytMatches.length > 1 
                ? `Znaleziono ${terytMatches.length} lokalizacje "${topMatch.nazwa}". Pokazano placówki ze wszystkich dopasowanych powiatów.`
                : `Placówki w lokalizacji: ${topMatch.nazwa} (${topMatch.typ}, powiat ${topMatch.powiat})`
            },
            query: query
          });
        }

        // No placówki in any matched powiat - suggest nearby powiaty
        const allPowiatsWithCounts = await prisma.placowka.groupBy({
          by: ['powiat'],
          where: whereClause,
          _count: { id: true }
        });

        const nearbyPowiaty = allPowiatsWithCounts
          .map(p => ({ powiat: p.powiat, count: p._count.id }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        terytSuggestion = {
          found: true,
          nazwa: topMatch.nazwa,
          typ: topMatch.typ,
          powiat: topMatch.powiat,
          locationsCount: terytMatches.length,
          nearbyPowiaty: nearbyPowiaty,
          message: terytMatches.length > 1
            ? `Rozpoznano ${terytMatches.length} lokalizacje "${topMatch.nazwa}" w różnych powiatach. Niestety, żadna z nich nie ma placówek.`
            : `Rozpoznano lokalizację: ${topMatch.nazwa} (${topMatch.typ}, powiat ${topMatch.powiat}). Brak placówek w tym powiecie.`
        };
      }
    }

    await prisma.$disconnect();
    return NextResponse.json({
      results: scoredResults.map(({ score, ...placowka }) => placowka),
      terytSuggestion,
      query: query
    });
  } catch (error) {
    console.error('Search API error:', error);
    await prisma.$disconnect();
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}