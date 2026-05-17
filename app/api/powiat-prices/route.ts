import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600;

export async function GET() {
  try {
    const rows = await prisma.placowka.groupBy({
      by: ['powiat'],
      where: { typ_placowki: 'DPS', koszt_pobytu: { not: null } },
      _avg: { koszt_pobytu: true },
      _count: { id: true },
    });

    const data: Record<string, { avg: number; count: number }> = {};
    for (const row of rows) {
      if (row._avg.koszt_pobytu) {
        data[row.powiat] = {
          avg: Math.round(row._avg.koszt_pobytu),
          count: row._count.id,
        };
      }
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, data: {} }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
