import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Funkcja normalizująca telefon
function normalizePhone(phone: string): string {
  return phone
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/\+48/g, '')
    .replace(/^\(?\d{2}\)?/, '')
    .trim();
}

// Funkcja normalizująca polskie znaki i whitespace
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
    .replace(/ul\./g, '')
    .replace(/os\./g, '')
    .replace(/\s+/g, ' ')
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

    // Normalizuj inputy
    const normalizedMiejscowosc = normalizeText(miejscowosc);
    const normalizedUlica = ulica ? normalizeText(ulica) : null;
    const normalizedTelefon = telefon ? normalizePhone(telefon) : null;

    // Pobierz wszystkie placówki (będziemy filtrować w pamięci)
    const allPlacowki = await prisma.placowka.findMany({
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

    // PRIORYTET 1: Ulica + Miejscowość
    if (normalizedUlica && normalizedUlica.length >= 3) {
      for (const placowka of allPlacowki) {
        const dbUlica = placowka.ulica ? normalizeText(placowka.ulica) : '';
        const dbMiejscowosc = normalizeText(placowka.miejscowosc);

        if (dbUlica.includes(normalizedUlica) && dbMiejscowosc === normalizedMiejscowosc) {
          return NextResponse.json({
            exists: true,
            placowka,
            matchedBy: 'ulica',
          });
        }
      }
    }

    // PRIORYTET 2: Telefon
    if (normalizedTelefon && normalizedTelefon.length >= 7) {
      for (const placowka of allPlacowki) {
        if (placowka.telefon) {
          const dbTelefon = normalizePhone(placowka.telefon);
          if (dbTelefon === normalizedTelefon) {
            return NextResponse.json({
              exists: true,
              placowka,
              matchedBy: 'telefon',
            });
          }
        }
      }
    }

    // PRIORYTET 3: Nazwa + Miejscowość
    if (nazwa && nazwa.length >= 3) {
      const normalizedNazwa = normalizeText(nazwa);
      for (const placowka of allPlacowki) {
        const dbNazwa = normalizeText(placowka.nazwa);
        const dbMiejscowosc = normalizeText(placowka.miejscowosc);

        if (dbNazwa.includes(normalizedNazwa) && dbMiejscowosc === normalizedMiejscowosc) {
          return NextResponse.json({
            exists: true,
            placowka,
            matchedBy: 'nazwa',
          });
        }
      }
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Error checking duplicate:', error);
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
