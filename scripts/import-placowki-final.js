const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();

// Funkcja parsująca polskie ceny
function parsePolishPrice(priceString) {
  if (!priceString || priceString.trim() === '') return null;
  
  const trimmed = priceString.trim().toLowerCase();
  
  // Jeśli "bezpłatne" → zwróć null
  if (trimmed.includes('bezpłatne') || trimmed.includes('bezplatne')) {
    return null;
  }
  
  // Usuń wszystkie znaki oprócz cyfr, przecinka i kropki
  let cleaned = priceString
    .replace(/[^\d,\.]/g, '')
    .replace(/\s+/g, '');
  
  // Zamień polski przecinek na kropkę
  cleaned = cleaned.replace(',', '.');
  
  const parsed = parseFloat(cleaned);
  
  // Walidacja: ceny DPS/ŚDS są zwykle 0-20000 zł
  if (isNaN(parsed) || parsed < 0 || parsed > 50000) {
    console.warn(`⚠️  Nieprawidłowa cena: "${priceString}" → ${parsed}`);
    return null;
  }
  
  return parsed;
}

// Walidacja rekordu przed zapisem
function validateRecord(record) {
  const errors = [];
  
  if (!record.nazwa || record.nazwa.trim() === '') {
    errors.push('Brak nazwy');
  }
  if (!record.typ_placowki || !['DPS', 'ŚDS'].includes(record.typ_placowki)) {
    errors.push('Nieprawidłowy typ_placowki');
  }
  if (!record.miasto_wies || record.miasto_wies.trim() === '') {
    errors.push('Brak miejscowości');
  }
  if (!record.powiat || record.powiat.trim() === '') {
    errors.push('Brak powiatu');
  }
  
  return errors;
}

async function main() {
  console.log('🚀 Rozpoczynam import placówek...\n');

  const csvPath = path.join(__dirname, '../data/placowki.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Plik nie istnieje:', csvPath);
    process.exit(1);
  }

  // Wczytaj i parsuj CSV
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(fileContent, {
    columns: true,           // Pierwsza linia = nagłówki
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,      // Toleruje błędy w cudzysłowach
    relax_column_count: true // Toleruje różną liczbę kolumn
  });
  
  console.log(`📊 Znaleziono ${records.length} rekordów w CSV\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const record of records) {
    // Walidacja
    const validationErrors = validateRecord(record);
    if (validationErrors.length > 0) {
      skippedCount++;
      console.warn(`⏭️  Pominięto: ${record.nazwa || 'BRAK NAZWY'} - ${validationErrors.join(', ')}`);
      continue;
    }
    
    try {
      const koszt_pobytu = parsePolishPrice(record.koszt_pobytu);
      
      await prisma.placowka.create({
        data: {
          nazwa: record.nazwa.trim(),
          typ_placowki: record.typ_placowki.trim(),
          prowadzacy: record.prowadzacy ? record.prowadzacy.trim() : null,
          ulica: record.ulica ? record.ulica.trim() : null,
          miejscowosc: record.miasto_wies.trim(), // ✅ POPRAWIONE: miasto_wies → miejscowosc
          kod_pocztowy: record.kod_pocztowy ? record.kod_pocztowy.trim() : null,
          gmina: record.gmina ? record.gmina.trim() : null,
          powiat: record.powiat.trim(),
          wojewodztwo: record.wojewodztwo.trim(),
          telefon: record.telefon ? record.telefon.trim() : null,
          email: record.email ? record.email.trim() : null,
          www: record.www ? record.www.trim() : null,
          liczba_miejsc: record.liczba_miejsc ? parseInt(record.liczba_miejsc) : null,
          profil_opieki: record.profil_opieki ? record.profil_opieki.trim() : null,
          koszt_pobytu: koszt_pobytu,
          data_aktualizacji: record.data_aktualizacji ? new Date(record.data_aktualizacji) : null,
          zrodlo: record.zrodlo ? record.zrodlo.trim() : null,
          latitude: record.geo_lat ? parseFloat(record.geo_lat) : null,
          longitude: record.geo_long ? parseFloat(record.geo_long) : null,
        }
      });
      
      successCount++;
      
      if (successCount % 10 === 0) {
        console.log(`✅ Zaimportowano ${successCount} placówek...`);
      }
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Błąd dla: ${record.nazwa}`);
      console.error(`   Szczegóły: ${error.message}\n`);
    }
  }

  console.log('\n📈 Podsumowanie importu:');
  console.log(`   ✅ Sukces: ${successCount}`);
  console.log(`   ⏭️  Pominięto: ${skippedCount}`);
  console.log(`   ❌ Błędy: ${errorCount}`);
  console.log(`   📊 Razem: ${records.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Krytyczny błąd:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });