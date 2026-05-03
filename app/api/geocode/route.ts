import { NextRequest, NextResponse } from 'next/server';
import { checkRedisRateLimit } from '@/lib/redis';

function normalizePolish(text: string): string {
  return text
    .replace(/ł/g, "l").replace(/Ł/g, "L")
    .replace(/ą/g, "a").replace(/Ą/g, "A")
    .replace(/ć/g, "c").replace(/Ć/g, "C")
    .replace(/ę/g, "e").replace(/Ę/g, "E")
    .replace(/ń/g, "n").replace(/Ń/g, "N")
    .replace(/ó/g, "o").replace(/Ó/g, "O")
    .replace(/ś/g, "s").replace(/Ś/g, "S")
    .replace(/ź/g, "z").replace(/Ź/g, "Z")
    .replace(/ż/g, "z").replace(/Ż/g, "Z");
}

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 30 req/min per IP (open endpoint → Nominatim relay)
    const ip = request.headers.get('x-real-ip') ||
      request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ||
      'unknown';
    const rl = await checkRedisRateLimit(ip, 30, 60, 'geocode');
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const ulica = (searchParams.get('ulica') || '').slice(0, 100);
    const miejscowosc = (searchParams.get('miejscowosc') || '').slice(0, 100);
    const wojewodztwo = (searchParams.get('wojewodztwo') || '').slice(0, 100);

    if (!miejscowosc) {
      return NextResponse.json(
        { error: 'Miejscowość jest wymagana' },
        { status: 400 }
      );
    }

    const ulicaNorm = ulica ? normalizePolish(ulica) : '';
    const miejscowoscNorm = normalizePolish(miejscowosc);
    const wojewodztwoNorm = wojewodztwo ? normalizePolish(wojewodztwo) : '';

    const addressParts = [ulicaNorm, miejscowoscNorm, wojewodztwoNorm, 'Poland'].filter(Boolean);
    const address = addressParts.join(', ');

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

    const response = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'KompasSeniora/1.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nie znaleziono lokalizacji'
      });
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    return NextResponse.json({
      success: true,
      latitude: lat,
      longitude: lon,
      display_name: result.display_name
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Błąd geocodingu' },
      { status: 500 }
    );
  }
}
