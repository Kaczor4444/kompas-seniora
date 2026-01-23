import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// DELETE /api/admin/ceny/[placowkaId]/[rok]
// Deletes a specific price entry
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ placowkaId: string; rok: string }> }
) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';

    if (!isAuthenticated) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const params = await context.params;
    const placowkaId = parseInt(params.placowkaId);
    const rok = parseInt(params.rok);

    if (isNaN(placowkaId) || isNaN(rok)) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    // Delete price
    await prisma.placowkaCena.deleteMany({
      where: {
        placowkaId,
        rok,
        typ_kosztu: 'podstawowy'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Cena została usunięta'
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Błąd podczas usuwania' },
      { status: 500 }
    );
  }
}
