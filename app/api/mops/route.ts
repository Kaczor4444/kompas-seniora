import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');

    // If no city specified, return all MOPS
    if (!city) {
      const allMops = await prisma.mopsContact.findMany({
        orderBy: {
          cityDisplay: 'asc'
        }
      });
      
      return NextResponse.json(allMops);
    }

    // Normalize city — DB stores stripped names (myslenice, not myślenice)
    const normalizedCity = city.toLowerCase().trim()
      .replace(/ą/g,'a').replace(/ć/g,'c').replace(/ę/g,'e')
      .replace(/ł/g,'l').replace(/ń/g,'n').replace(/ó/g,'o')
      .replace(/ś/g,'s').replace(/ź/g,'z').replace(/ż/g,'z');

    // Find MOPS by city (normalized) or by display name containing the query
    const mops = await prisma.mopsContact.findFirst({
      where: {
        OR: [
          { city: normalizedCity },
          { city: city.toLowerCase().trim() },
        ]
      }
    });

    if (!mops) {
      return NextResponse.json(
        { error: `MOPS dla miasta "${city}" nie został znaleziony` },
        { status: 404 }
      );
    }

    return NextResponse.json(mops);

  } catch (error) {
    console.error('Error fetching MOPS:', error);
    return NextResponse.json(
      { error: 'Błąd podczas pobierania danych MOPS' },
      { status: 500 }
    );
  }
}