import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Funkcja normalizująca telefon (usuwa spacje, myślniki, +48)
function normalizePhone(phone: string): string {
  return phone
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/\+48/g, '')
    .replace(/^\(?\d{2}\)?/, '') // Usuń kod kierunkowy w nawiasach
    .trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nazwa = searchParams.get('nazwa');
    const miejscowosc = searchParams.get('miejscowosc');
    const ulica = searchParams.get('ulica');
    const telefon = searchParams.get('telefon');

    if (!miejscowosc || miejscowosc.length < 2) {
      return NextResponse.json({ exists: false });
    }

    let existing = null;

    // PRIORYTET 1: Ulica + Miejscowość (jeśli ulica podana)
    if (ulica && ulica.length >= 3) {
      existing = await prisma.placowka.findFirst({
        where: {
          ulica: {
            contains: ulica,
            mode: 'insensitive',
          },
          miejscowosc: {
            contains: miejscowosc,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          nazwa: true,
          typ_placowki: true,
          miejscowosc: true,
          ulica: true,
          powiat: true,
          wojewodztwo: true,
          telefon: true,
          email: true,
          www: true,
          verified: true,
          createdAt: true,
        },
      });

      if (existing) {
        return NextResponse.json({
          exists: true,
          placowka: existing,
          matchedBy: 'ulica',
        });
      }
    }

    // PRIORYTET 2: Telefon (jeśli podany)
    if (telefon && telefon.length >= 9) {
      const normalizedPhone = normalizePhone(telefon);
      
      // Pobierz wszystkie placówki z tej miejscowości
      const placowkiWithPhone = await prisma.placowka.findMany({
        where: {
          miejscowosc: {
            contains: miejscowosc,
            mode: 'insensitive',
          },
          telefon: {
            not: null,
          },
        },
        select: {
          id: true,
          nazwa: true,
          typ_placowki: true,
          miejscowosc: true,
          ulica: true,
          powiat: true,
          wojewodztwo: true,
          telefon: true,
          email: true,
          www: true,
          verified: true,
          createdAt: true,
        },
      });

      // Sprawdź znormalizowane telefony
      for (const placowka of placowkiWithPhone) {
        if (placowka.telefon) {
          const dbPhone = normalizePhone(placowka.telefon);
          if (dbPhone === normalizedPhone) {
            return NextResponse.json({
              exists: true,
              placowka,
              matchedBy: 'telefon',
            });
          }
        }
      }
    }

    // PRIORYTET 3: Nazwa + Miejscowość (fallback)
    if (nazwa && nazwa.length >= 3) {
      existing = await prisma.placowka.findFirst({
        where: {
          nazwa: {
            contains: nazwa,
            mode: 'insensitive',
          },
          miejscowosc: {
            contains: miejscowosc,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          nazwa: true,
          typ_placowki: true,
          miejscowosc: true,
          ulica: true,
          powiat: true,
          wojewodztwo: true,
          telefon: true,
          email: true,
          www: true,
          verified: true,
          createdAt: true,
        },
      });

      if (existing) {
        return NextResponse.json({
          exists: true,
          placowka: existing,
          matchedBy: 'nazwa',
        });
      }
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}