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

    // 9. CONVERSION FUNNEL DATA ⭐
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

    // 10. GEOGRAPHIC INSIGHTS ⭐
    const geographicData = await prisma.$queryRaw<Array<{
      miejscowosc: string;
      wojewodztwo: string;
      total_events: bigint;
      views: bigint;
      contacts: bigint;
      facilities_count: bigint;
    }>>`
      SELECT 
        p.miejscowosc,
        p.wojewodztwo,
        COUNT(pe.id) as total_events,
        COUNT(CASE WHEN pe."eventType" = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN pe."eventType" IN ('phone_click', 'email_click', 'website_click') THEN 1 END) as contacts,
        COUNT(DISTINCT p.id) as facilities_count
      FROM "Placowka" p
      LEFT JOIN "PlacowkaEvent" pe ON p.id = pe."placowkaId" 
        AND pe.timestamp >= ${startDate}
      GROUP BY p.miejscowosc, p.wojewodztwo
      HAVING COUNT(pe.id) > 0
      ORDER BY views DESC
      LIMIT 20
    `;

    const geographicStats = geographicData.map(item => ({
      city: item.miejscowosc,
      wojewodztwo: item.wojewodztwo,
      totalEvents: Number(item.total_events),
      views: Number(item.views),
      contacts: Number(item.contacts),
      facilitiesCount: Number(item.facilities_count),
      viewsPerFacility: Number(item.facilities_count) > 0 
        ? Number((Number(item.views) / Number(item.facilities_count)).toFixed(2))
        : 0,
      demandLevel: Number(item.views) / Number(item.facilities_count) > 10 
        ? 'high' 
        : Number(item.views) / Number(item.facilities_count) > 5 
          ? 'medium' 
          : 'low',
    }));

    // 11. TIME PATTERNS ⭐ NEW!
    // Hour of day distribution with breakdown
    const hourlyData = await prisma.$queryRaw<Array<{
      hour: number;
      total_events: bigint;
      views: bigint;
      contacts: bigint;
    }>>`
      SELECT 
        EXTRACT(HOUR FROM timestamp)::integer as hour,
        COUNT(*) as total_events,
        COUNT(CASE WHEN "eventType" = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN "eventType" IN ('phone_click', 'email_click', 'website_click') THEN 1 END) as contacts
      FROM "PlacowkaEvent"
      WHERE timestamp >= ${startDate}
      GROUP BY hour
      ORDER BY hour
    `;

    const hourlyStats = hourlyData.map(item => ({
      hour: Number(item.hour),
      totalEvents: Number(item.total_events),
      views: Number(item.views),
      contacts: Number(item.contacts),
    }));

    // Day of week distribution with breakdown
    const dailyData = await prisma.$queryRaw<Array<{
      day_of_week: number;
      total_events: bigint;
      views: bigint;
      contacts: bigint;
    }>>`
      SELECT 
        EXTRACT(DOW FROM timestamp)::integer as day_of_week,
        COUNT(*) as total_events,
        COUNT(CASE WHEN "eventType" = 'view' THEN 1 END) as views,
        COUNT(CASE WHEN "eventType" IN ('phone_click', 'email_click', 'website_click') THEN 1 END) as contacts
      FROM "PlacowkaEvent"
      WHERE timestamp >= ${startDate}
      GROUP BY day_of_week
      ORDER BY day_of_week
    `;

    const dayNames = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    
    const dailyStats = dailyData.map(item => ({
      dayOfWeek: Number(item.day_of_week),
      dayName: dayNames[Number(item.day_of_week)],
      totalEvents: Number(item.total_events),
      views: Number(item.views),
      contacts: Number(item.contacts),
    }));

    // Find peak hours (top 3)
    const sortedByActivity = [...hourlyStats].sort((a, b) => b.totalEvents - a.totalEvents);
    const peakHours = sortedByActivity.slice(0, 3);

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
      geographicInsights: {
        byCity: geographicStats,
        topCities: geographicStats.slice(0, 10),
        highDemandCities: geographicStats.filter(city => city.demandLevel === 'high'),
      },
      timePatterns: {
        hourly: hourlyStats,
        daily: dailyStats,
        peakHours: peakHours.map(h => ({
          hour: h.hour,
          totalEvents: h.totalEvents,
          label: `${h.hour}:00 - ${h.hour}:59`
        })),
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
      languageStats: await prisma.placowkaEvent.groupBy({
        by: ['language'],
        where: { timestamp: { gte: startDate } },
        _count: { language: true },
        orderBy: { _count: { language: 'desc' } },
      }).then(raw => {
        const total = raw.reduce((sum, r) => sum + r._count.language, 0);
        return raw.map(r => ({
          language: r.language || 'unknown',
          count: r._count.language,
          percent: total > 0 ? Math.round((r._count.language / total) * 100) : 0,
        }));
      }).catch(() => []),
      localInsights: await (async () => {
        const appEvents = await prisma.appEvent.findMany({
          where: { timestamp: { gte: startDate } },
          orderBy: { timestamp: 'desc' },
        });

        // 1. Empty results — top powiats with no results
        const emptyResults = appEvents
          .filter(e => e.eventType === 'empty_results')
          .reduce((acc: Record<string, number>, e) => {
            const m = e.metadata as any;
            const key = `${m?.powiat || '?'} / ${m?.type || 'all'}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
        const topEmptyResults = Object.entries(emptyResults)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([combo, count]) => ({ combo, count }));

        // 2. Filter combinations
        const filterCombos = appEvents
          .filter(e => e.eventType === 'filter_applied')
          .reduce((acc: Record<string, number>, e) => {
            const m = e.metadata as any;
            const key = m?.combo || 'unknown';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
        const topFilterCombos = Object.entries(filterCombos)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([combo, count]) => ({ combo, count }));

        // 3. Scroll depth distribution
        const scrollEvents = appEvents.filter(e => e.eventType === 'scroll_depth');
        const scrollDepth = [25, 50, 75, 100].map(depth => ({
          depth,
          count: scrollEvents.filter(e => (e.metadata as any)?.depth === depth).length,
        }));
        const totalScrollSessions = scrollDepth[0].count || 0;
        const scrollWithPercent = scrollDepth.map(d => ({
          ...d,
          percent: totalScrollSessions > 0 ? Math.round((d.count / totalScrollSessions) * 100) : 0,
        }));

        // 4. Return visitors
        const returnEvents = appEvents.filter(e => e.eventType === 'return_visit');
        const returnVisitorCount = returnEvents.length;
        const avgDaysBetweenVisits = returnVisitorCount > 0
          ? Math.round(returnEvents.reduce((sum, e) => sum + ((e.metadata as any)?.daysSince || 0), 0) / returnVisitorCount)
          : 0;

        // 5. Cross-powiat views
        const crossPowiatEvents = appEvents.filter(e => e.eventType === 'cross_powiat_view');
        const crossPowiatPaths = crossPowiatEvents
          .reduce((acc: Record<string, number>, e) => {
            const m = e.metadata as any;
            const key = `${m?.searchedPowiat} → ${m?.facilityPowiat}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
        const topCrossPowiatPaths = Object.entries(crossPowiatPaths)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([path, count]) => ({ path, count }));
        const crossPowiatRate = appEvents.filter(e => e.eventType === 'filter_applied').length > 0
          ? Math.round((crossPowiatEvents.length / appEvents.filter(e => e.eventType === 'filter_applied').length) * 100)
          : 0;

        // 6. Path to contact (viewsInSession from PlacowkaEvent metadata)
        const contactEvents = await prisma.placowkaEvent.findMany({
          where: {
            eventType: { in: ['phone_click', 'email_click', 'website_click'] },
            timestamp: { gte: startDate },
          },
          select: { metadata: true },
        });
        const viewsBeforeContact = contactEvents
          .map(e => (e.metadata as any)?.viewsInSession)
          .filter((v): v is number => typeof v === 'number');
        const avgViewsBeforeContact = viewsBeforeContact.length > 0
          ? Math.round(viewsBeforeContact.reduce((a, b) => a + b, 0) / viewsBeforeContact.length * 10) / 10
          : 0;
        const pathDistribution = [1, 2, 3, 4, 5].map(n => ({
          views: n === 5 ? '5+' : String(n),
          count: viewsBeforeContact.filter(v => n === 5 ? v >= 5 : v === n).length,
        }));

        return {
          emptyResults: { topCombos: topEmptyResults, total: scrollEvents.length > 0 ? appEvents.filter(e => e.eventType === 'empty_results').length : 0 },
          filterCombos: { topCombos: topFilterCombos },
          scrollDepth: scrollWithPercent,
          returnVisitors: { count: returnVisitorCount, avgDaysBetween: avgDaysBetweenVisits },
          crossPowiat: { topPaths: topCrossPowiatPaths, rate: crossPowiatRate, total: crossPowiatEvents.length },
          pathToContact: { avgViews: avgViewsBeforeContact, distribution: pathDistribution, totalContacts: viewsBeforeContact.length },
        };
      })().catch(() => null),
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