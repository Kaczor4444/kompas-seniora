import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVoivodeshipFilter } from '@/lib/voivodeship-filter';
import { checkRedisRateLimit } from '@/lib/redis';
import { PUBLIC_PLACOWKA_SELECT } from '@/lib/public-placowka-fields';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
    'unknown';
  const rateLimit = await checkRedisRateLimit(ip, 30, 60, 'share-token');
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { token } = params;

    const sharedList = await prisma.sharedList.findUnique({
      where: { token }
    });

    if (!sharedList) {
      return NextResponse.json(
        { error: 'Shared list not found' },
        { status: 404 }
      );
    }

    await prisma.sharedList.update({
      where: { token },
      data: { views: { increment: 1 } }
    });

    const ids = sharedList.ids.split(',').map(id => parseInt(id, 10));

    const facilities = await prisma.placowka.findMany({
      where: getVoivodeshipFilter({
        id: { in: ids }
      }),
      select: PUBLIC_PLACOWKA_SELECT,
    });

    return NextResponse.json({
      success: true,
      ids,
      facilities,
      created: sharedList.created,
      views: sharedList.views + 1
    });

  } catch (error) {
    console.error('Error fetching shared list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}