import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

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
    console.error('MOPS search error:', error);
    return NextResponse.json(
      { error: 'Błąd wyszukiwania' },
      { status: 500 }
    );
  }
}
