const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Mapowanie kodów powiatów Małopolski na nazwy
const POWIATY_MAP = {
  '01': 'bocheński',
  '02': 'brzeski', 
  '03': 'chrzanowski',
  '04': 'dąbrowski',
  '05': 'gorlicki',
  '06': 'limanowski',
  '07': 'miechowski',
  '08': 'myślenicki',
  '09': 'nowosądecki',
  '10': 'nowotarski',
  '11': 'olkuski',
  '12': 'oświęcimski',
  '13': 'proszowicki',
  '14': 'suski',
  '15': 'tarnowski',
  '16': 'tatrzański',
  '17': 'wadowicki',
  '18': 'wielicki',
  '61': 'krakowski',
  '62': 'krakowski',
  '63': 'nowosądecki',
  '64': 'tarnowski',
};

async function importTeryt() {
  console.log('📂 Reading teryt-malopolska.csv...');
  const fileContent = fs.readFileSync('data/teryt-malopolska.csv', 'utf-8');
  const lines = fileContent.trim().split('\n');
  
  lines.shift(); // Usuń nagłówek
  console.log(`📊 Found ${lines.length} locations to import`);

  console.log('🗑️  Clearing existing TERYT data...');
  await prisma.terytLocation.deleteMany({});

  let imported = 0;
  let skipped = 0;

  for (const line of lines) {
    const parts = line.split(';');
    const [woj, pow, gmi, rodz_gmi, rm, mz, nazwa] = parts;
    
    const powiatNazwa = POWIATY_MAP[pow];
    
    if (!powiatNazwa) {
      skipped++;
      continue;
    }

    try {
      await prisma.terytLocation.create({
        data: {
          nazwa: nazwa.trim(),
          typ: 'miejscowość',
          gmina: null,
          powiat: powiatNazwa,
          wojewodztwo: 'małopolskie'
        }
      });
      
      imported++;
      if (imported % 1000 === 0) {
        console.log(`✅ Imported ${imported} locations...`);
      }
    } catch (error) {
      skipped++;
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  
  // Pokaż przykłady
  const samples = await prisma.terytLocation.findMany({ take: 10 });
  console.log('\n📋 Sample locations:');
  samples.forEach(loc => {
    console.log(`   ${loc.nazwa.padEnd(25)} | powiat: ${loc.powiat}`);
  });
}

importTeryt()
  .catch(console.error)
  .finally(() => prisma.$disconnect());