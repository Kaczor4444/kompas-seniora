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
  return str.normalize('NFC').trim()
}

// ✅ POPRAWIONE: Lepsze parsowanie kosztów z przecinkami i spacjami
function parseKosztPobytu(koszt: string): number | null {
  if (!koszt) return null
  
  // Normalizuj i zamień na lowercase
  const normalized = normalizeText(koszt).toLowerCase()
  
  // Sprawdź czy bezpłatne (różne warianty)
  if (
    normalized.includes('bezpłatne') || 
    normalized.includes('bezplatne') ||
    normalized.includes('free') ||
    normalized === '0'
  ) {
    return 0
  }
  
  // Usuń wszystko oprócz cyfr i przecinków
  let cleaned = koszt.replace(/[^\d,]/g, '')
  
  // Zamień przecinek na kropkę (polski format → JS format)
  cleaned = cleaned.replace(',', '.')
  
  if (!cleaned) return null
  
  // Parsuj jako float i zaokrąglij do pełnych złotych
  const parsed = Math.round(parseFloat(cleaned))
  
  // Walidacja: koszt pobytu w rozsądnym zakresie (0-15000 PLN)
  if (parsed < 0 || parsed > 15000) {
    console.warn(`⚠️  Podejrzanie wysoki/niski koszt: ${parsed} PLN dla "${koszt}"`)
    return null
  }
  
  return parsed
}

// ✅ POPRAWIONE: Lepsze parsowanie dat z walidacją
function parseDate(dateStr: string): Date {
  if (!dateStr) {
    console.warn('⚠️  Brak daty, używam dzisiejszej')
    return new Date()
  }
  
  // Try DD/MM/YYYY format (European)
  const parts = dateStr.trim().split('/')
  
  if (parts.length === 3) {
    const day = parseInt(parts[0])
    const month = parseInt(parts[1])
    const year = parseInt(parts[2])
    
    // Walidacja
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000) {
      // JavaScript Date używa month 0-indexed (0 = styczeń)
      const date = new Date(year, month - 1, day)
      
      // Dodatkowa walidacja - sprawdź czy data jest sensowna
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date
      }
    }
  }
  
  console.warn(`⚠️  Nie mogę sparsować daty: "${dateStr}", używam dzisiejszej`)
  return new Date()
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
    
    console.log('\n🔍 Debug pierwszego rekordu:')
    console.log('Nazwa:', rows[0].nazwa)
    console.log('Koszt (raw):', rows[0].koszt_pobytu)
    console.log('Koszt (parsed):', parseKosztPobytu(rows[0].koszt_pobytu))
    console.log('Data (raw):', rows[0].data_aktualizacji)
    console.log('Data (parsed):', parseDate(rows[0].data_aktualizacji))
    console.log('')
    
    console.log(`📊 Znaleziono ${rows.length} rekordów\n`)
    
    let successCount = 0
    let errorCount = 0
    
    for (const row of rows) {
      try {
        const parsedKoszt = parseKosztPobytu(row.koszt_pobytu)
        const parsedData = parseDate(row.data_aktualizacji)
        
        await prisma.placowka.create({
          data: {
            nazwa: normalizeText(row.nazwa) || '',
            typ_placowki: normalizeText(row.typ_placowki) || '',
            prowadzacy: normalizeText(row.prowadzacy) || '',
            data_aktualizacji: parsedData,
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
            koszt_pobytu: parsedKoszt,
          }
        })
        
        successCount++
        
        // Pokaż tylko co 10. rekord żeby nie zaśmiecać konsoli
        if (successCount % 10 === 0 || successCount === 1) {
          console.log(`✅ ${successCount}/${rows.length}: ${row.nazwa}`)
        }
        
      } catch (error: any) {
        errorCount++
        console.error(`❌ Błąd przy: ${row.nazwa}`, error.message)
      }
    }
    
    const count = await prisma.placowka.count()
    
    console.log(`\n🎉 Sukces! Zaimportowano ${successCount} placówek`)
    console.log(`📊 Łącznie w bazie: ${count} rekordów`)
    
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