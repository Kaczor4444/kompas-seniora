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
  facebook: z.string().url().optional().or(z.literal('')),
  liczba_miejsc: z.number().int().positive().optional(),
  miejsca_za_zyciem: z.number().nonnegative().optional().nullable(),
  koszt_pobytu: z.number().nonnegative().optional(),
  rok_ceny: z.number().int().min(2024).max(2030).optional(),
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

    // Extract rok_ceny - it's NOT a Placowka field, only for PlacowkaCena
    const { rok_ceny, ...placowkaData } = validatedData;

    // 🆕 FORMATUJ TELEFON
    if (placowkaData.telefon) {
      placowkaData.telefon = formatPhoneNumber(placowkaData.telefon);
    }

    const dataToUpdate = {
      ...placowkaData,
      prowadzacy: placowkaData.prowadzacy || null,
      ulica: placowkaData.ulica || null,
      kod_pocztowy: placowkaData.kod_pocztowy || null,
      gmina: placowkaData.gmina || null,
      telefon: placowkaData.telefon || null,
      email: placowkaData.email || null,
      www: placowkaData.www || null,
      facebook: placowkaData.facebook || null,
      liczba_miejsc: placowkaData.liczba_miejsc || null,
      miejsca_za_zyciem: placowkaData.miejsca_za_zyciem ?? null,
      koszt_pobytu: placowkaData.koszt_pobytu || null,
      latitude: placowkaData.latitude || null,
      longitude: placowkaData.longitude || null,
      profil_opieki: placowkaData.profil_opieki || null,

      // Źródła - konwersja dat
      zrodlo_dane: placowkaData.zrodlo_dane || null,
      zrodlo_cena: placowkaData.zrodlo_cena || null,
      data_zrodla_dane: placowkaData.data_zrodla_dane ? new Date(placowkaData.data_zrodla_dane) : null,
      data_zrodla_cena: placowkaData.data_zrodla_cena ? new Date(placowkaData.data_zrodla_cena) : null,
      data_weryfikacji: placowkaData.data_weryfikacji ? new Date(placowkaData.data_weryfikacji) : null,
      notatki: placowkaData.notatki || null,

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