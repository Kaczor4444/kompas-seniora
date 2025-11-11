import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    const sharedList = await prisma.sharedList.findUnique({
      where: { token }
    });

    if (!sharedList) {
      return NextResponse.json(
        { error: 'Shared list not found' },
        { status: 404 }
      );
    }

    await prisma.sharedList.update({
      where: { token },
      data: { views: { increment: 1 } }
    });

    const ids = sharedList.ids.split(',').map(id => parseInt(id, 10));

    const facilities = await prisma.placowka.findMany({
      where: {
        id: { in: ids }
      }
    });

    return NextResponse.json({
      success: true,
      ids,
      facilities,
      created: sharedList.created,
      views: sharedList.views + 1
    });

  } catch (error) {
    console.error('Error fetching shared list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}