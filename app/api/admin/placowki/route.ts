import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const placowkaSchema = z.object({
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

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = placowkaSchema.parse(body);
    
    // Sprawdź czy to force add
    const forceAdd = body.forceAdd === true;

    // Sprawdzaj duplikaty tylko jeśli NIE jest force add
    if (!forceAdd) {
      const existing = await prisma.placowka.findFirst({
        where: {
          nazwa: validatedData.nazwa,
          miejscowosc: validatedData.miejscowosc,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Placówka o takiej nazwie już istnieje w tej miejscowości' },
          { status: 409 }
        );
      }
    }

    const dataToSave = {
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

    const newPlacowka = await prisma.placowka.create({
      data: dataToSave,
    });

    const currentYear = new Date().getFullYear();
    await prisma.placowkaSnapshot.create({
      data: {
        placowkaId: newPlacowka.id,
        rok: currentYear,
        nazwa: newPlacowka.nazwa,
        typ_placowki: newPlacowka.typ_placowki,
        miejscowosc: newPlacowka.miejscowosc,
        powiat: newPlacowka.powiat,
        wojewodztwo: newPlacowka.wojewodztwo,
        koszt_pobytu: newPlacowka.koszt_pobytu,
        liczba_miejsc: newPlacowka.liczba_miejsc,
        profil_opieki: newPlacowka.profil_opieki,
        status: 'aktywna',
      },
    });

    await prisma.placowkaAnalytics.create({
      data: { placowkaId: newPlacowka.id },
    });

    return NextResponse.json(
      { success: true, id: newPlacowka.id, message: 'Placówka dodana pomyślnie' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating placówka:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Błąd walidacji danych', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Błąd serwera podczas zapisywania' },
      { status: 500 }
    );
  }
}