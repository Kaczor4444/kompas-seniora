import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { formatPhoneNumber } from '@/lib/phone-utils';

// GET - Lista placówek z filtrowaniem i paginacją
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const isAuthenticated = cookieStore.get("admin-auth")?.value === "true";

    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const sort = searchParams.get("sort") || "id";
    const order = searchParams.get("order") || "desc";
    const typ = searchParams.get("typ") || "";
    const wojewodztwo = searchParams.get("wojewodztwo") || "";
    const verified = searchParams.get("verified") || "";
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (typ) where.typ_placowki = typ;
    if (wojewodztwo) where.wojewodztwo = wojewodztwo;
    if (verified === "true") where.verified = true;
    if (verified === "false") where.verified = false;
    if (search) {
      where.OR = [
        { nazwa: { contains: search, mode: "insensitive" } },
        { miejscowosc: { contains: search, mode: "insensitive" } },
        { ulica: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count
    const total = await prisma.placowka.count({ where });

    // Get paginated data
    const placowki = await prisma.placowka.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: order },
      select: {
        id: true,
        nazwa: true,
        typ_placowki: true,
        miejscowosc: true,
        ulica: true,
        powiat: true,
        wojewodztwo: true,
        latitude: true,
        longitude: true,
        verified: true,
        data_weryfikacji: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      placowki,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET placowki error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


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
  koszt_pobytu: z.number().nonnegative().optional(),
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

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const isAuthenticated = cookieStore.get('admin-auth')?.value === 'true';
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = placowkaSchema.parse(body);
    
    // 🆕 FORMATUJ TELEFON
    if (validatedData.telefon) {
      validatedData.telefon = formatPhoneNumber(validatedData.telefon);
    }
    
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