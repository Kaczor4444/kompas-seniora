// app/api/teryt/suggest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Funkcja normalizacji polskich znaków
function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
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

    console.log('🔍 AUTOCOMPLETE API:', { query, wojewodztwo, powiat, typ });

    // Minimum 2 znaki
    if (query.length < 2) {
      return NextResponse.json({
        suggestions: [],
        totalCount: 0,
        message: 'Wpisz co najmniej 2 znaki'
      });
    }

    const normalizedQuery = normalizePolish(query);

    // Mapowanie województw
    const wojewodztwoMap: Record<string, string> = {
      'malopolskie': 'małopolskie',
      'slaskie': 'śląskie',
      'mazowieckie': 'mazowieckie',
      'dolnoslaskie': 'dolnośląskie',
      'wielkopolskie': 'wielkopolskie',
    };

    const wojewodztwoDbName = wojewodztwoMap[wojewodztwo] || wojewodztwo;

    // ✅ Sprawdź czy województwo ma dane TERYT
    const hasTerytData = wojewodztwo === '' || wojewodztwo === 'malopolskie' || wojewodztwo === 'slaskie';

    console.log('  hasTerytData:', hasTerytData, '(wojewodztwo:', wojewodztwo, ')');

    // ========================================
    // TRYB 1: Z TERYT (Małopolskie + Śląskie)
    // ========================================
    if (hasTerytData) {
      console.log('  Mode: TERYT');

      // 1. Znajdź pasujące lokalizacje TERYT
      const terytWhere: any = {
        nazwa_normalized: {
          contains: normalizedQuery
        }
      };

      // Dodaj filtry jeśli wybrane
      if (wojewodztwo && wojewodztwo !== '') {
        terytWhere.wojewodztwo = wojewodztwoDbName;
      }

      if (powiat) {
        terytWhere.powiat = powiat;
      }

      const terytMatches = await prisma.terytLocation.findMany({
        where: terytWhere,
        distinct: ['nazwa', 'powiat'],
        take: 20,
        orderBy: {
          nazwa: 'asc'
        }
      });

      console.log('  TERYT matches:', terytMatches.length);

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
          const normalizedPowiat = normalizePolish(loc.powiat);

          // Pobierz wszystkie placówki
          const allFacilities = await prisma.placowka.findMany({
            select: { powiat: true, typ_placowki: true }
          });

          // Filtruj po powiecie (case-insensitive + contains)
          const matchingFacilities = allFacilities.filter(f => {
            const normalizedFacilityPowiat = normalizePolish(f.powiat);
            const powiatMatch = normalizedFacilityPowiat.includes(normalizedPowiat) || 
                               normalizedPowiat.includes(normalizedFacilityPowiat);

            // Filtr typu
            if (typ) {
              if (typ === 'DPS' && f.typ_placowki !== 'DPS') return false;
              if (typ === 'ŚDS' && f.typ_placowki !== 'ŚDS') return false;
            }

            return powiatMatch;
          });

          return {
            nazwa: loc.nazwa,
            powiat: loc.powiat,
            wojewodztwo: loc.wojewodztwo,
            facilitiesCount: matchingFacilities.length
          };
        })
      );

      // 3. Filtruj tylko te które mają placówki + sortuj po liczbie
      let withFacilities = suggestionsWithCount
        .filter(s => s.facilitiesCount > 0)
        .sort((a, b) => {
          // BOOST: Exact match goes first
          const aExact = normalizePolish(a.nazwa).toLowerCase() === normalizedQuery;
          const bExact = normalizePolish(b.nazwa).toLowerCase() === normalizedQuery;
          
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Otherwise sort by facility count
          return b.facilitiesCount - a.facilitiesCount;
        });

      console.log('  Suggestions with facilities:', withFacilities.length);
      
      // 🐛 DEBUG: Show what we're returning
      if (withFacilities.length > 0) {
        console.log('  📋 Top suggestions (sorted):');
        withFacilities.slice(0, 5).forEach((s, i) => {
          const isExact = normalizePolish(s.nazwa).toLowerCase() === normalizedQuery;
          console.log(`    ${i + 1}. "${s.nazwa}" (${s.facilitiesCount}) - powiat: "${s.powiat}" ${isExact ? '⭐ EXACT' : ''}`);
        });
      }

      // 4. Zwróć top 5 + totalCount
      const topSuggestions = withFacilities.slice(0, 5);
      const totalCount = withFacilities.length;

      return NextResponse.json({
        suggestions: topSuggestions,
        totalCount,
        showAll: totalCount > 5
      });
    }

    // ========================================
    // TRYB 2: BEZ TERYT (inne województwa)
    // ========================================
    else {
      console.log('  Mode: DIRECT (no TERYT)');

      // Pobierz wszystkie placówki
      const where: any = {};

      // Filtr typu
      if (typ) {
        where.typ_placowki = typ === 'DPS' ? 'DPS' : 'ŚDS';
      }

      const allFacilities = await prisma.placowka.findMany({
        where,
        select: {
          miejscowosc: true,
          wojewodztwo: true,
          powiat: true,
          typ_placowki: true
        }
      });

      console.log('  All facilities:', allFacilities.length);

      // Filtruj po miejscowości + województwie (case-insensitive)
      const matchingFacilities = allFacilities.filter(f => {
        // Filtr województwa
        if (wojewodztwo && wojewodztwo !== '') {
          const normalizedFacilityWoj = normalizePolish(f.wojewodztwo);
          const normalizedTargetWoj = normalizePolish(wojewodztwoDbName);
          if (normalizedFacilityWoj !== normalizedTargetWoj) {
            return false;
          }
        }

        // Filtr miejscowości
        const normalizedMiejscowosc = normalizePolish(f.miejscowosc);
        return normalizedMiejscowosc.includes(normalizedQuery);
      });

      console.log('  Matching facilities:', matchingFacilities.length);

      // Grupuj po miejscowości
      const locationGroups = new Map<string, { count: number; wojewodztwo: string; powiat: string }>();

      matchingFacilities.forEach(f => {
        const key = f.miejscowosc;
        if (!locationGroups.has(key)) {
          locationGroups.set(key, {
            count: 0,
            wojewodztwo: f.wojewodztwo,
            powiat: f.powiat
          });
        }
        locationGroups.get(key)!.count++;
      });

      // Konwertuj na array suggestions
      const suggestions = Array.from(locationGroups.entries())
        .map(([nazwa, data]) => ({
          nazwa,
          powiat: data.powiat,
          wojewodztwo: data.wojewodztwo,
          facilitiesCount: data.count
        }))
        .sort((a, b) => b.facilitiesCount - a.facilitiesCount);

      console.log('  Final suggestions:', suggestions.length);

      const topSuggestions = suggestions.slice(0, 5);
      const totalCount = suggestions.length;

      return NextResponse.json({
        suggestions: topSuggestions,
        totalCount,
        showAll: totalCount > 5
      });
    }

  } catch (error) {
    console.error('Suggest API error:', error);
    return NextResponse.json(
      { error: 'Błąd podczas wyszukiwania' },
      { status: 500 }
    );
  }
}