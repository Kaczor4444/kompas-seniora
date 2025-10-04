import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Funkcja normalizująca polskie znaki
function normalizePolish(str: string): string {
  return str
    .toLowerCase()
    .replace(/ą/g, 'a')
    .replace(/ć/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ł/g, 'l')
    .replace(/ń/g, 'n')
    .replace(/ó/g, 'o')
    .replace(/ś/g, 's')
    .replace(/ź/g, 'z')
    .replace(/ż/g, 'z')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const searchNormalized = search ? normalizePolish(search) : null

    console.log('🔍 Search:', search)
    console.log('🔍 Search normalized:', searchNormalized)
    console.log('🔍 Type:', type)

    let placowki: any[]

    // Kombinacja search + type
    if (searchNormalized && type && type !== 'WSZYSTKIE') {
      placowki = await prisma.$queryRawUnsafe(`
        SELECT * FROM placowki 
        WHERE (
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(miejscowosc, 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z')) LIKE '%${searchNormalized}%' OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(gmina, 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z')) LIKE '%${searchNormalized}%' OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(powiat, 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z')) LIKE '%${searchNormalized}%' OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(nazwa, 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z')) LIKE '%${searchNormalized}%'
        ) AND typ_placowki = '${type}'
        ORDER BY nazwa ASC
      `)
    } 
    // Tylko search, bez typu
    else if (searchNormalized) {
      placowki = await prisma.$queryRawUnsafe(`
        SELECT * FROM placowki 
        WHERE 
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(miejscowosc, 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z')) LIKE '%${searchNormalized}%' OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(gmina, 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z')) LIKE '%${searchNormalized}%' OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(powiat, 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z')) LIKE '%${searchNormalized}%' OR
          LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(nazwa, 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z')) LIKE '%${searchNormalized}%'
        ORDER BY nazwa ASC
      `)
    } 
    // Tylko typ, bez search
    else if (type && type !== 'WSZYSTKIE') {
      placowki = await prisma.$queryRawUnsafe(`
        SELECT * FROM placowki 
        WHERE typ_placowki = '${type}'
        ORDER BY nazwa ASC
      `)
    }
    // Wszystkie
    else {
      placowki = await prisma.placowka.findMany({
        orderBy: { nazwa: 'asc' }
      })
    }

    console.log('✅ Found:', placowki.length, 'placówek')

    return NextResponse.json({
      success: true,
      data: placowki,
      count: placowki.length
    })
  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Błąd pobierania danych' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}