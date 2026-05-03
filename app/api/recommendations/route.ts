import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVoivodeshipFilter } from '@/lib/voivodeship-filter';
import { checkRedisRateLimit } from '@/lib/redis';

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
    'unknown';
  const rateLimit = await checkRedisRateLimit(ip, 30, 60, 'recommendations');
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { recommendation, location } = await req.json();

    if (!recommendation) {
      return NextResponse.json({ error: 'Missing recommendation parameter' }, { status: 400 });
    }
    if (!location || typeof location !== 'string' || location.length < 2 || location.length > 200) {
      return NextResponse.json({ error: 'Invalid location parameter' }, { status: 400 });
    }

    const facilityType = recommendation === 'ŚDS' ? 'ŚDS' : 'DPS';

    let facilities = await prisma.placowka.findMany({
      where: getVoivodeshipFilter({
        typ_placowki: facilityType,
        miejscowosc: { contains: location, mode: 'insensitive' }
      }),
      take: 10,
      orderBy: { koszt_pobytu: 'asc' }
    });

    if (facilities.length === 0) {
      facilities = await prisma.placowka.findMany({
        where: getVoivodeshipFilter({
          typ_placowki: facilityType,
          powiat: { contains: location, mode: 'insensitive' }
        }),
        take: 10,
        orderBy: { koszt_pobytu: 'asc' }
      });
    }

    if (facilities.length === 0) {
      facilities = await prisma.placowka.findMany({
        where: getVoivodeshipFilter({ typ_placowki: facilityType }),
        take: 10,
        orderBy: { koszt_pobytu: 'asc' }
      });
    }

    const topFacilities = facilities.slice(0, 3);

    return NextResponse.json({
      facilities: topFacilities,
      total: facilities.length,
      isExactMatch: facilities.length > 0 &&
        facilities[0].miejscowosc?.toLowerCase().includes(location.toLowerCase())
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Recommendations API is working. Use POST with { recommendation, location }',
    example: { recommendation: 'DPS', location: 'Kraków' }
  });
}
