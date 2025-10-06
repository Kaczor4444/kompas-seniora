const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importPlacowki() {
  console.log('📂 Reading placowki.csv...');
  const fileContent = fs.readFileSync('data/placowki.csv', 'utf-8');
  const lines = fileContent.trim().split('\n');
  
  const header = lines.shift(); // Remove header
  console.log(`📊 Found ${lines.length} facilities to import`);
  
  console.log('🗑️  Clearing existing facilities...');
  await prisma.placowka.deleteMany({});
  
  let imported = 0;
  let errors = 0;
  
  for (const line of lines) {
    // Parse CSV - handle quoted fields with commas
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current); // Last field
    
    if (values.length < 18) {
      console.warn(`⚠️  Skipping malformed line (${values.length} fields)`);
      errors++;
      continue;
    }
    
    const [
      id,
      nazwa,
      typ_placowki,
      prowadzacy,
      data_aktualizacji,
      zrodlo,
      wojewodztwo,
      powiat,
      gmina,
      miasto_wies,
      ulica,
      kod_pocztowy,
      geo_lat,
      geo_long,
      telefon,
      email,
      www,
      liczba_miejsc,
      profil_opieki,
      koszt_pobytu,
      opis
    ] = values;
    
    try {
      await prisma.placowka.create({
        data: {
          nazwa: nazwa.trim(),
          typ_placowki: typ_placowki.trim(),
          prowadzacy: prowadzacy ? prowadzacy.trim() : null,
          ulica: ulica ? ulica.trim() : null,
          miejscowosc: miasto_wies ? miasto_wies.trim() : gmina.trim(),
          kod_pocztowy: kod_pocztowy ? kod_pocztowy.trim() : null,
          gmina: gmina ? gmina.trim() : null,
          powiat: powiat.trim(),
          wojewodztwo: wojewodztwo.trim(),
          telefon: telefon ? telefon.trim() : null,
          email: email ? email.trim() : null,
          www: www ? www.trim() : null,
          liczba_miejsc: liczba_miejsc ? parseInt(liczba_miejsc) : null,
          profil_opieki: profil_opieki ? profil_opieki.trim() : null,
          koszt_pobytu: koszt_pobytu ? parseFloat(koszt_pobytu) : null,
          data_aktualizacji: data_aktualizacji ? new Date(data_aktualizacji) : null,
          zrodlo: zrodlo ? zrodlo.trim() : null,
          latitude: geo_lat ? parseFloat(geo_lat) : null,
          longitude: geo_long ? parseFloat(geo_long) : null,
        }
      });
      
      imported++;
      console.log(`✅ ${imported}. ${nazwa.trim().substring(0, 50)} (${powiat.trim()})`);
    } catch (error) {
      console.error(`❌ Error importing ${nazwa}:`, error.message);
      errors++;
    }
  }
  
  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported} facilities`);
  console.log(`   Errors: ${errors}`);
  
  // Show statistics
  const stats = await prisma.placowka.groupBy({
    by: ['powiat'],
    _count: true,
    orderBy: { powiat: 'asc' }
  });
  
  console.log('\n📊 Facilities per powiat:');
  stats.forEach(s => {
    console.log(`   ${s.powiat.padEnd(20)} | ${s._count} facilities`);
  });
  
  // Test search for Chrząstowice
  console.log('\n🔍 Test: Facilities in olkuski or wadowicki:');
  const test = await prisma.placowka.findMany({
    where: {
      OR: [
        { powiat: { contains: 'olkuski' } },
        { powiat: { contains: 'wadowicki' } }
      ]
    },
    select: { nazwa: true, powiat: true }
  });
  
  test.forEach(f => {
    console.log(`   ${f.nazwa} → ${f.powiat}`);
  });
}

importPlacowki()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
