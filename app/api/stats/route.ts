import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const facilitiesByVoivodeship = await prisma.placowka.groupBy({
      by: ['wojewodztwo'],
      _count: { id: true },
    });

    const facilitiesByCity = await prisma.placowka.groupBy({
      by: ['miejscowosc'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const voivodeshipStats = facilitiesByVoivodeship.reduce((acc, item) => {
      acc[item.wojewodztwo.toLowerCase()] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const cityStats = facilitiesByCity.map(item => ({
      name: item.miejscowosc,
      count: item._count.id,
    }));

    const totalFacilities = await prisma.placowka.count();

    return NextResponse.json({
      success: true,
      data: {
        total: totalFacilities,
        byVoivodeship: voivodeshipStats,
        byCities: cityStats,
        topCities: cityStats.slice(0, 10),
      },
    });

  } catch (error) {
    console.error('Error fetching facility stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch facility statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
