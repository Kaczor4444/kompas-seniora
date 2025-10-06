const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// ✅ POPRAWIONE MAPOWANIE - wszystkie 22 powiaty Małopolski
const POWIATY_MAP = {
  '01': 'bocheński',
  '02': 'brzeski',
  '03': 'chrzanowski',
  '04': 'dąbrowski',
  '05': 'gorlicki',
  '06': 'krakowski',        // powiat ziemski (Krzeszowice, Skawina, Słomniki)
  '07': 'limanowski',
  '08': 'miechowski',
  '09': 'myślenicki',
  '10': 'nowosądecki',      // powiat ziemski (Grybów, Krynica, Muszyna)
  '11': 'nowotarski',
  '12': 'olkuski',          // ❌ BYŁO BŁĘDNIE: 'oświęcimski'
  '13': 'oświęcimski',
  '14': 'proszowicki',
  '15': 'suski',
  '16': 'tarnowski',        // powiat ziemski (Ciężkowice, Radłów)
  '17': 'tatrzański',
  '18': 'wadowicki',
  '19': 'wielicki',
  '61': 'm. Kraków',        // powiat grodzki - Miasto Kraków
  '62': 'm. Nowy Sącz',     // powiat grodzki
  '63': 'm. Tarnów',        // powiat grodzki
};

// ✅ UPROSZCZONA FUNKCJA - Normalizacja polskich znaków (uniwersalna dla całej Polski)
function normalizePolish(str) {
  return str
    .toLowerCase()
    .replace(/ł/g, 'l')                  // ł nie zawsze się rozkłada przez NFD
    .replace(/Ł/g, 'l')                  // Ł nie zawsze się rozkłada przez NFD
    .normalize('NFD')                    // Rozłóż wszystkie inne znaki (ą→a+ogonek)
    .replace(/[\u0300-\u036f]/g, '');   // Usuń WSZYSTKIE combining marks (ogonki, kreski, kropki)
}

async function importTeryt() {
  console.log('📂 Reading SIMC_Adresowy_20250922.csv...');
  const fileContent = fs.readFileSync('data/SIMC_Adresowy_20250922.csv', 'utf-8');
  const lines = fileContent.trim().split('\n');
  
  lines.shift(); // Usuń nagłówek
  console.log(`📊 Total lines in CSV: ${lines.length}`);
  
  console.log('🗑️  Clearing existing TERYT data...');
  await prisma.terytLocation.deleteMany({});
  
  let imported = 0;
  let skipped = 0;
  
  for (const line of lines) {
    const parts = line.split(';');
    const [woj, pow, gmi, rodz_gmi, rm, mz, nazwa] = parts;
    
    // Filtruj tylko województwo Małopolskie (WOJ=12)
    if (woj !== '12') {
      skipped++;
      continue;
    }
    
    const powiatNazwa = POWIATY_MAP[pow];
    
    // Pomiń jeśli kod powiatu nieznany (nie powinno się zdarzyć)
    if (!powiatNazwa) {
      console.warn(`⚠️  Unknown POW code: ${pow} for location: ${nazwa}`);
      skipped++;
      continue;
    }
    
    try {
      await prisma.terytLocation.create({
        data: {
          nazwa: nazwa.trim(),
          nazwa_normalized: normalizePolish(nazwa.trim()), // ✅ NOWE: znormalizowana nazwa
          typ: 'miejscowość',
          gmina: null, // Możesz dodać mapowanie GMI jeśli potrzebne
          powiat: powiatNazwa,
          wojewodztwo: 'małopolskie'
        }
      });
      
      imported++;
      
      if (imported % 1000 === 0) {
        console.log(`✅ Imported ${imported} locations...`);
      }
    } catch (error) {
      // Duplikat lub inny błąd - pomijamy
      skipped++;
    }
  }
  
  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  
  // Statystyki po powiatach
  console.log('\n📊 Locations per powiat:');
  const stats = await prisma.terytLocation.groupBy({
    by: ['powiat'],
    _count: true,
    orderBy: {
      powiat: 'asc'
    }
  });
  
  stats.forEach(stat => {
    console.log(`   ${stat.powiat.padEnd(20)} | ${stat._count} locations`);
  });
  
  // Weryfikacja normalizacji
  console.log('\n📋 Sample normalized locations (Chrząstowice):');
  const chrząstowiceSamples = await prisma.terytLocation.findMany({ 
    where: { nazwa: { contains: 'Chrząstowice' } },
    select: { nazwa: true, nazwa_normalized: true, powiat: true }
  });
  
  if (chrząstowiceSamples.length > 0) {
    chrząstowiceSamples.forEach(loc => {
      console.log(`   ${loc.nazwa.padEnd(25)} → ${loc.nazwa_normalized.padEnd(25)} | ${loc.powiat}`);
    });
  } else {
    console.log('   No Chrząstowice found in import');
  }
}

importTeryt()
  .catch(console.error)
  .finally(() => prisma.$disconnect());