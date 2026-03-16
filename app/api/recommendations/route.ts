import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVoivodeshipFilter } from '@/lib/voivodeship-filter';

export async function POST(req: NextRequest) {
  try {
    const { recommendation, location } = await req.json();

    console.log('📥 API Request:', { recommendation, location });

    // Validate input
    if (!recommendation) {
      console.error('❌ Missing recommendation');
      return NextResponse.json(
        { error: 'Missing recommendation parameter' },
        { status: 400 }
      );
    }

    if (!location) {
      console.error('❌ Missing location');
      return NextResponse.json(
        { error: 'Missing location parameter' },
        { status: 400 }
      );
    }

    // Determine facility type
    const facilityType = recommendation === 'ŚDS' ? 'ŚDS' : 'DPS';

    console.log(`🔍 Searching for ${facilityType} facilities near: ${location}`);

    // Query 1: Try exact city match
    let facilities = await prisma.placowka.findMany({
      where: getVoivodeshipFilter({
        typ_placowki: facilityType,
        miejscowosc: {
          contains: location,
          mode: 'insensitive'
        }
      }),
      take: 10,
      orderBy: { koszt_pobytu: 'asc' }
    });

    console.log(`✅ Found ${facilities.length} facilities in city`);

    // Query 2: If not found, try powiat match
    if (facilities.length === 0) {
      facilities = await prisma.placowka.findMany({
        where: getVoivodeshipFilter({
          typ_placowki: facilityType,
          powiat: {
            contains: location,
            mode: 'insensitive'
          }
        }),
        take: 10,
        orderBy: { koszt_pobytu: 'asc' }
      });

      console.log(`✅ Found ${facilities.length} facilities in powiat`);
    }

    // Query 3: If still not found, fallback to all facilities of this type
    if (facilities.length === 0) {
      facilities = await prisma.placowka.findMany({
        where: getVoivodeshipFilter({
          typ_placowki: facilityType
        }),
        take: 10,
        orderBy: { koszt_pobytu: 'asc' }
      });

      console.log(`⚠️ No match found, showing ${facilities.length} fallback facilities`);
    }

    // Return top 3
    const topFacilities = facilities.slice(0, 3);

    console.log(`📤 Returning ${topFacilities.length} facilities (total: ${facilities.length})`);

    return NextResponse.json({
      facilities: topFacilities,
      total: facilities.length,
      isExactMatch: facilities.length > 0 &&
        facilities[0].miejscowosc?.toLowerCase().includes(location.toLowerCase())
    });

  } catch (error: any) {
    console.error('❌ Recommendations API error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Check if it's a Prisma error
    if (error.code) {
      console.error('Prisma Error Code:', error.code);
      console.error('Prisma Meta:', error.meta);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for testing
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Recommendations API is working. Use POST with { recommendation, location }',
    example: {
      recommendation: 'DPS',
      location: 'Kraków'
    }
  });
}
