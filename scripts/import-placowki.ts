/**
 * Import script for kompaseniora.pl
 * Imports placówki from data/placowki.csv to Prisma database
 * 
 * Usage: npx ts-node scripts/import-placowki.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import Papa from 'papaparse';

const prisma = new PrismaClient();

interface PlacowkaRow {
  id: string;
  nazwa: string;
  typ_placowki: string;
  prowadzacy: string;
  data_aktualizacji: string;
  zrodlo: string;
  wojewodztwo: string;
  powiat: string;
  gmina: string;
  miasto_wies: string;
  ulica: string;
  kod_pocztowy: string;
  geo_lat: string;
  geo_long: string;
  telefon: string;
  email: string;
  www: string;
  liczba_miejsc: string;
  profil_opieki: string;
  koszt_pobytu: string;
  opis: string;
  godziny_otwarcia: string;
  facebook_url: string;
  instagram_url: string;
  dodatkowe_info: string;
}

async function main() {
  console.log('🚀 IMPORT PLACÓWEK DO BAZY');
  console.log('='.repeat(70));
  console.log();

  // Check if CSV exists
  const csvPath = 'data/placowki.csv';
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }

  // Read CSV
  console.log(`📂 Reading: ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const parsed = Papa.parse<PlacowkaRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  console.log(`   ✅ Loaded ${parsed.data.length} rows`);
  console.log();

  // Clear existing data
  console.log('🗑️  Clearing existing Placowka table...');
  const deleteResult = await prisma.placowka.deleteMany({});
  console.log(`   ✅ Deleted ${deleteResult.count} existing records`);
  console.log();

  // Import data
  console.log('💾 Importing placówki...');
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const row of parsed.data) {
    try {
      // Parse koszt_pobytu (Float in schema)
      let koszt: number | null = null;
      if (row.koszt_pobytu && 
          row.koszt_pobytu.trim() !== '' && 
          row.koszt_pobytu.toLowerCase() !== 'null') {
        const parsed = parseFloat(row.koszt_pobytu.trim());
        koszt = isNaN(parsed) ? null : parsed;
      }

      // Parse geo coordinates
      const latitude = row.geo_lat && row.geo_lat.trim() !== '' 
        ? parseFloat(row.geo_lat) 
        : null;
      const longitude = row.geo_long && row.geo_long.trim() !== '' 
        ? parseFloat(row.geo_long) 
        : null;

      // Parse liczba_miejsc
      const liczbaMiejsc = row.liczba_miejsc && row.liczba_miejsc.trim() !== '' 
        ? parseInt(row.liczba_miejsc) 
        : null;

      // Parse data_aktualizacji
      let dataAktualizacji: Date | null = null;
      if (row.data_aktualizacji && row.data_aktualizacji.trim() !== '') {
        try {
          dataAktualizacji = new Date(row.data_aktualizacji);
          if (isNaN(dataAktualizacji.getTime())) {
            dataAktualizacji = null;
          }
        } catch {
          dataAktualizacji = null;
        }
      }

      await prisma.placowka.create({
        data: {
          id: parseInt(row.id),
          nazwa: row.nazwa || '',
          typ_placowki: row.typ_placowki || '',
          prowadzacy: row.prowadzacy || null,
          wojewodztwo: row.wojewodztwo || '',
          powiat: row.powiat || '',
          gmina: row.gmina || null,
          miejscowosc: row.miasto_wies || '',
          ulica: row.ulica || null,
          kod_pocztowy: row.kod_pocztowy || null,
          telefon: row.telefon || null,
          email: row.email || null,
          www: row.www || null,
          liczba_miejsc: liczbaMiejsc,
          profil_opieki: row.profil_opieki || null,
          koszt_pobytu: koszt,
          latitude: latitude,
          longitude: longitude,
          data_aktualizacji: dataAktualizacji,
          zrodlo: row.zrodlo || null,
          // Note: 'opis' field doesn't exist in schema - skipped
        }
      });

      successCount++;
      
      // Progress indicator
      if (successCount % 10 === 0) {
        process.stdout.write(`   📊 Imported: ${successCount}/${parsed.data.length}\r`);
      }
    } catch (error: any) {
      errorCount++;
      errors.push(`Row ${row.id} (${row.nazwa}): ${error.message}`);
    }
  }

  console.log(`   ✅ Successfully imported: ${successCount}/${parsed.data.length}`);
  
  if (errorCount > 0) {
    console.log(`   ❌ Errors: ${errorCount}`);
    errors.forEach(err => console.log(`      ${err}`));
  }
  console.log();

  // Verify import
  console.log('🔍 VERIFICATION:');
  const totalCount = await prisma.placowka.count();
  console.log(`   Total placówek in database: ${totalCount}`);
  console.log();

  // Count by województwo
  const malopolskie = await prisma.placowka.count({
    where: { wojewodztwo: 'Małopolskie' }
  });
  const slaskie = await prisma.placowka.count({
    where: { wojewodztwo: 'Śląskie' }
  });

  console.log('📊 BY WOJEWÓDZTWO:');
  console.log(`   Małopolskie: ${malopolskie}`);
  console.log(`   Śląskie: ${slaskie}`);
  console.log();

  // Count by typ_placowki
  const dps = await prisma.placowka.count({
    where: { typ_placowki: 'DPS' }
  });
  const sds = await prisma.placowka.count({
    where: { typ_placowki: 'ŚDS' }
  });

  console.log('📊 BY TYP_PLACOWKI:');
  console.log(`   DPS: ${dps}`);
  console.log(`   ŚDS: ${sds}`);
  console.log();

  // Show sample Śląskie
  console.log('📋 SAMPLE - Śląskie (first 2):');
  const slaskieSample = await prisma.placowka.findMany({
    where: { wojewodztwo: 'Śląskie' },
    take: 2,
    select: {
      id: true,
      nazwa: true,
      powiat: true,
      koszt_pobytu: true
    }
  });

  slaskieSample.forEach(p => {
    console.log(`   ${p.id}. ${p.nazwa} (${p.powiat}) - ${p.koszt_pobytu || 'NULL'}`);
  });
  console.log();

  console.log('='.repeat(70));
  console.log('✅ IMPORT COMPLETE!');
  console.log();
  console.log('🎯 Next steps:');
  console.log('   1. Start dev server: npm run dev');
  console.log('   2. Test search: http://localhost:3000');
  console.log('   3. Test Śląskie autocomplete');
  console.log('='.repeat(70));
}

main()
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });