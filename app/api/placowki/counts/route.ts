import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVoivodeshipFilter } from '@/lib/voivodeship-filter';

export async function GET() {
  try {
    // Get all facilities (filtered by enabled voivodeships)
    const allFacilities = await prisma.placowka.findMany({
      where: getVoivodeshipFilter(),
      select: {
        wojewodztwo: true,
      },
    });

    // Count by voivodeship
    const counts: Record<string, number> = {};

    allFacilities.forEach((facility) => {
      const woj = facility.wojewodztwo.toLowerCase();
      counts[woj] = (counts[woj] || 0) + 1;
    });

    // Normalize keys for URL params
    const normalizedCounts: Record<string, number> = {};
    Object.keys(counts).forEach((key) => {
      let normalizedKey = key;
      
      // Map województwa to URL-friendly format
      if (key === 'małopolskie') normalizedKey = 'malopolskie';
      else if (key === 'śląskie') normalizedKey = 'slaskie';
      else if (key === 'dolnośląskie') normalizedKey = 'dolnoslaskie';
      else if (key === 'kujawsko-pomorskie') normalizedKey = 'kujawsko-pomorskie';
      else if (key === 'warmińsko-mazurskie') normalizedKey = 'warminsko-mazurskie';
      else if (key === 'świętokrzyskie') normalizedKey = 'swietokrzyskie';
      
      normalizedCounts[normalizedKey] = counts[key];
    });

    console.log('📊 Facility counts by województwo:', normalizedCounts);

    return NextResponse.json({
      success: true,
      counts: normalizedCounts,
      total: allFacilities.length,
    });
  } catch (error) {
    console.error('❌ API Error counting facilities:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd pobierania liczników' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}