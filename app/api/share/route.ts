import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/src/utils/generateToken';



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

    let token = generateToken();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const existing = await prisma.sharedList.findUnique({
        where: { token }
      });

      if (!existing) break;
      
      token = generateToken();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique token' },
        { status: 500 }
      );
    }

    const sharedList = await prisma.sharedList.create({
      data: {
        token,
        ids: ids.join(','),
        views: 0
      }
    });

    // Automatic domain detection from request
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    const shareUrl = `${baseUrl}/s/${token}`;

    return NextResponse.json({
      success: true,
      token,
      url: shareUrl,
      created: sharedList.created
    });

  } catch (error) {
    console.error('Error creating shared list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}