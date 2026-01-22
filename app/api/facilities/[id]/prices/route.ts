import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/facilities/[id]/prices
// Returns price history for a facility with year-over-year statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const facilityId = parseInt(id);

    if (isNaN(facilityId)) {
      return NextResponse.json({ error: 'Invalid facility ID' }, { status: 400 });
    }

    // Fetch facility basic info
    const facility = await prisma.placowka.findUnique({
      where: { id: facilityId },
      select: {
        id: true,
        nazwa: true,
        typ_placowki: true,
        wojewodztwo: true,
        powiat: true,
        miejscowosc: true
      }
    });

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
    }

    // Fetch price history
    const prices = await prisma.placowkaCena.findMany({
      where: { placowkaId: facilityId },
      orderBy: { rok: 'desc' },
      select: {
        id: true,
        rok: true,
        kwota: true,
        typ_kosztu: true,
        zrodlo: true,
        data_pobrania: true,
        verified: true,
        notatki: true,
        createdAt: true
      }
    });

    if (prices.length === 0) {
      return NextResponse.json({
        facility: {
          id: facility.id,
          name: facility.nazwa,
          type: facility.typ_placowki,
          location: {
            miejscowosc: facility.miejscowosc,
            powiat: facility.powiat,
            wojewodztwo: facility.wojewodztwo
          }
        },
        prices: [],
        statistics: null,
        message: 'No price history available for this facility'
      });
    }

    // Calculate year-over-year changes
    const priceChanges = prices.map((price, index) => {
      if (index === prices.length - 1) {
        // First year - no previous data
        return {
          ...price,
          change_amount: null,
          change_percent: null,
          compared_to: null
        };
      }

      const previousPrice = prices[index + 1];
      const changeAmount = price.kwota - previousPrice.kwota;
      const changePercent = ((changeAmount / previousPrice.kwota) * 100);

      return {
        ...price,
        change_amount: parseFloat(changeAmount.toFixed(2)),
        change_percent: parseFloat(changePercent.toFixed(2)),
        compared_to: {
          year: previousPrice.rok,
          price: previousPrice.kwota
        }
      };
    });

    // Calculate summary statistics
    const allPrices = prices.map(p => p.kwota);
    const avgPrice = allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length;
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    // Overall trend
    let trend = 'stable';
    if (prices.length >= 2) {
      const oldest = prices[prices.length - 1].kwota;
      const newest = prices[0].kwota;
      const overallChange = ((newest - oldest) / oldest) * 100;

      if (overallChange > 5) trend = 'increasing';
      else if (overallChange < -5) trend = 'decreasing';
    }

    return NextResponse.json({
      facility: {
        id: facility.id,
        name: facility.nazwa,
        type: facility.typ_placowki,
        location: {
          miejscowosc: facility.miejscowosc,
          powiat: facility.powiat,
          wojewodztwo: facility.wojewodztwo
        }
      },
      prices: priceChanges,
      statistics: {
        total_years: prices.length,
        year_range: {
          earliest: prices[prices.length - 1]?.rok,
          latest: prices[0]?.rok
        },
        current_price: prices[0]?.kwota,
        average_price: parseFloat(avgPrice.toFixed(2)),
        min_price: minPrice,
        max_price: maxPrice,
        price_range: parseFloat((maxPrice - minPrice).toFixed(2)),
        trend: trend
      },
      metadata: {
        retrieved_at: new Date().toISOString(),
        data_points: prices.length
      }
    });

  } catch (error) {
    console.error('GET facility prices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
