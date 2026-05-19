#!/usr/bin/env node
// Import TERYT dla województwa Śląskiego (WOJ=24)
// Wzorowany na import-teryt-filtered.js (Małopolska WOJ=12)
// Użycie: node scripts/import-teryt-slaskie.js

require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Powiaty ziemskie Śląskiego (WOJ=24, POW=01-17)
const POWIATY_ZIEMSKIE = {
  '01': 'będziński',
  '02': 'bielski',
  '03': 'cieszyński',
  '04': 'częstochowski',
  '05': 'gliwicki',
  '06': 'kłobucki',
  '07': 'lubliniecki',
  '08': 'mikołowski',
  '09': 'myszkowski',
  '10': 'pszczyński',
  '11': 'raciborski',
  '12': 'rybnicki',
  '13': 'tarnogórski',
  '14': 'bieruńsko-lędziński',
  '15': 'wodzisławski',
  '16': 'zawierciański',
  '17': 'żywiecki',
};

// Miasta na prawach powiatu (WOJ=24, POW=61-79)
const POWIATY_GRODZKIE = {
  '61': 'm. Bielsko-Biała',
  '62': 'm. Bytom',
  '63': 'm. Chorzów',
  '64': 'm. Częstochowa',
  '65': 'm. Dąbrowa Górnicza',
  '66': 'm. Gliwice',
  '67': 'm. Jastrzębie-Zdrój',
  '68': 'm. Jaworzno',
  '69': 'm. Katowice',
  '70': 'm. Mysłowice',
  '71': 'm. Piekary Śląskie',
  '72': 'm. Ruda Śląska',
  '73': 'm. Rybnik',
  '74': 'm. Siemianowice Śląskie',
  '75': 'm. Sosnowiec',
  '76': 'm. Świętochłowice',
  '77': 'm. Tychy',
  '78': 'm. Zabrze',
  '79': 'm. Żory',
};

const POWIATY_MAP = { ...POWIATY_ZIEMSKIE, ...POWIATY_GRODZKIE };

function normalizePolish(str) {
  return str
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'l')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

async function importTerytSlaskie() {
  const csvPath = 'data/SIMC_Adresowy_20250922.csv';
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Brak pliku: ${csvPath}`);
    console.error('Pobierz z: https://eteryt.stat.gov.pl/ → SIMC → CSV');
    process.exit(1);
  }

  console.log('📂 Czytam SIMC_Adresowy_20250922.csv...');
  const content = fs.readFileSync(csvPath, 'utf-8-bom' in Buffer ? { encoding: 'utf-8' } : 'utf-8')
    .replace(/^﻿/, ''); // usuń BOM
  const lines = content.trim().split('\n');
  lines.shift(); // nagłówek
  console.log(`📊 Linii w CSV: ${lines.length}`);

  console.log('🗑️  Usuwam istniejące rekordy śląskie z TerytLocation...');
  const deleted = await prisma.terytLocation.deleteMany({
    where: { wojewodztwo: 'śląskie' }
  });
  console.log(`   Usunięto: ${deleted.count}`);

  let imported = 0;
  let skipped = 0;
  const batch = [];
  const BATCH_SIZE = 500;

  for (const line of lines) {
    const parts = line.split(';');
    if (parts.length < 9) continue;

    const [woj, pow, gmi, rodz_gmi, rm, mz, nazwa] = parts;
    const sym = parts[7];
    const sympod = parts[8];

    // Tylko Śląskie (WOJ=24)
    if (woj !== '24') { skipped++; continue; }

    const powiatNazwa = POWIATY_MAP[pow];
    if (!powiatNazwa) { skipped++; continue; }

    batch.push({
      nazwa: nazwa.trim(),
      nazwa_normalized: normalizePolish(nazwa.trim()),
      typ: 'miejscowość',
      gmina: null,
      powiat: powiatNazwa,
      wojewodztwo: 'śląskie',
      rodzaj_miejscowosci: rm?.trim() || null,
      teryt_sym: sym?.trim() || null,
      teryt_sympod: sympod?.trim() || null,
    });

    if (batch.length >= BATCH_SIZE) {
      await prisma.terytLocation.createMany({ data: batch, skipDuplicates: true });
      imported += batch.length;
      batch.length = 0;
      process.stdout.write(`\r   Zaimportowano: ${imported}...`);
    }
  }

  if (batch.length > 0) {
    await prisma.terytLocation.createMany({ data: batch, skipDuplicates: true });
    imported += batch.length;
  }

  console.log(`\n✅ Zaimportowano ${imported} lokalizacji śląskich`);
  console.log(`   Pominięto (inne województwa): ${skipped}`);

  // Weryfikacja
  const total = await prisma.terytLocation.count({ where: { wojewodztwo: 'śląskie' } });
  const malopolska = await prisma.terytLocation.count({ where: { wojewodztwo: 'małopolskie' } });
  console.log(`\n📊 Stan TerytLocation:`);
  console.log(`   Śląskie: ${total}`);
  console.log(`   Małopolskie: ${malopolska} (niezmienione)`);
}

importTerytSlaskie()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
