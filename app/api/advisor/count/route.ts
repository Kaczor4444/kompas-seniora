import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'DPS' | 'ŚDS' | null
    const powiat = searchParams.get('powiat'); // optional powiat name

    const where: Record<string, unknown> = {
      wojewodztwo: { contains: 'małopolsk', mode: 'insensitive' },
    };

    if (type === 'DPS') {
      where.typ_placowki = { contains: 'DPS', mode: 'insensitive' };
    } else if (type === 'ŚDS') {
      where.typ_placowki = { contains: 'ŚDS', mode: 'insensitive' };
    }

    if (powiat) {
      where.powiat = { contains: powiat, mode: 'insensitive' };
    }

    const count = await prisma.placowka.count({ where });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
