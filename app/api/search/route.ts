import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const typ = searchParams.get('typ') || 'all';

    console.log('API Search - query:', query, 'typ:', typ);

    const whereClause: any = {};

    if (typ !== 'all' && typ !== 'WSZYSTKIE') {
      whereClause.typ_placowki = { contains: typ };
    }

    if (query) {
      whereClause.OR = [
        { miejscowosc: { contains: query } },
        { powiat: { contains: query } },
        { gmina: { contains: query } },
        { nazwa: { contains: query } }
      ];
    }

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));

    const placowki = await prisma.placowka.findMany({
      where: whereClause,
      select: {
        id: true,
        nazwa: true,
        typ_placowki: true,
        miejscowosc: true,
        powiat: true,
        telefon: true,
        koszt_pobytu: true
      },
      orderBy: { nazwa: 'asc' }
    });

    console.log('Found placowki:', placowki.length);

    await prisma.$disconnect();
    return NextResponse.json(placowki);

  } catch (error) {
    console.error('Search API error:', error);
    await prisma.$disconnect();
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}