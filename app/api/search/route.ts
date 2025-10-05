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

    // Get all matching placówki (filter by type first)
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

    // If no search query, return all (sorted by name)
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
      .filter(result => result.score > 0) // Only matches
      .sort((a, b) => b.score - a.score); // Best matches first

    await prisma.$disconnect();
    
    // Return without score field
    return NextResponse.json(scoredResults.map(({ score, ...placowka }) => placowka));

  } catch (error) {
    console.error('Search API error:', error);
    await prisma.$disconnect();
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}