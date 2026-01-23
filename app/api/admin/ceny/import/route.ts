import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST /api/admin/ceny/import
// Bulk import prices from CSV
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';

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

    // Format for bulk update
    const formatted = updates.map((u: any) => ({
      placowkaId: u.placowkaId,
      rok,
      kwota: u.kwota,
      typ_kosztu: 'podstawowy',
      zrodlo: u.zrodlo || zrodlo_domyslne || null,
      verified: true, // Assume verified from official PDF
      notatki: `Import z CSV - ${new Date().toLocaleDateString('pl-PL')}`
    }));

    // Call existing bulk update endpoint
    const origin = request.nextUrl.origin;
    const response = await fetch(`${origin}/api/admin/ceny`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || ''
      },
      body: JSON.stringify({ updates: formatted })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Błąd podczas importu');
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      updated: result.updated || formatted.length,
      message: `Zaimportowano ${formatted.length} cen`
    });

  } catch (error) {
    console.error('POST admin/ceny/import error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
