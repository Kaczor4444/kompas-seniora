import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Normalize city name for search (lowercase only, keep Polish characters)
    const normalizedCity = city.toLowerCase().trim();

    // Find MOPS by city
    const mops = await prisma.mopsContact.findUnique({
      where: {
        city: normalizedCity
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