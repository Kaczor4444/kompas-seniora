import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma';
import { ENABLED_VOIVODESHIPS, getVoivodeshipFilter } from '@/lib/voivodeship-filter';
import { PUBLIC_PLACOWKA_COLUMNS, PUBLIC_PLACOWKA_SELECT, pickPublicFields } from '@/lib/public-placowka-fields';

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

// Returns SQL expression normalizing Polish chars in a column (static column name, no user input)
function normCol(col: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${col}, 'ą', 'a'), 'ć', 'c'), 'ę', 'e'), 'ł', 'l'), 'ń', 'n'), 'ó', 'o'), 'ś', 's'), 'ź', 'z'), 'ż', 'z'))`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const rawType = searchParams.get('type')

    // Allowlist for type — prevents SQL injection even if parameterization were bypassed
    const type = ['DPS', 'ŚDS'].includes(rawType ?? '') ? (rawType as 'DPS' | 'ŚDS') : null

    const searchNormalized = search ? normalizePolish(search.trim()) : null
    const likeParam = searchNormalized ? `%${searchNormalized}%` : null

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Search:', search, '| Type:', type)
    }

    let placowki: any[]

    const voivodeships = Prisma.join(ENABLED_VOIVODESHIPS)

    // All raw queries use Prisma.sql tagged template literals — user inputs are parameterized,
    // never interpolated as SQL structure. This prevents SQL injection.
    // PUBLIC_PLACOWKA_COLUMNS used instead of SELECT * to avoid leaking admin fields.
    const cols = Prisma.raw(PUBLIC_PLACOWKA_COLUMNS);
    if (likeParam && type) {
      const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT ${cols} FROM "Placowka"
        WHERE wojewodztwo IN (${voivodeships})
        AND (
          ${normCol(Prisma.raw('"miejscowosc"'))} LIKE ${likeParam} OR
          ${normCol(Prisma.raw('"gmina"'))}      LIKE ${likeParam} OR
          ${normCol(Prisma.raw('"powiat"'))}     LIKE ${likeParam} OR
          ${normCol(Prisma.raw('"nazwa"'))}      LIKE ${likeParam}
        )
        AND typ_placowki = ${type}
        ORDER BY nazwa ASC
      `)
      placowki = rows.map(pickPublicFields);
    } else if (likeParam) {
      const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT ${cols} FROM "Placowka"
        WHERE wojewodztwo IN (${voivodeships})
        AND (
          ${normCol(Prisma.raw('"miejscowosc"'))} LIKE ${likeParam} OR
          ${normCol(Prisma.raw('"gmina"'))}      LIKE ${likeParam} OR
          ${normCol(Prisma.raw('"powiat"'))}     LIKE ${likeParam} OR
          ${normCol(Prisma.raw('"nazwa"'))}      LIKE ${likeParam}
        )
        ORDER BY nazwa ASC
      `)
      placowki = rows.map(pickPublicFields);
    } else if (type) {
      const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT ${cols} FROM "Placowka"
        WHERE wojewodztwo IN (${voivodeships})
        AND typ_placowki = ${type}
        ORDER BY nazwa ASC
      `)
      placowki = rows.map(pickPublicFields);
    } else {
      placowki = await prisma.placowka.findMany({
        where: getVoivodeshipFilter(),
        orderBy: { nazwa: 'asc' },
        select: PUBLIC_PLACOWKA_SELECT,
      })
    }

    return NextResponse.json({
      success: true,
      data: placowki,
      count: placowki.length
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Błąd pobierania danych' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
