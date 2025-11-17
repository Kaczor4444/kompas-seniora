import { NextRequest, NextResponse } from 'next/server';

// Normalizacja polskich znaków dla geocodingu
function normalizePolish(text: string): string {
  return text
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .replace(/ą/g, "a")
    .replace(/Ą/g, "A")
    .replace(/ć/g, "c")
    .replace(/Ć/g, "C")
    .replace(/ę/g, "e")
    .replace(/Ę/g, "E")
    .replace(/ń/g, "n")
    .replace(/Ń/g, "N")
    .replace(/ó/g, "o")
    .replace(/Ó/g, "O")
    .replace(/ś/g, "s")
    .replace(/Ś/g, "S")
    .replace(/ź/g, "z")
    .replace(/Ź/g, "Z")
    .replace(/ż/g, "z")
    .replace(/Ż/g, "Z");
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ulica = searchParams.get('ulica') || '';
    const miejscowosc = searchParams.get('miejscowosc') || '';
    const wojewodztwo = searchParams.get('wojewodztwo') || '';

    if (!miejscowosc) {
      return NextResponse.json(
        { error: 'Miejscowość jest wymagana' },
        { status: 400 }
      );
    }

    // Normalizuj przed wysłaniem do Nominatim
    const ulicaNorm = ulica ? normalizePolish(ulica) : '';
    const miejscowoscNorm = normalizePolish(miejscowosc);
    const wojewodztwoNorm = wojewodztwo ? normalizePolish(wojewodztwo) : '';

    const addressParts = [ulicaNorm, miejscowoscNorm, wojewodztwoNorm, 'Poland'].filter(Boolean);
    const address = addressParts.join(', ');

    console.log('🌍 Geocoding:', address);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'KompasSeniora/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      console.log('  ❌ Nie znaleziono');
      return NextResponse.json({
        success: false,
        message: 'Nie znaleziono lokalizacji'
      });
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    console.log(`  ✅ Znaleziono: ${lat}, ${lon}`);

    return NextResponse.json({
      success: true,
      latitude: lat,
      longitude: lon,
      display_name: result.display_name
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Błąd geocodingu' },
      { status: 500 }
    );
  }
}
