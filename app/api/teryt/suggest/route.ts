// app/api/teryt/suggest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVoivodeshipFilter } from '@/lib/voivodeship-filter';
import { normalizePolish } from '@/lib/normalize-polish';
import { mapCityCountyToPowiat } from '@/lib/city-county-mapping';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const wojewodztwo = searchParams.get('woj') || '';
    const powiat = searchParams.get('powiat') || '';
    const typ = searchParams.get('typ') || ''; // "DPS" lub "ŚDS"
    const isAdmin = searchParams.get('admin') === 'true'; // 🆕 Admin mode - pokaż wszystkie miasta

    console.log('🔍 AUTOCOMPLETE API:', { query, wojewodztwo, powiat, typ, isAdmin });

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
        },
        // ✅ FILTR: Tylko główne miejscowości (wsie + miasta)
        // Eliminujemy 77% szumu (RM=00 części wsi) dla lepszego UX autocomplete
        // Proximity search backend dalej działa dla WSZYSTKICH lokalizacji
        rodzaj_miejscowosci: {
          in: ['01', '96', '98', '03'] // wieś, miasto PP, miasto, osada
        }
      };

      // Dodaj filtry jeśli wybrane
      if (wojewodztwo && wojewodztwo !== '') {
        terytWhere.wojewodztwo = wojewodztwoDbName;
      }

      if (powiat) {
        terytWhere.powiat = powiat;
      }

      // 🔧 SORTOWANIE: Priorytetyzuj miasta (RM=96,98) przed wsiami (RM=01) przed częściami (RM=00,03)
      const allTerytMatches = await prisma.terytLocation.findMany({
        where: terytWhere,
        take: 200, // Zwiększ limit bo będziemy filtrować później
        orderBy: {
          nazwa: 'asc'
        },
        select: {
          nazwa: true,
          powiat: true,
          wojewodztwo: true,
          rodzaj_miejscowosci: true,
          teryt_sym: true,
          teryt_sympod: true
        }
      });

      // 🔧 DEDUPLIKACJA: Dla każdej pary (nazwa, powiat) weź najlepszy RM
      const deduplicatedMap = new Map<string, typeof allTerytMatches[0]>();

      for (const loc of allTerytMatches) {
        const key = `${loc.nazwa}|${loc.powiat}`;
        const existing = deduplicatedMap.get(key);

        if (!existing) {
          deduplicatedMap.set(key, loc);
        } else {
          // Priorytetyzacja: 96 > 98 > 01 > 03 > 00
          const rmPriority = (rm: string | null) => {
            if (rm === '96') return 5; // Miasto na prawach powiatu
            if (rm === '98') return 4; // Miasto
            if (rm === '01') return 3; // Wieś
            if (rm === '03') return 2; // Osada
            if (rm === '00') return 1; // Część miejscowości
            return 0;
          };

          if (rmPriority(loc.rodzaj_miejscowosci) > rmPriority(existing.rodzaj_miejscowosci)) {
            deduplicatedMap.set(key, loc);
          }
        }
      }

      const terytMatches = Array.from(deduplicatedMap.values()).slice(0, 50);

      console.log('  TERYT matches:', terytMatches.length);

      if (terytMatches.length === 0) {
        return NextResponse.json({
          suggestions: [],
          totalCount: 0,
          message: 'Nie znaleziono takiej miejscowości'
        });
      }

      // 🔧 FIX N+1: Pobierz wszystkie placówki RAZ (przed pętlą)
      const allFacilities = await prisma.placowka.findMany({
        where: getVoivodeshipFilter(),
        select: { miejscowosc: true, powiat: true, typ_placowki: true }
      });

      // 🔧 FIX N+1: Dla RM=00 - pobierz wszystkie parent locations RAZ
      const sympodIds = terytMatches
        .filter(loc => loc.rodzaj_miejscowosci === '00' && loc.teryt_sympod)
        .map(loc => loc.teryt_sympod!);

      const parentLocations = sympodIds.length > 0
        ? await prisma.terytLocation.findMany({
            where: { teryt_sym: { in: sympodIds } },
            select: { teryt_sym: true, nazwa: true }
          })
        : [];

      const parentLocationMap = new Map(
        parentLocations.map(p => [p.teryt_sym, p.nazwa])
      );

      // 2. Dla każdej lokalizacji TERYT - sprawdź liczbę placówek (filtrowanie w memory)
      const suggestionsWithCount = terytMatches.map((loc) => {
        const normalizedMiejscowosc = normalizePolish(loc.nazwa);
        const dbPowiat = mapCityCountyToPowiat(loc.powiat);
        const normalizedPowiat = normalizePolish(dbPowiat);

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

        // ✅ Dla części (RM=00) znajdź nazwę nadrzędnej miejscowości z Map (no query!)
        const parentLocationName = loc.rodzaj_miejscowosci === '00' && loc.teryt_sympod
          ? parentLocationMap.get(loc.teryt_sympod) || null
          : null;

        return {
          nazwa: loc.nazwa,
          powiat: loc.powiat,
          wojewodztwo: loc.wojewodztwo,
          facilitiesCount: matchingFacilities.length,
          rodzaj_miejscowosci: loc.rodzaj_miejscowosci, // ✅ OPCJA 1b: przekaż RM do UI
          parentLocationName // ✅ Nazwa nadrzędnej miejscowości dla części
        };
      });

      // 3. Sortuj miejscowości (pokazuj WSZYSTKIE, nawet bez placówek)
      // ✅ OPCJA 1b: Priorytetyzacja głównych (RM=01,96,98) nad częściami (RM=00)
      // ✅ User może wybrać miejscowość i zobaczyć placówki w okolicy (30km default)
      let allSuggestions = suggestionsWithCount
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

      console.log('  All suggestions (sorted):', allSuggestions.length);

      // 🐛 DEBUG: Show what we're returning
      if (allSuggestions.length > 0) {
        console.log('  📋 Top suggestions (sorted):');
        allSuggestions.slice(0, 10).forEach((s, i) => {
          const isExact = normalizePolish(s.nazwa).toLowerCase() === normalizedQuery;
          const isMain = ['01', '96', '98'].includes(s.rodzaj_miejscowosci || '');
          const rmLabel = isMain ? '⭐' : '🟡';
          console.log(`    ${i + 1}. "${s.nazwa}" (${s.facilitiesCount}) - ${s.powiat} ${rmLabel}${isExact ? ' EXACT' : ''} RM=${s.rodzaj_miejscowosci}`);
        });
      }

      // 4. Zwróć top 10 + totalCount (zwiększono z 5 żeby pokazać więcej opcji)
      const topSuggestions = allSuggestions.slice(0, 10);
      const totalCount = allSuggestions.length;

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
      const typeFilter: any = {};

      // Filtr typu
      if (typ) {
        typeFilter.typ_placowki = typ === 'DPS' ? 'DPS' : 'ŚDS';
      }

      const allFacilities = await prisma.placowka.findMany({
        where: getVoivodeshipFilter(typeFilter),
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