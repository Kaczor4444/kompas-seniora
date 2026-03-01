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
        take: 50, // Zwiększono z 20 żeby pokazać więcej opcji
        orderBy: {
          nazwa: 'asc'
        },
        select: {
          nazwa: true,
          powiat: true,
          wojewodztwo: true,
          rodzaj_miejscowosci: true, // ✅ OPCJA 1b: pobierz RM dla priorytetyzacji
          teryt_sym: true, // ✅ Symbol TERYT
          teryt_sympod: true // ✅ Symbol nadrzędnej miejscowości (dla części)
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
          const normalizedMiejscowosc = normalizePolish(loc.nazwa);

          // 🔧 Mapowanie powiatów TERYT → baza placówek
          // Miasta na prawach powiatu: "m. Kraków" → "krakowski", etc.
          const mapTerytPowiatToDb = (terytPowiat: string): string => {
            const normalized = normalizePolish(terytPowiat);
            if (normalized === 'm. krakow') return 'krakowski';
            if (normalized === 'm. nowy sacz') return 'nowosądecki';
            if (normalized === 'm. tarnow') return 'tarnowski';
            return terytPowiat;
          };

          const dbPowiat = mapTerytPowiatToDb(loc.powiat);
          const normalizedPowiat = normalizePolish(dbPowiat);

          // Pobierz placówki TYLKO z daną miejscowością + powiatem
          const allFacilities = await prisma.placowka.findMany({
            select: { miejscowosc: true, powiat: true, typ_placowki: true }
          });

          // 🔧 FIX: Filtruj po MIEJSCOWOŚCI + POWIECIE (nie tylko powiat!)
          const matchingFacilities = allFacilities.filter(f => {
            // 1. Musi być ta sama miejscowość (exact match, normalized)
            const normalizedFacilityMiejscowosc = normalizePolish(f.miejscowosc);
            if (normalizedFacilityMiejscowosc !== normalizedMiejscowosc) {
              return false;
            }

            // 2. Musi być ten sam powiat (with contains dla elastyczności)
            const normalizedFacilityPowiat = normalizePolish(f.powiat);
            const powiatMatch = normalizedFacilityPowiat.includes(normalizedPowiat) ||
                               normalizedPowiat.includes(normalizedFacilityPowiat);

            if (!powiatMatch) {
              return false;
            }

            // 3. Filtr typu
            if (typ) {
              if (typ === 'DPS' && f.typ_placowki !== 'DPS') return false;
              if (typ === 'ŚDS' && f.typ_placowki !== 'ŚDS') return false;
            }

            return true;
          });

          // ✅ Dla części (RM=00) znajdź nazwę nadrzędnej miejscowości
          let parentLocationName: string | null = null;
          if (loc.rodzaj_miejscowosci === '00' && loc.teryt_sympod) {
            const parent = await prisma.terytLocation.findFirst({
              where: { teryt_sym: loc.teryt_sympod },
              select: { nazwa: true }
            });
            parentLocationName = parent?.nazwa || null;
          }

          return {
            nazwa: loc.nazwa,
            powiat: loc.powiat,
            wojewodztwo: loc.wojewodztwo,
            facilitiesCount: matchingFacilities.length,
            rodzaj_miejscowosci: loc.rodzaj_miejscowosci, // ✅ OPCJA 1b: przekaż RM do UI
            parentLocationName // ✅ Nazwa nadrzędnej miejscowości dla części
          };
        })
      );

      // 3. Filtruj tylko te które mają placówki + sortuj po liczbie
      // ✅ OPCJA 1b: Priorytetyzacja głównych (RM=01,96,98) nad częściami (RM=00)
      let withFacilities = suggestionsWithCount
        .filter(s => s.facilitiesCount > 0)
        .sort((a, b) => {
          // 1. BOOST: Exact match goes first
          const aExact = normalizePolish(a.nazwa).toLowerCase() === normalizedQuery;
          const bExact = normalizePolish(b.nazwa).toLowerCase() === normalizedQuery;

          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;

          // 2. PRIORYTET: Główne miejscowości (RM=01,96,98) przed częściami (RM=00)
          const aIsMain = ['01', '96', '98'].includes(a.rodzaj_miejscowosci || '');
          const bIsMain = ['01', '96', '98'].includes(b.rodzaj_miejscowosci || '');

          if (aIsMain && !bIsMain) return -1;
          if (!aIsMain && bIsMain) return 1;

          // 3. Otherwise sort by facility count
          return b.facilitiesCount - a.facilitiesCount;
        });

      console.log('  Suggestions with facilities:', withFacilities.length);
      
      // 🐛 DEBUG: Show what we're returning
      if (withFacilities.length > 0) {
        console.log('  📋 Top suggestions (sorted):');
        withFacilities.slice(0, 10).forEach((s, i) => {
          const isExact = normalizePolish(s.nazwa).toLowerCase() === normalizedQuery;
          const isMain = ['01', '96', '98'].includes(s.rodzaj_miejscowosci || '');
          const rmLabel = isMain ? '⭐' : '🟡';
          console.log(`    ${i + 1}. "${s.nazwa}" (${s.facilitiesCount}) - ${s.powiat} ${rmLabel}${isExact ? ' EXACT' : ''} RM=${s.rodzaj_miejscowosci}`);
        });
      }

      // 4. Zwróć top 10 + totalCount (zwiększono z 5 żeby pokazać więcej opcji)
      const topSuggestions = withFacilities.slice(0, 10);
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