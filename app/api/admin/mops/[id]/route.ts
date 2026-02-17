import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

async function isAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin-auth')?.value === 'true';
}

const mopsUpdateSchema = z.object({
  city:         z.string().min(1),
  cityDisplay:  z.string().min(1),
  typ:          z.enum(['MOPS', 'GOPS', 'OPS', 'MOPR', 'CUS']).optional(),
  gmina:        z.string().optional().or(z.literal('')),
  name:         z.string().min(1),
  phone:        z.string().min(1),
  email:        z.string().email().optional().or(z.literal('')),
  address:      z.string().min(1),
  website:      z.string().url().optional().or(z.literal('')),
  wojewodztwo:  z.string().min(1),
  latitude:     z.number().nullable().optional(),
  longitude:    z.number().nullable().optional(),
  verified:     z.boolean(),
  notes:        z.string().optional().or(z.literal('')),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const record = await prisma.mopsContact.findUnique({ where: { id: parseInt(id) } });
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(record);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = mopsUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const cityKey = data.city.trim().toLowerCase();

  // Sprawdź czy city nie koliduje z innym rekordem
  const conflict = await prisma.mopsContact.findFirst({
    where: { city: cityKey, NOT: { id: parseInt(id) } },
  });
  if (conflict) {
    return NextResponse.json({ error: `Miasto "${data.cityDisplay}" już istnieje w innym wpisie` }, { status: 409 });
  }

  const record = await prisma.mopsContact.update({
    where: { id: parseInt(id) },
    data: {
      city:         cityKey,
      cityDisplay:  data.cityDisplay.trim(),
      ...(data.typ && { typ: data.typ }),
      gmina:        data.gmina?.trim() || null,
      name:         data.name.trim(),
      phone:        data.phone.trim(),
      email:        data.email || null,
      address:      data.address.trim(),
      website:      data.website || null,
      wojewodztwo:  data.wojewodztwo,
      latitude:     data.latitude ?? null,
      longitude:    data.longitude ?? null,
      verified:     data.verified,
      lastVerified: data.verified ? new Date() : null,
      notes:        data.notes || null,
    },
  });

  return NextResponse.json({ success: true, record });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await prisma.mopsContact.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
