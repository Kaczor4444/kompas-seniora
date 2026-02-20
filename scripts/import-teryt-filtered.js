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
  '12': 'olkuski',
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

// Kody RM (rodzaj miejscowości)
const RM_CODES = {
  '01': 'wieś',
  '96': 'miasto na prawach powiatu',
  '98': 'miasto',
  '00': 'część miejscowości',
  '02': 'kolonia',
  '03': 'kolonia',
  '04': 'przysiółek',
  '05': 'osada',
  '07': 'osada leśna',
};

// ✅ UPROSZCZONA FUNKCJA - Normalizacja polskich znaków
function normalizePolish(str) {
  return str
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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
  let skippedByRM = 0;

  for (const line of lines) {
    const parts = line.split(';');
    const [woj, pow, gmi, rodz_gmi, rm, mz, nazwa, sym, sympod] = parts;

    // Filtruj tylko województwo Małopolskie (WOJ=12)
    if (woj !== '12') {
      skipped++;
      continue;
    }

    // ✅ NOWE: Filtruj tylko główne miejscowości (RM = 01, 96, 98)
    if (!['01', '96', '98'].includes(rm)) {
      skippedByRM++;
      continue;
    }

    const powiatNazwa = POWIATY_MAP[pow];

    // Pomiń jeśli kod powiatu nieznany
    if (!powiatNazwa) {
      console.warn(`⚠️  Unknown POW code: ${pow} for location: ${nazwa}`);
      skipped++;
      continue;
    }

    try {
      await prisma.terytLocation.create({
        data: {
          nazwa: nazwa.trim(),
          nazwa_normalized: normalizePolish(nazwa.trim()),
          typ: 'miejscowość',
          gmina: null, // Można dodać mapowanie GMI jeśli potrzebne
          powiat: powiatNazwa,
          wojewodztwo: 'małopolskie',
          rodzaj_miejscowosci: rm,
          teryt_sym: sym,
          teryt_sympod: sympod
        }
      });

      imported++;

      if (imported % 500 === 0) {
        console.log(`✅ Imported ${imported} locations...`);
      }
    } catch (error) {
      console.error(`❌ Error importing ${nazwa}: ${error.message}`);
      skipped++;
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped (other provinces): ${skipped}`);
  console.log(`   Skipped (RM filter - części/kolonie): ${skippedByRM}`);

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

  // Statystyki po rodzaju miejscowości
  console.log('\n📊 Locations by rodzaj_miejscowosci:');
  const rmStats = await prisma.terytLocation.groupBy({
    by: ['rodzaj_miejscowosci'],
    _count: true,
    orderBy: {
      rodzaj_miejscowosci: 'asc'
    }
  });

  rmStats.forEach(stat => {
    const rmLabel = RM_CODES[stat.rodzaj_miejscowosci] || 'unknown';
    console.log(`   RM=${stat.rodzaj_miejscowosci} (${rmLabel.padEnd(30)}) | ${stat._count} locations`);
  });

  // Weryfikacja: Zarzecze
  console.log('\n📋 Verification - "Zarzecze" locations:');
  const zarzeczeSamples = await prisma.terytLocation.findMany({
    where: { nazwa_normalized: normalizePolish('Zarzecze') },
    select: { nazwa: true, powiat: true, rodzaj_miejscowosci: true },
    orderBy: { powiat: 'asc' }
  });

  if (zarzeczeSamples.length > 0) {
    zarzeczeSamples.forEach(loc => {
      const rmLabel = RM_CODES[loc.rodzaj_miejscowosci] || 'unknown';
      console.log(`   ${loc.nazwa.padEnd(20)} | ${loc.powiat.padEnd(20)} | RM=${loc.rodzaj_miejscowosci} (${rmLabel})`);
    });
    console.log(`   Total: ${zarzeczeSamples.length} locations`);
  } else {
    console.log('   No Zarzecze found in import');
  }
}

importTeryt()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
