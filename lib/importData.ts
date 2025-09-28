import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { normalizeProfilOpieki } from './profileMapping'

const prisma = new PrismaClient()

export async function importPlacowki() {
  try {
    console.log('Starting CSV import...')
    
    // Ścieżka do pliku CSV
    const csvPath = path.join(process.cwd(), 'data', 'malopolska-dps.csv')
    
    // Sprawdź czy plik istnieje
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found:', csvPath)
      return
    }
    
    // Wczytaj i parsuj CSV
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.trim().split('\n')
    const headers = lines[0].split(',')
    
    console.log('Found', lines.length - 1, 'records to import')
    
    // Przetwórz każdy wiersz (pomiń nagłówek)
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',')
      const record: any = {}
      
      // Mapuj kolumny na obiekt
      headers.forEach((header, index) => {
        record[header.trim()] = values[index]?.trim() || null
      })
      
      // Twórz rekord w bazie
      await prisma.placowka.create({
        data: {
          nazwa: record.nazwa,
          typ_placowki: record.typ_placowki,
          prowadzacy: record.prowadzacy,
          ulica: record.ulica,
          miejscowosc: record.miejscowosc,
          kod_pocztowy: record.kod_pocztowy,
          gmina: record.gmina,
          powiat: record.powiat,
          wojewodztwo: record.wojewodztwo,
          telefon: record.telefon,
          email: record.email,
          www: record.www,
          liczba_miejsc: record.liczba_miejsc ? parseInt(record.liczba_miejsc) : null,
          profil_opieki: normalizeProfilOpieki(record.profil_opieki, record.typ_placowki),
          koszt_pobytu: record.koszt_pobytu ? parseFloat(record.koszt_pobytu) : null,
          data_aktualizacji: record.data_aktualizacji ? new Date(record.data_aktualizacji) : null,
          zrodlo: record.zrodlo
        }
      })
      
      console.log(`Imported: ${record.nazwa}`)
    }
    
    console.log('CSV import completed successfully!')
    
  } catch (error) {
    console.error('Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Uruchom import jeśli plik jest wywoływany bezpośrednio
if (require.main === module) {
  importPlacowki()
}