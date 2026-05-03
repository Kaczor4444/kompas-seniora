import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { isValidAdminCookie } from '@/lib/adminAuth';

// POST /api/admin/ceny/import
// Bulk import prices from CSV
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = isValidAdminCookie(cookieStore.get('admin-auth')?.value);

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rok, updates, zrodlo_domyslne } = body;

    if (!rok || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const formatted = updates.map((u: any) => ({
      placowkaId: u.placowkaId,
      rok,
      kwota: u.kwota,
      typ_kosztu: 'podstawowy',
      zrodlo: u.zrodlo || zrodlo_domyslne || null,
      verified: true,
      notatki: `Import z CSV - ${new Date().toLocaleDateString('pl-PL')}`
    }));

    // Bezpośrednie wywołanie Prisma — bez self-fetch (eliminuje Host header injection)
    const results = await prisma.$transaction(
      formatted.map((update: any) =>
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
      updated: results.length,
      message: `Zaimportowano ${results.length} cen`
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
