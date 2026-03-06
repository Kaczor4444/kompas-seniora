import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'data';

    // CSV Headers
    const headers = [
      'id',
      'city',
      'cityDisplay',
      'typ',
      'gmina',
      'name',
      'phone',
      'email',
      'address',
      'website',
      'wojewodztwo',
      'latitude',
      'longitude',
      'verified',
      'lastVerified',
      'notes',
      'createdAt',
      'updatedAt'
    ];

    let csvContent = '';

    if (mode === 'template') {
      // Empty template for import
      csvContent = headers.join(',') + '\n';
    } else {
      // Export all MOPS/GOPS data
      const mops = await prisma.mopsContact.findMany({
        orderBy: [
          { wojewodztwo: 'asc' },
          { cityDisplay: 'asc' }
        ]
      });

      csvContent = headers.join(',') + '\n';

      mops.forEach(m => {
        const row = [
          m.id,
          escapeCsv(m.city),
          escapeCsv(m.cityDisplay),
          escapeCsv(m.typ),
          escapeCsv(m.gmina || ''),
          escapeCsv(m.name),
          escapeCsv(m.phone),
          escapeCsv(m.email || ''),
          escapeCsv(m.address),
          escapeCsv(m.website || ''),
          escapeCsv(m.wojewodztwo),
          m.latitude || '',
          m.longitude || '',
          m.verified ? 'true' : 'false',
          m.lastVerified ? formatDateOnly(m.lastVerified) : '',
          escapeCsv(m.notes || ''),
          formatDateOnly(m.createdAt),
          formatDateOnly(m.updatedAt)
        ];
        csvContent += row.join(',') + '\n';
      });
    }

    const filename = mode === 'template'
      ? 'mops_template.csv'
      : `mops_export_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('MOPS CSV export error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function formatDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

function escapeCsv(value: string | null | undefined): string {
  if (!value) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}
