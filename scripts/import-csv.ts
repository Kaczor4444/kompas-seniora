import { PrismaClient } from '@prisma/client'
import Papa from 'papaparse'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface CSVRow {
  id: string
  nazwa: string
  typ_placowki: string
  prowadzacy: string
  data_aktualizacji: string
  zrodlo: string
  wojewodztwo: string
  powiat: string
  gmina: string
  miasto_wies: string
  ulica: string
  kod_pocztowy: string
  geo_lat: string
  geo_long: string
  telefon: string
  email: string
  www: string
  liczba_miejsc: string
  profil_opieki: string
  koszt_pobytu: string
  opis: string
}

function normalizeText(str: string): string {
  if (!str) return ''
  // NFC normalizuje znaki Unicode do standardowej formy
  return str.normalize('NFC').trim()
}

function parseKosztPobytu(koszt: string): number | null {
  if (!koszt || koszt.toLowerCase().includes('bezpłatne')) return 0
  const match = koszt.match(/\d+/)
  return match ? parseInt(match[0]) : null
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  // Try DD/MM/YYYY format
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return new Date(`${year}-${month}-${day}`)
  }
  return null
}

async function importData() {
  try {
    console.log('🔄 Czyszczenie bazy danych...')
    await prisma.placowka.deleteMany()

    console.log('📂 Wczytywanie pliku CSV...')
    const csvPath = path.join(process.cwd(), 'placowki-new.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')

    const result = Papa.parse<CSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      delimiter: ',',
      quoteChar: '"',
      escapeChar: '"',
      newline: '\n'
    })

    const rows = result.data.filter(row => row.nazwa && row.nazwa.trim())
    console.log('🔍 Debug pierwszego rekordu:', JSON.stringify(rows[0], null, 2))
    console.log(`📊 Znaleziono ${rows.length} rekordów`)

    let successCount = 0
    let errorCount = 0

    for (const row of rows) {
      try {
        await prisma.placowka.create({
          data: {
            nazwa: normalizeText(row.nazwa) || '',
            typ_placowki: normalizeText(row.typ_placowki) || '',
            prowadzacy: normalizeText(row.prowadzacy) || '',
            data_aktualizacji: parseDate(row.data_aktualizacji) || new Date(),
            zrodlo: normalizeText(row.zrodlo) || null,
            wojewodztwo: normalizeText(row.wojewodztwo) || '',
            powiat: normalizeText(row.powiat) || '',
            gmina: normalizeText(row.gmina) || '',
            miejscowosc: normalizeText(row.miasto_wies) || '',
            ulica: normalizeText(row.ulica) || null,
            kod_pocztowy: normalizeText(row.kod_pocztowy) || null,
            geo_lat: row.geo_lat ? parseFloat(row.geo_lat) : null,
            geo_lng: row.geo_long ? parseFloat(row.geo_long) : null,
            telefon: normalizeText(row.telefon) || null,
            email: normalizeText(row.email) || null,
            www: normalizeText(row.www) || null,
            liczba_miejsc: row.liczba_miejsc ? parseInt(row.liczba_miejsc) : null,
            profil_opieki: normalizeText(row.profil_opieki) || null,
            koszt_pobytu: parseKosztPobytu(row.koszt_pobytu),
          }
        })
        successCount++
        console.log(`✅ ${successCount}/${rows.length}: ${row.nazwa}`)
      } catch (error: any) {
        errorCount++
        console.error(`❌ Błąd przy: ${row.nazwa}`, error.message)
      }
    }

    const count = await prisma.placowka.count()
    console.log(`\n🎉 Sukces! Zaimportowano ${successCount} placówek`)
    if (errorCount > 0) {
      console.log(`⚠️  Błędy: ${errorCount} rekordów`)
    }
  } catch (error) {
    console.error('❌ Błąd importu:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importData()