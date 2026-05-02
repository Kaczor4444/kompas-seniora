import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/src/utils/generateToken';

const ALLOWED_ORIGINS = [
  'https://kompaseniora.pl',
  'https://www.kompaseniora.pl',
  'https://kompas-seniora.vercel.app',
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate: max 50 IDs, each must be a positive integer
    if (ids.length > 50) {
      return NextResponse.json({ error: 'Too many IDs (max 50)' }, { status: 400 });
    }

    const validIds: number[] = ids
      .map((id: unknown) => Number(id))
      .filter((id: number) => Number.isInteger(id) && id > 0)

    if (validIds.length === 0) {
      return NextResponse.json({ error: 'No valid IDs provided' }, { status: 400 });
    }

    let token = generateToken();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await prisma.sharedList.findUnique({ where: { token } });
      if (!existing) break;
      token = generateToken();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json({ error: 'Failed to generate unique token' }, { status: 500 });
    }

    const sharedList = await prisma.sharedList.create({
      data: { token, ids: validIds.join(','), views: 0 }
    });

    // Use env var for base URL — never trust Host header (host header injection)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://kompaseniora.pl')
    const shareUrl = `${baseUrl}/s/${token}`;

    return NextResponse.json({
      success: true,
      token,
      url: shareUrl,
      created: sharedList.created
    });

  } catch (error) {
    console.error('Error creating shared list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
