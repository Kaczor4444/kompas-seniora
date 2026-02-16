import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

function isAuth(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return cookieStore.get('admin-auth')?.value === 'true';
}

const mopsSchema = z.object({
  city:         z.string().min(1, 'Wymagane'),
  cityDisplay:  z.string().min(1, 'Wymagane'),
  name:         z.string().min(1, 'Wymagane'),
  phone:        z.string().min(1, 'Wymagane'),
  email:        z.string().email('Nieprawidłowy email').optional().or(z.literal('')),
  address:      z.string().min(1, 'Wymagane'),
  website:      z.string().url('Nieprawidłowy URL').optional().or(z.literal('')),
  wojewodztwo:  z.string().min(1, 'Wymagane'),
  typ:          z.enum(['MOPS', 'GOPS', 'OPS', 'MOPR']).default('MOPS'),
  verified:     z.boolean().default(false),
  notes:        z.string().optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAuth(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search      = searchParams.get('search') || '';
  const wojewodztwo = searchParams.get('wojewodztwo') || '';
  const verified    = searchParams.get('verified') || '';
  const page        = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit       = parseInt(searchParams.get('limit') || '25');

  const where: any = {};

  if (search) {
    where.OR = [
      { cityDisplay: { contains: search, mode: 'insensitive' } },
      { name:        { contains: search, mode: 'insensitive' } },
      { address:     { contains: search, mode: 'insensitive' } },
    ];
  }
  if (wojewodztwo) where.wojewodztwo = wojewodztwo;
  if (verified === 'true')  where.verified = true;
  if (verified === 'false') where.verified = false;

  const [total, mops] = await Promise.all([
    prisma.mopsContact.count({ where }),
    prisma.mopsContact.findMany({
      where,
      orderBy: { cityDisplay: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    mops,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  if (!isAuth(cookieStore)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = mopsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const cityKey = data.city.trim().toLowerCase();

  // Sprawdź duplikat
  const existing = await prisma.mopsContact.findUnique({ where: { city: cityKey } });
  if (existing) {
    return NextResponse.json({ error: `Już istnieje wpis dla miasta "${existing.cityDisplay}"` }, { status: 409 });
  }

  const record = await prisma.mopsContact.create({
    data: {
      city:        cityKey,
      cityDisplay: data.cityDisplay.trim(),
      name:        data.name.trim(),
      phone:       data.phone.trim(),
      email:       data.email || null,
      address:     data.address.trim(),
      website:     data.website || null,
      wojewodztwo: data.wojewodztwo,
      verified:    data.verified,
      lastVerified: data.verified ? new Date() : null,
      notes:       data.notes || null,
    },
  });

  return NextResponse.json({ success: true, id: record.id }, { status: 201 });
}
