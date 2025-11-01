import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '@/src/utils/generateToken';

const prisma = new PrismaClient();

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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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