import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRedisRateLimit } from '@/lib/redis';

function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
    'unknown';
  const rateLimit = await checkRedisRateLimit(ip, 30, 60, 'mops-search');
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q');

    if (!rawQuery || rawQuery.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const query = rawQuery.slice(0, 100);

    const normalized = normalizePolish(query);

    // Szukaj po city, cityDisplay lub gmina
    const results = await prisma.mopsContact.findMany({
      where: {
        OR: [
          { city: { contains: normalized, mode: 'insensitive' } },
          { cityDisplay: { contains: query, mode: 'insensitive' } },
          { gmina: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: [
        { verified: 'desc' }, // Zweryfikowane najpierw
        { cityDisplay: 'asc' }
      ],
      take: 10 // Maksymalnie 10 wyników
    });

    return NextResponse.json({ results });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') console.error('MOPS search error:', error);
    return NextResponse.json(
      { error: 'Błąd wyszukiwania' },
      { status: 500 }
    );
  }
}
