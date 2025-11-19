import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. TOTAL STATS - wszystkie eventy
    const totalEvents = await prisma.placowkaEvent.count();
    
    // 2. STATS BY EVENT TYPE
    const eventsByType = await prisma.placowkaEvent.groupBy({
      by: ['eventType'],
      _count: {
        eventType: true,
      },
      orderBy: {
        _count: {
          eventType: 'desc',
        },
      },
    });

    // 3. RECENT EVENTS (last N days)
    const recentEventsCount = await prisma.placowkaEvent.count({
      where: {
        timestamp: {
          gte: startDate,
        },
      },
    });

    // 4. TOP 10 MOST VIEWED FACILITIES
    const topViewed = await prisma.placowkaEvent.groupBy({
      by: ['placowkaId'],
      where: {
        eventType: 'view',
      },
      _count: {
        placowkaId: true,
      },
      orderBy: {
        _count: {
          placowkaId: 'desc',
        },
      },
      take: 10,
    });

    // Fetch facility details for top viewed
    const topViewedIds = topViewed.map((item) => item.placowkaId);
    const facilities = await prisma.placowka.findMany({
      where: {
        id: {
          in: topViewedIds,
        },
      },
      select: {
        id: true,
        nazwa: true,
        miejscowosc: true,
        wojewodztwo: true,
        typ_placowki: true,
      },
    });

    const topViewedWithDetails = topViewed.map((item) => {
      const facility = facilities.find((f) => f.id === item.placowkaId);
      return {
        ...facility,
        views: item._count.placowkaId,
      };
    });

    // 5. TOP 10 MOST CONTACTED (phone + email + website)
    const contactEvents = await prisma.placowkaEvent.groupBy({
      by: ['placowkaId'],
      where: {
        eventType: {
          in: ['phone_click', 'email_click', 'website_click'],
        },
      },
      _count: {
        placowkaId: true,
      },
      orderBy: {
        _count: {
          placowkaId: 'desc',
        },
      },
      take: 10,
    });

    const topContactedIds = contactEvents.map((item) => item.placowkaId);
    const contactedFacilities = await prisma.placowka.findMany({
      where: {
        id: {
          in: topContactedIds,
        },
      },
      select: {
        id: true,
        nazwa: true,
        miejscowosc: true,
        wojewodztwo: true,
        typ_placowki: true,
      },
    });

    const topContactedWithDetails = contactEvents.map((item) => {
      const facility = contactedFacilities.find((f) => f.id === item.placowkaId);
      return {
        ...facility,
        contacts: item._count.placowkaId,
      };
    });

    // 6. RECENT ACTIVITY (last 20 events)
    const recentActivity = await prisma.placowkaEvent.findMany({
      take: 20,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        placowka: {
          select: {
            id: true,
            nazwa: true,
            miejscowosc: true,
          },
        },
      },
    });

    // 7. DAILY ACTIVITY (last N days) for chart
    const dailyActivity = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM "PlacowkaEvent"
      WHERE timestamp >= ${startDate}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

    // Convert BigInt to Number for JSON serialization
    const dailyActivityFormatted = dailyActivity.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      count: Number(item.count),
    }));

    // 8. STATS BY WOJEWODZTWO
    const statsByWojewodztwo = await prisma.$queryRaw<Array<{ wojewodztwo: string; views: bigint; contacts: bigint }>>`
      SELECT 
        p.wojewodztwo,
        COUNT(CASE WHEN pe."eventType" = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN pe."eventType" IN ('phone_click', 'email_click', 'website_click') THEN 1 END) as contacts
      FROM "PlacowkaEvent" pe
      JOIN "Placowka" p ON pe."placowkaId" = p.id
      WHERE pe.timestamp >= ${startDate}
      GROUP BY p.wojewodztwo
      ORDER BY views DESC
    `;

    const statsByWojewodztwoFormatted = statsByWojewodztwo.map((item) => ({
      wojewodztwo: item.wojewodztwo,
      views: Number(item.views),
      contacts: Number(item.contacts),
    }));

    // 9. CONVERSION FUNNEL DATA ⭐ NEW!
    const conversionData = await prisma.$queryRaw<Array<{
      total_views: bigint;
      total_contacts: bigint;
      unique_facilities_viewed: bigint;
      unique_facilities_contacted: bigint;
    }>>`
      SELECT 
        COUNT(CASE WHEN pe."eventType" = 'view' THEN 1 END) as total_views,
        COUNT(CASE WHEN pe."eventType" IN ('phone_click', 'email_click', 'website_click') THEN 1 END) as total_contacts,
        COUNT(DISTINCT CASE WHEN pe."eventType" = 'view' THEN pe."placowkaId" END) as unique_facilities_viewed,
        COUNT(DISTINCT CASE WHEN pe."eventType" IN ('phone_click', 'email_click', 'website_click') THEN pe."placowkaId" END) as unique_facilities_contacted
      FROM "PlacowkaEvent" pe
      WHERE pe.timestamp >= ${startDate}
    `;

    const conversionStats = conversionData[0];
    const totalViews = Number(conversionStats.total_views);
    const totalContacts = Number(conversionStats.total_contacts);
    const conversionRate = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(2) : '0.00';

    // Top facilities by conversion rate (min 1 view to be included)
    const conversionByFacility = await prisma.$queryRaw<Array<{
      placowka_id: number;
      views: bigint;
      contacts: bigint;
      conversion_rate: number;
    }>>`
      SELECT 
        pe."placowkaId" as placowka_id,
        COUNT(CASE WHEN pe."eventType" = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN pe."eventType" IN ('phone_click', 'email_click', 'website_click') THEN 1 END) as contacts,
        CASE 
          WHEN COUNT(CASE WHEN pe."eventType" = 'view' THEN 1 END) > 0 
          THEN ROUND(
            CAST(
              (COUNT(CASE WHEN pe."eventType" IN ('phone_click', 'email_click', 'website_click') THEN 1 END)::float / 
              COUNT(CASE WHEN pe."eventType" = 'view' THEN 1 END)::float) * 100 
            AS numeric), 
            2
          )
          ELSE 0
        END as conversion_rate
      FROM "PlacowkaEvent" pe
      WHERE pe.timestamp >= ${startDate}
      GROUP BY pe."placowkaId"
      HAVING COUNT(CASE WHEN pe."eventType" = 'view' THEN 1 END) >= 1
      ORDER BY conversion_rate DESC
      LIMIT 10
    `;

    const conversionFacilityIds = conversionByFacility.map(f => Number(f.placowka_id));
    const conversionFacilities = await prisma.placowka.findMany({
      where: { id: { in: conversionFacilityIds } },
      select: { id: true, nazwa: true, miejscowosc: true, typ_placowki: true },
    });

    const topConversionFacilities = conversionByFacility.map(item => {
      const facility = conversionFacilities.find(f => f.id === Number(item.placowka_id));
      return {
        ...facility,
        views: Number(item.views),
        contacts: Number(item.contacts),
        conversionRate: Number(item.conversion_rate),
      };
    });

    return NextResponse.json({
      overview: {
        totalEvents,
        recentEventsCount,
        eventsByType: eventsByType.map((item) => ({
          type: item.eventType,
          count: item._count.eventType,
        })),
      },
      conversionFunnel: {
        totalViews,
        totalContacts,
        conversionRate: parseFloat(conversionRate),
        uniqueFacilitiesViewed: Number(conversionStats.unique_facilities_viewed),
        uniqueFacilitiesContacted: Number(conversionStats.unique_facilities_contacted),
        topConversionFacilities,
      },
      topViewed: topViewedWithDetails,
      topContacted: topContactedWithDetails,
      recentActivity: recentActivity.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        timestamp: event.timestamp,
        placowka: event.placowka,
      })),
      dailyActivity: dailyActivityFormatted,
      statsByWojewodztwo: statsByWojewodztwoFormatted,
      dateRange: {
        from: startDate.toISOString(),
        to: new Date().toISOString(),
        days,
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}