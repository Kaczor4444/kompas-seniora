import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculateMatchScore, normalizePolishString } from '@/lib/teryt';

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

    // If no results, check TERYT database for suggestions
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
        const match = terytMatches[0];
        terytSuggestion = {
          found: true,
          nazwa: match.nazwa,
          typ: match.typ,
          powiat: match.powiat,
          message: `Rozpoznano lokalizację: ${match.nazwa} (${match.typ}, powiat ${match.powiat}). Nie znaleziono placówek w tej lokalizacji.`
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