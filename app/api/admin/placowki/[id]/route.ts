import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { formatPhoneNumber } from '@/lib/phone-utils';

// GET - Pojedyncza placówka (do edycji)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const placowka = await prisma.placowka.findUnique({
      where: { id },
    });

    if (!placowka) {
      return NextResponse.json({ error: 'Placówka nie znaleziona' }, { status: 404 });
    }

    // Convert dates to ISO strings for form
    const formattedPlacowka = {
      ...placowka,
      data_zrodla_dane: placowka.data_zrodla_dane?.toISOString().split('T')[0] || null,
      data_zrodla_cena: placowka.data_zrodla_cena?.toISOString().split('T')[0] || null,
      data_weryfikacji: placowka.data_weryfikacji?.toISOString().split('T')[0] || null,
    };

    return NextResponse.json({ placowka: formattedPlacowka });
  } catch (error) {
    console.error('GET placowka error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Aktualizacja placówki
const placowkaUpdateSchema = z.object({
  nazwa: z.string().min(3).max(200),
  typ_placowki: z.enum(['DPS', 'ŚDS']),
  prowadzacy: z.string().optional(),
  miejscowosc: z.string().min(2),
  ulica: z.string().optional(),
  kod_pocztowy: z.string().regex(/^\d{2}-\d{3}$/).optional().or(z.literal('')),
  gmina: z.string().optional(),
  powiat: z.string().min(2),
  wojewodztwo: z.string().min(2),
  telefon: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  www: z.string().url().optional().or(z.literal('')),
  liczba_miejsc: z.number().int().positive().optional(),
  koszt_pobytu: z.number().positive().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  profil_opieki: z.string().optional(),
  
  // Źródła
  zrodlo_dane: z.string().url().optional().or(z.literal('')),
  zrodlo_cena: z.string().url().optional().or(z.literal('')),
  data_zrodla_dane: z.string().optional(),
  data_zrodla_cena: z.string().optional(),
  data_weryfikacji: z.string().optional(),
  notatki: z.string().optional(),
  
  verified: z.boolean().default(false),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Check if placowka exists
    const existingPlacowka = await prisma.placowka.findUnique({
      where: { id },
    });

    if (!existingPlacowka) {
      return NextResponse.json({ error: 'Placówka nie znaleziona' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = placowkaUpdateSchema.parse(body);

    // 🆕 FORMATUJ TELEFON
    if (validatedData.telefon) {
      validatedData.telefon = formatPhoneNumber(validatedData.telefon);
    }

    const dataToUpdate = {
      ...validatedData,
      prowadzacy: validatedData.prowadzacy || null,
      ulica: validatedData.ulica || null,
      kod_pocztowy: validatedData.kod_pocztowy || null,
      gmina: validatedData.gmina || null,
      telefon: validatedData.telefon || null,
      email: validatedData.email || null,
      www: validatedData.www || null,
      liczba_miejsc: validatedData.liczba_miejsc || null,
      koszt_pobytu: validatedData.koszt_pobytu || null,
      latitude: validatedData.latitude || null,
      longitude: validatedData.longitude || null,
      profil_opieki: validatedData.profil_opieki || null,
      
      // Źródła - konwersja dat
      zrodlo_dane: validatedData.zrodlo_dane || null,
      zrodlo_cena: validatedData.zrodlo_cena || null,
      data_zrodla_dane: validatedData.data_zrodla_dane ? new Date(validatedData.data_zrodla_dane) : null,
      data_zrodla_cena: validatedData.data_zrodla_cena ? new Date(validatedData.data_zrodla_cena) : null,
      data_weryfikacji: validatedData.data_weryfikacji ? new Date(validatedData.data_weryfikacji) : null,
      notatki: validatedData.notatki || null,
      
      data_aktualizacji: new Date(),
    };

    const updatedPlacowka = await prisma.placowka.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      id: updatedPlacowka.id,
      message: 'Placówka zaktualizowana pomyślnie',
    });
  } catch (error) {
    console.error('PUT placowka error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Błąd walidacji danych', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Błąd serwera podczas aktualizacji' },
      { status: 500 }
    );
  }
}

// DELETE - Usunięcie placówki
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Check if placowka exists
    const placowka = await prisma.placowka.findUnique({
      where: { id },
      select: { id: true, nazwa: true },
    });

    if (!placowka) {
      return NextResponse.json({ error: 'Placówka nie znaleziona' }, { status: 404 });
    }

    // Delete placowka (cascade will handle related records)
    await prisma.placowka.delete({
      where: { id },
    });

    // Log security event
    await prisma.adminSecurityLog.create({
      data: {
        eventType: 'placowka_deleted',
        metadata: {
          placowkaId: id,
          placowkaNazwa: placowka.nazwa,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Placówka usunięta pomyślnie',
    });
  } catch (error) {
    console.error('DELETE placowka error:', error);
    return NextResponse.json(
      { error: 'Błąd serwera podczas usuwania' },
      { status: 500 }
    );
  }
}