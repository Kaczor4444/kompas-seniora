import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ALLOWED_EVENTS = [
  'empty_results',
  'filter_applied',
  'scroll_depth',
  'return_visit',
  'cross_powiat_view',
  'calculator_start',
  'calculator_result',
  'calculator_no_results',
  'advisor_start',
  'advisor_step',
  'advisor_completed',
  'advisor_abandoned',
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, metadata, language } = body;

    if (!eventType || !ALLOWED_EVENTS.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const event = await prisma.appEvent.create({
      data: {
        eventType,
        language: language || null,
        metadata: metadata || undefined,
      },
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error) {
    console.error('App analytics track error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
