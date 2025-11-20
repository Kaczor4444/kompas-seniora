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

    // CSV Headers - ROZSZERZONE o wszystkie pola
    const headers = [
      'id',
      'nazwa',
      'typ_placowki',
      'prowadzacy',
      'ulica',
      'miejscowosc',
      'kod_pocztowy',
      'gmina',
      'powiat',
      'wojewodztwo',
      'telefon',
      'email',
      'www',
      'latitude',
      'longitude',
      'liczba_miejsc',
      'profil_opieki',
      'koszt_pobytu',
      'data_aktualizacji',
      'zrodlo_dane',
      'zrodlo_cena',
      'data_zrodla_dane',
      'data_zrodla_cena',
      'data_weryfikacji',
      'notatki',
      'verified',
      'created_at',
      'updated_at'
    ];

    let csvContent = '';

    if (mode === 'template') {
      csvContent = headers.join(',') + '\n';
    } else {
      const placowki = await prisma.placowka.findMany({
        orderBy: [
          { typ_placowki: 'asc' },
          { wojewodztwo: 'asc' },
          { miejscowosc: 'asc' },
          { nazwa: 'asc' }
        ]
      });

      csvContent = headers.join(',') + '\n';

      placowki.forEach(placowka => {
        const row = [
          placowka.id,
          escapeCsv(placowka.nazwa),
          escapeCsv(placowka.typ_placowki),
          escapeCsv(placowka.prowadzacy || ''),
          escapeCsv(placowka.ulica || ''),
          escapeCsv(placowka.miejscowosc),
          escapeCsv(placowka.kod_pocztowy || ''),
          escapeCsv(placowka.gmina || ''),
          escapeCsv(placowka.powiat),
          escapeCsv(placowka.wojewodztwo),
          escapeCsv(placowka.telefon || ''),
          escapeCsv(placowka.email || ''),
          escapeCsv(placowka.www || ''),
          placowka.latitude || '',
          placowka.longitude || '',
          placowka.liczba_miejsc || '',
          escapeCsv(placowka.profil_opieki || ''),
          placowka.koszt_pobytu || '',
          placowka.data_aktualizacji ? formatDateOnly(placowka.data_aktualizacji) : '',
          escapeCsv(placowka.zrodlo_dane || ''),
          escapeCsv(placowka.zrodlo_cena || ''),
          placowka.data_zrodla_dane ? formatDateOnly(placowka.data_zrodla_dane) : '',
          placowka.data_zrodla_cena ? formatDateOnly(placowka.data_zrodla_cena) : '',
          placowka.data_weryfikacji ? formatDateOnly(placowka.data_weryfikacji) : '',
          escapeCsv(placowka.notatki || ''),
          placowka.verified ? 'true' : 'false',
          formatDateOnly(placowka.createdAt),
          formatDateOnly(placowka.updatedAt)
        ];
        csvContent += row.join(',') + '\n';
      });
    }

    const filename = mode === 'template' 
      ? 'placowki_template.csv' 
      : `placowki_export_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
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
