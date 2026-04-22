import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botType, botName, userAgent, path, referer } = body;

    if (!botType || !userAgent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Log to AppEvent table
    await prisma.appEvent.create({
      data: {
        eventType: `bot_visit_${botType}`, // e.g., "bot_visit_ai_bot" or "bot_visit_search_bot"
        metadata: {
          botName,
          userAgent,
          path,
          referer: referer || null,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bot tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
