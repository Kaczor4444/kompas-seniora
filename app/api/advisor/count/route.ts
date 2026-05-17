import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EXCLUDED_FROM_MAIN } from '@/lib/voivodeship-filter';

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
    } else if (!type) {
      // brak filtra — wyklucz ŚDS i UTW z licznika opieki
      where.typ_placowki = { notIn: EXCLUDED_FROM_MAIN as unknown as string[] };
    }

    if (powiat) {
      where.powiat = { contains: powiat.slice(0, 100), mode: 'insensitive' };
    }

    const count = await prisma.placowka.count({ where });

    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
