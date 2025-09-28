import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    
    // Pobierz wszystkie placówki lub filtruj po miejscowości
    const placowki = await prisma.placowka.findMany({
      where: search ? {
        OR: [
          { miejscowosc: { contains: search } },
          { gmina: { contains: search } },
          { powiat: { contains: search } },
          { nazwa: { contains: search } }
        ]
      } : {},
      orderBy: {
        nazwa: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: placowki,
      count: placowki.length
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Błąd pobierania danych' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}