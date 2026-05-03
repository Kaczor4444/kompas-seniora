import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ALLOWED_BOT_TYPES = ['ai_bot', 'search_bot', 'unknown'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { botType, botName, userAgent, path, referer } = body;

    if (!botType || !ALLOWED_BOT_TYPES.includes(botType)) {
      return NextResponse.json({ error: 'Invalid bot type' }, { status: 400 });
    }

    const stripCtrl = (s: string) => s.replace(/[\x00-\x1F\x7F]/g, '')

    await prisma.appEvent.create({
      data: {
        eventType: `bot_visit_${botType}`,
        metadata: {
          botName:   typeof botName   === 'string' ? stripCtrl(botName).slice(0, 200)   : undefined,
          userAgent: typeof userAgent === 'string' ? stripCtrl(userAgent).slice(0, 500) : undefined,
          path:      typeof path      === 'string' ? stripCtrl(path).slice(0, 500)      : undefined,
          referer:   typeof referer   === 'string' ? stripCtrl(referer).slice(0, 500)   : null,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bot tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
