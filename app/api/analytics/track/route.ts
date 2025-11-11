// app/api/analytics/track/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


// Event types
export type AnalyticsEventType = 
  | 'view'
  | 'phone_click'
  | 'email_click'
  | 'website_click'
  | 'favorite_add'
  | 'favorite_remove'
  | 'compare_add'
  | 'share';

interface TrackEventRequest {
  placowkaId: number;
  eventType: AnalyticsEventType;
  metadata?: Record<string, any>;
}

export async function POST(request: Request) {
  try {
    const body: TrackEventRequest = await request.json();

    // Validation
    if (!body.placowkaId || typeof body.placowkaId !== 'number') {
      return NextResponse.json(
        { error: 'placowkaId is required and must be a number' },
        { status: 400 }
      );
    }

    if (!body.eventType) {
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      );
    }

    const validEventTypes: AnalyticsEventType[] = [
      'view',
      'phone_click',
      'email_click',
      'website_click',
      'favorite_add',
      'favorite_remove',
      'compare_add',
      'share'
    ];

    if (!validEventTypes.includes(body.eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user info from headers (basic fingerprinting)
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referer = request.headers.get('referer') || null;
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Create analytics event
    const event = await prisma.placowkaEvent.create({
      data: {
        placowkaId: body.placowkaId,
        eventType: body.eventType,
        userAgent,
        referer,
        ipAddress: ip,
        metadata: body.metadata || {},
      }
    });

    console.log('📊 Analytics tracked:', {
      id: event.id,
      placowkaId: body.placowkaId,
      eventType: body.eventType,
      timestamp: event.timestamp
    });

    return NextResponse.json({
      success: true,
      eventId: event.id
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Analytics tracking error:', error);
    
    // Don't fail the request if analytics fails
    // Just log and return success
    return NextResponse.json({
      success: false,
      error: 'Failed to track event'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Optional: GET endpoint to retrieve analytics (admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placowkaId = searchParams.get('placowkaId');

    if (!placowkaId) {
      return NextResponse.json(
        { error: 'placowkaId is required' },
        { status: 400 }
      );
    }

    const stats = await prisma.placowkaAnalytics.groupBy({
      by: ['eventType'],
      where: {
        placowkaId: parseInt(placowkaId)
      },
      _count: {
        eventType: true
      }
    });

    return NextResponse.json({
      placowkaId: parseInt(placowkaId),
      stats: stats.map(s => ({
        eventType: s.eventType,
        count: s._count.eventType
      }))
    });

  } catch (error) {
    console.error('❌ Analytics retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}