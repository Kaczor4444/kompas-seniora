import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRedisRateLimit } from '@/lib/redis';

function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
    'unknown';
  const rateLimit = await checkRedisRateLimit(ip, 30, 60, 'mops-search');
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q');

    if (!rawQuery || rawQuery.trim().length < 2) {
      return NextResponse.json({ results: [], mode: 'direct' });
    }

    const query = rawQuery.slice(0, 100);
    const normalized = normalizePolish(query);

    // KROK 1: bezpośrednie szukanie po city/cityDisplay/gmina
    const direct = await prisma.mopsContact.findMany({
      where: {
        OR: [
          { city: { contains: normalized, mode: 'insensitive' } },
          { cityDisplay: { contains: query, mode: 'insensitive' } },
          { gmina: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ verified: 'desc' }, { cityDisplay: 'asc' }],
      take: 10,
    });

    if (direct.length > 0) {
      return NextResponse.json({ results: direct, mode: 'direct' });
    }

    // KROK 2: TERYT — wszystkie unikalne powiaty dla wpisanej miejscowości
    const terytEntries = await prisma.terytLocation.findMany({
      where: {
        OR: [
          { nazwa_normalized: normalized },
          { nazwa_normalized: { startsWith: normalized } },
          { nazwa: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { nazwa: true, powiat: true, wojewodztwo: true, rodzaj_miejscowosci: true },
    });

    if (terytEntries.length === 0) {
      return NextResponse.json({ results: [], mode: 'direct' });
    }

    // Unikalne powiaty (deduplikacja), RM=01 (wieś) przed RM=00 (część)
    const seenPowiats = new Set<string>();
    const uniquePowiats: string[] = [];
    const sorted = [...terytEntries].sort((a, b) => {
      const rmOrder = (rm: string | null) => rm === '01' ? 0 : rm === '98' || rm === '96' ? 1 : 2;
      return rmOrder(a.rodzaj_miejscowosci) - rmOrder(b.rodzaj_miejscowosci);
    });
    for (const e of sorted) {
      if (e.powiat && !seenPowiats.has(e.powiat)) {
        seenPowiats.add(e.powiat);
        uniquePowiats.push(e.powiat);
      }
    }

    // KROK 3: MOPS per każdy znaleziony powiat
    const allMops = await prisma.mopsContact.findMany({
      select: { id: true, name: true, typ: true, city: true, cityDisplay: true, gmina: true, address: true, phone: true, email: true, website: true, verified: true, wojewodztwo: true },
    });
    const mopsCities = allMops.map(m => m.city);

    const mopsByPowiat: Record<string, typeof allMops> = {};

    for (const powiat of uniquePowiats) {
      // Ustal województwo powiatu z danych TERYT
      const powiatWoj = terytEntries.find(e => e.powiat === powiat)?.wojewodztwo ?? '';

      const terytInPowiat = await prisma.terytLocation.findMany({
        where: { powiat, nazwa_normalized: { in: mopsCities } },
        select: { nazwa_normalized: true },
      });
      const matchingCities = new Set(terytInPowiat.map(t => t.nazwa_normalized));

      // Filtruj MOPS po nazwie miasta ORAZ województwie — zapobiega cross-woj błędom
      const powiatMops = allMops
        .filter(m => {
          if (!matchingCities.has(m.city)) return false;
          // Filtr 1: województwo musi się zgadzać
          if (powiatWoj) {
            const mojWoj = m.wojewodztwo.toLowerCase().replace('województwo ', '').trim();
            const terytWoj = powiatWoj.toLowerCase().replace('województwo ', '').trim();
            if (mojWoj !== terytWoj) return false;
          }
          // Filtr 2: jeśli nazwa MOPS zawiera "(pow. X)", powiat musi pasować do szukanego
          const powiatInName = m.name.match(/\(pow\.\s*([^)]+)\)/i);
          if (powiatInName) {
            const namePowiat = normalizePolish(powiatInName[1]);
            const targetPowiat = normalizePolish(powiat);
            if (!namePowiat.includes(targetPowiat) && !targetPowiat.includes(namePowiat)) return false;
          }
          return true;
        })
        .sort((a, b) => (b.verified ? 1 : 0) - (a.verified ? 1 : 0));

      if (powiatMops.length > 0) {
        mopsByPowiat[powiat] = powiatMops;
      }
    }

    const powiatKeys = Object.keys(mopsByPowiat);

    if (powiatKeys.length === 0) {
      return NextResponse.json({ results: [], mode: 'direct' });
    }

    if (powiatKeys.length === 1) {
      return NextResponse.json({
        results: mopsByPowiat[powiatKeys[0]],
        mode: 'powiat_fallback',
        powiat: powiatKeys[0],
        localityName: terytEntries[0].nazwa,
      });
    }

    // Wiele powiatów — tryb niejednoznaczny
    return NextResponse.json({
      results: mopsByPowiat[powiatKeys[0]], // domyślnie pierwszy powiat
      mode: 'ambiguous',
      powiaty: powiatKeys,
      mopsByPowiat,
      localityName: terytEntries[0].nazwa,
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('MOPS search error:', error);
    return NextResponse.json({ error: 'Błąd wyszukiwania' }, { status: 500 });
  }
}
