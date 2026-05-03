import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { isValidAdminCookie } from '@/lib/adminAuth';

// Protects against: comma/quote/newline in CSV AND formula injection (=, +, -, @, tab, CR)
function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const str = String(value);
  const dangerous = /^[=+\-@\t\r]/.test(str);
  const needsQuote = str.includes(',') || str.includes('"') || str.includes('\n') || dangerous;
  if (!needsQuote) return str;
  return `"${(dangerous ? "'" + str : str).replace(/"/g, '""')}"`;
}

// GET /api/admin/ceny/export
// Generates CSV file with all facility prices
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = isValidAdminCookie(cookieStore.get('admin-auth')?.value);

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
        escapeCsv(p.wojewodztwo),
        escapeCsv(p.powiat),
        escapeCsv(p.miejscowosc),
        escapeCsv(p.nazwa),
        escapeCsv(p.typ_placowki),
        cena ? escapeCsv(cena.kwota) : '',
        escapeCsv(cena?.zrodlo),
        cena ? (cena.verified ? 'TAK' : 'NIE') : '',
        cena ? new Date(cena.updatedAt).toLocaleDateString('pl-PL') : '',
        escapeCsv(cena?.notatki),
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
