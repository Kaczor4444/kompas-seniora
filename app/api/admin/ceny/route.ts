import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET /api/admin/ceny
// Returns facilities with price history and statistics
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rok = parseInt(searchParams.get('rok') || '2025');
    const search = searchParams.get('search') || '';
    const wojewodztwo = searchParams.get('wojewodztwo') || '';
    const typ = searchParams.get('typ') || '';
    const missingPrice = searchParams.get('missingPrice') === 'true';
    const unverified = searchParams.get('unverified') === 'true';

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { nazwa: { contains: search, mode: 'insensitive' } },
        { miejscowosc: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (wojewodztwo) {
      where.wojewodztwo = wojewodztwo;
    }

    if (typ && typ !== 'Wszystkie') {
      where.typ_placowki = typ;
    }

    // Fetch facilities with price history
    const placowki = await prisma.placowka.findMany({
      where,
      select: {
        id: true,
        nazwa: true,
        typ_placowki: true,
        miejscowosc: true,
        powiat: true,
        wojewodztwo: true,
        koszt_pobytu: true,
        ceny: {
          orderBy: { rok: 'desc' }
        }
      },
      orderBy: [
        { wojewodztwo: 'asc' },
        { miejscowosc: 'asc' },
        { nazwa: 'asc' }
      ]
    });

    // Client-side filtering for missingPrice and unverified
    let filteredPlacowki = placowki;

    if (missingPrice) {
      filteredPlacowki = filteredPlacowki.filter(p =>
        !p.ceny.some(c => c.rok === rok)
      );
    }

    if (unverified) {
      filteredPlacowki = filteredPlacowki.filter(p =>
        p.ceny.some(c => c.rok === rok && !c.verified)
      );
    }

    // Calculate statistics
    const total = filteredPlacowki.length;
    const withPrice2025 = filteredPlacowki.filter(p =>
      p.ceny.some(c => c.rok === rok)
    ).length;
    const withPrice2024 = filteredPlacowki.filter(p =>
      p.ceny.some(c => c.rok === rok - 1)
    ).length;
    const missing2025 = total - withPrice2025;

    // Calculate average YoY change
    const changesArray: number[] = [];
    filteredPlacowki.forEach(p => {
      const currentPrice = p.ceny.find(c => c.rok === rok);
      const previousPrice = p.ceny.find(c => c.rok === rok - 1);

      if (currentPrice && previousPrice && previousPrice.kwota > 0) {
        const change = ((currentPrice.kwota - previousPrice.kwota) / previousPrice.kwota) * 100;
        changesArray.push(change);
      }
    });

    const avgChange = changesArray.length > 0
      ? changesArray.reduce((sum, val) => sum + val, 0) / changesArray.length
      : 0;

    const stats = {
      total,
      withPrice2025,
      withPrice2024,
      missing2025,
      avgChange: parseFloat(avgChange.toFixed(2))
    };

    return NextResponse.json({
      placowki: filteredPlacowki,
      stats,
      success: true
    });

  } catch (error) {
    console.error('GET admin/ceny error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/ceny
// Bulk update prices
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request body', details: 'updates must be an array' },
        { status: 400 }
      );
    }

    // Bulk update using transaction
    const results = await prisma.$transaction(
      updates.map((update: any) =>
        prisma.placowkaCena.upsert({
          where: {
            placowkaId_rok_typ_kosztu: {
              placowkaId: update.placowkaId,
              rok: update.rok,
              typ_kosztu: update.typ_kosztu || 'podstawowy'
            }
          },
          update: {
            kwota: update.kwota,
            zrodlo: update.zrodlo || null,
            verified: update.verified || false,
            notatki: update.notatki || null,
            data_obowiazuje: update.data_obowiazuje ? new Date(update.data_obowiazuje) : null,
            data_pobrania: new Date()
          },
          create: {
            placowkaId: update.placowkaId,
            rok: update.rok,
            kwota: update.kwota,
            typ_kosztu: update.typ_kosztu || 'podstawowy',
            zrodlo: update.zrodlo || null,
            verified: update.verified || false,
            notatki: update.notatki || null,
            data_obowiazuje: update.data_obowiazuje ? new Date(update.data_obowiazuje) : null,
            data_pobrania: new Date()
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      updated: results.length
    });

  } catch (error) {
    console.error('POST admin/ceny error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
