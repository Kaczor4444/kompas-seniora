// scripts/verify-dps-against-pdf.js
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PDF_PATH = '/Users/iwona/Documents/Projekty/kompas-seniora/raw_dane/malopolskie/wykaz dps malopolska 18.02.26.pdf';

/**
 * Parsuj PDF i wyciągnij dane DPS
 */
async function parseDpsPdf() {
  console.log('📄 Czytam PDF: wykaz dps malopolska 18.02.26.pdf\n');

  const dataBuffer = fs.readFileSync(PDF_PATH);
  const data = await pdfParse(dataBuffer);

  console.log('📊 Statystyki PDF:');
  console.log(`  Stron: ${data.numpages}`);
  console.log(`  Znaków: ${data.text.length}\n`);

  // Parsuj tekstową tabelę
  const lines = data.text.split('\n').filter(line => line.trim());

  console.log('📋 Pierwsze 20 linii:');
  lines.slice(0, 20).forEach((line, i) => {
    console.log(`  ${i + 1}. ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
  });

  // Znajdź wzorzec dla placówek DPS
  const dpsList = [];
  let currentLp = null;
  let currentNazwa = null;
  let currentAdres = null;
  let currentMiejsca = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Wzorzec: numer. powiat
    const lpMatch = line.match(/^(\d+)\.\s+(\w+)/);
    if (lpMatch) {
      // Zapisz poprzedni wpis jeśli istnieje
      if (currentLp && currentNazwa) {
        dpsList.push({
          lp: currentLp,
          nazwa: currentNazwa,
          adres: currentAdres,
          miejsca: currentMiejsca
        });
      }

      currentLp = parseInt(lpMatch[1], 10);
      currentNazwa = null;
      currentAdres = null;
      currentMiejsca = null;
    }

    // Wzorzec: Dom Pomocy Społecznej...
    if (line.includes('Dom Pomocy Społecznej') || line.includes('Powiatowy Dom') || line.includes('Caritas')) {
      if (!currentNazwa) {
        currentNazwa = line;
      } else {
        currentNazwa += ' ' + line;
      }
    }

    // Wzorzec: ulica/miejscowość
    if (line.match(/ul\.|^\d{2}-\d{3}/)) {
      currentAdres = line;
    }

    // Wzorzec: liczba miejsc
    const miejscaMatch = line.match(/(\d+)\s+miejsc/);
    if (miejscaMatch) {
      currentMiejsca = parseInt(miejscaMatch[1], 10);
    }
  }

  // Zapisz ostatni wpis
  if (currentLp && currentNazwa) {
    dpsList.push({
      lp: currentLp,
      nazwa: currentNazwa,
      adres: currentAdres,
      miejsca: currentMiejsca
    });
  }

  console.log(`\n✅ Znaleziono ${dpsList.length} placówek DPS\n`);

  console.log('📋 Pierwsze 5 placówek:');
  dpsList.slice(0, 5).forEach(dps => {
    console.log(`\n  ${dps.lp}. ${dps.nazwa}`);
    console.log(`     Adres: ${dps.adres || 'brak'}`);
    console.log(`     Miejsca: ${dps.miejsca || 'brak'}`);
  });

  return dpsList;
}

/**
 * Porównaj dane z PDF z bazą danych
 */
async function compareDpsWithDatabase(dpsList) {
  console.log('\n🔍 Porównuję z bazą danych...\n');

  const dbDps = await prisma.placowka.findMany({
    where: {
      wojewodztwo: 'małopolskie',
      typ_placowki: 'DPS'
    },
    select: {
      id: true,
      nazwa: true,
      ulica: true,
      miejscowosc: true,
      liczba_miejsc: true,
      koszt_pobytu: true,
      oficjalne_id: true,
      nazwa_oficjalna: true
    },
    orderBy: { id: 'asc' }
  });

  console.log(`📊 DPS w PDF: ${dpsList.length}`);
  console.log(`📊 DPS w bazie: ${dbDps.length}`);

  // Statystyki
  const stats = {
    withOfficialId: dbDps.filter(d => d.oficjalne_id !== null).length,
    withOfficialName: dbDps.filter(d => d.nazwa_oficjalna !== null).length,
    total: dbDps.length
  };

  console.log(`\n📈 Statystyki wypełnienia:`);
  console.log(`  Z oficjalnym ID: ${stats.withOfficialId} / ${stats.total}`);
  console.log(`  Z oficjalną nazwą: ${stats.withOfficialName} / ${stats.total}`);

  return { dpsList, dbDps };
}

/**
 * Main
 */
async function main() {
  try {
    const dpsList = await parseDpsPdf();
    await compareDpsWithDatabase(dpsList);
  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
