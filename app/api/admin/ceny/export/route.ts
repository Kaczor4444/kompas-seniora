import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET /api/admin/ceny/export
// Generates CSV file with all facility prices
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';

    if (!isAuthenticated) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const rok = Number(searchParams.get('rok')) || 2025;

    // Fetch all facilities with prices
    const placowki = await prisma.placowka.findMany({
      select: {
        id: true,
        nazwa: true,
        typ_placowki: true,
        miejscowosc: true,
        powiat: true,
        wojewodztwo: true,
        ceny: {
          where: { rok },
          orderBy: { rok: 'desc' }
        }
      },
      orderBy: [
        { wojewodztwo: 'asc' },
        { miejscowosc: 'asc' },
        { nazwa: 'asc' }
      ]
    });

    // Generate CSV
    const headers = [
      'id',
      'wojewodztwo',
      'powiat',
      'miejscowosc',
      'nazwa',
      'typ_placowki',
      `cena_${rok}`,
      'zrodlo',
      'verified',
      'data_aktualizacji',
      'notatki'
    ];

    const rows = placowki.map(p => {
      const cena = p.ceny.find(c => c.rok === rok);
      return [
        p.id,
        p.wojewodztwo,
        p.powiat,
        p.miejscowosc,
        `"${p.nazwa}"`, // Quote to handle commas
        p.typ_placowki,
        cena ? cena.kwota : '',
        cena?.zrodlo ? `"${cena.zrodlo}"` : '',
        cena ? (cena.verified ? 'TAK' : 'NIE') : '',
        cena ? new Date(cena.updatedAt).toLocaleDateString('pl-PL') : '',
        cena?.notatki ? `"${cena.notatki.replace(/"/g, '""')}"` : '' // Escape quotes
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    // Return as downloadable file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ceny-dps-${rok}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Błąd eksportu' },
      { status: 500 }
    );
  }
}
