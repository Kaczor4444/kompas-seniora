const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const Papa = require('papaparse');

const prisma = new PrismaClient();

async function importTerytLocations() {
  try {
    console.log('📊 Reading placowki-new.csv...');
    
    const csvContent = fs.readFileSync('placowki-new.csv', 'utf-8');
    const { data } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });

    console.log(`Found ${data.length} placówki records`);

    // Extract unique locations
    const locations = new Set();
    
    data.forEach(row => {
      const powiat = row.powiat?.trim();
      const gmina = row.gmina?.trim();
      const miejscowosc = row.miasto_wies?.trim();

      if (powiat) {
        // Add powiat
        locations.add(JSON.stringify({
          nazwa: powiat,
          typ: 'powiat',
          gmina: null,
          powiat: powiat,
          wojewodztwo: 'małopolskie'
        }));

        // Add gmina
        if (gmina) {
          locations.add(JSON.stringify({
            nazwa: gmina,
            typ: 'gmina',
            gmina: gmina,
            powiat: powiat,
            wojewodztwo: 'małopolskie'
          }));
        }

        // Add miejscowosc
        if (miejscowosc) {
          locations.add(JSON.stringify({
            nazwa: miejscowosc,
            typ: 'miejscowosc',
            gmina: gmina || null,
            powiat: powiat,
            wojewodztwo: 'małopolskie'
          }));
        }
      }
    });

    const uniqueLocations = Array.from(locations).map(loc => JSON.parse(loc));
    
    console.log(`\n📍 Found ${uniqueLocations.length} unique TERYT locations:`);
    console.log(`   - Powiaty: ${uniqueLocations.filter(l => l.typ === 'powiat').length}`);
    console.log(`   - Gminy: ${uniqueLocations.filter(l => l.typ === 'gmina').length}`);
    console.log(`   - Miejscowości: ${uniqueLocations.filter(l => l.typ === 'miejscowosc').length}`);

    // Clear existing data
    console.log('\n🗑️  Clearing existing TERYT data...');
    await prisma.terytLocation.deleteMany({});

    // Insert new data
    console.log('💾 Importing TERYT locations...');
    let imported = 0;
    
    for (const location of uniqueLocations) {
      await prisma.terytLocation.create({
        data: location
      });
      imported++;
    }

    console.log(`\n✅ Successfully imported ${imported} TERYT locations!`);

    // Show sample
    console.log('\n📋 Sample locations:');
    const samples = await prisma.terytLocation.findMany({ take: 10 });
    samples.forEach(loc => {
      console.log(`   ${loc.typ.padEnd(12)} | ${loc.nazwa.padEnd(20)} | powiat: ${loc.powiat}`);
    });

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importTerytLocations();