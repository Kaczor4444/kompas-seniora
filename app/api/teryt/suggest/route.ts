// app/api/teryt/suggest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Funkcja normalizacji polskich znaków (już masz w projekcie)
function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const wojewodztwo = searchParams.get('woj') || '';
    const powiat = searchParams.get('powiat') || '';
    const typ = searchParams.get('typ') || ''; // "DPS" lub "ŚDS"

    // Minimum 2 znaki
    if (query.length < 2) {
      return NextResponse.json({
        suggestions: [],
        totalCount: 0,
        message: 'Wpisz co najmniej 2 znaki'
      });
    }

    const normalizedQuery = normalizePolish(query);

    // 1. Znajdź pasujące lokalizacje TERYT
    const terytWhere: any = {
      nazwa_normalized: {
        contains: normalizedQuery
      }
    };

    // Dodaj filtry jeśli wybrane
    if (wojewodztwo) {
      // Mapowanie URL param → nazwa w bazie (polskie znaki)
      const wojewodztwoMap: Record<string, string> = {
        'malopolskie': 'małopolskie',
        'slaskie': 'śląskie',
        'mazowieckie': 'mazowieckie',
        'dolnoslaskie': 'dolnośląskie',
        'wielkopolskie': 'wielkopolskie',
      };
      terytWhere.wojewodztwo = wojewodztwoMap[wojewodztwo] || wojewodztwo;
    }
    if (powiat) {
      terytWhere.powiat = powiat;
    }

    const terytMatches = await prisma.terytLocation.findMany({
      where: terytWhere,
      distinct: ['nazwa', 'powiat'],
      take: 20, // Pobierz więcej niż 5, bo będziemy filtrować po placówkach
      orderBy: {
        nazwa: 'asc'
      }
    });

    if (terytMatches.length === 0) {
      return NextResponse.json({
        suggestions: [],
        totalCount: 0,
        message: 'Nie znaleziono takiej miejscowości'
      });
    }

    // 2. Dla każdej lokalizacji TERYT - sprawdź liczbę placówek
    const suggestionsWithCount = await Promise.all(
      terytMatches.map(async (loc) => {
        const facilityWhere: any = {
          powiat: loc.powiat
        };

        // Dodaj filtr typu placówki jeśli wybrany
        if (typ) {
          if (typ === 'DPS') {
            facilityWhere.typ_placowki = { in: ['DPS', 'DPS/ŚDS'] };
          } else if (typ === 'ŚDS') {
            facilityWhere.typ_placowki = { in: ['ŚDS', 'DPS/ŚDS'] };
          }
        }

        const count = await prisma.placowka.count({
          where: facilityWhere
        });

        return {
          nazwa: loc.nazwa,
          powiat: loc.powiat,
          wojewodztwo: loc.wojewodztwo,
          facilitiesCount: count
        };
      })
    );

    // 3. Filtruj tylko te które mają placówki + sortuj po liczbie
    const withFacilities = suggestionsWithCount
      .filter(s => s.facilitiesCount > 0)
      .sort((a, b) => b.facilitiesCount - a.facilitiesCount);

    // 4. Zwróć top 5 + totalCount
    const topSuggestions = withFacilities.slice(0, 5);
    const totalCount = withFacilities.length;

    return NextResponse.json({
      suggestions: topSuggestions,
      totalCount,
      showAll: totalCount > 5
    });

  } catch (error) {
    console.error('Suggest API error:', error);
    return NextResponse.json(
      { error: 'Błąd podczas wyszukiwania' },
      { status: 500 }
    );
  }
}